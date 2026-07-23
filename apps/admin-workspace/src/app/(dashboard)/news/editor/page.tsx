'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

function NewsEditorContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [isSaving, setIsSaving] = useState(false);
  const [currentUserEmpId, setCurrentUserEmpId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<any>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    thumbnail_url: '',
    status: 'DRAFT',
    published_at: null, // Thêm dòng này
    author_id: null     // Thêm dòng này


  });

  // 1. Hàm chuyển Tiêu đề tiếng Việt thành Slug chuẩn SEO (VD: NKBA ra mắt -> nkba-ra-mat)
  const generateSlug = (text: string) => {
    return text.toString().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '').replace(/-+$/, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (!editId) {
      setFormData({ ...formData, title: newTitle, slug: generateSlug(newTitle) });
    } else {
      setFormData({ ...formData, title: newTitle });
    }
  };

  // 2. Lấy thông tin bài viết (nếu đang Sửa) và ID người đăng nhập
  useEffect(() => {
    const initData = async () => {
      // Lấy user auth hiện tại để map sang bảng employees
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: emp } = await supabase.from('employees').select('id').eq('email', user.email).single();
        if (emp) setCurrentUserEmpId(emp.id);
      }

      // Nếu có editId -> Lấy dữ liệu bài cũ để sửa
      if (editId) {
        const { data } = await supabase.from('news').select('*').eq('id', editId).single();
        if (data) setFormData(data);
      }
    };
    initData();
  }, [editId, supabase]);

  // 3. Xử lý Lưu Nháp hoặc Xuất Bản
  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title || !formData.slug) return alert('Vui lòng nhập Tiêu đề và Slug (Đường dẫn SEO)!');
    setIsSaving(true);
    
    const payload = {
      ...formData,
      status: status,
      // Đã gọi được formData.published_at một cách an toàn
      published_at: status === 'PUBLISHED' && !formData.published_at ? new Date().toISOString() : formData.published_at,
      updated_at: new Date().toISOString(),
      // Đã gọi được formData.author_id một cách an toàn
      author_id: editId ? formData.author_id : currentUserEmpId
    };

    let error;
    if (editId) {
      const { error: updateErr } = await supabase.from('news').update(payload).eq('id', editId);
      error = updateErr;
    } else {
      const { error: insertErr } = await supabase.from('news').insert([payload]);
      error = insertErr;
    }

    setIsSaving(false);
    if (error) {
      alert('Lỗi lưu bài viết: ' + error.message);
    } else {
      alert(status === 'PUBLISHED' ? '🚀 Đã xuất bản tin tức thành công!' : '💾 Đã lưu bản nháp thành công!');
      router.push('/news');
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-20 space-y-6">
      
      {/* Header Công cụ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm gap-4">
        <h2 className="text-xl font-black text-[#002D62] uppercase tracking-tight flex items-center gap-2">
          <i className="ph-bold ph-note-pencil text-amber-500 text-2xl"></i>
          {editId ? 'Chỉnh sửa Bài viết' : 'Viết bài Mới'}
        </h2>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button onClick={() => router.push('/news')} className="flex-1 sm:flex-none px-4 h-11 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">HỦY</button>
          <button onClick={() => handleSave('DRAFT')} disabled={isSaving} className="flex-1 sm:flex-none px-4 h-11 font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl border border-slate-200 transition-colors">
            LƯU NHÁP
          </button>
          <button onClick={() => handleSave('PUBLISHED')} disabled={isSaving} className="flex-1 sm:flex-none px-6 h-11 font-black bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2">
            {isSaving ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-paper-plane-right"></i>}
            {isSaving ? 'ĐANG LƯU...' : 'XUẤT BẢN'}
          </button>
        </div>
      </div>

      {/* Form Nhập liệu */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiêu đề bài viết (*)</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={handleTitleChange} 
            className="w-full h-12 px-4 border border-slate-200 rounded-xl text-lg font-bold outline-none focus:border-[#002D62] focus:ring-4 focus:ring-blue-900/10 transition-all" 
            placeholder="VD: NKBA tổ chức Lễ ký kết Hợp tác Chiến lược..." 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đường dẫn SEO (Slug) (*)</label>
            <input 
              type="text" 
              value={formData.slug} 
              onChange={e => setFormData({...formData, slug: e.target.value})} 
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#002D62] focus:bg-white text-blue-600 font-medium transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between">
              <span>Link Ảnh Bìa (Thumbnail)</span>
              {formData.thumbnail_url && <a href={formData.thumbnail_url} target="_blank" rel="noreferrer" className="text-blue-500 normal-case tracking-normal">Xem ảnh</a>}
            </label>
            <input 
              type="url" 
              value={formData.thumbnail_url} 
              onChange={e => setFormData({...formData, thumbnail_url: e.target.value})} 
              className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#002D62] transition-all" 
              placeholder="Dán link ảnh vào đây (https://...)" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả ngắn (Excerpt)</label>
          <textarea 
            value={formData.excerpt} 
            onChange={e => setFormData({...formData, excerpt: e.target.value})} 
            className="w-full h-24 p-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#002D62] transition-all resize-none" 
            placeholder="Đoạn văn ngắn 2-3 câu tóm tắt nội dung bài viết, hiển thị ngoài trang chủ..." 
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Nội dung bài viết (Content)
          </label>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 mb-2 flex gap-2 items-start">
            <i className="ph-fill ph-info text-lg shrink-0"></i>
            <p>Hiện tại hệ thống sử dụng trình soạn thảo HTML thuần. Bạn có thể sử dụng các thẻ HTML cơ bản như &lt;b&gt;, &lt;i&gt;, &lt;br&gt; để định dạng văn bản.</p>
          </div>
          <textarea 
            value={formData.content} 
            onChange={e => setFormData({...formData, content: e.target.value})} 
            className="w-full h-96 p-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-[#002D62] transition-all font-mono" 
            placeholder="<p>Nhập nội dung bài viết vào đây...</p>" 
          />
        </div>

      </div>
    </div>
  );
}

// Bọc Component trong Suspense để tránh lỗi Build của Next.js khi dùng useSearchParams
export default function NewsEditorPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500 font-bold animate-pulse">Đang tải trình soạn thảo...</div>}>
      <NewsEditorContent />
    </Suspense>
  );
}