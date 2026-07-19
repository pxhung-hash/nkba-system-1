'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import 'aos/dist/aos.css';

import { useLanguage } from '@/i18n/LanguageContext'; // <--- Import hook mới

import Hero from '@/components/sections/Hero';
import Vision from '@/components/sections/Vision';
import CoreValues from '@/components/sections/CoreValues';
import Ecosystem from '@/components/sections/Ecosystem';
import Membership from '@/components/sections/Membership';

export default function PublicSite() {
  const router = useRouter();
  const { lang } = useLanguage(); // <--- Lấy ngôn ngữ hiện tại đang bấm chọn trên header

  useEffect(() => {
    const initAOS = async () => {
      const AOS = (await import('aos')).default;
      AOS.init({ duration: 800, once: true });
    };
    initAOS();
  }, []);

  const handleJoinClick = () => {
    router.push('/dang-ky');
  };

  return (
    <>
      {/* Truyền biến 'lang' xuống để các Component con tự load từ điển */}
      <Hero lang={lang} openRegisterModal={handleJoinClick} />
      <Vision lang={lang} />
      <CoreValues lang={lang} />
      <Ecosystem lang={lang} />
      <Membership lang={lang} openRegisterModal={handleJoinClick} />
    </>
  );
}