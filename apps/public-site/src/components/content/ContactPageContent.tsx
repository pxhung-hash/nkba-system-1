// src/components/content/ContactPageContent.tsx
'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function ContactPageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].contactPage;

  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* CỘT THÔNG TIN */}
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-[#002D62] mb-6 uppercase tracking-tight">
              {t.title}
            </h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
              {t.desc}
            </p>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shrink-0">
                  <i className="ph-fill ph-map-pin"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{t.hqTitle}</h4>
                  <p className="text-slate-600 font-medium mt-1 whitespace-pre-line">{t.hqAddress}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shrink-0">
                  <i className="ph-fill ph-phone-call"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{t.hotlineTitle}</h4>
                  <p className="text-slate-600 font-medium mt-1">{t.hotlineText}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shrink-0">
                  <i className="ph-fill ph-envelope"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-lg">{t.emailTitle}</h4>
                  <p className="text-slate-600 font-medium mt-1">{t.emailText}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT FORM */}
          <div className="bg-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8">{t.formTitle}</h3>
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert(t.formAlert); }}>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.formName}</label>
                <input type="text" required className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#002D62]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.formPhone}</label>
                  <input type="tel" required className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#002D62]" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.formEmail}</label>
                  <input type="email" required className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:border-[#002D62]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.formMessage}</label>
                <textarea required className="w-full h-32 p-4 rounded-xl border border-slate-200 outline-none resize-none focus:border-[#002D62]"></textarea>
              </div>
              <button type="submit" className="w-full h-14 bg-[#002D62] text-white font-black rounded-xl shadow-lg hover:bg-blue-900 transition-colors flex justify-center items-center gap-2">
                <i className="ph-bold ph-paper-plane-tilt text-xl"></i> {t.formSubmit}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}