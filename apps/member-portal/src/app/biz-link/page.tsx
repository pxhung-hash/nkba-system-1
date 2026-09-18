'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function MemberBizLinkPage() {
  const [supabase] = useState(() => createClient());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'market' | 'my-projects'>('market');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [marketProjects, setMarketProjects] = useState<any[]>([]);
  
  // --- STATE TÌM KIẾM & LỌC ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const UPGRADE_URL = "/upgrade"; 

  const [formData, setFormData] = useState({
    title: '', category: 'CONSTRUCTION', custom_category: '', project_type: 'RESIDENTIAL', custom_project_type: '',
    budget_max: '', location: '', description: '', investor_name: '', is_investor_hidden: false,
    requirements: '', contact_name: '', contact_phone: '', contact_email: '', images: [] as string[]
  });

  useEffect(() => {
    const fetchUserAndProjects = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('individuals')
        .select('id, full_name, email, phone, individual_tiers!individuals_tier_id_fkey(name, code)')
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
        
        setFormData(prev => ({
          ...prev, contact_name: profile.full_name || '', contact_phone: profile.phone || '', contact_email: profile.email || ''
        }));
        
        const [myProjsRes, marketRes] = await Promise.all([
          supabase.from('projects').select('*').eq('member_id', profile.id).order('created_at', { ascending: false }),
          supabase.from('projects').select('*, individuals(full_name, corporates(name))').eq('status', 'OPEN').order('created_at', { ascending: false })
        ]);

        if (myProjsRes.data) setMyProjects(myProjsRes.data);
        if (marketRes.data) setMarketProjects(marketRes.data);
      }
    };
    fetchUserAndProjects();
  }, [supabase]);

  // --- LOGIC TÌM KIẾM VÀ LỌC ---
  const getFilteredProjects = (projectsList: any[]) => {
    return projectsList.filter(p => {
      const matchSearch = (p.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = filterCategory === 'ALL' ? true : p.category === filterCategory;
      return matchSearch && matchCategory;
    });
  };

  const displayedMarketProjects = getFilteredProjects(marketProjects);
  const displayedMyProjects = getFilteredProjects(myProjects);

  const CATEGORY_FILTERS = [
    { value: 'ALL', label: 'Tất cả' },
    { value: 'CONSTRUCTION', label: 'Thi công' },
    { value: 'DESIGN', label: 'Thiết kế' },
    { value: 'MATERIAL', label: 'Vật tư' },
    { value: 'PARTNERSHIP', label: 'Kết nối TM' }
  ];

  // --- CÁC HÀM XỬ LÝ FORM ---
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); 
    setFormData(prev => ({ ...prev, budget_max: rawValue }));
  };
  const displayBudget = formData.budget_max ? new Intl.NumberFormat('vi-VN').format(Number(formData.budget_max)) : '';
  const formatMoneyCard = (amount: number) => amount ? amount.toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
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
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setFormData(prev => ({ ...prev, images: [...prev.images, compressedBase64] }));
        };
      };
    });
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmitProject = async () => {
    if (!formData.title || !formData.budget_max) return alert('Vui lòng nhập Tên dự án và Ngân sách dự kiến!');
    setIsSubmitting(true);
    
    const finalCategory = formData.category === 'OTHER' ? formData.custom_category : formData.category;
    const finalProjectType = formData.project_type === 'OTHER' ? formData.custom_project_type : formData.project_type;

    const payload = {
      member_id: currentUser.id, title: formData.title, description: formData.description, category: finalCategory, 
      budget_max: parseFloat(formData.budget_max), location: formData.location, status: 'PENDING',
      details: { 
        project_type: finalProjectType, investor_name: formData.investor_name, is_investor_hidden: formData.is_investor_hidden,
        requirements: formData.requirements, contact: { name: formData.contact_name, phone: formData.contact_phone, email: formData.contact_email }, images: formData.images
      }
    };

    const { error } = await supabase.from('projects').insert([payload]);
    if (error) alert('Lỗi đăng bài: ' + error.message);
    else {
      alert('✅ Đăng dự án thành công! Đang chờ Admin Liên minh phê duyệt.');
      setShowForm(false);
      setFormData({
        title: '', category: 'CONSTRUCTION', custom_category: '', project_type: 'RESIDENTIAL', custom_project_type: '',
        budget_max: '', location: '', description: '', investor_name: '', is_investor_hidden: false, requirements: '',
        contact_name: currentUser.full_name || '', contact_phone: currentUser.phone || '', contact_email: currentUser.email || '', images: []
      });
      const { data } = await supabase.from('projects').select('*').eq('member_id', currentUser.id).order('created_at', { ascending: false });
      if (data) setMyProjects(data);
    }
    setIsSubmitting(false);
  };

  if (!currentUser) return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-[#002D62]"></i> Đang nạp hệ thống...</div>;

  const canViewMarketBudget = currentUser?.allowedFeatures?.includes('VIEW_MARKET_BUDGET');
  const canViewMarketContact = currentUser?.allowedFeatures?.includes('VIEW_MARKET_CONTACT');
  const canPostProject = currentUser?.allowedFeatures?.includes('POST_PROJECT');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      
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

      {/* THANH CÔNG CỤ TÌM KIẾM VÀ LỌC THÔNG MINH */}
      <div className="flex flex-col lg:flex-row gap-4 animate-in fade-in duration-500">
        <div className="relative flex-1">
          <i className="ph-bold ph-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm tên dự án, gói thầu, địa điểm..." 
            className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-[#002D62] focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
          {CATEGORY_FILTERS.map(cat => (
            <button 
              key={cat.value}
              onClick={() => setFilterCategory(cat.value)}
              className={`shrink-0 px-6 h-14 rounded-2xl text-sm font-black transition-all border shadow-sm ${
                filterCategory === cat.value 
                  ? 'bg-[#002D62] text-white border-[#002D62]' 
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: MARKET */}
      {activeTab === 'market' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          {(!canViewMarketBudget || !canViewMarketContact) ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-3xl p-10 text-center flex flex-col items-center shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl border border-amber-100 relative z-10 group-hover:scale-110 transition-transform duration-500">
                  <i className="ph-fill ph-crown text-4xl text-amber-500"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 relative z-10 mb-3">Đặc quyền Hội viên Cao cấp</h3>
                <p className="text-sm text-slate-600 leading-relaxed relative z-10 mb-8">
                  Không gian giao thương khép kín. Nâng cấp thẻ để tiếp cận danh sách thầu nội bộ, xem dự toán chi tiết và liên hệ Chủ đầu tư.
                </p>
                <Link href={UPGRADE_URL} className="mt-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all relative z-10 flex items-center gap-2">
                  NÂNG CẤP THẺ NGAY <i className="ph-bold ph-arrow-right"></i>
                </Link>
              </div>

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
          ) : (
             <div className="space-y-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-4">
                  <i className="ph-fill ph-storefront text-[#002D62] text-2xl"></i> Dự án & Cơ hội hợp tác
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedMarketProjects.length === 0 ? (
                    <div className="col-span-full py-20 bg-slate-50 border border-slate-200 rounded-3xl text-center flex flex-col items-center">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm"><i className="ph-fill ph-magnifying-glass-minus text-4xl text-slate-300"></i></div>
                      <p className="text-slate-500 font-bold text-lg">Không tìm thấy dự án nào phù hợp với bộ lọc.</p>
                      <button onClick={() => {setSearchTerm(''); setFilterCategory('ALL')}} className="mt-4 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">Xóa bộ lọc</button>
                    </div>
                  ) : (
                    displayedMarketProjects.map(p => {
                      const details = p.details || {};
                      let authorName = 'Doanh nghiệp cá nhân';
                      if (details.is_investor_hidden) authorName = 'Doanh nghiệp ẩn danh';
                      else if (details.investor_name) authorName = details.investor_name;
                      else if (p.individuals?.corporates?.name) authorName = p.individuals.corporates.name;
                      else if (p.individuals?.full_name) authorName = p.individuals.full_name;

                      return (
                        <Link 
                          href={`/biz-link/${p.id}`} 
                          key={p.id} 
                          className="block bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col hover:border-[#002D62] hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-200">ĐANG MỞ THẦU</span>
                            <span className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#002D62] transition-colors"><i className="ph-bold ph-arrow-up-right"></i></span>
                          </div>
                          <div className="relative z-10 mb-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.category}</p>
                            <h4 className="text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#002D62] transition-colors">{p.title}</h4>
                            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100"><i className="ph-fill ph-map-pin"></i> {p.location || 'Chưa cập nhật'}</div>
                          </div>
                          <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-end relative z-10">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bên Mời thầu</p>
                              <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{authorName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngân sách</p>
                              <p className="text-base font-black text-emerald-600">{formatMoneyCard(p.budget_max)}</p>
                            </div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
             </div>
          )}
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
                  <h3 className="text-xl font-black text-white mb-2">Đăng tải Yêu cầu Báo giá / Mời thầu / Kết nối</h3>
                  <p className="text-blue-200 text-sm font-medium">Bạn đang tìm thầu phụ thi công, nhà cung cấp vật tư hay đối tác phân phối? Hãy đưa lên sàn để mạng lưới NKBA tiếp cận.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className={`relative z-10 shrink-0 h-14 px-8 rounded-2xl text-sm font-black shadow-lg transition-all flex items-center gap-2 ${showForm ? 'bg-slate-800 text-white hover:bg-slate-900 border border-slate-700' : 'bg-white text-[#002D62] hover:bg-blue-50 hover:scale-105'}`}>
                  <i className={`ph-bold ${showForm ? 'ph-x' : 'ph-plus'} text-lg`}></i> {showForm ? 'ĐÓNG FORM' : 'TẠO BÀI ĐĂNG MỚI'}
                </button>
              </div>

              {/* FORM KHAI BÁO DỰ ÁN */}
              {showForm && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm animate-in zoom-in-95 duration-300">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                    <i className="ph-fill ph-pencil-line text-[#002D62]"></i> Khai báo Thông tin Đăng tải
                  </h3>
                  
                  <div className="space-y-8">
                    {/* SECTION 1 */}
                    <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                      <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">1</span> Thông tin cơ bản
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiêu đề Gói thầu / Nhu cầu (*)</label><input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400" placeholder="VD: Tìm thầu phụ thi công... / Tìm đại lý phân phối..." /></div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lĩnh vực</label>
                          <div className="flex flex-col gap-2">
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:border-blue-400">
                              <option value="CONSTRUCTION">Thi công (Construction)</option>
                              <option value="DESIGN">Thiết kế (Design)</option>
                              <option value="MATERIAL">Cung cấp vật tư (Material)</option>
                              <option value="PARTNERSHIP">Kết nối Thương mại (Đại lý, Phân phối...)</option>
                              <option value="OTHER">Khác (Tự nhập...)</option>
                            </select>
                            {formData.category === 'OTHER' && <input type="text" value={formData.custom_category} onChange={e => setFormData({...formData, custom_category: e.target.value})} className="w-full h-12 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-900 outline-none" placeholder="Nhập tên lĩnh vực..." autoFocus />}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loại hình / Dự án</label>
                          <div className="flex flex-col gap-2">
                            <select value={formData.project_type} onChange={e => setFormData({...formData, project_type: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:border-blue-400"><option value="RESIDENTIAL">Nhà ở / Biệt thự</option><option value="APARTMENT">Chung cư</option><option value="OFFICE">Văn phòng (Office)</option><option value="FACTORY">Nhà xưởng / Khu công nghiệp</option><option value="COMMERCIAL">Thương mại / Showroom</option><option value="OTHER">Khác (Tự nhập...)</option></select>
                            {formData.project_type === 'OTHER' && <input type="text" value={formData.custom_project_type} onChange={e => setFormData({...formData, custom_project_type: e.target.value})} className="w-full h-12 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-900 outline-none" placeholder="Nhập loại hình..." autoFocus />}
                          </div>
                        </div>
                        
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngân sách dự kiến / Quy mô (VNĐ)</label><input type="text" value={displayBudget} onChange={handleBudgetChange} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400" placeholder="VD: 5,000,000,000" /></div>
                        <div className="col-span-2 space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Khu vực / Địa điểm</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400" placeholder="VD: Toàn quốc, hoặc KCN VSIP Bắc Ninh" /></div>
                      </div>
                    </div>

                    {/* SECTION 2 */}
                    <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                      <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">2</span> Chi tiết & Pháp lý</h4>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Pháp nhân / Chủ đầu tư</label>
                          <input type="text" value={formData.investor_name} onChange={e => setFormData({...formData, investor_name: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-400" placeholder="VD: Công ty TNHH ABC..." />
                          <label className="flex items-center gap-2 cursor-pointer w-fit group"><input type="checkbox" checked={formData.is_investor_hidden} onChange={e => setFormData({...formData, is_investor_hidden: e.target.checked})} className="w-5 h-5 rounded text-[#002D62] cursor-pointer" /><span className="text-sm font-bold text-slate-600 select-none">Ẩn tên Pháp nhân (Bảo mật thông tin dự án)</span></label>
                        </div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả Nội dung / Yêu cầu chi tiết</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none resize-none focus:border-blue-400" /></div>
                        <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yêu cầu năng lực Đối tác / Nhà thầu</label><textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})} className="w-full h-24 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none resize-none focus:border-blue-400" /></div>
                      </div>
                    </div>

                    {/* SECTION 3 */}
                    <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
                      <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">3</span> Liên hệ & Đính kèm</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Người liên hệ</label><input type="text" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số điện thoại</label><input type="tel" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400" /></div>
                          <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label><input type="email" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-400" /></div>
                        </div>

                        <div className="col-span-2 space-y-3 mt-4">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hình ảnh minh họa / Sản phẩm (Tự động nén)</label>
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-slate-50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6"><i className="ph-bold ph-upload-simple text-3xl text-slate-400 mb-2"></i><p className="text-sm font-bold text-slate-600">Nhấn để chọn ảnh đính kèm</p></div>
                            <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageUpload} />
                          </label>
                          {formData.images.length > 0 && (
                            <div className="flex gap-4 overflow-x-auto py-2">
                              {formData.images.map((imgBase64, idx) => (
                                <div key={idx} className="relative shrink-0">
                                  <img src={imgBase64} alt={`Preview ${idx}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                                  <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110"><i className="ph-bold ph-x text-xs"></i></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
                    <button onClick={handleSubmitProject} disabled={isSubmitting} className="h-14 px-12 bg-[#002D62] text-white rounded-2xl text-sm font-black shadow-lg hover:bg-blue-900 flex items-center gap-2">
                      {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG XỬ LÝ...</> : <><i className="ph-bold ph-paper-plane-right text-lg"></i> ĐƯA LÊN SÀN GIAO DỊCH</>}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2"><i className="ph-fill ph-folder-open"></i> Kho dự án của bạn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedMyProjects.length === 0 ? (
                    <div className="col-span-full py-20 bg-white border border-slate-200 rounded-3xl text-center flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-sm"><i className="ph-fill ph-folder-dashed text-4xl text-slate-300"></i></div>
                      <p className="text-slate-500 font-bold text-lg">Bạn chưa có dự án nào thỏa mãn tìm kiếm.</p>
                    </div>
                  ) : (
                    displayedMyProjects.map(p => (
                      <Link href={`/biz-link/${p.id}`} key={p.id} className="block bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col hover:border-[#002D62] hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer">
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest ${p.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border border-amber-200' : p.status === 'OPEN' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{p.status === 'PENDING' ? 'CHỜ DUYỆT' : p.status}</span>
                          <span className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-[#002D62] transition-colors"><i className="ph-bold ph-arrow-up-right"></i></span>
                        </div>
                        <div className="relative z-10 mb-6">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{p.category}</p>
                          <h4 className="text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#002D62] transition-colors">{p.title}</h4>
                          <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-500 bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-100"><i className="ph-fill ph-map-pin"></i> {p.location || 'Chưa cập nhật'}</div>
                        </div>
                        <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-end relative z-10">
                          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngân sách / Quy mô</p><p className="text-base font-black text-emerald-600">{formatMoneyCard(p.budget_max)}</p></div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-[3rem] p-12 md:p-20 text-center flex flex-col items-center shadow-lg relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-8 shadow-xl border border-amber-100 relative z-10 group-hover:scale-110 transition-transform duration-500">
                <i className="ph-fill ph-lock-key text-5xl text-amber-500"></i>
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 relative z-10 mb-4">Tính năng Tạo Bài Đăng bị khóa</h3>
              <p className="text-base text-slate-600 max-w-lg leading-relaxed relative z-10 mb-8">
                Bạn đang sử dụng hạng thẻ <strong className="text-slate-900">{currentUser.tier_code}</strong>. <br/>Vui lòng nâng cấp để mở khóa quyền đưa dự án, kết nối thương mại lên sàn và nhận báo giá từ mạng lưới đối tác NKBA.
              </p>
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