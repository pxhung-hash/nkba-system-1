// src/components/events/EInviteModal.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { QRCodeCanvas } from 'qrcode.react'; 

interface EInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  guests: any[];
}

export default function EInviteModal({ isOpen, onClose, event, guests }: EInviteModalProps) {
  const [activeGuest, setActiveGuest] = useState<any>(null);
  const [singleGuestId, setSingleGuestId] = useState(''); 
  const [status, setStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (singleGuestId) {
      const guest = guests.find(g => g.id === singleGuestId);
      setActiveGuest(guest || null);
    } else {
      setActiveGuest(null);
    }
  }, [singleGuestId, guests]);

  if (!isOpen) return null;

  const cleanFileName = (str: string) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-zA-Z0-9\s]/g, "")
              .trim().replace(/\s+/g, "_");
  };

  const generateRsvpUrl = (guest: any) => {
    if (!guest) return 'https://nkba.vn/su-kien';
    const token = guest.tracking_token || guest.id;
    return `https://nkba.vn/su-kien/rsvp?token=${token}`;
  };

  const exportSingle = async (type: 'pdf' | 'png', guestObj: any = null) => {
    if (!cardRef.current) return;
    
    const guestToPrint = guestObj || activeGuest;
    const displayName = guestToPrint?.guest_info?.name || 'Khách VIP';
    const fileName = `Thiep_Moi_${event?.event_code || 'NKBA'}_${cleanFileName(displayName)}`;

    if (!guestObj) setIsProcessing(true);

    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true, 
        backgroundColor: '#002D62',
        logging: false, 
      });

      if (type === 'png') {
        const imgUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = imgUrl;
        downloadLink.download = `${fileName}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } else if (type === 'pdf') {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const cardWidth = cardRef.current.offsetWidth;
        const cardHeight = cardRef.current.offsetHeight;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [cardWidth, cardHeight]
        });

        pdf.addImage(imgData, 'JPEG', 0, 0, cardWidth, cardHeight);
        pdf.save(`${fileName}.pdf`);
      }
    } catch (error) {
      console.error("Lỗi xuất file:", error);
      if(!guestObj) alert("Có lỗi kỹ thuật khi xuất file đồ họa. Vui lòng F5 trang và thử lại.");
    } finally {
      if (!guestObj) setIsProcessing(false);
    }
  };

  const exportBatch = async (type: 'pdf' | 'png') => {
    if (!guests || guests.length === 0) {
      alert("Sự kiện chưa có khách mời nào!");
      return;
    }

    setIsProcessing(true);

    for (let i = 0; i < guests.length; i++) {
      const guest = guests[i];
      const name = guest.guest_info?.name || 'Khách VIP';
      setStatus(`Đang tải ${i + 1}/${guests.length}: ${name}`);
      
      setActiveGuest(guest);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      try {
        await exportSingle(type, guest);
      } catch (error) {
        console.error(`Bỏ qua: ${name}`, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setStatus("Hoàn tất! 🎉");
    setTimeout(() => {
      setStatus('');
      setIsProcessing(false);
      setActiveGuest(null);
      setSingleGuestId('');
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Noto+Serif:ital,wght@0,400;0,700;1,400&display=swap');
      `}} />

      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl items-center lg:items-start justify-center my-auto">
        
        {/* ===================== THIỆP MỜI (CARD) ===================== */}
        <div 
          ref={cardRef}
          className="relative w-full max-w-[420px] h-[746px] overflow-hidden flex flex-col shrink-0 font-['Montserrat']"
          style={{
            backgroundImage: 'radial-gradient(circle at top right, #00408a, #002D62, #001a3b)',
            backgroundColor: '#002D62',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)'
          }}
        >
          {/* Nền Noise */}
          <div className="absolute inset-0 z-[1] pointer-events-none" 
               style={{ opacity: 0.05, backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} 
               data-html2canvas-ignore="true"></div>

          {/* Vòng tròn trang trí góc */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none" style={{ opacity: 0.2, transform: 'translate(2rem, -2rem)' }}>
            <div className="absolute top-1/2 left-1/2 w-[80%] h-[80%] rounded-full border-2" style={{ borderColor: 'rgba(255,255,255,0.05)', transform: 'translate(-50%, -50%)' }}></div>
            <div className="absolute top-1/2 left-1/2 w-[60%] h-[60%] rounded-full border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.05)', transform: 'translate(-50%, -50%)' }}></div>
          </div>

          <div className="absolute inset-3 border rounded-xl pointer-events-none z-10" style={{ borderColor: 'rgba(212,175,55,0.3)' }}></div>
          <div className="absolute inset-4 border rounded-lg pointer-events-none z-10" style={{ borderColor: 'rgba(212,175,55,0.1)' }}></div>

          <div className="relative z-20 flex-1 flex flex-col p-8 pt-10 pb-8 text-center h-full justify-between" style={{ color: '#ffffff' }}>
            
            {/* BLOCK 1: LOGO THƯƠNG HIỆU */}
            <div className="flex flex-col items-center">
              <div className="rounded-xl px-5 py-2.5 flex items-center justify-center mb-3 relative h-14" style={{ backgroundColor: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
                <img 
                  src="/logo-nkba.png" 
                  alt="NKBA Logo" 
                  className="h-full w-auto object-contain" 
                />
                <div className="absolute -bottom-1 w-1/2 h-1.5 rounded-full" style={{ backgroundColor: '#BE0027', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}></div>
              </div>
              <div className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1 mt-2" style={{ color: '#D4AF37', lineHeight: 1 }}>Thiệp mời Đặc quyền</div>
              <div className="h-px w-12 mx-auto" style={{ backgroundColor: 'rgba(212,175,55,0.5)' }}></div>
            </div>

            {/* BLOCK 2: TÊN SỰ KIỆN */}
            <div className="my-2">
              <h1 className="text-2xl font-black leading-tight tracking-wide uppercase mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                {event?.title || 'Lễ Ra Mắt'} <br/> 
                <span className="text-[10px] leading-snug block mt-2" style={{ color: '#F3E5AB', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                  Nichietsu Kensetsu Business Alliance
                </span>
              </h1>
              <p className="text-[10px] font-medium tracking-widest uppercase mt-3" style={{ color: '#bfdbfe', lineHeight: 1 }}>Connecting Trust - Building Value</p>
            </div>

            {/* BLOCK 3: TÊN KHÁCH MỜI */}
            <div className="border p-4 rounded-xl my-2 flex flex-col justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
              <p className="text-xs font-['Noto_Serif'] italic" style={{ color: '#bfdbfe', lineHeight: 1.2, marginBottom: '6px' }}>Trân trọng kính mời:</p>
              <h2 className="text-xl font-bold tracking-wide overflow-hidden whitespace-nowrap text-ellipsis" style={{ color: '#D4AF37', lineHeight: 1.5, paddingBottom: '6px' }}>
                Anh/Chị {activeGuest?.guest_info?.name || '[Tên Khách VIP]'}
              </h2>
              <div className="w-full h-px mt-1" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }}></div>
            </div>

            {/* BLOCK 4: THỜI GIAN, ĐỊA ĐIỂM & QR RSVP */}
            <div className="flex items-center justify-between px-2 my-2 border-t border-b py-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              <div className="space-y-3 text-left w-full">
                
                <div className="flex items-center gap-3.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border" style={{ backgroundColor: '#be002733', color: '#BE0027', borderColor: '#be00274d' }}>
                    <i className="ph-fill ph-clock text-base"></i>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: '#bfdbfe' }}>Thời gian</p>
                    <p className="text-xs font-bold mb-0.5" style={{ color: '#ffffff' }}>17:00</p>
                    <p className="text-[11px]" style={{ color: '#dbeafe' }}>
                      {event?.event_date ? new Date(event.event_date).toLocaleDateString('vi-VN') : 'Thứ Năm, 18/07/2026'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 mt-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 border mt-0.5" style={{ backgroundColor: '#d4af3733', color: '#D4AF37', borderColor: '#d4af3733' }}>
                    <i className="ph-fill ph-map-pin text-base"></i>
                  </div>
                  <div className="flex flex-col max-w-[140px]">
                    <p className="text-[11px] font-bold tracking-widest uppercase mb-0.5" style={{ color: '#bfdbfe' }}>Địa điểm</p>
                    <a 
                      href="https://maps.app.goo.gl/Qh7vLqqv9cHHtdDj7" 
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold block mb-0.5" 
                      style={{ color: '#ffffff', textDecoration: 'none' }}
                    >
                      {event?.details?.location || 'Việt Long House'}
                    </a>
                    <p className="text-[8.5px]" style={{ color: '#dbeafe', opacity: 0.85 }}>
                      Tòa A, Lô CT-21B P. Đoàn Văn Tập, KĐT Việt Hưng, Hà Nội
                    </p>
                  </div>
                </div>

              </div>

              <div className="flex flex-col items-center justify-center gap-1.5 pl-4 border-l shrink-0" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                <QRCodeCanvas bgColor="transparent" fgColor="#FFFFFF" level="H" size="{64}" value="{generateRsvpUrl(activeGuest)}"/>
                <p className="text-[8px] font-bold uppercase tracking-widest text-center mt-1" style={{ color: '#F3E5AB' }}>Xác nhận<br/>tham dự</p>
              </div>
            </div>

            {/* BLOCK 5: AGENDA */}
            <div className="my-2 text-left px-2">
              <p className="text-[11px] font-bold tracking-widest uppercase mb-3 text-center border-b pb-1.5" style={{ color: '#D4AF37', borderColor: '#d4af3733' }}>Agenda Sự kiện</p>
              
              <div className="space-y-3 relative ml-2">
                <div className="absolute inset-y-0 w-px" style={{ backgroundColor: 'rgba(255,255,255,0.2)', left: '4px' }}></div>
                
                <div className="relative pl-5 flex items-center mb-3">
                  <div className="absolute w-2.5 h-2.5 border-2 rounded-full" style={{ backgroundColor: '#002D62', borderColor: '#60A5FA', left: '0px' }}></div>
                  <p className="text-[11px] font-bold w-11 shrink-0" style={{ color: '#bfdbfe' }}>16:30</p>
                  <span className="text-[11px]" style={{ color: '#ffffff' }}>Đón khách & Welcome Drink</span>
                </div>
                <div className="relative pl-5 flex items-center mb-3">
                  <div className="absolute w-2.5 h-2.5 border-2 rounded-full" style={{ backgroundColor: '#002D62', borderColor: '#BE0027', left: '0px' }}></div>
                  <p className="text-[11px] font-bold w-11 shrink-0" style={{ color: '#bfdbfe' }}>17:15</p>
                  <span className="text-[11px]" style={{ color: '#ffffff' }}>Keynote & Giới thiệu NKBA</span>
                </div>
                <div className="relative pl-5 flex items-center">
                  <div className="absolute w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#D4AF37', boxShadow: '0 0 8px #D4AF37', left: '0px' }}></div>
                  <p className="text-[11px] font-bold w-11 shrink-0" style={{ color: '#D4AF37' }}>18:15</p>
                  <span className="text-[11px] font-bold" style={{ color: '#ffffff' }}>Tiệc nướng BBQ & Networking</span>
                </div>
              </div>
            </div>

            {/* BLOCK 6: FOOTER LIÊN HỆ & LANDING PAGE */}
            <div className="mt-auto pt-4 pb-2 flex flex-col px-2">
              <p className="text-[8px] font-bold uppercase tracking-widest text-left mb-2" style={{ color: '#bfdbfe', lineHeight: 1 }}>Chi tiết sự kiện và Liên hệ</p>
              
              <div className="flex items-center gap-6">
                <div className="shrink-0 flex items-center">
                  <QRCodeCanvas bgColor="transparent" fgColor="#FFFFFF" level="M" size="{52}" value="https://nkba.vn/su-kien"/>
                </div>

                <div className="w-px h-[52px] shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}></div>

                <div className="text-left flex flex-col justify-between h-[52px]">
                  <div className="flex items-center gap-2.5 text-[10px] font-medium tracking-wide" style={{ color: '#dbeafe' }}>
                    <i className="ph-fill ph-globe text-[12px]" style={{ color: '#D4AF37' }}></i> nkba.vn
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] font-medium tracking-wide" style={{ color: '#dbeafe' }}>
                    <i className="ph-fill ph-phone text-[12px]" style={{ color: '#D4AF37' }}></i> 034 259 6911
                  </div>
                  <div className="flex items-center gap-2.5 text-[10px] font-medium tracking-wide" style={{ color: '#dbeafe' }}>
                    <i className="ph-fill ph-envelope text-[12px]" style={{ color: '#D4AF37' }}></i> info@nkba.vn
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ===================== BẢNG ĐIỀU KHIỂN ===================== */}
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl text-white flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-black text-xl text-[#D4AF37] mb-1 flex items-center gap-2">
                <i className="ph-fill ph-magic-wand text-2xl"></i> Trình Xuất Thiệp VIP
              </h3>
              <p className="text-xs text-slate-400">Tạo file PDF/PNG với mã QR động cho từng khách mời.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <i className="ph-bold ph-x text-xl"></i>
            </button>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Dữ liệu hệ thống
              </label>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                Có sẵn {guests?.length || 0} khách mời
              </span>
            </div>
            <p className="text-[13px] text-slate-400 leading-relaxed">
              Hệ thống tự động đồng bộ khách mời, mã token độc nhất để xuất ra QR Code điểm danh.
            </p>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Xuất thiệp đơn lẻ
              </label>
            </div>
            
            <select 
              value={singleGuestId}
              onChange={(e) => setSingleGuestId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
            >
              <option value="">-- Chọn một khách mời --</option>
              {guests.map(g => (
                <option key={g.id} value={g.id}>{g.guest_info?.name || 'Khách không tên'}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => exportSingle('pdf')} 
                disabled={isProcessing || !singleGuestId}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <i className="ph-bold ph-file-pdf"></i> Tải PDF
              </button>
              <button 
                onClick={() => exportSingle('png')} 
                disabled={isProcessing || !singleGuestId}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-3 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <i className="ph-bold ph-image"></i> Tải PNG
              </button>
            </div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-4">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                3. Xuất toàn bộ danh sách:
              </label>
              {status && <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">{status}</span>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => exportBatch('pdf')} 
                disabled={isProcessing}
                className="w-full bg-[#BE0027] hover:bg-red-700 text-white font-bold py-3 px-3 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/20 disabled:opacity-50"
              >
                {isProcessing && !singleGuestId ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-stack"></i>} Xuất loạt PDF
              </button>
              <button 
                onClick={() => exportBatch('png')} 
                disabled={isProcessing}
                className="w-full bg-[#002D62] hover:bg-blue-900 text-white font-bold py-3 px-3 rounded-lg text-sm transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/20 disabled:opacity-50"
              >
                {isProcessing && !singleGuestId ? <i className="ph-bold ph-spinner animate-spin"></i> : <i className="ph-bold ph-images"></i>} Xuất loạt PNG
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}