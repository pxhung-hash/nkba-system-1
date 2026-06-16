import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "NKBA Digital Sales Kit - Hồ Sơ Năng Lực",
  description: "Liên minh Kinh doanh Xây dựng Việt - Nhật. Nền tảng kết nối giao thương chuyên nghiệp.",
  metadataBase: new URL('https://nkba.vn'), 
  openGraph: {
    title: "NKBA Digital Sales Kit - Hồ Sơ Năng Lực",
    description: "Liên minh Kinh doanh Xây dựng Việt - Nhật",
    url: 'https://nkba.vn',
    siteName: 'NKBA Alliance',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NKBA Alliance',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  icons: {
    icon: '/icon.png', 
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <script src="https://unpkg.com/@phosphor-icons/web" async></script>
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Montserrat:wght@400;700;900&family=Roboto+Slab:wght@400;700;900&display=swap" rel="stylesheet" />
        
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-inter: 'Inter', sans-serif;
            --font-montserrat: 'Montserrat', sans-serif;
            --font-roboto-slab: 'Roboto Slab', serif;
          }
        `}} />
      </head>
      <body className="bg-white text-slate-800 font-sans antialiased overflow-x-hidden flex flex-col min-h-screen">
        
        {/* HEADER CÔNG CỘNG */}
        <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm transition-all relative">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-50 bg-transparent">
            
            {/* 1. BRAND LOGO */}
            <Link href="/" className="flex items-center group">
              <img 
                src="/logo_ngang_vi.png" 
                alt="NKBA Logo" 
                className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            </Link>

            {/* 2. MENU ĐIỀU HƯỚNG (Chỉ hiện trên Desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/ve-chung-toi" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">Về chúng tôi</Link>
              <Link href="/dich-vu" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">Hệ sinh thái</Link>
              <Link href="/tin-tuc" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">Tin tức</Link>
              <Link href="/lien-he" className="text-sm font-bold text-slate-600 hover:text-[#002D62] transition-colors">Liên hệ</Link>
            </nav>

            {/* 3. NÚT ĐĂNG KÝ & ĐĂNG NHẬP */}
            <div className="flex items-center gap-3 sm:gap-5">
              <Link href="/dang-ky" className="hidden lg:block text-sm font-bold text-slate-500 hover:text-[#002D62] transition-colors">
                Trở thành hội viên
              </Link>
              <a href="https://portal.nkba.vn/login" className="px-5 py-2.5 sm:px-6 sm:py-3 bg-[#002D62] text-white text-sm font-black rounded-xl hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2 group">
                <i className="ph-fill ph-user-circle text-lg"></i>
                <span className="hidden sm:inline">Đăng nhập Portal</span>
                <span className="sm:hidden">Portal</span>
              </a>

              {/* 4. NÚT HAMBURGER MENU (Chỉ hiện trên Mobile) */}
              <div className="md:hidden flex items-center ml-1">
                <label htmlFor="mobile-menu-toggle" className="p-2 -mr-2 text-slate-600 hover:text-[#002D62] cursor-pointer transition-colors">
                  <i className="ph ph-list text-3xl"></i>
                </label>
              </div>
            </div>

          </div>

          {/* INPUT ẨN ĐỂ TRIGGER MENU CSS */}
          <input type="checkbox" id="mobile-menu-toggle" className="hidden peer" />

          {/* 5. DROPDOWN MENU CHO MOBILE */}
          <div className="absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-2xl hidden peer-checked:flex flex-col md:hidden z-40">
            <nav className="flex flex-col py-6 px-6 gap-6">
              <Link href="/ve-chung-toi" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
                <i className="ph ph-info text-xl text-slate-400"></i> Về chúng tôi
              </Link>
              <Link href="/dich-vu" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
                <i className="ph ph-squares-four text-xl text-slate-400"></i> Hệ sinh thái
              </Link>
              <Link href="/tin-tuc" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
                <i className="ph ph-article text-xl text-slate-400"></i> Tin tức
              </Link>
              <Link href="/lien-he" className="text-base font-bold text-slate-700 hover:text-[#002D62] flex items-center gap-3">
                <i className="ph ph-phone text-xl text-slate-400"></i> Liên hệ
              </Link>
              
              <div className="h-px w-full bg-slate-100 my-1"></div>
              
              <Link href="/dang-ky" className="text-base font-bold text-[#002D62] flex items-center gap-3">
                <i className="ph-fill ph-sparkle text-xl text-amber-500"></i> Trở thành hội viên mới
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-grow w-full">
          {children}
        </main>

        {/* FOOTER */}
        <footer className="bg-[#0b132b] text-slate-300 pt-16 pb-8 border-t-[6px] border-[#002D62]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#002D62] font-black text-xl">
                    NK
                  </div>
                  <span className="font-black text-2xl text-white tracking-tight" style={{ fontFamily: 'var(--font-montserrat)' }}>NKBA</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Liên minh Kinh doanh Xây dựng Việt - Nhật. Nền tảng kết nối giao thương chuyên nghiệp.
                </p>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                    <i className="ph-fill ph-facebook-logo text-xl"></i>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-700 hover:text-white transition-colors cursor-pointer">
                    <i className="ph-fill ph-linkedin-logo text-xl"></i>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Khám phá</h4>
                <ul className="space-y-4 text-sm font-medium">
                  <li><Link href="/" className="hover:text-blue-400 transition-colors">Trang chủ</Link></li>
                  <li><Link href="/ve-chung-toi" className="hover:text-blue-400 transition-colors">Về liên minh</Link></li>
                  <li><Link href="/dich-vu" className="hover:text-blue-400 transition-colors">Hệ sinh thái B2B</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Portal</h4>
                <ul className="space-y-4 text-sm font-medium">
                  <li><a href="https://portal.nkba.vn/login" className="hover:text-blue-400 transition-colors">Đăng nhập thành viên</a></li>
                  <li><Link href="/dang-ky" className="hover:text-blue-400 transition-colors">Đăng ký hội viên mới</Link></li>
                  <li><Link href="/huong-dan" className="hover:text-blue-400 transition-colors">Hướng dẫn sử dụng</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Liên hệ</h4>
                <ul className="space-y-4 text-sm font-medium">
                  <li className="flex items-start gap-3">
                    <i className="ph-fill ph-map-pin text-xl text-blue-500 mt-0.5"></i>
                    <span>14-15A, Tầng 7, Tòa nhà Charmvit, Số 117 Trần Duy Hưng, phường Yên Hòa, Hà Nội</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <i className="ph-fill ph-envelope-simple text-xl text-blue-500"></i>
                    <span>contact@nkba.vn</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-slate-500">
              <p>© {new Date().getFullYear()} NKBA Alliance. All rights reserved.</p>
              <div className="flex gap-6">
                <Link href="/dieu-khoan" className="hover:text-slate-300 transition-colors">Điều khoản</Link>
                <Link href="/bao-mat" className="hover:text-slate-300 transition-colors">Bảo mật</Link>
              </div>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}