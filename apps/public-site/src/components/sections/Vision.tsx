import { dict } from '@/i18n/dictionaries';

// Khai báo kiểu dữ liệu cho props nhận vào
interface VisionProps {
  lang: 'vi' | 'ja';
}

export default function Vision({ lang }: VisionProps) {
  // Lấy data từ điển dựa trên ngôn ngữ hiện tại
  const t = dict[lang].visionSection;

  return (
    <section id="vision" className="py-32 bg-slate-50 relative">
      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-20" data-aos="fade-up">
          <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs">{t.tag}</span>
          <h2 className="font-heading font-black text-4xl text-slate-900 mt-2 tracking-tight">{t.title}</h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Mission Card */}
          <div className="bg-gradient-to-br from-[#002D62] to-slate-900 rounded-3xl p-10 md:p-14 shadow-2xl text-center relative z-20" data-aos="fade-up">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center text-4xl text-[#D4AF37] mx-auto mb-6 backdrop-blur-md rotate-3">
              <i className="ph ph-target"></i>
            </div>
            <h3 className="font-heading font-black text-3xl mb-6 text-white uppercase tracking-widest">{t.missionTitle}</h3>
            <p className="text-slate-300 text-lg leading-relaxed font-light md:px-10">
              {t.missionP1}
              <strong className="text-white font-bold">{t.missionHighlight}</strong>
              {t.missionP2}
            </p>
          </div>

          {/* Vision Card */}
          <div className="bg-white rounded-3xl p-10 md:p-14 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] text-center relative z-10 -mt-10 pt-20 border border-slate-100" data-aos="fade-up" data-aos-delay="100">
            <div className="w-16 h-16 bg-red-50 text-[#BE0027] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 -rotate-3">
              <i className="ph ph-eye"></i>
            </div>
            <h3 className="font-heading font-black text-2xl mb-6 text-slate-900 uppercase tracking-widest">{t.visionTitle}</h3>
            <p className="text-slate-600 text-lg leading-relaxed md:px-10">
              {t.visionP1}
              <strong className="text-[#BE0027]">{t.visionHighlight}</strong>
              {t.visionP2}
            </p>
          </div>
        </div>
        
      </div>
    </section>
  );
}