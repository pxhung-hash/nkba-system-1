// src/actions/email.actions.ts
'use server';

import { createAdminClient } from '@nkba/supabase/client';
import { Resend } from 'resend';

// Khởi tạo Resend với API Key từ file .env
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendRsvpEmailsAction(eventId: string) {
  try {
    // 1. Kiểm tra API Key
    if (!process.env.RESEND_API_KEY) {
      return { success: false, message: 'Thiếu RESEND_API_KEY trong file .env.local!' };
    }

    const supabase = createAdminClient();

    // 1. Lấy thông tin Sự kiện
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      return { success: false, message: `Lỗi Supabase: ${eventError?.message || 'Không tìm thấy sự kiện'}` };
    }

    // 2. Lọc ra danh sách khách mời đang PENDING và có địa chỉ Email
    const { data: guests, error: guestError } = await supabase
      .from('event_guests')
      .select('*')
      .eq('event_id', eventId)
      .eq('rsvp_status', 'PENDING');

    if (guestError) {
      return { success: false, message: `Lỗi truy vấn khách mời: ${guestError.message}` };
    }

    if (!guests || guests.length === 0) {
      return { success: false, message: 'Không có khách mời nào ở trạng thái Chờ phản hồi để gửi.' };
    }

    let successCount = 0;

    // 3. Vòng lặp gửi Email cho từng khách
    for (const guest of guests) {
      // Bóc tách đối tượng JSONB guest_info
      const guestInfo = (guest.guest_info || {}) as { name?: string; email?: string; company?: string };
      const guestEmail = guestInfo.email;
      const guestName = guestInfo.name || 'Quý khách';
      const salutation = guest.salutation || 'Anh/Chị';

      // Bỏ qua nếu không có email trong JSONB
      if (!guestEmail) {
        failCount++;
        continue;
      }

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
          <div style="padding: 32px 24px; color: #334155;">
            <p style="font-size: 16px; margin-top: 0;">Kính chào ${salutation} <strong style="color: #002D62;">${guestName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">Ban tổ chức <strong>Liên minh Xây dựng Việt Nhật (NKBA)</strong> trân trọng kính mời ${salutation} tham dự sự kiện đặc biệt của chúng tôi.</p>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">Vui lòng bấm vào nút bên dưới để xác nhận sự hiện diện và nhận Vé mời điện tử Check-in QR:</p>
            
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

      // Bọc riêng lệnh gửi mail để bắt lỗi từ Resend
      const { error: sendError } = await resend.emails.send({
        from: 'Liên minh NKBA <px.hung@nkba.vn>',
        to: guestEmail,
        subject: `[NKBA] Kính mời tham dự - ${eventData.title}`,
        html: htmlContent,
      });

      if (sendError) {
        console.error(`Lỗi gửi mail cho ${guestEmail}:`, sendError);
        failCount++;
      } else {
        successCount++;
      }
    }

    return { 
      success: true, 
      message: `Đã gửi thành công ${successCount} thư mời VIP! ${failCount > 0 ? `(Thất bại/Thiếu email: ${failCount})` : ''}` 
    };

  } catch (error: any) {
    console.error('Lỗi hệ thống:', error);
    return { success: false, message: `Lỗi Exception: ${error?.message || 'Lỗi không xác định'}` };
  }
}