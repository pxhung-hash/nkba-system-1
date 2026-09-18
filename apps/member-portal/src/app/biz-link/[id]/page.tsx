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

  // --- STATE CHO CHỨC NĂNG EDIT ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'CONSTRUCTION',
    budget_max: '',
    location: '',
    description: ''
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

  // --- HÀM XỬ LÝ LƯU CHỈNH SỬA ---
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.title || !editFormData.budget_max) {
      return alert('Vui lòng nhập Tên dự án và Ngân sách dự kiến!');
    }
    
    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          title: editFormData.title,
          category: editFormData.category,
          budget_max: parseFloat(editFormData.budget_max),
          location: editFormData.location,
          description: editFormData.description
        })
        .eq('id', project.id);

      if (updateError) throw updateError;

      alert('✅ Cập nhật dự án thành công!');
      // Cập nhật lại UI ngay lập tức
      setProject({ ...project, ...editFormData });
      setIsEditing(false); // Đóng Modal
    } catch (err: any) {
      alert('Lỗi cập nhật: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm mở Modal và copy data cũ vào Form
  const openEditModal = () => {
    setEditFormData({
      title: project.title || '',
      category: project.category || 'CONSTRUCTION',
      budget_max: project.budget_max ? project.budget_max.toString() : '',
      location: project.location || '',
      description: project.description || ''
    });
    setIsEditing(true);
  };

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

  const catInfo = getCategoryLabel(project.category);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex items-center gap-3 text-sm font-bold text-slate-400 mb-8">
        <Link href="/biz-link" className="hover:text-[#002D62] transition-colors flex items-center gap-2">
          <i className="ph-bold ph-arrow-left"></i> Sàn B2B
        </Link>
        <i className="ph-bold ph-caret-right text-slate-300"></i>
        <span className="text-slate-700 truncate max-w-[200px] md:max-w-md">{project.title}</span>
      </div>

      <div className="bg-gradient-to-r from-[#002D62] to-blue-900 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border flex items-center gap-2 ${catInfo.color.replace('bg-', 'bg-white/90 ')}`}>
                <i className={`ph-bold ${catInfo.icon} text-base`}></i> {catInfo.label}
              </span>
              <span className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${project.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'}`}>
                {project.status === 'PENDING' ? 'ĐANG CHỜ DUYỆT' : 'ĐANG MỞ THẦU'}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">
              {project.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-blue-200">
              <div className="flex items-center gap-2"><i className="ph-fill ph-map-pin"></i> {project.location || 'Toàn quốc'}</div>
              <div className="flex items-center gap-2"><i className="ph-fill ph-clock"></i> Đăng ngày: {new Date(project.created_at).toLocaleDateString('vi-VN')}</div>
              <div className="flex items-center gap-2"><i className="ph-fill ph-eye"></i> 124 lượt xem (Mô phỏng)</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shrink-0 w-full md:w-auto text-center md:text-right">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-widest mb-1">Ngân sách dự kiến</p>
            <p className="text-2xl md:text-3xl font-black text-[#F3E5AB]">{formatMoney(project.budget_max)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <i className="ph-fill ph-article text-[#002D62] text-2xl"></i> Chi tiết yêu cầu (Scope of Work)
            </h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-loose whitespace-pre-wrap font-medium">
                {project.description || 'Chủ đầu tư chưa cung cấp mô tả chi tiết cho hạng mục này.'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <i className="ph-fill ph-medal text-amber-500 text-2xl"></i> Yêu cầu đối với Nhà thầu / Đối tác
            </h3>
            <ul className="space-y-4 text-slate-700 font-medium">
              <li className="flex items-start gap-3">
                <i className="ph-bold ph-check-circle text-emerald-500 text-xl mt-0.5 shrink-0"></i>
                Có giấy phép kinh doanh hợp lệ và kinh nghiệm tối thiểu 3 năm trong lĩnh vực tương đương.
              </li>
              <li className="flex items-start gap-3">
                <i className="ph-bold ph-check-circle text-emerald-500 text-xl mt-0.5 shrink-0"></i>
                Hồ sơ năng lực (Profile) chứng minh đã từng thực hiện ít nhất 2 dự án có quy mô và tính chất tương tự.
              </li>
              <li className="flex items-start gap-3">
                <i className="ph-bold ph-check-circle text-emerald-500 text-xl mt-0.5 shrink-0"></i>
                Tuân thủ nghiêm ngặt các tiêu chuẩn an toàn lao động và chất lượng theo chuẩn Nhật Bản (JIS) (Nếu có).
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <i className="ph-fill ph-paperclip text-blue-500 text-2xl"></i> Tài liệu đính kèm
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <i className="ph-fill ph-file-pdf text-2xl"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 text-sm truncate group-hover:text-[#002D62]">Ban_Ve_Thiet_Ke_So_Bo.pdf</p>
                  <p className="text-xs text-slate-500 mt-0.5">2.4 MB • Đã tải lên</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <i className="ph-fill ph-file-xls text-2xl"></i>
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold text-slate-800 text-sm truncate group-hover:text-[#002D62]">BOQ_Khoi_Luong_Du_Toan.xlsx</p>
                  <p className="text-xs text-slate-500 mt-0.5">1.1 MB • Đã tải lên</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-4 font-medium italic">* Nhấp vào để tải xuống. Vui lòng bảo mật thông tin tài liệu.</p>
          </div>

        </div>

        <div className="space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-[#002D62]"></div>
            
            <h3 className="font-black text-slate-900 mb-2 mt-2">Hạn chót nộp hồ sơ</h3>
            <div className="flex items-center gap-3 text-rose-600 font-black text-lg bg-rose-50 p-4 rounded-xl border border-rose-100 mb-6">
              <i className="ph-fill ph-clock-countdown text-2xl"></i> Còn 14 Ngày (Mô phỏng)
            </div>

            {isOwner ? (
              <div className="space-y-3">
                {/* --- NÚT KÍCH HOẠT HÀM EDIT --- */}
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
            <p className="text-xs text-center text-slate-400 font-medium mt-4">Nền tảng NKBA đảm bảo tính minh bạch và bảo mật thông tin gói thầu.</p>
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
                  {author?.corporates?.name || 'Doanh nghiệp ẩn danh'}
                </h4>
                <p className="text-sm font-bold text-slate-500 mt-1 flex items-center gap-1">
                  <i className="ph-fill ph-user-circle"></i> Đăng bởi: {author?.full_name || 'Admin / Thành viên'}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <i className="ph-fill ph-envelope-simple"></i>
                </div>
                <div className="truncate">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email liên hệ</p>
                  <p className="text-sm font-bold text-slate-800 truncate">{author?.email || 'Đã ẩn (Cần tài khoản VIP)'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <i className="ph-fill ph-phone-call"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Số điện thoại</p>
                  <p className="text-sm font-bold text-slate-800">{author?.phone || '*** **** ***'}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODAL CHỈNH SỬA DỰ ÁN --- */}
      {isEditing && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <i className="ph-fill ph-pencil-line text-[#002D62]"></i> Chỉnh sửa thông tin Dự án
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 flex items-center justify-center bg-slate-200 rounded-full text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"
              >
                <i className="ph-bold ph-x"></i>
              </button>
            </div>

            <form onSubmit={handleUpdateProject} className="p-6 md:p-8 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Dự án (*)</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.title} 
                  onChange={e => setEditFormData({...editFormData, title: e.target.value})} 
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lĩnh vực</label>
                  <select 
                    value={editFormData.category} 
                    onChange={e => setEditFormData({...editFormData, category: e.target.value})} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:bg-white focus:border-blue-400 transition-all"
                  >
                    <option value="CONSTRUCTION">Thi công (Construction)</option>
                    <option value="DESIGN">Thiết kế (Design)</option>
                    <option value="MATERIAL">Cung cấp vật tư (Material)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngân sách dự kiến (VNĐ)</label>
                  <input 
                    type="number" 
                    required
                    value={editFormData.budget_max} 
                    onChange={e => setEditFormData({...editFormData, budget_max: e.target.value})} 
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa điểm dự án</label>
                <input 
                  type="text" 
                  value={editFormData.location} 
                  onChange={e => setEditFormData({...editFormData, location: e.target.value})} 
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mô tả Yêu cầu chi tiết</label>
                <textarea 
                  value={editFormData.description} 
                  onChange={e => setEditFormData({...editFormData, description: e.target.value})} 
                  className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none resize-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-white border border-slate-200 text-slate-700 rounded-xl font-black hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-14 bg-[#002D62] text-white rounded-xl font-black hover:bg-blue-900 transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG LƯU...</> : <><i className="ph-bold ph-floppy-disk"></i> LƯU THAY ĐỔI</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}