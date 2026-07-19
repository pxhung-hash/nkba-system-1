// src/app/(public)/lien-he/page.tsx
import type { Metadata } from 'next';
import ContactPageContent from '@/components/content/ContactPageContent';

export const metadata: Metadata = {
  title: 'Liên hệ | NKBA Alliance',
  description: 'Kết nối với Ban Thư ký Liên minh Kinh doanh Xây dựng Việt Nhật (NKBA) để được hỗ trợ về quy chế hội viên và hợp tác chiến lược.',
  openGraph: {
    title: 'Liên hệ | NKBA Alliance',
    description: 'Kết nối với NKBA ngay hôm nay.',
  },
};

export default function ContactPage() {
  return <ContactPageContent />;
}