'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';

export default function EventLiveBoardPage() {
  const params = useParams();
  const supabase = createClient();
  const [attendees, setAttendees] = useState<any[]>([]);

  useEffect(() => {
    const fetchLiveBoard = async () => {
      const { data } = await supabase
        .from('event_guests')
        .select('id, guest_info, networking_note, rsvp_status, check_in_time')
        .eq('event_id', params.id)
        .eq('rsvp_status', 'CHECKED_IN')
        .not('networking_note', 'is', null) 
        .order('check_in_time', { ascending: false }) // Cứ ai mới gửi/checkin lên trước
        .limit(12);

      if (data) setAttendees(data);
    };

    fetchLiveBoard(); 
    const interval = setInterval(fetchLiveBoard, 3000); // 3 giây quét DB 1 lần
    return () => clearInterval(interval);
  }, [params.id, supabase]);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans overflow-hidden relative">
      {/* HIỆU ỨNG NỀN ÁNH SÁNG */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#002D62] rounded-full blur-[150px] opacity-50"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-indigo-900 rounded-full blur-[150px] opacity-40"></div>
        <div className="absolute top-[20%] left-[40%] w-[30%] h-[30%] bg-amber-500 rounded-full blur-[200px] opacity-20"></div>
      </div>

      <div className="relative z-10 h-screen flex flex-col p-8">
        {/* HEADER */}
        <div className="flex justify-between items-center shrink-0 mb-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.3)]">
              <i className="ph-fill ph-handshake text-4xl text-[#002D62]"></i>
            </div>
            <div>
              <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-lg">NKBA Live Connections</h1>
              <p className="text-xl text-blue-200 font-medium mt-2 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span> Trực tiếp trên Bức tường Giao thương
              </p>
            </div>
          </div>
          <div className="text-right flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
            <i className="ph-bold ph-qr-code text-5xl text-white"></i>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-400">QUÉT MÃ TRÊN BÀN</p>
              <p className="text-lg font-bold text-white">Cập nhật Profile lên màn hình</p>
            </div>
          </div>
        </div>

        {/* LƯỚI KHÁCH MỜI */}
        <div className="flex-1 min-h-0">
          {attendees.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/30 animate-pulse">
              <i className="ph-duotone ph-broadcast text-[150px] mb-6"></i>
              <p className="text-3xl font-black uppercase tracking-widest">Đang chờ tín hiệu kết nối...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max h-full">
              {attendees.map((attendee, index) => (
                <div key={attendee.id} className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[2rem] shadow-2xl flex flex-col animate-in fade-in zoom-in slide-in-from-bottom-10" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#002D62] to-indigo-600 rounded-full flex items-center justify-center text-2xl font-black text-white border-2 border-white/20 shadow-inner shrink-0">
                      {attendee.guest_info?.name?.charAt(0) || 'G'}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-black text-white truncate">{attendee.guest_info?.name || 'Khách mời'}</h3>
                      <p className="text-sm font-bold text-amber-400 truncate uppercase tracking-wider">{attendee.guest_info?.company}</p>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-black/30 p-5 rounded-2xl border border-white/5 relative">
                    <i className="ph-fill ph-quotes text-3xl text-white/10 absolute top-3 left-3"></i>
                    <p className="text-base text-blue-50 font-medium leading-relaxed italic relative z-10 pl-4">
                      "{attendee.networking_note}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}