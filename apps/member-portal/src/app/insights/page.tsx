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

  const UPGRADE_URL = "https://nkba.vn/upgrade"; // ĐƯỜNG DẪN NÂNG CẤP

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
        const tierCode = Array.isArray(profile.individual_tiers) 
          ? profile.individual_tiers[0]?.code 
          : (profile.individual_tiers as any)?.code;

        let allowedFeatures: string[] = [];
        if (tierCode === 'VIP') {
          allowedFeatures = ['VIEW_MARKET_BUDGET', 'VIEW_MARKET_CONTACT', 'POST_PROJECT', 'VIEW_TALENT_CONTACT', 'POST_JOB', 'REQUEST_CUSTOM_DATA'];
        } else {
          const { data: features } = await supabase
            .from('tier_features')
            .select('feature_code')
            .eq('tier_code', tierCode)
            .eq('can_access', true);
            
          if (features) allowedFeatures = features.map(f => f.feature_code);
        }
        setCurrentUser({ ...profile, tier_code: tierCode, allowedFeatures });
        
        const { data: tiersData } = await supabase
          .from('individual_tiers')
          .select('code, annual_fee')
          .order('annual_fee', { ascending: true });

        const levels: Record<string, number> = { 'PUBLIC': 0 };
        if (tiersData) {
          tiersData.forEach((t, index) => {
            levels[t.code] = index + 1;
          });
        }
        levels['VIP'] = 999;
        setTierLevels(levels);

        const { data: reps } = await supabase.from('reports').select('*').eq('is_active', true).order('created_at', { ascending: false });
        if (reps) setReports(reps);

        const { data: reqs } = await supabase.from('data_requests').select('*').eq('member_id', profile.id).order('created_at', { ascending: false });
        if (reqs) setMyRequests(reqs);
      }
    };
    fetchUserAndData();
  }, [supabase]);

  const handleSubmitRequest = async () => {
    if (!reqForm.title || !reqForm.content) return alert('Vui lòng nhập đủ thông tin yêu cầu!');
    setIsSubmitting(true);
    
    const payload = {
      member_id: currentUser.id,
      title: reqForm.title,
      content: reqForm.content,
      status: 'PENDING'
    };

    const { error } = await supabase.from('data_requests').insert([payload]);
    if (error) alert('Lỗi: ' + error.message);
    else {
      alert('✅ Yêu cầu đã được gửi đến Ban quản trị NKBA!');
      setShowForm(false);
      setReqForm({ title: '', content: '' });
      const { data } = await supabase.from('data_requests').select('*').eq('member_id', currentUser.id).order('created_at', { ascending: false });
      if (data) setMyRequests(data);
    }
    setIsSubmitting(false);
  };

  const canAccess = (reportTier: string, userTierCode: string) => {
    const repLvl = tierLevels[reportTier] || 0;
    const usrLvl = tierLevels[userTierCode] || 0;
    return usrLvl >= repLvl; 
  };

  if (!currentUser) return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-teal-600"></i> Đang nạp Insights...</div>;

  const canRequestData = currentUser?.allowedFeatures?.includes('REQUEST_CUSTOM_DATA');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER & TABS */}
      <div className="bg-white p-6 md:px-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-teal-500"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <i className="ph-fill ph-chart-polar text-teal-500"></i> Insights & Dữ liệu
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-10">Đặc quyền thông tin chiến lược dành cho Hội viên.</p>
          </div>
          
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 w-full md:w-auto">
            <button onClick={() => setActiveTab('library')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'library' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Thư viện Báo cáo</button>
            <button onClick={() => setActiveTab('requests')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'requests' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Đặt hàng Dữ liệu</button>
          </div>
        </div>
      </div>

      {activeTab === 'library' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
          {reports.length === 0 ? (
            <div className="col-span-full p-16 text-center text-slate-400 bg-white border border-slate-200 rounded-3xl">Chưa có báo cáo nào được phát hành.</div>
          ) : (
            reports.map(rep => {
              const hasAccess = canAccess(rep.access_tier, currentUser.tier_code);
              return (
                <div key={rep.id} className="bg-white border border-slate-200 rounded-[2.5rem] flex flex-col overflow-hidden hover:shadow-2xl transition-all group relative">
                  
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md z-20 flex flex-col items-center justify-center p-8 text-center text-white">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 border border-white/30 backdrop-blur-xl"><i className="ph-fill ph-lock-key text-2xl"></i></div>
                      <h4 className="font-black text-lg mb-1">Dành cho {rep.access_tier}</h4>
                      <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-6">Nâng cấp để mở khóa</p>
                      <Link href={UPGRADE_URL} className="px-5 py-2 bg-amber-500 text-[#002D62] rounded-lg font-black text-[10px] uppercase hover:bg-amber-400 transition-colors inline-block">Nâng cấp ngay</Link>
                    </div>
                  )}

                  <div className={`h-48 bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center relative ${!hasAccess ? 'opacity-30 grayscale' : ''}`}>
                    <i className="ph-fill ph-file-pdf text-7xl text-slate-300 group-hover:scale-110 transition-transform duration-500"></i>
                    <div className="absolute top-5 left-5">
                      <span className={`text-[9px] font-black px-3 py-1.5 bg-white rounded-lg border uppercase tracking-widest shadow-sm ${rep.access_tier === 'VIP' ? 'text-amber-600 border-amber-200' : 'text-slate-600 border-slate-200'}`}>
                        {rep.access_tier} {rep.access_tier === 'VIP' && '👑'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-7 flex-1 flex flex-col">
                    <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2">{rep.category}</p>
                    <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors">{rep.title}</h4>
                    <p className="text-sm font-medium text-slate-500 mt-3 line-clamp-2 leading-relaxed">{rep.description}</p>
                    
                    <div className="mt-auto pt-8">
                      <button disabled={!hasAccess} className="w-full h-12 bg-[#002D62] text-white rounded-2xl text-xs font-black hover:bg-blue-900 transition-all flex items-center justify-center gap-2 disabled:bg-slate-100 disabled:text-slate-300">
                        <i className="ph-bold ph-download-simple text-lg"></i> {hasAccess ? 'TẢI BÁO CÁO' : 'BỊ KHÓA'}
                      </button>
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
              <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-10"><i className="ph-fill ph-magnifying-glass text-[250px] translate-x-10 -translate-y-10"></i></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="max-w-2xl">
                    <h3 className="text-2xl font-black mb-3">Yêu cầu Dữ liệu Cá nhân hóa</h3>
                    <p className="text-teal-50 font-medium leading-relaxed">Bạn cần khảo sát thị trường, tìm kiếm đối tác theo tiêu chí riêng? Ban nghiên cứu NKBA sẽ hỗ trợ thu thập dữ liệu chính xác cho doanh nghiệp bạn.</p>
                  </div>
                  <button onClick={() => setShowForm(!showForm)} className="h-14 px-10 bg-white text-teal-700 rounded-2xl font-black shadow-xl hover:scale-105 transition-all shrink-0">
                    {showForm ? 'ĐÓNG FORM' : 'GỬI YÊU CẦU RIÊNG'}
                  </button>
                </div>
              </div>

              {showForm && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm animate-in zoom-in-95">
                  <div className="space-y-6">
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiêu đề yêu cầu</label><input type="text" value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-teal-400" placeholder="VD: Khảo sát đơn giá vật liệu tại Tokyo..." /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nội dung chi tiết</label><textarea value={reqForm.content} onChange={e => setReqForm({...reqForm, content: e.target.value})} className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:bg-white focus:border-teal-400" placeholder="Nêu rõ quy mô, mục đích và thời hạn bạn cần kết quả..." /></div>
                    <div className="flex justify-end"><button onClick={handleSubmitRequest} disabled={isSubmitting} className="h-14 px-10 bg-teal-600 text-white rounded-2xl font-black shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2">{isSubmitting ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG GỬI...</> : 'GỬI YÊU CẦU ĐẾN BAN QUẢN TRỊ'}</button></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRequests.length === 0 ? (
                  <div className="col-span-full p-10 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">Bạn chưa gửi yêu cầu dữ liệu nào.</div>
                ) : (
                  myRequests.map(req => (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm group hover:border-teal-300 transition-all">
                      <div className="flex justify-between items-start mb-5">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${req.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {req.status === 'COMPLETED' ? 'Đã phản hồi' : 'Đang xử lý'}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400">{new Date(req.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight">{req.title}</h4>
                      <p className="text-sm text-slate-500 mb-8">{req.content}</p>
                      
                      {req.status === 'COMPLETED' ? (
                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                          <p className="text-xs text-emerald-800 font-medium leading-relaxed italic mb-4">"{req.admin_note || 'Ban nghiên cứu đã hoàn tất báo cáo cho yêu cầu của bạn.'}"</p>
                          <a href={req.result_file_url || '#'} target="_blank" className="h-10 w-fit px-4 bg-white text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all uppercase flex items-center gap-2 mx-auto"><i className="ph-fill ph-file-arrow-down text-base"></i> Tải file kết quả</a>
                        </div>
                      ) : (
                        <div className="pt-5 border-t border-slate-50 flex items-center gap-2 text-slate-400 italic text-xs font-medium">
                          <i className="ph ph-clock-countdown animate-pulse text-lg"></i> Chờ Ban nghiên cứu phản hồi.
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-[3rem] p-12 md:p-20 text-center flex flex-col items-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border border-amber-100 relative z-10 group-hover:scale-110 transition-transform duration-500">
                <i className="ph-fill ph-lock-key text-5xl text-amber-500"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 relative z-10 mb-4">Tính năng Đặt hàng Dữ liệu bị khóa</h3>
              <p className="text-base text-slate-600 max-w-lg leading-relaxed relative z-10 mb-8">
                Bạn đang sử dụng hạng thẻ <strong className="text-slate-900">{currentUser.tier_code}</strong>. <br/>Vui lòng nâng cấp lên để mở khóa quyền yêu cầu Ban nghiên cứu NKBA thu thập dữ liệu thị trường theo tiêu chí riêng của doanh nghiệp.
              </p>
              <Link href={UPGRADE_URL} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all relative z-10 flex items-center gap-2 inline-block">
                NÂNG CẤP THẺ CAO CẤP <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}