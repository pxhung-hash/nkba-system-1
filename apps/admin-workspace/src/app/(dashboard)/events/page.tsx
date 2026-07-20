// src/app/(dashboard)/events/page.tsx
import Link from 'next/link';
import { createAdminClient } from '@nkba/supabase/client';

// 1. Hàm gọi dữ liệu trực tiếp trên Server (Server Component)
async function getEvents() {
  const supabase = createAdminClient();
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false }); // Mới nhất lên đầu

  if (error) {
    console.error('Lỗi khi lấy danh sách sự kiện:', error);
    return [];
  }
  return events || [];
}

export default async function EventsListPage() {
  // 2. Lấy dữ liệu
  const events = await getEvents();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý Sự kiện</h1>
          <p className="text-slate-500 text-sm mt-1">Danh sách các sự kiện và chiến dịch của NKBA.</p>
        </div>
        <Link 
          href="/events/create" 
          className="px-6 py-3 bg-[#002D62] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2"
        >
          <i className="ph-bold ph-plus"></i> Tạo sự kiện
        </Link>
      </div>

      {/* DANH SÁCH SỰ KIỆN */}
      {events.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm">
          <i className="ph-fill ph-calendar-blank text-4xl text-slate-300 mb-3"></i>
          <p className="text-slate-500 font-medium">Chưa có sự kiện nào được tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            
            /* 👇 ĐÂY LÀ PHẦN ĐÃ BỌC THẺ LINK LẤY UUID CHUẨN 👇 */
            <Link 
              href={`/events/${event.id}`} 
              key={event.id}
              className="group block bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#002D62] transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                  event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {event.status}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {event.event_code}
                </span>
              </div>
              
              <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-[#002D62] transition-colors line-clamp-2">
                {event.title}
              </h3>
              
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <i className="ph-fill ph-calendar-blank text-[#D4AF37]"></i> 
                  {event.event_date ? new Date(event.event_date).toLocaleDateString('vi-VN') : 'Chưa xếp lịch'}
                </p>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <i className="ph-fill ph-users text-[#D4AF37]"></i> 
                  Quy mô: {event.capacity} khách
                </p>
              </div>

              {/* Mũi tên giả lập nút "Xem chi tiết" hiện ra khi hover */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 text-[#002D62]">
                <i className="ph-bold ph-arrow-right text-xl"></i>
              </div>
            </Link>
            /* 👆 KẾT THÚC THẺ LINK 👆 */

          ))}
        </div>
      )}
    </div>
  );
}