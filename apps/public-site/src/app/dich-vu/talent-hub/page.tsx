'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function TalentHubDiscoverPage() {
  const { lang } = useLanguage();
  const t = dict[lang].talentHubPage;

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      
      {/* HERO SECTION */}
      <div className="bg-emerald-900 pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2000&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-luminosity"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-xs uppercase tracking-widest mb-6">
            <i className="ph-fill ph-users-three text-lg"></i> {t.heroTag}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight mb-6">
            {t.heroTitle1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">{t.heroTitleHighlight}</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-100/80 font-medium leading-relaxed max-w-3xl mx-auto">
            {t.heroDesc}
          </p>
        </div>
      </div>

      {/* SNEAK PEEK (HỒ SƠ CHUYÊN GIA BỊ MỜ) */}
      <div className="max-w-6xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-8 md:p-12">
          <div className="flex justify-between items-end border-b border-slate-100 pb-6 mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900"><i className="ph-fill ph-star text-amber-500"></i> {t.sneakPeekTitle}</h2>
              <p className="text-slate-500 font-medium mt-1">{t.sneakPeekSub}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Candidate 1 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 relative overflow-hidden group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-2xl font-black blur-[2px]">?</div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t.c1Title}</h3>
                  <p className="text-sm font-bold text-emerald-600">{t.c1Exp}</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-md mr-2">{t.c1Skill1}</span>
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-md mr-2">{t.c1Skill2}</span>
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-md">{t.c1Skill3}</span>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 relative">
                <div className="blur-sm opacity-50 select-none">
                  <p className="text-xs font-bold font-mono">{t.c1Blur1}</p>
                  <p className="text-xs font-bold font-mono">{t.c1Blur2}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link href="/upgrade" className="px-6 py-2 bg-emerald-600 text-white text-xs font-black rounded-lg shadow-lg hover:bg-emerald-700 transition-colors">
                    <i className="ph-fill ph-lock-key"></i> {t.unlockCV}
                  </Link>
                </div>
              </div>
            </div>

            {/* Candidate 2 */}
            <div className="p-6 rounded-2xl border border-slate-100 bg-slate-50 relative overflow-hidden group">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 text-2xl font-black blur-[2px]">?</div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{t.c2Title}</h3>
                  <p className="text-sm font-bold text-emerald-600">{t.c2Exp}</p>
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-md mr-2">{t.c2Skill1}</span>
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-md mr-2">{t.c2Skill2}</span>
                <span className="inline-block px-3 py-1 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-md">{t.c2Skill3}</span>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-slate-200 relative">
                <div className="blur-sm opacity-50 select-none">
                  <p className="text-xs font-bold font-mono">{t.c2Blur1}</p>
                  <p className="text-xs font-bold font-mono">{t.c2Blur2}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Link href="/upgrade" className="px-6 py-2 bg-emerald-600 text-white text-xs font-black rounded-lg shadow-lg hover:bg-emerald-700 transition-colors">
                    <i className="ph-fill ph-lock-key"></i> {t.unlockCV}
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-24 text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-4">{t.ctaTitle}</h2>
        <p className="text-slate-600 font-medium mb-8">{t.ctaDesc}</p>
        <Link href="/upgrade" className="inline-flex items-center gap-2 px-10 py-4 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-black transition-colors">
          {t.ctaBtn} <i className="ph-bold ph-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}