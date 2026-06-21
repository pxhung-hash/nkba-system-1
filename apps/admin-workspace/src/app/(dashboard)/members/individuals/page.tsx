'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function IndividualsPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'verify' | 'approve'>('list');

  const [individuals, setIndividuals] = useState<any[]>([]);
  const [corporates, setCorporates] = useState<any[]>([]);
  const [indTiers, setIndTiers] = useState<any[]>([]);

  // State Form
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCorporateSponsored, setIsCorporateSponsored] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', corporate_id: '', tier_id: '', expiration_date: '' });

  // Modal Phê duyệt
  const [reviewingInd, setReviewingInd] = useState<any>(null);
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

    const [indRes, corpRes, tierRes] = await Promise.all([
      supabase.from('individuals')
        .select(`
          *,
          corporates!individuals_corporate_id_fkey(name, expiration_date),
          individual_tiers!individuals_tier_id_fkey(name, code),
          verifier:employees!individuals_verified_by_fkey(name),
          approver:employees!individuals_approved_by_fkey(name)
        `)
        .order('join_date', { ascending: false }),
      supabase.from('corporates').select('*, corporate_tiers(quota_silver, quota_gold, quota_titanium)').eq('status', 'ACTIVE'),
      supabase.from('individual_tiers').select('*')
    ]);
    
    if (indRes.error) {
      console.error("Lỗi truy vấn Database:", indRes.error);
      alert("Lỗi tải dữ liệu: " + indRes.error.message);
    }

    if (indRes.data) setIndividuals(indRes.data);
    if (corpRes.data) setCorporates(corpRes.data);
    if (tierRes.data) setIndTiers(tierRes.data);
    
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [supabase]);

  const isCEO = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'CEO';

  // ==========================================
  // PHÂN LOẠI TAB (ĐÃ BỔ SUNG PENDING_UPGRADE)
  // ==========================================
  const activeInds = individuals.filter(i => i.status === 'ACTIVE' || !i.status);

  // Thêm PENDING_UPGRADE vào Trạm xác minh để Admin kiểm tra biên lai
  const verifyInds = individuals.filter(i => ['PENDING_VERIFICATION', 'REJECTED', 'PENDING_UPGRADE'].includes(i.status));

  // Tab Bàn làm việc TGĐ
  const approveInds = individuals.filter(i => ['PENDING_APPROVAL', 'PENDING_DELETION'].includes(i.status));

  const handleSaveInd = async () => {
    if (!formData.full_name || !formData.tier_id) return alert('Vui lòng nhập Tên và chọn Gói thẻ!');

    const payload = {
      full_name: formData.full_name,
      email: formData.email || null,
      phone: formData.phone || null,
      tier_id: formData.tier_id,
      corporate_id: isCorporateSponsored ? formData.corporate_id : null,
      is_corporate_sponsored: isCorporateSponsored,
      expiration_date: formData.expiration_date || null,
      ...(editingId ? {} : { status: 'ACTIVE' }) 
    };

    if (editingId) {
      await supabase.from('individuals').update(payload).eq('id', editingId);
      alert('✅ Cập nhật thành công!');
    } else {
      await supabase.from('individuals').insert([payload]);
      alert('✅ Đăng ký thành công! Hội viên đã được kích hoạt.');
    }
    
    setShowForm(false); setEditingId(null); 
    setFormData({ full_name: '', email: '', phone: '', corporate_id: '', tier_id: '', expiration_date: '' });
    fetchData();
  };

  const handleRequestDelete = async (ind: any) => {
    const reason = window.prompt(`Lý do muốn xóa hội viên "${ind.full_name}"?`);
    if (!reason) return;
    await supabase.from('individuals').update({ 
      status: 'PENDING_DELETION', 
      rejection_reason: reason, 
      verified_by: currentUser.id 
    }).eq('id', ind.id);
    alert('🚀 Đã gửi yêu cầu XÓA lên Tổng Giám đốc.');
    fetchData();
  };

  const openReviewModal = (ind: any, mode: 'VERIFY' | 'APPROVE') => {
    setReviewingInd(ind);
    setReviewMode(mode);
    setIsRejecting(false);
    setRejectReason(ind.rejection_reason || '');
    
    if (mode === 'VERIFY') {
      if (ind.is_corporate_sponsored && ind.corporate_id) { 
        const sponsorCorp = corporates.find(c => c.id === ind.corporate_id);
        setExpiryDate(sponsorCorp?.expiration_date ? sponsorCorp.expiration_date.split('T')[0] : '');
      } else {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        setExpiryDate(ind.expiration_date ? ind.expiration_date.split('T')[0] : nextYear.toISOString().split('T')[0]);
      }
    }
  };

  const closeReviewModal = () => {
    setReviewingInd(null);
    setReviewMode(null);
  };

  const executeAction = async (action: 'SUBMIT_TO_CEO' | 'FINAL_APPROVE' | 'REJECT' | 'ARCHIVE') => {
    if (!reviewingInd) return;

    try {
      if (action === 'REJECT') {
        if (!rejectReason.trim()) return alert('Vui lòng nhập lý do từ chối (Bút phê)!');
        await supabase.from('individuals').update({ 
          status: 'REJECTED', 
          rejection_reason: rejectReason,
          verified_by: reviewMode === 'APPROVE' ? null : currentUser.id 
        }).eq('id', reviewingInd.id);
        alert('❌ Đã trả hồ sơ kèm bút phê!');
      } 
      
      else if (action === 'SUBMIT_TO_CEO') {
        if (reviewingInd.is_corporate_sponsored && reviewingInd.corporate_id) { 
          const selectedCorp = corporates.find(c => c.id === reviewingInd.corporate_id);
          // NẾU LÀ NÂNG CẤP, KIỂM TRA QUOTA CỦA GÓI MỚI THAY VÌ GÓI CŨ
          const checkTierId = reviewingInd.upgrade_tier_id || reviewingInd.tier_id;
          const selectedTier = indTiers.find(t => t.id === checkTierId);
          if (!selectedCorp || !selectedTier) throw new Error('Không tìm thấy Công ty hoặc Gói thẻ!');

          const tierCode = selectedTier.code.toLowerCase(); 
          const maxQuota = selectedCorp.corporate_tiers?.[`quota_${tierCode}`] || 0;

          const { count } = await supabase.from('individuals')
            .select('*', { count: 'exact', head: true })
            .eq('is_corporate_sponsored', true)
            .eq('corporate_id', reviewingInd.corporate_id)
            .eq('tier_id', checkTierId)
            .in('status', ['ACTIVE', 'PENDING_APPROVAL']);

          if ((count || 0) >= maxQuota) {
            throw new Error(`❌ TỪ CHỐI TRÌNH DUYỆT: Doanh nghiệp đã hết hạn mức thẻ ${selectedTier.name} (${count}/${maxQuota}).`);
          }
        }

        if (!expiryDate) throw new Error('Vui lòng thiết lập Hạn sử dụng!');
        
        await supabase.from('individuals').update({ 
          status: 'PENDING_APPROVAL', 
          expiration_date: expiryDate,
          verified_by: currentUser.id,
          verified_at: new Date().toISOString(),
          rejection_reason: null
        }).eq('id', reviewingInd.id);
        alert('✅ Xác minh thành công. Đã trình TGĐ!');
      }

      else if (action === 'FINAL_APPROVE') {
        // LUỒNG TỰ ĐỘNG ĐỔI GÓI KHI SẾP KÝ DUYỆT NÂNG CẤP
        const updatePayload: any = {
          status: 'ACTIVE', 
          approved_by: currentUser.id,
          join_date: new Date().toISOString(),
          rejection_reason: null
        };

        if (reviewingInd.upgrade_tier_id) {
          updatePayload.tier_id = reviewingInd.upgrade_tier_id;
          updatePayload.upgrade_tier_id = null; // Xóa cờ chờ nâng cấp
        }

        await supabase.from('individuals').update(updatePayload).eq('id', reviewingInd.id);
        alert('🎉 KÝ DUYỆT THÀNH CÔNG! Hồ sơ chính thức hoạt động/được nâng cấp.');
      }

      else if (action === 'ARCHIVE') {
        await supabase.from('individuals').update({ 
          status: 'ARCHIVED', 
          approved_by: currentUser.id 
        }).eq('id', reviewingInd.id);
        alert('🗑️ ĐÃ DUYỆT XÓA: Hồ sơ cá nhân đã được lưu trữ.');
      }

      closeReviewModal();
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse font-bold text-slate-400">ĐANG NẠP HỆ THỐNG...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* HEADER & TABS NAVIGATION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase">Hội viên Cá nhân</h2>
            <p className="text-sm text-slate-500 font-medium">Quản lý và hỗ trợ Hội viên.</p>
          </div>
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="px-6 py-2.5 bg-[#002D62] text-white font-bold rounded-xl hover:bg-blue-900 shadow-sm">
              + ĐĂNG KÝ MỚI
            </button>
          )}
        </div>

        <div className="flex gap-2 mt-6 border-b border-slate-100 pb-2 overflow-x-auto">
          <button onClick={() => setActiveTab('list')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === 'list' ? 'bg-slate-100 text-[#002D62]' : 'text-slate-500 hover:bg-slate-50'}`}>Danh sách Chính thức <span className="bg-[#002D62] text-white px-1.5 py-0.5 rounded text-[10px] ml-1">{activeInds.length}</span></button>
          <button onClick={() => setActiveTab('verify')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'verify' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}>Trạm Xác minh NV <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded text-[10px]">{verifyInds.length}</span></button>
          {isCEO && (
            <button onClick={() => setActiveTab('approve')} className={`shrink-0 px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-colors ${activeTab === 'approve' ? 'bg-rose-50 text-rose-700' : 'text-slate-500 hover:bg-slate-50'}`}>Bàn làm việc TGĐ <span className="bg-rose-600 text-white px-1.5 py-0.5 rounded text-[10px]">{approveInds.length}</span></button>
          )}
        </div>
      </div>

      {/* FORM THÊM/SỬA */}
      {showForm && (
        <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h3 className="font-bold flex items-center gap-2">
              <i className={`ph-bold ${editingId ? 'ph-pencil-simple text-amber-600' : 'ph-plus-circle text-[#002D62]'} text-xl`}></i>
              {editingId ? 'Cập nhật Hồ sơ Cá nhân' : 'Đăng ký Cá nhân mới'}
            </h3>
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-lg">
              <button onClick={() => setIsCorporateSponsored(false)} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${!isCorporateSponsored ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Độc lập</button>
              <button onClick={() => setIsCorporateSponsored(true)} className={`px-4 py-1.5 rounded text-xs font-bold transition-all ${isCorporateSponsored ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>Kèm Pháp nhân (Quota)</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
            <div className="xl:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Họ và Tên (*)</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full h-11 border border-slate-200 rounded-xl px-3 mt-1 font-bold text-slate-800 outline-none focus:border-blue-400 transition-colors" /></div>
            <div className="xl:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Email / SĐT</label><input type="text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full h-11 border border-slate-200 rounded-xl px-3 mt-1 outline-none focus:border-blue-400 transition-colors" /></div>
            
            {isCorporateSponsored && (
              <div className="xl:col-span-2 animate-in fade-in">
                <label className="text-[10px] font-black text-blue-600 uppercase">Pháp nhân bảo lãnh</label>
                <select value={formData.corporate_id} onChange={e => setFormData({...formData, corporate_id: e.target.value})} className="w-full h-11 border-blue-200 bg-blue-50 text-blue-800 rounded-xl px-2 mt-1 font-bold outline-none focus:ring-4 focus:ring-blue-500/10"><option value="">-- Chọn --</option>{corporates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              </div>
            )}
            
            <div className="xl:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Gói Thẻ (*)</label><select value={formData.tier_id} onChange={e => setFormData({...formData, tier_id: e.target.value})} className="w-full h-11 border border-slate-200 bg-white rounded-xl px-2 mt-1 outline-none focus:border-blue-400"><option value="">-- Chọn --</option>{indTiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>

            {!isCorporateSponsored && (
              <div className="xl:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase">Ngày hết hạn (Gia hạn)</label><input type="date" value={formData.expiration_date} onChange={e => setFormData({...formData, expiration_date: e.target.value})} className="w-full h-11 border border-slate-200 bg-white text-slate-700 font-bold rounded-xl px-3 mt-1 outline-none focus:border-blue-400" /></div>
            )}

            <div className="flex gap-2 xl:col-span-2 justify-end mt-4">
              <button onClick={() => {setShowForm(false); setEditingId(null)}} className="px-5 h-11 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors w-full sm:w-auto">HỦY</button>
              <button onClick={handleSaveInd} className="px-8 h-11 bg-[#002D62] text-white font-bold rounded-xl shadow-md hover:bg-blue-900 transition-colors w-full sm:w-auto">LƯU HỒ SƠ</button>
            </div>
          </div>
        </div>
      )}

      {/* DANH SÁCH BẢNG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <tr><th className="p-4 pl-6">Hội viên</th><th className="p-4">Phân loại</th><th className="p-4">Trạng thái</th><th className="p-4 text-right pr-6">Thao tác</th></tr>
            </thead>
            <tbody>
              {(activeTab === 'list' ? activeInds : activeTab === 'verify' ? verifyInds : approveInds).map(ind => {
                 const tierName = Array.isArray(ind.individual_tiers) ? ind.individual_tiers[0]?.name : ind.individual_tiers?.name;

                 return (
                  <tr key={ind.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="font-bold text-slate-900 text-base">{ind.full_name} <span className="text-amber-600 ml-1 text-xs">({tierName || 'Chưa xếp hạng'})</span></div>
                      <div className="text-xs text-slate-500 mt-1"><i className="ph-fill ph-envelope-simple mr-1"></i>{ind.email || ind.phone || 'Chưa cung cấp'}</div>
                      {ind.status === 'REJECTED' && <div className="text-xs text-rose-700 font-medium mt-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100"><i className="ph-fill ph-warning-circle text-rose-500"></i> Bút phê: "{ind.rejection_reason}"</div>}
                    </td>
                    <td className="p-4">
                      {ind.is_corporate_sponsored ? ( 
                        <div><span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">Pháp nhân</span><div className="font-bold text-slate-700 text-xs mt-1">{ind.corporates?.name}</div></div>
                      ) : <span className="text-[9px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase">Độc lập</span>}
                    </td>
                    <td className="p-4">
                      {/* LÀM NỔI BẬT TRẠNG THÁI NÂNG CẤP BẰNG MÀU TÍM */}
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        (!ind.status || ind.status === 'ACTIVE' || ind.status === 'PENDING_VERIFICATION') ? 'bg-emerald-100 text-emerald-700' : 
                        ind.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 
                        ind.status === 'PENDING_DELETION' ? 'bg-slate-800 text-white' : 
                        ind.status === 'PENDING_UPGRADE' ? 'bg-purple-100 text-purple-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {(!ind.status || ind.status === 'PENDING_VERIFICATION') ? 'ACTIVE (TỰ ĐĂNG KÝ)' : 
                         ind.status === 'PENDING_UPGRADE' ? 'YÊU CẦU NÂNG CẤP' : 
                         ind.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2 pr-6">
                      {activeTab === 'list' && (
                        <>
                          <button onClick={() => {setEditingId(ind.id); setIsCorporateSponsored(ind.is_corporate_sponsored); setFormData({full_name: ind.full_name, email: ind.email || '', phone: ind.phone || '', corporate_id: ind.corporate_id || '', tier_id: ind.tier_id, expiration_date: ind.expiration_date ? ind.expiration_date.split('T')[0] : ''}); setShowForm(true);}} className="px-3 py-1.5 bg-slate-100 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-50 transition-colors">Sửa</button>
                          <button onClick={() => handleRequestDelete(ind)} className="px-3 py-1.5 bg-slate-100 text-rose-600 font-bold text-xs rounded-lg hover:bg-rose-50 transition-colors">Xin Xóa</button>
                        </>
                      )}
                      {activeTab === 'verify' && <button onClick={() => openReviewModal(ind, 'VERIFY')} className="px-4 py-2 bg-amber-500 text-white font-bold text-xs rounded-lg hover:bg-amber-600 shadow-sm transition-transform hover:-translate-y-0.5">XEM & XÁC MINH</button>}
                      {activeTab === 'approve' && <button onClick={() => openReviewModal(ind, 'APPROVE')} className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg hover:bg-rose-700 shadow-sm transition-transform hover:-translate-y-0.5">XEM & KÝ DUYỆT</button>}
                    </td>
                  </tr>
                );
              })}
              {(activeTab === 'list' ? activeInds : activeTab === 'verify' ? verifyInds : approveInds).length === 0 && (
                <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">Không có dữ liệu trong danh sách này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL REVIEW HỒ SƠ & RA QUYẾT ĐỊNH (SOP) */}
      {/* ========================================== */}
      {reviewingInd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            <div className={`p-6 flex justify-between items-center text-white ${reviewMode === 'VERIFY' ? 'bg-amber-500' : 'bg-[#002D62]'}`}>
              <h3 className="font-black text-lg tracking-wide flex items-center gap-2">
                <i className={`ph-bold ${reviewMode === 'VERIFY' ? 'ph-magnifying-glass' : 'ph-check-circle'} text-2xl`}></i>
                {reviewMode === 'VERIFY' ? 'NHÂN VIÊN RÀ SOÁT HỒ SƠ CÁ NHÂN' : 'TỔNG GIÁM ĐỐC KÝ DUYỆT CÁ NHÂN'}
              </h3>
              <button onClick={closeReviewModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition-colors"><i className="ph-bold ph-x text-lg"></i></button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div className="col-span-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Họ và Tên</p><p className="font-black text-slate-800 text-lg">{reviewingInd.full_name}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Liên hệ</p><p className="font-medium text-slate-700">{reviewingInd.email || reviewingInd.phone || 'N/A'}</p></div>
                
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gói cấp phát (Hiện tại)</p>
                   <p className="font-bold text-amber-600">
                     {Array.isArray(reviewingInd.individual_tiers) ? reviewingInd.individual_tiers[0]?.name : reviewingInd.individual_tiers?.name || 'CHƯA CHỌN GÓI'}
                   </p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nguồn cấp (Bảo lãnh)</p>
                  {reviewingInd.is_corporate_sponsored ? ( 
                    <p className="font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 w-fit"><i className="ph-fill ph-buildings"></i> {reviewingInd.corporates?.name}</p>
                  ) : <p className="font-bold text-slate-600"><i className="ph-fill ph-user"></i> Cấp thẻ Độc lập</p>}
                </div>

                {/* KHU VỰC HIỂN THỊ LINK XEM BIÊN LAI NÂNG CẤP */}
                {reviewingInd.payment_receipt_url && (
                  <div className="col-span-2 mt-2 bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <i className="ph-fill ph-receipt text-lg"></i> Thông tin Nâng cấp Thẻ
                    </p>
                    <a href={reviewingInd.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-lg hover:bg-purple-700 transition-colors">
                      <i className="ph-bold ph-arrow-square-out"></i> Xem Ảnh Biên Lai Thanh Toán
                    </a>
                  </div>
                )}
              </div>

              {reviewMode === 'APPROVE' && (
                <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black"><i className="ph-fill ph-user-check text-xl"></i></div>
                    <div>
                      <p className="text-xs font-bold text-blue-900">NV Xác minh: Hệ thống / {reviewingInd.verifier?.name || 'N/A'}</p>
                      <p className="text-[10px] font-medium text-blue-600 mt-0.5">Vào lúc: {reviewingInd.verified_at ? new Date(reviewingInd.verified_at).toLocaleString('vi-VN') : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời hạn cấp</p>
                    <p className="font-black text-slate-800 text-lg bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">{reviewingInd.expiration_date ? new Date(reviewingInd.expiration_date).toLocaleDateString('vi-VN') : 'N/A'}</p>
                  </div>
                </div>
              )}

              {reviewMode === 'VERIFY' && !isRejecting && (
                <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                  <label className="text-xs font-bold text-slate-800 block mb-2 uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-calendar-blank text-amber-500 text-lg"></i> Đề xuất Ngày hết hạn thẻ</label>
                  {reviewingInd.is_corporate_sponsored ? ( 
                    <>
                      <p className="text-[10px] text-slate-500 mb-3 font-medium">Thẻ được cấp theo Quota của Doanh nghiệp. Hệ thống đã <strong className="text-blue-600">tự động đồng bộ</strong> ngày hết hạn theo Hợp đồng của Pháp nhân.</p>
                      <input type="date" value={expiryDate} readOnly className="w-full h-12 border-2 border-slate-200 rounded-xl px-4 font-bold text-slate-500 outline-none bg-slate-100 cursor-not-allowed" />
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] text-slate-500 mb-3 font-medium">Hệ thống mặc định đề xuất cộng thêm 1 năm kể từ ngày xác minh. Nhân viên có thể điều chỉnh nếu cần.</p>
                      <input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="w-full h-12 border-2 border-amber-200 rounded-xl px-4 font-bold text-amber-900 outline-none focus:border-amber-500 bg-white shadow-inner" />
                    </>
                  )}
                </div>
              )}

              {isRejecting && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="text-xs font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2"><i className="ph-fill ph-warning-circle text-lg"></i> Ghi chú lý do trả hồ sơ (Bút phê)</label>
                  <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Nhập lý do sai sót (VD: Check lại SĐT, Sai gói Quota...) để người trước biết đường sửa." className="w-full h-28 border-2 border-rose-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 bg-rose-50 placeholder:text-rose-300 text-rose-900" />
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-end gap-3">
              {isRejecting ? (
                <>
                  <button onClick={() => setIsRejecting(false)} className="px-6 h-12 bg-white border border-slate-300 font-bold text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">HỦY BỎ</button>
                  <button onClick={() => executeAction('REJECT')} className="px-6 h-12 bg-rose-600 text-white font-black rounded-xl shadow-md hover:bg-rose-700 transition-colors">XÁC NHẬN TRẢ HỒ SƠ</button>
                </>
              ) : (
                <>
                  <button onClick={() => setIsRejecting(true)} className="px-6 h-12 bg-white border-2 border-rose-100 text-rose-600 font-bold rounded-xl hover:bg-rose-50 transition-colors">TỪ CHỐI (GHI BÚT PHÊ)</button>
                  
                  {reviewMode === 'VERIFY' ? (
                    <button onClick={() => executeAction('SUBMIT_TO_CEO')} className="px-8 h-12 bg-amber-500 text-[#002D62] font-black rounded-xl shadow-md shadow-amber-500/20 hover:bg-amber-400 hover:-translate-y-0.5 transition-all">CHECK QUOTA & TRÌNH TGĐ</button>
                  ) : reviewingInd.status === 'PENDING_DELETION' ? (
                    <button onClick={() => executeAction('ARCHIVE')} className="px-8 h-12 bg-slate-800 text-white font-black rounded-xl shadow-md hover:bg-black hover:-translate-y-0.5 transition-all">ĐỒNG Ý XÓA (LƯU TRỮ)</button>
                  ) : (
                    <button onClick={() => executeAction('FINAL_APPROVE')} className="px-8 h-12 bg-[#002D62] text-white font-black rounded-xl shadow-md shadow-[#002D62]/20 hover:bg-blue-900 hover:-translate-y-0.5 transition-all">KÝ DUYỆT (ACTIVE)</button>
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