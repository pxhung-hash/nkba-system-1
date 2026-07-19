// src/app/(public)/bao-mat/page.tsx
import type { Metadata } from 'next';
import PrivacyPageContent from '@/components/content/PrivacyPageContent';

export const metadata: Metadata = {
  title: 'Chính Sách Bảo Mật | NKBA Alliance',
  description: 'Cam kết bảo vệ dữ liệu doanh nghiệp và quyền riêng tư của bạn tại nền tảng kết nối NKBA.',
  openGraph: {
    title: 'Chính Sách Bảo Mật | NKBA Alliance',
    description: 'Bảo mật thông tin và dữ liệu doanh nghiệp.',
  },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPageContent />;
}