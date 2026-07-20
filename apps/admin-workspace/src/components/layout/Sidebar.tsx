'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // STATE GIAO DIỆN
  const [isOpen, setIsOpen] = useState(false); // Dành cho Mobile (Hamburger)
  const [isCollapsed, setIsCollapsed] = useState(false); // Dành cho Desktop (Thu gọn)

  // STATE PHÂN QUYỀN (RBAC)
  const [allowedPaths, setAllowedPaths] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Lắng nghe tín hiệu từ nút Hamburger bên Header
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleMobileSidebar', handleToggle);
    return () => window.removeEventListener('toggleMobileSidebar', handleToggle);
  }, []);

  // Tự động đóng Sidebar trên Mobile mỗi khi click vào 1 trang mới
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // HÚT DỮ LIỆU PHÂN QUYỀN TỪ DATABASE
  useEffect(() => {
    const fetchPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Tìm xem người này có role gì trong bảng employees
      const { data: emp } = await supabase
        .from('employees')
        .select('role')
        .eq('email', user.email) // Dùng email để đối chiếu cho chắc chắn
        .single();

      if (emp) {
        setUserRole(emp.role);

        // 2. Nếu là SUPER_ADMIN -> Cấp kim bài miễn tử (Thấy hết)
        if (emp.role === 'SUPER_ADMIN') {
          setAllowedPaths(['ALL']);
        } else {
          // 3. Nếu là role khác -> Vào bảng role_permissions lấy các path được phép
          const { data: perms } = await supabase
            .from('role_permissions')
            .select('module_path')
            .eq('role_code', emp.role)
            .eq('can_access', true);

          if (perms) {
            setAllowedPaths(perms.map(p => p.module_path));
          }
        }
      }
    };

    fetchPermissions();
  }, []);

  // DANH SÁCH MENU 
  const menuItems = [
    { isDivider: true, title: 'Tổng quan & Chiến lược' },
    { title: 'Dashboard', path: '/', icon: 'ph-squares-four' },
    { title: 'Tầm nhìn & Chiến lược', path: '/strategy/vision', icon: 'ph-compass' },
    { title: 'Kế hoạch năm (OKRs)', path: '/strategy/planning', icon: 'ph-target' },
    { title: 'Theo dõi Thực thi', path: '/strategy/execution', icon: 'ph-kanban' },

    { isDivider: true, title: 'Công cụ làm việc' },
    { title: 'Quản lý Kế hoạch', path: '/plan-manage', icon: 'ph-file-html' },

    { isDivider: true, title: 'Nội bộ NKBA' },
    { title: 'Quản lý Tổ chức', path: '/organization', icon: 'ph-git-branch' },
    { title: 'Quản trị Nhân sự', path: '/employees', icon: 'ph-identification-badge' },
    { title: 'Cấu hình Phân quyền', path: '/roles', icon: 'ph-shield-check' }, 

    { isDivider: true, title: 'Hệ sinh thái Hội viên' },
    { title: 'Cấu hình Gói cước', path: '/settings/tiers', icon: 'ph-wallet' }, 
    { title: 'Quản lý Pháp nhân', path: '/members/corporates', icon: 'ph-buildings' }, 
    { title: 'Quản lý Hội viên', path: '/members/individuals', icon: 'ph-user-list' }, 
    { title: 'Danh sách Cũ (Tất cả)', path: '/members', icon: 'ph-users-three' }, 
    { title: 'Duyệt KYC (Pending)', path: '/members/pending', icon: 'ph-user-check' },

    { isDivider: true, title: 'Dự án & Kết nối' },
    { title: 'Biz-Link (Dự án)', path: '/biz-link/projects', icon: 'ph-handshake' },
    { title: 'Talent-Hub', path: '/talent-hub', icon: 'ph-briefcase' },
    
    // 👇 THÊM DÒNG NÀY VÀO ĐÂY 👇
    { title: 'Quản lý Sự kiện', path: '/events', icon: 'ph-calendar-star' }, 
    
    { title: 'Insights & Báo cáo', path: '/insights', icon: 'ph-chart-bar' },
  ];

  // HÀM KIỂM TRA QUYỀN ĐỂ ẨN/HIỆN MENU
  const canAccess = (path?: string) => {
    if (!path) return true; // Nếu là Divider thì bỏ qua
    if (path === '/') return true; // Trang chủ Dashboard ai cũng được vào
    if (allowedPaths.includes('ALL')) return true; // SUPER_ADMIN
    return allowedPaths.includes(path); // Đối chiếu với CSDL
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <>
      {/* OVERLAY DÀNH CHO MOBILE */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[998] md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-[999] bg-[#002D62] text-white flex flex-col h-full shadow-2xl md:shadow-xl
        transform transition-all duration-300 ease-in-out md:relative md:translate-x-0
        w-72 ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        
        {/* Logo & Toggle Button Area */}
        <div className={`h-20 flex items-center border-b border-white/10 shrink-0 ${isCollapsed ? 'md:justify-center px-4 md:px-0' : 'justify-between px-4 lg:px-6'}`}>
          {/* Text Logo - Ẩn khi thu gọn trên Desktop */}
          <h1 className={`text-2xl font-black tracking-widest truncate ${isCollapsed ? 'md:hidden' : 'block'}`}>
            NKBA<span className="text-blue-400">.ADMIN</span>
          </h1>
          
          {/* Short Logo - Chỉ hiện khi thu gọn trên Desktop */}
          <h1 className={`text-2xl font-black tracking-widest text-center hidden ${isCollapsed ? 'md:block' : ''}`}>
            NK
          </h1>

          {/* Nút đóng Sidebar trên Mobile */}
          <button 
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0"
            onClick={() => setIsOpen(false)}
          >
            <i className="ph ph-x text-lg"></i>
          </button>

          {/* Nút Thu gọn / Mở rộng trên Desktop */}
          <button 
            className={`hidden md:flex w-8 h-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 ${isCollapsed ? 'mt-4' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            <i className={`ph-bold ${isCollapsed ? 'ph-caret-right' : 'ph-caret-left'} text-lg`}></i>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className={`flex-1 py-6 space-y-1.5 overflow-y-auto custom-scrollbar ${isCollapsed ? 'md:px-2 px-4' : 'px-4'}`}>
          
          {menuItems.map((item, index) => {
            if (item.path && !canAccess(item.path)) return null;

            if (item.isDivider) {
              return (
                <div key={`div-${index}`} className={`pt-4 pb-1 mt-2 first:mt-0 ${isCollapsed ? 'md:px-0 md:text-center px-2' : 'px-2'}`}>
                  {/* Text Divider - Ẩn khi thu gọn trên Desktop */}
                  <p className={`text-[10px] font-black text-white/40 uppercase tracking-widest truncate ${isCollapsed ? 'md:hidden' : 'block'}`}>
                    {item.title}
                  </p>
                  {/* Line Divider - Chỉ hiện khi thu gọn trên Desktop thay cho text */}
                  <div className={`h-px bg-white/10 w-8 mx-auto my-2 hidden ${isCollapsed ? 'md:block' : ''}`}></div>
                </div>
              );
            }

            const isActive = item.path && (pathname === item.path || (pathname.startsWith(item.path) && item.path !== '/'));
            
            return (
              <Link 
                key={item.path} 
                href={item.path!}
                title={isCollapsed ? item.title : undefined}
                className={`flex items-center py-3 rounded-xl transition-all duration-200 
                  ${isCollapsed ? 'md:justify-center md:px-0 px-4 gap-3' : 'px-4 gap-3'}
                  ${isActive ? 'bg-white/10 text-white font-bold shadow-sm' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}
              >
                <i className={`ph ${item.icon} text-xl shrink-0`}></i>
                {/* Text Menu - Ẩn khi thu gọn trên Desktop */}
                <span className={`text-sm truncate ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  {item.title}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area (Logout) */}
        <div className={`p-4 border-t border-white/10 shrink-0 ${isCollapsed ? 'md:px-2' : ''}`}>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Đăng xuất" : undefined}
            className={`flex items-center py-3 w-full rounded-xl text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors 
              ${isCollapsed ? 'md:justify-center md:px-0 px-4 gap-3' : 'px-4 gap-3'}`}
          >
            <i className="ph ph-sign-out text-xl shrink-0"></i>
            {/* Text Đăng xuất - Ẩn khi thu gọn trên Desktop */}
            <span className={`text-sm font-bold truncate ${isCollapsed ? 'md:hidden' : 'block'}`}>Đăng xuất</span>
          </button>
        </div>
        
      </aside>
    </>
  );
}