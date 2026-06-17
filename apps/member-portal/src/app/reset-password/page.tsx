'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; // Tích hợp thêm useSearchParams vào đây
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  
  // ĐỌC THAM SỐ LỖI TỪ URL (Ví dụ: khi link đổi mật khẩu hết hạn hoặc đã dùng)
  const searchParams = useSearchParams();
  const errorDescription = searchParams.get('error_description');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Khởi tạo Supabase client ở phía trình duyệt
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // 1. Kiểm tra 2 mật khẩu có khớp nhau không
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);

    // 2. Gọi API Supabase để cập nhật mật khẩu mới
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...');
      // Đợi 2 giây rồi đẩy user về trang login
      setTimeout(() => {
        router.push('/login'); 
      }, 2000);
    }
  };

  // =========================================================================
  // TRƯỜNG HỢP 1: NẾU LINK HẾT HẠN HOẶC BỊ LỖI -> HIỂN THỊ THÔNG BÁO LỖI
  // =========================================================================
  if (errorDescription) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border-t-4 border-rose-500 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ph-fill ph-warning-circle text-3xl"></i>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Đường link không hợp lệ</h2>
          <p className="text-sm text-slate-500 mb-6">Đường link đổi mật khẩu này đã được sử dụng hoặc đã hết hạn. Vui lòng yêu cầu một đường link mới.</p>
          <Link href="/forgot-password" className="inline-block px-6 py-3 bg-[#002D62] text-white rounded-xl font-bold hover:bg-blue-900 transition-colors">
            Gửi lại yêu cầu
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRƯỜNG HỢP 2: ĐƯỜNG LINK HỢP LỆ -> HIỂN THỊ FORM ĐỔI MẬT KHẨU NHƯ BÌNH THƯỜNG
  // =========================================================================
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-slate-100 animate-in fade-in duration-300">
        <h1 className="text-2xl font-black text-[#002D62] text-center mb-2">Đặt lại mật khẩu</h1>
        <p className="text-sm text-slate-500 text-center mb-8">Vui lòng nhập mật khẩu mới cho tài khoản của bạn.</p>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#002D62]/20 focus:border-[#002D62] transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#002D62]/20 focus:border-[#002D62] transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 text-green-600 text-sm font-medium rounded-lg animate-in fade-in duration-200">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#002D62] hover:bg-blue-900 text-white font-bold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center"
          >
            {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}