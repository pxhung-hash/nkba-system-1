'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function AccountSettingsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: ''
  });

  // Thông tin read-only
  const [metadata, setMetadata] = useState({
    corporate_name: 'Thành viên Độc lập',
    tier_name: 'Hội viên Tiêu chuẩn',
    title_name: 'Chưa cập nhật',
    join_date: '',
    status: ''
  });

  useEffect(() => {
    const fetchAccountData = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('individuals')
        .select(`
          id, full_name, phone, email, join_date, status,
          corporates(name),
          individual_tiers!individuals_tier_id_fkey(name),
          individual_titles(name)
        `)
        .eq('user_auth_id', user.id)
        .maybeSingle();

      if (profile) {
        setProfileId(profile.id);
        setForm({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          email: profile.email || ''
        });

        setMetadata({
          corporate_name: profile.corporates?.name || 'Thành viên Độc lập',
          tier_name: Array.isArray(profile.individual_tiers) ? profile.individual_tiers[0]?.name : (profile.individual_tiers as any)?.name || 'Hội viên Tiêu chuẩn',
          title_name: profile.individual_titles?.name || 'Chưa cập nhật',
          join_date: profile.join_date ? new Date(profile.join_date).toLocaleDateString('vi-VN') : '---',
          status: profile.status
        });
      }
      setIsLoading(false);
    };

    fetchAccountData();
  }, [supabase]);

  const handleSaveAccount = async () => {
    if (!form.full_name) return alert('Họ và tên không được để trống!');
    if (!profileId) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('individuals')
      .update({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email
      })
      .eq('id', profileId);

    if (error) {
      alert('Lỗi cập nhật: ' + error.message);
    } else {
      alert('✅ Đã lưu thông tin tài khoản thành công!');
      // Reload trang để Layout update lại tên trên header
      window.location.reload();
    }
    setIsSaving(false);
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
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 animate-in fade-in pb-24">
      
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Cài đặt Tài khoản</h1>
        <p className="text-sm font-medium text-slate-500 mt-2">Quản lý thông tin định danh hệ thống và liên hệ cơ bản.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
          <i className="ph-fill ph-user-gear text-[#002D62]"></i> Thông tin Cá nhân
        </h3>
        
        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên (*)</label>
            <input 
              type="text" 
              value={form.full_name} 
              onChange={e => setForm({...form, full_name: e.target.value})} 
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" 
              placeholder="Nhập họ và tên..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại liên hệ</label>
              <input 
                type="tel" 
                value={form.phone} 
                onChange={e => setForm({...form, phone: e.target.value})} 
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 font-mono outline-none focus:bg-white focus:border-indigo-400 transition-all" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email liên lạc</label>
              <input 
                type="email" 
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})} 
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={handleSaveAccount} 
            disabled={isSaving} 
            className="h-12 px-8 bg-[#002D62] text-white rounded-xl text-sm font-black shadow-md hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG LƯU...</> : <><i className="ph-bold ph-floppy-disk text-lg"></i> LƯU THAY ĐỔI</>}
          </button>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 shadow-sm">
        <h3 className="text-xl font-black text-slate-900 border-b border-slate-200 pb-4 mb-6 flex items-center gap-2">
          <i className="ph-fill ph-shield-check text-emerald-600"></i> Dữ liệu Định danh (Đã xác thực)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hạng Hội viên</p>
            <p className="text-base font-black text-amber-600">{metadata.tier_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Chức vụ trong tổ chức</p>
            <p className="text-base font-black text-slate-800">{metadata.title_name}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pháp nhân / Tổ chức trực thuộc</p>
            <p className="text-base font-black text-indigo-700">{metadata.corporate_name}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trạng thái tài khoản</p>
            <span className={`inline-block px-3 py-1 rounded-md text-xs font-black tracking-wider uppercase border ${metadata.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
              {metadata.status}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngày gia nhập NKBA</p>
            <p className="text-sm font-bold text-slate-600">{metadata.join_date}</p>
          </div>
        </div>
        
        <p className="mt-8 text-xs font-medium text-slate-500 italic bg-white p-3 rounded-lg border border-slate-100">
          <i className="ph-fill ph-info"></i> Các thông tin định danh phía trên được quản lý và bảo chứng bởi Ban điều hành NKBA. Nếu có sai sót, vui lòng liên hệ Admin để cập nhật lại.
        </p>
      </div>

    </div>
  );
}