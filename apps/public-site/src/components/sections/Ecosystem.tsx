import { dict } from '@/i18n/dictionaries';

interface EcosystemProps {
  lang: 'vi' | 'ja';
}

export default function Ecosystem({ lang }: EcosystemProps) {
  const t = dict[lang].ecosystemSection;

  return (
    <section id="ecosystem" className="py-32 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[#002D62] opacity-20 blur-3xl transform skew-x-12"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-20" data-aos="fade-up">
          <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs">{t.tag}</span>
          <h2 className="font-heading font-black text-4xl text-white mt-2 tracking-tight">{t.title}</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Biz-Link */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-10 hover:bg-slate-800 transition-colors" data-aos="fade-up">
            <div className="w-16 h-16 bg-[#002D62]/50 text-blue-300 rounded-2xl flex items-center justify-center text-3xl mb-8"><i className="ph ph-handshake"></i></div>
            <h3 className="font-heading font-bold text-2xl mb-2">{t.col1Title}</h3>
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-8">{t.col1Sub}</p>
            <ul className="space-y-4 text-slate-300 text-sm">
              <li className="flex items-start gap-3"><i className="ph ph-check-circle text-green-400 text-lg"></i> <span>{t.col1L1}</span></li>
              <li className="flex items-start gap-3"><i className="ph ph-check-circle text-green-400 text-lg"></i> <span>{t.col1L2}</span></li>
            </ul>
          </div>
          
          {/* Talent Hub */}
          <div className="bg-gradient-to-b from-[#BE0027]/20 to-slate-800/50 backdrop-blur-sm border border-red-900/30 rounded-3xl p-10 transform md:-translate-y-8 relative" data-aos="fade-up" data-aos-delay="100">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#BE0027] rounded-b-full"></div>
            <div className="w-16 h-16 bg-red-900/50 text-red-300 rounded-2xl flex items-center justify-center text-3xl mb-8"><i className="ph ph-users-three"></i></div>
            <h3 className="font-heading font-bold text-2xl mb-2">{t.col2Title}</h3>
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-8">{t.col2Sub}</p>
            <ul className="space-y-4 text-slate-300 text-sm">
              <li className="flex items-start gap-3"><i className="ph ph-check-circle text-green-400 text-lg"></i> <span>{t.col2L1}</span></li>
              <li className="flex items-start gap-3"><i className="ph ph-check-circle text-green-400 text-lg"></i> <span>{t.col2L2}</span></li>
            </ul>
          </div>

          {/* Insights */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-10 hover:bg-slate-800 transition-colors" data-aos="fade-up" data-aos-delay="200">
            <div className="w-16 h-16 bg-[#D4AF37]/20 text-[#D4AF37] rounded-2xl flex items-center justify-center text-3xl mb-8"><i className="ph ph-lightbulb"></i></div>
            <h3 className="font-heading font-bold text-2xl mb-2">{t.col3Title}</h3>
            <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-8">{t.col3Sub}</p>
            <ul className="space-y-4 text-slate-300 text-sm">
              <li className="flex items-start gap-3"><i className="ph ph-check-circle text-green-400 text-lg"></i> <span>{t.col3L1}</span></li>
              <li className="flex items-start gap-3"><i className="ph ph-check-circle text-green-400 text-lg"></i> <span>{t.col3L2}</span></li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}