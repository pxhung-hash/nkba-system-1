// src/components/content/NewsPageContent.tsx
'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { dict } from '@/i18n/dictionaries';

export default function NewsPageContent() {
  const { lang } = useLanguage();
  const t = dict[lang].newsPage;

  return (
    <div className="bg-slate-50 min-h-screen py-16">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-black text-[#002D62] mb-2 uppercase tracking-tight">{t.title}</h1>
        <p className="text-slate-500 font-medium mb-12">{t.desc}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.items.map((n: any) => (
            <article key={n.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-shadow cursor-pointer group flex flex-col">
              <div className="h-48 overflow-hidden relative shrink-0">
                <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-[#002D62] uppercase tracking-wider shadow-sm">
                  {n.tag}
                </div>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <p className="text-xs font-bold text-slate-400 mb-3">{n.date}</p>
                <h3 className="text-xl font-black text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 mb-4">
                  {n.title}
                </h3>
                <div className="mt-auto pt-4 flex items-center text-sm font-bold text-blue-600 gap-1 group-hover:gap-2 transition-all">
                  {t.readMore} <i className="ph-bold ph-arrow-right"></i>
                </div>
              </div>
            </article>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <button className="px-8 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors">
            {t.loadMore}
          </button>
        </div>
      </div>
    </div>
  );
}