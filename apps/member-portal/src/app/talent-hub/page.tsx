'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function MemberTalentHubPage() {
  const [supabase] = useState(() => createClient());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'talent-pool' | 'my-jobs'>('talent-pool');
  
  const [talents, setTalents] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', requirements: '', salary_range: '' });

  const UPGRADE_URL = "https://nkba.vn/upgrade"; // ĐƯỜNG DẪN ĐẾN TRANG NÂNG CẤP

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
            
          if (features) {
            allowedFeatures = features.map(f => f.feature_code);
          }
        }

        setCurrentUser({ ...profile, tier_code: tierCode, allowedFeatures });
        
        const { data: tals } = await supabase.from('talents').select('*').eq('status', 'VERIFIED').order('created_at', { ascending: false });
        if (tals) setTalents(tals);

        const { data: jobs } = await supabase.from('jobs').select('*').eq('member_id', profile.id).order('created_at', { ascending: false });
        if (jobs) setMyJobs(jobs);
      }
    };
    fetchUserAndData();
  }, [supabase]);

  const handleSubmitJob = async () => {
    if (!jobForm.title || !jobForm.requirements) return alert('Vui lòng nhập Tên vị trí và Yêu cầu!');
    setIsSubmitting(true);
    
    const payload = {
      member_id: currentUser.id,
      title: jobForm.title,
      requirements: jobForm.requirements,
      salary_range: jobForm.salary_range,
      status: 'PENDING'
    };

    const { error } = await supabase.from('jobs').insert([payload]);
    if (error) alert('Lỗi: ' + error.message);
    else {
      alert('✅ Đã gửi Yêu cầu đăng tuyển! Tin sẽ hiển thị sau khi Admin duyệt.');
      setShowForm(false);
      setJobForm({ title: '', requirements: '', salary_range: '' });
      const { data } = await supabase.from('jobs').select('*').eq('member_id', currentUser.id).order('created_at', { ascending: false });
      if (data) setMyJobs(data);
    }
    setIsSubmitting(false);
  };

  if (!currentUser) return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-[#002D62]"></i> Đang kết nối Talent Hub...</div>;

  const canViewTalentContact = currentUser?.allowedFeatures?.includes('VIEW_TALENT_CONTACT');
  const canPostJob = currentUser?.allowedFeatures?.includes('POST_JOB');

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER & TABS */}
      <div className="bg-white p-6 md:px-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <i className="ph-fill ph-users-four text-indigo-600"></i> Talent Hub
            </h1>
            <p className="text-sm font-medium text-slate-500 mt-2 ml-10">Mạng lưới chuyên gia và Trạm săn đầu người nội bộ.</p>
          </div>
          
          <div className="flex gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0 w-full md:w-auto">
            <button onClick={() => setActiveTab('talent-pool')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'talent-pool' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>Hồ Cá Chuyên Gia</button>
            <button onClick={() => setActiveTab('my-jobs')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'my-jobs' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Tin Tuyển Dụng</button>
          </div>
        </div>
      </div>

      {/* TAB 1: TALENT POOL */}
      {activeTab === 'talent-pool' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10"><i className="ph-fill ph-identification-card text-[200px] translate-y-10 translate-x-10"></i></div>
            <div className="relative z-10 max-w-2xl">
              <h3 className="text-xl font-black mb-2">Nhân tài Tinh hoa Việt - Nhật</h3>
              <p className="text-indigo-100 text-sm font-medium leading-relaxed">Tiếp cận danh sách kỹ sư, quản lý dự án và chuyên gia đã được NKBA xác thực năng lực (Verified Profile).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {talents.map(talent => (
              <div key={talent.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group relative flex flex-col">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-black shadow-inner group-hover:scale-110 transition-transform">
                    {talent.full_name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-1.5">{talent.full_name} <i className="ph-fill ph-seal-check text-blue-500"></i></h4>
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{talent.title}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400"><i className="ph-fill ph-briefcase"></i></div>
                    Kinh nghiệm: <span className="text-slate-900 font-bold">{talent.experience_years} năm</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-emerald-500"><i className="ph-fill ph-money"></i></div>
                    Mong muốn: <span className="text-emerald-700 font-bold">{talent.expected_salary || 'Thỏa thuận'}</span>
                  </div>
                </div>

                {canViewTalentContact ? (
                  <div className="pt-6 border-t border-slate-100 space-y-2 mt-auto">
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><i className="ph-bold ph-envelope text-indigo-500"></i> {talent.email}</p>
                    <p className="text-sm font-bold text-slate-700 flex items-center gap-2"><i className="ph-bold ph-phone text-emerald-500"></i> {talent.phone}</p>
                  </div>
                ) : (
                  <div className="pt-6 border-t border-slate-100 mt-auto">
                    <div className="bg-slate-50 p-4 rounded-2xl text-center border border-slate-100">
                      <i className="ph-fill ph-lock-key text-slate-300 text-xl mb-1"></i>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">Nâng cấp thẻ để xem Liên Hệ</p>
                      <Link href={UPGRADE_URL} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-black text-[10px] uppercase hover:bg-amber-600 transition-colors inline-block">Nâng cấp ngay</Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MY JOBS */}
      {activeTab === 'my-jobs' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          {canPostJob ? (
            <>
              <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-900 to-[#002D62] p-8 rounded-3xl shadow-xl text-white">
                <div className="mb-6 md:mb-0">
                  <h3 className="text-xl font-black mb-2">Tìm kiếm Nhân sự Cấp cao</h3>
                  <p className="text-blue-200 text-sm font-medium">Đăng tin tuyển dụng để tiếp cận mạng lưới chuyên gia trong Liên minh.</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="h-14 px-8 bg-white text-[#002D62] rounded-2xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                  <i className={`ph-bold ${showForm ? 'ph-x' : 'ph-plus'}`}></i> {showForm ? 'HỦY' : 'ĐĂNG TIN MỚI'}
                </button>
              </div>

              {showForm && (
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm animate-in zoom-in-95">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Vị trí tuyển dụng</label><input type="text" value={jobForm.title} onChange={e => setJobForm({...jobForm, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-indigo-400" placeholder="VD: Kỹ sư trưởng công trình..." /></div>
                    <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mức lương</label><input type="text" value={jobForm.salary_range} onChange={e => setJobForm({...jobForm, salary_range: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:bg-white focus:border-indigo-400" placeholder="VD: 25 - 40 Triệu" /></div>
                    <div className="col-span-2 space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yêu cầu & Mô tả</label><textarea value={jobForm.requirements} onChange={e => setJobForm({...jobForm, requirements: e.target.value})} className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:bg-white focus:border-indigo-400" placeholder="Mô tả công việc và tiêu chuẩn ứng viên..." /></div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button onClick={handleSubmitJob} disabled={isSubmitting} className="h-14 px-10 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2">
                      {isSubmitting ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-paper-plane-right"></i>} GỬI ADMIN DUYỆT TIN
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myJobs.length === 0 && !showForm ? (
                  <div className="col-span-full py-10 text-center text-slate-400">Bạn chưa đăng tin tuyển dụng nào.</div>
                ) : (
                  myJobs.map(job => (
                    <div key={job.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col hover:border-blue-300 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${job.status === 'PENDING' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{job.status}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(job.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-900 mb-2">{job.title}</h4>
                      <p className="text-sm text-slate-500 line-clamp-2 mb-6">{job.requirements}</p>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                         <div><p className="text-[10px] font-bold text-slate-400 uppercase">Lương</p><p className="text-sm font-black text-emerald-600">{job.salary_range || 'Thỏa thuận'}</p></div>
                         <button className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest">Xem 0 Ứng viên <i className="ph-bold ph-caret-right"></i></button>
                      </div>
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
              
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 relative z-10 mb-4">Tính năng Đăng Tuyển Dụng bị khóa</h3>
              <p className="text-base text-slate-600 max-w-lg leading-relaxed relative z-10 mb-8">
                Bạn đang sử dụng gói hội viên <strong className="text-slate-900">{currentUser.tier_code}</strong>. <br/>Vui lòng nâng cấp hạng thẻ để mở khóa tính năng Đăng tin tuyển dụng và tìm kiếm nhân sự cấp cao.
              </p>
              
              <Link href={UPGRADE_URL} className="px-10 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl font-black shadow-lg hover:shadow-amber-500/30 hover:-translate-y-1 transition-all relative z-10 flex items-center gap-2">
                XEM QUYỀN LỢI THẺ CAO CẤP <i className="ph-bold ph-arrow-right"></i>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}