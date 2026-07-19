import type { Metadata } from 'next';
import EventRegisterPageContent from '@/components/content/EventRegisterPageContent';

export const metadata: Metadata = {
  title: 'Đăng Ký Tham Dự Sự Kiện | NKBA Alliance',
  description: 'Đăng ký tham dự Lễ ra mắt liên minh kinh doanh xây dựng Việt Nhật NKBA.',
  openGraph: {
    title: 'Đăng Ký Tham Dự Sự Kiện | NKBA Alliance',
    description: 'Nơi kết nối các nhà lãnh đạo và doanh nghiệp Xây dựng Việt - Nhật.',
  },
};

export default function EventRegisterPage() {
  return <EventRegisterPageContent />;
}