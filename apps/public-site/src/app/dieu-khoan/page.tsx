// src/app/(public)/dieu-khoan/page.tsx
import type { Metadata } from 'next';
import TermsPageContent from '@/components/content/TermsPageContent';

export const metadata: Metadata = {
  title: 'Điều Khoản Sử Dụng | NKBA Alliance',
  description: 'Các điều khoản và điều kiện khi sử dụng Nền tảng Kết nối Doanh nghiệp NKBA.',
  openGraph: {
    title: 'Điều Khoản Sử Dụng | NKBA Alliance',
    description: 'Quy định pháp lý khi tham gia hệ sinh thái NKBA.',
  },
};

export default function TermsOfServicePage() {
  return <TermsPageContent />;
}