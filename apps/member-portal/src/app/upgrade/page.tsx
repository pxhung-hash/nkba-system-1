'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function UpgradeMembershipPage() {
  const [supabase] = useState(() => createClient());
  const [tiers, setTiers] = useState<any[]>([]);
  const [selectedTier, setSelectedTier] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Chọn gói, 2: Thanh toán/Biên lai, 3: Thành công
  
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
      const { data } = await supabase.from('individual_tiers').select('*').gt('annual_fee', 0).order('annual_fee', { ascending: true });
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

  const handleManualSubmit = async () => {
    if (!receiptUrl) return alert('Vui lòng cung cấp link ảnh biên lai!');
    if (!realIndividualId) return alert('Lỗi hệ thống: Không tìm thấy hồ sơ Hội viên của bạn!');
    
    setIsSubmitting(true);

    const { error } = await supabase.from('individuals').update({
      upgrade_tier_id: selectedTier.id,
      payment_receipt_url: receiptUrl,
      status: 'PENDING_VERIFICATION' // Đưa vào trạm xác minh của NV
    }).eq('id', realIndividualId);

    setIsSubmitting(false);
    if (!error) {
      setStep(3); 
    } else {
      alert('Lỗi cập nhật hệ thống: ' + error.message);
    }
  };

  if (isLoadingUser) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i></div>;
  }

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
    <div className="min-h-screen bg-slate-50 py-12 px-4 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-[#002D62] uppercase tracking-tight">Nâng cấp Đặc quyền</h1>
          <p className="text-slate-500 font-medium">Lựa chọn gói hội viên phù hợp để mở khóa toàn bộ tiện ích của hệ sinh thái NKBA.</p>
        </div>

        {/* BƯỚC 1: CHỌN GÓI */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4">
            {tiers.map(tier => (
              <div key={tier.id} className={`p-8 rounded-3xl border-2 transition-all cursor-pointer ${selectedTier?.id === tier.id ? 'border-amber-500 bg-amber-50 scale-[1.02] shadow-xl shadow-amber-500/10' : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-md'}`} onClick={() => setSelectedTier(tier)}>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">{tier.name}</h3>
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
                TIẾP TỤC
              </button>
            </div>
          </div>
        )}

        {/* BƯỚC 2: TẢI BIÊN LAI THỦ CÔNG */}
        {step === 2 && selectedTier && (
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-xl mx-auto animate-in zoom-in-95">
            <button onClick={() => setStep(1)} className="text-slate-400 font-bold text-sm mb-6 hover:text-slate-700 flex items-center gap-1 transition-colors">
              <i className="ph-bold ph-arrow-left"></i> Quay lại chọn gói
            </button>
            
            <div className="text-center mb-8">
              <h3 className="text-xl font-black text-slate-800 mb-6">Xác nhận thông tin nâng cấp</h3>
              
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Gói cước đã chọn</p>
                <h4 className="text-2xl font-black text-[#002D62] uppercase">{selectedTier.name}</h4>
                <p className="text-3xl font-black text-amber-600 mt-2">{Number(selectedTier.annual_fee).toLocaleString('vi-VN')} VNĐ</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-8 space-y-5">
              <div className="text-center space-y-1">
                <p className="font-bold text-slate-800 text-lg">Cập nhật Biên lai thanh toán</p>
                <p className="text-sm text-slate-500 font-medium">Vui lòng tải lên hình ảnh biên lai thanh toán để chúng tôi xác nhận yêu cầu nâng cấp của bạn.</p>
              </div>
              
              <input 
                type="text" 
                value={receiptUrl} 
                onChange={e => setReceiptUrl(e.target.value)} 
                placeholder="Dán link ảnh chụp màn hình (Google Drive, Imgur...)" 
                className="w-full h-14 px-5 border-2 border-slate-200 rounded-xl outline-none focus:border-[#002D62] focus:ring-4 focus:ring-blue-900/10 font-medium text-sm transition-all" 
              />
              
              <button 
                onClick={handleManualSubmit} 
                disabled={isSubmitting} 
                className="w-full h-14 bg-[#002D62] text-white font-black rounded-xl shadow-lg hover:bg-blue-900 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG GỬI...</> : 'GỬI YÊU CẦU NÂNG CẤP'}
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
            <p className="text-slate-500 font-medium leading-relaxed">Chúng tôi đã nhận được thông tin của bạn. Bộ phận vận hành NKBA sẽ kiểm tra và kích hoạt gói <strong className="text-slate-800">{selectedTier?.name}</strong> trong thời gian sớm nhất.</p>
            
            <button onClick={() => window.location.href = '/'} className="mt-6 px-8 py-3 bg-[#002D62] text-white font-bold rounded-full hover:bg-blue-900 transition-colors shadow-lg">
              Quay về Trang chủ
            </button>
          </div>
        )}

      </div>
    </div>
  );
}