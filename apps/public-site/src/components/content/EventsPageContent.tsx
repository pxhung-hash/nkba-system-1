'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function EventsPageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].eventsPage;
  const launch = t.launchEvent;

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      
      {/* HERO SECTION */}
      <div className="bg-[#002D62] pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2000&auto=format&fit=crop')] opacity-10 bg-cover bg-center"></div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-6 uppercase">
            {t.title}
          </h1>
          <p className="text-lg md:text-xl text-blue-100 font-medium leading-relaxed max-w-3xl mx-auto">
            {t.desc}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-16">
        
        {/* SỰ KIỆN NỔI BẬT: LỄ RA MẮT */}
        <div className="mb-20">
          <h2 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3 border-l-4 border-[#D4AF37] pl-4">
            <i className="ph-fill ph-rocket-launch text-[#BE0027]"></i> {t.upcomingTab}
          </h2>
          
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 relative overflow-hidden">
            {/* Decors */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-[#BE0027] opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute left-0 bottom-0 w-40 h-40 bg-[#002D62] opacity-[0.03] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
            
            {/* Header Sự kiện */}
            <div className="p-8 md:p-12 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-[#002D62] rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-blue-100">
                  <i className="ph-fill ph-star"></i> {launch.tag}
                </div>
                <h3 className="text-3xl md:text-4xl font-heading font-black text-[#002D62] mb-2">{launch.title}</h3>
                <p className="text-slate-500 font-medium text-lg">{launch.subtitle}</p>
              </div>

              <div className="flex flex-wrap gap-4 text-left shrink-0">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[140px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{launch.dateLabel}</p>
                  <p className="font-bold text-[#BE0027] text-lg">{launch.date}</p>
                  <p className="text-sm text-slate-600 font-medium">{launch.time}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[140px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{launch.locationLabel}</p>
                  <p className="font-bold text-[#002D62] text-lg">{launch.location1}</p>
                  <p className="text-sm text-slate-600 font-medium">{launch.location2}</p>
                </div>
              </div>
            </div>

            {/* Thông tin & Agenda */}
            <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
              
              {/* Cột trái: Overview */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-[#002D62] rounded-xl flex items-center justify-center text-2xl shrink-0"><i className="ph-fill ph-users-three"></i></div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">{launch.scaleLabel}</h4>
                    <p className="text-2xl font-black text-[#002D62]"><span className="text-3xl">{launch.scale1}</span><span className="text-base font-medium text-slate-500">{launch.scale2}</span></p>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-2xl shrink-0"><i className="ph-fill ph-martini"></i></div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">{launch.formatLabel}</h4>
                    <p className="text-lg font-bold text-slate-700">{launch.format}</p>
                  </div>
                </div>

                {/* LOGIC NÚT ĐĂNG KÝ ĐƯỢC CẬP NHẬT Ở ĐÂY */}
                <div className="pt-6">
                  <Link href="/su-kien/dang-ky" className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-slate-900 font-black rounded-xl hover:scale-105 transition-transform shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2">
                    {t.registerBtn} <i className="ph-bold ph-arrow-right"></i>
                  </Link>
                  <p className="text-center text-xs text-slate-400 mt-4">* Sự kiện giới hạn số lượng khách mời (Invite-only).</p>
                </div>
              </div>

              {/* Cột phải: Agenda Timeline */}
              <div className="lg:col-span-7">
                <h4 className="font-heading font-black text-xl text-slate-900 mb-8 flex items-center gap-2">
                  <i className="ph-fill ph-calendar-check text-[#BE0027]"></i> {launch.agendaTitle}
                </h4>
                
                <div className="relative border-l-2 border-slate-100 ml-3 space-y-8 pb-4">
                  {launch.agenda.map((item: any, idx: number) => (
                    <div key={idx} className="relative pl-8">
                      {/* Timeline Dot */}
                      <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm ${idx === 3 ? 'bg-[#D4AF37]' : idx === 1 ? 'bg-[#BE0027]' : 'bg-[#002D62]'}`}></div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
                        <span className={`font-black text-lg ${idx === 3 ? 'text-[#D4AF37]' : idx === 1 ? 'text-[#BE0027]' : 'text-[#002D62]'}`}>
                          {item.time}
                        </span>
                        <h5 className="font-bold text-slate-800 text-lg">{item.title}</h5>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}