'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function NewsListPage() {
  const supabase = createClient();
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {
    setLoading(true);
    // Lấy danh sách tin tức kèm thông tin người viết từ bảng employees
    const { data, error } = await supabase
      .from('news')
      .select('*, author:author_id(name)')
      .order('created_at', { ascending: false });
      
    if (!error && data) setNewsList(data);
    setLoading(false);
  };

  useEffect(() => { fetchNews(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa bài viết: "${title}"?`)) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (error) alert('Lỗi xóa bài: ' + error.message);
    else fetchNews();
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Quản lý Tin tức & Sự kiện</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Xuất bản nội dung truyền thông cho Liên minh NKBA</p>
        </div>
        <Link href="/news/editor" className="px-6 h-12 bg-[#002D62] text-white font-bold rounded-xl hover:bg-blue-900 shadow-md transition-colors flex items-center justify-center gap-2">
          <i className="ph-bold ph-plus"></i> VIẾT BÀI MỚI
        </Link>
      </div>

      {/* Danh sách */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-6 py-4">Bài viết</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4">Người viết</th>
              <th className="px-6 py-4">Ngày tạo</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">Đang tải dữ liệu...</td></tr>
            ) : newsList.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">Chưa có bài viết nào.</td></tr>
            ) : (
              newsList.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="thumb" className="w-16 h-12 object-cover rounded-lg border border-slate-200" />
                      ) : (
                        <div className="w-16 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400"><i className="ph-fill ph-image"></i></div>
                      )}
                      <div>
                        <div className="font-bold text-slate-900 text-sm line-clamp-1">{item.title}</div>
                        <div className="text-xs text-slate-400 mt-1">/{item.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${item.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
                      {item.status === 'PUBLISHED' ? 'ĐÃ ĐĂNG' : 'BẢN NHÁP'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-600">{item.author?.name || 'Admin'}</td>
                  <td className="px-6 py-4 text-slate-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/news/editor?id=${item.id}`} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center hover:bg-indigo-100">
                        <i className="ph-bold ph-pencil-simple text-sm"></i>
                      </Link>
                      <button onClick={() => handleDelete(item.id, item.title)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center hover:bg-rose-100">
                        <i className="ph-bold ph-trash text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}