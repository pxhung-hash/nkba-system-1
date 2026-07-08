'use client';

import './globals.css';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client'; 
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotiPanel, setShowNotiPanel] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // ĐÃ THÊM: State để ẩn/hiện menu Profile
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [supabase] = useState(() => createClient());
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    let notiChannel: any = null;

    const fetchUserAndNotis = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setCurrentUser(null);
        return;
      }

      // ==========================================
      // TÌM TRONG BẢNG HỘI VIÊN BẰNG USER_AUTH_ID
      // ==========================================
      const { data: profile } = await supabase
        .from('individuals')
        .select(`
          id, full_name, email, status,
          individual_tiers!individuals_tier_id_fkey(name, code)
        `)
        .eq('user_auth_id', user.id)
        .maybeSingle();

      if (profile) {
        // Chỉ khởi tạo Menu nếu tài khoản ACTIVE
        if (profile.status === 'ACTIVE') {
          setCurrentUser({
            id: profile.id,
            name: profile.full_name,
            email: profile.email || user.email,
            tier: Array.isArray(profile.individual_tiers) 
              ? profile.individual_tiers[0]?.name 
              : (profile.individual_tiers as any)?.name,
            is_admin: false
          });

          // Tải danh sách thông báo ban đầu
          const fetchInitialNotis = async () => {
            const { data: notis } = await supabase
              .from('notifications')
              .select('*')
              .eq('member_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(20);

            if (notis) setNotifications(notis);
          };

          await fetchInitialNotis();

          // 🚀 ĐÃ BỔ SUNG: REALTIME LISTENER - Lắng nghe thông báo mới
          notiChannel = supabase
            .channel('public:notifications')
            .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'notifications', filter: `member_id=eq.${profile.id}` },
              (payload) => {
                // Có thông báo mới thì nhét lên đầu mảng
                setNotifications(prev => [payload.new, ...prev]);
                
                // Mẹo nhỏ: Bật âm thanh báo ting tinh nếu thích
                // const audio = new Audio('/noti-sound.mp3'); audio.play();
              }
            )
            .subscribe();
        }
      } 
      else {
        // TÌM TRONG NHÂN VIÊN (DÀNH CHO ADMIN)
        const { data: empData } = await supabase
          .from('employees')
          .select('name, role, email')
          .eq('email', user.email)
          .maybeSingle();

        if (empData) {
          setCurrentUser({
            id: user.id,
            name: empData.name || 'Quản trị viên',
            email: empData.email || user.email,
            tier: empData.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : 'ADMIN',
            is_admin: true
          });
        }
      }
    };

    fetchUserAndNotis();

    // Dọn dẹp listener khi component bị hủy
    return () => {
      if (notiChannel) supabase.removeChannel(notiChannel);
    };
  }, [pathname, supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleReadNotification = async (noti: any) => {
    if (!noti.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', noti.id);
      setNotifications(notifications.map(n => n.id === noti.id ? { ...n, is_read: true } : n));
    }
    setShowNotiPanel(false);
    if (noti.link_url) {
      router.push(noti.link_url);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
  };

  const navItems = [
    { name: 'Tổng quan', path: '/', icon: 'ph-squares-four' },
    { name: 'Sàn Biz-Link', path: '/biz-link', icon: 'ph-handshake' },
    { name: 'Tuyển dụng', path: '/talent-hub', icon: 'ph-users-three' },
    { name: 'Insights VIP', path: '/insights', icon: 'ph-chart-polar' },
    { name: 'Mạng lưới', path: '/directory', icon: 'ph-globe-hemisphere-west' },
  ];

  return (
    <html lang="vi">
      <head>
        <script src="https://unpkg.com/@phosphor-icons/web" async></script>
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
          
          {!isLoginPage && (
            <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm relative">
              <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
                
                <div className="flex items-center gap-10">
                  <Link href="/" className="flex items-center group" onClick={() => {setShowMobileMenu(false); setShowProfileDropdown(false);}}>
                    <img 
                      src="/logo_ngang_vi.svg" 
                      alt="NKBA Logo" 
                      className="h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
                    />
                  </Link>
                  
                  <nav className="hidden lg:flex items-center gap-2">
                    {navItems.map(item => {
                      const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                      return (
                        <Link key={item.path} href={item.path} onClick={() => setShowProfileDropdown(false)} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isActive ? 'bg-blue-50 text-[#002D62]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                          <i className={item.icon}></i> {item.name}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4 relative">
                  
                  {/* CHUÔNG THÔNG BÁO */}
                  <button 
                    onClick={() => { setShowNotiPanel(!showNotiPanel); setShowMobileMenu(false); setShowProfileDropdown(false); }} 
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors relative ${showNotiPanel ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600'}`}
                  >
                    <i className={`ph ${unreadCount > 0 ? 'ph-bell-ringing' : 'ph-bell'} text-xl`}></i>
                    {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>}
                  </button>

                  {/* PANEL HIỂN THỊ THÔNG BÁO */}
                  {showNotiPanel && (
                    <div className="absolute top-14 right-10 md:right-40 w-[300px] md:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-[100] animate-in slide-in-from-top-2">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                        <h4 className="font-black text-slate-800">Thông báo của bạn</h4>
                        {unreadCount > 0 && <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">{unreadCount} chưa đọc</span>}
                      </div>
                      
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                          <div className="p-10 flex flex-col items-center text-center text-sm text-slate-400">
                            <i className="ph-fill ph-bell-slash text-4xl text-slate-200 mb-2"></i>
                            Chưa có thông báo nào.
                          </div>
                        ) : (
                          notifications.map(noti => (
                            <div key={noti.id} onClick={() => handleReadNotification(noti)} className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 ${!noti.is_read ? 'bg-blue-50/20' : ''}`}>
                              <div className="mt-1 shrink-0">
                                {!noti.is_read ? <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div> : <i className="ph-fill ph-check-circle text-slate-300"></i>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-tight mb-1 ${!noti.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{noti.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{noti.content}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">{new Date(noti.created_at).toLocaleString('vi-VN')}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
                  
                  {/* DROPDOWN MENU PROFILE */}
                  {currentUser ? (
                    <div className="relative">
                      <div 
                        onClick={() => { setShowProfileDropdown(!showProfileDropdown); setShowNotiPanel(false); setShowMobileMenu(false); }} 
                        className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1.5 pr-1.5 md:pr-3 rounded-full transition-colors"
                      >
                        <div className="text-right hidden md:block">
                          <p className={`text-sm font-black leading-tight transition-colors ${currentUser.is_admin ? 'text-rose-600' : 'text-slate-900 group-hover:text-blue-600'}`}>{currentUser.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${currentUser.is_admin ? 'text-rose-400' : 'text-amber-600'}`}>{currentUser.tier}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-black shadow-md border-2 border-white ring-2 ${currentUser.is_admin ? 'bg-gradient-to-br from-rose-500 to-red-600 ring-rose-100' : 'bg-gradient-to-br from-amber-400 to-amber-600 ring-amber-100'}`}>
                          {currentUser.name?.charAt(0) || 'N'}
                        </div>
                      </div>

                      {/* NỘI DUNG MENU THẢ XUỐNG */}
                      {showProfileDropdown && (
                        <div className="absolute top-14 right-0 w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col z-[100] animate-in slide-in-from-top-2">
                          <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <p className="text-sm font-black text-slate-900 line-clamp-1">{currentUser.name}</p>
                            <p className="text-[10px] font-bold text-slate-500 truncate">{currentUser.email}</p>
                          </div>
                          
                          {!currentUser.is_admin && (
                            <>
                              <Link href="/account" onClick={() => setShowProfileDropdown(false)} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><i className="ph-fill ph-user-gear text-lg"></i></div>
                                Sửa thông tin tài khoản
                              </Link>
                              <Link href="/profile" onClick={() => setShowProfileDropdown(false)} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-center gap-3 text-sm font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><i className="ph-fill ph-briefcase-metal text-lg"></i></div>
                                Cập nhật Hồ sơ Chuyên gia
                              </Link>
                            </>
                          )}
                          
                          <button onClick={() => { handleLogout(); setShowProfileDropdown(false); }} className="p-4 hover:bg-rose-50 transition-colors flex items-center gap-3 text-sm font-bold text-rose-600 text-left">
                            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center"><i className="ph-bold ph-sign-out text-lg"></i></div>
                            Đăng xuất
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-400 animate-pulse flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200"></div> <span className="hidden md:inline">Đang tải...</span>
                    </div>
                  )}

                  <button onClick={() => { setShowMobileMenu(!showMobileMenu); setShowNotiPanel(false); setShowProfileDropdown(false); }} className="lg:hidden w-10 h-10 ml-1 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors">
                    <i className={`ph-bold ${showMobileMenu ? 'ph-x' : 'ph-list'} text-xl`}></i>
                  </button>

                </div>
              </div>

              {showMobileMenu && (
                <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-b border-slate-200 shadow-xl animate-in slide-in-from-top-2">
                  <nav className="flex flex-col px-4 py-4 gap-2">
                    {navItems.map(item => {
                      const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
                      return (
                        <Link key={item.path} href={item.path} onClick={() => setShowMobileMenu(false)} className={`px-4 py-3 rounded-xl text-base font-bold flex items-center gap-3 transition-all ${isActive ? 'bg-blue-50 text-[#002D62]' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <i className={`${item.icon} text-xl`}></i> {item.name}
                        </Link>
                      );
                    })}
                    <div className="h-px bg-slate-100 my-2"></div>
                    
                    {!currentUser?.is_admin && (
                      <>
                        <Link href="/account" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-base font-bold flex items-center gap-3 text-slate-600 hover:bg-slate-50 transition-all text-left">
                          <i className="ph-fill ph-user-gear text-xl"></i> Sửa thông tin tài khoản
                        </Link>
                        <Link href="/profile" onClick={() => setShowMobileMenu(false)} className="px-4 py-3 rounded-xl text-base font-bold flex items-center gap-3 text-slate-600 hover:bg-slate-50 transition-all text-left">
                          <i className="ph-fill ph-briefcase-metal text-xl"></i> Hồ sơ Chuyên gia
                        </Link>
                      </>
                    )}

                    <button onClick={handleLogout} className="px-4 py-3 rounded-xl text-base font-bold flex items-center gap-3 text-rose-500 hover:bg-rose-50 transition-all text-left">
                      <i className="ph-bold ph-sign-out text-xl"></i> Đăng xuất
                    </button>
                  </nav>
                </div>
              )}
            </header>
          )}

          <main className="flex-1 w-full relative">
            {children}
          </main>
          
        </div>
      </body>
    </html>
  );
}