// src/actions/notify.actions.ts
'use server';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReviewNotificationAction({
  reviewerEmail,
  reviewerName,
  taskTitle,
  assigneeName,
  taskUrl
}: {
  reviewerEmail: string;
  reviewerName: string;
  taskTitle: string;
  assigneeName: string;
  taskUrl: string;
}) {
  try {
    if (!process.env.RESEND_API_KEY) throw new Error('Thiếu RESEND_API_KEY');
    if (!reviewerEmail) throw new Error('Người duyệt chưa có email trên hệ thống');

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #002D62; padding: 24px; text-align: center;">
          <h2 style="color: #D4AF37; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">YÊU CẦU PHÊ DUYỆT</h2>
        </div>
        <div style="padding: 32px 24px; color: #334155; background-color: #ffffff;">
          <p style="font-size: 16px;">Kính gửi <strong style="color: #0f172a;">${reviewerName}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6;">Nhân sự <strong>${assigneeName}</strong> vừa gửi một hạng mục công việc cần bạn xem xét và phê duyệt.</p>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #D4AF37; padding: 16px; margin: 24px 0;">
            <p style="margin: 0; font-size: 15px; font-weight: bold; color: #0f172a;">${taskTitle}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${taskUrl}" style="background-color: #D4AF37; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              XEM & DUYỆT NGAY
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">Hệ thống Quản trị Thực thi NKBA.</p>
        </div>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: 'NKBA System <px.hung@nkba.vn>', // Đảm bảo email này đã verified
      to: reviewerEmail,
      subject: `[NKBA] Yêu cầu duyệt: ${taskTitle}`,
      html: htmlContent,
    });

    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Đã gửi email thông báo!' };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}