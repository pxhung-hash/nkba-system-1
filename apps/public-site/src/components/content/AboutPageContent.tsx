'use client';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';
import { useEffect } from 'react';
import 'aos/dist/aos.css';

export default function AboutPageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].aboutPage;

  useEffect(() => {
    const initAOS = async () => {
      const AOS = (await import('aos')).default;
      AOS.init({ duration: 800, once: true });
    };
    initAOS();
  }, []);

  return (
    <div className="bg-slate-50 min-h-screen pb-20 antialiased font-sans">
      {/* HERO SECTION */}
      <div className="bg-[#002D62] text-white py-32 relative overflow-hidden border-b-8 border-[#D4AF37]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')] opacity-15 bg-cover bg-center mix-blend-luminosity scale-110"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center" data-aos="fade-up">
          <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-sm mb-3 block">Nichietsu Kensetsu Business Alliance</span>
          <h1 className="text-5xl md:text-7xl font-heading font-black mb-6 tracking-tight uppercase">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto font-light leading-relaxed whitespace-pre-line">
            {t.heroDesc}
          </p>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH */}
      <div className="max-w-7xl mx-auto px-6 mt-24 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
        <div data-aos="fade-right">
          <h2 className="text-4xl font-heading font-black text-slate-900 mb-8 border-l-8 border-[#D4AF37] pl-6 tracking-tight uppercase">
            {t.missionTitle}
          </h2>
          <p className="text-slate-700 leading-relaxed mb-8 font-light text-xl">
            {t.missionBodyP1}<strong className="text-[#002D62] font-bold">{t.missionHighlight}</strong>{t.missionBodyP2}
          </p>
          <ul className="space-y-5">
            <li className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <i className="ph-fill ph-check-circle text-[#D4AF37] text-2xl mt-1 shrink-0"></i> 
              <span className="text-slate-800 font-medium text-lg">{t.missionL1}</span>
            </li>
            <li className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <i className="ph-fill ph-check-circle text-[#D4AF37] text-2xl mt-1 shrink-0"></i> 
              <span className="text-slate-800 font-medium text-lg">{t.missionL2}</span>
            </li>
            <li className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-slate-100">
              <i className="ph-fill ph-check-circle text-[#D4AF37] text-2xl mt-1 shrink-0"></i> 
              <span className="text-slate-800 font-medium text-lg">{t.missionL3}</span>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-6" data-aos="fade-left">
          <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 text-center group hover:border-[#002D62] transition-colors">
            <i className="ph-fill ph-buildings text-6xl text-[#002D62] mb-5 group-hover:scale-110 transition-transform"></i>
            <p className="text-5xl font-heading font-black text-slate-900 tracking-tight">150+</p>
            <p className="text-xs font-black text-slate-400 uppercase mt-3 tracking-widest">{t.statsBiz}</p>
          </div>
          <div className="bg-[#002D62] p-10 rounded-3xl shadow-2xl shadow-blue-900/30 text-center translate-y-12 border-4 border-[#D4AF37] group hover:scale-105 transition-transform">
            <i className="ph-fill ph-handshake text-6xl text-[#D4AF37] mb-5 group-hover:rotate-12 transition-transform"></i>
            <p className="text-5xl font-heading font-black text-white tracking-tight">$50M+</p>
            <p className="text-xs font-black text-blue-200 uppercase mt-3 tracking-widest">{t.statsTrans}</p>
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="max-w-5xl mx-auto px-6 mt-40" data-aos="zoom-in">
        <div className="text-center bg-white p-16 rounded-[4rem] border border-slate-100 shadow-2xl relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-50 rounded-full opacity-50"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full opacity-50"></div>
          
          <div className="relative z-10">
            <i className="ph-fill ph-sparkle text-5xl text-[#D4AF37] mb-6"></i>
            <h3 className="text-3xl font-heading font-black text-slate-900 mb-5 tracking-tight uppercase">
              {t.ctaTitle}
            </h3>
            <p className="text-slate-600 mb-10 font-light text-lg max-w-xl mx-auto">
              {t.ctaDesc}
            </p>
            <Link href="/dang-ky" className="inline-flex items-center gap-3 px-12 py-5 bg-[#BE0027] text-white font-heading font-black text-lg rounded-2xl shadow-xl shadow-red-900/30 hover:bg-red-700 transition-all hover:scale-105 transform">
              {t.ctaBtn.toUpperCase()} <i className="ph-bold ph-arrow-right text-xl"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}