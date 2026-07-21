// src/app/su-kien/rsvp/page.tsx
'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyRsvpToken, updateRsvpStatus } from '@/actions/rsvp.actions';
import Link from 'next/link';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import html2canvas from 'html2canvas';

function RsvpContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [guest, setGuest] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg('Không tìm thấy mã xác nhận (Token) trên đường dẫn.');
      setLoading(false);
      return;
    }

    verifyRsvpToken(token).then((res) => {
      if (res.success) {
        setGuest(res.guest);
        setEvent(res.event);
      } else {
        setErrorMsg(res.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
      setLoading(false);
    });
  }, [token]);

  const handleAction = async (status: 'CONFIRMED' | 'DECLINED') => {
    if (!token) return;
    setIsUpdating(true);
    
    const res = await updateRsvpStatus(token, status);
    if (res.success) {
      // Cập nhật lại UI ngay lập tức
      setGuest({ ...guest, rsvp_status: status });
    } else {
      setErrorMsg(res.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    }
    
    setIsUpdating(false);
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff' 
      });
      const link = document.createElement('a');
      const safeName = (guest.guest_info?.name || 'Khach_VIP').replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Ve_Su_Kien_NKBA_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Lỗi tải vé:', error);
      alert('Có lỗi xảy ra khi tải vé. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i>
        <p className="text-slate-500 font-medium animate-pulse">Đang tải thông tin...</p>
      </div>
    );
  }

  if (errorMsg || !guest) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ph-bold ph-warning-circle text-3xl"></i>
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Không hợp lệ</h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  const salutation = guest?.salutation || 'Anh/Chị';
  const qrCheckinUrl = `${process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3002'}/events/checkin?token=${token}`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-['Montserrat'] bg-slate-100">
      
      {guest.rsvp_status === 'CONFIRMED' ? (
        
        // ================= GIAO DIỆN KHI ĐÃ XÁC NHẬN -> HIỂN THỊ VÉ =================
        <div className="w-full max-w-md flex flex-col gap-4 animate-in fade-in zoom-in duration-500">
          
          <div className="text-center mb-2">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <i className="ph-fill ph-check-circle text-2xl"></i>
            </div>
            <h2 className="text-lg font-black text-slate-800">Đã xác nhận tham dự!</h2>
            <p className="text-sm text-slate-500 mt-1">Cảm ơn {salutation}. Dưới đây là vé điện tử của {salutation}.</p>
          </div>

          {/* VÉ ĐIỆN TỬ (Tương tự hình ảnh anh gửi) */}
          <div ref={ticketRef} className="bg-white rounded-[24px] shadow-xl overflow-hidden border border-slate-200 relative">
            {/* Header Vé */}
            <div className="bg-[#002D62] p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] rounded-full blur-[50px] opacity-20 -mr-10 -mt-10 pointer-events-none"></div>
              <p className="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase mb-1">VIP Invitation</p>
              <h2 className="text-xl font-black text-white line-clamp-2">{event?.title}</h2>
            </div>
            
            {/* Vòng tròn cắt mép */}
            <div className="absolute left-0 -ml-4 w-8 h-8 bg-slate-100 rounded-full" style={{ top: 'calc(45%)' }}></div>
            <div className="absolute right-0 -mr-4 w-8 h-8 bg-slate-100 rounded-full" style={{ top: 'calc(45%)' }}></div>
            
            {/* Nội dung Vé */}
            <div className="p-8 text-center bg-white relative">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Kính mời</p>
              <h3 className="text-2xl font-black text-[#002D62] mb-1">{salutation} {guest.guest_info?.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{guest.guest_info?.position ? `${guest.guest_info.position} - ` : ''}{guest.guest_info?.company}</p>

              <div className="bg-slate-50 p-4 rounded-xl mt-6 text-left border border-slate-100 space-y-3">
                <div className="flex items-start gap-3">
                  <i className="ph-fill ph-calendar-blank text-slate-400 text-lg mt-0.5"></i>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Thời gian</p>
                    <p className="text-sm font-bold text-slate-800">{event?.event_date ? new Date(event.event_date).toLocaleString('vi-VN') : 'Sắp tới'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="ph-fill ph-map-pin text-slate-400 text-lg mt-0.5"></i>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Địa điểm</p>
                    <p className="text-sm font-bold text-slate-800">{event?.details?.location || 'Đang cập nhật'}</p>
                  </div>
                </div>
              </div>

              {/* Đường đứt nét */}
              <div className="w-full border-t-2 border-dashed border-slate-200 my-6"></div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm">
                  <QRCodeCanvas value={qrCheckinUrl} size={160} level="H" fgColor="#002D62" />
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-400">Vui lòng xuất trình mã QR này tại quầy Lễ tân<br/>để tiến hành Check-in tự động.</p>
            </div>
          </div>

          <button 
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="w-full mt-2 py-4 bg-[#002D62] hover:bg-blue-900 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDownloading ? <><i className="ph-bold ph-spinner animate-spin"></i> Đang xử lý ảnh...</> : <><i className="ph-bold ph-download-simple"></i> Tải vé về điện thoại</>}
          </button>
        </div>

      ) : (

        // ================= GIAO DIỆN CHƯA XÁC NHẬN HOẶC TỪ CHỐI =================
        <div className="bg-[#002D62] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative border border-[#D4AF37]/20">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_#ffffff,_transparent_50%)]"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37] rounded-full blur-[80px] opacity-20"></div>

          <div className="relative z-10 p-8 md:p-10 flex flex-col items-center text-center">
            <div className="bg-white rounded-2xl px-6 py-3 mb-6 shadow-lg relative flex items-center justify-center h-14">
              <Image src="/logo-nkba.png" alt="NKBA" width={120} height={40} className="h-full w-auto object-contain" priority />
              <div className="absolute -bottom-1 w-1/2 h-1.5 bg-[#BE0027] rounded-full shadow-sm"></div>
            </div>

            <h4 className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-2">Xác nhận tham dự</h4>
            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mb-6 drop-shadow-sm">{event?.title}</h1>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 w-full p-6 rounded-2xl mb-8 shadow-inner">
              <p className="text-blue-200 text-sm mb-2 font-['Noto_Serif'] italic">Kính chào {salutation},</p>
              <p className="text-xl font-bold text-[#F3E5AB] tracking-wide mb-4 line-clamp-2">{guest.guest_info?.name}</p>
              
              <div className="w-full h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent my-4"></div>
              
              <div className="space-y-3 text-left w-full mt-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#BE0027]/20 text-[#BE0027] flex items-center justify-center shrink-0 border border-[#BE0027]/30 mt-0.5">
                    <i className="ph-fill ph-clock text-base"></i>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">Thời gian</p>
                    <p className="text-sm font-bold text-white">17:00, {event?.event_date ? new Date(event.event_date).toLocaleDateString('vi-VN') : 'Sắp tới'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 border border-[#D4AF37]/30 mt-0.5">
                    <i className="ph-fill ph-map-pin text-base"></i>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-blue-200 uppercase tracking-widest">Địa điểm</p>
                    <p className="text-sm font-bold text-white line-clamp-2">{event?.details?.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {guest.rsvp_status === 'PENDING' ? (
              <div className="w-full space-y-3">
                <p className="text-sm text-slate-300 mb-4">Vui lòng phản hồi để chúng tôi chuẩn bị đón tiếp chu đáo nhất.</p>
                <button onClick={() => handleAction('CONFIRMED')} disabled={isUpdating} className="w-full py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                  {isUpdating ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-check-circle text-lg"></i>} TÔI SẼ THAM DỰ
                </button>
                <button onClick={() => handleAction('DECLINED')} disabled={isUpdating} className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-blue-100 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10">
                  {isUpdating ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-x-circle text-lg"></i>} Rất tiếc, tôi không thể tham gia
                </button>
              </div>
            ) : (
              <div className="w-full p-6 rounded-2xl border bg-slate-500/10 border-slate-500/30">
                <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 bg-slate-500/20 text-slate-400">
                  <i className="ph-fill ph-info text-3xl"></i>
                </div>
                <h3 className="text-lg font-bold mb-1 text-slate-300">Đã từ chối tham gia</h3>
                <p className="text-xs text-blue-200 mt-2 leading-relaxed">Rất tiếc vì sự vắng mặt của {salutation}. Hẹn gặp lại trong các sự kiện tới.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Bọc Component trong Suspense để Next.js không báo lỗi khi dùng useSearchParams
export default function RsvpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <i className="ph-bold ph-spinner animate-spin text-3xl text-[#002D62]"></i>
      </div>
    }>
      <RsvpContent />
    </Suspense>
  );
}
