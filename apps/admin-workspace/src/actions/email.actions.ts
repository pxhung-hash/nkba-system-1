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
    let failCount = 0;

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

      // 4. Thiết kế nội dung thư (HTML Template)
      const htmlContent = `
        <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            
            <!-- Header -->
            <div style="background-color: #002D62; padding: 40px 30px; text-align: center; border-bottom: 5px solid #D4AF37;">
              <p style="color: #D4AF37; margin: 0 0 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 3px;">
                Thư Mời VIP • Liên Minh NKBA
              </p>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; line-height: 1.4;">
                ${eventData.title}
              </h1>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px 30px; color: #334155;">
              <p style="font-size: 16px; margin-top: 0;">Kính chào ${salutation} <strong style="color: #002D62;">${guestName}</strong>,</p>
              
              <p style="font-size: 15px; color: #475569; margin-bottom: 24px;">
                Ban tổ chức <strong>Liên minh Xây dựng Việt Nhật (NKBA)</strong> trân trọng kính mời ${salutation} tham dự sự kiện đặc biệt của chúng tôi.
              </p>
              
              <!-- Box thông tin sự kiện -->
              <div style="background-color: #f8fafc; border-left: 4px solid #002D62; padding: 20px; margin: 30px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px;">
                  <strong style="color: #0f172a;">⏰ Thời gian:</strong> 
                  <span style="color: #475569;">${eventData.event_date ? new Date(eventData.event_date).toLocaleString('vi-VN') : 'Sắp diễn ra'}</span>
                </p>
                <p style="margin: 0; font-size: 14px;">
                  <strong style="color: #0f172a;">📍 Địa điểm:</strong> 
                  <span style="color: #475569;">${eventData.details?.location || 'Sẽ thông báo sau'}</span>
                </p>
              </div>

              <p style="font-size: 15px; color: #475569; text-align: center; margin-bottom: 30px;">
                Vui lòng xác nhận sự hiện diện để nhận <strong>Vé mời điện tử (Mã QR Check-in)</strong>:
              </p>
              
              <!-- Nút bấm Call-to-Action -->
              <div style="text-align: center; margin: 10px 0 30px 0;">
                <a href="${rsvpLink}" style="background-color: #D4AF37; color: #002D62; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                  Mở Thiệp & Xác Nhận
                </a>
              </div>
              
              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;" />
              <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0; line-height: 1.5;">
                Email này được gửi tự động từ Hệ thống Quản trị Sự kiện NKBA.<br/>
                Vui lòng không trả lời email này.
              </p>
            </div>
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