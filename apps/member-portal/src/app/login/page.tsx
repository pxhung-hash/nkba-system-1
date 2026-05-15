'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Xác thực Email & Mật khẩu bằng Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !authData.user) {
        throw new Error('Sai email hoặc mật khẩu. Vui lòng thử lại!');
      }

      // 2. KIỂM TRA TRẠNG THÁI HỒ SƠ (Chỉ ACTIVE mới được vào)
      // Lấy ID cá nhân được lưu ngầm trong metadata lúc đăng ký
      const individualId = authData.user.user_metadata?.individual_id;

      if (individualId) {
        // Truy vấn xuống bảng individuals để kiểm tra status
        const { data: profile, error: profileError } = await supabase
          .from('individuals')
          .select('status')
          .eq('id', individualId)
          .single();

        if (profileError) throw new Error('Không tìm thấy hồ sơ hội viên.');

        if (profile.status === 'REJECTED') {
          await supabase.auth.signOut();
          throw new Error('Hồ sơ của bạn đã bị từ chối. Vui lòng liên hệ bộ phận hỗ trợ.');
        }
        
        if (profile.status === 'PENDING_VERIFICATION' || profile.status === 'PENDING_APPROVAL') {
          await supabase.auth.signOut(); // Đăng xuất ra ngay lập tức
          throw new Error('Hồ sơ đang trong quá trình xét duyệt. Chúng tôi sẽ thông báo khi thẻ được cấp phép!');
        }

        if (profile.status === 'PENDING_DELETION' || profile.status === 'ARCHIVED') {
          await supabase.auth.signOut();
          throw new Error('Tài khoản này đã bị khóa hoặc ngừng hoạt động.');
        }

        // Nếu qua hết các ải trên (status là ACTIVE) -> Cho vào nhà!
        router.push('/'); 
      } else {
        // Trường hợp là nhân sự (nhân viên NKBA) đăng nhập nhầm cổng này
        // Có thể cho vào hoặc báo lỗi tùy bạn, ở đây tạm thời cho vào.
        router.push('/'); 
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 w-full overflow-hidden">
      
      {/* NỬA TRÁI: ĐỒ HỌA THƯƠNG HIỆU (Ẩn trên mobile) */}
      <div className="hidden lg:flex w-1/2 bg-[#002D62] relative p-12 flex-col justify-between overflow-hidden">
        {/* Các mảng màu trang trí (Background Blur) */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -translate-x-1/4 translate-y-1/3"></div>
        <div className="absolute top-1/2 left-1/4 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#002D62] font-black text-2xl shadow-xl">
            NK
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <p className="text-blue-300 font-bold tracking-widest text-sm uppercase mb-4">Hệ sinh thái B2B</p>
          <h1 className="text-5xl font-black text-white leading-tight tracking-tight mb-6">
            Kiến tạo liên minh, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">vươn tầm quốc tế.</span>
          </h1>
          <p className="text-blue-100/80 text-lg leading-relaxed">
            Truy cập Trung tâm điều hành để kết nối với các đối tác chiến lược, theo dõi dự án và nhận báo cáo thị trường độc quyền.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-blue-200 text-sm font-medium">
          <i className="ph-fill ph-shield-check text-2xl text-amber-400"></i>
          Được bảo mật theo chuẩn Enterprise
        </div>
      </div>

      {/* NỬA PHẢI: FORM ĐĂNG NHẬP */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Logo cho Mobile (Chỉ hiện khi ẩn màn hình trái) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-12 h-12 bg-[#002D62] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">NK</div>
          </div>

          <div className="text-center lg:text-left mb-10">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Đăng nhập Portal</h2>
            <p className="text-slate-500 mt-2 font-medium">Nhập thông tin tài khoản hội viên của bạn</p>
          </div>
          
          {errorMsg && (
            <div className="mb-6 p-4 text-sm font-bold text-rose-600 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl flex items-start gap-3 animate-in shake">
              <i className="ph-fill ph-warning-circle text-lg mt-0.5 shrink-0"></i>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700">Địa chỉ Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <i className="ph-fill ph-envelope-simple text-lg"></i>
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nkba.vn"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-slate-700">Mật khẩu</label>
                <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <i className="ph-fill ph-lock-key text-lg"></i>
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white bg-[#002D62] rounded-xl hover:bg-blue-900 font-black tracking-wide shadow-xl shadow-blue-900/20 disabled:opacity-70 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <i className="ph-bold ph-spinner animate-spin text-xl"></i>
                  ĐANG XÁC THỰC...
                </>
              ) : (
                <>
                  TRUY CẬP HỆ THỐNG
                  <i className="ph-bold ph-arrow-right text-lg group-hover:translate-x-1 transition-transform"></i>
                </>
              )}
            </button>
          </form>

          {/* KHU VỰC CÁC ĐƯỜNG LINK ĐIỀU HƯỚNG PHỤ */}
          <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col items-center gap-6">
            
            {/* ĐÃ SỬA: Đổi link sang /upgrade thay vì /dang-ky bị lỗi 404 */}
            <p className="text-center text-sm font-medium text-slate-500">
              Doanh nghiệp của bạn chưa là hội viên?{' '}
              <a href="/upgrade" className="text-[#002D62] font-bold hover:underline">Đăng ký tham gia liên minh</a>
            </p>

            {/* BỔ SUNG: Nút tắt dành cho Admin (Trỏ về Admin Workspace) */}
            <a 
              href="https://admin.nkba.vn/login" 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-xs font-bold text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
              title="Truy cập khu vực Ban Quản Trị"
            >
              <i className="ph-fill ph-shield-star text-base"></i>
              DÀNH CHO BAN QUẢN TRỊ
            </a>

          </div>

        </div>
      </div>

    </div>
  );
}