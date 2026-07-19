// src/app/(public)/ve-chung-toi/page.tsx
import type { Metadata } from 'next';
import AboutPageContent from '@/components/content/AboutPageContent';

export const metadata: Metadata = {
  title: 'Về Chúng Tôi | NKBA Alliance - Liên minh Xây dựng Việt Nhật',
  description: 'Nichietsu Kensetsu Business Alliance (NKBA) là cầu nối chiến lược, kiến tạo hệ sinh thái bền vững cho các doanh nghiệp Xây dựng và Bất động sản Việt Nam - Nhật Bản.',
  openGraph: {
    title: 'Về Chúng Tôi | NKBA Alliance',
    description: 'Tìm hiểu về sứ mệnh và tầm nhìn của Liên minh Kinh doanh Xây dựng Việt Nhật.',
    images: ['https://nkba.vn/og-about.png'], // Thay bằng ảnh thật của anh
  },
};

export default function AboutPage() {
  return <AboutPageContent />;
}