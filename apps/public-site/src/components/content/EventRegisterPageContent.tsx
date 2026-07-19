'use client';

import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';
import Link from 'next/link';

export default function EventRegisterPageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].eventRegisterPage;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Giả lập API Call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-16 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Nút quay lại */}
        <Link href="/su-kien" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#002D62] font-bold mb-8 transition-colors">
          <i className="ph-bold ph-arrow-left"></i> Quay lại Sự kiện
        </Link>

        {isSuccess ? (
          /* MÀN HÌNH ĐĂNG KÝ THÀNH CÔNG */
          <div className="bg-white p-12 rounded-[2rem] border-4 border-emerald-200 shadow-2xl text-center max-w-2xl mx-auto animate-in zoom-in-95">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <i className="ph-fill ph-check-circle text-6xl"></i>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">{t.successTitle}</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed mb-8">
              {t.successDesc}
            </p>
            <Link href="/" className="inline-flex h-14 px-8 bg-[#002D62] text-white font-black rounded-xl items-center justify-center shadow-lg hover:bg-blue-900 transition-colors">
              VỀ TRANG CHỦ NKBA
            </Link>
          </div>
        ) : (
          /* MÀN HÌNH FORM ĐĂNG KÝ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
            
            {/* Cột trái: Thông tin sự kiện */}
            <div className="lg:col-span-5 bg-[#002D62] p-10 text-white relative overflow-hidden">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10">
                <h3 className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-2 border-b border-blue-800 pb-2 inline-block">
                  {t.eventInfoTitle}
                </h3>
                <h2 className="text-3xl font-heading font-black mb-8 leading-tight">
                  {t.eventTitle}
                </h2>

                <div className="space-y-6 mb-12">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <i className="ph-fill ph-calendar-blank text-xl text-[#D4AF37]"></i>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{t.eventDate}</p>
                      <p className="text-blue-200 text-sm">{t.eventTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <i className="ph-fill ph-map-pin text-xl text-[#D4AF37]"></i>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{t.eventLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h4 className="font-bold text-[#D4AF37] mb-4">{t.perksTitle}</h4>
                  <ul className="space-y-3 text-sm text-blue-100">
                    <li className="flex items-start gap-2"><i className="ph-fill ph-check-circle text-[#D4AF37] mt-0.5"></i> {t.perk1}</li>
                    <li className="flex items-start gap-2"><i className="ph-fill ph-check-circle text-[#D4AF37] mt-0.5"></i> {t.perk2}</li>
                    <li className="flex items-start gap-2"><i className="ph-fill ph-check-circle text-[#D4AF37] mt-0.5"></i> {t.perk3}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Cột phải: Form nhập liệu */}
            <div className="lg:col-span-7 p-10">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">{t.title}</h1>
                <p className="text-slate-500 font-medium">{t.subtitle}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.formName}</label>
                  <input type="text" required className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#002D62] font-medium" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.formCompany}</label>
                    <input type="text" required className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#002D62] font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.formPosition}</label>
                    <input type="text" required className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#002D62] font-medium" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.formPhone}</label>
                    <input type="tel" required className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#002D62] font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.formEmail}</label>
                    <input type="email" required className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#002D62] font-medium" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.formNote}</label>
                  <textarea className="w-full h-24 p-4 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-[#002D62] resize-none font-medium"></textarea>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className={`w-full h-14 text-white font-black rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#BE0027] hover:bg-red-700 shadow-red-900/30'}`}
                  >
                    {isSubmitting ? (
                      <><i className="ph-bold ph-spinner animate-spin text-xl"></i> {t.btnProcessing}</>
                    ) : (
                      <><i className="ph-bold ph-paper-plane-tilt text-xl"></i> {t.btnSubmit}</>
                    )}
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}