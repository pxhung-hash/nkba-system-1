'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function AdminRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<any>(null);
  const [memberInfo, setMemberInfo] = useState<any>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [resultFile, setResultFile] = useState('');
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const reqId = params.id as string;
        if (!reqId) return;

        const { data: req, error } = await supabase.from('data_requests').select('*').eq('id', reqId).single();
        if (error) throw error;
        
        setRequestData(req);
        setStatus(req.status);
        setResultFile(req.result_file_url || '');
        setAdminNote(req.admin_note || '');

        const { data: mem } = await supabase.from('individuals').select('id, full_name, email, phone, corporates(name), individual_tiers!individuals_tier_id_fkey(name)').eq('id', req.member_id).single();
        if (mem) setMemberInfo(mem);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [params.id, supabase]);

  const handleSave = async () => {
    if (status === 'COMPLETED' && !resultFile) return alert('Để trả kết quả (Hoàn thành), vui lòng đính kèm Link File!');
    if (status === 'NEED_MORE_INFO' && !adminNote) return alert('Vui lòng ghi rõ nội dung cần làm rõ vào phần Lời nhắn!');

    setIsSaving(true);
    const { error } = await supabase.from('data_requests').update({
      status: status,
      result_file_url: resultFile,
      admin_note: adminNote,
      updated_at: new Date().toISOString()
    }).eq('id', requestData.id);

    if (error) alert('Lỗi: ' + error.message);
    else alert('✅ Đã cập nhật và gửi phản hồi thành công!');
    setIsSaving(false);
  };

  const getReqStatusConfig = (s: string) => {
    switch(s) {
      case 'COMPLETED': return { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'ĐÃ TRẢ KẾT QUẢ', icon: 'ph-check-circle' };
      case 'PROCESSING': return { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', label: 'ĐANG XỬ LÝ', icon: 'ph-spinner animate-spin' };
      case 'NEED_MORE_INFO': return { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', label: 'CẦN BỔ SUNG THÔNG TIN', icon: 'ph-warning-circle' };
      case 'REJECTED': return { color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', label: 'TỪ CHỐI', icon: 'ph-x-circle' };
      default: return { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', label: 'CHỜ TIẾP NHẬN', icon: 'ph-clock-countdown' };
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-[#002D62]"></i> Đang tải Ticket...</div>;
  if (!requestData) return <div className="p-20 text-center text-slate-500 font-bold">Không tìm thấy yêu cầu này.</div>;

  const statusConf = getReqStatusConfig(requestData.status);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 animate-in fade-in duration-500">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/insights" className="flex items-center gap-2 text-slate-500 hover:text-[#002D62] font-bold text-sm transition-colors">
            <i className="ph-bold ph-arrow-left text-lg"></i> Trở về Danh sách
          </Link>
          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border flex items-center gap-1.5 ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}>
             <i className={`ph-fill ${statusConf.icon} text-sm`}></i> Trạng thái hiện tại: {statusConf.label}
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* NỘI DUNG TICKET */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
            <p className="text-xs font-bold text-slate-400 mb-4"><i className="ph-bold ph-calendar-blank"></i> Đã gửi: {new Date(requestData.created_at).toLocaleDateString('vi-VN')}</p>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 leading-tight">{requestData.title}</h1>
            
            <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><i className="ph-fill ph-chat-text text-lg"></i> Nội dung chi tiết</p>
              <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
                {requestData.content}
              </div>
            </div>
          </div>
        </div>

        {/* KHU VỰC CRM PANEL (ADMIN XỬ LÝ) */}
        <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
          
          {/* Thông tin KH */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3 mb-5 uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-user-circle text-blue-500 text-lg"></i> Thông tin Khách hàng</h3>
            <div className="space-y-3">
              <p className="text-sm font-black text-slate-800">{memberInfo?.corporates?.name || memberInfo?.full_name}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><i className="ph-fill ph-envelope-simple text-slate-400"></i> {memberInfo?.email}</div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><i className="ph-fill ph-phone text-slate-400"></i> {memberInfo?.phone || 'Chưa có SĐT'}</div>
            </div>
          </div>

          {/* Form Phản hồi */}
          <div className={`bg-gradient-to-b from-blue-50 to-white p-6 rounded-[2rem] shadow-sm border ${status === 'NEED_MORE_INFO' ? 'border-purple-300' : 'border-blue-200'}`}>
            <h3 className="text-sm font-black text-[#002D62] border-b border-blue-100 pb-3 mb-5 uppercase tracking-widest flex items-center gap-2"><i className="ph-fill ph-wrench text-blue-500 text-lg"></i> Trạm Xử lý & Phản hồi</h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đổi trạng thái xử lý</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#002D62] outline-none focus:border-blue-400 cursor-pointer shadow-sm">
                  <option value="PENDING">1. Chờ tiếp nhận</option>
                  <option value="PROCESSING">2. Đang xử lý thu thập</option>
                  <option value="NEED_MORE_INFO">3. Cần Khách hàng làm rõ thêm</option>
                  <option value="COMPLETED">4. Đã hoàn thành (Trả file)</option>
                  <option value="REJECTED">5. Từ chối yêu cầu</option>
                </select>
              </div>

              {status === 'COMPLETED' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                  <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><i className="ph-bold ph-link"></i> Link File Trả Khách</label>
                  <input type="text" value={resultFile} onChange={e => setResultFile(e.target.value)} className="w-full h-11 px-3 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-emerald-700 outline-none focus:border-emerald-500 shadow-sm" placeholder="Link Drive, Excel..." />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lời nhắn gửi kèm (Admin Note)</label>
                <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="Nhập nội dung tương tác. Phản hồi này sẽ hiển thị phía Khách hàng..." className="w-full h-32 p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none resize-none focus:border-blue-400 text-slate-900 shadow-sm" />
              </div>

              <button onClick={handleSave} disabled={isSaving} className="w-full h-12 bg-[#002D62] text-white rounded-xl text-sm font-black shadow-lg shadow-blue-900/30 hover:bg-blue-900 transition-colors flex items-center justify-center gap-2">
                {isSaving ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG LƯU</> : <><i className="ph-bold ph-paper-plane-right text-lg"></i> CẬP NHẬT TRẠNG THÁI</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}