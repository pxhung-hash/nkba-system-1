'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [supabase] = useState(() => createClient());
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      try {
        // Lấy chi tiết dự án từ database
        const { data, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setProject(data);
      } catch (err: any) {
        console.error('Lỗi tải dự án:', err);
        setError('Không tìm thấy thông tin dự án hoặc dự án đã bị xóa.');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, supabase]);

  // Format tiền tệ
  const formatMoney = (amount: number) => amount ? amount.toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận';

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold">
        <i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-[#002D62]"></i> Đang tải dữ liệu dự án...
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center animate-in fade-in duration-500">
        <i className="ph-fill ph-warning-circle text-5xl text-rose-500 mb-4"></i>
        <h1 className="text-xl font-bold text-slate-800 mb-6">{error || 'Dự án không tồn tại'}</h1>
        <button onClick={() => router.back()} className="px-6 py-3 bg-[#002D62] text-white rounded-xl font-bold hover:bg-blue-900 transition-colors">
          Quay lại sàn giao dịch
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Nút quay lại */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-slate-500 hover:text-[#002D62] font-bold mb-6 transition-colors"
      >
        <i className="ph-bold ph-arrow-left text-lg"></i> Quay lại
      </button>

      {/* Box thông tin chi tiết */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Nhãn trạng thái */}
        <div className="flex justify-between items-start mb-6">
          <span className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-widest">
            {project.category}
          </span>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${project.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' : project.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
            {project.status === 'PENDING' ? 'ĐANG CHỜ DUYỆT' : project.status}
          </span>
        </div>

        {/* Tiêu đề dự án */}
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 leading-snug">
          {project.title}
        </h1>

        {/* Các thông số tóm tắt */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm font-bold text-slate-600 mb-8 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-map-pin text-slate-400 text-lg"></i> 
            {project.location || 'Chưa cập nhật địa điểm'}
          </div>
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
            <i className="ph-fill ph-coins text-lg"></i> 
            Ngân sách: {formatMoney(project.budget_max)}
          </div>
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-calendar-blank text-slate-400 text-lg"></i> 
            Đăng ngày: {new Date(project.created_at).toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* Nội dung mô tả */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <i className="ph-fill ph-article text-[#002D62]"></i> Mô tả chi tiết yêu cầu
          </h3>
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <p className="text-slate-700 leading-loose whitespace-pre-wrap font-medium">
              {project.description || 'Dự án này chưa có mô tả chi tiết.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}