'use client'

import { dict } from '@/i18n/dictionaries';

interface MembershipProps {
  lang: 'vi' | 'ja';
  openRegisterModal: (tier: string) => void;
}

export default function Membership({ lang, openRegisterModal }: MembershipProps) {
  const t = dict[lang].membershipSection;

  return (
    <section id="membership" className="py-32 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        
        {/* TIÊU ĐỀ */}
        <div className="text-center mb-20">
          <h2 className="font-heading font-black text-4xl text-slate-900 uppercase tracking-tight">{t.title}</h2>
          <p className="text-slate-500 mt-4 text-lg">
            {t.sub1} <br className="hidden md:block"/>
            <span className="font-bold text-rose-500">{t.sub2}</span>
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8 items-center">
          
          {/* 1. GÓI FREE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-lg hover:shadow-xl transition-shadow relative">
            <h4 className="font-bold text-lg text-slate-500 uppercase tracking-widest mb-2">{t.freeTag}</h4>
            <div className="text-4xl font-black text-slate-900 mb-2">{t.freePrice}</div>
            <p className="text-sm text-slate-400 mb-8 pb-8 border-b border-slate-100">{t.freeSub}</p>
            
            <ul className="space-y-4 text-sm text-slate-600 text-left mb-10 min-h-[160px]">
              <li className="flex items-center gap-3"><i className="ph ph-check text-green-500 text-lg shrink-0"></i> {t.freeL1}</li>
              <li className="flex items-center gap-3"><i className="ph ph-check text-green-500 text-lg shrink-0"></i> {t.freeL2}</li>
              <li className="flex items-center gap-3 text-slate-400 opacity-50"><i className="ph ph-x text-lg shrink-0"></i> {t.freeL3}</li>
              <li className="flex items-center gap-3 text-slate-400 opacity-50"><i className="ph ph-x text-lg shrink-0"></i> {t.freeL4}</li>
            </ul>
            <button onClick={() => openRegisterModal('Registered')} className="w-full py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all">{t.freeBtn}</button>
          </div>

          {/* 2. GÓI VIP */}
          <div className="bg-gradient-to-b from-[#002D62] to-slate-900 text-white rounded-3xl p-1 p-12 text-center shadow-2xl shadow-blue-900/30 ring-2 ring-[#D4AF37] transform lg:-translate-y-4 relative z-20">
            {/* Tag Nổi bật */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-slate-900 text-xs font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">{t.vipBadge}</div>
            
            <h4 className="font-bold text-lg text-[#D4AF37] uppercase tracking-widest mb-4">{t.vipTag}</h4>
            
            {/* Khối Giá Khuyến Mãi */}
            <div className="flex flex-col items-center justify-center mb-6">
              <span className="text-white/50 line-through text-lg font-medium decoration-rose-500 decoration-2 mb-1">{t.vipOldPrice}</span>
              <div className="text-5xl font-black text-white mb-3">{t.vipPrice}<span className="text-2xl ml-1">{t.vipUnit}</span></div>
              <p className="text-xs text-slate-900 font-black bg-[#D4AF37] py-1.5 px-4 rounded-full shadow-md">
                {t.vipPromo}
              </p>
            </div>

            <ul className="space-y-4 text-sm text-slate-200 text-left mb-8 min-h-[160px]">
              <li className="flex items-center gap-3"><i className="ph-fill ph-check-circle text-[#D4AF37] text-xl shrink-0"></i> <strong className="text-white">{t.vipL1}</strong></li>
              <li className="flex items-center gap-3"><i className="ph-fill ph-check-circle text-[#D4AF37] text-xl shrink-0"></i> <strong className="text-white">{t.vipL2}</strong></li>
              <li className="flex items-center gap-3"><i className="ph-fill ph-check-circle text-[#D4AF37] text-xl shrink-0"></i> {t.vipL3}</li>
              <li className="flex items-center gap-3"><i className="ph-fill ph-check-circle text-[#D4AF37] text-xl shrink-0"></i> {t.vipL4}</li>
            </ul>
            
            <button onClick={() => openRegisterModal('Official')} className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-yellow-500 text-slate-900 font-black text-lg rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-[#D4AF37]/30">{t.vipBtn}</button>
            <p className="text-[10px] text-white/40 mt-4">{t.vipNote}</p>
          </div>

          {/* 3. GÓI ĐỐI TÁC CHIẾN LƯỢC */}
          <div className="bg-gradient-to-br from-[#D4AF37]/5 to-transparent border border-[#D4AF37]/30 rounded-3xl p-10 text-center shadow-lg hover:shadow-xl transition-shadow relative">
            <h4 className="font-bold text-lg text-[#D4AF37] uppercase tracking-widest mb-2">{t.partnerTag}</h4>
            <div className="text-4xl font-black text-slate-900 mb-2">{t.partnerPrice}<span className="text-2xl">{t.partnerUnit}</span></div>
            <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">{t.partnerSub}</p>
            
            <ul className="space-y-4 text-sm text-slate-600 text-left mb-10 min-h-[160px]">
              <li className="flex items-center gap-3"><i className="ph-fill ph-star text-[#D4AF37] text-lg shrink-0"></i> <strong className="text-slate-900">{t.partnerL1}</strong></li>
              <li className="flex items-center gap-3"><i className="ph-fill ph-star text-[#D4AF37] text-lg shrink-0"></i> <strong className="text-slate-900">{t.partnerL2}</strong></li>
              <li className="flex items-center gap-3"><i className="ph-fill ph-star text-[#D4AF37] text-lg shrink-0"></i> {t.partnerL3}</li>
              <li className="flex items-center gap-3"><i className="ph-fill ph-star text-[#D4AF37] text-lg shrink-0"></i> {t.partnerL4}</li>
            </ul>
            <button onClick={() => openRegisterModal('Strategic')} className="w-full py-4 bg-slate-900 text-[#D4AF37] font-bold rounded-xl hover:bg-slate-800 transition-all">{t.partnerBtn}</button>
          </div>
          
        </div>
      </div>
    </section>
  );
}