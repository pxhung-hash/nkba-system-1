'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AccountSettingsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Dữ liệu Danh mục
  const [domains, setDomains] = useState<any[]>([]);

  // State Form Cá nhân
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  });

  // Thông tin read-only (Định danh)
  const [metadata, setMetadata] = useState({
    corporate_id: null as string | null,
    corporate_name: 'Thành viên Độc lập',
    corporate_status: '',
    tier_name: 'Hội viên Tiêu chuẩn',
    title_name: 'Chưa cập nhật',
    join_date: '',
    status: ''
  });

  // --- STATE DÀNH CHO FORM ĐĂNG KÝ PHÁP NHÂN ---
  const [showCorpForm, setShowCorpForm] = useState(false);
  const [isSubmittingCorp, setIsSubmittingCorp] = useState(false);
  const [corpForm, setCorpForm] = useState({
    tax_code: '',
    name: '',
    domain_id: '',
    brc_image: '' // Base64 Giấy phép ĐKKD
  });

  useEffect(() => {
    const fetchAccountData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Hút song song Profile cá nhân và Danh mục Lĩnh vực công ty
      const [profileRes, domainsRes] = await Promise.all([
        supabase
          .from('individuals')
          .select(`
            id, full_name, phone, email, join_date, status, corporate_id, is_corporate_sponsored,
            corporates(id, name, status),
            individual_tiers!individuals_tier_id_fkey(name),
            individual_titles(name)
          `)
          .eq('user_auth_id', user.id)
          .maybeSingle(),
        supabase.from('corporate_domains').select('*').order('name', { ascending: true })
      ]);

      if (domainsRes.data) setDomains(domainsRes.data);

      if (profileRes.data) {
        const profile = profileRes.data;
        setProfileId(profile.id);
        setForm({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          email: profile.email || ''
        });

        const corpData = Array.isArray(profile.corporates) ? profile.corporates[0] : profile.corporates;

        setMetadata({
          corporate_id: profile.corporate_id || null,
          corporate_name: corpData?.name || 'Thành viên Độc lập',
          corporate_status: corpData?.status || '',
          tier_name: Array.isArray(profile.individual_tiers) ? profile.individual_tiers[0]?.name : (profile.individual_tiers as any)?.name || 'Hội viên Tiêu chuẩn',
          title_name: profile.individual_titles?.[0]?.name || 'Chưa cập nhật',
          join_date: profile.join_date ? new Date(profile.join_date).toLocaleDateString('vi-VN') : '---',
          status: profile.status
        });
      }
      setIsLoading(false);
    };

    fetchAccountData();
  }, [supabase]);

  // ==========================================
  // HÀM 1: CẬP NHẬT THÔNG TIN CÁ NHÂN
  // ==========================================
  const handleSaveAccount = async () => {
    if (!form.full_name) return alert('Họ và tên không được để trống!');
    if (!profileId) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('individuals')
      .update({ full_name: form.full_name, phone: form.phone, email: form.email })
      .eq('id', profileId);

    if (error) {
      alert('Lỗi cập nhật: ' + error.message);
    } else {
      alert('✅ Đã lưu thông tin tài khoản thành công!');
      window.location.reload();
    }
    setIsSaving(false);
  };

  // ==========================================
  // HÀM 2: XỬ LÝ ẢNH ĐKKD (CANVAS NÉN ẢNH TỰ ĐỘNG)
  // ==========================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Chỉ hỗ trợ file hình ảnh!');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > 1200) { height = Math.round((height * 1200) / width); width = 1200; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        setCorpForm(prev => ({ ...prev, brc_image: compressedBase64 }));
      };
    };
  };

  // ==========================================
  // HÀM 3: ĐĂNG KÝ PHÁP NHÂN & LIÊN KẾT VÀO TÀI KHOẢN
  // ==========================================
  const handleRegisterCorporate = async () => {
    if (!corpForm.tax_code || !corpForm.name || !corpForm.domain_id || !corpForm.brc_image) {
      return alert('Vui lòng điền đầy đủ Tên, MST, Lĩnh vực và tải lên Giấy ĐKKD!');
    }
    if (!profileId) return;

    setIsSubmittingCorp(true);
    try {
      // 1. Tạo mới bản ghi vào bảng corporates
      const { data: newCorp, error: corpErr } = await supabase
        .from('corporates')
        .insert([{
          tax_code: corpForm.tax_code,
          name: corpForm.name,
          domain_id: corpForm.domain_id,
          status: 'PENDING_VERIFICATION',
          details: { 
            brc_image: corpForm.brc_image,
            registered_by_individual_id: profileId // Lưu vết ai là người tạo
          }
        }])
        .select('id, name')
        .single();

      if (corpErr) {
        if (corpErr.code === '23505') throw new Error('Mã số thuế này đã được đăng ký trên hệ thống!');
        throw corpErr;
      }

      // 2. Cập nhật tài khoản cá nhân hiện tại thành người đại diện của Pháp nhân này
      const { error: indErr } = await supabase
        .from('individuals')
        .update({
          corporate_id: newCorp.id,
          is_corporate_sponsored: true,
          role_in_company: 'Người đại diện' // Tự động gán quyền đại diện
        })
        .eq('id', profileId);

      if (indErr) throw indErr;

      alert('✅ Đăng ký Pháp nhân thành công! Hồ sơ đang chờ Ban Quản trị kiểm duyệt.');
      window.location.reload(); // Tải lại trang để cập nhật UI
    } catch (err: any) {
      alert('Lỗi đăng ký: ' + err.message);
    } finally {
      setIsSubmittingCorp(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i>
        <p className="font-bold tracking-widest uppercase text-sm">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in pb-24">
      
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ & Tài khoản</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Quản lý thông tin cá nhân và định danh Pháp nhân trực thuộc.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
              <i className="ph-fill ph-user-gear text-[#002D62]"></i> Thông tin Cá nhân
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên (*)</label>
                <input 
                  type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} 
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
                  placeholder="Nhập họ và tên..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại liên hệ</label>
                  <input 
                    type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono outline-none focus:bg-white focus:border-indigo-400 transition-all" 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email liên lạc</label>
                  <input 
                    type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={handleSaveAccount} disabled={isSaving} className="h-12 px-8 bg-[#002D62] text-white rounded-xl text-sm font-black shadow-md hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isSaving ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG LƯU...</> : <><i className="ph-bold ph-floppy-disk text-lg"></i> LƯU THAY ĐỔI</>}
              </button>
            </div>
          </div>

          {/* KHỐI ĐĂNG KÝ PHÁP NHÂN NẾU CHƯA CÓ */}
          {!metadata.corporate_id && (
            <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#002D62] opacity-5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
              
              {!showCorpForm ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div>
                    <h3 className="text-xl font-black text-[#002D62] mb-2 flex items-center gap-2"><i className="ph-fill ph-buildings"></i> Đăng ký Pháp nhân (Doanh nghiệp)</h3>
                    <p className="text-sm font-medium text-slate-600">Nâng cấp tài khoản thành Đại diện Pháp nhân để mở khóa quyền đấu thầu, kết nối thương mại và tiếp cận danh bạ đối tác trên nền tảng B2B.</p>
                  </div>
                  <button onClick={() => setShowCorpForm(true)} className="shrink-0 h-12 px-6 bg-[#002D62] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 transition-all flex items-center gap-2">
                    <i className="ph-bold ph-plus-circle text-lg"></i> KHAI BÁO NGAY
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 relative z-10">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-4">
                    <h3 className="text-xl font-black text-[#002D62] flex items-center gap-2"><i className="ph-fill ph-buildings"></i> Khai báo Pháp nhân mới</h3>
                    <button onClick={() => setShowCorpForm(false)} className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full hover:bg-rose-100 hover:text-rose-600 transition-colors"><i className="ph-bold ph-x"></i></button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tên Công ty / Pháp nhân (*)</label>
                      <input type="text" value={corpForm.name} onChange={e => setCorpForm({...corpForm, name: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#002D62]" placeholder="VD: CÔNG TY CỔ PHẦN ABC..." />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mã số thuế (*)</label>
                      <input type="text" value={corpForm.tax_code} onChange={e => setCorpForm({...corpForm, tax_code: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#002D62]" placeholder="Mã số thuế doanh nghiệp" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lĩnh vực hoạt động chính (*)</label>
                      <select value={corpForm.domain_id} onChange={e => setCorpForm({...corpForm, domain_id: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-[#002D62]">
                        <option value="">-- Chọn lĩnh vực --</option>
                        {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>

                    <div className="col-span-2 space-y-2 mt-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tải lên Giấy phép ĐKKD (Ảnh/Bản scan) (*)</label>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                          <i className="ph-bold ph-upload-simple text-3xl mb-2"></i>
                          <p className="text-sm font-bold text-slate-600">Nhấn để chọn ảnh chứng nhận ĐKKD</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                      
                      {corpForm.brc_image && (
                        <div className="relative inline-block mt-3">
                          <img src={corpForm.brc_image} alt="BRC" className="h-32 object-cover rounded-xl border border-slate-200 shadow-sm" />
                          <button onClick={() => setCorpForm({...corpForm, brc_image: ''})} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center shadow-md hover:scale-110"><i className="ph-bold ph-x text-xs"></i></button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-blue-100">
                    <button onClick={handleRegisterCorporate} disabled={isSubmittingCorp} className="h-12 px-10 bg-[#002D62] text-white rounded-xl text-sm font-black shadow-md hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-2">
                      {isSubmittingCorp ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG GỬI...</> : <><i className="ph-bold ph-paper-plane-right text-lg"></i> GỬI HỒ SƠ KIỂM DUYỆT</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CỘT PHẢI: DỮ LIỆU ĐỊNH DANH */}
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 border-b border-slate-200 pb-4 mb-6 flex items-center gap-2">
              <i className="ph-fill ph-shield-check text-emerald-600"></i> Hồ sơ Định danh
            </h3>
            
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trạng thái tài khoản cá nhân</p>
                <span className={`inline-block px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase border ${metadata.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                  {metadata.status}
                </span>
              </div>
              
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngày gia nhập NKBA</p>
                <p className="text-sm font-bold text-slate-800">{metadata.join_date}</p>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pháp nhân / Tổ chức trực thuộc</p>
                {metadata.corporate_id ? (
                  <>
                    <p className="text-base font-black text-[#002D62] leading-tight mb-2">{metadata.corporate_name}</p>
                    <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-black uppercase border ${metadata.corporate_status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : metadata.corporate_status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      Trạng thái Cty: {metadata.corporate_status.replace('_', ' ')}
                    </span>
                  </>
                ) : (
                  <p className="text-sm font-bold text-slate-500 bg-white border border-slate-200 p-3 rounded-xl mt-2 flex items-center gap-2">
                    <i className="ph-fill ph-user text-slate-400"></i> Cấp thẻ Độc lập
                  </p>
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hạng Hội viên</p>
                <p className="text-base font-black text-amber-600">{metadata.tier_name}</p>
              </div>
            </div>
            
            <p className="mt-8 text-xs font-medium text-slate-500 italic bg-white p-4 rounded-xl border border-slate-100 leading-relaxed">
              <i className="ph-fill ph-info text-blue-500 mr-1"></i> Thông tin định danh được bảo chứng bởi Ban điều hành NKBA. Hệ thống tự động liên kết quyền lợi thẻ dựa trên Pháp nhân khai báo.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}