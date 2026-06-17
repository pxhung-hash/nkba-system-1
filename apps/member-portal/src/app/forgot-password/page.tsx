'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Khởi tạo Supabase client ở phía trình duyệt
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    // ĐOẠN CODE CỦA BẠN ĐƯỢC ĐẶT Ở ĐÂY
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      // Đổi thành http://localhost:3000/reset-password nếu bạn đang chạy local
      redirectTo: 'https://portal.nkba.vn/reset-password', 
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMessage('Đường link khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư email của bạn.');
      setEmail(''); // Xóa trắng ô nhập sau khi gửi thành công
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-slate-100">
        <h1 className="text-2xl font-black text-[#002D62] text-center mb-2">Quên mật khẩu?</h1>
        <p className="text-sm text-slate-500 text-center mb-8">
          Nhập email bạn đã đăng ký, chúng tôi sẽ gửi link để đặt lại mật khẩu.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Địa chỉ Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#002D62]/20 focus:border-[#002D62] transition-all"
              placeholder="ví dụ: contact@nkba.vn"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-50 text-green-600 text-sm font-medium rounded-lg">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#002D62] hover:bg-blue-900 text-white font-bold rounded-xl transition-all disabled:opacity-70 flex items-center justify-center"
          >
            {isLoading ? 'Đang gửi...' : 'Gửi link khôi phục'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-semibold text-slate-500 hover:text-[#002D62] transition-colors">
            Quay lại trang Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}