'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'; // Import CHUẨN

export default function UpgradeMembershipPage() {
  const [supabase] = useState(() => createClient()); // Khởi tạo Supabase client
  
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Chọn gói, 2: Thanh toán, 3: Thành công
  
  // State lưu thông tin người dùng
  const [realIndividualId, setRealIndividualId] = useState<string | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // State upload biên lai
  const [receiptUrl, setReceiptUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Tải danh sách các gói cước
    const fetchTiers = async () => {
      const { data } = await supabase.from('individual_tiers').select('*').gt('annual_fee', 0);
      if (data) setTiers(data);
    };

    // 2. Tìm ID chuẩn xác của người dùng đang đăng nhập
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAuthUserId(user.id);
        
        // Truy tìm ID thật trong bảng individuals
        const { data: profile } = await supabase
          .from('individuals')
          .select('id')
          .eq('user_auth_id', user.id)
          .maybeSingle();

        if (profile) {
          setRealIndividualId(profile.id);
        }
      }
      setIsLoadingUser(false);
    };

    fetchTiers();
    fetchUser();
  }, [supabase]);

  // Hàm tạo link ảnh VietQR tự động
  const getVietQR = (amount: number, content: string) => {
    const BANK_ID = "MB"; // Mã ngân hàng (VD: MB, VCB, ACB)
    const ACCOUNT_NO = "123456789"; // Số TK của NKBA
    const ACCOUNT_NAME = "HIEP HOI NKBA";
    return `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.jpg?amount=${amount}&addInfo=${content}&accountName=${ACCOUNT_NAME}`;
  };

  // Nộp biên lai để nhân viên duyệt thủ công
  const handleManualSubmit = async () => {
    if (!receiptUrl) return alert('Vui lòng cung cấp link ảnh biên lai!');
    if (!realIndividualId) return alert('Lỗi hệ thống: Không tìm thấy hồ sơ Hội viên của bạn!');
    
    setIsSubmitting(true);

    // Cập nhật Database: Ép tìm đúng 'id' của bảng individuals
    const { error } = await supabase.from('individuals').update({
      upgrade_tier_id: selectedTier.id,
      payment_receipt_url: receiptUrl,
      status: 'PENDING_VERIFICATION' // Đưa vào trạm xác minh của NV
    }).eq('id', realIndividualId);

    setIsSubmitting(false);
    if (!error) {
      setStep(3); // Bước thành công
    } else {
      alert('Lỗi cập nhật hệ thống: ' + error.message);
    }
  };

  // Nếu đang tải thông tin User
  if (isLoadingUser) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i></div>;
  }

  // Nếu không tìm thấy hồ sơ
  if (!realIndividualId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md border-l-4 border-rose-500">
          <p className="text-rose-600 font-black mb-2">Không thể nâng cấp!</p>
          <p className="text-slate-600 font-medium">Tài khoản này chưa được liên kết với hồ sơ Hội viên (Hoặc bạn đang là Admin).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#002D62] uppercase tracking-tight">Nâng cấp Đặc quyền</h1>
          <p className="text-slate-500 font-medium">Lựa chọn gói hội viên phù hợp để mở khóa toàn bộ tiện ích của hệ sinh thái NKBA.</p>
        </div>

        {/* BƯỚC 1: CHỌN GÓI */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {tiers.map(tier => (
              <div key={tier.id} className={`p-8 rounded-3xl border-2 transition-all cursor-pointer ${selectedTier?.id === tier.id ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:border-amber-300'}`} onClick={() => setSelectedTier(tier)}>
                <h3 className="text-xl font-black text-slate-800">{tier.name}</h3>
                <p className="text-3xl font-black text-amber-600 mt-2">{Number(tier.annual_fee).toLocaleString('vi-VN')}đ <span className="text-sm text-slate-400 font-medium">/năm</span></p>
                <div className="mt-6">
                  <button className={`w-full py-3 rounded-xl font-bold transition-all ${selectedTier?.id === tier.id ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}>
                    {selectedTier?.id === tier.id ? 'ĐANG CHỌN' : 'CHỌN GÓI NÀY'}
                  </button>
                </div>
              </div>
            ))}
            
            <div className="md:col-span-2 text-center mt-4">
              <button onClick={() => setStep(2)} disabled={!selectedTier} className="px-10 py-4 bg-[#002D62] text-white font-black rounded-full shadow-xl shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 transition-all">
                TIẾN HÀNH THANH TOÁN
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: THANH TOÁN */}
        {step === 2 && selectedTier && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-2xl mx-auto animate-in zoom-in-95">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold text-sm mb-6 hover:text-slate-700 flex items-center gap-1">
              <i className="ph-bold ph-arrow-left"></i> Quay lại chọn gói
            </button>
            
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
              <div className="flex-1 space-y-4">
                <h3 className="text-xl font-black text-slate-800">Thanh toán chuyển khoản</h3>
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase">Số tiền</p>
                  <p className="text-2xl font-black text-amber-600">{Number(selectedTier.annual_fee).toLocaleString('vi-VN')} VNĐ</p>
                  
                  <p className="text-xs font-bold text-slate-400 uppercase mt-3">Nội dung chuyển khoản (Quan trọng)</p>
                  {/* CẮT LẤY 8 KÝ TỰ ĐẦU CỦA AUTH ID ĐỂ LÀM MÃ CHUYỂN KHOẢN (Cho gọn) */}
                  <p className="text-lg font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-mono text-center border border-blue-200">
                    NKBA UP{authUserId?.split('-')[0].toUpperCase()}
                  </p>
                </div>
                <p className="text-xs text-slate-500 font-medium italic">Hệ thống sẽ tự động duyệt trong 1-3 phút nếu bạn chuyển đúng Nội dung và Số tiền.</p>
              </div>

              {/* Mã QR Động */}
              <div className="shrink-0 bg-white p-2 rounded-2xl shadow-md border border-slate-100">
                <img src={getVietQR(selectedTier.annual_fee, `NKBA UP${authUserId?.split('-')[0].toUpperCase()}`)} alt="VietQR" className="w-48 h-48 object-contain" />
              </div>
            </div>

            {/* Chuyển khoản Thủ công (Backup khi Auto fail) */}
            <div className="mt-8 pt-8 border-t border-slate-200 space-y-4">
              <p className="font-bold text-slate-800">Đã chuyển khoản nhưng hệ thống chưa duyệt?</p>
              <input type="text" value={receiptUrl} onChange={e => setReceiptUrl(e.target.value)} placeholder="Dán link ảnh chụp màn hình biên lai vào đây..." className="w-full h-12 px-4 border-2 border-slate-200 rounded-xl outline-none focus:border-amber-500 font-medium text-sm" />
              <button onClick={handleManualSubmit} disabled={isSubmitting} className="w-full h-12 bg-slate-800 text-white font-bold rounded-xl shadow-md hover:bg-black transition-all disabled:opacity-50">
                {isSubmitting ? 'ĐANG GỬI...' : 'GỬI BIÊN LAI CHỜ NHÂN VIÊN DUYỆT'}
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 3: THÔNG BÁO HOÀN TẤT */}
        {step === 3 && (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl max-w-xl mx-auto text-center animate-in zoom-in-95 space-y-4">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ph-fill ph-check-circle text-5xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900">Đã tiếp nhận yêu cầu!</h2>
            <p className="text-slate-500 font-medium leading-relaxed">Chúng tôi đã nhận được biên lai của bạn. Bộ phận vận hành NKBA sẽ kiểm tra và kích hoạt gói <strong>{selectedTier?.name}</strong> trong thời gian sớm nhất.</p>
            
            <button onClick={() => window.location.href = '/'} className="mt-6 px-8 py-3 bg-[#002D62] text-white font-bold rounded-full hover:bg-blue-900 transition-colors">
              Quay về Trang chủ
            </button>
          </div>
        )}

      </div>
    </div>
  );
}