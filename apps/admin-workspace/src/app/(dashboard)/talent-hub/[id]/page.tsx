'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PremiumCV from '@/components/profile/PremiumCV';

export default function TalentDetailAdminPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const [talent, setTalent] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [individuals, setIndividuals] = useState<any[]>([]);
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedbackNote, setFeedbackNote] = useState('');
  
  // States cho tính năng Tiến cử
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [recommendNote, setRecommendNote] = useState('');

  useEffect(() => {
    const fetchTalentDetail = async () => {
      try {
        setLoading(true);
        const talentId = params.id as string;
        if (!talentId) return;

        const [talRes, jobsRes, indRes] = await Promise.all([
          supabase.from('talents').select('*').eq('id', talentId).single(),
          supabase.from('jobs').select('*').order('created_at', { ascending: false }),
          supabase.from('individuals').select('id, full_name, corporates(name)')
        ]);

        if (talRes.error) throw talRes.error;
        setTalent(talRes.data);
        if (jobsRes.data) setJobs(jobsRes.data);
        if (indRes.data) setIndividuals(indRes.data);

      } catch (err) {
        console.error('Lỗi tải CV:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTalentDetail();
  }, [params.id, supabase]);

  const getCompanyName = (id: string) => {
    const ind = individuals.find(m => m.id === id);
    return ind?.corporates?.name || ind?.full_name || 'Công ty ẩn danh';
  };

  // ==========================================
  // LOGIC THẨM ĐỊNH HỒ SƠ
  // ==========================================
  const handleVerifyTalent = async () => {
    setIsProcessing(true);
    const { error } = await supabase.from('talents').update({ status: 'VERIFIED', admin_note: null }).eq('id', talent.id);
    if (error) alert('Lỗi: ' + error.message);
    else {
      setTalent({ ...talent, status: 'VERIFIED', admin_note: null });
      alert('✅ Đã cấp Tick Xanh thành công!');
    }
    setIsProcessing(false);
  };

  const handleRejectTalent = async () => {
    if(!confirm('Bạn có chắc chắn muốn TỪ CHỐI hồ sơ này?')) return;
    setIsProcessing(true);
    const { error } = await supabase.from('talents').update({ status: 'REJECTED' }).eq('id', talent.id);
    if (error) alert('Lỗi: ' + error.message);
    else setTalent({ ...talent, status: 'REJECTED' });
    setIsProcessing(false);
  };

  const handleRevokeTalent = async () => {
    if(!confirm('Thu hồi Tick Xanh sẽ khiến chuyên gia bị gỡ khỏi "Hồ cá". Bạn chắc chứ?')) return;
    setIsProcessing(true);
    const { error } = await supabase.from('talents').update({ status: 'PENDING' }).eq('id', talent.id);
    if (error) alert('Lỗi: ' + error.message);
    else setTalent({ ...talent, status: 'PENDING' });
    setIsProcessing(false);
  };

  const submitFeedback = async () => {
    if (!feedbackNote.trim()) return alert('Vui lòng nhập nội dung yêu cầu sửa!');
    setIsProcessing(true);
    const { error } = await supabase.from('talents').update({ status: 'PENDING', admin_note: feedbackNote }).eq('id', talent.id);
    
    if (error) alert('Lỗi: ' + error.message);
    else {
      if (talent.individual_id) {
        await supabase.from('notifications').insert([{
          member_id: talent.individual_id,
          title: 'Yêu cầu cập nhật Hồ sơ Chuyên gia',
          content: `Admin NKBA đã yêu cầu bạn bổ sung thông tin: "${feedbackNote}"`,
          link_url: '/profile'
        }]);
      }
      setTalent({ ...talent, status: 'PENDING', admin_note: feedbackNote });
      setFeedbackNote('');
      alert('✅ Đã gửi yêu cầu bổ sung thông tin tới Hội viên!');
    }
    setIsProcessing(false);
  };

  // ==========================================
  // LOGIC TIẾN CỬ CHUYÊN GIA
  // ==========================================
  const submitRecommend = async () => {
    if (!selectedJobId) return alert('Vui lòng chọn một Vị trí (Job) để tiến cử!');
    if (!recommendNote.trim()) return alert('Vui lòng nhập vài dòng đánh giá tư vấn (Bút phê)!');
    
    setIsProcessing(true);
    const { error } = await supabase.from('talent_applications').insert([{ 
      job_id: selectedJobId, 
      talent_id: talent.id, 
      status: 'RECOMMENDED', 
      notes: recommendNote 
    }]);

    if (error) {
      if (error.code === '23505') alert('Chuyên gia này đã được tiến cử vào job này rồi!');
      else alert('Lỗi: ' + error.message);
    } else {
      alert('✅ Đã gửi Hồ sơ Tiến cử thành công tới Doanh nghiệp!');
      setSelectedJobId('');
      setRecommendNote('');
    }
    setIsProcessing(false);
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-indigo-600"></i> Đang tải Hồ sơ Chuyên gia...</div>;
  if (!talent) return <div className="p-20 text-center text-slate-500 font-bold">Không tìm thấy CV này.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24">
      
      {/* Top Navigation - Đã gỡ bỏ sticky top-0 để thanh cuộn tự nhiên lên trên */}
      <div className="bg-white border-b border-slate-200 relative z-10 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/talent-hub" className="flex items-center gap-2 text-slate-500 hover:text-[#002D62] font-bold text-sm transition-colors">
            <i className="ph-bold ph-arrow-left text-lg"></i> Trở về Bảng Điều Khiển
          </Link>
          <div className="flex items-center gap-3">
             <span className={`text-[10px] font-black px-3 py-1.5 rounded-md tracking-wider border ${talent.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : talent.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                {talent.status === 'VERIFIED' ? 'ĐÃ DUYỆT (VERIFIED)' : talent.status === 'PENDING' ? 'CHỜ THẨM ĐỊNH' : 'BỊ TỪ CHỐI'}
             </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* CỘT TRÁI: HIỂN THỊ CV FULLSCREEN VIEW */}
          <div className="lg:col-span-2 flex flex-col items-center">
            {talent.admin_note && (
              <div className="w-full max-w-[210mm] bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-start gap-4 mb-6 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0"><i className="ph-fill ph-warning-circle text-2xl"></i></div>
                <div>
                  <p className="text-xs font-black text-amber-800 uppercase tracking-widest mb-1.5">Ghi chú yêu cầu sửa đổi (Bạn đã gửi)</p>
                  <p className="text-sm font-medium text-amber-900 leading-relaxed">{talent.admin_note}</p>
                </div>
              </div>
            )}
            
            <div className="w-full max-w-[210mm] shadow-2xl rounded-sm overflow-hidden border border-slate-300 bg-white">
              <PremiumCV data={talent} />
            </div>
          </div>

          {/* CỘT PHẢI: ADMIN CONTROL PANEL (STICKY) */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
            
            {/* PANEL 1: THẨM ĐỊNH TRẠNG THÁI */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
              <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 mb-5 uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-shield-check text-indigo-500 text-lg"></i> Quyết định Thẩm định</h3>
              
              <div className="flex flex-col gap-3">
                {talent.status === 'VERIFIED' ? (
                  <button onClick={handleRevokeTalent} disabled={isProcessing} className="w-full h-12 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-black hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center gap-2">
                    <i className="ph-bold ph-minus-circle text-lg"></i> HỦY BỎ TICK XANH
                  </button>
                ) : (
                  <>
                    <button onClick={handleVerifyTalent} disabled={isProcessing} className="w-full h-14 bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
                      <i className="ph-bold ph-check-circle text-xl"></i> CẤP TICK XANH (DUYỆT)
                    </button>
                    {talent.status !== 'REJECTED' && (
                      <button onClick={handleRejectTalent} disabled={isProcessing} className="w-full h-12 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-sm font-black hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
                        <i className="ph-bold ph-x-circle text-lg"></i> TỪ CHỐI HỒ SƠ
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Yêu cầu Ứng viên sửa đổi</p>
                <textarea 
                  value={feedbackNote} 
                  onChange={e => setFeedbackNote(e.target.value)}
                  placeholder="Nhập lỗi sai hoặc yêu cầu ứng viên làm rõ..."
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none focus:bg-white focus:border-amber-400 text-slate-900"
                />
                <button onClick={submitFeedback} disabled={isProcessing} className="w-full h-10 bg-amber-100 text-amber-700 rounded-xl text-xs font-black hover:bg-amber-200 transition-colors flex items-center justify-center gap-2">
                  <i className="ph-bold ph-paper-plane-right"></i> GỬI YÊU CẦU SỬA CV
                </button>
              </div>
            </div>

            {/* PANEL 2: HEADHUNT CONSULTING (TIẾN CỬ) */}
            <div className={`bg-gradient-to-b from-indigo-50 to-white p-6 rounded-[2rem] shadow-sm border ${talent.status === 'VERIFIED' ? 'border-indigo-200' : 'border-slate-200 opacity-50 grayscale pointer-events-none'}`}>
              <h3 className="text-sm font-black text-indigo-900 border-b border-indigo-100 pb-3 mb-5 uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-handshake text-indigo-500 text-lg"></i> Tư vấn Tiến cử (Match)</h3>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chọn Vị trí tuyển dụng</label>
                  <select value={selectedJobId} onChange={e => setSelectedJobId(e.target.value)} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-400 cursor-pointer shadow-sm">
                    <option value="">-- Chọn Job --</option>
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>{j.title} ({getCompanyName(j.member_id)})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bút phê đánh giá (Admin Note)</label>
                  <textarea 
                    value={recommendNote} 
                    onChange={e => setRecommendNote(e.target.value)}
                    placeholder="VD: Ứng viên tiếng Nhật N2, kn 10 năm..."
                    className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none focus:border-indigo-400 text-slate-900 shadow-sm"
                  />
                </div>

                <button onClick={submitRecommend} disabled={isProcessing} className="w-full h-12 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                  <i className="ph-bold ph-paper-plane-right text-lg"></i> XÁC NHẬN TIẾN CỬ
                </button>
              </div>
              
              {talent.status !== 'VERIFIED' && (
                <p className="text-[10px] font-bold text-rose-500 mt-4 text-center">CV phải có Tick Xanh mới có thể tiến cử.</p>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}