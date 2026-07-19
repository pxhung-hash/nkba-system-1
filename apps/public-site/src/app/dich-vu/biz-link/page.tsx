'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function BizLinkDiscoverPage() {
  const { lang } = useLanguage();
  const t = dict[lang].bizLinkPage;

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      
      {/* HERO KHỦNG */}
      <div className="bg-slate-900 pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541888082425-4c07c6e61f22?q=80&w=2000&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 font-bold text-xs uppercase tracking-widest mb-6">
            <i className="ph-fill ph-handshake text-lg"></i> {t.heroTag}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6 whitespace-pre-line">
            {t.heroTitle1}<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-3xl mx-auto whitespace-pre-line">
            {t.heroDesc}
          </p>
        </div>
      </div>

      {/* SNEAK PEEK (NHỬ MỒI DỰ ÁN) */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-8 md:p-12">
          <div className="flex justify-between items-end border-b border-slate-100 pb-6 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900"><i className="ph-fill ph-target text-rose-500"></i> {t.sneakPeekTitle}</h2>
              <p className="text-slate-500 font-medium mt-1">{t.sneakPeekSub}</p>
            </div>
            <div className="hidden md:block text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.budgetLabel}</p>
              <p className="text-2xl font-black text-emerald-600">{t.budgetValue}</p>
            </div>
          </div>

          {/* Danh sách dự án (Bị làm mờ thông tin quan trọng) */}
          <div className="space-y-4">
            
            {/* Project 1 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center group relative overflow-hidden">
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 font-bold text-[10px] uppercase rounded-md">{t.pj1Tag}</span>
                  <span className="text-xs font-bold text-slate-400"><i className="ph-fill ph-clock"></i> {t.pj1Time}</span>
                </div>
                <h3 className="text-lg font-black text-slate-800">{t.pj1Title}</h3>
                <p className="text-sm font-medium text-slate-500">{t.pj1Budget} <strong className="text-emerald-600">{t.pj1BudgetVal}</strong></p>
              </div>
              {/* Lớp phủ mờ đòi Nâng cấp */}
              <div className="w-full md:w-auto shrink-0 relative">
                <div className="blur-sm opacity-50 select-none pointer-events-none">
                  <p className="text-xs font-bold text-slate-500">{t.pj1Client}</p>
                  <p className="text-xs font-bold text-slate-500">{t.pj1Contact}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link href="/upgrade" className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-lg shadow-lg hover:bg-[#002D62] transition-colors whitespace-nowrap">
                    <i className="ph-fill ph-lock-key"></i> {t.unlockBtn}
                  </Link>
                </div>
              </div>
            </div>

            {/* Project 2 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center group relative overflow-hidden">
              <div className="flex-1 space-y-2 w-full">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 font-bold text-[10px] uppercase rounded-md">{t.pj2Tag}</span>
                  <span className="text-xs font-bold text-slate-400"><i className="ph-fill ph-clock"></i> {t.pj2Time}</span>
                </div>
                <h3 className="text-lg font-black text-slate-800">{t.pj2Title}</h3>
                <p className="text-sm font-medium text-slate-500">{t.pj2Budget} <strong className="text-emerald-600">{t.pj2BudgetVal}</strong></p>
              </div>
              <div className="w-full md:w-auto shrink-0 relative">
                <div className="blur-sm opacity-50 select-none pointer-events-none">
                  <p className="text-xs font-bold text-slate-500">{t.pj2Client}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link href="/upgrade" className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-lg shadow-lg hover:bg-[#002D62] transition-colors whitespace-nowrap">
                    <i className="ph-fill ph-lock-key"></i> {t.unlockBtn}
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* TẠI SAO CHỌN BIZ-LINK? */}
      <div className="max-w-7xl mx-auto px-6 mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center space-y-4 p-6">
          <div className="w-20 h-20 mx-auto bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl shadow-inner"><i className="ph-fill ph-shield-check"></i></div>
          <h3 className="text-xl font-black text-slate-900">{t.f1Title}</h3>
          <p className="text-slate-500 font-medium">{t.f1Desc}</p>
        </div>
        <div className="text-center space-y-4 p-6">
          <div className="w-20 h-20 mx-auto bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl shadow-inner"><i className="ph-fill ph-rocket-launch"></i></div>
          <h3 className="text-xl font-black text-slate-900">{t.f2Title}</h3>
          <p className="text-slate-500 font-medium">{t.f2Desc}</p>
        </div>
        <div className="text-center space-y-4 p-6">
          <div className="w-20 h-20 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-4xl shadow-inner"><i className="ph-fill ph-handshake"></i></div>
          <h3 className="text-xl font-black text-slate-900">{t.f3Title}</h3>
          <p className="text-slate-500 font-medium">{t.f3Desc}</p>
        </div>
      </div>

      {/* CHỐT SALE (CTA KHỦNG) */}
      <div className="max-w-5xl mx-auto px-6 mt-24">
        <div className="bg-gradient-to-br from-[#002D62] to-blue-900 rounded-[3rem] p-12 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl"></div>
          
          <i className="ph-fill ph-crown text-6xl text-amber-400 mb-6 drop-shadow-lg"></i>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">{t.ctaTitle}</h2>
          <p className="text-blue-200 text-lg font-medium mb-10 max-w-2xl mx-auto">
            {t.ctaDesc}
          </p>
          <Link href="/upgrade" className="inline-flex items-center gap-3 px-12 py-5 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-lg font-black rounded-xl shadow-xl shadow-amber-500/20 hover:scale-105 transition-transform">
            {t.ctaBtn} <i className="ph-bold ph-arrow-right"></i>
          </Link>
          <p className="text-blue-300 text-sm font-medium mt-6 italic">{t.ctaNote}</p>
        </div>
      </div>

    </div>
  );
}