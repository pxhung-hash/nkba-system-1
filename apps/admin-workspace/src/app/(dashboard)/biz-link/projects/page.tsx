'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Khởi tạo Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function BizLinkDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    // SỬA LỖI 1: Hút từ bảng individuals và khai báo rõ Foreign Key để tránh lỗi Ambiguous
    const [projRes, indRes] = await Promise.all([
      supabase.from('projects').select('*').order('created_at', { ascending: false }),
      supabase.from('individuals').select('id, full_name, corporates!individuals_corporate_id_fkey(name), individual_tiers!individuals_tier_id_fkey(code)')
    ]);
    
    if (projRes.error) console.error("Lỗi tải dự án:", projRes.error);
    if (indRes.error) console.error("Lỗi tải hội viên:", indRes.error);

    if (projRes.data) setProjects(projRes.data);
    if (indRes.data) setMembers(indRes.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Hàm chuyển trạng thái dự án
  const handleUpdateStatus = async (projectId: string, newStatus: string) => {
    setIsUpdating(projectId);
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
    if (error) alert('Lỗi chuyển trạng thái: ' + error.message);
    else fetchData();
    setIsUpdating(null);
  };

  // SỬA LỖI 2: Móc đúng member_id và xử lý logic Ẩn danh Chủ đầu tư
  const getAuthor = (member_id: string, details: any) => {
    // Ưu tiên check nếu CĐT yêu cầu ẩn danh hoặc tự nhập tên
    if (details?.is_investor_hidden) return { name: 'Doanh nghiệp ẩn danh', tier: 'STANDARD' };
    if (details?.investor_name) return { name: details.investor_name, tier: 'STANDARD' };

    // Nếu không, móc từ Database
    const user = members.find(m => m.id === member_id);
    if (user) {
      const tierCode = Array.isArray(user.individual_tiers) ? user.individual_tiers[0]?.code : user.individual_tiers?.code;
      const corpName = Array.isArray(user.corporates) ? user.corporates[0]?.name : user.corporates?.name;
      return { 
        name: corpName || user.full_name || 'Thành viên Độc lập', 
        tier: tierCode || 'STANDARD' 
      };
    }
    return { name: 'Khách vãng lai', tier: 'STANDARD' };
  };
  
  const formatMoney = (amount: number) => {
    if (!amount) return 'Thỏa thuận';
    if (amount >= 1000000000) return (amount / 1000000000).toLocaleString('vi-VN') + ' Tỷ';
    if (amount >= 1000000) return (amount / 1000000).toLocaleString('vi-VN') + ' Triệu';
    return amount.toLocaleString('vi-VN') + ' VNĐ';
  };

  const getCategoryBadge = (cat: string) => {
    switch(cat) {
      case 'DESIGN': return { label: 'THIẾT KẾ', style: 'bg-purple-100 text-purple-700 border-purple-200' };
      case 'CONSTRUCTION': return { label: 'THI CÔNG', style: 'bg-amber-100 text-amber-700 border-amber-200' };
      case 'MATERIAL': return { label: 'VẬT TƯ', style: 'bg-blue-100 text-blue-700 border-blue-200' };
      case 'CONSULTING': return { label: 'TƯ VẤN', style: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
      default: return { label: 'KHÁC', style: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Tính GMV (Lấy ngân sách Max của các dự án đang thi công & hoàn thành)
  const totalGMV = projects
    .filter(p => p.status === 'IN_PROGRESS' || p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (Number(p.budget_max) || 0), 0);

  // Nhóm dự án theo cột
  const columns = [
    { id: 'PENDING', title: 'CHỜ DUYỆT', color: 'border-t-rose-500', bg: 'bg-rose-50' },
    { id: 'OPEN', title: 'MỞ THẦU (TÌM ĐỐI TÁC)', color: 'border-t-blue-500', bg: 'bg-blue-50' },
    { id: 'MATCHING', title: 'ĐANG ĐÀM PHÁN', color: 'border-t-amber-500', bg: 'bg-amber-50' },
    { id: 'IN_PROGRESS', title: 'ĐANG THI CÔNG', color: 'border-t-indigo-500', bg: 'bg-indigo-50' },
    { id: 'COMPLETED', title: 'HOÀN THÀNH (ĐÓNG GMV)', color: 'border-t-emerald-500', bg: 'bg-emerald-50' }
  ];

  if (isLoading) return <div className="p-20 text-center text-sm font-semibold text-slate-400 animate-pulse tracking-widest uppercase">Đang tải sa bàn dự án...</div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20 h-[calc(100vh-100px)] flex flex-col">
      
      {/* 1. HEADER & GMV DASHBOARD */}
      <div className="shrink-0 bg-[#002D62] p-8 md:px-10 rounded-[2rem] shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row justify-between md:items-center gap-6">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-5 rounded-full blur-[100px] transform translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
         
         <div className="relative z-10 flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-md">
              <svg width="32" height="32" fill="currentColor" viewBox="0 0 256 256"><path d="M240,104a8,8,0,0,1-8,8H152v96a8,8,0,0,1-16,0V112H24a8,8,0,0,1-8-8V40a8,8,0,0,1,8-8H232a8,8,0,0,1,8,8ZM136,48H32V96H136ZM224,48H152V96h72Z"></path></svg>
            </div>
            <div>
              <p className="text-blue-200/90 font-bold text-xs uppercase tracking-[0.2em] mb-1">TRẠM ĐIỀU PHỐI DỰ ÁN</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm leading-tight">Biz-Link Pipeline</h2>
            </div>
         </div>

         <div className="relative z-10 flex gap-4">
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex flex-col items-end">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 mb-1">Dòng tiền luân chuyển (GMV)</p>
              <p className="text-2xl md:text-3xl font-black text-white">{formatMoney(totalGMV)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20 flex flex-col items-end hidden sm:flex">
              <p className="text-[10px] font-bold uppercase tracking-widest text-blue-300 mb-1">Dự án Mở thầu</p>
              <p className="text-2xl md:text-3xl font-black text-white">{projects.filter(p => p.status === 'OPEN').length}</p>
            </div>
         </div>
      </div>

      {/* 2. KANBAN BOARD */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-6 pt-2 snap-x scroll-smooth">
        
        {columns.map(col => {
          const colProjects = projects.filter(p => p.status === col.id);
          
          return (
            <div key={col.id} className={`shrink-0 w-[340px] flex flex-col rounded-[2rem] border border-slate-200 shadow-sm bg-white overflow-hidden snap-center border-t-[6px] ${col.color}`}>
              
              {/* Kanban Header */}
              <div className={`p-5 border-b border-slate-100 ${col.bg} flex justify-between items-center`}>
                <h3 className="font-black text-slate-800 text-sm">{col.title}</h3>
                <span className="bg-white text-slate-600 text-xs font-black px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm">{colProjects.length}</span>
              </div>

              {/* Kanban Body (Danh sách Card) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {colProjects.length === 0 ? (
                  <div className="h-24 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-xs font-bold text-slate-400">Trống</div>
                ) : (
                  colProjects.map(project => {
                    const author = getAuthor(project.member_id, project.details);
                    const cat = getCategoryBadge(project.category);
                    
                    return (
                      <div key={project.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative flex flex-col">
                        
                        {/* Overlay Updating */}
                        {isUpdating === project.id && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 rounded-2xl flex items-center justify-center">
                            <span className="text-sm font-bold text-[#002D62] animate-pulse">Đang cập nhật...</span>
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase tracking-wider ${cat.style}`}>{cat.label}</span>
                          {/* Menu Chuyển trạng thái siêu tốc */}
                          <select 
                            value={project.status} 
                            onChange={(e) => handleUpdateStatus(project.id, e.target.value)}
                            className="text-[10px] font-bold text-slate-500 bg-slate-100 border-none outline-none rounded p-1 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="OPEN">Mở thầu</option>
                            <option value="MATCHING">Đàm phán</option>
                            <option value="IN_PROGRESS">Đang thi công</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="CANCELLED">Hủy bỏ</option>
                          </select>
                        </div>
                        
                        <h4 className="text-sm font-black text-slate-900 leading-snug mb-2 line-clamp-2" title={project.title}>
                          {project.title}
                        </h4>
                        
                        <div className="mt-auto pt-4 border-t border-slate-100 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">Ngân sách:</span>
                            <span className="font-black text-emerald-600">{formatMoney(project.budget_max)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-slate-200 shrink-0 uppercase">
                              {author.name.charAt(0)}
                            </div>
                            <span className="text-[11px] font-bold text-slate-600 truncate flex-1" title={author.name}>
                              {author.name}
                            </span>
                            {['VIP', 'TITANIUM', 'GOLD'].includes(author.tier) && <span title="Doanh nghiệp VIP">👑</span>}
                          </div>
                        </div>

                        {/* Nút Call to Action theo Status */}
                        {project.status === 'PENDING' && (
                          <button onClick={() => handleUpdateStatus(project.id, 'OPEN')} className="mt-4 w-full h-9 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-500 hover:text-white transition-colors flex items-center justify-center gap-1">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg> DUYỆT MỞ THẦU
                          </button>
                        )}
                        {project.status === 'OPEN' && (
                          <button className="mt-4 w-full h-9 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-black hover:bg-amber-500 hover:text-[#002D62] transition-colors flex items-center justify-center gap-1">
                            <svg width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M245.82,107l-83.33-31-31-83.31a15.89,15.89,0,0,0-29.84,0l-31,83.31-83.33,31a15.89,15.89,0,0,0,0,29.84l83.33,31,31,83.31a15.89,15.89,0,0,0,29.84,0l31-83.31,83.33-31A15.89,15.89,0,0,0,245.82,107Z"></path></svg> GỢI Ý MATCHING
                          </button>
                        )}

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}

      </div>
    </div>
  );
}