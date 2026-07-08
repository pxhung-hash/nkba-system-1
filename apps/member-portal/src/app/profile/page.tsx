'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function MemberProfilePage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTalentProfile, setMyTalentProfile] = useState<any>(null);
  const [isOrphan, setIsOrphan] = useState(false); 
  
  const [isSaving, setIsSaving] = useState(false);
  const [isOptIn, setIsOptIn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [form, setForm] = useState({
    full_name: '', title: '', phone: '', email: '', 
    skills: '', experience_years: 0, expected_salary: '', bio: '',
    linkedin_url: '', avatar_url: '', 
    experiences: [] as { company: string, role: string, period: string, description: string }[],
    education: [] as { school: string, degree: '', year: string }[],
    certificates: [] as { name: '', organization: '', year: '' }[],
    languages: [] as { language: '', proficiency: '' }[]
  });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) return;

      const { data: profile, error: profileError } = await supabase
        .from('individuals')
        .select(`id, full_name, email, phone, individual_tiers!individuals_tier_id_fkey(name, code)`) 
        .eq('user_auth_id', user.id)
        .maybeSingle();

      if (profileError) console.error("LỖI SUPABASE:", profileError);

      if (profile) {
        setCurrentUser({ ...profile, corporates: { name: 'Thành viên Độc lập' }, is_admin: false });

        const { data: talent } = await supabase.from('talents').select('*').eq('individual_id', profile.id).maybeSingle();
        if (talent) {
          setMyTalentProfile(talent);
          // ĐÃ SỬA: Chỉ bật sáng trạng thái hoạt động nếu status khác 'HIDDEN'
          setIsOptIn(talent.status !== 'HIDDEN');
          setForm({
            full_name: talent.full_name || '', title: talent.title || '', phone: talent.phone || '', email: talent.email || '',
            skills: talent.skills || '', experience_years: talent.experience_years || 0, 
            expected_salary: talent.expected_salary || '', bio: talent.bio || '',
            linkedin_url: talent.linkedin_url || '', avatar_url: talent.avatar_url || '',
            experiences: talent.experiences || [], education: talent.education || [], certificates: talent.certificates || [], languages: talent.languages || []
          });
        } else {
          setForm(prev => ({ 
            ...prev, full_name: profile.full_name || '', email: profile.email || '', phone: profile.phone || '',
            experiences: [{ company: '', role: '', period: '', description: '' }], education: [{ school: '', degree: '', year: '' }], certificates: [{ name: '', organization: '', year: '' }], languages: [{ language: '', proficiency: '' }]
          }));
        }
      } else {
        const { data: empData } = await supabase.from('employees').select('name, email').eq('email', user.email).maybeSingle();
        if (empData) {
          setCurrentUser({
            id: user.id, full_name: empData.name, email: user.email,
            corporates: { name: 'Ban Điều Hành NKBA', tax_code: 'N/A' },
            individual_tiers: { name: 'Super Admin' }, is_admin: true
          });
        } else {
          setIsOrphan(true); 
        }
      }
    };
    fetchData();
  }, [supabase]);

  // --- ĐÃ BỔ SUNG: XỬ LÝ ĐỒNG BỘ CÔNG TẮC ẨN DANH XUỐNG DATABASE ---
  const handleToggleOptIn = async () => {
    if (currentUser?.is_admin) return;
    
    const nextOptInState = !isOptIn;
    
    // Nếu chưa từng xuất bản hồ sơ lần nào, chỉ chuyển đổi trạng thái cục bộ
    if (!myTalentProfile) {
      setIsOptIn(nextOptInState);
      return;
    }

    setIsSaving(true);
    const targetStatus = nextOptInState ? 'PENDING' : 'HIDDEN';

    const { error } = await supabase
      .from('talents')
      .update({ status: targetStatus })
      .eq('id', myTalentProfile.id);

    if (error) {
      alert('Lỗi đồng bộ trạng thái: ' + error.message);
    } else {
      setIsOptIn(nextOptInState);
      setMyTalentProfile({ ...myTalentProfile, status: targetStatus });
      alert(nextOptInState ? '✅ Đã bật tìm kiếm cơ hội! Hồ sơ đã được gửi tới Ban thẩm định.' : '🔒 Đã chuyển sang Chế độ ẩn danh thành công.');
    }
    setIsSaving(false);
  };

  // --- XỬ LÝ UPLOAD ẢNH ---
  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`; 

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setForm({ ...form, avatar_url: publicUrl }); 
    } catch (error: any) {
      alert("Lỗi upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- HÀM MỞ GIAO DIỆN IN PDF ---
  const handleExportPDF = () => {
    window.print();
  };

  // HÀM XỬ LÝ MẢNG ĐỘNG (GIỮ NGUYÊN VẸN 100%)
  const addExperience = () => setForm({ ...form, experiences: [...form.experiences, { company: '', role: '', period: '', description: '' }] });
  const removeExperience = (index: number) => { const newExp = [...form.experiences]; newExp.splice(index, 1); setForm({ ...form, experiences: newExp }); };
  const updateExperience = (index: number, field: string, value: string) => { const newExp = [...form.experiences]; (newExp[index] as any)[field] = value; setForm({ ...form, experiences: newExp }); };
  const addEducation = () => setForm({ ...form, education: [...form.education, { school: '', degree: '', year: '' }] });
  const removeEducation = (index: number) => { const newEdu = [...form.education]; newEdu.splice(index, 1); setForm({ ...form, education: newEdu }); };
  const updateEducation = (index: number, field: string, value: string) => { const newEdu = [...form.education]; (newEdu[index] as any)[field] = value; setForm({ ...form, education: newEdu }); };
  const addCertificate = () => setForm({ ...form, certificates: [...form.certificates, { name: '', organization: '', year: '' }] });
  const removeCertificate = (index: number) => { const newCert = [...form.certificates]; newCert.splice(index, 1); setForm({ ...form, certificates: newCert }); };
  const updateCertificate = (index: number, field: string, value: string) => { const newCert = [...form.certificates]; (newCert[index] as any)[field] = value; setForm({ ...form, certificates: newCert }); };
  const addLanguage = () => setForm({ ...form, languages: [...form.languages, { language: '', proficiency: '' }] });
  const removeLanguage = (index: number) => { const newLang = [...form.languages]; newLang.splice(index, 1); setForm({ ...form, languages: newLang }); };
  const updateLanguage = (index: number, field: string, value: string) => { const newLang = [...form.languages]; (newLang[index] as any)[field] = value; setForm({ ...form, languages: newLang }); };

  const handleSaveProfile = async () => {
    if (currentUser?.is_admin) return alert('Tài khoản Quản trị viên (Admin) không thể tạo hồ sơ trên sàn Talent Hub!');
    if (!form.full_name || !form.title) return alert('Tên và Chức danh là bắt buộc!');
    
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setIsSaving(false), alert('Lỗi xác thực: Vui lòng đăng nhập lại!');

    const { data: profileCheck, error: checkError } = await supabase.from('individuals').select('id').eq('user_auth_id', user.id).maybeSingle();
    
    if (checkError) console.error("Lỗi check ID trước khi lưu:", checkError);

    if (!profileCheck) {
      setIsSaving(false);
      return alert('⚠️ LỖI BẢO MẬT: Tài khoản của bạn không được liên kết đúng cách trong cơ sở dữ liệu. Không thể lưu hồ sơ.');
    }

    const payload = {
      individual_id: profileCheck.id, 
      full_name: form.full_name, title: form.title, phone: form.phone, email: form.email,
      skills: form.skills, experience_years: form.experience_years, expected_salary: form.expected_salary, bio: form.bio,
      linkedin_url: form.linkedin_url, avatar_url: form.avatar_url, 
      experiences: form.experiences, education: form.education, certificates: form.certificates, languages: form.languages, 
      status: 'PENDING' 
    };

    if (myTalentProfile) {
      const { error } = await supabase.from('talents').update(payload).eq('id', myTalentProfile.id);
      if (error) alert('Lỗi cập nhật: ' + error.message);
      else {
        alert('✅ Cập nhật hồ sơ thành công!');
        setMyTalentProfile({ ...myTalentProfile, ...payload });
        setIsOptIn(true);
      }
    } else {
      const { error, data } = await supabase.from('talents').insert([payload]).select().single();
      if (error) alert('Lỗi tạo hồ sơ: ' + error.message);
      else { 
        alert('✅ Đã đẩy hồ sơ lên Talent-Hub!'); 
        setMyTalentProfile(data); 
        setIsOptIn(true);
      }
    }
    setIsSaving(false);
  };

  if (isOrphan) return (
    <div className="flex h-[80vh] items-center justify-center p-6">
      <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center max-w-lg shadow-sm">
        <i className="ph-fill ph-warning-circle text-5xl text-rose-500 mb-4"></i>
        <h3 className="text-xl font-black text-rose-900 mb-2">Lỗi Dữ Liệu Tài Khoản</h3>
        <p className="text-rose-700 font-medium">Tài khoản này có trong hệ thống nhưng chưa được gán <b>user_auth_id</b> vào bảng Hội viên. Vui lòng nhờ Admin cập nhật Database!</p>
      </div>
    </div>
  );

  if (!currentUser) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i>
        <p className="text-slate-400 font-bold tracking-widest uppercase text-sm">Đang tải hồ sơ...</p>
      </div>
    </div>
  );

  return (
    // ĐÃ THÊM: print:m-0 print:space-y-0 để hủy bỏ margin-top tự động khi in
    <div className="space-y-8 animate-in fade-in p-6 md:p-10 max-w-7xl mx-auto pb-24 print:p-0 print:m-0 print:space-y-0">
      
      {/* HEADER KHÔNG HIỂN THỊ KHI IN PDF */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between md:items-end gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hồ sơ Của Tôi</h1>
          <p className="text-sm font-medium text-slate-500 mt-2">Quản lý định danh cá nhân và xây dựng thương hiệu chuyên gia trong hệ sinh thái.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <button onClick={handleExportPDF} className="h-10 px-5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors flex items-center gap-2">
            <i className="ph-bold ph-file-pdf text-lg"></i> XUẤT CV (PDF)
          </button>

          <label className="flex items-center gap-4 bg-white p-3 pr-5 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-colors">
            <div className="relative">
              <input type="checkbox" className="sr-only" checked={isOptIn} onChange={handleToggleOptIn} />
              <div className={`block w-14 h-8 rounded-full transition-colors ${isOptIn ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform shadow-md ${isOptIn ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div>
              <div className={`text-sm font-black uppercase tracking-widest ${isOptIn ? 'text-indigo-600' : 'text-slate-500'}`}>
                {isOptIn ? 'ĐANG BẬT TÌM KIẾM CƠ HỘI' : 'CHẾ ĐỘ ẨN DANH'}
              </div>
              <div className="text-[10px] font-bold text-slate-400">Trạng thái Talent Hub</div>
            </div>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* CỘT TRÁI: THẺ TÓM TẮT (Ẩn khi in PDF) */}
        <div className="lg:col-span-1 space-y-6 relative print:hidden">
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm sticky top-28 overflow-hidden">
            {currentUser.is_admin && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>}
            
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100 relative z-10">
              
              {/* KHU VỰC AVATAR CÓ NÚT UPLOAD */}
              <div className="relative mb-4 group cursor-pointer">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center text-3xl font-black shadow-xl border-4 border-white text-white overflow-hidden ${currentUser.is_admin ? 'bg-rose-600' : 'bg-[#002D62]'}`}>
                  {form.avatar_url ? (
                    <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    currentUser.full_name?.charAt(0) || 'N'
                  )}
                </div>
                {/* Nút Upload */}
                <label className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white cursor-pointer shadow-lg hover:scale-110 transition-transform">
                  {isUploading ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-fill ph-camera text-sm"></i>}
                  <input type="file" className="sr-only" onChange={handleUploadAvatar} accept="image/*" disabled={isUploading} />
                </label>
              </div>

              <h3 className="text-xl font-black text-slate-900">{currentUser.full_name}</h3>
              <p className="text-sm font-bold text-slate-500 mt-1">{form.title || 'Chưa cập nhật chức danh'}</p>
              
              <div className={`mt-3 text-[10px] font-black uppercase px-3 py-1.5 rounded-full tracking-widest border ${currentUser.is_admin ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                {Array.isArray(currentUser.individual_tiers) 
                  ? currentUser.individual_tiers[0]?.name 
                  : currentUser.individual_tiers?.name || 'HỘI VIÊN TIÊU CHUẨN'}
              </div>
            </div>
            
            <div className="pt-6 space-y-4 relative z-10">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><i className="ph-fill ph-buildings"></i> Tổ chức / Pháp nhân</p>
                <p className="text-sm font-black text-slate-800">{currentUser.corporates?.name || 'Thành viên Độc lập'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM CHỈNH SỬA (Ẩn khi in PDF) */}
        <div className="lg:col-span-3 print:hidden">
          {!isOptIn ? (
            <div className="bg-white border border-slate-200 rounded-[2rem] py-20 px-8 text-center flex flex-col items-center shadow-sm">
              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 border-4 border-slate-100 shadow-inner">
                <i className="ph-fill ph-detective text-6xl text-slate-300"></i>
              </div>
              <h4 className="text-2xl font-black text-slate-800">Bạn đang ở Chế độ Ẩn danh</h4>
              <p className="text-slate-500 font-medium mt-3 max-w-lg leading-relaxed text-lg">Hồ sơ cá nhân của bạn hiện không hiển thị trên sàn Talent Hub. Bật công tắc phía trên để bắt đầu xây dựng thương hiệu chuyên gia và thu hút cơ hội mới.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-bottom-8">
              
              {/* TRẠNG THÁI KIỂM DUYỆT */}
              {myTalentProfile && (
                <div className={`p-5 rounded-2xl border flex items-start gap-4 ${myTalentProfile.status === 'VERIFIED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : myTalentProfile.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${myTalentProfile.status === 'VERIFIED' ? 'bg-emerald-200' : myTalentProfile.status === 'REJECTED' ? 'bg-rose-200' : 'bg-amber-200'}`}>
                    <i className={`ph-fill text-xl ${myTalentProfile.status === 'VERIFIED' ? 'ph-check-circle text-emerald-700' : myTalentProfile.status === 'REJECTED' ? 'ph-warning-circle text-rose-700' : 'ph-clock-countdown text-amber-700'}`}></i>
                  </div>
                  <div className="mt-0.5">
                    <p className="text-base font-black tracking-wide uppercase">
                      Trạng thái: {myTalentProfile.status === 'VERIFIED' ? 'Đã duyệt (Verified Expert)' : myTalentProfile.status === 'PENDING' ? 'Đang chờ thẩm định' : myTalentProfile.status === 'HIDDEN' ? 'Đang tạm ẩn hồ sơ' : 'Cần bổ sung thông tin'}
                    </p>
                    <p className="text-sm font-medium mt-1 opacity-90 leading-relaxed">
                      {myTalentProfile.status === 'VERIFIED' 
                        ? 'Hồ sơ của bạn đã đạt chuẩn và đang hiển thị công khai trên hệ thống Talent Hub.' 
                        : myTalentProfile.status === 'REJECTED' 
                        ? 'Hồ sơ bị từ chối. Vui lòng cập nhật rõ ràng hơn lịch sử làm việc để Admin xét duyệt lại.' 
                        : myTalentProfile.status === 'HIDDEN'
                        ? 'Hồ sơ chuyên gia của bạn đã được rút xuống. Gạt công tắc bật lại để gửi yêu cầu phê duyệt hiển thị lên sàn.'
                        : 'Ban thẩm định NKBA đang kiểm tra tính xác thực hồ sơ năng lực của bạn.'}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION 1: TỔNG QUAN */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                  <i className="ph-fill ph-identification-card text-[#002D62]"></i> Thông tin cơ bản
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên (*)</label><input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chức danh / Định vị chuyên môn (*)</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="VD: Giám đốc Dự án" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email liên hệ</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 transition-all" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Số điện thoại</label><input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 outline-none focus:bg-white focus:border-indigo-400 transition-all" /></div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Link LinkedIn cá nhân (Nếu có)</label><input type="url" value={form.linkedin_url} onChange={e => setForm({...form, linkedin_url: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-blue-600 outline-none focus:bg-white focus:border-indigo-400 transition-all" placeholder="https://linkedin.com/in/..." /></div>
                </div>
              </div>

              {/* SECTION 2: BIO & SKILLS */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                  <i className="ph-fill ph-user-focus text-[#002D62]"></i> Năng lực cốt lõi
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổng số năm kinh nghiệm</label><input type="number" value={form.experience_years} onChange={e => setForm({...form, experience_years: parseInt(e.target.value) || 0})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 transition-all" /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mức lương / Ngân sách dự kiến</label><input type="text" value={form.expected_salary} onChange={e => setForm({...form, expected_salary: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-400 transition-all" placeholder="VD: Thỏa thuận" /></div>
                  </div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kỹ năng chuyên môn (Cách nhau dấu phẩy)</label><input type="text" value={form.skills} onChange={e => setForm({...form, skills: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-indigo-700 outline-none focus:bg-white focus:border-indigo-400 transition-all" placeholder="VD: Quản lý chi phí, Đấu thầu quốc tế..." /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giới thiệu bản thân (Summary)</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none resize-none focus:bg-white focus:border-indigo-400 transition-all" placeholder="Viết một đoạn ngắn giới thiệu bản thân..." /></div>
                </div>
              </div>

              {/* SECTION 3: KINH NGHIỆM LÀM VIỆC */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <i className="ph-fill ph-briefcase-metal text-[#002D62]"></i> Kinh nghiệm làm việc
                  </h3>
                  <button onClick={addExperience} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <i className="ph-bold ph-plus"></i> Thêm nơi làm việc
                  </button>
                </div>
                
                <div className="space-y-8">
                  {form.experiences.map((exp, index) => (
                    <div key={index} className="relative bg-slate-50 p-6 rounded-2xl border border-slate-200 group">
                      {index > 0 && (
                        <button onClick={() => removeExperience(index)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                          <i className="ph-bold ph-trash"></i>
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pr-10">
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Công ty / Dự án</label><input type="text" value={exp.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: Tập đoàn ABC" /></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chức vụ</label><input type="text" value={exp.role} onChange={(e) => updateExperience(index, 'role', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: Kỹ sư trưởng" /></div>
                        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian (VD: 01/2020 - Hiện tại)</label><input type="text" value={exp.period} onChange={(e) => updateExperience(index, 'period', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" /></div>
                        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mô tả công việc & Thành tựu</label><textarea value={exp.description} onChange={(e) => updateExperience(index, 'description', e.target.value)} className="w-full h-24 p-4 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none resize-none focus:border-indigo-400" placeholder="Liệt kê kết quả đạt được..." /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: HỌC VẤN */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <i className="ph-fill ph-graduation-cap text-[#002D62]"></i> Học vấn & Bằng cấp
                  </h3>
                  <button onClick={addEducation} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <i className="ph-bold ph-plus"></i> Thêm trường
                  </button>
                </div>
                
                <div className="space-y-6">
                  {form.education.map((edu, index) => (
                    <div key={index} className="relative bg-slate-50 p-6 rounded-2xl border border-slate-200">
                       {index > 0 && (
                        <button onClick={() => removeEducation(index)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                          <i className="ph-bold ph-trash"></i>
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
                        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trường / Đơn vị cấp bằng</label><input type="text" value={edu.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: Đại học Kiến trúc" /></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Năm tốt nghiệp</label><input type="text" value={edu.year} onChange={(e) => updateEducation(index, 'year', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: 2018" /></div>
                        <div className="space-y-1.5 md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên bằng / Ngành học</label><input type="text" value={edu.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: Kỹ sư Xây dựng" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: CHỨNG CHỈ */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <i className="ph-fill ph-certificate text-[#002D62]"></i> Chứng chỉ & Giải thưởng
                  </h3>
                  <button onClick={addCertificate} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <i className="ph-bold ph-plus"></i> Thêm chứng chỉ
                  </button>
                </div>
                
                <div className="space-y-6">
                  {form.certificates.map((cert, index) => (
                    <div key={index} className="relative bg-slate-50 p-6 rounded-2xl border border-slate-200">
                       {index > 0 && (
                        <button onClick={() => removeCertificate(index)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                          <i className="ph-bold ph-trash"></i>
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pr-10">
                        <div className="space-y-1.5 md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Chứng chỉ / Giải thưởng</label><input type="text" value={cert.name} onChange={(e) => updateCertificate(index, 'name', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: Chứng chỉ PMP" /></div>
                        <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tổ chức cấp</label><input type="text" value={cert.organization} onChange={(e) => updateCertificate(index, 'organization', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" /></div>
                        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Năm cấp</label><input type="text" value={cert.year} onChange={(e) => updateCertificate(index, 'year', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 6: NGOẠI NGỮ */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <i className="ph-fill ph-translate text-[#002D62]"></i> Ngoại ngữ
                  </h3>
                  <button onClick={addLanguage} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                    <i className="ph-bold ph-plus"></i> Thêm ngoại ngữ
                  </button>
                </div>
                
                <div className="space-y-4">
                  {form.languages.map((lang, index) => (
                    <div key={index} className="relative bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex-1 w-full space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngôn ngữ</label>
                        <input type="text" value={lang.language} onChange={(e) => updateLanguage(index, 'language', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: Tiếng Anh..." />
                      </div>
                      <div className="flex-1 w-full space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Trình độ</label>
                        <select value={lang.proficiency} onChange={(e) => updateLanguage(index, 'proficiency', e.target.value)} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400 cursor-pointer">
                          <option value="Cơ bản">Cơ bản (Sơ cấp)</option>
                          <option value="Giao tiếp">Giao tiếp (Trung cấp)</option>
                          <option value="Thành thạo">Thành thạo (Cao cấp / N1, IELTS)</option>
                          <option value="Bản ngữ">Bản ngữ</option>
                        </select>
                      </div>
                      {index > 0 && (
                        <button onClick={() => removeLanguage(index)} className="w-11 h-11 shrink-0 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors shadow-sm">
                          <i className="ph-bold ph-trash"></i>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* THANH LƯU CỐ ĐỊNH Ở DƯỚI */}
              <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 p-4 px-6 md:px-10 z-50 flex justify-end">
                <div className="max-w-7xl w-full mx-auto flex justify-end">
                  <button onClick={handleSaveProfile} disabled={isSaving} className="w-full h-14 px-10 bg-indigo-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center gap-2">
                    {isSaving ? <><i className="ph-bold ph-spinner animate-spin text-xl"></i> ĐANG LƯU HỒ SƠ...</> : <><i className="ph-bold ph-floppy-disk text-xl"></i> XUẤT BẢN HỒ SƠ CHUYÊN GIA</>}
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* KHU VỰC ẨN: GIAO DIỆN CV PREMIUM MỚI (CHỈ HIỆN KHI BẤM NÚT IN) */}
        {/* ========================================================================= */}
        {/* ĐÃ SỬA: Thêm !mt-0 vào div tổng */}
        <div className="hidden print:flex absolute top-0 left-0 !mt-0 w-full min-h-[297mm] bg-white z-[9999] text-slate-800" id="cv-print">
          
          {/* CỘT TRÁI (NỀN ĐẬM NKBA) - CHIẾM 1/3 */}
          <div className="w-[32%]  bg-[#002D62] text-white px-6 pt-6 pb-10 flex flex-col min-h-full  shrink-0">
            
            {/* AVATAR */}
            {/* ĐÃ SỬA: Sửa mt-4 thành mt-0 và giảm mb */}
            <div className="flex justify-center mb-8 mt-0">
              <div className="w-36 h-36 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl font-black text-white/50">{form.full_name?.charAt(0) || 'N'}</span>
                )}
              </div>
            </div>

            {/* THÔNG TIN LIÊN HỆ */}
            <div className="mb-8 space-y-3 text-sm font-medium text-blue-100">
              <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-4 tracking-widest">Liên hệ</h3>
              {form.phone && <div className="flex items-center gap-3"><i className="ph-fill ph-phone text-blue-300 text-lg shrink-0"></i> <span>{form.phone}</span></div>}
              {form.email && <div className="flex items-center gap-3"><i className="ph-fill ph-envelope-simple text-blue-300 text-lg shrink-0"></i> <span className="break-all line-clamp-2">{form.email}</span></div>}
              {form.linkedin_url && <div className="flex items-start gap-3"><i className="ph-fill ph-linkedin-logo text-blue-300 text-lg shrink-0 mt-0.5"></i> <span className="break-all text-xs leading-relaxed">{form.linkedin_url.replace('https://www.', '').replace('https://', '')}</span></div>}
            </div>

            {/* HỌC VẤN */}
            {form.education.length > 0 && (
              <div className="mb-10">
                <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-5">Học vấn</h3>
                <div className="space-y-6">
                  {form.education.map((edu, idx) => (
                    <div key={idx} className="relative pl-4 border-l-2 border-blue-400/30">
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-400"></div>
                      <p className="font-bold text-white leading-tight text-sm">{edu.degree}</p>
                      <p className="text-xs text-blue-200 mt-1 font-medium">{edu.school}</p>
                      <p className="text-[10px] text-blue-300/70 mt-0.5">{edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* KỸ NĂNG */}
            {form.skills && (
              <div className="mb-10">
                <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-5">Kỹ năng</h3>
                <div className="flex flex-wrap gap-2">
                  {form.skills.split(',').map((skill, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-bold border border-white/10">{skill.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {/* NGOẠI NGỮ */}
            {form.languages.length > 0 && (
              <div>
                <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-5">Ngoại ngữ</h3>
                <div className="space-y-3">
                  {form.languages.map((lang, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="font-bold text-white">{lang.language}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded text-blue-200">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (NỀN SÁNG) - CHIẾM 2/3 */}
          {/* ĐÃ SỬA: Đổi p-12 thành px-10 pt-6 pb-12 */}
          <div className="w-2/3 bg-white px-10 pt-6 pb-12 flex flex-col">
            
            {/* HEADER TÊN & CHỨC DANH */}
            {/* ĐÃ SỬA: Bỏ mt-4 thành mt-0 và giảm font-size xuống text-3xl */}
            <div className="mb-10 mt-0">
              <h1 className="text-3xl font-black text-[#002D62] uppercase tracking-tight mb-2 leading-none">{form.full_name || 'TÊN CỦA BẠN'}</h1>
              <h2 className="text-lg font-bold text-slate-500 tracking-wide uppercase">{form.title || 'Chức Danh Chuyên Môn'}</h2>
            </div>

            {/* TÓM LƯỢC (BIO) */}
            {form.bio && (
              <div className="mb-8">
                <h3 className="text-lg font-black text-[#002D62] uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-4 flex items-center gap-2">
                  <i className="ph-fill ph-user-circle"></i> Hồ sơ chuyên gia
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed text-justify font-medium">{form.bio}</p>
              </div>
            )}

            {/* KINH NGHIỆM LÀM VIỆC */}
            {form.experiences.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-black text-[#002D62] uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-6 flex items-center gap-2">
                  <i className="ph-fill ph-briefcase-metal"></i> Kinh nghiệm làm việc
                </h3>
                <div className="space-y-8">
                  {form.experiences.map((exp, idx) => (
                    <div key={idx} className="relative pl-6 border-l-2 border-slate-200">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#002D62]"></div>
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-base font-black text-slate-900">{exp.role}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#002D62] bg-blue-50 px-3 py-1 rounded-full shrink-0 ml-4">{exp.period}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-600 mb-3">{exp.company}</p>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CHỨNG CHỈ */}
            {form.certificates.length > 0 && (
              <div>
                <h3 className="text-lg font-black text-[#002D62] uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-6 flex items-center gap-2">
                  <i className="ph-fill ph-certificate"></i> Chứng chỉ & Giải thưởng
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  {form.certificates.map((cert, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{cert.name}</h4>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{cert.organization}</p>
                      <p className="text-[10px] font-black text-[#002D62] mt-2">{cert.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* KHAI BÁO CSS CHUẨN CHO BẢN IN PDF A4 */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0 !important;
            size: A4 portrait;
          }
          html, body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff;
          }
          body * {
            visibility: hidden;
          }
          #cv-print, #cv-print * {
            visibility: visible;
          }
          #cv-print {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100%;
            min-height: 100vh;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

    </div>
  );
}