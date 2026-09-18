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

  // STATE XEM CHI TIẾT BÁO CÁO
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const UPGRADE_URL = "/upgrade"; // ĐƯỜNG DẪN NÂNG CẤP

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
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                <i className="ph-fill ph-folder-open text-4xl"></i>
              </div>
              <p className="text-slate-500 font-bold text-lg">Chưa có báo cáo nào được phát hành.</p>
              <p className="text-slate-400 text-sm mt-1">Ban nghiên cứu NKBA đang tổng hợp dữ liệu, vui lòng quay lại sau.</p>
            </div>
          ) : (
            reports.map(rep => {
              const hasAccess = canAccess(rep.access_tier, currentUser.tier_code);
              return (
                <div key={rep.id} className="bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden hover:shadow-xl hover:border-teal-300 transition-all group relative">
                  
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-4 border border-white/30 backdrop-blur-xl"><i className="ph-fill ph-lock-key text-2xl"></i></div>
                      <h4 className="font-black text-lg mb-1">Dành cho {rep.access_tier}</h4>
                      <p className="text-[10px] font-bold text-teal-200 uppercase tracking-widest mb-6">Nâng cấp để mở khóa</p>
                      <Link href={UPGRADE_URL} className="px-5 py-2.5 bg-amber-500 text-[#002D62] rounded-xl font-black text-xs uppercase hover:bg-amber-400 hover:scale-105 transition-all inline-block shadow-lg">Nâng cấp thẻ</Link>
                    </div>
                  )}

                  <div className={`h-48 bg-slate-100 flex items-center justify-center relative overflow-hidden ${!hasAccess ? 'opacity-50 grayscale' : ''}`}>
                    {rep.cover_image ? (
                      <img src={rep.cover_image} alt={rep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                        <i className="ph-fill ph-file-pdf text-7xl text-teal-600/20"></i>
                      </div>
                    )}
                    
                    <div className="absolute top-4 left-4">
                      <span className={`text-[9px] font-black px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg border uppercase tracking-widest shadow-sm ${rep.access_tier === 'VIP' ? 'text-amber-600 border-amber-200' : 'text-slate-600 border-slate-200'}`}>
                        {rep.access_tier} {rep.access_tier === 'VIP' && '👑'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[9px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded border border-teal-100">{rep.category}</p>
                      <p className="text-[10px] font-bold text-slate-400">{new Date(rep.created_at).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-teal-700 transition-colors mb-2" title={rep.title}>{rep.title}</h4>
                    <p className="text-xs font-medium text-slate-500 line-clamp-3 leading-relaxed mb-6">{rep.description}</p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setSelectedReport(rep)}
                        disabled={!hasAccess} 
                        className="w-full h-12 bg-white border-2 border-slate-100 text-[#002D62] rounded-xl text-xs font-black hover:border-teal-500 hover:text-teal-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-100"
                      >
                        <i className="ph-bold ph-eye text-lg"></i> {hasAccess ? 'XEM CHI TIẾT' : 'BỊ KHÓA'}
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
              <div className="bg-gradient-to-r from-teal-600 to-emerald-700 p-8 md:p-12 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><i className="ph-fill ph-magnifying-glass text-[250px] translate-x-10 -translate-y-10"></i></div>
                <div className="relative z-10 max-w-2xl text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-black mb-3">Yêu cầu Dữ liệu Cá nhân hóa</h3>
                  <p className="text-teal-50 font-medium leading-relaxed">Bạn cần khảo sát thị trường, tìm kiếm đối tác theo tiêu chí riêng? Ban nghiên cứu NKBA sẽ hỗ trợ thu thập dữ liệu chính xác cho doanh nghiệp bạn.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="relative z-10 h-14 px-8 bg-white text-teal-700 rounded-2xl text-sm font-black shadow-lg hover:scale-105 transition-transform shrink-0 flex items-center gap-2">
                  <i className={`ph-bold ${showForm ? 'ph-x' : 'ph-paper-plane-right'} text-lg`}></i> {showForm ? 'ĐÓNG FORM' : 'GỬI YÊU CẦU RIÊNG'}
                </button>
              </div>

              {showForm && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm animate-in zoom-in-95">
                  <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><i className="ph-fill ph-pencil-line text-teal-600"></i> Viết yêu cầu thu thập dữ liệu</h4>
                  <div className="space-y-6">
                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiêu đề yêu cầu (*)</label><input type="text" value={reqForm.title} onChange={e => setReqForm({...reqForm, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-teal-400 transition-colors" placeholder="VD: Khảo sát đơn giá vật liệu xây dựng tại Tokyo Quý 3/2026..." /></div>
                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nội dung chi tiết (*)</label><textarea value={reqForm.content} onChange={e => setReqForm({...reqForm, content: e.target.value})} className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:bg-white focus:border-teal-400 transition-colors" placeholder="Nêu rõ quy mô, mục đích, thị trường mục tiêu và thời hạn bạn cần kết quả..." /></div>
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button onClick={handleSubmitRequest} disabled={isSubmitting} className="h-14 px-10 bg-teal-600 text-white rounded-2xl text-sm font-black shadow-lg hover:bg-teal-700 transition-all disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG GỬI...</> : <><i className="ph-bold ph-paper-plane-right text-lg"></i> GỬI YÊU CẦU ĐẾN BAN NGHIÊN CỨU</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRequests.length === 0 ? (
                  <div className="col-span-full p-16 text-center flex flex-col items-center bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><i className="ph-fill ph-tray text-3xl text-slate-300"></i></div>
                    <p className="text-slate-500 font-bold">Bạn chưa gửi yêu cầu dữ liệu nào.</p>
                  </div>
                ) : (
                  myRequests.map(req => (
                    <div key={req.id} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm group hover:border-teal-300 hover:shadow-md transition-all flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                          {req.status === 'COMPLETED' ? 'ĐÃ PHẢN HỒI' : 'ĐANG XỬ LÝ'}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400"><i className="ph-bold ph-clock"></i> {new Date(req.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2 leading-tight">{req.title}</h4>
                      <p className="text-sm text-slate-600 mb-6 flex-1 line-clamp-3 bg-slate-50 p-4 rounded-xl border border-slate-100">{req.content}</p>
                      
                      {req.status === 'COMPLETED' ? (
                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 mt-auto">
                          <p className="text-xs text-emerald-800 font-bold leading-relaxed mb-4 border-l-2 border-emerald-400 pl-3">"{req.admin_note || 'Ban nghiên cứu đã hoàn tất báo cáo cho yêu cầu của bạn.'}"</p>
                          <a href={req.result_file_url || '#'} target="_blank" className="h-12 w-full bg-white text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black hover:bg-emerald-600 hover:text-white transition-all uppercase flex items-center justify-center gap-2 shadow-sm"><i className="ph-bold ph-download-simple text-lg"></i> Tải file Kết quả (PDF/Excel)</a>
                        </div>
                      ) : (
                        <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-amber-600 italic text-xs font-bold mt-auto bg-amber-50 p-3 rounded-xl border border-amber-100">
                          <i className="ph-bold ph-clock-countdown animate-pulse text-lg"></i> Chuyên viên đang thu thập dữ liệu...
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

      {/* ==================================================== */}
      {/* MODAL CHI TIẾT BÁO CÁO (REPORT DETAILS DRAWER/MODAL) */}
      {/* ==================================================== */}
      {selectedReport && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            
            {/* Modal Header & Cover */}
            <div className="relative h-64 md:h-80 shrink-0 bg-slate-100 group">
              {selectedReport.cover_image ? (
                <img src={selectedReport.cover_image} alt={selectedReport.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-700 to-[#002D62] flex items-center justify-center">
                  <i className="ph-duotone ph-chart-polar text-[100px] text-white/20"></i>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
              
              <button 
                onClick={() => setSelectedReport(null)} 
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 z-10"
              >
                <i className="ph-bold ph-x text-xl"></i>
              </button>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-black px-3 py-1.5 bg-teal-500/20 border border-teal-400/30 text-teal-300 rounded-lg uppercase tracking-widest backdrop-blur-md">
                    {selectedReport.category}
                  </span>
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <i className="ph-bold ph-calendar-blank"></i> {new Date(selectedReport.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-lg">{selectedReport.title}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-10 overflow-y-auto bg-slate-50/50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Cột Nội dung chính */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <i className="ph-fill ph-text-align-left text-teal-500"></i> Executive Summary
                    </h3>
                    <p className="text-sm font-medium text-slate-600 leading-loose whitespace-pre-wrap">
                      {selectedReport.description}
                    </p>
                  </div>
                  
                  {/* Có thể thêm vùng hiển thị mục lục hoặc tác giả ở đây nếu DB hỗ trợ */}
                  <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-2xl">
                    <h4 className="text-xs font-black text-[#002D62] uppercase tracking-widest mb-2"><i className="ph-bold ph-info"></i> Về báo cáo này</h4>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                      Tài liệu được nghiên cứu và tổng hợp độc quyền bởi Ban Nghiên cứu Thị trường NKBA. Bản quyền thuộc về Liên minh Kinh doanh Việt - Nhật. Vui lòng không sao chép hoặc phân phối ra ngoài hệ thống khi chưa có sự cho phép.
                    </p>
                  </div>
                </div>

                {/* Cột Hành động (Sidebar) */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấp độ truy cập</p>
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl mt-1 mb-6">
                      <i className={`ph-fill ${selectedReport.access_tier === 'VIP' ? 'ph-crown text-amber-500' : 'ph-shield-check text-slate-500'} text-lg`}></i>
                      <p className={`text-sm font-black ${selectedReport.access_tier === 'VIP' ? 'text-amber-700' : 'text-slate-700'}`}>{selectedReport.access_tier}</p>
                    </div>

                    <a 
                      href={selectedReport.file_url || '#'} 
                      target={selectedReport.file_url ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`w-full h-14 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${selectedReport.file_url ? 'bg-[#002D62] text-white hover:bg-blue-900 hover:-translate-y-1' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                      onClick={(e) => {
                        if (!selectedReport.file_url) {
                          e.preventDefault();
                          alert('Báo cáo này chưa được đính kèm file PDF. Vui lòng liên hệ Admin.');
                        }
                      }}
                    >
                      <i className="ph-bold ph-download-simple text-xl"></i> {selectedReport.file_url ? 'TẢI FILE BÁO CÁO (PDF)' : 'CHƯA CÓ FILE'}
                    </a>
                    
                    <p className="text-[10px] font-bold text-slate-400 mt-4"><i className="ph-fill ph-lock-key"></i> Lưu trữ bảo mật nội bộ</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}