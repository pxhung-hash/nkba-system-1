'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function AdminReportPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    const fetchReportDetail = async () => {
      try {
        setLoading(true);
        const reportId = params.id as string;
        if (!reportId) return;

        const { data, error } = await supabase.from('reports').select('*').eq('id', reportId).single();
        if (error) throw error;
        setReport(data);
      } catch (err) {
        console.error('Lỗi lấy báo cáo:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportDetail();
  }, [params.id, supabase]);

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-teal-600"></i> Đang tải dữ liệu...</div>;
  if (!report) return <div className="p-20 text-center text-slate-500 font-bold">Không tìm thấy báo cáo.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24">
      
      {/* BANNER PREVIEW */}
      <div className="w-full h-[250px] md:h-[350px] relative flex items-end bg-gradient-to-tr from-slate-900 to-[#002D62] overflow-hidden">
        {report.cover_image && <img src={report.cover_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-8 relative z-10">
          <Link href="/insights" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm mb-6 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md transition-colors">
            <i className="ph-bold ph-arrow-left"></i> Trở về Kho báo cáo
          </Link>
          <div className="text-white pb-2 max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30 backdrop-blur-md">
                {report.category}
              </span>
              <span className="text-xs font-bold text-blue-200 flex items-center gap-1"><i className="ph-bold ph-clock"></i> {new Date(report.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black drop-shadow-md leading-tight mb-2">{report.title}</h1>
            <p className="text-sm font-medium text-amber-300 flex items-center gap-2"><i className="ph-fill ph-eye"></i> Chế độ xem trước của Quản trị viên</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center"><i className="ph-fill ph-text-align-left text-xl"></i></div> 
                Executive Summary (Tóm tắt)
              </h3>
              <div className="prose max-w-none text-slate-700 leading-loose text-sm md:text-base font-medium whitespace-pre-wrap">
                {report.description || 'Chưa có nội dung tóm tắt.'}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấp độ truy cập yêu cầu</p>
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl mt-1 mb-6">
                <i className={`ph-fill ${report.access_tier === 'VIP' ? 'ph-crown text-amber-500' : 'ph-shield-check text-slate-500'} text-lg`}></i>
                <p className={`text-sm font-black ${report.access_tier === 'VIP' ? 'text-amber-700' : 'text-slate-700'}`}>{report.access_tier}</p>
              </div>

              <a href={report.file_url || '#'} target="_blank" rel="noopener noreferrer" className={`w-full h-14 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${report.file_url ? 'bg-[#002D62] text-white hover:bg-blue-900' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}>
                <i className="ph-bold ph-download-simple text-xl"></i> {report.file_url ? 'XEM BẢN ĐẦY ĐỦ (PDF)' : 'CHƯA ĐÍNH KÈM FILE'}
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}