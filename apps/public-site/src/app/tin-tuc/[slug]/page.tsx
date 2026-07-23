'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const supabase = createClient();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    
    const fetchPostDetail = async () => {
      // Truy vấn bài viết từ DB dựa vào slug trên URL
      const { data } = await supabase
        .from('news')
        .select('*, author:author_id(name)')
        .eq('slug', slug)
        .eq('status', 'PUBLISHED')
        .single();

      if (data) setPost(data);
      setIsLoading(false);
    };

    fetchPostDetail();
  }, [slug, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-bold animate-pulse text-lg tracking-widest uppercase">
          Đang tải nội dung...
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center space-y-4 px-4 bg-slate-50">
        <i className="ph-fill ph-file-dashed text-7xl text-slate-300"></i>
        <h1 className="text-3xl font-black text-[#002D62]">Không tìm thấy bài viết!</h1>
        <p className="text-slate-500 font-medium">Bài viết này có thể đã bị xóa hoặc chưa được xuất bản.</p>
        <Link href="/tin-tuc" className="mt-4 px-8 py-3 bg-amber-500 hover:bg-amber-400 text-[#002D62] rounded-xl font-black transition-colors">
          Quay lại danh sách Tin tức
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh] bg-slate-900 overflow-hidden flex items-end">
        {post.thumbnail_url ? (
          <img 
            src={post.thumbnail_url} 
            alt={post.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
        ) : (
          <div className="absolute inset-0 bg-[#002D62] opacity-95"></div>
        )}
        
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 pb-12">
          <Link href="/tin-tuc" className="inline-flex items-center gap-2 text-blue-200 hover:text-white font-bold text-sm mb-6 transition-colors bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10">
            <i className="ph-bold ph-arrow-left"></i> Trở về danh mục
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6 drop-shadow-lg">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-blue-100 text-sm font-medium bg-black/20 w-fit px-4 py-2 rounded-lg backdrop-blur-md">
            <span className="flex items-center gap-2"><i className="ph-bold ph-calendar-blank text-amber-400"></i> {new Date(post.published_at).toLocaleDateString('vi-VN')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400/50"></span>
            <span className="flex items-center gap-2"><i className="ph-bold ph-user-circle text-amber-400"></i> {post.author?.name || 'Ban Truyền thông NKBA'}</span>
          </div>
        </div>
      </div>

      {/* Nội dung bài viết */}
      <article className="max-w-4xl mx-auto px-6 py-12 md:py-16 bg-white -mt-8 relative z-20 rounded-3xl shadow-sm border border-slate-100">
        
        {post.excerpt && (
          <div className="mb-10 p-6 bg-blue-50 border-l-4 border-[#002D62] rounded-r-2xl text-[#002D62] font-medium text-lg leading-relaxed">
            {post.excerpt}
          </div>
        )}

        <div 
          className="prose prose-lg prose-slate prose-headings:font-black prose-headings:text-[#002D62] prose-a:text-amber-600 hover:prose-a:text-amber-700 prose-img:rounded-2xl prose-img:shadow-md max-w-none prose-li:marker:text-amber-500"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Footer chia sẻ */}
        <div className="mt-16 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <i className="ph-bold ph-share-network"></i> Chia sẻ bài viết:
          </p>
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm">
              <i className="ph-fill ph-facebook-logo text-xl"></i>
            </button>
            <button className="w-11 h-11 rounded-xl bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all shadow-sm">
              <i className="ph-fill ph-twitter-logo text-xl"></i>
            </button>
            <button 
              className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-700 hover:text-white flex items-center justify-center transition-all shadow-sm" 
              onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Đã copy đường dẫn bài viết!'); }}
              title="Copy đường dẫn"
            >
              <i className="ph-bold ph-link text-xl"></i>
            </button>
          </div>
        </div>
      </article>
    </main>
  );
}