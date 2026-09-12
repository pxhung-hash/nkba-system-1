// src/app/(dashboard)/events/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
// NKBA NOTE: Giả định Sếp đã tạo action deleteGuestAction và updateGuestAction trong fileactions
import { getEventDetails, deleteGuestAction } from '@/actions/event.actions'; 
import TicketModal from '@/components/events/TicketModal';
import AddGuestModal from '@/components/events/AddGuestModal';
// NKBA NOTE: Cần tạo component này để xử lý form sửa
import EditGuestModal from '@/components/events/EditGuestModal'; 
import EInviteModal from '@/components/events/EInviteModal';
import { sendRsvpEmailsAction } from '@/actions/email.actions';
import { toast } from 'react-hot-toast'; // NKBA NOTE: Khuyên dùng toast để thông báo đẹp hơn alert

export default function EventDetailPage() {
  const params = useParams();
  const eventId = params.id as string;

  // State dữ liệu thực tế
  const [event, setEvent] = useState<any>(null);
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSendingMail, setIsSendingMail] = useState(false);

  // State cho các Modal
  const [selectedGuest, setSelectedGuest] = useState<any>(null); // Dùng cho xem vé QR
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // --- NKBA ADDED: State cho chức năng Sửa ---
  const [guestToEdit, setGuestToEdit] = useState<any>(null);
  const [isEditGuestModalOpen, setIsEditGuestModalOpen] = useState(false);
  // ------------------------------------------

  // Hàm fetch dữ liệu từ Server Action
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getEventDetails(eventId);
      if (res.success) {
        setEvent(res.event);
        setGuests(res.guests || []);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error('Lỗi fetch dữ liệu sự kiện:', err);
      toast.error('Không thể tải dữ liệu sự kiện');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Thống kê số liệu thật từ DB
  const totalGuests = guests.length;
  const confirmedCount = guests.filter(g => g.rsvp_status === 'CONFIRMED').length;
  const pendingCount = guests.filter(g => g.rsvp_status === 'PENDING').length;
  const declinedCount = guests.filter(g => g.rsvp_status === 'DECLINED').length;

  const handleSendMassEmail = async () => {
    const isConfirmed = window.confirm(
      `Hệ thống sẽ gửi email thư mời đến tất cả khách hàng đang CHỜ PHẢN HỒI.\nAnh/chị có chắc chắn muốn thực hiện?`
    );
    if (!isConfirmed) return;

    setIsSendingMail(true);
    const loadingToast = toast.loading('Đang gửi email...');
    try {
      const res = await sendRsvpEmailsAction(eventId);

      if (res.success) {
        toast.success(`🎉 ${res.message}`, { id: loadingToast });
      } else {
        toast.error(`⚠️ Thông báo: ${res.message}`, { id: loadingToast });
      }
    } catch (error) {
      console.error('Lỗi gửi mail:', error);
      toast.error('❌ Đã có lỗi xảy ra khi kết nối máy chủ gửi mail.', { id: loadingToast });
    } finally {
      setIsSendingMail(false);
    }
  };

  const handleCopyRsvpLink = (guest: any) => {
    const token = guest.tracking_token || guest.id;
    // NKBA NOTE: Cần đổi domain theo môi trường deploy thực tế
    const domain = window.location.origin; 
    const rsvpLink = `${domain}/su-kien/rsvp?token=${token}`;
    navigator.clipboard.writeText(rsvpLink);
    toast.success(`Đã copy link RSVP của khách mời: ${guest.guest_info?.name}`);
  };

  // --- NKBA ADDED: Hàm xử lý Sửa và Xóa ---
  
  // 1. Mở modal sửa, truyền dữ liệu khách mời hiện tại vào
  const handleEditClick = (guest: any) => {
    setGuestToEdit(guest);
    setIsEditGuestModalOpen(true);
  };

  // 2. Xử lý xóa khách mời
  const handleDeleteGuest = async (guest: any) => {
    const guestName = guest.guest_info?.name || 'khách mời này';
    const isConfirmed = window.confirm(
      `Anh/chị có chắc chắn muốn XÓA khách mời "${guestName}" khỏi danh sách?\nHành động này không thể hoàn tác.`
    );

    if (!isConfirmed) return;

    try {
      // Gọi Server Action xóa
      const res = await deleteGuestAction(guest.id, eventId);

      if (res.success) {
        toast.success(`Đã xóa khách mời ${guestName}`);
        // Refresh lại danh sách mà không cần reload trang
        fetchData(); 
      } else {
        toast.error(`Lỗi: ${res.message}`);
      }
    } catch (error) {
      console.error('Lỗi khi xóa khách mời:', error);
      toast.error('❌ Đã có lỗi xảy ra khi xóa khách mời.');
    }
  };
  // ----------------------------------------

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <i className="ph-bold ph-spinner animate-spin text-3xl text-[#002D62]"></i>
        <p className="text-slate-400 text-sm font-medium">Đang tải dữ liệu chiến dịch...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center bg-white border rounded-3xl max-w-md mx-auto mt-20">
        <i className="ph-fill ph-warning-circle text-4xl text-rose-500 mb-3"></i>
        <h3 className="text-lg font-bold text-slate-800">Không tìm thấy sự kiện</h3>
        <p className="text-slate-500 text-sm mt-1 mb-4">Sự kiện có thể đã bị xóa hoặc đường dẫn không chính xác.</p>
        <Link href="/events" className="px-4 py-2 bg-[#002D62] text-white text-xs font-bold rounded-xl">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER OVERVIEW (Giữ nguyên) */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div class="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <Link href="/events" class="text-slate-400 hover:text-[#002D62] transition-colors">
                <i class="ph-bold ph-arrow-left text-xl"></i>
              </Link>
              <span class={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${
                event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {event.status}
              </span>
              <span class="text-sm font-mono font-bold text-slate-400">{event.event_code}</span>
            </div>
            <h1 class="text-3xl font-black text-slate-900 mb-2">{event.title}</h1>
            <p class="text-slate-600 font-medium flex items-center gap-2 text-sm">
              <i class="ph-fill ph-calendar-blank text-[#D4AF37]"></i> {event.event_date ? new Date(event.event_date).toLocaleString('vi-VN') : 'Chưa xếp lịch'}
              <span class="mx-2 text-slate-300">|</span>
              <i class="ph-fill ph-map-pin text-[#D4AF37]"></i> {event.details?.location || 'Chưa có địa điểm'}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0">
            <Link 
              href={`/events/${eventId}/edit`}
              class="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 hover:text-[#002D62] hover:border-[#002D62] transition-all shadow-sm flex items-center gap-2"
            >
              <i class="ph-bold ph-pencil-simple text-lg"></i> Chỉnh sửa n.dung
            </Link>

            <Link 
              href={`/events/${eventId}/checkin`} // NKBA FIX: Nên truyền eventId vào link checkin
              class="px-5 py-2.5 bg-[#002D62] border border-[#002D62] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-all shadow-md shadow-blue-900/20 flex items-center gap-2"
            >
              <i class="ph-bold ph-scan text-lg"></i> Chế độ Lễ tân
            </Link>
          </div>
        </div>
      </div>

      {/* STATS (Giữ nguyên) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ... các card thống kê giữ nguyên ... */}
      </div>

      {/* TABLE GUESTS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <i className="ph-fill ph-address-book text-[#002D62]"></i> Danh sách Khách mời
          </h2>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className="px-5 py-2 bg-gradient-to-r from-[#D4AF37] to-amber-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <i className="ph-bold ph-magic-wand"></i> Xuất Thiệp VIP
            </button>
            <button 
              onClick={() => setIsAddGuestModalOpen(true)}
              className="px-5 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 shadow-sm flex items-center gap-2"
            >
              <i className="ph-bold ph-user-plus"></i> Thêm khách mời
            </button>
            <button onClick={handleSendMassEmail} disabled={isSendingMail} className="px-5 py-2 bg-[#BE0027] text-white text-sm font-bold rounded-xl hover:bg-red-700 shadow-sm flex items-center gap-2 disabled:opacity-70">
              {isSendingMail ? <><i className="ph-bold ph-spinner animate-spin"></i> Đang xử lý...</> : <><i className="ph-bold ph-paper-plane-tilt"></i> Gửi Email RSVP</>}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {totalGuests === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">Chưa có khách mời nào tham gia sự kiện này.</div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-100 text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-[11px]">Khách mời</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px]">Doanh nghiệp</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px]">Liên hệ</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px]">Nguồn</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px]">Trạng thái</th>
                  <th className="px-6 py-4 font-bold uppercase text-[11px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {guests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-slate-50/80 transition-colors relative group">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {guest.salutation ? `${guest.salutation} ` : ''}{guest.guest_info?.name || '---'}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-700">{guest.guest_info?.company || '---'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{guest.guest_info?.position || '---'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-700">{guest.guest_info?.email || '---'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{guest.guest_info?.phone || '---'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md ${guest.source === 'IMPORTED' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                        {guest.source === 'IMPORTED' ? 'Admin' : 'Public'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {guest.rsvp_status === 'CONFIRMED' && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase rounded-full">Đã xác nhận</span>}
                      {guest.rsvp_status === 'PENDING' && <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[11px] font-bold uppercase rounded-full">Chờ phản hồi</span>}
                      {guest.rsvp_status === 'DECLINED' && <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[11px] font-bold uppercase rounded-full">Từ chối</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* NKBA STYLE: Nhóm các nút thao tác cơ bản lại gần nhau */}
                      <div className="flex items-center justify-end gap-1.5">
                        <button title="Copy Link RSVP" onClick={() => handleCopyRsvpLink(guest)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors">
                          <i className="ph-bold ph-link text-base"></i>
                        </button>
                        
                        {guest.rsvp_status === 'CONFIRMED' && (
                          <button title="Xem QR Ticket" onClick={() => { setSelectedGuest(guest); setIsModalOpen(true); }} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                            <i className="ph-bold ph-qr-code text-base"></i>
                          </button>
                        )}

                        {/* --- NKBA ADDED: Nút Sửa và Xóa --- */}
                        <div className="w-px h-4 bg-slate-200 mx-1"></div> {/* Thanh phân cách */}
                        
                        <button 
                          title="Sửa thông tin" 
                          onClick={() => handleEditClick(guest)} 
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600 flex items-center justify-center transition-colors"
                        >
                          <i className="ph-bold ph-pencil text-base"></i>
                        </button>
                        
                        <button 
                          title="Xóa khách mời" 
                          onClick={() => handleDeleteGuest(guest)} 
                          className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center transition-colors"
                        >
                          <i className="ph-bold ph-trash text-base"></i>
                        </button>
                        {/* ---------------------------------- */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ticket Modal Pop-up */}
      <TicketModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedGuest(null); }} guest={selectedGuest} event={event} />
    
      {/* Modal Thêm Khách Mời */}
      <AddGuestModal 
        isOpen={isAddGuestModalOpen} 
        onClose={() => { 
          setIsAddGuestModalOpen(false); 
          fetchData(); 
        }} 
        eventId={eventId} 
      />

      {/* --- NKBA ADDED: Modal Sửa Khách Mời --- */}
      <EditGuestModal
        isOpen={isEditGuestModalOpen}
        onClose={() => {
          setIsEditGuestModalOpen(false);
          setGuestToEdit(null);
        }}
        onSuccess={() => {
          setIsEditGuestModalOpen(false);
          setGuestToEdit(null);
          fetchData(); // Reload danh sách sau khi sửa thành công
        }}
        guest={guestToEdit}
        eventId={eventId}
      />
      {/* ------------------------------------------ */}

      {/* Modal Xuất Thiệp VIP */}
      <EInviteModal 
        isOpen={isInviteModalOpen} 
        onClose={() => setIsInviteModalOpen(false)} 
        event={event} 
        guests={guests} 
      />

    </div> 
  );
}