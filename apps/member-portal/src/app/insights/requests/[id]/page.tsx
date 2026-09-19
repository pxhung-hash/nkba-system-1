'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        const reqId = params.id as string;
        const { data, error } = await supabase
          .from('data_requests')
          .select('*')
          .eq('id', reqId)
          .single();

        if (error) throw error;

        // Bảo mật: Kiểm tra xem user hiện tại có phải là chủ nhân của yêu cầu này không
        const { data: profile } = await supabase.from('individuals').select('id').eq('user_auth_id', user.id).single();
        if (profile?.id !== data.member_id) {
          alert('Bạn không có quyền xem yêu cầu dữ liệu này.');
          return router.push('/insights');
        }

        setRequestData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [params.id, supabase, router]);

  const handleReply = async () => {
    if (!replyText.trim()) return alert('Vui lòng nhập nội dung bạn muốn bổ sung!');
    setIsSubmitting(true);
    
    // Nối thêm thông tin bổ sung vào nội dung cũ (Dấu mốc thời gian rõ ràng)
    const updatedContent = `${requestData.content}\n\n[HỘI VIÊN BỔ SUNG THÔNG TIN - ${new Date().toLocaleDateString('vi-VN')}]:\n${replyText}`;
    
    const { error } = await supabase.from('data_requests').update({
      content: updatedContent,
      status: 'PENDING' // Chuyển lại trạng thái Chờ xử lý cho Admin
    }).eq('id', requestData.id);

    if (error) {
      alert('Lỗi: ' + error.message);
    } else {
      alert('✅ Đã gửi phản hồi thành công! Yêu cầu của bạn đã được chuyển lại cho Ban quản trị.');
      setRequestData({ ...requestData, content: updatedContent, status: 'PENDING' });
      setReplyText('');
    }
    setIsSubmitting(false);
  };

  const getReqStatusConfig = (status: string) => {
    switch(status) {
      case 'COMPLETED': return { color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-emerald-200', label: 'ĐÃ TRẢ KẾT QUẢ', icon: 'ph-check-circle' };
      case 'PROCESSING': return { color: 'text-blue-700', bg: 'bg-blue-100', border: 'border-blue-200', label: 'ĐANG XỬ LÝ', icon: 'ph-spinner animate-spin' };
      case 'NEED_MORE_INFO': return { color: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-200', label: 'CẦN BỔ SUNG THÔNG TIN', icon: 'ph-warning-circle' };
      case 'REJECTED': return { color: 'text-rose-700', bg: 'bg-rose-100', border: 'border-rose-200', label: 'TỪ CHỐI', icon: 'ph-x-circle' };
      default: return { color: 'text-amber-700', bg: 'bg-amber-100', border: 'border-amber-200', label: 'CHỜ TIẾP NHẬN', icon: 'ph-clock-countdown' };
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-teal-600"></i> Đang tải dữ liệu...</div>;
  if (!requestData) return <div className="p-20 text-center text-slate-500 font-bold">Không tìm thấy yêu cầu này.</div>;

  const statusConf = getReqStatusConfig(requestData.status);

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 animate-in fade-in duration-500">
      
      {/* Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
          <Link href="/insights" className="flex items-center gap-2 text-slate-500 hover:text-[#002D62] font-bold text-sm transition-colors">
            <i className="ph-bold ph-arrow-left text-lg"></i> Trở về Insights & Dữ liệu
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-10 space-y-8">
        
        {/* NỘI DUNG YÊU CẦU */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <span className={`w-fit text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border flex items-center gap-1.5 ${statusConf.bg} ${statusConf.color} ${statusConf.border}`}>
              <i className={`ph-fill ${statusConf.icon} text-sm`}></i> {statusConf.label}
            </span>
            <p className="text-xs font-bold text-slate-400"><i className="ph-bold ph-calendar-blank"></i> Đã gửi: {new Date(requestData.created_at).toLocaleDateString('vi-VN')}</p>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-6 leading-tight">{requestData.title}</h1>
          
          <div className="bg-slate-50 p-6 md:p-8 rounded-3xl border border-slate-100 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nội dung bạn yêu cầu</p>
            <div className="text-sm font-medium text-slate-700 whitespace-pre-wrap leading-relaxed">
              {requestData.content}
            </div>
          </div>

          {/* KHU VỰC PHẢN HỒI TỪ ADMIN (CRM) */}
          <div>
            <h3 className="text-sm font-black text-[#002D62] uppercase tracking-widest mb-5 flex items-center gap-2">
              <i className="ph-fill ph-chat-circle-dots text-xl"></i> Phản hồi từ Ban quản trị
            </h3>
            
            {/* TRƯỜNG HỢP 1: HOÀN THÀNH - TRẢ FILE */}
            {requestData.status === 'COMPLETED' && (
              <div className="bg-emerald-50 p-6 md:p-8 rounded-[2rem] border border-emerald-100">
                <p className="text-sm text-emerald-900 font-medium leading-relaxed mb-6 italic border-l-2 border-emerald-400 pl-4">
                  "{requestData.admin_note || 'Ban nghiên cứu đã hoàn tất báo cáo cho yêu cầu của bạn.'}"
                </p>
                <a href={requestData.result_file_url || '#'} target="_blank" rel="noopener noreferrer" className="h-14 w-full bg-emerald-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all hover:-translate-y-1 uppercase flex items-center justify-center gap-2">
                  <i className="ph-bold ph-download-simple text-2xl"></i> TẢI FILE KẾT QUẢ (PDF/EXCEL)
                </a>
              </div>
            )}

            {/* TRƯỜNG HỢP 2: YÊU CẦU LÀM RÕ (CÓ FORM NHẬP LẠI) */}
            {requestData.status === 'NEED_MORE_INFO' && (
              <div className="bg-purple-50 p-6 md:p-8 rounded-[2rem] border border-purple-200 shadow-inner">
                <p className="text-sm text-purple-900 font-medium leading-relaxed mb-6">
                  <strong className="block mb-2 text-purple-700 font-black"><i className="ph-fill ph-warning-circle"></i> Thông báo từ Admin:</strong>
                  {requestData.admin_note || 'Vui lòng cung cấp thêm chi tiết để chúng tôi có thể xử lý chính xác nhất.'}
                </p>
                
                <div className="bg-white p-6 rounded-[1.5rem] border border-purple-100 shadow-sm">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Gửi thông tin bổ sung cho Admin</label>
                  <textarea 
                    value={replyText} 
                    onChange={e => setReplyText(e.target.value)} 
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:bg-white focus:border-purple-400 text-slate-900 mb-4 transition-colors" 
                    placeholder="VD: Cụ thể tôi cần lấy báo cáo giá vật liệu của giai đoạn Quý 3/2026 thôi nhé..." 
                  />
                  <button onClick={handleReply} disabled={isSubmitting} className="h-12 w-full bg-purple-600 text-white rounded-xl text-sm font-black shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG GỬI...</> : <><i className="ph-bold ph-paper-plane-right text-lg"></i> GỬI THÔNG TIN BỔ SUNG</>}
                  </button>
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP 3: ĐANG XỬ LÝ */}
            {requestData.status === 'PROCESSING' && (
              <div className="bg-blue-50 p-6 md:p-8 rounded-[2rem] border border-blue-100 flex items-center gap-5">
                <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0 shadow-inner"><i className="ph-bold ph-spinner animate-spin text-3xl"></i></div>
                <div>
                  <p className="text-base font-black text-blue-900 mb-1">Đang xử lý thu thập dữ liệu</p>
                  {requestData.admin_note && <p className="text-sm text-blue-700 font-medium italic">"{requestData.admin_note}"</p>}
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP 4: TỪ CHỐI */}
            {requestData.status === 'REJECTED' && (
              <div className="bg-rose-50 p-6 md:p-8 rounded-[2rem] border border-rose-100">
                <p className="text-sm text-rose-900 font-medium leading-relaxed">
                  <strong className="block mb-2 text-rose-700 font-black"><i className="ph-fill ph-x-circle text-lg"></i> Lý do từ chối:</strong>
                  {requestData.admin_note || 'Rất tiếc, yêu cầu này không nằm trong phạm vi hỗ trợ của hạng thẻ hiện tại hoặc thiếu tính khả thi.'}
                </p>
              </div>
            )}

            {/* TRƯỜNG HỢP 5: CHỜ TIẾP NHẬN */}
            {requestData.status === 'PENDING' && (
              <div className="bg-amber-50 p-6 md:p-8 rounded-[2rem] border border-amber-100 flex items-center gap-5">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0 shadow-inner"><i className="ph-fill ph-clock-countdown text-3xl"></i></div>
                <div>
                  <p className="text-base font-black text-amber-900">Chờ tiếp nhận</p>
                  <p className="text-sm text-amber-800/80 font-medium mt-1">Yêu cầu của bạn đang chờ Ban quản trị phân công xử lý.</p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
}