'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link'; // ĐÃ BỔ SUNG IMPORT LINK

export default function DashboardHome() {
  const router = useRouter();
  const supabase = createClient();
  
  // State quản lý Auth
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminRole, setAdminRole] = useState('');

  // State quản lý Data Thống kê
  const [totalMembers, setTotalMembers] = useState<number>(0);
  const [pendingKyc, setPendingKyc] = useState<number>(0);
  const [activeProjects, setActiveProjects] = useState<number>(0);
  const [totalTalents, setTotalTalents] = useState<number>(0);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      // 1. Kiểm tra session đăng nhập
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // Nếu không có user, đá văng về trang login
      if (error || !user) {
        console.warn('Không tìm thấy User Session, chuyển hướng về Login');
        router.push('/login');
        return;
      }

      // 2. Lấy Role từ bảng employees để hiển thị
      const { data: userData, error: dbError } = await supabase
        .from('employees')
        .select('role')
        .eq('email', user.email)
        .single();

      if (dbError) {
        console.error('Lỗi khi truy vấn Role:', dbError);
      }

      setAdminEmail(user.email || '');
      if (userData) {
        setAdminRole(userData.role);
      }

      // 3. Lấy dữ liệu thống kê (Sử dụng Promise.all để fetch song song cho nhanh)
      try {
        const [
          { count: membersCount },
          { count: kycCount },
          { count: projectsCount },
          { count: talentsCount }
        ] = await Promise.all([
          // TODO: Thay 'individuals' hoặc 'corporates' bằng tên bảng hội viên thực tế
          supabase.from('individuals').select('*', { count: 'exact', head: true }),
          
          // TODO: Thay 'kyc_applications' và điều kiện 'status' bằng cấu trúc thực tế
          supabase.from('individuals').select('*', { count: 'exact', head: true }).eq('status', 'PENDING_UPGRADE'),
          
          // TODO: Thay 'biz_links' và điều kiện 'status' tương ứng
          supabase.from('projects').select('*', { count: 'exact', head: true }),
          
          // TODO: Thay 'talents' bằng tên bảng chuyên gia thực tế
          supabase.from('jobs').select('*', { count: 'exact', head: true })
        ]);

        setTotalMembers(membersCount || 0);
        setPendingKyc(kycCount || 0);
        setActiveProjects(projectsCount || 0);
        setTotalTalents(talentsCount || 0);

      } catch (metricsError) {
        console.error('Lỗi khi tải dữ liệu thống kê:', metricsError);
      }
      
      setLoading(false);
    };

    checkAuthAndFetchData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-[#002D62] font-bold animate-pulse">
          <i className="ph-bold ph-spinner animate-spin text-4xl"></i>
          <span>Đang tải không gian quản trị...</span>
        </div>
      </div>
    );
  }

  // Nếu bằng một cách nào đó lọt qua được nhưng không có email
  if (!adminEmail) {
      return null;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Tổng quan Hệ sinh thái</h2>
            <p className="text-slate-500">Số liệu cập nhật trực tiếp từ hệ thống NKBA</p>
          </div>
          
          <div className="text-left md:text-right bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">Đang truy cập bởi</p>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#002D62]">{adminEmail}</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black tracking-widest uppercase rounded">
                    {adminRole || 'ADMIN'}
                </span>
              </div>
          </div>
      </div>

      {/* Thẻ Thống kê (Metrics Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-600 relative overflow-hidden group">
          <i className="ph-fill ph-users absolute -right-4 -bottom-4 text-6xl text-blue-50 group-hover:scale-110 transition-transform"></i>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Tổng Hội Viên</p>
          <h3 className="text-4xl font-black text-slate-900 mt-2 relative z-10">{totalMembers}</h3>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1 relative z-10"><i className="ph-bold ph-trend-up"></i> Cập nhật lúc này</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500 relative overflow-hidden group">
          <i className="ph-fill ph-file-search absolute -right-4 -bottom-4 text-6xl text-amber-50 group-hover:scale-110 transition-transform"></i>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Hồ sơ chờ Duyệt</p>
          <h3 className="text-4xl font-black text-slate-900 mt-2 relative z-10">{pendingKyc}</h3>
          <p className="text-xs text-amber-600 font-bold mt-2 flex items-center gap-1 relative z-10"><i className="ph-bold ph-warning-circle"></i> Cần xử lý ngay</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-indigo-600 relative overflow-hidden group">
          <i className="ph-fill ph-handshake absolute -right-4 -bottom-4 text-6xl text-indigo-50 group-hover:scale-110 transition-transform"></i>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Dự án Biz-Link</p>
          <h3 className="text-4xl font-black text-slate-900 mt-2 relative z-10">{activeProjects}</h3>
          <p className="text-xs text-slate-500 font-bold mt-2 flex items-center gap-1 relative z-10"><i className="ph-bold ph-folder-open"></i> Đang mở thầu</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-600 relative overflow-hidden group">
          <i className="ph-fill ph-briefcase absolute -right-4 -bottom-4 text-6xl text-emerald-50 group-hover:scale-110 transition-transform"></i>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest relative z-10">Việc làm J-Job</p>
          <h3 className="text-4xl font-black text-slate-900 mt-2 relative z-10">{totalTalents}</h3>
          <p className="text-xs text-emerald-600 font-bold mt-2 flex items-center gap-1 relative z-10"><i className="ph-bold ph-users-three"></i> Đang tuyển dụng</p>
        </div>
      </div>

      {/* 🚀 LỐI TẮT CÔNG CỤ (QUICK ACCESS) */}
      <h3 className="text-lg font-black text-slate-900 pt-4 flex items-center gap-2">
        <i className="ph-fill ph-lightning text-amber-500"></i> Lối tắt Công cụ
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nút 1: Sự kiện (Mới thêm) */}
        <Link 
          href="/events" 
          className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 md:p-8 rounded-3xl shadow-lg text-white hover:shadow-xl hover:-translate-y-1 transition-all group flex items-center justify-between overflow-hidden relative"
        >
          <i className="ph-fill ph-confetti absolute right-0 top-0 text-[120px] opacity-10 -rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2">
              <i className="ph-fill ph-calendar-star text-amber-200 text-3xl"></i>
              Sự kiện & Lễ tân
            </h3>
            <p className="text-orange-100 text-sm font-medium">Tạo sự kiện mới, xuất QR Check-in và mở màn hình Live Connect.</p>
          </div>
          <div className="w-12 h-12 shrink-0 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors relative z-10 ml-4">
            <i className="ph-bold ph-arrow-right text-xl text-white group-hover:translate-x-1 transition-transform"></i>
          </div>
        </Link>

        {/* Nút 2: Plan Manage (Giữ nguyên từ bản cũ nhưng style lại đẹp hơn) */}
        <Link 
          href="/plan-manage" 
          className="bg-gradient-to-br from-[#002D62] to-blue-900 p-6 md:p-8 rounded-3xl shadow-lg text-white hover:shadow-xl hover:-translate-y-1 transition-all group flex items-center justify-between overflow-hidden relative"
        >
          <i className="ph-fill ph-file-html absolute right-0 top-0 text-[120px] opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-500"></i>
          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2">
              <i className="ph-fill ph-file-code text-blue-300 text-3xl"></i>
              Kế hoạch Hành động
            </h3>
            <p className="text-blue-200 text-sm font-medium">Mini-IDE để biên tập, xem trước & lưu trữ tài liệu HTML.</p>
          </div>
          <div className="w-12 h-12 shrink-0 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors relative z-10 ml-4">
            <i className="ph-bold ph-arrow-right text-xl text-blue-300 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </Link>
      </div>

      {/* Khu vực Biểu đồ */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm min-h-[400px] flex items-center justify-center">
        <div className="text-center text-slate-400">
          <div className="w-20 h-20 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <i className="ph-duotone ph-chart-line-up text-5xl text-slate-300"></i>
          </div>
          <h4 className="text-lg font-bold text-slate-600 mb-1">Khu vực Biểu đồ Tăng trưởng</h4>
          <p className="font-medium text-sm">Sẽ tích hợp dữ liệu Chart.js trong giai đoạn tiếp theo.</p>
        </div>
      </div>
    </div>
  );
}