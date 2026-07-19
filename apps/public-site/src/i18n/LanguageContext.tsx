'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'vi' | 'ja';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'vi',
  setLang: () => {},
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>('vi');
  // 1. Thêm biến kiểm tra xem Component đã được render trên Client hay chưa
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // 2. Bật cờ mounted khi chạy trên trình duyệt
    setIsMounted(true); 
    
    const savedLang = localStorage.getItem('nkba_lang') as Lang;
    if (savedLang && (savedLang === 'vi' || savedLang === 'ja')) {
      setLangState(savedLang);
      document.documentElement.lang = savedLang; // Cập nhật thẻ html ngay khi load
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem('nkba_lang', newLang);
    document.documentElement.lang = newLang;
  };

  // 3. Nếu chưa mount xong (đang ở Server), không render để tránh lỗi Hydration
  if (!isMounted) {
    return null; // Anh có thể thay null bằng một <div className="h-screen bg-white"></div> nếu muốn
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);