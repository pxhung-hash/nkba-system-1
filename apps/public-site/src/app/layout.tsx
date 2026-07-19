import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/i18n/LanguageContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
        
        {/* Wrap toàn bộ ứng dụng bằng Provider */}
        <LanguageProvider>
          <Header />
          <main className="flex-grow w-full">
            {children}
          </main>
          <Footer />
        </LanguageProvider>

      </body>
    </html>
  );
}