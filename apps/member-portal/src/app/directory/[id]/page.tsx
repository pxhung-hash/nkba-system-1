'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function CorporateLandingPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null); // Người ĐANG XEM
  const [profile, setProfile] = useState<any>(null); // Người ĐƯỢC XEM
  const [corporate, setCorporate] = useState<any>(null);

  // States cho tính năng Kết nối (Networking)
  const [connectionStatus, setConnectionStatus] = useState<'NONE' | 'PENDING' | 'CONNECTED'>('NONE');
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  const UPGRADE_URL = "/upgrade";

  useEffect(() => {
    const fetchProfileDetail = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Lấy thông tin người ĐANG XEM trang này
        let viewerId = null;
        if (user) {
          const { data: myProfile } = await supabase.from('individuals').select('id, full_name, individual_tiers!individuals_tier_id_fkey(code)').eq('user_auth_id', user.id).single();
          if (myProfile) {
            viewerId = myProfile.id;
            const tierCode = Array.isArray(myProfile.individual_tiers) ? myProfile.individual_tiers[0]?.code : (myProfile.individual_tiers as any)?.code;
            setCurrentUser({ id: viewerId, full_name: myProfile.full_name, tier_code: tierCode });
          } else {
            setCurrentUser({ id: 'admin', tier_code: 'VIP' }); // Admin fallback
          }
        }

        // 2. Lấy thông tin Doanh nghiệp/Hội viên ĐƯỢC BẤM VÀO
        const memberId = params.id as string;
        if (!memberId) return;

        const { data: memberData, error } = await supabase
          .from('individuals')
          .select(`
            id, full_name, email, phone, role_in_company,
            individual_tiers!individuals_tier_id_fkey(name, code),
            corporates(id, name, tax_code, details, corporate_domains(name))
          `)
          .eq('id', memberId)
          .single();

        if (error) throw error;
        
        setProfile(memberData);
        setCorporate(memberData.corporates);

        // 3. KIỂM TRA TRẠNG THÁI KẾT NỐI (Nếu người xem không phải là chủ trang)
        if (viewerId && viewerId !== memberId) {
          const { data: connData } = await supabase
            .from('connections')
            .select('status')
            .or(`and(requester_id.eq.${viewerId},receiver_id.eq.${memberId}),and(requester_id.eq.${memberId},receiver_id.eq.${viewerId})`)
            .maybeSingle();

          if (connData) {
            setConnectionStatus(connData.status);
          }
        } else if (viewerId === memberId) {
          // Báo cho UI biết đây là trang của chính mình
          setConnectionStatus('CONNECTED'); 
        }

      } catch (err) {
        console.error('Lỗi tải dữ liệu doanh nghiệp:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileDetail();
  }, [params.id, supabase]);

  // ==========================================
  // HÀM GỬI LỜI MỜI KẾT NỐI (NETWORKING)
  // ==========================================
  const handleSendConnection = async () => {
    if (!currentUser || currentUser.id === 'admin') {
      return alert('Vui lòng đăng nhập bằng tài khoản Hội viên để sử dụng tính năng này.');
    }
    
    if (currentUser.id === profile.id) {
      return alert('Sếp đang tự bấm kết nối với chính mình đấy ạ! 😄');
    }

    setIsSendingRequest(true);
    try {
      // 1. Lưu vào bảng connections
      const { error: connErr } = await supabase.from('connections').insert([{
        requester_id: currentUser.id,
        receiver_id: profile.id,
        status: 'PENDING'
      }]);

      if (connErr) throw connErr;

      // 2. Bắn Notification cho người nhận
      const { error: notiErr } = await supabase.from('notifications').insert([{
        member_id: profile.id,
        title: '🤝 Lời mời kết nối mới!',
        content: `Hội viên ${currentUser.full_name} muốn kết nối với bạn trên NKBA.`,
        link_url: `/network/connections` // Sau này Sếp làm trang quản lý lời mời thì trỏ link vào đây
      }]);

      if (notiErr) console.warn("Lỗi gửi thông báo:", notiErr);

      setConnectionStatus('PENDING');
      alert('✅ Đã gửi lời mời kết nối thành công! Vui lòng chờ đối tác xác nhận.');

    } catch (err: any) {
      if (err.code === '23505') {
        alert('Lời mời đã được gửi trước đó rồi. Đang chờ phản hồi!');
        setConnectionStatus('PENDING');
      } else {
        alert('Lỗi hệ thống: ' + err.message);
      }
    } finally {
      setIsSendingRequest(false);
    }
  };

  const canViewContact = (tierCode: string) => ['PREMIUM', 'TITANIUM', 'VIP', 'GOLD'].includes(tierCode);

  if (loading) {
    return <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-[#002D62]"></i> Đang nạp không gian doanh nghiệp...</div>;
  }

  if (!profile) {
    return <div className="p-20 text-center text-slate-500 font-bold">Không tìm thấy hồ sơ doanh nghiệp này.</div>;
  }

  const isHighTier = ['VIP', 'TITANIUM', 'GOLD'].includes(Array.isArray(profile.individual_tiers) ? profile.individual_tiers[0]?.code : profile.individual_tiers?.code);
  const details = corporate?.details || {};
  const products = details.products || [];
  const projects = details.projects || [];
  const isMe = currentUser?.id === profile.id; // Kiểm tra xem có phải đang tự xem trang mình không

  return (
    <div className="bg-[#F8FAFC] min-h-screen pb-24 animate-in fade-in duration-500">
      
      {/* 1. HERO BANNER COVER */}
      <div className={`w-full h-[250px] md:h-[350px] relative flex items-end ${isHighTier ? 'bg-gradient-to-tr from-amber-600 to-yellow-400' : 'bg-gradient-to-tr from-[#002D62] to-blue-800'}`}>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-8 relative z-10">
          <Link href="/directory" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-bold text-sm mb-6 bg-black/20 px-4 py-2 rounded-xl backdrop-blur-sm transition-colors">
            <i className="ph-bold ph-arrow-left"></i> Quay lại Mạng lưới
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-3xl flex items-center justify-center text-4xl md:text-5xl font-black text-[#002D62] shadow-2xl border-4 border-white/20">
              {corporate?.name ? corporate.name.charAt(0) : profile.full_name.charAt(0)}
            </div>
            <div className="text-white pb-2">
              <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase mb-2 backdrop-blur-md ${isHighTier ? 'bg-amber-900/40 border border-amber-400/30' : 'bg-white/20 border border-white/30'}`}>
                {corporate?.corporate_domains?.name || 'Hội viên'} {isHighTier && '👑'}
              </span>
              <h1 className="text-3xl md:text-5xl font-black drop-shadow-md leading-tight">{corporate?.name || 'Thành viên Độc lập'}</h1>
              {corporate?.tax_code && <p className="text-white/80 font-mono mt-2 font-bold"><i className="ph-fill ph-tag"></i> MST: {corporate.tax_code}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI (NỘI DUNG CHÍNH) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ABOUT US */}
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-[#002D62] rounded-full flex items-center justify-center"><i className="ph-fill ph-buildings text-xl"></i></div> Về chúng tôi
              </h3>
              <p className="text-slate-600 leading-loose whitespace-pre-wrap font-medium text-sm md:text-base">
                {details.about_us || 'Doanh nghiệp này chưa cập nhật thông tin giới thiệu.'}
              </p>
              {details.website && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <a href={details.website.startsWith('http') ? details.website : `https://${details.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-50 border border-slate-200 text-[#002D62] font-bold rounded-xl hover:bg-[#002D62] hover:text-white transition-colors">
                    <i className="ph-bold ph-globe"></i> Truy cập Website chính thức
                  </a>
                </div>
              )}
            </div>

            {/* SẢN PHẨM & DỊCH VỤ */}
            {products.length > 0 && (
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center"><i className="ph-fill ph-package text-xl"></i></div> Sản phẩm & Dịch vụ cốt lõi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {products.map((prod: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden group hover:shadow-md transition-all hover:border-amber-200">
                      {prod.image ? (
                        <div className="h-48 overflow-hidden"><img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                      ) : (
                        <div className="h-32 bg-slate-100 flex items-center justify-center"><i className="ph-duotone ph-image text-4xl text-slate-300"></i></div>
                      )}
                      <div className="p-5">
                        <h4 className="font-black text-slate-900 mb-2">{prod.name}</h4>
                        <p className="text-sm text-slate-600 line-clamp-3">{prod.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DỰ ÁN TIÊU BIỂU */}
            {projects.length > 0 && (
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><i className="ph-fill ph-hard-hat text-xl"></i></div> Dự án tiêu biểu
                </h3>
                <div className="space-y-6">
                  {projects.map((proj: any, idx: number) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-5 bg-slate-50 p-5 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-lg transition-all hover:border-emerald-200">
                      {proj.image ? (
                        <div className="w-full sm:w-40 h-40 shrink-0 rounded-xl overflow-hidden"><img src={proj.image} alt={proj.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                      ) : (
                        <div className="w-full sm:w-40 h-40 shrink-0 bg-slate-200 rounded-xl flex items-center justify-center"><i className="ph-duotone ph-buildings text-4xl text-slate-400"></i></div>
                      )}
                      <div className="flex-1 py-2">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-1 rounded uppercase tracking-widest">{proj.year}</span>
                          <span className="text-xs font-bold text-slate-500"><i className="ph-fill ph-user-focus"></i> {proj.role}</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 mb-2">{proj.name}</h4>
                        <p className="text-sm text-slate-600">{proj.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* CỘT PHẢI (THÔNG TIN LIÊN HỆ - STICKY) */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:sticky lg:top-28">
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-4 mb-6 uppercase tracking-widest">Kênh Liên hệ</h3>
              
              <div className="flex items-center gap-4 mb-8 bg-blue-50/50 p-4 rounded-2xl border border-blue-100 relative overflow-hidden">
                {isMe && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[8px] font-black px-2 py-1 rounded-bl-lg uppercase tracking-widest">Hồ sơ của bạn</div>}
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#002D62] text-xl font-black shadow-sm shrink-0 border border-blue-100">
                  {profile.full_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Người đại diện</p>
                  <p className="font-black text-slate-900">{profile.full_name}</p>
                  {profile.role_in_company && <p className="text-xs text-blue-600 font-bold">{profile.role_in_company}</p>}
                </div>
              </div>

              {canViewContact(currentUser?.tier_code) ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0"><i className="ph-fill ph-phone-call text-lg"></i></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Điện thoại</p>
                      <p className="font-bold text-slate-800">{profile.phone || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0"><i className="ph-fill ph-envelope-simple text-lg"></i></div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Email</p>
                      <p className="font-bold text-slate-800 truncate">{profile.email || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                  
                  {/* LOGIC NÚT KẾT NỐI (NETWORKING) */}
                  <div className="mt-6">
                    {isMe ? (
                       <Link href="/account" className="w-full h-14 bg-slate-100 text-slate-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                         <i className="ph-bold ph-pencil-simple"></i> Sửa hồ sơ của tôi
                       </Link>
                    ) : connectionStatus === 'CONNECTED' ? (
                      <button disabled className="w-full h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl font-black flex items-center justify-center gap-2 cursor-default">
                        <i className="ph-bold ph-handshake text-xl"></i> ĐÃ KẾT NỐI
                      </button>
                    ) : connectionStatus === 'PENDING' ? (
                      <button disabled className="w-full h-14 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl font-black flex items-center justify-center gap-2 cursor-default">
                        <i className="ph-bold ph-hourglass text-xl"></i> ĐANG CHỜ PHẢN HỒI...
                      </button>
                    ) : (
                      <button onClick={handleSendConnection} disabled={isSendingRequest} className="w-full h-14 bg-[#002D62] text-white rounded-xl font-black shadow-lg hover:bg-blue-900 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:translate-y-0">
                        {isSendingRequest ? <><i className="ph-bold ph-spinner animate-spin text-xl"></i> ĐANG GỬI...</> : <><i className="ph-bold ph-paper-plane-tilt text-xl"></i> GỬI LỜI MỜI KẾT NỐI</>}
                      </button>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100 relative overflow-hidden">
                  <i className="ph-duotone ph-lock-key text-5xl text-slate-300 mb-3"></i>
                  <h4 className="font-black text-slate-800 mb-2">Thông tin bị ẩn</h4>
                  <p className="text-xs text-slate-500 mb-6 px-4">Yêu cầu thẻ hạng cao cấp để xem trực tiếp thông tin liên hệ của đối tác.</p>
                  <Link href={UPGRADE_URL} className="w-full h-12 bg-amber-500 text-white rounded-xl font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                    NÂNG CẤP XEM LIÊN HỆ
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}