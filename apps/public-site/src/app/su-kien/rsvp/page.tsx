// src/app/(public)/su-kien/rsvp/page.tsx
import type { Metadata } from 'next';
import RsvpPageContent from '@/components/content/RsvpPageContent';

export const metadata: Metadata = {
  title: 'Xác nhận Tham dự Sự kiện | NKBA Alliance',
  description: 'Trang phản hồi và xác nhận vé mời điện tử tham dự sự kiện của NKBA.',
  robots: {
    index: false, // Trang này có chứa token cá nhân, không nên để Google index
    follow: false,
  }
};

export default function RsvpPage() {
  return <RsvpPageContent />;
}