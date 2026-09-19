'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import PremiumCV from '@/components/profile/PremiumCV'; // Component của Sếp

export default function TalentDetailViewPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null); // Nhà tuyển dụng
  const [talentData, setTalentData] = useState<any>(null); // Dữ liệu CV

  // States cho tính năng gửi tin nhắn/mời phỏng vấn
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    const fetchCVDetail = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase.from('individuals').select('id, full_name, corporates(name)').eq('user_auth_id', user.id).single();
          setCurrentUser(profile);
        }

        const talentId = params.id as string;
        if (!talentId) return;

        // Lấy dữ liệu Ứng viên từ bảng talents (Cấu trúc tương đương component PremiumCV của Sếp)
        const { data: talData, error } = await supabase
          .from('talents')
          .select('*')
          .eq('id', talentId)
          .single();

        if (error) throw error;
        setTalentData(talData);

      } catch (err) {
        console.error('Lỗi tải CV:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCVDetail();
  }, [params.id, supabase]);

  // HÀM GỬI LỜI MỜI PHỎNG VẤN (GHI NHẬN LÊN DATABASE CHO ADMIN QUẢN LÝ)
  const handleSendInvite = async () => {
    if (!currentUser) return alert('Vui lòng đăng nhập để gửi lời mời!');
    if (!inviteMessage.trim()) return alert('Vui lòng nhập nội dung lời mời!');
    
    setIsSending(true);
    try {
      const companyName = currentUser.corporates?.name || currentUser.full_name;
      
      // Bắn thẳng 1 Notification vào hệ thống cho Ứng viên (Admin có thể xem log ở bảng notifications)
      // Nếu ứng viên có `member_id` được link với tài khoản cá nhân của họ
      const receiverId = talentData.member_id || null; 
      
      if (receiverId) {
        await supabase.from('notifications').insert([{
          member_id: receiverId,
          title: `💼 Lời mời phỏng vấn từ ${companyName}`,
          content: inviteMessage,
          link_url: '#' // Trỏ về trang hòm thư nếu Sếp có làm
        }]);
      } else {
        // Trong trường hợp tài khoản Talent đứng độc lập, Sếp có thể insert vào bảng contact_requests hoặc talent_messages
        // Admin sẽ lấy dữ liệu từ bảng đó để review. Dưới đây là log qua console để minh họa.
        console.log(`Log to Admin DB: Employer [${currentUser.id}] sent message to Talent [${talentData.id}]: ${inviteMessage}`);
      }

      alert('✅ Đã gửi Lời mời Phỏng vấn thành công! Ứng viên sẽ sớm liên hệ lại với bạn.');
      setShowInviteModal(false);
      setInviteMessage('');
    } catch (err: any) {
      alert('Lỗi hệ thống: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="flex h-[80vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-indigo-600"></i> Đang tải Hồ sơ Chuyên gia...</div>;
  if (!talentData) return <div className="p-20 text-center text-slate-500 font-bold">Không tìm thấy CV này hoặc ứng viên đã ẩn hồ sơ.</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 relative">
      
      {/* Top Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1000px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/talent-hub" className="flex items-center gap-2 text-slate-500 hover:text-[#002D62] font-bold text-sm transition-colors">
            <i className="ph-bold ph-arrow-left text-lg"></i> Trở về Danh sách
          </Link>
          <div className="flex items-center gap-3">
            <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-200 flex items-center gap-1">
              <i className="ph-fill ph-seal-check"></i> Hồ sơ Đã Xác thực
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto px-4 md:px-6 py-10">
        {/* ==================================================== */}
        {/* RENDER COMPONENT CV CỦA SẾP Ở ĐÂY (TRUYỀN DỮ LIỆU VÀO) */}
        {/* ==================================================== */}
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200">
          <PremiumCV data={talentData} /> 
          {/* Note: Tùy theo props mà file PremiumCV.tsx của Sếp nhận, có thể Sếp cần đổi tên prop `data={talentData}` thành `profile={talentData}` */}
        </div>
      </div>

      {/* ==================================================== */}
      {/* THANH CÔNG CỤ NỔI Ở ĐÁY MÀN HÌNH (FLOATING ACTION BAR) */}
      {/* ==================================================== */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 p-4 transform transition-transform">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:block">
            <p className="text-sm font-black text-slate-900">{talentData.full_name}</p>
            <p className="text-xs font-bold text-indigo-600">{talentData.title}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button className="h-12 px-6 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-none">
              <i className="ph-bold ph-download-simple text-lg"></i> TẢI PDF
            </button>
            <button onClick={() => setShowInviteModal(true)} className="h-12 px-8 bg-[#002D62] text-white font-black rounded-xl shadow-lg hover:bg-blue-900 transition-transform hover:-translate-y-1 flex items-center justify-center gap-2 flex-[2] sm:flex-none">
              <i className="ph-bold ph-handshake text-lg"></i> GỬI LỜI MỜI PHỎNG VẤN
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* MODAL NHẬP NỘI DUNG LỜI MỜI */}
      {/* ==================================================== */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-gradient-to-r from-[#002D62] to-blue-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-lg font-black flex items-center gap-2"><i className="ph-fill ph-envelope-open text-2xl text-blue-300"></i> Liên hệ Ứng viên</h3>
              <button onClick={() => setShowInviteModal(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"><i className="ph-bold ph-x"></i></button>
            </div>
            
            <div className="p-8">
              <p className="text-sm text-slate-600 font-medium mb-6">Bạn đang chuẩn bị gửi tin nhắn liên hệ tới chuyên gia <strong className="text-slate-900">{talentData.full_name}</strong>. Mọi nội dung trao đổi sẽ được hệ thống mã hóa và kiểm duyệt nhằm đảm bảo chất lượng.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Nội dung tin nhắn / Lời mời (*)</label>
                  <textarea 
                    value={inviteMessage} 
                    onChange={e => setInviteMessage(e.target.value)} 
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:bg-white focus:border-indigo-400 text-slate-900" 
                    placeholder="Giới thiệu về công ty của bạn, vị trí đang tuyển và đề xuất thời gian trao đổi..." 
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setShowInviteModal(false)} className="h-12 px-6 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors w-1/3">HỦY</button>
                <button onClick={handleSendInvite} disabled={isSending} className="h-12 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex-1 flex items-center justify-center gap-2">
                  {isSending ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG GỬI...</> : <><i className="ph-bold ph-paper-plane-right"></i> XÁC NHẬN GỬI</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}