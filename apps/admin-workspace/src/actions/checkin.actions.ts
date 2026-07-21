// src/actions/checkin.actions.ts
'use server';

import { createAdminClient } from '@nkba/supabase/client';
import { revalidatePath } from 'next/cache';

export async function processCheckinAction(token: string) {
  try {
    const supabase = createAdminClient();

    // 1. Tìm khách bằng token
    const { data: guest, error: guestError } = await supabase
      .from('event_guests')
      .select('*, events(title)')
      .eq('tracking_token', token)
      .single();

    if (guestError || !guest) {
      return { success: false, code: 'NOT_FOUND', message: 'Mã QR không hợp lệ hoặc không tồn tại.' };
    }

    // 2. Kiểm tra xem khách đã Check-in chưa
    if (guest.check_in_time) {
      return { 
        success: true, 
        code: 'ALREADY_CHECKED_IN', 
        guest: guest,
        message: 'Khách đã check-in trước đó.' 
      };
    }

    // 3. Tiến hành Check-in (Ghi nhận thời gian hiện tại)
    const { error: updateError } = await supabase
      .from('event_guests')
      .update({ check_in_time: new Date().toISOString() })
      .eq('id', guest.id);

    if (updateError) throw updateError;

    revalidatePath(`/events/${guest.event_id}`); // Xóa cache để dashboard Admin cập nhật

    return { 
      success: true, 
      code: 'SUCCESS', 
      guest: guest,
      message: 'Check-in thành công!' 
    };

  } catch (error: any) {
    console.error('Lỗi Check-in:', error);
    return { success: false, code: 'ERROR', message: 'Lỗi hệ thống.' };
  }
}