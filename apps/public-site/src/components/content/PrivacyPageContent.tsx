// src/components/content/PrivacyPageContent.tsx
'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function PrivacyPageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].privacyPage;

  return (
    <div className="min-h-screen bg-slate-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-[#002D62] tracking-tight mb-4 uppercase">
            {t.title}
          </h1>
          <p className="text-lg text-slate-500">
            {t.desc}
          </p>
        </div>

        {/* NỘI DUNG */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm space-y-10 text-slate-600 leading-relaxed">
          
          <section>
            <p className="mb-4">
              {t.intro1}<strong>{t.introBold}</strong>{t.intro2}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s1Title}</h2>
            <p className="mb-2">{t.s1Desc}</p>
            <ul className="list-disc pl-5 space-y-3">
              <li><strong>{t.s1L1B}</strong>{t.s1L1}</li>
              <li><strong>{t.s1L2B}</strong>{t.s1L2}</li>
              <li><strong>{t.s1L3B}</strong>{t.s1L3}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s2Title}</h2>
            <ul className="list-disc pl-5 space-y-3">
              <li>{t.s2L1}</li>
              <li>{t.s2L2}</li>
              <li>{t.s2L3}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s3Title}</h2>
            <p className="mb-3">
              {t.s3P1A}<strong>{t.s3P1B}</strong>{t.s3P1C}
            </p>
            <p>{t.s3P2}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s4Title}</h2>
            <p>{t.s4Desc}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s5Title}</h2>
            <p>{t.s5Desc}</p>
          </section>

          <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 mt-8">
            <h3 className="font-bold text-blue-800 mb-2">{t.contactTitle}</h3>
            <p className="text-sm text-blue-700">
              {t.contactDesc1} <strong className="font-black">{t.contactEmail}</strong>
            </p>
          </section>

        </div>

        <div className="mt-8 text-center">
          <Link href="/dieu-khoan" className="text-slate-400 font-bold hover:text-slate-600 transition-colors">
            {t.backBtn}
          </Link>
        </div>

      </div>
    </div>
  );
}