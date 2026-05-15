'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function MemberBizLinkPage() {
  const [supabase] = useState(() => createClient());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'my-projects'>('my-projects');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', category: 'CONSTRUCTION', budget_max: '', location: '' });
  
  const [myProjects, setMyProjects] = useState<any[]>([]);

  // ĐIỀN ĐƯỜNG DẪN TRANG UPGRADE BÊN PUBLIC-SITE VÀO ĐÂY
  // Ví dụ: Nếu public site của bạn là nkba.vn, điền 'https://nkba.vn/upgrade'
  const UPGRADE_URL = "/upgrade"; 

  useEffect(() => {
    const fetchUserAndProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('individuals')
        .select('id, full_name, individual_tiers!individuals_tier_id_fkey(name, code)')
        .eq('user_auth_id', user.id)
        .single();

      if (profile) {
        const tierCode = Array.isArray(profile.individual_tiers) 
          ? profile.individual_tiers[0]?.code 
          : (profile.individual_tiers as any)?.code;

        // LẤY CHÙM CHÌA KHÓA TÍNH NĂNG TỪ DATABASE
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
        
        const { data: projs } = await supabase
          .from('projects')
          .select('*')
          .eq('member_id', profile.id)
          .order('created_at', { ascending: false });
          
        if (projs) setMyProjects(projs);
      }
    };
    fetchUserAndProjects();
  }, [supabase]);

  const handleSubmitProject = async () => {
    if (!formData.title || !formData.budget_max) return alert('Vui lòng nhập Tên dự án và Ngân sách dự kiến!');
    if (!currentUser) return alert('Lỗi xác thực người dùng!');
    
    setIsSubmitting(true);
    const payload = {
      member_id: currentUser.id, 
      title: formData.title, 
      description: formData.description,
      category: formData.category, 
      budget_max: parseFloat(formData.budget_max), 
      location: formData.location,
      status: 'PENDING'
    };

    const { error } = await supabase.from('projects').insert([payload]);
    if (error) alert('Lỗi đăng bài: ' + error.message);
    else {
      alert('✅ Đăng dự án thành công! Đang chờ Admin Liên minh phê duyệt.');
      setShowForm(false);
      setFormData({ title: '', description: '', category: 'CONSTRUCTION', budget_max: '', location: '' });
      
      const { data } = await supabase.from('projects').select('*').eq('member_id', currentUser.id).order('created_at', { ascending: false });
      if (data) setMyProjects(data);
    }
    setIsSubmitting(false);
  };

  const formatMoney = (amount: number) => amount ? amount.toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận';

  if (!currentUser) return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-[#002D62]"></i> Đang nạp hệ thống...</div>;

  // KIỂM TRA QUYỀN ĐỘNG TỪ DATABASE
  const canViewMarketBudget = currentUser?.allowedFeatures?.includes('VIEW_MARKET_BUDGET');
  const canViewMarketContact = currentUser?.allowedFeatures?.includes('VIEW_MARKET_CONTACT');
  const canPostProject = currentUser?.allowedFeatures?.includes('POST_PROJECT');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER & TABS */}
      <div className="bg-white p-6 md:px-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#002D62]"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <i className="ph-fill ph-handshake text-[#002D62]"></i> Sàn Giao Dịch B2B
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-10">Nơi khởi nguồn của những hợp đồng triệu đô.</p>
          </div>
          
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 w-full md:w-auto">
            <button onClick={() => setActiveTab('market')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'market' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Chợ Dự Án Mở</button>
            <button onClick={() => setActiveTab('my-projects')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'my-projects' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Dự Án Của Tôi</button>
          </div>
        </div>
      </div>

      {/* TAB 1: MARKET */}
      {activeTab === 'market' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* NẾU KHÔNG CÓ QUYỀN VIEW_MARKET_BUDGET HOẶC CONTACT -> ĐÒI TIỀN UPSELL CHỖ NÀY */}
          {(!canViewMarketBudget || !canViewMarketContact) ? (
            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-3xl p-10 text-center flex flex-col items-center shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl border border-amber-100 relative z-10 group-hover:scale-110 transition-transform duration-500">
                <i className="ph-fill ph-crown text-4xl text-amber-500"></i>
              </div>
              <h3 className="text-2xl font-black text-slate-900 relative z-10 mb-3">Đặc quyền Hội viên Cao cấp</h3>
              <p className="text-sm text-slate-600 leading-relaxed relative z-10 mb-8">
                Không gian giao thương khép kín. Nâng cấp thẻ để tiếp cận danh sách thầu nội bộ, xem dự toán chi tiết và liên hệ Chủ đầu tư.
              </p>
              
              {/* NÚT ĐÃ ĐƯỢC CHUYỂN THÀNH LINK */}
              <Link href={UPGRADE_URL} className="mt-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all relative z-10 flex items-center gap-2">
                NÂNG CẤP THẺ NGAY <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>
          ) : (
             // NẾU CÓ QUYỀN THÌ HIỆN DANH SÁCH DỰ ÁN PUBLIC TẠI ĐÂY (PHẦN NÀY SAU NÀY MÓC TỪ DATABASE)
             <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-slate-400 font-bold">
               [Danh sách dự án của hệ thống sẽ hiện ở đây]
             </div>
          )}

          <div className="bg-gradient-to-br from-[#002D62] to-blue-900 rounded-3xl p-10 text-center flex flex-col items-center shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-white/20 relative z-10 group-hover:scale-110 transition-transform duration-500 backdrop-blur-md text-blue-300">
              <i className="ph-fill ph-globe-hemisphere-west text-4xl"></i>
            </div>
            <h3 className="text-2xl font-black text-white relative z-10 mb-3">Chủ động Tìm Đối Tác</h3>
            <p className="text-sm text-blue-200 leading-relaxed relative z-10 mb-8">
              Không cần chờ đợi dự án? Hãy chủ động truy cập Danh bạ Doanh nghiệp NKBA để tìm kiếm nhà cung cấp, thầu phụ phù hợp với bạn.
            </p>
            <Link href="/directory" className="mt-auto px-8 py-3.5 bg-white text-[#002D62] rounded-2xl font-black shadow-lg hover:bg-slate-100 hover:-translate-y-1 transition-all relative z-10 flex items-center gap-2">
              VÀO MẠNG LƯỚI THÀNH VIÊN <i className="ph-bold ph-arrow-right"></i>
            </Link>
          </div>

        </div>
      )}

      {/* TAB 2: MY PROJECTS */}
      {activeTab === 'my-projects' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {canPostProject ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-[#002D62] to-blue-900 border border-blue-800 p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 pointer-events-none"></div>
                <div className="mb-6 md:mb-0 relative z-10 text-center md:text-left">
                  <h3 className="text-xl font-black text-white mb-2">Đăng tải Yêu cầu Báo giá / Mời thầu</h3>
                  <p className="text-blue-200 text-sm font-medium">Bạn đang tìm thầu phụ thi công hay nhà cung cấp vật tư? Hãy đưa dự án lên sàn để mạng lưới đối tác NKBA tiếp cận.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className={`relative z-10 shrink-0 h-14 px-8 rounded-2xl text-sm font-black shadow-lg transition-all flex items-center gap-2 ${showForm ? 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700' : 'bg-white text-[#002D62] hover:bg-blue-50 hover:scale-105'}`}>
                  <i className={`ph-bold ${showForm ? 'ph-x' : 'ph-plus'} text-lg`}></i> {showForm ? 'HỦY ĐĂNG' : 'TẠO DỰ ÁN MỚI'}
                </button>
              </div>

              {showForm && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm animate-in zoom-in-95 duration-300">
                  <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2"><i className="ph-fill ph-pencil-line text-[#002D62]"></i> Khai báo Thông tin Dự án</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <div className="col-span-2 md:col-span-2 space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Dự án (*)</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="VD: Tìm thầu phụ thi công Cơ Điện (MEP)..." /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lĩnh vực</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer focus:border-blue-400 transition-all"><option value="CONSTRUCTION">Thi công (Construction)</option><option value="DESIGN">Thiết kế (Design)</option><option value="MATERIAL">Cung cấp vật tư (Material)</option></select></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngân sách dự kiến (VNĐ)</label><input type="number" value={formData.budget_max} onChange={e => setFormData({...formData, budget_max: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="VD: 5000000000" /></div>
                    <div className="col-span-2 space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa điểm dự án</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="VD: KCN VSIP, Bắc Ninh" /></div>
                    <div className="col-span-2 space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả Yêu cầu chi tiết</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" placeholder="Yêu cầu chi tiết về năng lực, tiêu chuẩn vật tư, tiến độ..." /></div>
                  </div>
                  <div className="mt-8 flex justify-end"><button onClick={handleSubmitProject} disabled={isSubmitting} className="h-14 px-10 bg-[#002D62] text-white rounded-2xl text-sm font-black shadow-lg hover:bg-blue-900 transition-colors disabled:opacity-50 flex items-center gap-2">{isSubmitting ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG XỬ LÝ...</> : <><i className="ph-bold ph-paper-plane-right"></i> ĐƯA LÊN SÀN GIAO DỊCH</>}</button></div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><i className="ph-fill ph-folder-open"></i> Kho dự án của bạn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myProjects.length === 0 ? (
                    <div className="col-span-full py-16 bg-white border border-slate-200 rounded-3xl text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><i className="ph-fill ph-folder-dashed text-3xl text-slate-300"></i></div>
                      <p className="text-slate-500 font-medium">Bạn chưa đăng dự án nào trên hệ thống.</p>
                    </div>
                  ) : (
                    myProjects.map(p => (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col hover:border-blue-300 hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${p.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' : p.status === 'OPEN' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{p.status === 'PENDING' ? 'CHỜ DUYỆT' : p.status}</span>
                          <span className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-[#002D62] transition-colors"><i className="ph-bold ph-arrow-up-right"></i></span>
                        </div>
                        <div className="relative z-10 mb-6">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.category}</p>
                          <h4 className="text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#002D62] transition-colors">{p.title}</h4>
                          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100"><i className="ph-fill ph-map-pin"></i> {p.location || 'Chưa cập nhật'}</div>
                        </div>
                        <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-end relative z-10">
                          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngân sách</p><p className="text-base font-black text-emerald-600">{formatMoney(p.budget_max)}</p></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            
            /* NẾU KHÔNG CÓ QUYỀN ĐĂNG DỰ ÁN -> HIỆN BANNER KHÓA ĐÒI NÂNG CẤP */
            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-[3rem] p-12 md:p-20 text-center flex flex-col items-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border border-amber-100 relative z-10 group-hover:scale-110 transition-transform duration-500">
                <i className="ph-fill ph-lock-key text-5xl text-amber-500"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 relative z-10 mb-4">Tính năng Tạo Dự Án Mới bị khóa</h3>
              <p className="text-base text-slate-600 max-w-lg leading-relaxed relative z-10 mb-8">
                Bạn đang sử dụng hạng thẻ <strong className="text-slate-900">{currentUser.tier_code}</strong>. <br/>Vui lòng nâng cấp để mở khóa quyền đưa dự án lên sàn giao dịch và nhận báo giá từ mạng lưới đối tác NKBA.
              </p>
              
              {/* NÚT ĐÃ ĐƯỢC CHUYỂN THÀNH LINK */}
              <Link href={UPGRADE_URL} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all relative z-10 flex items-center gap-2">
                NÂNG CẤP THẺ NGAY <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>

          )}
        </div>
      )}
    </div>
  );
}