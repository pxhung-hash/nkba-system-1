import { dict } from '@/i18n/dictionaries';

interface CoreValuesProps {
  lang: 'vi' | 'ja';
}

export default function CoreValues({ lang }: CoreValuesProps) {
  const t = dict[lang].coreValuesSection;

  const values = [
    { title: t.v1Title, sub: t.v1Sub, icon: "ph-shield-check", color: "text-[#002D62]", bg: "bg-blue-50" },
    { title: t.v2Title, sub: t.v2Sub, icon: "ph-pencil-ruler", color: "text-[#BE0027]", bg: "bg-red-50" },
    { title: t.v3Title, sub: t.v3Sub, icon: "ph-briefcase", color: "text-slate-700", bg: "bg-slate-100" },
    { title: t.v4Title, sub: t.v4Sub, icon: "ph-infinity", color: "text-[#D4AF37]", bg: "bg-yellow-50" }
  ];

  return (
    <section id="core-values" className="py-24 bg-white border-t border-slate-100">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="font-heading font-black text-3xl text-slate-900">{t.title}</h2>
          <div className="w-20 h-1 bg-[#D4AF37] mx-auto mt-6 rounded-full"></div>
        </div>
        <div className="grid md:grid-cols-4 gap-8">
          {values.map((val, idx) => (
            <div key={idx} className="bg-white border border-slate-100 p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-center group" data-aos="fade-up" data-aos-delay={idx * 100}>
              <div className={`w-20 h-20 mx-auto ${val.bg} ${val.color} rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:-translate-y-2 transition-transform duration-300`}><i className={`ph ${val.icon}`}></i></div>
              <h3 className="font-black text-xl text-slate-900 mb-2 tracking-wide">{val.title}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{val.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}