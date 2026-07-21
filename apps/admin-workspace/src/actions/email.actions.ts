// src/actions/email.actions.ts
'use server';

import { createAdminClient } from '@nkba/supabase/client';
import { Resend } from 'resend';

// Khởi tạo Resend với API Key từ file .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRsvpEmailsAction(eventId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Lấy thông tin Sự kiện
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) throw new Error('Không tìm thấy thông tin sự kiện.');

    // 2. Lọc ra danh sách khách mời đang PENDING và có địa chỉ Email
    const { data: guests, error: guestError } = await supabase
      .from('event_guests')
      .select(`*, guest_info(*)`)
      .eq('event_id', eventId)
      .eq('rsvp_status', 'PENDING');

    if (guestError) throw guestError;
    if (!guests || guests.length === 0) {
      return { success: false, message: 'Không có khách mời nào ở trạng thái Chờ phản hồi để gửi.' };
    }

    let successCount = 0;

    // 3. Vòng lặp gửi Email cho từng khách
    for (const guest of guests) {
      if (!guest.guest_info?.email) continue; // Bỏ qua nếu khách không có email

      const token = guest.tracking_token || guest.id;
      // Đường dẫn trỏ tới trang RSVP public
      const rsvpLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://nkba.vn'}/su-kien/rsvp?token=${token}`;
      const salutation = guest.salutation || 'Anh/Chị';

      // 4. Thiết kế nội dung thư (HTML Template)
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #002D62; padding: 30px; text-align: center;">
            <h2 style="color: #D4AF37; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">THƯ MỜI VIP</h2>
            <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px;">${eventData.title}</h1>
          </div>
          <div style="padding: 40px 30px; background-color: #ffffff; color: #334155;">
            <p style="font-size: 16px;">Kính chào ${salutation} <strong style="color: #0f172a;">${guest.guest_info.name}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6;">Ban tổ chức Liên minh Xây dựng Việt Nhật (NKBA) trân trọng kính mời ${salutation} tham dự sự kiện đặc biệt của chúng tôi.</p>
            <p style="font-size: 15px; line-height: 1.6;">Vui lòng xác nhận sự hiện diện của ${salutation} để chúng tôi có thể chuẩn bị công tác đón tiếp chu đáo nhất.</p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${rsvpLink}" style="background-color: #D4AF37; color: #ffffff; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                MỞ THIỆP & XÁC NHẬN THAM DỰ
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
            <p style="font-size: 13px; color: #94a3b8; text-align: center;">Thư này được gửi tự động từ hệ thống quản trị sự kiện NKBA.</p>
          </div>
        </div>
      `;

      // 5. Lệnh gửi thư qua Resend
      await resend.emails.send({
        from: 'NKBA Events <px.hung@nkba.vn>',
        to: guest.guest_info.email,
        subject: `[NKBA] Kính mời tham dự - ${eventData.title}`,
        html: htmlContent,
      });

      successCount++;
    }

    return { success: true, message: `Đã gửi thành công thư mời đến ${successCount} khách.` };

  } catch (error: any) {
    console.error('Lỗi gửi email hàng loạt:', error);
    return { success: false, message: 'Đã có lỗi máy chủ khi gửi thư.' };
  }
}