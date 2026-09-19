'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MemberDirectoryPage() {
  const [supabase] = useState(() => createClient());
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const UPGRADE_URL = "/upgrade";

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('individuals')
          .select('id, individual_tiers!individuals_tier_id_fkey(name, code)')
          .eq('user_auth_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        if (profile) {
          const tierCode = Array.isArray(profile.individual_tiers) 
            ? profile.individual_tiers[0]?.code 
            : (profile.individual_tiers as any)?.code;
          setCurrentUser({ ...profile, tier_code: tierCode });
        } else {
          setCurrentUser({ tier_code: 'VIP', is_admin: true });
        }

        const { data: directoryData, error: dirError } = await supabase
          .from('individuals')
          .select(`
            id, full_name, email, phone, role_in_company,
            individual_tiers!individuals_tier_id_fkey(name, code),
            corporates(id, name, tax_code, details, corporate_domains(name))
          `)
          .eq('status', 'ACTIVE');

        if (dirError) throw dirError;

        if (directoryData) {
          const sortedData = directoryData.sort((a, b) => {
            const tierA = Array.isArray(a.individual_tiers) ? a.individual_tiers[0]?.code : (a.individual_tiers as any)?.code;
            const tierB = Array.isArray(b.individual_tiers) ? b.individual_tiers[0]?.code : (b.individual_tiers as any)?.code;
            const score = { 'VIP': 4, 'TITANIUM': 3, 'GOLD': 2, 'STANDARD': 1, 'PUBLIC': 0 };
            return (score[tierB as keyof typeof score] || 0) - (score[tierA as keyof typeof score] || 0);
          });
          setMembers(sortedData);
        }
      } catch (err: any) {
        setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và tải lại trang.');
      } finally {
        setLoading(false);
      }
    };

    fetchDirectory();
  }, [supabase, router]);

  const filteredMembers = members.filter(m => 
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (m.corporates?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canViewContact = (tierCode: string) => ['PREMIUM', 'TITANIUM', 'VIP', 'GOLD'].includes(tierCode);

  if (errorMsg) return (
    <div className="flex flex-col h-[60vh] items-center justify-center text-center"><i className="ph-fill ph-warning-circle text-5xl text-rose-500 mb-4"></i><p className="text-slate-600 font-bold mb-4">{errorMsg}</p><button onClick={() => window.location.reload()} className="px-6 py-2 bg-[#002D62] text-white rounded-xl font-bold">Tải lại trang</button></div>
  );

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center text-slate-400 font-bold"><i className="ph-bold ph-spinner animate-spin text-3xl mr-3 text-[#002D62]"></i> Đang tải Mạng lưới...</div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-10 animate-in fade-in duration-500 pb-24">
      
      <div className="bg-gradient-to-r from-[#002D62] to-blue-900 p-8 md:p-12 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 max-w-2xl text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">Mạng lưới Đối tác NKBA</h1>
          <p className="text-blue-200 font-medium leading-relaxed">Tra cứu danh bạ doanh nghiệp, kết nối trực tiếp với các nhà thầu, chủ đầu tư và chuyên gia uy tín trong hệ sinh thái Việt - Nhật.</p>
        </div>
        
        <div className="relative z-10 w-full md:w-96 shrink-0">
          <div className="relative">
            <i className="ph-bold ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
            <input 
              type="text" 
              placeholder="Tìm kiếm công ty, hội viên..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-blue-300 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 transition-all outline-none backdrop-blur-md font-bold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMembers.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">Không tìm thấy hội viên nào khớp với từ khóa "{searchQuery}".</div>
        ) : (
          filteredMembers.map(member => {
            const tierName = Array.isArray(member.individual_tiers) ? member.individual_tiers[0]?.name : member.individual_tiers?.name;
            const tierCode = Array.isArray(member.individual_tiers) ? member.individual_tiers[0]?.code : member.individual_tiers?.code;
            const isHighTier = ['VIP', 'TITANIUM', 'GOLD'].includes(tierCode);
            const corp = member.corporates;

            return (
              <div key={member.id} className={`bg-white border rounded-[2rem] p-6 flex flex-col hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden ${isHighTier ? 'border-amber-200 shadow-lg shadow-amber-500/5' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300'}`}>
                
                {isHighTier && <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>}

                <div className="flex items-start gap-4 mb-5 relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 shadow-inner ${isHighTier ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    {corp?.name ? corp.name.charAt(0) : member.full_name.charAt(0)}
                  </div>
                  <div>
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded border uppercase tracking-widest inline-block mb-1.5 ${isHighTier ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {tierName} {isHighTier && '👑'}
                    </span>
                    <h3 className="font-black text-slate-900 leading-tight line-clamp-2">{corp?.name || 'Thành viên Độc lập'}</h3>
                  </div>
                </div>

                <div className="mb-4 relative z-10">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Đại diện</p>
                  <p className="text-sm font-bold text-[#002D62] flex items-center gap-1.5">
                    <i className="ph-fill ph-user-circle"></i> {member.full_name} {member.role_in_company ? `(${member.role_in_company})` : ''}
                  </p>
                </div>

                {/* SỬA TẠI ĐÂY: Dùng Link thay cho button gọi Modal */}
                <Link 
                  href={`/directory/${member.id}`} 
                  className="mb-5 w-full py-2.5 bg-slate-50 border border-slate-200 text-[#002D62] text-xs font-black rounded-xl hover:bg-[#002D62] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <i className="ph-bold ph-arrow-square-out"></i> XEM TRANG DOANH NGHIỆP
                </Link>

                <div className="mt-auto pt-5 border-t border-slate-100 relative z-10">
                  {canViewContact(currentUser?.tier_code) ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2"><i className="ph-bold ph-envelope-simple text-blue-500"></i> {member.email || 'Chưa cập nhật'}</p>
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2"><i className="ph-bold ph-phone text-emerald-500"></i> {member.phone || 'Chưa cập nhật'}</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-400">
                        <i className="ph-fill ph-lock-key text-xl"></i>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Ẩn Liên Hệ</span>
                      </div>
                      <Link href={UPGRADE_URL} className="text-[10px] font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors uppercase inline-block">Nâng cấp</Link>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}