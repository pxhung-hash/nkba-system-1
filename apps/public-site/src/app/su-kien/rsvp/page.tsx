// src/app/su-kien/rsvp/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyRsvpToken, updateRsvpStatus } from '@/actions/rsvp.actions';
import Link from 'next/link';
import Image from 'next/image'; // Import thẻ Image của Next.js

function RsvpContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [guest, setGuest] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);

  // Vừa vào trang là quét token lấy dữ liệu ngay
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
        setErrorMsg(res.message);
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
      alert(res.message);
    }
    
    setIsUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
        <i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i>
        <p className="text-slate-500 font-medium animate-pulse">Đang kiểm tra thiệp mời...</p>
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
          <Link href="/" className="px-6 py-3 bg-[#002D62] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors inline-block">
            Quay về Trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 font-['Montserrat']">
      <div className="bg-[#002D62] w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden relative border border-[#D4AF37]/20">
        
        {/* Họa tiết trang trí nền */}
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_#ffffff,_transparent_50%)]"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37] rounded-full blur-[80px] opacity-20"></div>

        <div className="relative z-10 p-8 md:p-10 flex flex-col items-center text-center">
          
          {/* Logo */}
          <div className="bg-white rounded-2xl px-6 py-3 mb-6 shadow-lg relative flex items-center justify-center h-14">
            <Image 
              src="/logo-nkba.png" 
              alt="NKBA Logo" 
              width={120} 
              height={40} 
              className="h-full w-auto object-contain"
              priority 
            />
            <div className="absolute -bottom-1 w-1/2 h-1.5 bg-[#BE0027] rounded-full shadow-sm"></div>
          </div>

          <h4 className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-2">Xác nhận tham dự</h4>
          <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase mb-6 drop-shadow-sm">
            {event?.title}
          </h1>

          {/* Lời chào khách */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 w-full p-6 rounded-2xl mb-8 shadow-inner">
            <p className="text-blue-200 text-sm mb-2 font-['Noto_Serif'] italic">Kính chào Anh/Chị,</p>
            <p className="text-xl font-bold text-[#F3E5AB] tracking-wide mb-4 line-clamp-2">
              {guest.guest_info?.name || 'Khách VIP'}
            </p>
            
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
                  <p className="text-sm font-bold text-white line-clamp-2">{event?.details?.location || 'Đang cập nhật'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Khu vực Nút bấm / Hiển thị trạng thái */}
          {guest.rsvp_status === 'PENDING' ? (
            <div className="w-full space-y-3">
              <p className="text-sm text-slate-300 mb-4">Vui lòng phản hồi để chúng tôi chuẩn bị đón tiếp chu đáo nhất.</p>
              <button 
                onClick={() => handleAction('CONFIRMED')}
                disabled={isUpdating}
                className="w-full py-3.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-check-circle text-lg"></i>} 
                TÔI SẼ THAM DỰ
              </button>
              
              <button 
                onClick={() => handleAction('DECLINED')}
                disabled={isUpdating}
                className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-blue-100 font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/10"
              >
                {isUpdating ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-x-circle text-lg"></i>}
                Rất tiếc, tôi không thể tham gia
              </button>
            </div>
          ) : (
            <div className={`w-full p-6 rounded-2xl border ${guest.rsvp_status === 'CONFIRMED' ? 'bg-[#10b981]/10 border-[#10b981]/30' : 'bg-slate-500/10 border-slate-500/30'}`}>
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 ${guest.rsvp_status === 'CONFIRMED' ? 'bg-[#10b981]/20 text-[#34d399]' : 'bg-slate-500/20 text-slate-400'}`}>
                <i className={`ph-fill text-3xl ${guest.rsvp_status === 'CONFIRMED' ? 'ph-check-circle' : 'ph-info'}`}></i>
              </div>
              <h3 className={`text-lg font-bold mb-1 ${guest.rsvp_status === 'CONFIRMED' ? 'text-[#34d399]' : 'text-slate-300'}`}>
                {guest.rsvp_status === 'CONFIRMED' ? 'Đã xác nhận tham dự!' : 'Đã từ chối tham gia'}
              </h3>
              <p className="text-xs text-blue-200">
                {guest.rsvp_status === 'CONFIRMED' 
                  ? 'Cảm ơn Anh/Chị. Rất mong được đón tiếp Anh/Chị tại sự kiện.' 
                  : 'Rất tiếc vì sự vắng mặt của Anh/Chị. Hẹn gặp lại trong các sự kiện tới.'}
              </p>
            </div>
          )}

        </div>
      </div>
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
