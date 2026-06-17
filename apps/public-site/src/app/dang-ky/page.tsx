'use client';

import { useState } from 'react';
import { supabase } from 'supabase/client'; 
import Link from 'next/link';

export default function JoinAlliancePage() {
  // State quản lý form và các bước
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ 
    fullName: '', phone: '', email: '', password: '' 
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // ==============================================================
      // BƯỚC 1: TẠO TÀI KHOẢN BẢO MẬT (AUTH) 
      // Supabase sẽ tự động gửi email xác thực dựa trên cấu hình của bạn
      // ==============================================================
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName, 
            phone: formData.phone,
          }
        }
      });

      if (authError) throw new Error('Lỗi tạo tài khoản: ' + authError.message);
      
      const userAuthId = authData.user?.id;
      if (!userAuthId) throw new Error('Không lấy được ID tài khoản!');

      // ==============================================================
      // BƯỚC 2: TẠO HỒ SƠ CÁ NHÂN VÀO DATABASE
      // Mặc định: Không có corporate_id, trạng thái ACTIVE (Không cần duyệt)
      // ==============================================================
      const { error: indError } = await supabase
        .from('individuals')
        .insert([{
          full_name: formData.fullName, 
          email: formData.email, 
          phone: formData.phone,
          corporate_id: null, 
          is_corporate_sponsored: false, 
          status: 'ACTIVE', // Kích hoạt ngay không cần phê duyệt
          join_date: new Date().toISOString(),
          user_auth_id: userAuthId
        }]);

      if (indError) throw new Error('Lỗi lưu hồ sơ cá nhân: ' + indError.message);

      // Chuyển sang trang kết quả yêu cầu check email
      setStep(2);
      
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        
        <div className="text-center mb-12 space-y-3">
          <div className="inline-block bg-[#002D62] text-amber-400 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest shadow-lg">
            Gia nhập Liên minh
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight font-heading">
            Tạo Tài Khoản Của Bạn
          </h1>
          <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
            Đăng ký hoàn toàn miễn phí để bắt đầu kết nối cùng Nichietsu Kensetsu Business Alliance (NKBA).
          </p>
        </div>

        {/* STEP 1: FORM ĐĂNG KÝ CÁ NHÂN */}
        {step === 1 && (
          <div className="bg-white p-8 sm:p-12 rounded-[2rem] border border-slate-200 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500 max-w-2xl mx-auto">
            <h3 className="font-black text-2xl text-slate-900 border-b-2 border-slate-100 pb-4 mb-8 flex items-center gap-3">
              <i className="ph-fill ph-user-circle text-[#002D62] text-3xl"></i> 
              Thông tin Đăng ký
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Họ và Tên (*)</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full px-4 h-12 border border-slate-200 rounded-xl transition bg-slate-50 font-bold outline-none focus:border-[#002D62]" placeholder="Ví dụ: Nguyễn Văn A" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Số điện thoại (*)</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className="w-full px-4 h-12 border border-slate-200 rounded-xl transition bg-slate-50 font-mono outline-none focus:border-[#002D62]" placeholder="09xxxxxxxxx" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Email đăng nhập (*)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 h-12 border border-slate-200 rounded-xl transition bg-slate-50 font-bold outline-none focus:border-[#002D62]" placeholder="email@domain.com" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Mật khẩu (*)</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} className="w-full px-4 h-12 border border-slate-200 rounded-xl transition bg-slate-50 font-mono outline-none focus:border-[#002D62]" placeholder="••••••••" />
                </div>
              </div>

              {errorMessage && (
                <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium border border-rose-100">
                  <i className="ph-fill ph-warning-circle mr-2"></i>{errorMessage}
                </div>
              )}

              <div className="pt-6 border-t border-slate-100">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full h-14 text-white font-black rounded-xl transition-all shadow-lg flex justify-center items-center gap-2 ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#002D62] hover:bg-blue-900 shadow-blue-900/20 hover:-translate-y-0.5'}`}
                >
                  {isSubmitting ? (
                    <><i className="ph-bold ph-spinner animate-spin text-xl"></i> ĐANG XỬ LÝ...</>
                  ) : (
                    <><i className="ph-bold ph-user-plus text-xl"></i> ĐĂNG KÝ MIỄN PHÍ</>
                  )}
                </button>
                <div className="text-center mt-4">
                  <p className="text-sm text-slate-500 font-medium">Đã có tài khoản? <Link href="/login" className="text-[#002D62] font-bold hover:underline">Đăng nhập ngay</Link></p>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: THÔNG BÁO XÁC THỰC EMAIL */}
        {step === 2 && (
          <div className="bg-white p-12 rounded-[2rem] border-4 border-emerald-200 shadow-2xl animate-in zoom-in-95 text-center max-w-2xl mx-auto">
            <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <i className="ph-fill ph-envelope-open text-5xl"></i>
            </div>
            
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">ĐĂNG KÝ THÀNH CÔNG!</h2>
            <p className="text-lg text-slate-600 font-medium mt-3 mb-8">
              Chào mừng <strong className="text-blue-700">{formData.fullName}</strong> đến với NKBA.
            </p>
            
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 leading-relaxed text-emerald-900 font-medium space-y-4 text-left">
              <p className="text-emerald-800">
                Hồ sơ của bạn đã được khởi tạo thành công. Để bảo mật, chúng tôi cần xác minh địa chỉ email của bạn trước khi bạn có thể đăng nhập.
              </p>
              
              <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-sm">
                <p className="text-rose-600 font-bold mb-2 flex items-center gap-2">
                  <i className="ph-fill ph-warning-circle text-xl"></i> Yêu cầu bắt buộc
                </p>
                <p className="text-sm text-slate-600">
                  Hệ thống vừa gửi một email kích hoạt đến địa chỉ <strong className="text-slate-800">{formData.email}</strong>. Vui lòng kiểm tra Hộp thư đến (hoặc thư mục Spam/Junk) và click vào đường link bên trong email để kích hoạt tài khoản.
                </p>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/login" className="inline-flex h-12 px-8 bg-[#002D62] text-white font-bold rounded-xl items-center gap-2 shadow-md hover:bg-blue-900 transition-colors">
                ĐÃ XÁC THỰC? VỀ TRANG ĐĂNG NHẬP <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}