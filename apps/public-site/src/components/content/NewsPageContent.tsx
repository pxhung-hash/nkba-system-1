'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function NewsPageContent() {
  const supabase = createClient();
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublishedNews = async () => {
      // Truy vấn các bài viết đã được Xuất bản từ Admin
      const { data } = await supabase
        .from('news')
        .select('id, title, slug, excerpt, thumbnail_url, published_at')
        .eq('status', 'PUBLISHED')
        .order('published_at', { ascending: false }); // Bài mới nhất lên đầu
      
      if (data) setNews(data);
      setIsLoading(false);
    };

    fetchPublishedNews();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* Banner / Header */}
      <div className="bg-[#002D62] text-white py-20 px-4 text-center">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight mb-4">
          Tin tức & Sự kiện
        </h1>
        <p className="text-blue-200 text-sm md:text-base max-w-2xl mx-auto font-medium">
          Cập nhật những thông tin mới nhất về hoạt động, dự án và các sự kiện nổi bật của Liên minh Xây dựng Việt Nhật (NKBA).
        </p>
      </div>

      {/* Tin tức nổi bật & Danh sách */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-10">
        {isLoading ? (
          <div className="text-center py-20 text-slate-500 font-bold animate-pulse bg-white rounded-2xl shadow-sm border border-slate-200">
            Đang tải dữ liệu bản tin...
          </div>
        ) : news.length === 0 ? (
          <div className="bg-white p-16 rounded-2xl shadow-sm text-center text-slate-500 border border-slate-200">
            <i className="ph-fill ph-newspaper text-6xl text-slate-300 mb-4 block"></i>
            <p className="text-lg font-bold text-slate-700">Chưa có bài viết nào được xuất bản.</p>
            <p className="text-sm mt-2">Vui lòng quay lại sau để cập nhật các tin tức mới nhất từ NKBA.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.map((item) => (
              <Link 
                href={`/tin-tuc/${item.slug}`} 
                key={item.id} 
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 flex flex-col"
              >
                {/* Ảnh bìa */}
                <div className="w-full h-56 bg-slate-200 overflow-hidden relative">
                  {item.thumbnail_url ? (
                    <img 
                      src={item.thumbnail_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100">
                      <i className="ph-fill ph-image text-4xl"></i>
                    </div>
                  )}
                  {/* Badge ngày tháng */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#002D62] px-3 py-1.5 rounded-lg text-xs font-black shadow-sm">
                    {new Date(item.published_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                {/* Nội dung */}
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-slate-900 leading-snug mb-3 group-hover:text-blue-700 transition-colors line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-1">
                    {item.excerpt || 'Đang cập nhật nội dung mô tả...'}
                  </p>
                  <div className="mt-auto flex items-center text-sm font-bold text-[#D4AF37] uppercase tracking-wider group-hover:text-amber-500 transition-colors">
                    Xem chi tiết <i className="ph-bold ph-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}