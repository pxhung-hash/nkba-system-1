// src/app/(public)/huong-dan/page.tsx
import type { Metadata } from 'next';
import GuidePageContent from '@/components/content/GuidePageContent';

export const metadata: Metadata = {
  title: 'Hướng dẫn sử dụng Portal | NKBA Alliance',
  description: 'Khám phá cách tối ưu hóa hồ sơ và tận dụng tối đa hệ sinh thái kết nối doanh nghiệp của NKBA.',
  openGraph: {
    title: 'Hướng dẫn sử dụng Portal | NKBA Alliance',
    description: 'Tối ưu hóa hồ sơ doanh nghiệp của bạn trên NKBA.',
  },
};

export default function GuidePage() {
  return <GuidePageContent />;
}