// src/components/content/TermsPageContent.tsx
'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function TermsPageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].termsPage;

  return (
    <div className="min-h-screen bg-slate-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-[#002D62] tracking-tight mb-4 uppercase">
            {t.title}
          </h1>
          <p className="text-lg text-slate-500">
            {t.lastUpdated}
          </p>
        </div>

        {/* NỘI DUNG */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm space-y-10 text-slate-600 leading-relaxed">
          
          <section>
            <p className="mb-4">
              {t.intro}
              <strong>{t.introBold}</strong>
              {t.introEnd}
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s1Title}</h2>
            <ul className="list-disc pl-5 space-y-3">
              <li>{t.s1L1}</li>
              <li>{t.s1L2}</li>
              <li>{t.s1L3}</li>
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
            <ul className="list-disc pl-5 space-y-3">
              <li>{t.s3L1}</li>
              <li>{t.s3L2}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s4Title}</h2>
            <p>{t.s4Desc}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">{t.s5Title}</h2>
            <p>{t.s5Desc}</p>
          </section>

        </div>

        <div className="mt-8 text-center">
          <Link href="/bao-mat" className="text-blue-600 font-bold hover:underline flex items-center justify-center gap-2">
            {t.privacyLink} <i className="ph-bold ph-arrow-right"></i>
          </Link>
        </div>

      </div>
    </div>
  );
}