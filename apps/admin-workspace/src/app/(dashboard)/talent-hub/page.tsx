'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function TalentHubPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'vault' | 'pending' | 'matching'>('pending');
  const [talents, setTalents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [individuals, setIndividuals] = useState<any[]>([]);
  
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Modal Yêu cầu sửa đổi CV
  const [feedbackModal, setFeedbackModal] = useState<{isOpen: boolean, talentId: string | null}>({isOpen: false, talentId: null});
  const [feedbackNote, setFeedbackNote] = useState('');

  // Modal Đánh giá Tiến cử (Headhunt Consulting)
  const [recommendModal, setRecommendModal] = useState<{isOpen: boolean, talentId: string | null, talentName: string, notes: string}>({isOpen: false, talentId: null, talentName: '', notes: ''});

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

  const verifiedTalents = talents.filter(t => t.status === 'VERIFIED');
  const pendingTalents = talents.filter(t => ['PENDING', 'REJECTED'].includes(t.status) || !t.status);

  const openFeedbackModal = (id: string) => {
    setFeedbackNote('');
    setFeedbackModal({ isOpen: true, talentId: id });
  };

  const submitFeedback = async () => {
    if (!feedbackNote.trim()) return alert('Vui lòng nhập nội dung yêu cầu!');
    const targetId = feedbackModal.talentId;
    if (!targetId) return;
    
    setIsProcessing(targetId);
    const { error: updateErr } = await supabase.from('talents').update({ status: 'PENDING', admin_note: feedbackNote }).eq('id', targetId);
    
    if (updateErr) {
      alert('Lỗi cập nhật CV: ' + updateErr.message);
    } else {
      const talentToUpdate = talents.find(t => t.id === targetId);
      if (talentToUpdate?.individual_id) {
        await supabase.from('notifications').insert([{
          member_id: talentToUpdate.individual_id,
          title: 'Yêu cầu cập nhật Hồ sơ Chuyên gia',
          content: `Admin NKBA đã yêu cầu bạn bổ sung thông tin: "${feedbackNote}"`,
          link_url: '/profile'
        }]);
      }
      alert('✅ Đã gửi yêu cầu bổ sung thông tin tới Hội viên!');
      fetchData();
      setFeedbackModal({ isOpen: false, talentId: null });
    }
    setIsProcessing(null);
  };

  const openRecommendModal = (talent: any) => {
    if (!selectedJob) return alert('Vui lòng chọn một Job Vị trí đang tuyển ở cột bên trái trước khi tiến cử!');
    setRecommendModal({ isOpen: true, talentId: talent.id, talentName: talent.full_name, notes: '' });
  };

  const submitRecommend = async () => {
    if (!recommendModal.notes.trim()) return alert('Vui lòng nhập vài dòng đánh giá tư vấn để Doanh nghiệp thấy được sự chuyên nghiệp!');
    
    setIsProcessing(recommendModal.talentId);
    const { error } = await supabase.from('talent_applications').insert([{ 
      job_id: selectedJob.id, 
      talent_id: recommendModal.talentId, 
      status: 'RECOMMENDED', 
      notes: recommendModal.notes 
    }]);

    if (error) {
      if (error.code === '23505') alert('Chuyên gia này đã được tiến cử vào job này rồi!');
      else alert('Lỗi: ' + error.message);
    } else {
      alert('✅ Đã gửi Hồ sơ Tiến cử thành công kèm Đánh giá của Admin!');
      setRecommendModal({ isOpen: false, talentId: null, talentName: '', notes: '' });
    }
    setIsProcessing(null);
  };

  const getCompanyName = (id: string) => {
    const ind = individuals.find(m => m.id === id);
    return ind?.corporates?.name || ind?.full_name || 'Công ty ẩn danh';
  };

  if (isLoading) return <div className="p-20 text-center text-sm font-semibold text-slate-400 animate-pulse tracking-widest uppercase">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-20 relative h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
      
      <div className="shrink-0 bg-white p-6 md:px-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-100"><i className="ph-fill ph-detective text-3xl"></i></div>
            <div>
              <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mb-1"><i className="ph-fill ph-network"></i> MẠNG LƯỚI CHUYÊN GIA</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Talent Hub (Headhunt)</h2>
            </div>
         </div>
         <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto">
            <button onClick={() => setActiveTab('pending')} className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === 'pending' ? 'bg-white text-amber-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-bold ph-clock-countdown text-lg"></i> Chờ Thẩm Định ({pendingTalents.length})
              {pendingTalents.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>}
            </button>
            <button onClick={() => setActiveTab('vault')} className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'vault' ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-bold ph-users-three text-lg"></i> Kho Chuyên Gia ({verifiedTalents.length})
            </button>
            <button onClick={() => setActiveTab('matching')} className={`shrink-0 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'matching' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-bold ph-arrows-merge text-lg"></i> Trạm Khớp Nối
            </button>
         </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col relative">
        
        {feedbackModal.isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200">
              <div className="p-6 bg-amber-50 border-b border-amber-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"><i className="ph-fill ph-warning-circle text-2xl"></i></div>
                  <h3 className="text-lg font-black text-amber-900">Yêu cầu bổ sung Hồ sơ</h3>
                </div>
                <button onClick={() => setFeedbackModal({isOpen: false, talentId: null})} className="text-amber-700 hover:text-rose-500"><i className="ph-bold ph-x text-xl"></i></button>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-sm font-medium text-slate-600">Gửi thông báo đến chuyên gia yêu cầu làm rõ năng lực. Hồ sơ sẽ được đưa về trạng thái "Chờ duyệt".</p>
                <textarea 
                  value={feedbackNote} 
                  onChange={e => setFeedbackNote(e.target.value)}
                  placeholder="VD: Vui lòng cập nhật thêm các dự án lớn bạn đã từng quản lý..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all text-slate-900"
                  autoFocus
                />
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <button onClick={() => setFeedbackModal({isOpen: false, talentId: null})} className="h-12 px-6 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors">HỦY BỎ</button>
                <button onClick={submitFeedback} disabled={!!isProcessing} className="h-12 px-8 bg-amber-500 text-[#002D62] font-black text-sm rounded-xl shadow-lg hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center gap-2">
                  <i className="ph-bold ph-paper-plane-right text-lg"></i> GỬI YÊU CẦU ĐẾN HỘI VIÊN
                </button>
              </div>
            </div>
          </div>
        )}

        {recommendModal.isOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-slate-200">
              <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 border-b border-emerald-800 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md"><i className="ph-fill ph-handshake text-2xl"></i></div>
                  <h3 className="text-lg font-black">Bút phê Tiến cử Chuyên gia</h3>
                </div>
                <button onClick={() => setRecommendModal({isOpen: false, talentId: null, talentName: '', notes: ''})} className="text-emerald-200 hover:text-white"><i className="ph-bold ph-x text-xl"></i></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-600">Tiến cử chuyên gia: <strong className="text-slate-900">{recommendModal.talentName}</strong></p>
                  <p className="text-sm font-medium text-slate-600">Cho vị trí: <strong className="text-blue-700">{selectedJob?.title}</strong> của <strong>{getCompanyName(selectedJob?.member_id)}</strong></p>
                </div>
                <div>
                  <label className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <i className="ph-fill ph-chat-text text-lg"></i> Đánh giá / Tư vấn từ Ban Headhunt NKBA (*)
                  </label>
                  <textarea 
                    value={recommendModal.notes} 
                    onChange={e => setRecommendModal({...recommendModal, notes: e.target.value})}
                    placeholder="VD: Ứng viên này có 10 năm kinh nghiệm..."
                    className="w-full h-40 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-900 shadow-sm"
                    autoFocus
                  />
                  <p className="text-[10px] text-slate-500 mt-2 italic">Lời nhắn này sẽ hiển thị trực tiếp với Doanh nghiệp khi họ duyệt danh sách ứng viên.</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                <button onClick={() => setRecommendModal({isOpen: false, talentId: null, talentName: '', notes: ''})} className="h-12 px-6 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors">HỦY</button>
                <button onClick={submitRecommend} disabled={!!isProcessing} className="h-12 px-8 bg-emerald-600 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-2">
                  <i className="ph-bold ph-paper-plane-right text-lg"></i> XÁC NHẬN TIẾN CỬ
                </button>
              </div>
            </div>
          </div>
        )}
        
        {(activeTab === 'vault' || activeTab === 'pending') && (
          <div className="flex-1 overflow-y-auto scroll-smooth pb-10 custom-scrollbar pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {(activeTab === 'vault' ? verifiedTalents : pendingTalents).map(talent => (
                <div key={talent.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all relative overflow-hidden group flex flex-col">
                  {talent.status === 'VERIFIED' && <div className="absolute top-0 right-0 p-6 pointer-events-none"><div className="bg-emerald-500 text-white rounded-full p-1.5 shadow-md"><i className="ph-bold ph-check"></i></div></div>}
                  {talent.status === 'REJECTED' && <div className="absolute top-0 right-0 p-6 pointer-events-none"><div className="bg-rose-500 text-white rounded-full p-1.5 shadow-md"><i className="ph-bold ph-warning"></i></div></div>}
                  
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-2xl font-black shadow-inner border border-slate-200 shrink-0 overflow-hidden">
                      {talent.avatar_url ? <img src={talent.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : talent.full_name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 line-clamp-1">{talent.full_name}</h3>
                      <p className="text-xs font-bold text-indigo-600 line-clamp-1 uppercase tracking-widest mt-1">{talent.title}</p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600"><i className="ph-fill ph-briefcase text-slate-400 text-xl"></i> {talent.experience_years} năm kinh nghiệm</div>
                    <div className="flex items-center gap-3 text-sm font-medium text-slate-600"><i className="ph-fill ph-money text-emerald-500 text-xl"></i> Lương: <span className="font-bold text-slate-800">{talent.expected_salary || 'Thỏa thuận'}</span></div>
                  </div>
                  <div className="mt-auto pt-2 flex gap-2">
                    {/* SỬA TẠI ĐÂY: DÙNG LINK ĐỂ TRỎ VỀ TRANG CHI TIẾT */}
                    <Link href={`/talent-hub/${talent.id}`} className={`flex-1 h-12 rounded-xl text-xs font-black border transition-all flex items-center justify-center gap-2 ${talent.status === 'PENDING' ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-400 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                      <i className="ph-bold ph-eye text-lg"></i> {talent.status === 'PENDING' ? 'THẨM ĐỊNH HỒ SƠ' : 'XEM CV CHI TIẾT'}
                    </Link>
                  </div>
                </div>
              ))}
              {(activeTab === 'vault' ? verifiedTalents : pendingTalents).length === 0 && (
                <div className="col-span-full py-20 text-center flex flex-col items-center justify-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white">
                  <i className="ph-fill ph-folder-open text-5xl mb-4 text-slate-300"></i>
                  Không tìm thấy dữ liệu chuyên gia phù hợp trong mục này.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'matching' && (
           <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 animate-in slide-in-from-bottom-4 duration-500">
             <div className="w-full lg:w-1/3 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col overflow-hidden shrink-0">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-black text-slate-800 flex items-center gap-2"><i className="ph-fill ph-briefcase text-blue-500 text-xl"></i> Vị trí đang Tuyển ({jobs.length})</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Chọn Job để lọc ứng viên phù hợp</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {jobs.map(job => (
                  <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${selectedJob?.id === job.id ? 'bg-[#002D62] border-[#002D62] shadow-lg transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md hover:bg-slate-50'}`}>
                    <h4 className={`text-sm font-bold line-clamp-2 leading-snug ${selectedJob?.id === job.id ? 'text-white' : 'text-slate-800'}`}>{job.title}</h4>
                    <div className={`mt-3 pt-3 border-t text-[11px] font-bold flex items-center gap-1.5 ${selectedJob?.id === job.id ? 'border-white/20 text-blue-200' : 'border-slate-100 text-slate-500'}`}>
                      <i className="ph-fill ph-buildings"></i> <span className="truncate">{getCompanyName(job.member_id)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col overflow-hidden">
              {selectedJob ? (
                <div className="flex flex-col h-full min-h-0">
                  <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                    <div>
                      <span className="text-[10px] font-black tracking-widest uppercase px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg mb-3 inline-block border border-blue-200">Khu vực Đối khớp Ứng viên</span>
                      <h3 className="text-xl font-black text-[#002D62]">{selectedJob.title}</h3>
                    </div>
                    <div className="text-right text-sm font-bold text-slate-500 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                      <i className="ph-fill ph-buildings text-amber-500 text-lg"></i> {getCompanyName(selectedJob.member_id)}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
                    <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><i className="ph-fill ph-check-circle text-lg"></i> Danh sách chuyên gia đạt chuẩn sẵn sàng tiến cử</p>
                    
                    {verifiedTalents.map(talent => (
                      <div key={talent.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 border border-slate-200 hover:border-emerald-300 bg-white hover:shadow-lg rounded-2xl transition-all group gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xl font-black shadow-inner border border-slate-200 shrink-0 overflow-hidden">
                            {talent.avatar_url ? <img src={talent.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : talent.full_name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-base flex items-center gap-1.5">{talent.full_name} <i className="ph-fill ph-check-circle text-blue-500"></i></h4>
                            <div className="text-xs text-indigo-600 font-bold mt-1.5 flex flex-wrap items-center gap-2">
                              <span>{talent.title}</span> <span className="text-slate-300">|</span> <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded"><i className="ph-fill ph-briefcase"></i> {talent.experience_years} năm</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                          {/* SỬA NÚT XEM CV -> Link sang Detail Page */}
                          <Link href={`/talent-hub/${talent.id}`} className="w-12 h-12 flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl transition-colors border border-slate-200 hover:border-blue-200" title="Xem CV chi tiết">
                            <i className="ph-bold ph-eye text-xl"></i>
                          </Link>
                          
                          <button 
                            onClick={() => openRecommendModal(talent)}
                            disabled={isProcessing === talent.id}
                            className="h-12 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 disabled:opacity-50"
                          >
                            <i className="ph-bold ph-handshake text-lg"></i> TIẾN CỬ (VIẾT BÚT PHÊ)
                          </button>
                        </div>
                      </div>
                    ))}
                    {verifiedTalents.length === 0 && (
                      <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 font-medium">Hiện tại không có chuyên gia nào có Tick Xanh bảo chứng để tiến cử.<br/>Hãy duyệt hồ sơ ở tab Chờ Thẩm Định trước!</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                  <i className="ph-duotone ph-arrows-merge text-[80px] mb-6 text-slate-300"></i>
                  <h3 className="font-black text-xl text-slate-700 mb-2">Trạm Khớp Nối Thông Minh</h3>
                  <p className="text-sm font-medium text-slate-500">Chọn một Vị trí tuyển dụng bên trái để mở kho dữ liệu tiến cử.</p>
                </div>
              )}
            </div>
           </div>
        )}
      </div>
    </div>
  );
}