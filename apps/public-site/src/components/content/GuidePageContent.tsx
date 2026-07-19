// src/components/content/GuidePageContent.tsx
'use client';

import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function GuidePageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].guidePage;

  return (
    <div className="min-h-screen bg-slate-50 py-20">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-5xl font-black text-[#002D62] tracking-tight mb-4 uppercase">
            {t.title} <br className="md:hidden" /> {t.titleBreak}
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {t.desc}
          </p>
        </div>

        {/* NỘI DUNG HƯỚNG DẪN */}
        <div className="bg-white rounded-[2rem] p-8 md:p-12 border border-slate-200 shadow-sm space-y-12">
          
          {/* PHẦN 1 */}
          <section>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-lg shrink-0">1</span>
              {t.step1Title}
            </h2>
            <div className="text-slate-600 space-y-4 leading-relaxed pl-14">
              <p>{t.step1Desc}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t.step1L1}</li>
                <li>{t.step1L2}</li>
                <li>{t.step1L3}</li>
                <li>{t.step1L4}</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* PHẦN 2 */}
          <section>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-lg shrink-0">2</span>
              {t.step2Title}
            </h2>
            <div className="text-slate-600 space-y-4 leading-relaxed pl-14">
              <p>{t.step2Desc}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-slate-800">{t.step2L1Tag}</strong>{t.step2L1}</li>
                <li>
                  <strong className="text-slate-800">{t.step2L2Tag}</strong> 
                  <em className="text-rose-500 text-sm ml-1">{t.step2L2Note}</em> 
                  {t.step2L2}
                </li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* PHẦN 3 */}
          <section>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center text-lg shrink-0">3</span>
              {t.step3Title}
            </h2>
            <div className="text-slate-600 space-y-4 leading-relaxed pl-14">
              <p>{t.step3Desc}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>{t.step3L1}</li>
                <li>{t.step3L2}</li>
              </ul>
            </div>
          </section>

          <hr className="border-slate-100" />

          {/* PHẦN 4 */}
          <section>
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-lg shrink-0">4</span>
              {t.step4Title}
            </h2>
            <div className="text-slate-600 space-y-4 leading-relaxed pl-14">
              <p>{t.step4Desc}</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  {t.step4L1A}
                  <Link href="/dich-vu" className="text-blue-600 hover:underline font-bold">{t.step4L1Link}</Link>
                  {t.step4L1B}
                </li>
                <li>{t.step4L2}</li>
                <li>{t.step4L3}</li>
              </ul>
            </div>
          </section>

        </div>

        {/* CALL TO ACTION TRỢ GIÚP */}
        <div className="mt-12 text-center bg-[#002D62] rounded-3xl p-10 text-white shadow-xl">
          <h3 className="text-2xl font-black mb-4">{t.ctaTitle}</h3>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
            {t.ctaDesc}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/lien-he" className="bg-amber-500 text-[#002D62] px-8 py-3 rounded-xl font-bold hover:bg-amber-400 transition-colors">
              {t.ctaBtn}
            </Link>
            <a href="mailto:info@nkba.vn" className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold hover:bg-white/20 border border-white/20 transition-colors">
              info@nkba.vn
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}