'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function Footer() {
  const { lang } = useLanguage();
  // Sử dụng block 'footer' thay vì 'footerSection' để lấy đúng dữ liệu 4 cột
  const t = dict[lang].footer;

  return (
    <footer className="bg-[#0b132b] text-slate-300 pt-16 pb-8 border-t-[6px] border-[#002D62]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* KHỐI 4 CỘT CHÍNH */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* CỘT 1: BRANDING & MẠNG XÃ HỘI */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#002D62] font-black text-xl">
                NK
              </div>
              <span className="font-black text-2xl text-white tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>NKBA</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed pr-4">
              {t.desc}
            </p>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center hover:bg-[#002D62] hover:text-white transition-colors cursor-pointer">
                <i className="ph-fill ph-facebook-logo text-xl"></i>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center hover:bg-[#002D62] hover:text-white transition-colors cursor-pointer">
                <i className="ph-fill ph-linkedin-logo text-xl"></i>
              </div>
            </div>
          </div>

          {/* CỘT 2: KHÁM PHÁ */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">{t.explore}</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link href="/" className="hover:text-blue-400 transition-colors">{t.home}</Link></li>
              <li><Link href="/ve-chung-toi" className="hover:text-blue-400 transition-colors">{t.aboutAlliance}</Link></li>
              <li><Link href="/dich-vu" className="hover:text-blue-400 transition-colors">{t.b2bEco}</Link></li>
            </ul>
          </div>

          {/* CỘT 3: PORTAL */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">{t.portalTitle}</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="https://portal.nkba.vn/login" className="hover:text-blue-400 transition-colors">{t.memberLogin}</a></li>
              <li><Link href="/dang-ky" className="hover:text-blue-400 transition-colors">{t.newMember}</Link></li>
              <li><Link href="/huong-dan" className="hover:text-blue-400 transition-colors">{t.guide}</Link></li>
            </ul>
          </div>

          {/* CỘT 4: LIÊN HỆ */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">{t.contactTitle}</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-start gap-3">
                <i className="ph-fill ph-map-pin text-xl text-blue-500 mt-0.5 shrink-0"></i>
                <span className="leading-relaxed">{t.address}</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="ph-fill ph-envelope-simple text-xl text-blue-500 shrink-0"></i>
                <span>contact@nkba.vn</span>
              </li>
            </ul>
          </div>

        </div>

        {/* BOTTOM BAR: BẢN QUYỀN & CHÍNH SÁCH */}
        <div className="pt-8 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
          <p>© {new Date().getFullYear()} {t.rights}</p>
          <div className="flex gap-6">
            <Link href="/dieu-khoan" className="hover:text-slate-300 transition-colors">{t.terms}</Link>
            <Link href="/bao-mat" className="hover:text-slate-300 transition-colors">{t.privacy}</Link>
          </div>
        </div>
        
      </div>
    </footer>
  );
}