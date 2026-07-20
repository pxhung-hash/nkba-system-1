// src/actions/rsvp.actions.ts
'use server';

import { createAdminClient } from '@nkba/supabase/client';

// 1. Hàm kiểm tra mã Token và lấy thông tin thiệp mời
export async function verifyRsvpToken(token: string) {
  try {
    console.log(">>> ĐANG KIỂM TRA TOKEN:", token); // Log ra để xem API có nhận được token không
    
    const supabase = createAdminClient();
    
    // Tìm khách mời theo token, đồng thời join (kết nối) lấy luôn thông tin sự kiện
    const { data: guest, error } = await supabase
      .from('event_guests')
      .select(`*, event:events (*)`)
      .eq('tracking_token', token)
      .maybeSingle();

    if (error) {
      console.error(">>> LỖI TỪ SUPABASE:", error); // Chỗ này sẽ chỉ ra lỗi SQL nếu có
      return { success: false, message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn.' };
    }

    if (!guest) {
      return { success: false, message: 'Không tìm thấy dữ liệu khách mời.' };
    }

    return { success: true, guest, event: guest.event };
  } catch (error) {
    console.error('>>> LỖI SẬP SERVER (TRY-CATCH):', error); // Chỗ này sẽ chỉ ra lỗi thiếu biến môi trường
    return { success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau.' };
  }
}

// 2. Hàm cập nhật trạng thái phản hồi
export async function updateRsvpStatus(token: string, status: 'CONFIRMED' | 'DECLINED') {
  try {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('event_guests')
      .update({ rsvp_status: status })
      .eq('tracking_token', token);

    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Lỗi cập nhật RSVP:', error);
    return { success: false, message: 'Không thể cập nhật trạng thái lúc này.' };
  }
}