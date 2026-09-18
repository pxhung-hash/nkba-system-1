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

  // --- STATE CHO CHỨC NĂNG EDIT (ĐỒNG BỘ VỚI FORM TẠO MỚI) ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'CONSTRUCTION',
    custom_category: '',
    project_type: 'RESIDENTIAL',
    custom_project_type: '',
    budget_max: '',
    location: '',
    description: '',
    investor_name: '',
    is_investor_hidden: false,
    requirements: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    images: [] as string[]
  });

  useEffect(() => {
    const fetchProjectAndUser = async () => {
      if (!id) return;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('individuals')
            .select('id, full_name, individual_tiers!individuals_tier_id_fkey(name, code)')
            .eq('user_auth_id', user.id)
            .single();
          setCurrentUser(profile);
        }

        const { data: projData, error: fetchError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;
        setProject(projData);

        if (projData.member_id) {
          const { data: authorData } = await supabase
            .from('individuals')
            .select('full_name, email, phone, corporates(name)')
            .eq('id', projData.member_id)
            .single();
          if (authorData) setAuthor(authorData);
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

  // --- HÀM 1: XỬ LÝ FORMAT TIỀN TỆ KHI SỬA ---
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
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

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
    
    // Xử lý ngược logic Custom Category / Custom Project Type
    const isStandardCat = ['CONSTRUCTION', 'DESIGN', 'MATERIAL'].includes(project.category);
    const isStandardType = ['RESIDENTIAL', 'APARTMENT', 'OFFICE', 'FACTORY', 'COMMERCIAL'].includes(details.project_type);

    setEditFormData({
      title: project.title || '',
      category: isStandardCat ? project.category : 'OTHER',
      custom_category: isStandardCat ? '' : project.category,
      project_type: isStandardType ? details.project_type : 'OTHER',
      custom_project_type: isStandardType ? '' : (details.project_type || ''),
      budget_max: project.budget_max ? project.budget_max.toString() : '',
      location: project.location || '',
      description: project.description || '',
      investor_name: details.investor_name || '',
      is_investor_hidden: details.is_investor_hidden || false,
      requirements: details.requirements || '',
      contact_name: contact.name || '',
      contact_phone: contact.phone || '',
      contact_email: contact.email || '',
      images: details.images || []
    });
    setIsEditing(true);
  };

  // --- HÀM 4: LƯU CẬP NHẬT LÊN DATABASE ---
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title || !editFormData.budget_max) {
      return alert('Vui lòng nhập Tên dự án và Ngân sách dự kiến!');
    }
    
    setIsSubmitting(true);
    
    const finalCategory = editFormData.category === 'OTHER' ? editFormData.custom_category : editFormData.category;
    const finalProjectType = editFormData.project_type === 'OTHER' ? editFormData.custom_project_type : editFormData.project_type;

    try {
      const updatedDetails = {
        ...(project.details || {}),
        project_type: finalProjectType,
        investor_name: editFormData.investor_name,
        is_investor_hidden: editFormData.is_investor_hidden,
        requirements: editFormData.requirements,
        contact: {
          name: editFormData.contact_name,
          phone: editFormData.contact_phone,
          email: editFormData.contact_email
        },
        images: editFormData.images
      };

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          title: editFormData.title,
          category: finalCategory,
          budget_max: parseFloat(editFormData.budget_max),
          location: editFormData.location,
          description: editFormData.description,
          details: updatedDetails
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      alert('✅ Cập nhật dự án thành công!');
      // Cập nhật lại UI ngay lập tức
      setProject({ 
        ...project, 
        title: editFormData.title,
        category: finalCategory,
        budget_max: parseFloat(editFormData.budget_max),
        location: editFormData.location,
        description: editFormData.description,
        details: updatedDetails
      });
      setIsEditing(false);
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center text-slate-500 font-bold gap-4">
        <i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i> 
        <p className="animate-pulse">Đang giải mã hồ sơ dự án...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
          <i className="ph-fill ph-file-x text-5xl"></i>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">Hồ sơ không tồn tại</h1>
        <p className="text-slate-500 mb-8 max-w-md">{error}</p>
        <button onClick={() => router.push('/biz-link')} className="px-8 py-3.5 bg-[#002D62] text-white rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
          Quay lại Sàn Giao Dịch
        </button>
      </div>
    );
  }

  const getCategoryLabel = (cat: string) => {
    const cats: Record<string, { label: string, color: string, icon: string }> = {
      'CONSTRUCTION': { label: 'Thi Công Xây Lắp', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: 'ph-crane' },
      'DESIGN': { label: 'Thiết Kế / Kiến Trúc', color: 'text-purple-700 bg-purple-50 border-purple-200', icon: 'ph-pen-nib' },
      'MATERIAL': { label: 'Cung Cấp Vật Tư', color: 'text-amber-700 bg-amber-50 border-amber-200', icon: 'ph-truck' }
    };
    return cats[cat] || { label: cat, color: 'text-slate-600 bg-slate-100 border-slate-200', icon: 'ph-tag' };
  };

  const getProjectTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'RESIDENTIAL': 'Nhà ở / Biệt thự', 'APARTMENT': 'Chung cư', 'OFFICE': 'Văn phòng (Office)',
      'FACTORY': 'Nhà xưởng / Khu công nghiệp', 'COMMERCIAL': 'Thương mại / Showroom'
    };
    return types[type] || type || 'Chưa phân loại';
  };

  const catInfo = getCategoryLabel(project.category);
  const details = project.details || {};
  const contact = details.contact || {};

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3 text-sm font-bold text-slate-400 mb-8">
        <Link href="/biz-link" className="hover:text-[#002D62] transition-colors flex items-center gap-2">
          <i className="ph-bold ph-arrow-left"></i> Sàn B2B
        </Link>
        <i className="ph-bold ph-caret-right text-slate-300"></i>
        <span className="text-slate-700 truncate max-w-[200px] md:max-w-md">{project.title}</span>
      </div>

      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-[#002D62] to-blue-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${catInfo.color.replace('bg-', 'bg-white/90 ')}`}>
                <i className={`ph-bold ${catInfo.icon} text-base`}></i> {catInfo.label}
              </span>
              <span className="px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border bg-white/10 text-white border-white/20">
                <i className="ph-fill ph-buildings mr-1"></i> {getProjectTypeLabel(details.project_type)}
              </span>
              <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${project.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'}`}>
                {project.status === 'PENDING' ? 'ĐANG CHỜ DUYỆT' : 'ĐANG MỞ THẦU'}
              </span>
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
        
        {/* --- CỘT TRÁI: HIỂN THỊ DỮ LIỆU --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Hình ảnh dự án (Nếu có) */}
          {details.images && details.images.length > 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <i className="ph-fill ph-image text-emerald-600 text-2xl"></i> Hình ảnh / Phối cảnh
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {details.images.map((img: string, idx: number) => (
                  <a href={img} target="_blank" rel="noreferrer" key={idx} className="block overflow-hidden rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <img src={img} alt="Dự án" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-500" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Chi tiết yêu cầu */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <i className="ph-fill ph-article text-[#002D62] text-2xl"></i> Chi tiết yêu cầu (Scope of Work)
            </h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                {project.description || 'Chưa cung cấp mô tả chi tiết.'}
              </p>
            </div>
          </div>

          {/* Yêu cầu năng lực */}
          {(details.requirements || '').trim() !== '' && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <i className="ph-fill ph-medal text-amber-500 text-2xl"></i> Yêu cầu đối với Nhà thầu / Đối tác
              </h3>
              <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
                <p className="text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                  {details.requirements}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* --- CỘT PHẢI --- */}
        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-[#002D62]"></div>
            
            <h3 className="font-black text-slate-900 mb-2 mt-2">Hạn chót nộp hồ sơ</h3>
            <div className="flex items-center gap-3 text-rose-600 font-black text-lg bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6">
              <i className="ph-fill ph-clock-countdown text-2xl"></i> Đang mở thầu
            </div>

            {isOwner ? (
              <div className="space-y-3">
                <button onClick={openEditModal} className="w-full py-4 bg-slate-100 text-slate-700 rounded-xl font-black hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
                  <i className="ph-bold ph-pencil-simple"></i> Chỉnh sửa Dự Án
                </button>
                <button className="w-full py-4 bg-[#002D62] text-white rounded-xl font-black hover:bg-blue-900 transition-all shadow-md flex items-center justify-center gap-2">
                  <i className="ph-bold ph-folder-open"></i> Quản lý Báo Giá Đã Nhận (0)
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button className="w-full py-4 bg-[#002D62] text-white rounded-xl font-black hover:bg-blue-900 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
                  <i className="ph-bold ph-paper-plane-right"></i> NỘP HỒ SƠ / BÁO GIÁ
                </button>
                <button className="w-full py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-black hover:border-[#002D62] hover:text-[#002D62] transition-colors flex items-center justify-center gap-2">
                  <i className="ph-bold ph-bookmark-simple"></i> Lưu vào Yêu thích
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest">
              <i className="ph-fill ph-buildings text-lg"></i> Đơn vị Mời thầu
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm shrink-0">
                <i className="ph-fill ph-buildings text-3xl text-slate-300"></i>
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-lg leading-tight line-clamp-2">
                  {details.is_investor_hidden ? 'Doanh nghiệp ẩn danh' : (details.investor_name || author?.corporates?.name || 'Doanh nghiệp cá nhân')}
                </h4>
                {!details.is_investor_hidden && (
                  <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1">
                    <i className="ph-fill ph-user-circle"></i> Đăng bởi: {author?.full_name || 'Admin'}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><i className="ph-fill ph-user"></i></div>
                <div className="truncate">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Người liên hệ</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{contact.name || 'Đã ẩn'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><i className="ph-fill ph-phone-call"></i></div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                  <p className="text-sm font-bold text-slate-800">{contact.phone || '*** **** ***'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><i className="ph-fill ph-envelope-simple"></i></div>
                <div className="truncate">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{contact.email || 'Đã ẩn'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODAL CHỈNH SỬA DỰ ÁN (FULL TRƯỜNG DỮ LIỆU) --- */}
      {isEditing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <i className="ph-fill ph-pencil-line text-[#002D62]"></i> Chỉnh sửa thông tin Dự án
              </h3>
              <button onClick={() => setIsEditing(false)} className="w-10 h-10 flex items-center justify-center bg-slate-200 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                <i className="ph-bold ph-x"></i>
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto bg-slate-100/50">
              <div className="space-y-8">
                
                {/* SECTION 1: CƠ BẢN */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">1. Thông tin cơ bản</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Dự án (*)</label>
                      <input type="text" required value={editFormData.title} onChange={e => setEditFormData({...editFormData, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lĩnh vực</label>
                      <div className="flex flex-col gap-2">
                        <select value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:bg-white focus:border-blue-400 transition-all">
                          <option value="CONSTRUCTION">Thi công (Construction)</option>
                          <option value="DESIGN">Thiết kế (Design)</option>
                          <option value="MATERIAL">Cung cấp vật tư (Material)</option>
                          <option value="OTHER">Khác (Tự nhập...)</option>
                        </select>
                        {editFormData.category === 'OTHER' && (
                          <input type="text" value={editFormData.custom_category} onChange={e => setEditFormData({...editFormData, custom_category: e.target.value})} className="w-full h-12 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-900 placeholder-blue-300 outline-none focus:border-blue-400" placeholder="Nhập tên lĩnh vực..." autoFocus />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loại công trình</label>
                      <div className="flex flex-col gap-2">
                        <select value={editFormData.project_type} onChange={e => setEditFormData({...editFormData, project_type: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:bg-white focus:border-blue-400 transition-all">
                          <option value="RESIDENTIAL">Nhà ở / Biệt thự</option>
                          <option value="APARTMENT">Chung cư</option>
                          <option value="OFFICE">Văn phòng (Office)</option>
                          <option value="FACTORY">Nhà xưởng / Khu công nghiệp</option>
                          <option value="COMMERCIAL">Thương mại / Showroom</option>
                          <option value="OTHER">Khác (Tự nhập...)</option>
                        </select>
                        {editFormData.project_type === 'OTHER' && (
                          <input type="text" value={editFormData.custom_project_type} onChange={e => setEditFormData({...editFormData, custom_project_type: e.target.value})} className="w-full h-12 px-4 bg-blue-50 border border-blue-200 rounded-xl text-sm font-bold text-blue-900 placeholder-blue-300 outline-none focus:border-blue-400" placeholder="Nhập loại công trình..." autoFocus />
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngân sách dự kiến (VNĐ)</label>
                      <input type="text" required value={displayEditBudget} onChange={handleEditBudgetChange} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa điểm dự án</label>
                      <input type="text" value={editFormData.location} onChange={e => setEditFormData({...editFormData, location: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CHI TIẾT */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">2. Chi tiết & Chủ đầu tư</h4>
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
              <button type="button" onClick={() => setIsEditing(false)} disabled={isSubmitting} className="flex-1 h-14 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-black hover:bg-slate-200 transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleUpdateProject} disabled={isSubmitting} className="flex-1 h-14 bg-[#002D62] text-white rounded-xl font-black hover:bg-blue-900 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50">
                {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG LƯU...</> : <><i className="ph-bold ph-floppy-disk"></i> LƯU THAY ĐỔI</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}