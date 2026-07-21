// src/actions/rsvp.actions.ts
'use server';

import { createAdminClient } from '@nkba/supabase/client';
import { revalidatePath } from 'next/cache';

// 1. Hàm kiểm tra Token và lấy dữ liệu Sự kiện + Khách mời
export async function verifyRsvpToken(token: string) {
  try {
    // Dùng Admin Client để bỏ qua kiểm tra đăng nhập (RLS)
    const supabaseAdmin = createAdminClient();

    // 1.1 Tìm khách mời dựa trên tracking_token
    const { data: guest, error: guestError } = await supabaseAdmin
      .from('event_guests')
      .select('*')
      .eq('tracking_token', token)
      .single();

    if (guestError || !guest) {
      console.error('❌ Lỗi tra cứu Token Khách mời:', guestError);
      return { 
        success: false, 
        message: 'Mã xác nhận không tồn tại hoặc đã bị hủy. Vui lòng liên hệ BTC.' 
      };
    }

    // 1.2 Lấy thông tin sự kiện tương ứng
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', guest.event_id)
      .single();

    if (eventError || !event) {
      console.error('❌ Lỗi tra cứu Sự kiện:', eventError);
      return { 
        success: false, 
        message: 'Sự kiện không tồn tại hoặc đã kết thúc.' 
      };
    }

    // Trả về dữ liệu thành công
    return { success: true, guest, event };

  } catch (error: any) {
    console.error('❌ Lỗi hệ thống verifyRsvpToken:', error);
    return { success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau.' };
  }
}

// 2. Hàm cập nhật trạng thái tham dự
export async function updateRsvpStatus(token: string, status: 'CONFIRMED' | 'DECLINED' | 'PENDING') {
  try {
    const supabaseAdmin = createAdminClient();

    const { error } = await supabaseAdmin
      .from('event_guests')
      .update({ 
        rsvp_status: status,
        check_in_time: status === 'CONFIRMED' ? new Date().toISOString() : null // (Tùy chọn ghi log thời gian)
      })
      .eq('tracking_token', token);

    if (error) {
      console.error('❌ Lỗi cập nhật trạng thái RSVP:', error);
      throw new Error('Không thể cập nhật trạng thái.');
    }

    // Xóa cache để cập nhật số liệu trên Admin Dashboard
    revalidatePath('/events');
    revalidatePath('/su-kien/rsvp');

    return { success: true };
  } catch (error: any) {
    console.error('❌ Lỗi updateRsvpStatus:', error);
    return { success: false, message: 'Không thể cập nhật trạng thái lúc này. Vui lòng thử lại.' };
  }
}