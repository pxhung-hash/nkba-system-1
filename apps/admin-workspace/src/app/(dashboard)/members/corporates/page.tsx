'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function CorporatesPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'verify' | 'approve'>('list');

  const [corporates, setCorporates] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [tiers, setTiers] = useState<any[]>([]);

  // State Form Đăng ký/Sửa
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ tax_code: '', name: '', domain_id: '', tier_id: '', expiration_date: '' });

  // State Tìm kiếm & Lọc
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('ALL');

  // State Modal Phê duyệt (SOP)
  const [reviewingCorp, setReviewingCorp] = useState<any>(null);
  const [reviewMode, setReviewMode] = useState<'VERIFY' | 'APPROVE' | null>(null);
  const [expiryDate, setExpiryDate] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: emp } = await supabase.from('employees').select('id, name, role').eq('email', user.email).single();
      setCurrentUser(emp);
    }

    const [corpRes, domRes, tierRes] = await Promise.all([
      supabase.from('corporates')
        .select('*, corporate_domains(name), corporate_tiers(name, code), verifier:verified_by(name), approver:approved_by(name)')
        .order('created_at', { ascending: false }),
      supabase.from('corporate_domains').select('*').order('name', { ascending: true }),
      supabase.from('corporate_tiers').select('*')
    ]);
    
    if (corpRes.data) setCorporates(corpRes.data);
    if (domRes.data) setDomains(domRes.data);
    if (tierRes.data) setTiers(tierRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const isCEO = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CEO';

  // Lọc dữ liệu theo Search & Filter
  const filteredCorporates = corporates.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.tax_code.includes(searchTerm);
    const matchTier = filterTier === 'ALL' ? true : c.tier_id === filterTier;
    return matchSearch && matchTier;
  });

  // Phân loại Tab
  const activeCorps = filteredCorporates.filter(c => c.status === 'ACTIVE');
  const verifyCorps = filteredCorporates.filter(c => ['PENDING_VERIFICATION', 'REJECTED'].includes(c.status));
  const approveCorps = filteredCorporates.filter(c => ['PENDING_APPROVAL', 'PENDING_DELETION'].includes(c.status));

  // Tính toán Thống kê
  const totalActive = corporates.filter(c => c.status === 'ACTIVE').length;
  const totalPending = corporates.filter(c => ['PENDING_VERIFICATION', 'PENDING_APPROVAL'].includes(c.status)).length;

  const handleSaveCorp = async () => {
    if (!formData.tax_code || !formData.name || !formData.tier_id) return alert('Nhập đủ thông tin!');
    const payload = { 
      tax_code: formData.tax_code,
      name: formData.name,
      domain_id: formData.domain_id || null,
      tier_id: formData.tier_id || null,
      expiration_date: formData.expiration_date || null,
      ...(editingId ? {} : { status: 'PENDING_VERIFICATION' }) 
    };

    if (editingId) {
      await supabase.from('corporates').update(payload).eq('id', editingId);
      alert('✅ Cập nhật thành công!');
    } else {
      await supabase.from('corporates').insert([payload]);
      alert('✅ Đăng ký thành công! Hồ sơ đã đưa vào hàng đợi Xác minh.');
    }
    setShowForm(false); setEditingId(null); setFormData({ tax_code: '', name: '', domain_id: '', tier_id: '', expiration_date: '' });
    fetchData();
  };

  const handleRequestDelete = async (corp: any) => {
    const reason = window.prompt(`Lý do muốn xóa pháp nhân "${corp.name}"?`);
    if (!reason) return;
    await supabase.from('corporates').update({ 
      status: 'PENDING_DELETION', 
      rejection_reason: reason, 
      verified_by: currentUser.id 
    }).eq('id', corp.id);
    alert('🚀 Đã gửi yêu cầu XÓA lên Tổng Giám đốc.');
    fetchData();
  };

  const openReviewModal = (corp: any, mode: 'VERIFY' | 'APPROVE') => {
    setReviewingCorp(corp);
    setReviewMode(mode);
    setIsRejecting(false);
    setRejectReason(corp.rejection_reason || ''); 
    
    if (mode === 'VERIFY') {
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setExpiryDate(corp.expiration_date || nextYear.toISOString().split('T')[0]);
    }
  };

  const closeReviewModal = () => {
    setReviewingCorp(null);
    setReviewMode(null);
  };

  const executeAction = async (action: 'SUBMIT_TO_CEO' | 'FINAL_APPROVE' | 'REJECT' | 'ARCHIVE') => {
    if (!reviewingCorp) return;

    try {
      if (action === 'REJECT') {
        if (!rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối (Bút phê)!');
        await supabase.from('corporates').update({ 
          status: 'REJECTED', 
          rejection_reason: rejectReason,
          verified_by: reviewMode === 'APPROVE' ? null : currentUser.id
        }).eq('id', reviewingCorp.id);
        alert('❌ Đã trả hồ sơ kèm bút phê!');
      } 
      
      else if (action === 'SUBMIT_TO_CEO') {
        if (!expiryDate) return alert('Vui lòng thiết lập Hạn sử dụng!');
        await supabase.from('corporates').update({ 
          status: 'PENDING_APPROVAL', 
          expiration_date: expiryDate,
          verified_by: currentUser.id,
          verified_at: new Date().toISOString(),
          rejection_reason: null
        }).eq('id', reviewingCorp.id);
        alert('✅ Xác minh thành công. Đã trình TGĐ!');
      }

      else if (action === 'FINAL_APPROVE') {
        await supabase.from('corporates').update({ 
          status: 'ACTIVE', 
          approved_by: currentUser.id,
          join_date: new Date().toISOString(),
          rejection_reason: null
        }).eq('id', reviewingCorp.id);
        alert('🎉 KÝ DUYỆT THÀNH CÔNG! Doanh nghiệp chính thức hoạt động.');
      }

      else if (action === 'ARCHIVE') {
        await supabase.from('corporates').update({ 
          status: 'ARCHIVED', 
          approved_by: currentUser.id 
        }).eq('id', reviewingCorp.id);
        alert('🗑️ ĐÃ DUYỆT XÓA: Hồ sơ đã được lưu trữ.');
      }

      closeReviewModal();
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-slate-400">ĐANG NẠP HỆ THỐNG...</div>;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">
      
      {/* 1. THỐNG KÊ (DASHBOARD MINI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-gradient-to-br from-[#002D62] to-blue-900 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">TỔNG DOANH NGHIỆP ACTIVE</p>
              <h3 className="text-4xl font-black">{totalActive}</h3>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center">
              <i className="ph-fill ph-buildings text-2xl text-blue-100"></i>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-6 shadow-lg text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-orange-100 uppercase tracking-widest mb-1">HỒ SƠ ĐANG CHỜ DUYỆT</p>
              <h3 className="text-4xl font-black">{totalPending}</h3>
            </div>
            <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center">
              <i className="ph-fill ph-hourglass-high text-2xl text-orange-100"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between h-full">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Truy cập nhanh</p>
              <button onClick={() => setShowForm(true)} className="px-6 h-12 bg-[#002D62] text-white font-black rounded-xl hover:bg-blue-900 transition-all flex items-center gap-2 shadow-md">
                <i className="ph-bold ph-plus-circle text-lg"></i> THÊM DOANH NGHIỆP
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HEADER TABS & BỘ LỌC */}
      <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-in fade-in duration-500">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-buildings text-[#002D62]"></i> Quản lý Pháp nhân</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Hệ thống xét duyệt KYC và định danh tổ chức B2B.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
            <div className="relative flex-1 sm:w-[300px]">
              <i className="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm tên Công ty hoặc Mã số thuế..." 
                className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-[#002D62] transition-all"
              />
            </div>
            <select 
              value={filterTier}
              onChange={e => setFilterTier(e.target.value)}
              className="h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[#002D62] transition-all cursor-pointer"
            >
              <option value="ALL">Tất cả hạng mục thẻ</option>
              {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
          <button onClick={() => setActiveTab('list')} className={`shrink-0 px-6 py-3 text-sm font-black rounded-xl transition-all border ${activeTab === 'list' ? 'bg-[#002D62] text-white border-[#002D62] shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
            Doanh nghiệp Hoạt động
          </button>
          <button onClick={() => setActiveTab('verify')} className={`shrink-0 px-6 py-3 text-sm font-black rounded-xl flex items-center gap-2 transition-all border ${activeTab === 'verify' ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
            Trạm Xác minh NV <span className={`px-2 py-0.5 rounded text-[10px] ${activeTab === 'verify' ? 'bg-white text-amber-600' : 'bg-slate-200 text-slate-600'}`}>{verifyCorps.length}</span>
          </button>
          {isCEO && (
            <button onClick={() => setActiveTab('approve')} className={`shrink-0 px-6 py-3 text-sm font-black rounded-xl flex items-center gap-2 transition-all border ${activeTab === 'approve' ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
              Bàn làm việc TGĐ <span className={`px-2 py-0.5 rounded text-[10px] ${activeTab === 'approve' ? 'bg-white text-rose-700' : 'bg-slate-200 text-slate-600'}`}>{approveCorps.length}</span>
            </button>
          )}
        </div>
      </div>

      {/* FORM THÊM/SỬA */}
      {showForm && (
        <div className="p-8 bg-white border border-slate-200 rounded-[2rem] shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
            <i className={`ph-bold ${editingId ? 'ph-pencil-simple text-amber-600' : 'ph-plus-circle text-[#002D62]'} text-2xl`}></i>
            {editingId ? 'Cập nhật Hồ sơ Doanh nghiệp' : 'Đăng ký Pháp nhân nội bộ'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-end">
            <div className="xl:col-span-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã số thuế (*)</label><input type="text" value={formData.tax_code} onChange={e => setFormData({...formData, tax_code: e.target.value})} className="w-full h-12 border border-slate-200 bg-slate-50 rounded-xl px-4 mt-2 font-mono font-bold outline-none focus:bg-white focus:border-[#002D62] transition-colors" placeholder="010xxxxxx" /></div>
            <div className="xl:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Doanh nghiệp (*)</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-12 border border-slate-200 bg-slate-50 rounded-xl px-4 mt-2 font-bold text-slate-800 outline-none focus:bg-white focus:border-[#002D62] transition-colors" placeholder="CÔNG TY CỔ PHẦN..." /></div>
            <div className="xl:col-span-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lĩnh vực hoạt động</label><select value={formData.domain_id} onChange={e => setFormData({...formData, domain_id: e.target.value})} className="w-full h-12 border border-slate-200 bg-white rounded-xl px-4 mt-2 outline-none focus:border-[#002D62] transition-colors"><option value="">-- Chọn --</option>{domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
            <div className="xl:col-span-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gói Cước (*)</label><select value={formData.tier_id} onChange={e => setFormData({...formData, tier_id: e.target.value})} className="w-full h-12 border border-slate-200 bg-white rounded-xl px-4 mt-2 font-bold text-amber-700 outline-none focus:border-[#002D62] transition-colors"><option value="">-- Chọn --</option>{tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            
            <div className="xl:col-span-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày hết hạn thẻ</label><input type="date" value={formData.expiration_date} onChange={e => setFormData({...formData, expiration_date: e.target.value})} className="w-full h-12 border border-slate-200 bg-slate-50 rounded-xl px-4 mt-2 font-bold text-slate-700 outline-none focus:bg-white focus:border-[#002D62] transition-colors" /></div>

            <div className="flex gap-3 xl:col-span-4 justify-end mt-4">
              <button onClick={() => {setShowForm(false); setEditingId(null)}} className="px-6 h-12 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors w-full sm:w-auto">HỦY BỎ</button>
              <button onClick={handleSaveCorp} className="px-10 h-12 bg-[#002D62] text-white font-black rounded-xl shadow-md hover:bg-blue-900 transition-colors w-full sm:w-auto">LƯU HỒ SƠ</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr>
                <th className="p-5 pl-8">Thông tin Doanh nghiệp</th>
                <th className="p-5">Cấu hình Thẻ</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-right pr-8">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(activeTab === 'list' ? activeCorps : activeTab === 'verify' ? verifyCorps : approveCorps).map(corp => (
                <tr key={corp.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="p-5 pl-8">
                    <div className="font-black text-[#002D62] text-base mb-1">{corp.name}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">MST: {corp.tax_code}</span>
                      <span><i className="ph-fill ph-tag text-slate-400 mr-1"></i> {corp.corporate_domains?.name || 'Đang cập nhật'}</span>
                    </div>
                    {corp.status === 'REJECTED' && (
                      <div className="mt-3 text-xs text-rose-700 font-medium bg-rose-50 p-3 rounded-xl border border-rose-100 flex items-start gap-2 max-w-lg">
                        <i className="ph-fill ph-warning-circle text-rose-500 text-base"></i> 
                        <span><strong className="text-rose-900">Bút phê:</strong> "{corp.rejection_reason}"</span>
                      </div>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="font-black text-amber-600 mb-1">{corp.corporate_tiers?.name || 'Chưa cấp'}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {corp.join_date ? `Tham gia: ${new Date(corp.join_date).toLocaleDateString('vi-VN')}` : 'Mới đăng ký'}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${corp.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : corp.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' : corp.status === 'PENDING_DELETION' ? 'bg-slate-800 text-white border-slate-700' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {corp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-5 text-right space-x-2 pr-8 whitespace-nowrap">
                    {activeTab === 'list' && (
                      <>
                        <button onClick={() => {setEditingId(corp.id); setFormData({tax_code: corp.tax_code, name: corp.name, domain_id: corp.domain_id || '', tier_id: corp.tier_id, expiration_date: corp.expiration_date ? corp.expiration_date.split('T')[0] : ''}); setShowForm(true);}} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-slate-200 text-blue-600 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors" title="Chỉnh sửa"><i className="ph-bold ph-pencil-simple text-base"></i></button>
                        <button onClick={() => handleRequestDelete(corp)} className="w-9 h-9 inline-flex items-center justify-center bg-white border border-slate-200 text-rose-600 rounded-lg hover:bg-rose-50 hover:border-rose-200 transition-colors" title="Xin xóa"><i className="ph-bold ph-trash text-base"></i></button>
                      </>
                    )}
                    {activeTab === 'verify' && <button onClick={() => openReviewModal(corp, 'VERIFY')} className="px-5 py-2.5 bg-amber-500 text-white font-black text-xs rounded-xl shadow-md hover:bg-amber-600 transition-transform hover:-translate-y-0.5 flex items-center gap-2 ml-auto"><i className="ph-bold ph-magnifying-glass"></i> RÀ SOÁT KYC</button>}
                    {activeTab === 'approve' && <button onClick={() => openReviewModal(corp, 'APPROVE')} className="px-5 py-2.5 bg-[#002D62] text-white font-black text-xs rounded-xl shadow-md hover:bg-blue-900 transition-transform hover:-translate-y-0.5 flex items-center gap-2 ml-auto"><i className="ph-bold ph-signature"></i> KÝ DUYỆT</button>}
                  </td>
                </tr>
              ))}
              {(activeTab === 'list' ? activeCorps : activeTab === 'verify' ? verifyCorps : approveCorps).length === 0 && (
                <tr>
                  <td colSpan={4} className="p-16 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4"><i className="ph-fill ph-folder-dashed text-3xl text-slate-300"></i></div>
                    <p className="text-slate-500 font-bold">Không có hồ sơ nào trong hàng đợi.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL REVIEW HỒ SƠ & RA QUYẾT ĐỊNH (SOP) */}
      {/* ========================================== */}
      {reviewingCorp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className={`p-6 md:px-8 flex justify-between items-center text-white ${reviewMode === 'VERIFY' ? 'bg-amber-500' : 'bg-[#002D62]'}`}>
              <div>
                <h3 className="font-black text-xl tracking-wide flex items-center gap-2 mb-1">
                  <i className={`ph-bold ${reviewMode === 'VERIFY' ? 'ph-magnifying-glass' : 'ph-check-circle'} text-2xl`}></i>
                  {reviewMode === 'VERIFY' ? 'RÀ SOÁT HỒ SƠ DOANH NGHIỆP' : 'TỔNG GIÁM ĐỐC KÝ DUYỆT'}
                </h3>
                <p className="text-xs font-medium opacity-80 uppercase tracking-widest">Quy trình KYC B2B</p>
              </div>
              <button onClick={closeReviewModal} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"><i className="ph-bold ph-x text-xl"></i></button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-8 bg-slate-50/50">
              {/* Thông tin cốt lõi */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="font-black text-[#002D62] text-sm uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-buildings"></i> Hồ sơ định danh</h4>
                </div>
                <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-4">
                  <div className="col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tên Doanh nghiệp (Pháp nhân)</p><p className="font-black text-[#002D62] text-xl">{reviewingCorp.name}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mã số thuế</p><p className="font-mono font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg w-fit border border-blue-100">{reviewingCorp.tax_code}</p></div>
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gói đăng ký</p><p className="font-black text-amber-600 text-base">{reviewingCorp.corporate_tiers?.name || 'Chưa có'}</p></div>
                  <div className="col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lĩnh vực hoạt động</p><p className="font-bold text-slate-700">{reviewingCorp.corporate_domains?.name || '---'}</p></div>
                </div>
              </div>

              {/* Bằng chứng ĐKKD (Hiển thị to rõ ràng cho Admin xem) */}
              {reviewingCorp.details?.brc_image && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h4 className="font-black text-[#002D62] text-sm uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-image"></i> Giấy phép ĐKKD (Bản chụp)</h4>
                    <a href={reviewingCorp.details.brc_image} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><i className="ph-bold ph-arrow-square-out"></i> Xem ảnh gốc</a>
                  </div>
                  <div className="p-5 bg-slate-100 flex justify-center">
                    <img src={reviewingCorp.details.brc_image} alt="ĐKKD" className="max-h-64 object-contain rounded-xl shadow-md border border-slate-200" />
                  </div>
                </div>
              )}

              {/* Dành riêng cho TGĐ xem: Ai là người duyệt */}
              {reviewMode === 'APPROVE' && (
                <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex justify-between items-center shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white border border-blue-200 text-blue-600 flex items-center justify-center font-black shadow-sm"><i className="ph-fill ph-user-check text-2xl"></i></div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Người xét duyệt (Vòng 1): {reviewingCorp.verifier?.name}</p>
                      <p className="text-xs font-medium text-blue-600 mt-1 flex items-center gap-1"><i className="ph-fill ph-clock"></i> Lúc {new Date(reviewingCorp.verified_at).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <div className="text-right bg-white p-3 rounded-xl border border-blue-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời hạn cấp</p>
                    <p className="font-black text-emerald-600 text-lg">{new Date(reviewingCorp.expiration_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              )}

              {/* Dành cho NV: Thiết lập hạn mức */}
              {reviewMode === 'VERIFY' && !isRejecting && (
                <div className="bg-white border border-amber-200 p-6 rounded-2xl shadow-sm">
                  <label className="text-sm font-black text-slate-800 block mb-2 uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-calendar-blank text-amber-500 text-xl"></i> Đề xuất Ngày hết hạn thẻ KYC</label>
                  <p className="text-xs text-slate-500 mb-4 font-medium leading-relaxed">Hệ thống mặc định đề xuất cộng thêm 1 năm kể từ ngày xác minh. Nhân viên có trách nhiệm kiểm tra lại hợp đồng để điều chỉnh cho khớp.</p>
                  <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full h-14 border-2 border-amber-200 rounded-xl px-4 font-black text-amber-900 text-lg outline-none focus:border-amber-500 bg-amber-50/30 transition-colors" />
                </div>
              )}

              {/* Khung gõ Comment từ chối */}
              {isRejecting && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-white border border-rose-200 p-6 rounded-2xl shadow-sm">
                  <label className="text-sm font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2"><i className="ph-fill ph-warning-circle text-xl"></i> Ghi chú lý do trả hồ sơ (Bút phê)</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Nhập lý do sai sót (VD: Ảnh ĐKKD bị mờ, MST không khớp với Cổng thông tin Quốc gia...) để Hội viên sửa lại." className="w-full h-32 border-2 border-rose-100 rounded-xl p-4 text-sm font-medium outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-rose-50 placeholder:text-rose-300 text-rose-900" />
                </div>
              )}
            </div>

            {/* Vùng Nút Bấm */}
            <div className="p-6 bg-white border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
              {isRejecting ? (
                <>
                  <button onClick={() => setIsRejecting(false)} className="px-8 h-12 bg-white border border-slate-300 font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">HỦY BỎ</button>
                  <button onClick={() => executeAction('REJECT')} className="px-8 h-12 bg-rose-600 text-white font-black rounded-xl shadow-md hover:bg-rose-700 transition-colors flex items-center gap-2"><i className="ph-bold ph-paper-plane-right"></i> XÁC NHẬN TRẢ HỒ SƠ</button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsRejecting(true)} className="px-8 h-12 bg-white border-2 border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors">TỪ CHỐI (GHI BÚT PHÊ)</button>
                  
                  {reviewMode === 'VERIFY' ? (
                    <button onClick={() => executeAction('SUBMIT_TO_CEO')} className="px-10 h-12 bg-amber-500 text-[#002D62] font-black rounded-xl shadow-md hover:bg-amber-400 hover:-translate-y-0.5 transition-all flex items-center gap-2"><i className="ph-bold ph-share-fat"></i> TRÌNH TỔNG GIÁM ĐỐC</button>
                  ) : reviewingCorp.status === 'PENDING_DELETION' ? (
                    <button onClick={() => executeAction('ARCHIVE')} className="px-10 h-12 bg-slate-800 text-white font-black rounded-xl shadow-md hover:bg-black hover:-translate-y-0.5 transition-all flex items-center gap-2"><i className="ph-bold ph-archive"></i> ĐỒNG Ý XÓA</button>
                  ) : (
                    <button onClick={() => executeAction('FINAL_APPROVE')} className="px-10 h-12 bg-[#002D62] text-white font-black rounded-xl shadow-md hover:bg-blue-900 hover:-translate-y-0.5 transition-all flex items-center gap-2"><i className="ph-bold ph-signature"></i> KÝ DUYỆT (ACTIVE)</button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}