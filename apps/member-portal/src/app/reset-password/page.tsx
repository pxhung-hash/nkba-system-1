'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get('code'); // Bắt mã code trực tiếp từ URL email gửi tới

  const [email, setEmail] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loadingToken, setLoadingToken] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 1. TỰ ĐỘNG CẤP QUYỀN KHI VÀO TRANG
  useEffect(() => {
    const verifyCodeAndGetSession = async () => {
      if (code) {
        // Đổi mã code lấy quyền đăng nhập (Session) ngay trên trình duyệt
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          setMessage({ type: 'error', text: 'Đường link đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu link mới!' });
        } else if (data.session?.user?.email) {
          // KÉO MAIL CỦA HỌ VÀO GIAO DIỆN NHƯ Ý BẠN MUỐN
          setEmail(data.session.user.email);
        }
      } else {
        // Nếu vào trang mà không có code (tự gõ url) -> check xem có session cũ không
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          setEmail(session.user.email);
        } else {
          setMessage({ type: 'error', text: 'Không tìm thấy mã xác thực. Vui lòng bấm vào link trong email!' });
        }
      }
      setLoadingToken(false);
    };

    verifyCodeAndGetSession();
  }, [code, supabase]);

  // 2. XỬ LÝ LƯU MẬT KHẨU MỚI
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    // Cập nhật mật khẩu mới cho user
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setIsSubmitting(false);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Cập nhật mật khẩu thành công! Đang chuyển hướng...' });
      // Tự động đẩy về trang chủ hoặc dashboard sau 2 giây
      setTimeout(() => {
        router.push('/');
      }, 2000);
    }
  };

  if (loadingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i>
          <p className="text-slate-500 font-medium text-sm">Đang kiểm tra liên kết bảo mật...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 animate-in fade-in duration-500">
        <h1 className="text-2xl font-black text-[#002D62] text-center mb-2">Tạo mật khẩu mới</h1>
        
        {email ? (
          <p className="text-sm text-slate-500 text-center mb-8">
            Hệ thống đã xác nhận tài khoản:<br/>
            <strong className="text-[#002D62] bg-blue-50 px-3 py-1 rounded-full inline-block mt-2">{email}</strong>
          </p>
        ) : (
          <p className="text-sm text-slate-500 text-center mb-8">
            Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
          </p>
        )}

        {message?.type === 'error' && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-bold flex items-start gap-2">
            <i className="ph-fill ph-warning-circle text-lg shrink-0"></i>
            <p>{message.text}</p>
          </div>
        )}

        {message?.type === 'success' && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600 text-sm font-bold flex items-start gap-2">
            <i className="ph-fill ph-check-circle text-lg shrink-0"></i>
            <p>{message.text}</p>
          </div>
        )}

        {/* Chỉ hiện form nếu đã bắt được email hợp lệ */}
        {email && message?.type !== 'success' && (
          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 h-12 rounded-xl border-2 border-slate-100 focus:outline-none focus:border-[#002D62] transition-colors font-mono"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 h-12 rounded-xl border-2 border-slate-100 focus:outline-none focus:border-[#002D62] transition-colors font-mono"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 mt-4 bg-[#002D62] hover:bg-blue-900 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><i className="ph-bold ph-spinner animate-spin text-xl"></i> ĐANG LƯU...</>
              ) : (
                'CẬP NHẬT MẬT KHẨU'
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <Link href="/login" className="text-sm font-bold text-slate-400 hover:text-[#002D62] transition-colors">
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}