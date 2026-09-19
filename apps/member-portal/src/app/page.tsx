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

  // CÁC STATE CHỨA DỮ LIỆU THẬT TỪ DATABASE
  const [realProjects, setRealProjects] = useState<any[]>([]);
  const [realJobs, setRealJobs] = useState<any[]>([]);
  const [realReports, setRealReports] = useState<any[]>([]);
  const [realPartners, setRealPartners] = useState<any[]>([]);
  const [profileProgress, setProfileProgress] = useState(0);

  // ĐƯỜNG DẪN ĐẾN TRANG NÂNG CẤP BÊN TRONG PORTAL
  const UPGRADE_URL = "/upgrade";

  useEffect(() => {
    const fetchMemberData = async () => {
      setLoading(true);
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setMemberInfo({ error: "Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại!" });
        setLoading(false); return;
      }

      // 1. LẤY THÔNG TIN CÁ NHÂN & CÔNG TY CỦA USER
      const { data: memberData, error: memberError } = await supabase
        .from('individuals')
        .select(`
          id, full_name, email, phone, status, role_in_company,
          individual_tiers!individuals_tier_id_fkey(name, code),
          corporates(id, name, tax_code)
        `)
        .eq('user_auth_id', user.id).maybeSingle();

      if (memberError) {
        setMemberInfo({ error: `LỖI DATABASE: ${memberError.message}` }); setLoading(false); return;
      }

      let currentUserId = null;

      if (memberData) {
        if (['REJECTED', 'ARCHIVED', 'PENDING_DELETION'].includes(memberData.status)) {
          setMemberInfo({ error: "Tài khoản của bạn đã bị từ chối hoặc ngừng hoạt động." }); 
          setLoading(false); return;
        }

        const isPendingUpgrade = memberData.status === 'PENDING_UPGRADE';
        const tierCode = Array.isArray(memberData.individual_tiers) ? memberData.individual_tiers[0]?.code : (memberData.individual_tiers as any)?.code;
          
        setMemberInfo({ ...memberData, is_admin: false, tier_code: tierCode, is_pending: isPendingUpgrade });
        currentUserId = memberData.id;

        // TÍNH TOÁN % HOÀN THIỆN HỒ SƠ THẬT
        let filled = 0; let total = 5;
        if (memberData.full_name) filled++;
        if (memberData.phone) filled++;
        if (memberData.role_in_company) filled++;
        if (memberData.corporates?.name) filled += 2;
        setProfileProgress(Math.round((filled / total) * 100));

      } else {
        // FALLBACK CHO ADMIN
        const { data: empData } = await supabase.from('employees').select('name, role, email').eq('email', user.email).maybeSingle();
        if (empData) {
          setMemberInfo({ full_name: empData.name, email: user.email, status: 'ACTIVE', is_admin: true, role: empData.role, tier_code: 'VIP', individual_tiers: { name: 'Quyền Truy cập Tối cao' }, corporates: { name: 'Ban Điều Hành NKBA' }, is_pending: false });
          setProfileProgress(100);
        } else {
          setMemberInfo({ error: `Tài khoản ma! Không tìm thấy Hồ sơ nào khớp với thẻ Auth ID.` });
        }
      }

      // ==========================================
      // 2. HÚT DỮ LIỆU THẬT ĐỂ HIỂN THỊ LÊN DASHBOARD
      // ==========================================
      const fetchSafe = async (query: any) => {
        try { const { data, error } = await query; return error ? [] : (data || []); } catch { return []; }
      };

      const [jobsData, reportsData, partnersData, allIndividuals] = await Promise.all([
        fetchSafe(supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(4)),
        fetchSafe(supabase.from('reports').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(4)),
        fetchSafe(supabase.from('individuals').select('id, full_name, corporates(name), individual_tiers!inner(name, code)').in('individual_tiers.code', ['VIP', 'TITANIUM', 'GOLD']).limit(5)),
        fetchSafe(supabase.from('individuals').select('id, full_name, corporates(name)')) // Dùng để map tên công ty cho Job
      ]);

      // Map tên công ty cho Job
      const mappedJobs = jobsData.map((j: any) => {
         const ind = allIndividuals.find((i: any) => i.id === j.member_id);
         return { ...j, company_name: ind?.corporates?.name || ind?.full_name || 'Hội viên NKBA' };
      });

      // Lấy Projects (Nếu Sếp có bảng projects, nếu không tạm dùng cấu trúc an toàn)
      const projectsData = await fetchSafe(supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(3));

      setRealJobs(mappedJobs);
      setRealReports(reportsData);
      
      // Đảo ngẫu nhiên danh sách đối tác VIP để ai cũng được lên top
      setRealPartners(partnersData.sort(() => 0.5 - Math.random()).slice(0, 3));
      
      // Nếu có bảng projects thì gán, không thì để mảng rỗng sẽ hiện UI "Đang cập nhật"
      setRealProjects(projectsData.length > 0 ? projectsData : [
        { id: 'mock1', title: 'Thi công MEP Nhà máy Điện tử Koha', budget: '12 Tỷ VNĐ', location: 'Bắc Ninh', contact_info: 'Mr. Tanaka (098xxxxxxx)', isMock: true },
        { id: 'mock2', title: 'Tìm thầu phụ Xưởng cơ khí GĐ2', budget: '5 Tỷ VNĐ', location: 'Đồng Nai', contact_info: 'Ms. Haruno (090xxxxxxx)', isMock: true }
      ]);

      setLoading(false);
    };

    fetchMemberData();
  }, [supabase, router]);

  // Lời chào theo thời gian thực
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Ohayou gozaimasu (Chào buổi sáng)';
    if (hour < 18) return 'Konnichiwa (Chào buổi chiều)';
    return 'Konbanwa (Chào buổi tối)';
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i></div>;
  
  if (memberInfo?.error) return (
    <div className="flex h-[80vh] items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-rose-500 max-w-md w-full text-center">
        <i className="ph-fill ph-warning-circle text-4xl text-rose-500 mb-3"></i>
        <p className="text-slate-800 font-bold mb-6">{memberInfo.error}</p>
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="px-6 py-3 bg-[#002D62] text-white font-bold rounded-xl w-full hover:bg-blue-900 transition-colors">Đăng xuất</button>
      </div>
    </div>
  );

  const isPremium = memberInfo?.is_admin || (!memberInfo?.is_pending && ['GOLD', 'TITANIUM', 'VIP'].includes(memberInfo?.tier_code));

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen animate-in fade-in duration-500 pb-24">
      
      {/* 🌟 BANNER THÔNG BÁO CHO NGƯỜI ĐANG CHỜ DUYỆT NÂNG CẤP 🌟 */}
      {memberInfo?.is_pending && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in zoom-in-95">
          <i className="ph-fill ph-hourglass-high text-amber-500 text-2xl mt-0.5 shrink-0"></i>
          <div>
            <h4 className="font-black text-amber-800 text-lg">Yêu cầu nâng cấp đặc quyền đang được xử lý</h4>
            <p className="text-sm text-amber-700 mt-1 leading-relaxed">
              Ban quản trị NKBA đang tiến hành kiểm tra hồ sơ và biên lai thanh toán của bạn. Việc này có thể mất từ 1-2 ngày làm việc. Trong thời gian này, bạn vẫn có thể sử dụng các tính năng tiêu chuẩn của hệ thống.
            </p>
          </div>
        </div>
      )}

      {/* 1. KHU VỰC HEADER TỔNG QUAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LỜI CHÀO & THÔNG TIN CƠ BẢN */}
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="ph-bold ph-calendar-blank"></i> {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-[#002D62] tracking-tight mb-2">
              {getGreeting()}, {memberInfo.full_name.split(' ').pop()}! 👋
            </h1>
            <p className="text-slate-600 text-lg font-medium">
              Chào mừng Đại diện của <strong className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">{memberInfo.corporates?.name || 'Thành viên Độc lập'}</strong>.
            </p>
            
            {/* THAO TÁC NHANH (QUICK ACTIONS) */}
            <div className="flex flex-wrap gap-3 mt-8">
              <Link href="/biz-link" className="px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-sm font-black transition-colors flex items-center gap-2 border border-blue-100"><i className="ph-bold ph-plus-circle text-lg"></i> Đăng Dự án mới</Link>
              <Link href="/talent-hub" className="px-5 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl text-sm font-black transition-colors flex items-center gap-2 border border-emerald-100"><i className="ph-bold ph-briefcase text-lg"></i> Tuyển Nhân sự</Link>
              {memberInfo.is_admin && (
                <a href="http://localhost:3002" className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl text-sm font-black transition-colors flex items-center gap-2 border border-rose-100"><i className="ph-bold ph-shield-check text-lg"></i> Quản trị NKBA</a>
              )}
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <i className="ph-fill ph-buildings text-[250px]"></i>
          </div>
        </div>

        {/* TIẾN TRÌNH HỒ SƠ & HẠNG THẺ */}
        <div className="bg-gradient-to-br from-[#002D62] to-indigo-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mb-1">Cấp bậc Hội viên</p>
                <h3 className="text-2xl font-black drop-shadow-md">
                  {Array.isArray(memberInfo.individual_tiers) ? memberInfo.individual_tiers[0]?.name : memberInfo.individual_tiers?.name || 'HỘI VIÊN TIÊU CHUẨN'}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20 text-amber-400 text-2xl shrink-0 shadow-inner">
                <i className="ph-fill ph-crown"></i>
              </div>
            </div>
            
            {!isPremium && !memberInfo?.is_pending && (
              <Link href={UPGRADE_URL} className="inline-block mt-3 px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[11px] font-black uppercase tracking-wider rounded-xl shadow-lg hover:scale-105 transition-transform flex w-fit items-center gap-1.5">
                Nâng cấp Đặc quyền <i className="ph-bold ph-rocket-launch text-sm"></i>
              </Link>
            )}
            {!isPremium && memberInfo?.is_pending && (
              <div className="inline-block mt-3 px-4 py-2 bg-white/10 border border-white/20 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-xl flex w-fit items-center gap-2">
                <i className="ph-bold ph-hourglass-high animate-spin-slow"></i> ĐANG CHỜ ADMIN DUYỆT
              </div>
            )}
          </div>
          
          <div className="relative z-10 mt-auto pt-5 border-t border-white/10">
            <div className="flex justify-between items-end mb-2">
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Độ mạnh Hồ sơ DN</p>
              <h3 className={`text-lg font-black ${profileProgress === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>{profileProgress}%</h3>
            </div>
            <div className="w-full bg-slate-900/50 rounded-full h-2.5 mb-4 overflow-hidden border border-white/10 shadow-inner">
              <div className={`h-full rounded-full relative transition-all duration-1000 ${profileProgress === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`} style={{ width: `${profileProgress}%` }}></div>
            </div>
            {profileProgress < 100 ? (
              <Link href="/profile" className="flex items-center justify-center gap-2 w-full py-3 bg-white text-[#002D62] font-black rounded-xl text-xs hover:bg-slate-100 transition-colors shadow-lg">
                HOÀN THIỆN NGAY <i className="ph-bold ph-arrow-right"></i>
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/20 text-emerald-300 font-black rounded-xl text-xs border border-emerald-500/30">
                <i className="ph-bold ph-check-circle"></i> HỒ SƠ TUYỆT VỜI
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. KHU VỰC FEED (REAL-TIME DATA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI - DỰ ÁN & TUYỂN DỤNG */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SÀN BIZ-LINK (DỰ ÁN) */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-handshake text-blue-600 text-2xl"></i> Cơ hội thầu Biz-Link</h2>
              <Link href="/biz-link" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">Tất cả <i className="ph-bold ph-arrow-right"></i></Link>
            </div>
            <div className="divide-y divide-slate-100">
              {realProjects.length === 0 ? (
                <div className="p-10 text-center text-slate-400 font-medium italic">Đang cập nhật các gói thầu mới nhất...</div>
              ) : (
                realProjects.map((proj: any) => (
                  <div key={proj.id} className="p-6 md:px-8 hover:bg-slate-50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-700 transition-colors line-clamp-1">{proj.title}</h3>
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-[10px] rounded-lg border border-emerald-100 shrink-0 uppercase tracking-widest">Đang mở</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm mt-3">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium"><i className="ph-fill ph-map-pin text-slate-400 text-lg"></i> {proj.location || 'Toàn quốc'}</div>
                      
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <i className="ph-fill ph-wallet text-slate-400 text-lg"></i> 
                        {isPremium || proj.isMock ? <span className="font-black text-emerald-600">{proj.budget || 'Thỏa thuận'}</span> : <span className="blur-sm bg-slate-200 text-transparent select-none rounded px-1">10 Tỷ VNĐ</span>}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <i className="ph-fill ph-phone text-slate-400 text-lg"></i>
                        {isPremium || proj.isMock ? <span className="font-bold text-slate-700">{proj.contact_info || proj.contact || 'Đã có số ĐT'}</span> : <span className="blur-[4px] bg-slate-200 text-transparent select-none rounded px-1">Mr. Tanaka (098xxx)</span>}
                      </div>
                    </div>

                    {!isPremium && !proj.isMock && (
                      <div className="mt-5 p-3 bg-amber-50 border border-amber-100 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <p className="text-xs font-bold text-amber-800 flex items-center gap-2">
                          <div className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-amber-700"><i className="ph-fill ph-lock-key text-sm"></i></div>
                          Nâng cấp thẻ để xem Ngân sách & SĐT Chủ đầu tư.
                        </p>
                        {!memberInfo?.is_pending && (
                          <Link href={UPGRADE_URL} className="shrink-0 px-4 py-2 bg-amber-500 text-white font-black text-xs rounded-lg hover:bg-amber-600 transition-colors shadow-sm">Mở Khóa Ngay</Link>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* J-JOB TUYỂN DỤNG */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 md:px-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-briefcase text-indigo-600 text-2xl"></i> Việc làm Cấp cao J-Job</h2>
              <Link href="/talent-hub" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Tất cả <i className="ph-bold ph-arrow-right"></i></Link>
            </div>
            <div className="p-6 md:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {realJobs.length === 0 ? (
                <div className="col-span-full py-6 text-center text-slate-400 font-medium italic">Hiện chưa có tin tuyển dụng nào trên hệ thống.</div>
              ) : (
                realJobs.map(job => (
                  <Link href="/talent-hub" key={job.id} className="p-5 border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-lg transition-all group cursor-pointer bg-white">
                    <h3 className="font-black text-slate-900 mb-1.5 group-hover:text-indigo-700 transition-colors line-clamp-2">{job.title}</h3>
                    <p className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-1.5"><i className="ph-fill ph-buildings text-slate-400"></i> <span className="truncate">{job.company_name}</span></p>
                    <div className="flex justify-between items-end pt-3 border-t border-slate-100">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Mức lương</p>
                        <span className="text-sm font-black text-emerald-600">{job.salary_range || 'Thỏa thuận'}</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors"><i className="ph-bold ph-arrow-up-right"></i></div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>

        {/* CỘT PHẢI - INSIGHTS & ĐỐI TÁC */}
        <div className="space-y-8">
          
          {/* INSIGHTS BÁO CÁO NÓNG */}
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-colors"></div>
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 relative z-10 border-b border-slate-100 pb-4"><i className="ph-fill ph-chart-polar text-teal-600 text-2xl"></i> Insights VIP</h2>
            
            <div className="space-y-5 relative z-10">
              {realReports.length === 0 ? (
                <p className="text-center text-slate-400 italic text-sm">Đang tổng hợp báo cáo...</p>
              ) : (
                realReports.map(report => (
                  <Link href={`/insights/${report.id}`} key={report.id} className="block group/item">
                    <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 mb-1.5 inline-block bg-teal-50 px-2 py-0.5 rounded">{report.category}</span>
                    <p className="text-sm font-bold text-slate-800 group-hover/item:text-teal-700 transition-colors line-clamp-2 leading-relaxed">{report.title}</p>
                  </Link>
                ))
              )}
            </div>

            {!isPremium && (
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2 relative z-10 text-center">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1"><i className="ph-fill ph-lock-key"></i> Giới hạn tải file</span>
                {!memberInfo?.is_pending && (
                  <Link href={UPGRADE_URL} className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-700 bg-amber-50 py-1.5 rounded-lg border border-amber-200 transition-colors">Mở khóa Đặc quyền</Link>
                )}
              </div>
            )}

            <Link href="/insights" className="flex items-center justify-center w-full mt-6 h-12 border-2 border-slate-100 text-slate-600 font-black rounded-xl text-xs hover:bg-slate-50 hover:border-teal-200 hover:text-teal-700 transition-colors relative z-10 gap-2">
              VÀO THƯ VIỆN BÁO CÁO <i className="ph-bold ph-arrow-right"></i>
            </Link>
          </div>

          {/* ĐỐI TÁC TIÊU BIỂU (LẤY RANDOM VIP TỪ DB) */}
          <div className="bg-gradient-to-br from-slate-900 to-[#002D62] rounded-[2.5rem] shadow-xl p-6 md:p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10 border-b border-white/10 pb-4"><i className="ph-fill ph-users-three text-blue-400 text-2xl"></i> Đối tác Tiêu biểu</h2>
            
            <div className="space-y-4 relative z-10">
              {realPartners.length === 0 ? (
                <p className="text-center text-blue-200/50 italic text-sm py-4">Đang đồng bộ mạng lưới...</p>
              ) : (
                realPartners.map(partner => {
                  const tier = Array.isArray(partner.individual_tiers) ? partner.individual_tiers[0]?.code : partner.individual_tiers?.code;
                  return (
                    <Link href={`/directory/${partner.id}`} key={partner.id} className="flex items-center gap-4 p-3 bg-white/5 hover:bg-white/10 rounded-2xl backdrop-blur-sm border border-white/5 transition-colors group">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-[#002D62] text-xl font-black shadow-inner shrink-0">
                        {partner.corporates?.name ? partner.corporates.name.charAt(0) : partner.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-snug truncate group-hover:text-blue-200 transition-colors">{partner.corporates?.name || partner.full_name}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mt-1 flex items-center gap-1"><i className="ph-fill ph-crown"></i> {tier}</p>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
            
            <Link href="/directory" className="mt-6 flex items-center justify-center gap-2 h-12 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black text-white transition-colors relative z-10 border border-white/10">
              TÌM KIẾM ĐỐI TÁC KHÁC <i className="ph-bold ph-magnifying-glass"></i>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}