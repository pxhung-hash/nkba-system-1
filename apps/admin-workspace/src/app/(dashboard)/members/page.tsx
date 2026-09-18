'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function GlobalPendingTaskPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  
  // States lưu trữ các tác vụ chờ xử lý
  const [pendingCorps, setPendingCorps] = useState<any[]>([]);
  const [pendingProjects, setPendingProjects] = useState<any[]>([]);

  const fetchAllPendingTasks = async () => {
    setIsLoading(true);
    
    // Quét song song toàn bộ hệ thống
    const [corpsRes, projsRes] = await Promise.all([
      // 1. Quét Pháp nhân đang chờ Xác minh (NV) hoặc Chờ Ký duyệt (TGĐ)
      supabase.from('corporates')
        .select('id, name, tax_code, status, created_at, corporate_tiers(name)')
        .in('status', ['PENDING_VERIFICATION', 'PENDING_APPROVAL'])
        .order('created_at', { ascending: false }),
        
      // 2. Quét Dự án Biz-Link đang chờ duyệt mở thầu
      supabase.from('projects')
        .select('id, title, category, status, created_at, individuals(full_name, corporates(name))')
        .in('status', ['PENDING', 'PLANNING'])
        .order('created_at', { ascending: false })
    ]);

    if (corpsRes.data) setPendingCorps(corpsRes.data);
    if (projsRes.data) setPendingProjects(projsRes.data);
    
    setIsLoading(false);
  };

  useEffect(() => { fetchAllPendingTasks(); }, [supabase]);

  const totalTasks = pendingCorps.length + pendingProjects.length;

  if (isLoading) return <div className="p-20 text-center text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Đang quét hệ thống...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* 1. HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-8 md:p-10 rounded-[2rem] shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
         <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white opacity-10 rounded-full blur-[80px] transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
         <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex items-center justify-center shadow-inner">
              <i className="ph-fill ph-bell-ringing text-3xl text-white animate-wiggle"></i>
            </div>
            <div>
              <p className="font-black text-xs uppercase tracking-[0.2em] mb-1 text-amber-100 flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span></span>
                TRẠM ĐIỀU PHỐI TÁC VỤ
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm leading-tight">
                Hàng đợi Xử lý
              </h2>
            </div>
         </div>

         <div className="relative z-10 flex gap-4">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex flex-col items-center min-w-[120px]">
               <p className="text-4xl font-black text-white">{totalTasks}</p>
               <p className="text-[10px] font-black uppercase tracking-widest text-amber-100 mt-1">Tổng tác vụ</p>
            </div>
         </div>
      </div>

      {totalTasks === 0 ? (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
             <i className="ph-fill ph-check-circle text-5xl"></i>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Tuyệt vời! Inbox Zero.</h3>
          <p className="text-sm font-medium text-slate-500 max-w-sm">Hệ thống đang hoạt động trơn tru. Không có hồ sơ hay dự án nào cần bạn xử lý lúc này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* KHỐI 1: TÁC VỤ KYC PHÁP NHÂN */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <i className="ph-fill ph-buildings text-[#002D62]"></i> Xét duyệt Pháp nhân (KYC)
              </h3>
              <span className="bg-rose-100 text-rose-700 text-xs font-black px-3 py-1 rounded-full">{pendingCorps.length}</span>
            </div>
            
            <div className="flex-1 p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {pendingCorps.length === 0 ? (
                <p className="text-center text-slate-400 font-medium py-10">Không có hồ sơ pháp nhân chờ duyệt.</p>
              ) : (
                pendingCorps.map(corp => (
                  <div key={corp.id} className="p-4 border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all group bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase ${corp.status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                        {corp.status === 'PENDING_VERIFICATION' ? 'VÒNG 1: NV XÁC MINH' : 'VÒNG 2: TGĐ KÝ DUYỆT'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(corp.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-base">{corp.name}</h4>
                    <div className="flex items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                      <span className="font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">MST: {corp.tax_code}</span>
                      <span className="font-bold text-amber-600"><i className="ph-fill ph-medal"></i> Gói: {corp.corporate_tiers?.name || 'Chưa cấp'}</span>
                    </div>
                    <Link href="/members/corporates" className="mt-4 w-full h-10 bg-slate-50 text-[#002D62] font-black text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-[#002D62] hover:text-white transition-colors border border-slate-200 group-hover:border-[#002D62]">
                      ĐI TỚI TRẠM XÉT DUYỆT <i className="ph-bold ph-arrow-right"></i>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KHỐI 2: TÁC VỤ DỰ ÁN BIZ-LINK */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-black text-slate-900 flex items-center gap-2 text-lg">
                <i className="ph-fill ph-handshake text-emerald-600"></i> Duyệt mở thầu Biz-Link
              </h3>
              <span className="bg-rose-100 text-rose-700 text-xs font-black px-3 py-1 rounded-full">{pendingProjects.length}</span>
            </div>
            
            <div className="flex-1 p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {pendingProjects.length === 0 ? (
                <p className="text-center text-slate-400 font-medium py-10">Không có dự án/gói thầu chờ duyệt.</p>
              ) : (
                pendingProjects.map(proj => (
                  <div key={proj.id} className="p-4 border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase bg-emerald-50 text-emerald-700">YÊU CẦU LÊN SÀN</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(proj.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <h4 className="font-black text-slate-900 text-base line-clamp-2" title={proj.title}>{proj.title}</h4>
                    <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                      <i className="ph-fill ph-buildings"></i>
                      <span className="truncate">{proj.individuals?.corporates?.name || proj.individuals?.full_name || 'Khách vãng lai'}</span>
                    </div>
                    <Link href="/biz-link" className="mt-4 w-full h-10 bg-slate-50 text-emerald-700 font-black text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-colors border border-slate-200 group-hover:border-emerald-600">
                      VÀO SA BÀN DỰ ÁN <i className="ph-bold ph-arrow-right"></i>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}