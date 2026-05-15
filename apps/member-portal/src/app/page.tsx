'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function MemberDashboard() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [memberInfo, setMemberInfo] = useState<any>(null);

  // ĐƯỜNG DẪN ĐẾN TRANG NÂNG CẤP BÊN PUBLIC SITE
  const UPGRADE_URL = "https://nkba.vn/upgrade";

  useEffect(() => {
    const fetchMemberData = async () => {
      setLoading(true);
      
      // 1. Lấy thông tin user đang login
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setMemberInfo({ error: "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!" });
        setLoading(false); return;
      }

      // ==========================================
      // PHÂN LUỒNG 1: TÌM TRONG BẢNG HỘI VIÊN
      // ==========================================
      const { data: memberData, error: memberError } = await supabase
        .from('individuals')
        .select(`
          full_name, email, status,
          individual_tiers!individuals_tier_id_fkey(name, code),
          corporates(name, tax_code)
        `)
        .eq('user_auth_id', user.id).maybeSingle();

      if (memberError) {
        setMemberInfo({ error: `LỖI DATABASE: ${memberError.message}` }); setLoading(false); return;
      }

      if (memberData) {
        if (memberData.status !== 'ACTIVE') {
          setMemberInfo({ is_pending: true, ...memberData }); setLoading(false); return;
        }
        
        // Trích xuất mã Tier để làm logic phân quyền hiển thị (Làm mờ thông tin)
        const tierCode = Array.isArray(memberData.individual_tiers) 
          ? memberData.individual_tiers[0]?.code 
          : (memberData.individual_tiers as any)?.code;
          
        setMemberInfo({ ...memberData, is_admin: false, tier_code: tierCode });
      } 
      // ==========================================
      // PHÂN LUỒNG 2: TÌM TRONG NHÂN VIÊN (ADMIN)
      // ==========================================
      else {
        const { data: empData } = await supabase.from('employees').select('name, role, email').eq('email', user.email).maybeSingle();
        if (empData) {
          setMemberInfo({
            full_name: empData.name, email: user.email, status: 'ACTIVE', is_admin: true, role: empData.role, tier_code: 'VIP',
            individual_tiers: { name: 'Quyền Truy cập Tối cao' },
            corporates: { name: 'Ban Điều Hành NKBA' }
          });
        } else {
          setMemberInfo({ error: `Tài khoản ma! Không tìm thấy Hồ sơ nào khớp với thẻ Auth ID: ${user.id}` });
        }
      }
      setLoading(false);
    };
    fetchMemberData();
  }, [supabase, router]);


  // ==========================================
  // XỬ LÝ GIAO DIỆN LỖI & LOADING 
  // ==========================================
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i></div>;
  if (memberInfo?.error) return <div className="flex h-[80vh] items-center justify-center p-6"><div className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-rose-500"><p className="text-rose-600 font-black">{memberInfo.error}</p><button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="mt-4 px-6 py-2 bg-slate-900 text-white font-bold rounded-lg w-full">Đăng xuất</button></div></div>;
  if (memberInfo?.is_pending) return <div className="flex h-[80vh] items-center justify-center p-6"><div className="bg-white p-8 rounded-2xl shadow-xl border-t-4 border-amber-500 text-center"><p className="text-amber-600 font-black">Hồ sơ đang chờ duyệt!</p><button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="mt-4 px-6 py-2 bg-slate-100 font-bold rounded-lg w-full">Đăng xuất</button></div></div>;

  // ==========================================
  // LOGIC HIỆU ỨNG FOMO: Chỉ cho VIP/GOLD/TITANIUM xem, thẻ khác bị làm mờ
  // ==========================================
  const isPremium = memberInfo?.is_admin || ['GOLD', 'TITANIUM', 'VIP'].includes(memberInfo?.tier_code);

  // ==========================================
  // DỮ LIỆU TÓM TẮT ĐỂ HIỂN THỊ LÊN DASHBOARD (MOCK DATA TẠM THỜI)
  // ==========================================
  const mockProjects = [
    { id: 1, title: 'Thi công MEP Nhà máy Điện tử Koha', budget: '12 Tỷ VNĐ', location: 'Bắc Ninh', contact: 'Mr. Tanaka (098xxxxxxx)' },
    { id: 2, title: 'Tìm thầu phụ Xưởng cơ khí GĐ2', budget: '5 Tỷ VNĐ', location: 'Đồng Nai', contact: 'Ms. Haruno (090xxxxxxx)' },
  ];

  const mockJobs = [
    { id: 1, title: 'Kỹ sư Cầu nối (BrSE) Xây dựng', company: 'Shimizu Corp Vietnam', salary: '$1,500 - $2,500' },
    { id: 2, title: 'Phiên dịch viên Tiếng Nhật (N2)', company: 'Toda Corporation', salary: 'Lên đến 35 Triệu' },
  ];

  const mockNews = [
    { id: 1, title: 'Xu hướng vốn FDI Nhật Bản vào BĐS Công nghiệp VN Q3/2026', type: 'Độc quyền' },
    { id: 2, title: 'Thay đổi quy định cấp phép xây dựng cho CĐT nước ngoài', type: 'Pháp lý' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
      
      {/* 1. KHU VỰC HEADER TỔNG QUAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Konnichiwa, {memberInfo.full_name}! 👋
            </h1>
            <p className="text-slate-600 mt-2">
              Chào mừng Đại diện của <strong className="text-[#002D62]">{memberInfo.corporates?.name || 'Thành viên Độc lập'}</strong>.
            </p>
            {memberInfo.is_admin && (
              <a href="http://localhost:3002" className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold text-xs transition-colors">
                <i className="ph-bold ph-shield-check"></i> Chế độ Quản trị viên
              </a>
            )}
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <i className="ph-fill ph-buildings text-[250px]"></i>
          </div>
        </div>

        {/* TIẾN TRÌNH HỒ SƠ & HẠNG THẺ */}
        <div className="bg-[#002D62] text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">Cấp bậc hiện tại</p>
                <h3 className="text-2xl font-black">
                  {Array.isArray(memberInfo.individual_tiers) ? memberInfo.individual_tiers[0]?.name : memberInfo.individual_tiers?.name || 'HỘI VIÊN TIÊU CHUẨN'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/20 text-amber-400 text-xl shrink-0">
                <i className="ph-fill ph-crown"></i>
              </div>
            </div>
            
            {/* Nút nâng cấp nếu chưa phải Premium */}
            {!isPremium && (
              <Link href={UPGRADE_URL} className="inline-block mt-2 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-md hover:scale-105 transition-transform">
                Nâng cấp thẻ ngay <i className="ph-bold ph-caret-right"></i>
              </Link>
            )}
          </div>
          
          <div className="relative z-10 mt-auto pt-4 border-t border-white/10">
            <div className="flex justify-between items-end mb-2">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Độ tin cậy hồ sơ</p>
              <h3 className="text-lg font-black text-emerald-400">45%</h3>
            </div>
            <div className="w-full bg-slate-900/50 rounded-full h-2 mb-3 overflow-hidden border border-white/10">
              <div className="bg-gradient-to-r from-blue-400 to-emerald-400 h-2 rounded-full relative" style={{ width: '45%' }}></div>
            </div>
            <Link href="/profile" className="block text-center w-full py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-colors border border-white/20 backdrop-blur-md">
              Bổ sung Hồ sơ
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC FEED (MỒI CÂU) - KẾT NỐI VỚI CÁC TRANG CHUYÊN SÂU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI (CHỨA BIZ-LINK & J-JOB) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* TÓM TẮT SÀN BIZ-LINK */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-handshake text-blue-600"></i> Cơ hội thầu Biz-Link</h2>
              <Link href="/biz-link" className="text-sm font-bold text-blue-600 hover:underline">Vào Sàn Dự Án <i className="ph-bold ph-arrow-right"></i></Link>
            </div>
            <div className="divide-y divide-slate-100">
              {mockProjects.map(proj => (
                <div key={proj.id} className="p-6 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{proj.title}</h3>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg border border-emerald-100 shrink-0">Đang mở</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm mt-3">
                    <div className="flex items-center gap-1.5 text-slate-500"><i className="ph-fill ph-map-pin text-slate-400"></i> {proj.location}</div>
                    
                    {/* FOMO BLUR EFFECT */}
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <i className="ph-fill ph-wallet text-slate-400"></i> 
                      {isPremium ? <span className="font-bold text-emerald-600">{proj.budget}</span> : <span className="blur-sm bg-slate-200 text-transparent select-none">10 Tỷ VNĐ</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <i className="ph-fill ph-phone text-slate-400"></i>
                      {isPremium ? <span className="font-bold text-slate-700">{proj.contact}</span> : <span className="blur-[4px] bg-slate-200 text-transparent select-none">Mr. Tanaka (098xxx)</span>}
                    </div>
                  </div>

                  {!isPremium && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                      <p className="text-xs font-medium text-amber-800 flex items-center gap-2">
                        <i className="ph-fill ph-lock-key text-amber-500 text-lg"></i> Nâng cấp thẻ để xem Ngân sách & Liên hệ.
                      </p>
                      {/* ĐÃ CHUYỂN THÀNH LINK */}
                      <Link href={UPGRADE_URL} className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-lg hover:bg-amber-600 transition-colors inline-block">Nâng cấp</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* TÓM TẮT TUYỂN DỤNG J-JOB */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-briefcase text-blue-600"></i> Việc làm J-Job mới nhất</h2>
              <Link href="/talent-hub" className="text-sm font-bold text-blue-600 hover:underline">Vào Talent Hub <i className="ph-bold ph-arrow-right"></i></Link>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockJobs.map(job => (
                <div key={job.id} className="p-5 border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
                  <h3 className="font-bold text-slate-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{job.company}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{job.salary}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CỘT PHẢI (CHỨA INSIGHTS & ĐỐI TÁC TIÊU BIỂU) */}
        <div className="space-y-8">
          
          {/* TÓM TẮT INSIGHTS VIP */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>
            <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2 relative z-10"><i className="ph-fill ph-chart-polar text-rose-500"></i> Insights VIP</h2>
            <div className="space-y-4 relative z-10">
              {mockNews.map(news => (
                <div key={news.id} className="group/item cursor-pointer">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1 block">{news.type}</span>
                  <p className="text-sm font-bold text-slate-700 group-hover/item:text-rose-600 transition-colors line-clamp-2 leading-relaxed">{news.title}</p>
                </div>
              ))}
            </div>

            {/* Thêm Upsell nhẹ cho Insights */}
            {!isPremium && (
              <div className="mt-5 p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center relative z-10">
                <span className="text-[11px] font-medium text-slate-500"><i className="ph-fill ph-lock-key"></i> Tính năng tải bị giới hạn</span>
                <Link href={UPGRADE_URL} className="text-[10px] font-black uppercase text-amber-600 hover:underline">Mở khóa</Link>
              </div>
            )}

            <Link href="/insights" className="block text-center w-full mt-4 py-2.5 border-2 border-slate-100 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors relative z-10">
              Vào Thư Viện Báo Cáo
            </Link>
          </div>

          {/* MEMBER HUB MINI */}
          <div className="bg-gradient-to-b from-slate-900 to-[#002D62] rounded-3xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <h2 className="text-lg font-black mb-5 flex items-center gap-2 relative z-10"><i className="ph-fill ph-users-three text-blue-300"></i> Đối tác Tiêu biểu</h2>
            <div className="space-y-3 relative z-10">
              {/* Fake Data Logo */}
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-900 font-black shadow-inner">T</div>
                <div><p className="font-bold text-sm leading-tight">Toda Corporation</p><p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-0.5">TITANIUM</p></div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-slate-900 font-black shadow-inner">K</div>
                <div><p className="font-bold text-sm leading-tight">Kajima Vietnam</p><p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mt-0.5">GOLD</p></div>
              </div>
            </div>
            <Link href="/directory" className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-blue-200 hover:text-white transition-colors relative z-10">
              Khám phá Mạng lưới <i className="ph-bold ph-arrow-right"></i>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}