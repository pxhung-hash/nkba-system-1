'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  
  // Trạng thái modal đặt lịch / yêu cầu thêm
  const [showConsultModal, setShowConsultModal] = useState(false);
  const [consultMsg, setConsultMsg] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const fetchReportDetail = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push('/login');

        // Lấy User Profile & Quyền
        const { data: profile } = await supabase.from('individuals').select('id, full_name, email, phone, individual_tiers!individuals_tier_id_fkey(code)').eq('user_auth_id', user.id).single();
        if (profile) {
          const tierCode = Array.isArray(profile.individual_tiers) ? profile.individual_tiers[0]?.code : (profile.individual_tiers as any)?.code;
          setCurrentUser({ ...profile, tier_code: tierCode });
        }

        // Lấy data báo cáo
        const reportId = params.id as string;
        const { data: repData, error } = await supabase.from('reports').select('*').eq('id', reportId).single();
        if (error) throw error;
        
        setReport(repData);
      } catch (err) {
        console.error('Lỗi lấy báo cáo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetail();
  }, [params.id, supabase, router]);

  const handleBookConsulting = async () => {
    if (!consultMsg.trim()) return alert('Vui lòng nhập nội dung bạn cần hỗ trợ thêm!');
    setIsSending(true);
    try {
      // Lưu thẳng vào bảng data_requests để Admin support
      const { error } = await supabase.from('data_requests').insert([{
        member_id: currentUser.id,
        title: `[Tư vấn thêm] Báo cáo: ${report.title}`,
        content: consultMsg,
        status: 'PENDING'
      }]);
      
      if (error) throw error;
      alert('✅ Đã gửi yêu cầu tư vấn thành công! Chuyên gia NKBA sẽ liên hệ qua SĐT/Email của bạn trong 24h tới.');
      setShowConsultModal(false);
      setConsultMsg('');
    } catch (err: any) {
      alert('Lỗi gửi yêu cầu: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-teal-600"></i> Đang giải mã dữ liệu...</div>;
  if (!report) return <div className="p-20 text-center text-slate-500 font-bold">Không tìm thấy báo cáo hoặc báo cáo đã bị gỡ.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24">
      
      {/* 1. HERO BANNER BÁO CÁO */}
      <div className="w-full h-[250px] md:h-[350px] relative flex items-end bg-gradient-to-tr from-slate-900 to-[#002D62] overflow-hidden">
        {report.cover_image && <img src={report.cover_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay" />}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-8 relative z-10">
          <Link href="/insights" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm mb-6 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md transition-colors">
            <i className="ph-bold ph-arrow-left"></i> Trở về Thư viện
          </Link>
          <div className="text-white pb-2 max-w-4xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase bg-teal-500/20 text-teal-300 border border-teal-400/30 backdrop-blur-md">
                {report.category}
              </span>
              <span className="text-xs font-bold text-blue-200 flex items-center gap-1"><i className="ph-bold ph-clock"></i> {new Date(report.created_at).toLocaleDateString('vi-VN')}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black drop-shadow-md leading-tight mb-2">{report.title}</h1>
            <p className="text-sm font-medium text-slate-300 flex items-center gap-2"><i className="ph-fill ph-lock-key"></i> Lưu hành nội bộ NKBA</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (NỘI DUNG ĐỌC) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center"><i className="ph-fill ph-text-align-left text-xl"></i></div> 
                Executive Summary (Tóm tắt Chuyên sâu)
              </h3>
              
              <div className="prose max-w-none text-slate-700 leading-loose text-sm md:text-base font-medium whitespace-pre-wrap">
                {report.description || 'Nội dung chi tiết đang được cập nhật...'}
              </div>

              {/* Nút mồi tải File nếu họ đọc xong tóm tắt */}
              <div className="mt-10 pt-8 border-t border-slate-100 bg-slate-50 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-900">Báo cáo Đầy đủ (Bản PDF)</p>
                  <p className="text-xs text-slate-500 mt-1">Bao gồm toàn bộ biểu đồ, số liệu và phân tích chi tiết.</p>
                </div>
                <a href={report.file_url || '#'} target="_blank" rel="noopener noreferrer" className="shrink-0 h-12 px-6 bg-[#002D62] text-white rounded-xl font-black shadow-lg hover:bg-blue-900 transition-colors flex items-center gap-2">
                  <i className="ph-bold ph-download-simple text-xl"></i> TẢI BÁO CÁO FULL
                </a>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (SIDEBAR - CÁC DỊCH VỤ UPSELL ĐẮT GIÁ) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* THẺ TẢI FILE CHÍNH */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Tài liệu đính kèm</p>
              <a href={report.file_url || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-14 mt-3 bg-teal-600 text-white rounded-2xl font-black shadow-lg shadow-teal-600/30 hover:bg-teal-700 transition-all flex items-center justify-center gap-2">
                <i className="ph-bold ph-file-pdf text-xl"></i> XEM BẢN ĐẦY ĐỦ
              </a>
            </div>

            {/* UPSELL 1: TƯ VẤN 1-1 */}
            <div className="bg-gradient-to-b from-blue-50 to-white p-8 rounded-[2.5rem] shadow-sm border border-blue-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><i className="ph-fill ph-headset text-6xl text-blue-500"></i></div>
              <h3 className="text-base font-black text-[#002D62] mb-2 relative z-10">Bạn cần hiểu sâu hơn?</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-6 relative z-10">Báo cáo chung chưa giải đáp hết thắc mắc? Đặt lịch gọi thoại 1-1 với Chuyên gia phân tích của NKBA để được giải thích cặn kẽ số liệu áp dụng vào doanh nghiệp bạn.</p>
              <button onClick={() => setShowConsultModal(true)} className="w-full h-12 bg-white border border-blue-200 text-blue-700 rounded-xl font-black shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 relative z-10">
                <i className="ph-bold ph-phone-call text-lg"></i> ĐẶT LỊCH TƯ VẤN 1-1
              </button>
            </div>

            {/* UPSELL 2: ĐẶT HÀNG BÁO CÁO NGÁCH MỚI */}
            <div className="bg-gradient-to-b from-amber-50 to-white p-8 rounded-[2.5rem] shadow-sm border border-amber-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform"><i className="ph-fill ph-chart-line-up text-6xl text-amber-600"></i></div>
              <h3 className="text-base font-black text-amber-900 mb-2 relative z-10">Phân tích ngách riêng</h3>
              <p className="text-xs text-amber-800/80 leading-relaxed mb-6 relative z-10">NKBA hỗ trợ thu thập dữ liệu, khảo sát giá vật tư, hoặc đối thủ cạnh tranh theo đúng "đề bài" riêng biệt mà doanh nghiệp bạn đang cần.</p>
              <Link href="/insights" className="w-full h-12 bg-amber-500 text-white rounded-xl font-black shadow-md hover:bg-amber-600 transition-colors flex items-center justify-center gap-2 relative z-10">
                <i className="ph-bold ph-pencil-line text-lg"></i> YÊU CẦU DATA RIÊNG
              </Link>
            </div>

          </div>

        </div>
      </div>

      {/* MODAL NHẬP NỘI DUNG YÊU CẦU TƯ VẤN THÊM */}
      {showConsultModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#002D62] to-blue-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2"><i className="ph-fill ph-headset text-2xl text-blue-300"></i> Yêu cầu Chuyên gia tư vấn</h3>
              <button onClick={() => setShowConsultModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><i className="ph-bold ph-x"></i></button>
            </div>
            
            <div className="p-8">
              <p className="text-sm text-slate-600 font-medium mb-6">Chuyên gia của NKBA sẽ gọi lại cho bạn qua SĐT <strong className="text-slate-900">{currentUser.phone || '(SĐT chưa cập nhật)'}</strong>. Vui lòng để lại câu hỏi để chúng tôi chuẩn bị dữ liệu tốt nhất.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Câu hỏi / Thông tin bạn cần làm rõ (*)</label>
                  <textarea 
                    value={consultMsg} 
                    onChange={e => setConsultMsg(e.target.value)} 
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:bg-white focus:border-blue-400 text-slate-900" 
                    placeholder="VD: Nhờ anh/chị phân tích sâu hơn cho em về bảng giá nhân công trang 12, áp dụng cho dự án tại khu vực Hà Nội..." 
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setShowConsultModal(false)} className="h-12 px-6 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors w-1/3">HỦY</button>
                <button onClick={handleBookConsulting} disabled={isSending} className="h-12 bg-[#002D62] text-white font-black rounded-xl shadow-lg hover:bg-blue-900 transition-colors disabled:opacity-50 flex-1 flex items-center justify-center gap-2">
                  {isSending ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG GỬI...</> : <><i className="ph-bold ph-paper-plane-right"></i> GỬI YÊU CẦU</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}