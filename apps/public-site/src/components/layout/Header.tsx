'use client';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function Header() {
  const { lang, setLang } = useLanguage();
  const t = dict[lang];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all relative">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-50 bg-transparent">
        
        {/* BRAND LOGO */}
        <Link href="/" className="flex items-center group">
          <img 
            src="/logo_ngang_vi.png" 
            alt="NKBA Logo" 
            className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
          />
        </Link>

        {/* MENU ĐIỀU HƯỚNG (DESKTOP) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/ve-chung-toi" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">{t.nav.about}</Link>
          <Link href="/dich-vu" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">{t.nav.ecosystem}</Link>
          {/* Bổ sung trang Sự kiện */}
          <Link href="/su-kien" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">{t.nav.events}</Link>
          <Link href="/tin-tuc" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">{t.nav.news}</Link>
          <Link href="/lien-he" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">{t.nav.contact}</Link>
        </nav>

        {/* BUTTONS & LANGUAGE SWITCHER */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/dang-ky" className="hidden lg:block text-sm font-bold text-slate-500 hover:text-[#002D62] transition-colors">
            {t.buttons?.join || "Tham gia"}
          </Link>
          <a href="https://portal.nkba.vn/login" className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#002D62] text-white text-sm font-black rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 group">
            <i className="ph-fill ph-user-circle text-lg"></i>
            <span className="hidden sm:inline">{t.buttons?.login || "Đăng nhập"}</span>
            <span className="sm:hidden">{t.buttons?.portal || "Portal"}</span>
          </a>

          {/* CHUYỂN NGÔN NGỮ (Desktop) */}
          <div className="hidden md:flex items-center gap-3 ml-2 border-l border-slate-200 pl-5">
            <button onClick={() => setLang('vi')} className={`text-sm font-bold transition-colors ${lang === 'vi' ? 'text-[#002D62]' : 'text-slate-400 hover:text-slate-800'}`}>VI</button>
            <span className="text-slate-300 text-sm">|</span>
            <button onClick={() => setLang('ja')} className={`text-sm font-bold transition-colors ${lang === 'ja' ? 'text-red-600' : 'text-slate-400 hover:text-slate-800'}`}>JP</button>
          </div>

          {/* MOBILE HAMBURGER */}
          <div className="md:hidden flex items-center ml-1">
            <label htmlFor="mobile-menu-toggle" className="p-2 -mr-2 text-slate-600 hover:text-[#002D62] cursor-pointer transition-colors">
              <i className="ph ph-list text-3xl"></i>
            </label>
          </div>
        </div>
      </div>

      <input type="checkbox" id="mobile-menu-toggle" className="hidden peer" />

      {/* DROPDOWN MENU CHO MOBILE */}
      <div className="absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-2xl hidden peer-checked:flex flex-col md:hidden z-40">
        <nav className="flex flex-col py-6 px-6 gap-6">
          <Link href="/ve-chung-toi" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
            <i className="ph ph-info text-xl text-slate-400"></i> {t.nav.about}
          </Link>
          <Link href="/dich-vu" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
            <i className="ph ph-squares-four text-xl text-slate-400"></i> {t.nav.ecosystem}
          </Link>
          {/* Bổ sung trang Sự kiện (Mobile) */}
          <Link href="/su-kien" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
            <i className="ph ph-calendar-star text-xl text-slate-400"></i> {t.nav.events}
          </Link>
          <Link href="/tin-tuc" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
            <i className="ph ph-article text-xl text-slate-400"></i> {t.nav.news}
          </Link>
          <Link href="/lien-he" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
            <i className="ph ph-phone text-xl text-slate-400"></i> {t.nav.contact}
          </Link>
          
          <div className="h-px w-full bg-slate-100 my-1"></div>
          
          <Link href="/dang-ky" className="text-base font-bold text-[#002D62] flex items-center gap-3">
            <i className="ph-fill ph-sparkle text-xl text-amber-500"></i> {t.buttons?.newMemberMobile || "Đăng ký hội viên mới"}
          </Link>

          {/* NÚT CHUYỂN NGÔN NGỮ MOBILE */}
          <div className="flex items-center gap-4 mt-2 p-4 bg-slate-50 rounded-xl">
            <span className="text-sm font-bold text-slate-500">{t.lang || "Ngôn ngữ"}:</span>
            <button onClick={() => setLang('vi')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'vi' ? 'bg-[#002D62] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>VI</button>
            <button onClick={() => setLang('ja')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${lang === 'ja' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>JP</button>
          </div>
        </nav>
      </div>
    </header>
  );
}