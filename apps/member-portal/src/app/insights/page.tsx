'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function MemberInsightsPage() {
  const [supabase] = useState(() => createClient());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'requests'>('library');
  
  const [reports, setReports] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  
  const [tierLevels, setTierLevels] = useState<Record<string, number>>({});
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reqForm, setReqForm] = useState({ title: '', content: '' });

  const UPGRADE_URL = "/upgrade";

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('individuals')
        .select('id, individual_tiers!individuals_tier_id_fkey(name, code)')
        .eq('user_auth_id', user.id)
        .single();

      if (profile) {
        const tierCode = Array.isArray(profile.individual_tiers) ? profile.individual_tiers[0]?.code : (profile.individual_tiers as any)?.code;
        let allowedFeatures: string[] = [];
        
        if (tierCode === 'VIP') {
          allowedFeatures = ['VIEW_MARKET_BUDGET', 'VIEW_MARKET_CONTACT', 'POST_PROJECT', 'VIEW_TALENT_CONTACT', 'POST_JOB', 'REQUEST_CUSTOM_DATA'];
        } else {
          const { data: features } = await supabase.from('tier_features').select('feature_code').eq('tier_code', tierCode).eq('can_access', true);
          if (features) allowedFeatures = features.map(f => f.feature_code);
        }
        setCurrentUser({ ...profile, tier_code: tierCode, allowedFeatures });
        
        const { data: tiersData } = await supabase.from('individual_tiers').select('code, annual_fee').order('annual_fee', { ascending: true });
        const levels: Record<string, number> = { 'PUBLIC': 0 };
        if (tiersData) tiersData.forEach((t, index) => { levels[t.code] = index + 1; });
        levels['VIP'] = 999;
        setTierLevels(levels);

        const { data: reps } = await supabase.from('reports').select('*').eq('is_active', true).order('created_at', { ascending: false });
        if (reps) setReports(reps);

        const { data: reqs } = await supabase.from('data_requests').select('*').eq('member_id', profile.id).order('updated_at', { ascending: false });
        if (reqs) setMyRequests(reqs);
      }
    };
    fetchUserAndData();
  }, [supabase]);

  const handleSubmitRequest = async () => {
    if (!reqForm.title || !reqForm.content) return alert('Vui lòng nhập đủ thông tin yêu cầu!');
    setIsSubmitting(true);
    const payload = { member_id: currentUser.id, title: reqForm.title, content: reqForm.content, status: 'PENDING' };
    const { error } = await supabase.from('data_requests').insert([payload]);
    if (error) alert('Lỗi: ' + error.message);
    else {
      alert('✅ Yêu cầu đã được gửi đến Ban quản trị NKBA!');
      setShowForm(false);
      setReqForm({ title: '', content: '' });
      const { data } = await supabase.from('data_requests').select('*').eq('member_id', currentUser.id).order('updated_at', { ascending: false });
      if (data) setMyRequests(data);
    }
    setIsSubmitting(false);
  };

  const canAccess = (reportTier: string, userTierCode: string) => {
    const repLvl = tierLevels[reportTier] || 0;
    const usrLvl = tierLevels[userTierCode] || 0;
    return usrLvl >= repLvl; 
  };

  const getReqStatusConfig = (status: string) => {
    switch(status) {
      case 'COMPLETED': return { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'ĐÃ TRẢ KẾT QUẢ' };
      case 'PROCESSING': return { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', label: 'ĐANG XỬ LÝ' };
      case 'NEED_MORE_INFO': return { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', label: 'CẦN BỔ SUNG THÔNG TIN' };
      case 'REJECTED': return { color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', label: 'TỪ CHỐI' };
      default: return { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', label: 'CHỜ TIẾP NHẬN' };
    }
  };

  if (!currentUser) return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-teal-600"></i> Đang nạp Insights...</div>;

  const canRequestData = currentUser?.allowedFeatures?.includes('REQUEST_CUSTOM_DATA');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER & TABS */}
      <div className="bg-white p-6 md:px-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <i className="ph-fill ph-chart-polar text-teal-500"></i> Insights & Dữ liệu
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-10">Đặc quyền thông tin chiến lược, báo cáo ngành dành riêng cho Hội viên.</p>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 w-full md:w-auto">
            <button onClick={() => setActiveTab('library')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'library' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Thư viện Báo cáo</button>
            <button onClick={() => setActiveTab('requests')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'requests' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Đặt hàng Dữ liệu</button>
          </div>
        </div>
      </div>

      {activeTab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {reports.length === 0 ? (
            <div className="col-span-full py-20 text-center flex flex-col items-center bg-white border border-slate-200 rounded-3xl shadow-sm"><div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4"><i className="ph-fill ph-folder-open text-4xl"></i></div><p className="text-slate-500 font-bold text-lg">Chưa có báo cáo nào được phát hành.</p></div>
          ) : (
            reports.map(rep => {
              const hasAccess = canAccess(rep.access_tier, currentUser.tier_code);
              return (
                <div key={rep.id} className="bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden hover:shadow-xl hover:border-teal-300 transition-all group relative">
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 border border-white/30 backdrop-blur-xl"><i className="ph-fill ph-lock-key text-2xl"></i></div>
                      <h4 className="font-black text-lg mb-1">Dành cho {rep.access_tier}</h4>
                      <Link href={UPGRADE_URL} className="px-5 py-2.5 mt-4 bg-amber-500 text-[#002D62] rounded-xl font-black text-xs uppercase hover:bg-amber-400 hover:scale-105 transition-all inline-block shadow-lg">Nâng cấp thẻ</Link>
                    </div>
                  )}

                  <div className={`h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden ${!hasAccess ? 'opacity-50 grayscale' : ''}`}>
                    {rep.cover_image ? <img src={rep.cover_image} alt={rep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <i className="ph-fill ph-file-pdf text-7xl text-teal-600/20 group-hover:scale-105 transition-transform duration-700"></i>}
                    <div className="absolute top-4 left-4"><span className={`text-[9px] font-black px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg border uppercase tracking-widest shadow-sm ${rep.access_tier === 'VIP' ? 'text-amber-600 border-amber-200' : 'text-slate-600 border-slate-200'}`}>{rep.access_tier} {rep.access_tier === 'VIP' && '👑'}</span></div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2"><p className="text-[9px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded border border-teal-100">{rep.category}</p><p className="text-[10px] font-bold text-slate-400">{new Date(rep.created_at).toLocaleDateString('vi-VN')}</p></div>
                    <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors mb-2">{rep.title}</h4>
                    <p className="text-xs font-medium text-slate-500 line-clamp-3 leading-relaxed mb-6">{rep.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      {hasAccess ? (
                        <Link href={`/insights/${rep.id}`} className="w-full h-12 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-xs font-black hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center gap-2">
                          <i className="ph-bold ph-book-open-text text-lg"></i> ĐỌC BÁO CÁO
                        </Link>
                      ) : (
                        <button disabled className="w-full h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-not-allowed">
                          <i className="ph-bold ph-lock-key text-lg"></i> BỊ KHÓA
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {canRequestData ? (
            <>
              <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-8 md:p-12 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><i className="ph-fill ph-magnifying-glass text-[250px] translate-x-10 -translate-y-10"></i></div>
                <div className="relative z-10 max-w-2xl text-center md:text-left"><h3 className="text-2xl md:text-3xl font-black mb-3">Yêu cầu Dữ liệu Cá nhân hóa</h3><p className="text-teal-50 font-medium leading-relaxed">Bạn cần khảo sát thị trường, tìm kiếm đối tác theo tiêu chí riêng? Ban nghiên cứu NKBA sẽ hỗ trợ thu thập dữ liệu chính xác cho doanh nghiệp bạn.</p></div>
                <button onClick={() => setShowForm(!showForm)} className="relative z-10 h-14 px-8 bg-white text-teal-700 rounded-2xl text-sm font-black shadow-lg hover:scale-105 transition-transform shrink-0 flex items-center gap-2"><i className={`ph-bold ${showForm ? 'ph-x' : 'ph-paper-plane-right'} text-lg`}></i> {showForm ? 'ĐÓNG FORM' : 'GỬI YÊU CẦU RIÊNG'}</button>
              </div>

              {showForm && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm animate-in zoom-in-95">
                  <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><i className="ph-fill ph-pencil-line text-teal-600"></i> Viết yêu cầu thu thập dữ liệu</h4>
                  <div className="space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiêu đề yêu cầu (*)</label><input type="text" value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-teal-400 text-slate-900" placeholder="VD: Khảo sát đơn giá vật liệu xây dựng..." /></div>
                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nội dung chi tiết (*)</label><textarea value={reqForm.content} onChange={e => setReqForm({...reqForm, content: e.target.value})} className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:bg-white focus:border-teal-400 text-slate-900" placeholder="Nêu rõ quy mô, mục đích..." /></div>
                    <div className="flex justify-end pt-2 border-t border-slate-100"><button onClick={handleSubmitRequest} disabled={isSubmitting} className="h-14 px-10 bg-teal-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2">{isSubmitting ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU ĐẾN BAN NGHIÊN CỨU'}</button></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRequests.map(req => {
                  const statusConf = getReqStatusConfig(req.status);
                  return (
                    <div key={req.id} className={`bg-white border rounded-[2rem] p-6 md:p-8 shadow-sm group hover:shadow-md transition-all flex flex-col ${statusConf.border}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}>{statusConf.label}</span>
                        <p className="text-[10px] font-bold text-slate-400"><i className="ph-bold ph-clock"></i> {new Date(req.updated_at || req.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-3 leading-tight line-clamp-2">{req.title}</h4>
                      <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-3 bg-slate-50 p-4 rounded-xl border border-slate-100">{req.content}</p>
                      
                      <div className="mt-auto pt-4 border-t border-slate-100">
                        {/* THAY ĐỔI ĐẮT GIÁ: Nút xem chi tiết trỏ tới trang Quản lý Yêu cầu */}
                        <Link href={`/insights/requests/${req.id}`} className="w-full h-12 bg-slate-50 text-[#002D62] border border-slate-200 rounded-xl text-xs font-black hover:bg-[#002D62] hover:text-white transition-colors flex items-center justify-center gap-2">
                          XEM CHI TIẾT & PHẢN HỒI <i className="ph-bold ph-arrow-right text-base"></i>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-[3rem] p-12 md:p-20 text-center shadow-lg group">
              <h3 className="text-2xl font-black text-slate-900 mb-4">Tính năng Đặt hàng Dữ liệu bị khóa</h3>
              <Link href={UPGRADE_URL} className="px-10 py-4 bg-amber-500 text-white rounded-2xl font-black">NÂNG CẤP THẺ CAO CẤP</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}