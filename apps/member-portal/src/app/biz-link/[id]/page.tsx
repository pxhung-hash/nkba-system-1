'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [supabase] = useState(() => createClient());
  const [project, setProject] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null); 
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE CHỈNH SỬA DỰ ÁN ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '', category: 'CONSTRUCTION', custom_category: '', project_type: 'RESIDENTIAL', custom_project_type: '',
    budget_max: '', location: '', description: '', investor_name: '', is_investor_hidden: false,
    requirements: '', contact_name: '', contact_phone: '', contact_email: '', images: [] as string[], status: 'OPEN'
  });

  // --- STATE QUẢN LÝ BÁO GIÁ (CHỦ ĐẦU TƯ) ---
  const [showQuotesModal, setShowQuotesModal] = useState(false);
  const [realQuotes, setRealQuotes] = useState<any[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [totalQuotes, setTotalQuotes] = useState(0);

  // --- STATE NỘP HỒ SƠ (NHÀ THẦU) ---
  const [showSubmitBidModal, setShowSubmitBidModal] = useState(false);
  const [hasSubmittedBid, setHasSubmittedBid] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [bidFormData, setBidFormData] = useState({ price: '', message: '' });

  useEffect(() => {
    const fetchProjectAndUser = async () => {
      if (!id) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        let userProfile = null;

        if (user) {
          const { data: profile } = await supabase
            .from('individuals')
            .select('id, full_name, individual_tiers!individuals_tier_id_fkey(name, code)')
            .eq('user_auth_id', user.id)
            .single();
          setCurrentUser(profile);
          userProfile = profile;
        }

        const { data: projData, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setProject(projData);

        // Lấy thông tin chủ dự án
        if (projData.member_id) {
          const { data: authorData } = await supabase
            .from('individuals')
            .select('full_name, email, phone, corporates(name)')
            .eq('id', projData.member_id)
            .single();
          if (authorData) setAuthor(authorData);
        }

        // Lấy tổng số lượng báo giá đã nộp
        const { count } = await supabase
          .from('project_bids')
          .select('id', { count: 'exact', head: true })
          .eq('project_id', id);
        setTotalQuotes(count || 0);

        // Kiểm tra xem User hiện tại đã nộp báo giá cho dự án này chưa?
        if (userProfile && userProfile.id !== projData.member_id) {
          const { data: existingBid } = await supabase
            .from('project_bids')
            .select('id')
            .eq('project_id', id)
            .eq('bidder_id', userProfile.id)
            .single();
          if (existingBid) setHasSubmittedBid(true);
        }

      } catch (err: any) {
        console.error('Lỗi tải dự án:', err);
        setError('Không tìm thấy thông tin dự án hoặc dự án đã bị xóa.');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectAndUser();
  }, [id, supabase]);

  const formatMoney = (amount: number) => amount ? amount.toLocaleString('vi-VN') + ' VNĐ' : 'Thỏa thuận';
  const isOwner = currentUser?.id === project?.member_id;

  // ==========================================
  // LOGIC NHÀ THẦU: NỘP HỒ SƠ / BÁO GIÁ
  // ==========================================
  const handleBidPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); 
    setBidFormData(prev => ({ ...prev, price: rawValue }));
  };
  const displayBidPrice = bidFormData.price ? new Intl.NumberFormat('vi-VN').format(Number(bidFormData.price)) : '';

  const submitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert('Vui lòng đăng nhập!');
    setIsSubmittingBid(true);

    try {
      const { error } = await supabase.from('project_bids').insert([{
        project_id: project.id,
        bidder_id: currentUser.id,
        proposed_price: bidFormData.price,
        message: bidFormData.message,
        status: 'PENDING' // Chờ xem xét
      }]);

      if (error) {
        if (error.code === '23505') throw new Error('Bạn đã nộp báo giá cho dự án này rồi!');
        throw error;
      }

      alert('✅ Gửi báo giá thành công! Chủ đầu tư sẽ sớm liên hệ với bạn.');
      setShowSubmitBidModal(false);
      setHasSubmittedBid(true); // Khóa nút
      setTotalQuotes(prev => prev + 1);
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsSubmittingBid(false);
    }
  };

  // ==========================================
  // LOGIC CHỦ ĐẦU TƯ: XEM HỒ SƠ ĐÃ NHẬN
  // ==========================================
  const handleOpenQuotesManager = async () => {
    setShowQuotesModal(true);
    setLoadingQuotes(true);
    try {
      // Join bảng project_bids với individuals và corporates để lấy tên nhà thầu
      const { data, error } = await supabase
        .from('project_bids')
        .select(`
          id, proposed_price, message, status, created_at,
          individuals ( full_name, email, phone, corporates ( name ) )
        `)
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setRealQuotes(data);
    } catch (err) {
      console.error("Lỗi lấy danh sách báo giá:", err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  // ==========================================
  // LOGIC CHỦ ĐẦU TƯ: CẬP NHẬT DỰ ÁN
  // ==========================================
  const handleEditBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, ''); 
    setEditFormData(prev => ({ ...prev, budget_max: rawValue }));
  };
  const displayEditBudget = editFormData.budget_max ? new Intl.NumberFormat('vi-VN').format(Number(editFormData.budget_max)) : '';

  // --- HÀM 2: THUẬT TOÁN TỰ ĐỘNG NÉN ẢNH (CANVAS API) ---
  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setEditFormData(prev => ({ ...prev, images: [...prev.images, compressedBase64] }));
        };
      };
    });
  };

  const removeEditImage = (index: number) => {
    setEditFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  // --- HÀM 3: MỞ MODAL VÀ ĐỔ DỮ LIỆU CŨ VÀO FORM ---
  const openEditModal = () => {
    const details = project.details || {};
    const contact = details.contact || {};
    const isStandardCat = ['CONSTRUCTION', 'DESIGN', 'MATERIAL'].includes(project.category);
    const isStandardType = ['RESIDENTIAL', 'APARTMENT', 'OFFICE', 'FACTORY', 'COMMERCIAL'].includes(details.project_type);

    setEditFormData({
      title: project.title || '', category: isStandardCat ? project.category : 'OTHER', custom_category: isStandardCat ? '' : project.category,
      project_type: isStandardType ? details.project_type : 'OTHER', custom_project_type: isStandardType ? '' : (details.project_type || ''),
      budget_max: project.budget_max ? project.budget_max.toString() : '', location: project.location || '', description: project.description || '',
      investor_name: details.investor_name || '', is_investor_hidden: details.is_investor_hidden || false, requirements: details.requirements || '',
      contact_name: contact.name || '', contact_phone: contact.phone || '', contact_email: contact.email || '', images: details.images || [], status: project.status || 'OPEN'
    });
    setIsEditing(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title || !editFormData.budget_max) return alert('Vui lòng nhập Tên dự án và Ngân sách dự kiến!');
    setIsSubmitting(true);
    
    const finalCategory = editFormData.category === 'OTHER' ? editFormData.custom_category : editFormData.category;
    const finalProjectType = editFormData.project_type === 'OTHER' ? editFormData.custom_project_type : editFormData.project_type;

    try {
      const updatedDetails = {
        ...(project.details || {}), project_type: finalProjectType, investor_name: editFormData.investor_name, is_investor_hidden: editFormData.is_investor_hidden,
        requirements: editFormData.requirements, contact: { name: editFormData.contact_name, phone: editFormData.contact_phone, email: editFormData.contact_email }, images: editFormData.images
      };
      const { error: updateError } = await supabase.from('projects').update({
        title: editFormData.title, category: finalCategory, budget_max: parseFloat(editFormData.budget_max), location: editFormData.location,
        description: editFormData.description, details: updatedDetails, status: editFormData.status
      }).eq('id', project.id);
      if (updateError) throw updateError;

      alert('✅ Cập nhật dự án thành công!');
      setProject({ ...project, title: editFormData.title, category: finalCategory, budget_max: parseFloat(editFormData.budget_max), location: editFormData.location, description: editFormData.description, details: updatedDetails, status: editFormData.status });
      setIsEditing(false);
    } catch (err: any) { alert('Lỗi cập nhật: ' + err.message); } finally { setIsSubmitting(false); }
  };

  // ----------------------------------------------------

  if (loading) return <div className="flex h-[70vh] flex-col items-center justify-center text-slate-500 font-bold gap-4"><i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i> <p className="animate-pulse">Đang giải mã hồ sơ dự án...</p></div>;
  if (error || !project) return <div className="flex flex-col h-[70vh] items-center justify-center text-center animate-in fade-in duration-500"><div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6"><i className="ph-fill ph-file-x text-5xl"></i></div><h1 className="text-2xl font-black text-slate-800 mb-2">Hồ sơ không tồn tại</h1><button onClick={() => router.push('/biz-link')} className="mt-8 px-8 py-3.5 bg-[#002D62] text-white rounded-xl font-bold">Quay lại Sàn Giao Dịch</button></div>;

  const getCategoryLabel = (cat: string) => {
    const cats: Record<string, { label: string, color: string, icon: string }> = {
      'CONSTRUCTION': { label: 'Thi Công Xây Lắp', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: 'ph-crane' },
      'DESIGN': { label: 'Thiết Kế / Kiến Trúc', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: 'ph-pen-nib' },
      'MATERIAL': { label: 'Cung Cấp Vật Tư', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: 'ph-truck' }
    };
    return cats[cat] || { label: cat, color: 'text-slate-600 bg-slate-100 border-slate-200', icon: 'ph-tag' };
  };

  const getProjectTypeLabel = (type: string) => {
    const types: Record<string, string> = { 'RESIDENTIAL': 'Nhà ở / Biệt thự', 'APARTMENT': 'Chung cư', 'OFFICE': 'Văn phòng', 'FACTORY': 'Nhà xưởng / KCN', 'COMMERCIAL': 'Thương mại / Showroom' };
    return types[type] || type || 'Chưa phân loại';
  };

  // Hàm render Badge trạng thái
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN': return <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border bg-emerald-500/20 text-emerald-300 border-emerald-500/50">ĐANG MỞ THẦU</span>;
      case 'CLOSED': return <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border bg-rose-500/20 text-rose-300 border-rose-500/50">ĐÃ ĐÓNG THẦU</span>;
      case 'COMPLETED': return <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border bg-blue-500/20 text-blue-300 border-blue-500/50">ĐÃ HOÀN THÀNH</span>;
      case 'CANCELED': return <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border bg-slate-500/40 text-slate-300 border-slate-500/50">ĐÃ HỦY BỎ</span>;
      default: return <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border bg-amber-500/20 text-amber-300 border-amber-500/50">ĐANG CHỜ DUYỆT</span>;
    }
  };

  const catInfo = getCategoryLabel(project.category);
  const details = project.details || {};
  const contact = details.contact || {};

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3 text-sm font-bold text-slate-400 mb-8">
        <Link href="/biz-link" className="hover:text-[#002D62] transition-colors flex items-center gap-2"><i className="ph-bold ph-arrow-left"></i> Sàn B2B</Link>
        <i className="ph-bold ph-caret-right text-slate-300"></i> <span className="text-slate-700 truncate max-w-[200px] md:max-w-md">{project.title}</span>
      </div>

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#002D62] to-blue-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${catInfo.color.replace('bg-', 'bg-white/90 ')}`}><i className={`ph-bold ${catInfo.icon} text-base`}></i> {catInfo.label}</span>
              <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border bg-white/10 text-white border-white/20"><i className="ph-fill ph-buildings mr-1"></i> {getProjectTypeLabel(details.project_type)}</span>
              {getStatusBadge(project.status)}
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{project.title}</h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-blue-200">
              <div className="flex items-center gap-2"><i className="ph-fill ph-map-pin"></i> {project.location || 'Toàn quốc'}</div>
              <div className="flex items-center gap-2"><i className="ph-fill ph-clock"></i> Đăng ngày: {new Date(project.created_at).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shrink-0 w-full md:w-auto text-center md:text-right">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Ngân sách dự kiến</p>
            <p className="text-2xl md:text-3xl font-black text-[#F3E5AB]">{formatMoney(project.budget_max)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: DỮ LIỆU */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hình ảnh dự án (Nếu có) */}
          {details.images && details.images.length > 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4"><i className="ph-fill ph-image text-emerald-600 text-2xl"></i> Hình ảnh / Phối cảnh</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {details.images.map((img: string, idx: number) => (
                  <a href={img} target="_blank" rel="noreferrer" key={idx} className="block overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"><img src={img} alt="Dự án" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" /></a>
                ))}
              </div>
            </div>
          )}

          {/* Chi tiết yêu cầu */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4"><i className="ph-fill ph-article text-[#002D62] text-2xl"></i> Chi tiết yêu cầu (Scope of Work)</h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-loose whitespace-pre-wrap font-medium">{project.description || 'Chưa cung cấp mô tả chi tiết.'}</p>
            </div>
          </div>

          {(details.requirements || '').trim() !== '' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4"><i className="ph-fill ph-medal text-amber-500 text-2xl"></i> Yêu cầu đối với Nhà thầu / Đối tác</h3>
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                <p className="text-slate-700 leading-loose whitespace-pre-wrap font-medium">{details.requirements}</p>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: HÀNH ĐỘNG */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-[#002D62]"></div>
            <h3 className="font-black text-slate-900 mb-2 mt-2">Hạn chót nộp hồ sơ</h3>
            {project.status === 'OPEN' ? (
              <div className="flex items-center gap-3 text-rose-600 font-black text-lg bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6"><i className="ph-fill ph-clock-countdown text-2xl"></i> Đang mở thầu</div>
            ) : (
              <div className="flex items-center gap-3 text-slate-500 font-black text-lg bg-slate-100 p-4 rounded-xl border border-slate-200 mb-6"><i className="ph-fill ph-lock-key text-2xl"></i> Đã đóng thầu / Kết thúc</div>
            )}

            {isOwner ? (
              <div className="space-y-3">
                <button onClick={openEditModal} className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-black hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                  <i className="ph-bold ph-pencil-simple"></i> Chỉnh sửa Dự Án
                </button>
                <button onClick={handleOpenQuotesManager} className="w-full py-4 bg-[#002D62] text-white rounded-xl font-black hover:bg-blue-900 transition-all shadow-md flex items-center justify-center gap-2">
                  <i className="ph-bold ph-folder-open"></i> Quản lý Báo Giá Đã Nhận ({totalQuotes})
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={() => setShowSubmitBidModal(true)}
                  disabled={project.status !== 'OPEN' || hasSubmittedBid} 
                  className={`w-full py-4 text-white rounded-xl font-black transition-all shadow-lg flex items-center justify-center gap-2 ${hasSubmittedBid ? 'bg-emerald-600' : 'bg-[#002D62] hover:bg-blue-900 hover:-translate-y-1'} disabled:opacity-70 disabled:hover:translate-y-0`}
                >
                  <i className={`ph-bold ${hasSubmittedBid ? 'ph-check-circle' : 'ph-paper-plane-right'}`}></i> 
                  {hasSubmittedBid ? 'ĐÃ NỘP HỒ SƠ / BÁO GIÁ' : project.status === 'OPEN' ? 'NỘP HỒ SƠ / BÁO GIÁ' : 'KHÔNG THỂ NỘP HỒ SƠ'}
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><i className="ph-fill ph-buildings text-lg"></i> Đơn vị Mời thầu</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm shrink-0"><i className="ph-fill ph-buildings text-3xl text-slate-300"></i></div>
              <div>
                <h4 className="font-black text-slate-900 text-lg leading-tight line-clamp-2">{details.is_investor_hidden ? 'Doanh nghiệp ẩn danh' : (details.investor_name || author?.corporates?.name || 'Doanh nghiệp cá nhân')}</h4>
                {!details.is_investor_hidden && <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1"><i className="ph-fill ph-user-circle"></i> Đăng bởi: {author?.full_name || 'Admin'}</p>}
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><i className="ph-fill ph-user"></i></div>
                <div className="truncate"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người liên hệ</p><p className="text-sm font-bold text-slate-800 truncate">{contact.name || 'Đã ẩn'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><i className="ph-fill ph-phone-call"></i></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</p><p className="text-sm font-bold text-slate-800">{contact.phone || '*** **** ***'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><i className="ph-fill ph-envelope-simple"></i></div>
                <div className="truncate"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p><p className="text-sm font-bold text-slate-800 truncate">{contact.email || 'Đã ẩn'}</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL 1: CHỈNH SỬA DỰ ÁN (DÀNH CHO OWNER)  */}
      {/* ========================================== */}
      {isEditing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          {/* ... (Giữ nguyên toàn bộ code phần nội dung Modal Chỉnh Sửa ở bản trước, tôi thu gọn lại để tiết kiệm chữ) ... */}
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-pencil-line text-[#002D62]"></i> Chỉnh sửa thông tin Dự án</h3>
              <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center bg-slate-200 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"><i className="ph-bold ph-x"></i></button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto bg-slate-100/50">
              <div className="space-y-8">
                
                {/* SECTION 1: CƠ BẢN */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">1. Trạng thái & Cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2 bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <label className="text-xs font-bold text-[#002D62] uppercase tracking-widest">Tình trạng dự án hiện tại</label>
                      <select value={editFormData.status} onChange={e => setEditFormData({...editFormData, status: e.target.value})} className="w-full h-12 px-4 bg-white border border-blue-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:border-[#002D62] transition-all">
                        <option value="OPEN">Đang mở thầu / Đang tìm kiếm</option><option value="CLOSED">Đã đóng thầu</option><option value="COMPLETED">Đã hoàn thành</option><option value="CANCELED">Đã hủy bỏ</option><option value="PENDING">Chờ duyệt</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Dự án (*)</label><input type="text" required value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lĩnh vực</label><select value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:border-blue-400"><option value="CONSTRUCTION">Thi công</option><option value="DESIGN">Thiết kế</option><option value="MATERIAL">Cung cấp vật tư</option><option value="OTHER">Khác</option></select></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngân sách (VNĐ)</label><input type="text" required value={displayEditBudget} onChange={handleEditBudgetChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400" /></div>
                  </div>
                </div>
                {/* SECTION 2 & 3 */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">2. Yêu cầu chi tiết</h4>
                  <div className="space-y-6">
                    <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Chủ đầu tư / Đơn vị thầu chính</label>
                      <input type="text" value={editFormData.investor_name} onChange={e => setEditFormData({...editFormData, investor_name: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-blue-400 transition-all" />
                      <label className="flex items-center gap-2 cursor-pointer w-fit group mt-2">
                        <input type="checkbox" checked={editFormData.is_investor_hidden} onChange={e => setEditFormData({...editFormData, is_investor_hidden: e.target.checked})} className="w-5 h-5 rounded text-[#002D62] cursor-pointer" />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 select-none">Ẩn tên Chủ đầu tư (Bảo mật thông tin dự án)</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả Yêu cầu chi tiết (Scope of work)</label>
                      <textarea value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none resize-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yêu cầu năng lực Nhà thầu (Requirements)</label>
                      <textarea value={editFormData.requirements} onChange={e => setEditFormData({...editFormData, requirements: e.target.value})} className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none resize-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>
                  </div>
                </div>

                {/* SECTION 3: LIÊN HỆ & ẢNH */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">3. Liên hệ & Hình ảnh đính kèm</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Người liên hệ</label>
                      <input type="text" value={editFormData.contact_name} onChange={e => setEditFormData({...editFormData, contact_name: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số điện thoại</label>
                      <input type="tel" value={editFormData.contact_phone} onChange={e => setEditFormData({...editFormData, contact_phone: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                      <input type="email" value={editFormData.contact_email} onChange={e => setEditFormData({...editFormData, contact_email: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 transition-all" />
                    </div>

                    <div className="col-span-1 md:col-span-3 space-y-3 mt-4">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cập nhật Hình ảnh / Phối cảnh (Tự động nén)</label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-3 pb-3">
                          <i className="ph-bold ph-upload-simple text-2xl text-slate-400 mb-1"></i>
                          <p className="text-sm font-bold text-slate-600">Nhấn để thêm ảnh mới</p>
                        </div>
                        <input type="file" className="hidden" multiple accept="image/*" onChange={handleEditImageUpload} />
                      </label>
                      
                      {editFormData.images.length > 0 && (
                        <div className="flex gap-4 overflow-x-auto py-2">
                          {editFormData.images.map((imgBase64, idx) => (
                            <div key={idx} className="relative shrink-0">
                              <img src={imgBase64} alt={`Preview ${idx}`} className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                              <button type="button" onClick={() => removeEditImage(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform">
                                <i className="ph-bold ph-x text-xs"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
            <div className="flex gap-4 p-6 border-t border-slate-100 bg-white shrink-0">
              <button type="button" onClick={() => setIsEditing(false)} className="flex-1 h-14 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-black">Hủy bỏ</button>
              <button onClick={handleUpdateProject} disabled={isSubmitting} className="flex-1 h-14 bg-[#002D62] text-white rounded-xl font-black">{isSubmitting ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: XEM HỒ SƠ QUAN TÂM (DÀNH CHO OWNER) */}
      {/* ========================================== */}
      {showQuotesModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            
            {/* Header Modal */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-xl font-black text-[#002D62] flex items-center gap-2 mb-1"><i className="ph-fill ph-folder-open"></i> Quản lý Báo giá / Hồ sơ Quan tâm</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">DỰ ÁN: {project.title}</p>
              </div>
              <button onClick={() => setShowQuotesModal(false)} className="w-10 h-10 flex items-center justify-center bg-slate-200 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"><i className="ph-bold ph-x"></i></button>
            </div>
            
            <div className="p-6 md:p-8 overflow-y-auto bg-white">
              {loadingQuotes ? (
                <div className="flex flex-col items-center py-10"><i className="ph-bold ph-spinner animate-spin text-3xl text-[#002D62] mb-3"></i><p className="text-slate-500 font-bold">Đang tải hồ sơ...</p></div>
              ) : realQuotes.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100"><i className="ph-fill ph-empty text-5xl text-slate-300 mb-3"></i><p className="text-slate-500 font-bold">Chưa có nhà thầu nào nộp hồ sơ/báo giá cho dự án này.</p></div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest">
                        <th className="p-4">Nhà thầu / Đối tác</th><th className="p-4">Liên hệ[cite: 11]</th><th className="p-4">Ngày gửi[cite: 11]</th><th className="p-4">Giá đề xuất[cite: 11]</th><th className="p-4 text-center">Trạng thái[cite: 11]</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {realQuotes.map((quote) => (
                        <tr key={quote.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-4">
                            <p className="font-bold text-[#002D62]">{quote.individuals?.corporates?.name || quote.individuals?.full_name}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">"{quote.message}"</p>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <p className="text-sm font-medium text-slate-700"><i className="ph-fill ph-phone-call text-emerald-500 mr-1"></i>{quote.individuals?.phone || 'N/A'}</p>
                            <p className="text-sm font-medium text-slate-700"><i className="ph-fill ph-envelope-simple text-blue-500 mr-1"></i>{quote.individuals?.email}</p>
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-600 whitespace-nowrap">{new Date(quote.created_at).toLocaleDateString('vi-VN')}</td>
                          <td className="p-4 text-sm font-black text-[#D4AF37] whitespace-nowrap">{quote.proposed_price ? `${Number(quote.proposed_price).toLocaleString('vi-VN')} VNĐ` : 'Thỏa thuận'}</td>
                          <td className="p-4 text-center">
                            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border bg-amber-50 text-amber-600 border-amber-200">{quote.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: NỘP HỒ SƠ BÁO GIÁ (DÀNH CHO NHÀ THẦU) */}
      {/* ========================================== */}
      {showSubmitBidModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-[#002D62] flex items-center gap-2"><i className="ph-fill ph-paper-plane-right"></i> Nộp Hồ Sơ / Báo Giá</h3>
              <button onClick={() => setShowSubmitBidModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600"><i className="ph-bold ph-x"></i></button>
            </div>
            <form onSubmit={submitBid} className="p-6 space-y-5">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                <p className="text-sm font-bold text-[#002D62] mb-1">Dự án: {project.title}</p>
                <p className="text-xs text-blue-600">Ngân sách CĐT: {formatMoney(project.budget_max)}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Giá đề xuất của bạn (VNĐ) - Tùy chọn</label>
                <input type="text" value={displayBidPrice} onChange={handleBidPriceChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" placeholder="Để trống nếu muốn Thỏa thuận..." />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lời nhắn / Năng lực tóm tắt (*)</label>
                <textarea required value={bidFormData.message} onChange={e => setBidFormData({...bidFormData, message: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 outline-none resize-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10" placeholder="Kính gửi CĐT, chúng tôi đã có 5 năm kinh nghiệm thi công các dự án tương tự..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowSubmitBidModal(false)} className="flex-1 h-12 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold">Hủy</button>
                <button type="submit" disabled={isSubmittingBid} className="flex-1 h-12 bg-[#002D62] text-white rounded-xl font-bold shadow-md disabled:opacity-50">{isSubmittingBid ? 'ĐANG GỬI...' : 'XÁC NHẬN GỬI'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}