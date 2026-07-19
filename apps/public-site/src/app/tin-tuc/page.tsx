// src/app/(public)/tin-tuc/page.tsx
import type { Metadata } from 'next';
import NewsPageContent from '@/components/content/NewsPageContent';

export const metadata: Metadata = {
  title: 'Tin tức & Thông cáo | NKBA Alliance',
  description: 'Cập nhật những chuyển động mới nhất từ Liên minh Kinh doanh Xây dựng Việt Nhật và thị trường.',
  openGraph: {
    title: 'Tin tức | NKBA Alliance',
    description: 'Tin tức, sự kiện và xu hướng thị trường xây dựng Việt Nam - Nhật Bản.',
  },
};

export default function NewsPage() {
  return <NewsPageContent />;
}