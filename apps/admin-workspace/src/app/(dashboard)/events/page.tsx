// src/app/(dashboard)/events/page.tsx
'use client';

import Link from 'next/link';

export default function EventsManagementPage() {
  // Giả lập dữ liệu sự kiện (Sau này sẽ fetch từ Supabase)
  const mockEvents = [
    {
      id: '1',
      event_code: 'NKBA-LAUNCH-2026',
      title: 'Lễ Ra Mắt Liên Minh NKBA',
      status: 'PUBLISHED',
      event_date: '2026-08-01T16:30:00',
      guests_count: 12,
      capacity: 30,
    }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Quản lý Sự kiện</h1>
          <p className="text-slate-500 text-sm mt-1">Tạo và theo dõi chiến dịch khách mời cho các sự kiện của NKBA.</p>
        </div>
        <Link 
          href="/events/create" 
          className="bg-[#002D62] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-900 transition-colors shadow-sm flex items-center gap-2"
        >
          <i className="ph-bold ph-plus"></i> Tạo sự kiện mới
        </Link>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
          <input 
            type="text" 
            placeholder="Tìm kiếm sự kiện theo tên hoặc mã..." 
            className="w-full h-11 pl-11 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:border-[#002D62] outline-none"
          />
        </div>
        <select className="h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-[#002D62]">
          <option value="ALL">Tất cả trạng thái</option>
          <option value="PUBLISHED">Đang diễn ra (Published)</option>
          <option value="DRAFT">Bản nháp (Draft)</option>
        </select>
      </div>

      {/* DANH SÁCH SỰ KIỆN */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Mã sự kiện</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Tên sự kiện</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Thời gian</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-center">Khách mời</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Trạng thái</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockEvents.map((event) => (
              <tr key={event.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-600">{event.event_code}</td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-900">{event.title}</span>
                </td>
                <td className="px-6 py-4 text-slate-600">
                  {new Date(event.event_date).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="font-bold text-[#002D62]">{event.guests_count}</span>
                  <span className="text-slate-400"> / {event.capacity}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {event.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link 
                    href={`/events/${event.id}`}
                    className="text-[#002D62] font-bold hover:underline flex items-center justify-end gap-1"
                  >
                    Quản lý <i className="ph-bold ph-arrow-right"></i>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}