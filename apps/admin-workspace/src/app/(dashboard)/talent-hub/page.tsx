'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function TalentHubPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab mặc định đổi thành 'pending' để rà soát hồ sơ mới đổ về
  const [activeTab, setActiveTab] = useState<'vault' | 'pending' | 'matching'>('pending');
  
  const [talents, setTalents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [individuals, setIndividuals] = useState<any[]>([]);
  
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewingTalent, setViewingTalent] = useState<any>(null);

  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean, talentId: string | null}>({isOpen: false, talentId: null});
  const [feedbackNote, setFeedbackNote] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const [talentsRes, jobsRes, indRes] = await Promise.all([
      supabase.from('talents').select('*').order('created_at', { ascending: false }),
      supabase.from('jobs').select('*').order('created_at', { ascending: false }),
      supabase.from('individuals').select('id, full_name, corporates(name)')
    ]);
    
    if (talentsRes.data) setTalents(talentsRes.data);
    if (jobsRes.data) setJobs(jobsRes.data);
    if (indRes.data) setIndividuals(indRes.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [supabase]);

  // PHÂN LOẠI HỒ SƠ CHUYÊN GIA THEO TRẠNG THÁI
  const verifiedTalents = talents.filter(t => t.status === 'VERIFIED');
  const pendingTalents = talents.filter(t => ['PENDING', 'REJECTED'].includes(t.status) || !t.status);

  const handleVerifyTalent = async (id: string) => {
    setIsProcessing(id);
    const { error } = await supabase.from('talents').update({ status: 'VERIFIED', admin_note: null }).eq('id', id);
    if (error) alert('Lỗi: ' + error.message);
    else { 
      fetchData(); 
      if (viewingTalent?.id === id) setViewingTalent({ ...viewingTalent, status: 'VERIFIED', admin_note: null }); 
    }
    setIsProcessing(null);
  };

  const handleRejectTalent = async (id: string) => {
    if(!confirm('Bạn có chắc chắn muốn TỪ CHỐI hồ sơ này?')) return;
    setIsProcessing(id);
    const { error } = await supabase.from('talents').update({ status: 'REJECTED' }).eq('id', id);
    if (error) alert('Lỗi: ' + error.message);
    else { 
      fetchData(); 
      if (viewingTalent?.id === id) setViewingTalent({ ...viewingTalent, status: 'REJECTED' }); 
    }
    setIsProcessing(null);
  };

  const openFeedbackModal = (id: string) => {
    setFeedbackNote('');
    setFeedbackModal({ isOpen: true, talentId: id });
  };

  const submitFeedback = async () => {
    if (!feedbackNote.trim()) return alert('Vui lòng nhập nội dung yêu cầu!');
    const targetId = feedbackModal.talentId;
    if (!targetId) return;
    
    setIsProcessing(targetId);
    
    // Cập nhật trạng thái thành PENDING và lưu admin_note
    const { error: updateErr } = await supabase.from('talents').update({ status: 'PENDING', admin_note: feedbackNote }).eq('id', targetId);
    
    if (updateErr) {
      alert('Lỗi cập nhật CV: ' + updateErr.message);
    } else {
      const talentToUpdate = talents.find(t => t.id === targetId);
      
      // Bắn thông báo cho user
      if (talentToUpdate?.individual_id) {
        const { error: notifErr } = await supabase.from('notifications').insert([{
          member_id: talentToUpdate.individual_id,
          title: 'Yêu cầu cập nhật Hồ sơ Chuyên gia',
          content: `Admin NKBA đã yêu cầu bạn bổ sung thông tin: "${feedbackNote}"`,
          link_url: '/profile'
        }]);
        
        // Log lỗi nếu bảng notifications có cấu trúc bắt buộc khác
        if (notifErr) console.error("Lỗi khi bắn Notification:", notifErr.message);
      }

      alert('✅ Đã gửi yêu cầu bổ sung thông tin tới Hội viên!');
      
      // Fetch lại dữ liệu mới nhất
      fetchData();
      
      // ĐÃ SỬA: Đóng Feedback Modal VÀ Đóng luôn Modal Chi tiết để quay ra ngoài danh sách
      setFeedbackModal({ isOpen: false, talentId: null });
      setViewingTalent(null); 
    }
    setIsProcessing(null);
  };

  const handleRevokeTalent = async (id: string) => {
    if(!confirm('Thu hồi Tick Xanh sẽ khiến chuyên gia bị gỡ khỏi "Hồ cá". Bạn chắc chứ?')) return;
    setIsProcessing(id);
    const { error } = await supabase.from('talents').update({ status: 'PENDING' }).eq('id', id);
    if (error) alert('Lỗi: ' + error.message);
    else {
      fetchData();
      if (viewingTalent?.id === id) setViewingTalent({ ...viewingTalent, status: 'PENDING' });
    }
    setIsProcessing(null);
  };

  const handleRecommend = async (talentId: string) => {
    if (!selectedJob) return alert('Vui lòng chọn một Job bên trái trước!');
    setIsProcessing(talentId);
    const { error } = await supabase.from('talent_applications').insert([{ job_id: selectedJob.id, talent_id: talentId, status: 'RECOMMENDED', notes: 'Tiến cử bởi Admin NKBA' }]);
    if (error) {
      if (error.code === '23505') alert('Chuyên gia này đã được tiến cử vào job này rồi!');
      else alert('Lỗi: ' + error.message);
    } else alert('✅ Đã gửi tiến cử thành công!');
    setIsProcessing(null);
  };

  const getCompanyName = (id: string) => {
    const ind = individuals.find(m => m.id === id);
    return ind?.corporates?.name || ind?.full_name || 'Công ty ẩn danh';
  };

  if (isLoading) return <div className="p-20 text-center text-sm font-semibold text-slate-400 animate-pulse tracking-widest uppercase">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 relative h-[calc(100vh-100px)] flex flex-col">
      
      {/* MENU ĐIỀU HƯỚNG TABS */}
      <div className="shrink-0 bg-white p-6 md:px-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner"><i className="ph-fill ph-detective text-3xl"></i></div>
            <div>
              <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mb-1">MẠNG LƯỚI CHUYÊN GIA</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Talent Hub (Headhunt)</h2>
            </div>
         </div>
         <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            <button onClick={() => setActiveTab('pending')} className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === 'pending' ? 'bg-white text-amber-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-bold ph-clock-countdown mr-1"></i> Chờ Thẩm Định ({pendingTalents.length})
              {pendingTalents.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
            </button>
            <button onClick={() => setActiveTab('vault')} className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'vault' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-bold ph-users-three mr-1"></i> Kho Chuyên Gia ({verifiedTalents.length})
            </button>
            <button onClick={() => setActiveTab('matching')} className={`shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'matching' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-bold ph-arrows-merge mr-1"></i> Trạm Khớp Nối
            </button>
         </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col relative">
        
        {/* MODAL BÚT PHÊ / FEEDBACK */}
        {feedbackModal.isOpen && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="p-6 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                <i className="ph-fill ph-warning-circle text-2xl text-amber-500"></i>
                <h3 className="text-lg font-black text-amber-900">Yêu cầu bổ sung Hồ sơ</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm font-medium text-slate-600">Lời nhắn này sẽ được gửi dưới dạng Thông báo (Notification) đến tài khoản của hội viên.</p>
                <textarea 
                  value={feedbackNote} 
                  onChange={e => setFeedbackNote(e.target.value)}
                  placeholder="VD: Vui lòng cập nhật thêm các dự án lớn bạn đã từng quản lý vào phần Bio..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all"
                  autoFocus
                />
              </div>
              <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <button onClick={() => setFeedbackModal({isOpen: false, talentId: null})} className="h-10 px-5 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors">HỦY</button>
                <button onClick={submitFeedback} disabled={!!isProcessing} className="h-10 px-6 bg-amber-500 text-[#002D62] font-black text-sm rounded-xl shadow-md hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2">
                  <i className="ph-bold ph-paper-plane-right"></i> GỬI YÊU CẦU
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* TAB 1 & TAB 2: HIỂN THỊ DANH SÁCH CV TRONG KHO HOẶC CHỜ DUYỆT */}
        {(activeTab === 'vault' || activeTab === 'pending') && (
          <div className="flex-1 overflow-y-auto scroll-smooth pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(activeTab === 'vault' ? verifiedTalents : pendingTalents).map(talent => (
                <div key={talent.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group flex flex-col">
                  {talent.status === 'VERIFIED' && <div className="absolute top-0 right-0 p-6 pointer-events-none"><div className="bg-emerald-500 text-white rounded-full p-1.5 shadow-md"><i className="ph-bold ph-check"></i></div></div>}
                  {talent.status === 'REJECTED' && <div className="absolute top-0 right-0 p-6 pointer-events-none"><div className="bg-rose-500 text-white rounded-full p-1.5 shadow-md"><i className="ph-bold ph-warning"></i></div></div>}
                  
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl font-black shadow-inner border border-slate-200 shrink-0">
                      {talent.avatar_url ? <img src={talent.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : talent.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1">{talent.full_name}</h3>
                      <p className="text-sm font-bold text-indigo-600 line-clamp-1">{talent.title}</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><i className="ph-fill ph-briefcase text-slate-400 text-lg"></i> {talent.experience_years} năm kinh nghiệm</div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600"><i className="ph-fill ph-money text-emerald-500 text-lg"></i> Mong muốn: <span className="font-bold text-slate-800">{talent.expected_salary || 'Thỏa thuận'}</span></div>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                    <button onClick={() => setViewingTalent(talent)} className={`flex-1 h-11 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${talent.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
                      <i className="ph-bold ph-eye text-lg"></i> {talent.status === 'PENDING' ? 'XEM & DUYỆT NGAY' : 'XEM CHI TIẾT'}
                    </button>
                  </div>
                </div>
              ))}
              {(activeTab === 'vault' ? verifiedTalents : pendingTalents).length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-[2rem] bg-white">
                  Không tìm thấy dữ liệu chuyên gia phù hợp trong mục này.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL POPUP XEM CHI TIẾT & PHÊ DUYỆT CV */}
        {viewingTalent && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-3xl max-h-full rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95">
              
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2"><i className="ph-fill ph-identification-card text-indigo-500 text-2xl"></i> Chi tiết Hồ sơ Chuyên gia</h3>
                <button onClick={() => setViewingTalent(null)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50"><i className="ph-bold ph-x text-lg"></i></button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto scroll-smooth space-y-8 flex-1">
                {viewingTalent.admin_note && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
                    <i className="ph-fill ph-warning-circle text-amber-600 text-xl mt-0.5"></i>
                    <div>
                      <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1">Ghi chú yêu cầu sửa đổi từ Admin</p>
                      <p className="text-sm font-medium text-amber-900">{viewingTalent.admin_note}</p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 text-indigo-500 flex items-center justify-center text-3xl font-black shadow-inner border border-indigo-100 shrink-0">
                    {viewingTalent.avatar_url ? <img src={viewingTalent.avatar_url} alt="Avatar" className="w-full h-full rounded-[2rem] object-cover" /> : viewingTalent.full_name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h2 className="text-2xl font-black text-slate-900">{viewingTalent.full_name}</h2>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider ${viewingTalent.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : viewingTalent.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {viewingTalent.status === 'VERIFIED' ? 'ĐÃ DUYỆT (VERIFIED)' : viewingTalent.status === 'PENDING' ? 'CHỜ THẨM ĐỊNH' : 'BỊ TỪ CHỐI'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-indigo-600 mb-4">{viewingTalent.title}</p>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-slate-600">
                      <span className="flex items-center gap-2"><i className="ph-fill ph-envelope-simple text-slate-400"></i> {viewingTalent.email || '---'}</span>
                      <span className="flex items-center gap-2"><i className="ph-fill ph-phone text-slate-400"></i> {viewingTalent.phone || '---'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số năm kinh nghiệm</p><p className="text-base font-black text-slate-800">{viewingTalent.experience_years} năm</p></div>
                  <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mức lương mong muốn</p><p className="text-base font-black text-emerald-600">{viewingTalent.expected_salary || 'Thỏa thuận'}</p></div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Kỹ năng chuyên môn</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingTalent.skills ? viewingTalent.skills.split(',').map((skill: string, idx: number) => (
                      <span key={idx} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase shadow-sm">{skill.trim()}</span>
                    )) : <span className="text-sm italic text-slate-400">Chưa cập nhật kỹ năng</span>}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">Giới thiệu bản thân (Bio)</h4>
                  <div className="bg-white border border-slate-200 p-5 rounded-2xl text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed shadow-sm">{viewingTalent.bio || <span className="italic text-slate-400">Chưa viết phần giới thiệu.</span>}</div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex flex-wrap justify-end gap-3">
                <button onClick={() => setViewingTalent(null)} className="h-11 px-6 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">ĐÓNG</button>
                
                {viewingTalent.status === 'VERIFIED' && (
                  <>
                    <button onClick={() => openFeedbackModal(viewingTalent.id)} disabled={!!isProcessing} className="h-11 px-6 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-black hover:bg-amber-100 transition-colors">YÊU CẦU SỬA ĐỔI</button>
                    <button onClick={() => handleRevokeTalent(viewingTalent.id)} disabled={!!isProcessing} className="h-11 px-6 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-black hover:bg-rose-500 hover:text-white transition-colors">HỦY TICK XANH</button>
                  </>
                )}

                {(viewingTalent.status === 'PENDING' || viewingTalent.status === 'REJECTED' || !viewingTalent.status) && (
                  <>
                    <button onClick={() => handleRejectTalent(viewingTalent.id)} disabled={!!isProcessing} className="h-11 px-6 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-black hover:bg-rose-100 transition-colors">TỪ CHỐI</button>
                    <button onClick={() => openFeedbackModal(viewingTalent.id)} disabled={!!isProcessing} className="h-11 px-6 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-black hover:bg-amber-100 transition-colors">YÊU CẦU SỬA</button>
                    <button onClick={() => handleVerifyTalent(viewingTalent.id)} disabled={!!isProcessing} className="h-11 px-8 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg hover:bg-emerald-500 transition-colors flex items-center gap-2"><i className="ph-bold ph-check-circle text-lg"></i> CẤP TICK XANH</button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TRẠM KHỚP NỐI (MATCHING CHUYÊN GIA - JOB VỊ TRÍ) */}
        {activeTab === 'matching' && (
           <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
             {/* BÊN TRÁI: DANH SÁCH CÁC JOB ĐANG TUYỂN */}
             <div className="w-full lg:w-1/3 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50"><h3 className="font-black text-slate-800 flex items-center gap-2"><i className="ph-fill ph-briefcase text-blue-500"></i> Vị trí đang Tuyển</h3></div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth">
                {jobs.map(job => (
                  <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedJob?.id === job.id ? 'bg-[#002D62] border-[#002D62] shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                    <h4 className={`text-sm font-bold line-clamp-1 ${selectedJob?.id === job.id ? 'text-white' : 'text-slate-800'}`}>{job.title}</h4>
                    <p className={`text-[10px] mt-1 font-semibold opacity-80 ${selectedJob?.id === job.id ? 'text-blue-100' : 'text-slate-500'}`}>{getCompanyName(job.member_id)}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* BÊN PHẢI: KHÔNG GIAN KHỚP NỐI DỮ LIỆU */}
            <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col overflow-hidden">
              {selectedJob ? (
                <div className="flex flex-col h-full min-h-0">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Vị trí chọn đối khớp</span>
                      <h3 className="font-black text-slate-800 mt-1">{selectedJob.title}</h3>
                    </div>
                    <div className="text-right text-xs font-bold text-slate-400"><i className="ph-fill ph-buildings"></i> {getCompanyName(selectedJob.member_id)}</div>
                  </div>
                  
                  {/* DANH SÁCH CHUYÊN GIA ĐÃ CÓ TICK XANH ĐỂ TIẾN CỬ */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-3 scroll-smooth">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Danh sách chuyên gia đạt chuẩn sẵn sàng tiến cử</p>
                    {verifiedTalents.map(talent => (
                      <div key={talent.id} className="flex justify-between items-center p-4 border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-white rounded-2xl transition-all group">
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-800 text-sm flex items-center gap-1.5">{talent.full_name} <i className="ph-fill ph-check-circle text-blue-500"></i></h4>
                          <p className="text-xs text-indigo-600 font-bold mt-0.5">{talent.title} <span className="text-slate-400 font-medium ml-2">| {talent.experience_years} năm KN</span></p>
                        </div>
                        <button 
                          onClick={() => handleRecommend(talent.id)}
                          disabled={isProcessing === talent.id}
                          className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-700/10 shrink-0"
                        >
                          <i className="ph-bold ph-handshake"></i> TIẾN CỬ NGAY
                        </button>
                      </div>
                    ))}
                    {verifiedTalents.length === 0 && (
                      <div className="text-center py-12 text-slate-400 font-medium">Hiện tại không có chuyên gia nào có Tick Xanh bảo chứng để tiến cử. Hãy duyệt hồ sơ ở tab Chờ duyệt trước!</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400">
                  <i className="ph-fill ph-arrows-merge text-5xl mb-4"></i>
                  <p className="font-bold">Chọn một Job vị trí tuyển dụng bên trái để mở kho dữ liệu tiến cử.</p>
                </div>
              )}
            </div>
           </div>
        )}
      </div>
    </div>
  );
}