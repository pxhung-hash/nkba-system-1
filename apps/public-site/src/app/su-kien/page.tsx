import type { Metadata } from 'next';
import EventsPageContent from '@/components/content/EventsPageContent';

export const metadata: Metadata = {
  title: 'Sự kiện & Hội thảo | NKBA Alliance',
  description: 'Tham gia các sự kiện, hội thảo chuyên đề, B2B Matching và Networking độc quyền dành cho cộng đồng Xây dựng Việt - Nhật do NKBA tổ chức.',
  openGraph: {
    title: 'Sự kiện & Hội thảo | NKBA Alliance',
    description: 'Nơi kết nối các nhà lãnh đạo và doanh nghiệp Xây dựng Việt - Nhật.',
  },
};

export default function EventsPage() {
  return <EventsPageContent />;
}