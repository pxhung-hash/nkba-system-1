'use client';

import { useState, useEffect, Suspense } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function RsvpLogic() {
  const { lang } = useLanguage();
  const t = dict[lang].rsvpPage;
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'CONFIRMED' | 'DECLINED' | 'INVALID'>('IDLE');

  // Giả lập kiểm tra token khi trang vừa load
  useEffect(() => {
    if (!token) {
      setStatus('INVALID');
    }
  }, [token]);

  const handleRsvp = (response: 'CONFIRMED' | 'DECLINED') => {
    setStatus('PROCESSING');
    
    // TODO: Gọi API cập nhật rsvp_status vào bảng event_guests dựa theo token
    // const { data, error } = await supabase.from('event_guests').update({ rsvp_status: response }).eq('tracking_token', token);
    
    setTimeout(() => {
      setStatus(response);
    }, 1500);
  };

  if (status === 'INVALID') {
    return (
      <div className="bg-white p-12 rounded-[2rem] border border-slate-200 shadow-xl text-center">
        <i className="ph-fill ph-warning-circle text-5xl text-rose-500 mb-4"></i>
        <p className="text-slate-600 font-bold">{t.invalidToken}</p>
      </div>
    );
  }

  if (status === 'CONFIRMED' || status === 'DECLINED') {
    const isConfirmed = status === 'CONFIRMED';
    return (
      <div className={`bg-white p-12 rounded-[2rem] border-4 shadow-2xl text-center animate-in zoom-in-95 ${isConfirmed ? 'border-emerald-200' : 'border-slate-200'}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ${isConfirmed ? 'bg-emerald-100 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}>
          <i className={`ph-fill text-6xl ${isConfirmed ? 'ph-check-circle' : 'ph-info'}`}></i>
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">
          {isConfirmed ? t.successConfirmTitle : t.successDeclineTitle}
        </h2>
        <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
          {isConfirmed ? t.successConfirmDesc : t.successDeclineDesc}
        </p>
        <Link href="/" className="inline-flex h-12 px-8 bg-[#002D62] text-white font-black rounded-xl items-center justify-center shadow-lg hover:bg-blue-900 transition-colors">
          {t.backToHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-xl">
      <div className="text-center mb-10">
        <div className="inline-block bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest mb-4">
          RSVP (Répondez s'il vous plaît)
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-[#002D62] mb-4">{t.title}</h1>
        <p className="text-slate-500 font-medium">{t.subtitle}</p>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-10 text-center">
        <p className="font-bold text-slate-800 text-lg mb-2">{t.guestHello}</p>
        <p className="text-slate-600">Ban Tổ Chức trân trọng kính mời bạn tham dự <strong className="text-[#002D62]">Lễ Ra Mắt Liên Minh NKBA</strong>.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button 
          onClick={() => handleRsvp('CONFIRMED')}
          disabled={status === 'PROCESSING'}
          className="flex-1 h-14 bg-emerald-600 text-white font-black rounded-xl shadow-lg hover:bg-emerald-700 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
        >
          {status === 'PROCESSING' ? (
            <><i className="ph-bold ph-spinner animate-spin text-xl"></i> {t.processing}</>
          ) : (
            <><i className="ph-bold ph-check-circle text-xl"></i> {t.confirmBtn}</>
          )}
        </button>

        <button 
          onClick={() => handleRsvp('DECLINED')}
          disabled={status === 'PROCESSING'}
          className="flex-1 h-14 bg-white border-2 border-slate-200 text-slate-500 font-black rounded-xl hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <i className="ph-bold ph-x-circle text-xl"></i> {t.declineBtn}
        </button>
      </div>
    </div>
  );
}

export default function RsvpPageContent() {
  return (
    <div className="bg-slate-50 min-h-screen py-20 px-6 flex items-center justify-center relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#002D62] opacity-[0.03] rounded-full translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#D4AF37] opacity-[0.05] rounded-full -translate-x-1/3 translate-y-1/3"></div>
      
      <div className="max-w-2xl w-full relative z-10">
        <Suspense fallback={<div className="text-center p-12"><i className="ph-bold ph-spinner animate-spin text-3xl text-[#002D62]"></i></div>}>
          <RsvpLogic />
        </Suspense>
      </div>
    </div>
  );
}