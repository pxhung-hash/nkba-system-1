'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function CorporateDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'portfolio'>('info');

  // Dữ liệu cốt lõi
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [corporate, setCorporate] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [indTiers, setIndTiers] = useState<any[]>([]);

  // State Tab Nhân sự
  const [showAddMember, setShowAddMember] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ full_name: '', email: '', role_in_company: '', tier_code: '' });

  // State Tab Năng lực (Portfolio)
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [portfolio, setPortfolio] = useState({
    about_us: '',
    website: '',
    products: [] as { name: string, description: string, image?: string }[],
    projects: [] as { name: string, year: string, role: string, description?: string, image?: string }[]
  });

  useEffect(() => {
    const loadCorporateData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('individuals').select('id, corporate_id, role_in_company').eq('user_auth_id', user.id).single();
      if (!profile || !profile.corporate_id) {
        setLoading(false);
        return; 
      }
      setCurrentUser(profile);

      const [corpRes, memRes, tierRes] = await Promise.all([
        supabase.from('corporates').select('*, corporate_domains(name), corporate_tiers(*)').eq('id', profile.corporate_id).single(),
        supabase.from('individuals').select('id, full_name, email, role_in_company, status, individual_tiers!individuals_tier_id_fkey(name, code)').eq('corporate_id', profile.corporate_id),
        supabase.from('individual_tiers').select('*')
      ]);

      if (corpRes.data) {
        setCorporate(corpRes.data);
        const details = corpRes.data.details || {};
        setPortfolio({
          about_us: details.about_us || '',
          website: details.website || '',
          products: details.products || [],
          projects: details.projects || []
        });
      }
      if (memRes.data) setMembers(memRes.data);
      if (tierRes.data) setIndTiers(tierRes.data);

      setLoading(false);
    };

    loadCorporateData();
  }, [supabase]);

  // ==========================================
  // LOGIC NHÂN SỰ & QUOTA THẺ
  // ==========================================
  const getUsedQuota = (tierCode: string) => {
    return members.filter(m => {
      const code = Array.isArray(m.individual_tiers) ? m.individual_tiers[0]?.code : (m.individual_tiers as any)?.code;
      return code === tierCode;
    }).length;
  };

  const handleAddMember = async () => {
    if (!newMember.full_name || !newMember.email || !newMember.tier_code) return alert('Vui lòng điền đủ thông tin!');
    
    const tierConfig = corporate.corporate_tiers;
    if (!tierConfig) return alert('Lỗi: Công ty chưa được cấp gói cước!');
    
    const used = getUsedQuota(newMember.tier_code);
    let max = 0;
    if (newMember.tier_code === 'SILVER') max = tierConfig.quota_silver || 0;
    if (newMember.tier_code === 'GOLD') max = tierConfig.quota_gold || 0;
    if (newMember.tier_code === 'TITANIUM') max = tierConfig.quota_titanium || 0;

    if (used >= max) return alert(`Đã hết hạn mức thẻ ${newMember.tier_code}! Vui lòng nâng cấp gói Doanh nghiệp.`);

    const targetTier = indTiers.find(t => t.code === newMember.tier_code);
    if (!targetTier) return;

    setIsAddingMember(true);
    try {
      const { data: existingEmail } = await supabase.from('individuals').select('id, corporate_id').eq('email', newMember.email).maybeSingle();

      if (existingEmail) {
        if (existingEmail.corporate_id === corporate.id) throw new Error('Nhân sự này đã có mặt trong danh sách doanh nghiệp của bạn!');
        throw new Error('Email này đã được sử dụng bởi một tài khoản khác trên hệ thống NKBA!');
      }

      const { error: insertErr } = await supabase.from('individuals').insert([{
        corporate_id: corporate.id,
        is_corporate_sponsored: true,
        full_name: newMember.full_name,
        email: newMember.email,
        role_in_company: newMember.role_in_company,
        tier_id: targetTier.id,
        status: 'ACTIVE'
      }]);

      if (insertErr) {
        if (insertErr.code === '23505') throw new Error('Email này đã tồn tại trong hệ thống!');
        throw insertErr;
      }

      const { error: authErr } = await supabase.auth.signInWithOtp({
        email: newMember.email,
        options: { shouldCreateUser: true }
      });

      if (authErr) {
        console.warn("Không thể gửi email OTP:", authErr);
        alert('✅ Đã thêm nhân sự thành công! (Không thể gửi email tự động lúc này do máy chủ. Hãy yêu cầu nhân sự vào trang Đăng nhập và chọn "Quên mật khẩu / Đăng nhập bằng Email").');
      } else {
        alert('✅ Đã thêm nhân sự & Gửi Thư mời thành công! Nhân sự hãy kiểm tra Hộp thư (hoặc Spam) để xác nhận và kích hoạt tài khoản.');
      }

      setShowAddMember(false);
      setNewMember({ full_name: '', email: '', role_in_company: '', tier_code: '' });
      window.location.reload();
    } catch (err: any) {
      alert('❌ Lỗi: ' + err.message);
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (id: string, name: string) => {
    if (!confirm(`Hủy liên kết thẻ của nhân sự "${name}" khỏi Doanh nghiệp?`)) return;
    await supabase.from('individuals').update({ corporate_id: null, is_corporate_sponsored: false }).eq('id', id);
    setMembers(members.filter(m => m.id !== id));
  };

  // ==========================================
  // HÀM XỬ LÝ ẢNH CHUNG
  // ==========================================
  const processImage = (file: File, callback: (base64: string) => void) => {
    if (!file.type.startsWith('image/')) return alert('Chỉ hỗ trợ file hình ảnh!');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.7));
      };
    };
  };

  // ==========================================
  // LOGIC HỒ SƠ NĂNG LỰC (PORTFOLIO)
  // ==========================================
  const handleSavePortfolio = async () => {
    setIsSavingDetails(true);
    const updatedDetails = { ...corporate.details, ...portfolio };
    
    const { error } = await supabase.from('corporates').update({ details: updatedDetails }).eq('id', corporate.id);
    if (error) alert('Lỗi lưu hồ sơ: ' + error.message);
    else alert('✅ Cập nhật Hồ sơ Năng lực thành công!');
    
    setIsSavingDetails(false);
  };

  const addProduct = () => setPortfolio({ ...portfolio, products: [{ name: '', description: '', image: '' }, ...portfolio.products] });
  const updateProduct = (idx: number, field: string, val: string) => {
    const newProds = [...portfolio.products];
    newProds[idx] = { ...newProds[idx], [field]: val };
    setPortfolio({ ...portfolio, products: newProds });
  };
  const removeProduct = (idx: number) => setPortfolio({ ...portfolio, products: portfolio.products.filter((_, i) => i !== idx) });

  const addProject = () => setPortfolio({ ...portfolio, projects: [{ name: '', year: '', role: '', description: '', image: '' }, ...portfolio.projects] });
  const updateProject = (idx: number, field: string, val: string) => {
    const newProjs = [...portfolio.projects];
    newProjs[idx] = { ...newProjs[idx], [field]: val };
    setPortfolio({ ...portfolio, projects: newProjs });
  };
  const removeProject = (idx: number) => setPortfolio({ ...portfolio, projects: portfolio.projects.filter((_, i) => i !== idx) });

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-slate-400">Đang thiết lập Sở chỉ huy...</div>;

  if (!corporate) return (
    <div className="max-w-4xl mx-auto py-20 text-center">
      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6"><i className="ph-fill ph-buildings text-5xl text-slate-300"></i></div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">Chưa có Pháp nhân trực thuộc</h2>
      <p className="text-slate-500 mb-6">Bạn cần đăng ký định danh Doanh nghiệp tại trang Quản lý Tài khoản trước khi truy cập khu vực này.</p>
      <Link href="/account" className="px-8 py-3 bg-[#002D62] text-white rounded-xl font-bold">Về trang Tài khoản</Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#002D62] to-indigo-900 rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${corporate.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-amber-500/20 text-amber-300 border-amber-500/50'}`}>
                {corporate.status.replace('_', ' ')}
              </span>
              <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border bg-white/10 text-white border-white/20">
                Gói {corporate.corporate_tiers?.name || 'Chưa cấp'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight mb-2">{corporate.name}</h1>
            <p className="text-blue-200 font-mono text-sm"><i className="ph-fill ph-tag"></i> MST: {corporate.tax_code} | {corporate.corporate_domains?.name}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl shrink-0 w-full md:w-auto text-center md:text-left">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Vai trò của bạn</p>
            <p className="text-xl font-black text-white">{currentUser.role_in_company || 'Đại diện Doanh nghiệp'}</p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
        <button onClick={() => setActiveTab('info')} className={`shrink-0 px-6 py-3.5 text-sm font-black rounded-xl transition-all border shadow-sm ${activeTab === 'info' ? 'bg-white text-[#002D62] border-[#002D62]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white'}`}>
          <i className="ph-fill ph-info mr-2"></i> Thông tin Doanh nghiệp
        </button>
        <button onClick={() => setActiveTab('members')} className={`shrink-0 px-6 py-3.5 text-sm font-black rounded-xl transition-all border shadow-sm flex items-center gap-2 ${activeTab === 'members' ? 'bg-white text-[#002D62] border-[#002D62]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white'}`}>
          <i className="ph-fill ph-users-three text-lg"></i> Quản lý Nhân sự & Quota <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px]">{members.length}</span>
        </button>
        <button onClick={() => setActiveTab('portfolio')} className={`shrink-0 px-6 py-3.5 text-sm font-black rounded-xl transition-all border shadow-sm ${activeTab === 'portfolio' ? 'bg-white text-[#002D62] border-[#002D62]' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-white'}`}>
          <i className="ph-fill ph-briefcase text-lg mr-2"></i> Hồ sơ Năng lực (Portfolio)
        </button>
      </div>

      {/* ========================================== */}
      {/* TAB 1: THÔNG TIN CƠ BẢN */}
      {/* ========================================== */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm animate-in zoom-in-95">
          <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6">Thông tin Cơ bản & Pháp lý</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tên Công ty</p><p className="font-bold text-slate-900 text-lg">{corporate.name}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã số thuế</p><p className="font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg w-fit">{corporate.tax_code}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lĩnh vực hoạt động</p><p className="font-bold text-slate-800">{corporate.corporate_domains?.name}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày tham gia hệ thống</p><p className="font-bold text-slate-800">{corporate.join_date ? new Date(corporate.join_date).toLocaleDateString('vi-VN') : 'Đang xử lý...'}</p></div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><i className="ph-fill ph-file-text"></i> Giấy phép Đăng ký Kinh doanh</p>
              {corporate.details?.brc_image ? (
                <img src={corporate.details.brc_image} alt="BRC" className="w-full max-w-sm rounded-xl border border-slate-200 shadow-sm" />
              ) : (
                <div className="w-full max-w-sm h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">Chưa có ảnh ĐKKD</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 2: QUẢN LÝ NHÂN SỰ & QUOTA */}
      {/* ========================================== */}
      {activeTab === 'members' && (
        <div className="space-y-6 animate-in zoom-in-95">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['SILVER', 'GOLD', 'TITANIUM'].map(tierCode => {
              const max = corporate.corporate_tiers?.[`quota_${tierCode.toLowerCase()}`] || 0;
              const used = getUsedQuota(tierCode);
              const isFull = used >= max;
              const colors = tierCode === 'SILVER' ? 'bg-slate-50 border-slate-200 text-slate-600' : tierCode === 'GOLD' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-purple-50 border-purple-200 text-purple-700';
              
              return (
                <div key={tierCode} className={`p-5 rounded-2xl border ${colors}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1">Hạn mức thẻ {tierCode}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-black">{used} <span className="text-lg opacity-50">/ {max}</span></p>
                    {isFull && max > 0 && <span className="text-[9px] bg-rose-500 text-white px-2 py-1 rounded font-bold">ĐÃ ĐẦY</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-900">Danh sách Nhân sự trực thuộc</h3>
              {!showAddMember && (
                <button onClick={() => setShowAddMember(true)} className="px-5 py-2.5 bg-[#002D62] text-white text-xs font-black rounded-xl shadow-sm hover:bg-blue-900 transition-colors flex items-center gap-2">
                  <i className="ph-bold ph-user-plus text-base"></i> THÊM NHÂN SỰ
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="p-6 bg-blue-50/30 border-b border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-[#002D62] text-sm uppercase tracking-widest">Khai báo Nhân sự mới</h4>
                  <button onClick={() => setShowAddMember(false)} className="text-slate-400 hover:text-rose-500"><i className="ph-bold ph-x text-lg"></i></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">Họ và Tên</label><input type="text" value={newMember.full_name} onChange={e => setNewMember({...newMember, full_name: e.target.value})} className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm mt-1 outline-none focus:border-blue-400 bg-white" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">Email (Bắt buộc đúng)</label><input type="email" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm mt-1 outline-none focus:border-blue-400 bg-white" /></div>
                  <div><label className="text-[10px] font-bold text-slate-500 uppercase">Chức vụ</label><input type="text" value={newMember.role_in_company} onChange={e => setNewMember({...newMember, role_in_company: e.target.value})} className="w-full h-11 px-3 border border-slate-200 rounded-lg text-sm mt-1 outline-none focus:border-blue-400 bg-white" placeholder="VD: Trưởng phòng..." /></div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cấp thẻ (Quota)</label>
                    <div className="flex gap-2 mt-1">
                      <select value={newMember.tier_code} onChange={e => setNewMember({...newMember, tier_code: e.target.value})} className="flex-1 h-11 px-3 border border-slate-200 rounded-lg text-sm font-bold text-[#002D62] outline-none bg-white">
                        <option value="">- Chọn -</option>
                        {corporate.corporate_tiers?.quota_silver > 0 && <option value="SILVER">SILVER</option>}
                        {corporate.corporate_tiers?.quota_gold > 0 && <option value="GOLD">GOLD</option>}
                        {corporate.corporate_tiers?.quota_titanium > 0 && <option value="TITANIUM">TITANIUM</option>}
                      </select>
                      <button onClick={handleAddMember} disabled={isAddingMember} className="w-11 h-11 bg-emerald-600 text-white rounded-lg flex items-center justify-center hover:bg-emerald-700 shadow-sm disabled:opacity-50">
                        {isAddingMember ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-check text-lg"></i>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr><th className="p-4 pl-6">Nhân viên</th><th className="p-4">Email</th><th className="p-4">Chức vụ</th><th className="p-4 text-center">Hạng thẻ</th><th className="p-4 text-right pr-6">Thao tác</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {members.map(m => {
                    const tierCode = Array.isArray(m.individual_tiers) ? m.individual_tiers[0]?.code : (m.individual_tiers as any)?.code;
                    const isMe = m.id === currentUser.id;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6 font-bold text-slate-800 flex items-center gap-2">{m.full_name} {isMe && <span className="bg-blue-100 text-blue-600 text-[9px] px-2 py-0.5 rounded">BẠN</span>}</td>
                        <td className="p-4 text-slate-600">{m.email}</td>
                        <td className="p-4 text-slate-600">{m.role_in_company || '---'}</td>
                        <td className="p-4 text-center"><span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-[10px] font-black">{tierCode}</span></td>
                        <td className="p-4 text-right pr-6">
                          {!isMe && (
                            <button onClick={() => handleRemoveMember(m.id, m.full_name)} className="w-8 h-8 rounded-lg text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors" title="Xóa nhân sự"><i className="ph-bold ph-trash"></i></button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* TAB 3: HỒ SƠ NĂNG LỰC (PORTFOLIO) */}
      {/* ========================================== */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6 animate-in zoom-in-95">
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6"><i className="ph-fill ph-book-open-text text-[#002D62]"></i> Giới thiệu chung</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Website Công ty</label>
                <input type="text" value={portfolio.website} onChange={e => setPortfolio({...portfolio, website: e.target.value})} className="w-full h-12 px-4 border border-slate-200 bg-slate-50 rounded-xl mt-1 text-sm font-medium outline-none focus:bg-white focus:border-blue-400" placeholder="https://..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Giới thiệu ngắn (About Us)</label>
                <textarea value={portfolio.about_us} onChange={e => setPortfolio({...portfolio, about_us: e.target.value})} className="w-full h-32 p-4 border border-slate-200 bg-slate-50 rounded-xl mt-1 text-sm font-medium outline-none focus:bg-white focus:border-blue-400 resize-none" placeholder="Tầm nhìn, sứ mệnh, thế mạnh cốt lõi..." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CỘT SẢN PHẨM / DỊCH VỤ */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col max-h-[800px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
                <h4 className="font-black text-slate-800 flex items-center gap-2"><i className="ph-fill ph-package text-amber-500"></i> Sản phẩm & Dịch vụ</h4>
                <button onClick={addProduct} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">+ Thêm SP</button>
              </div>
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
                {portfolio.products.map((prod, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group flex gap-4">
                    <button onClick={() => removeProduct(idx)} className="absolute top-2 right-2 w-6 h-6 bg-white border border-slate-200 rounded text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"><i className="ph-bold ph-trash text-xs"></i></button>
                    
                    {/* KHỐI ẢNH */}
                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white relative flex items-center justify-center group/img">
                      {prod.image ? (
                        <>
                          <img src={prod.image} alt="Product" className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                            <i className="ph-bold ph-camera text-white text-xl"></i>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => processImage(e.target.files?.[0] as File, (b64) => updateProduct(idx, 'image', b64))} />
                          </label>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
                          <i className="ph-bold ph-image text-xl mb-1"></i>
                          <span className="text-[8px] font-bold uppercase text-center px-2">Up ảnh</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => processImage(e.target.files?.[0] as File, (b64) => updateProduct(idx, 'image', b64))} />
                        </label>
                      )}
                    </div>

                    {/* KHỐI NỘI DUNG */}
                    <div className="flex-1 flex flex-col">
                      <input type="text" value={prod.name} onChange={e => updateProduct(idx, 'name', e.target.value)} placeholder="Tên sản phẩm/dịch vụ..." className="w-full bg-transparent font-bold text-slate-800 text-sm mb-1 outline-none border-b border-transparent focus:border-blue-400 transition-colors" />
                      <textarea value={prod.description} onChange={e => updateProduct(idx, 'description', e.target.value)} placeholder="Mô tả ngắn gọn..." className="w-full bg-transparent text-xs text-slate-600 outline-none resize-none h-full border-b border-transparent focus:border-blue-400 transition-colors" />
                    </div>
                  </div>
                ))}
                {portfolio.products.length === 0 && <p className="text-center text-slate-400 text-sm py-10">Chưa khai báo sản phẩm nào.</p>}
              </div>
            </div>

            {/* CỘT DỰ ÁN TIÊU BIỂU */}
            <div className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm flex flex-col max-h-[800px]">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4 shrink-0">
                <h4 className="font-black text-slate-800 flex items-center gap-2"><i className="ph-fill ph-buildings text-emerald-500"></i> Dự án Tiêu biểu</h4>
                <button onClick={addProject} className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">+ Thêm Dự án</button>
              </div>
              <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
                {portfolio.projects.map((proj, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group flex gap-4">
                    <button onClick={() => removeProject(idx)} className="absolute top-2 right-2 w-6 h-6 bg-white border border-slate-200 rounded text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"><i className="ph-bold ph-trash text-xs"></i></button>
                    
                    {/* KHỐI ẢNH */}
                    <div className="w-24 h-32 shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white relative flex items-center justify-center group/img">
                      {proj.image ? (
                        <>
                          <img src={proj.image} alt="Project" className="w-full h-full object-cover" />
                          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                            <i className="ph-bold ph-camera text-white text-xl"></i>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => processImage(e.target.files?.[0] as File, (b64) => updateProject(idx, 'image', b64))} />
                          </label>
                        </>
                      ) : (
                        <label className="w-full h-full flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 transition-colors">
                          <i className="ph-bold ph-image text-xl mb-1"></i>
                          <span className="text-[8px] font-bold uppercase text-center px-2">Up ảnh<br/>Phối cảnh</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => processImage(e.target.files?.[0] as File, (b64) => updateProject(idx, 'image', b64))} />
                        </label>
                      )}
                    </div>

                    {/* KHỐI NỘI DUNG */}
                    <div className="flex-1 flex flex-col gap-1.5">
                      <input type="text" value={proj.name} onChange={e => updateProject(idx, 'name', e.target.value)} placeholder="Tên dự án..." className="w-full bg-transparent font-bold text-slate-800 text-sm outline-none border-b border-transparent focus:border-emerald-400 transition-colors" />
                      <div className="flex gap-2">
                        <input type="text" value={proj.year} onChange={e => updateProject(idx, 'year', e.target.value)} placeholder="Năm (VD: 2023)" className="w-20 bg-transparent text-xs text-slate-600 outline-none border-b border-transparent focus:border-emerald-400 transition-colors" />
                        <input type="text" value={proj.role} onChange={e => updateProject(idx, 'role', e.target.value)} placeholder="Vai trò (VD: Thầu chính)" className="flex-1 bg-transparent text-xs text-slate-600 outline-none border-b border-transparent focus:border-emerald-400 transition-colors" />
                      </div>
                      <textarea value={proj.description} onChange={e => updateProject(idx, 'description', e.target.value)} placeholder="Mô tả công việc đã làm..." className="w-full mt-1 bg-transparent text-xs text-slate-500 outline-none resize-none h-full border-b border-transparent focus:border-emerald-400 transition-colors" />
                    </div>
                  </div>
                ))}
                {portfolio.projects.length === 0 && <p className="text-center text-slate-400 text-sm py-10">Chưa khai báo dự án nào.</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button onClick={handleSavePortfolio} disabled={isSavingDetails} className="h-14 px-12 bg-[#002D62] text-white rounded-xl text-sm font-black shadow-lg hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-2">
              {isSavingDetails ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG LƯU...</> : <><i className="ph-bold ph-floppy-disk text-lg"></i> LƯU HỒ SƠ NĂNG LỰC</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}