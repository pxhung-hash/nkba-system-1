'use client'

import Link from 'next/link';
import { dict } from '@/i18n/dictionaries';

interface HeroProps {
  lang: 'vi' | 'ja';
  openRegisterModal: (tier: string) => void;
}

export default function Hero({ lang, openRegisterModal }: HeroProps) {
  const t = dict[lang].heroSection;
  const handlePrint = () => window.print();

  return (
    <section id="intro" className="relative h-screen flex items-center justify-center overflow-hidden bg-slate-900">
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2144&auto=format&fit=crop" alt="Cityscape" className="w-full h-full object-cover object-center opacity-40 mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#002D62]/80 to-transparent"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-12 items-center pt-20">
        <div data-aos="fade-right" data-aos-duration="1000">
          <div className="inline-block bg-white/10 backdrop-blur-md border border-white/20 text-[#D4AF37] px-4 py-1.5 rounded-full mb-6 shadow-2xl">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{t.tag}</span>
          </div>
          
          <h1 className="font-heading font-black text-5xl md:text-7xl leading-tight mb-6 text-white tracking-tight">
            {t.titleConnect} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-yellow-200">{t.titleTrust}</span><br/>
            {t.titleBuild} <span className="text-[#BE0027]">{t.titleValue}</span>
          </h1>
          
          <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-lg border-l-2 border-[#D4AF37] pl-6 font-light whitespace-pre-line">
            {t.descP1}<strong className="text-white font-bold">{t.descHighlight}</strong>{t.descP2}
          </p>
          
          <div className="flex flex-col sm:flex-row flex-wrap gap-4">
            <button onClick={() => openRegisterModal('Registered (Miễn phí)')} className="px-8 py-4 bg-gradient-to-r from-[#BE0027] to-red-800 text-white font-bold rounded-lg hover:to-red-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-900/30">
              {t.btnFree}
            </button>

            <button onClick={handlePrint} className="px-6 py-4 bg-white/5 border border-white/20 text-white font-bold rounded-lg hover:bg-white hover:text-slate-900 transition-all flex items-center justify-center gap-2 backdrop-blur-sm">
              <i className="ph-bold ph-download-simple"></i> {t.btnPdf}
            </button>
          </div>
        </div>
        
        <div className="hidden md:block relative" data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#002D62]/50 border border-white/10 aspect-[4/3]">
            <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1000&auto=format&fit=crop" className="w-full h-full object-cover" alt="Handshake" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
          </div>
          
          <div className="absolute -bottom-8 -left-8 bg-slate-800/90 backdrop-blur-xl border border-slate-700 p-6 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37] to-yellow-600 rounded-full flex items-center justify-center text-white text-2xl shadow-inner"><i className="ph ph-handshake"></i></div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{t.activeMembers}</p>
                <p className="text-3xl font-black text-white">45+</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}