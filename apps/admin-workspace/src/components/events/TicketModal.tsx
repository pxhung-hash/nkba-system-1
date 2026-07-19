// src/components/events/TicketModal.tsx
'use client';

import { QRCodeSVG } from 'qrcode.react';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest: any;
  event: any;
}

export default function TicketModal({ isOpen, onClose, guest, event }: TicketModalProps) {
  if (!isOpen || !guest || !event) return null;

  // Dữ liệu mã QR sẽ chứa Token của khách để sau này dùng máy quét (Scanner) check-in
  const checkInUrl = `https://nkba.vn/checkin?token=${guest.tracking_token}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      {/* Nền bấm để đóng Modal */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Thẻ Vé (Ticket Card) */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Phần Header Vé */}
        <div className="bg-[#002D62] p-6 text-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
          <p className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest mb-1">VIP INVITATION</p>
          <h2 className="text-xl font-black text-white">{event.title}</h2>
        </div>

        {/* Phần Thân Vé */}
        <div className="p-8 border-b-2 border-dashed border-slate-200 relative">
          {/* Nút cắt 2 bên viền vé */}
          <div className="absolute -left-4 bottom-[-16px] w-8 h-8 bg-slate-900/60 rounded-full"></div>
          <div className="absolute -right-4 bottom-[-16px] w-8 h-8 bg-slate-900/60 rounded-full"></div>

          <div className="text-center mb-8">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Kính mời</p>
            <h3 className="text-2xl font-black text-slate-900">{guest.guest_info.name}</h3>
            <p className="text-slate-600 font-medium mt-1">{guest.guest_info.position} - {guest.guest_info.company}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
            <div className="flex items-center gap-3">
              <i className="ph-fill ph-calendar-blank text-slate-400 text-lg"></i>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Thời gian</p>
                <p className="text-sm font-bold text-slate-800">{new Date(event.event_date).toLocaleString('vi-VN')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <i className="ph-fill ph-map-pin text-slate-400 text-lg"></i>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Địa điểm</p>
                <p className="text-sm font-bold text-slate-800">{event.details?.location || 'Đang cập nhật'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phần QR Code */}
        <div className="p-8 flex flex-col items-center justify-center bg-white">
          <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-sm mb-4">
            <QRCodeSVG 
              value={checkInUrl} 
              size={140}
              level={"H"} // Mức độ sửa lỗi cao nhất để dễ quét
              fgColor="#002D62"
            />
          </div>
          <p className="text-xs text-slate-400 text-center font-medium max-w-[250px]">
            Vui lòng xuất trình mã QR này tại quầy lễ tân để tiến hành Check-in tự động.
          </p>
        </div>

        {/* Nút thao tác dưới cùng */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
          >
            Đóng
          </button>
          <button 
            onClick={() => window.print()}
            className="flex-1 py-3 bg-[#002D62] text-white font-bold rounded-xl hover:bg-blue-900 shadow-lg shadow-blue-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <i className="ph-bold ph-download-simple"></i> Tải vé PDF
          </button>
        </div>

      </div>
    </div>
  );
}