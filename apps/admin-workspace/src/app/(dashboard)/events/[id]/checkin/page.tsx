'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; 
import Link from 'next/link';

// ĐÃ XÓA import Html5Qrcode ở đây để chống sập Server-Side Rendering (SSR) của Next.js

function CheckinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams(); 
  
  const token = searchParams.get('token');
  const eventId = params.id as string;
  const supabase = createClient();

  // 👉 ĐÃ FIX: Đặt loading mặc định là true để chặn render sớm
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Dùng `any` cho Ref vì chúng ta sẽ import thư viện động
  const scannerRef = useRef<any>(null);

  // 1. Lắng nghe thay đổi Token để KIỂM TRA VÉ
  useEffect(() => {
    if (!token) {
      setResult({ status: 'STANDBY' });
      setLoading(false);
      return;
    }

    const verifyTicket = async () => {
      setLoading(true);
      const cleanToken = token.trim();
      
      // ĐÃ FIX: Kiểm tra xem mã quét được có phải là chuỗi UUID (ID của database) không
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);

      // Xây dựng câu truy vấn thông minh: Nếu là UUID thì tìm cột id, không thì tìm tracking_token
      let query = supabase
        .from('event_guests')
        .select('*')
        .eq('event_id', eventId);

      if (isUUID) {
        query = query.eq('id', cleanToken);
      } else {
        query = query.eq('tracking_token', cleanToken);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error("Lỗi tìm vé:", error);
        setResult({ success: false, message: `Không tìm thấy vé: ${cleanToken}` });
      } else if (data.rsvp_status === 'CHECKED_IN') {
        // Nếu đã check-in từ trước
        setResult({ success: true, code: 'ALREADY_CHECKED_IN', guest: data });
      } else {
        // ĐÃ FIX: Ép kiểu JSON cực kỳ an toàn NGAY TẠI ĐÂY, không làm sập giao diện UI
        let parsedInfo = data.guest_info;
        if (typeof parsedInfo === 'string') {
          try { parsedInfo = JSON.parse(parsedInfo); } 
          catch (e) { parsedInfo = {}; }
        }
        const safeData = { ...data, guest_info: parsedInfo || {} };

        if (safeData.rsvp_status === 'CHECKED_IN') {
          setResult({ success: true, code: 'ALREADY_CHECKED_IN', guest: safeData });
        } else {
          setResult({ success: true, code: 'READY', guest: safeData });
        }
      }
      setLoading(false);
    };

    verifyTicket();
  }, [token, eventId, supabase]);

  // 2. Kích hoạt Camera Quét QR 
  useEffect(() => {
    if (!isScanning) {
      // Dọn dẹp an toàn khi tắt
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
      return;
    }

    const startScanner = async () => {
      try {
        // ĐÃ FIX: Chỉ import thư viện Camera vào đúng lúc người dùng bấm mở trên trình duyệt Client
        const { Html5Qrcode } = await import('html5-qrcode');
        
        const html5QrCode = new Html5Qrcode("nkba-qr-reader");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Khi quét thành công: TẮT SCANNER NGAY LẬP TỨC
            if (scannerRef.current?.isScanning) {
              scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
            }
            
            setIsScanning(false);
            setLoading(true);

            let scannedToken = decodedText.trim();
            try {
              if (scannedToken.startsWith('http')) {
                const url = new URL(scannedToken);
                scannedToken = url.searchParams.get('token') || url.pathname.split('/').pop() || scannedToken;
              }
            } catch (e) {
              console.warn("QR không phải dạng URL chuẩn, lấy nguyên text.");
            }

            if (scannedToken) {
              router.push(`/events/${eventId}/checkin?token=${scannedToken}`);
            } else {
              setResult({ success: false, message: 'Mã QR rỗng hoặc không hợp lệ.' });
              setLoading(false);
            }
          },
          (error) => {}
        );
      } catch (err) {
        console.error("Lỗi khởi động camera:", err);
        alert("Không thể mở Camera. Vui lòng cấp quyền truy cập trình duyệt!");
        setIsScanning(false);
      }
    };

    setTimeout(startScanner, 100);

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(() => {});
      }
    };
  }, [isScanning, router, eventId]);

  // 3. HÀM GHI NHẬN CHECK-IN VÀO DATABASE
  const handleConfirmCheckin = async () => {
    if (!result?.guest?.id) return;
    setIsConfirming(true);

    const now = new Date().toISOString();
    const { error } = await supabase
      .from('event_guests')
      .update({ rsvp_status: 'CHECKED_IN', check_in_time: now })
      .eq('id', result.guest.id);

    if (error) {
      alert('Lỗi cập nhật hệ thống: ' + error.message);
    } else {
      // Đổi UI sang trạng thái Thành công
      setResult({
        ...result,
        code: 'SUCCESS',
        guest: { ...result.guest, rsvp_status: 'CHECKED_IN', check_in_time: now }
      });
    }
    setIsConfirming(false);
  };

  // 👉 ĐÃ FIX: CHUẨN HÓA LOGIC 2 NÚT NÀY
  const resetAndScanAgain = () => {
    // Ép Next.js xóa query ?token= trên URL (Không làm reload nguyên trang)
    router.replace(`/events/${eventId}/checkin`, { scroll: false }); 
    setResult({ status: 'STANDBY' });
    setTimeout(() => { setIsScanning(true); }, 150); 
  };

  const cancelToStandby = () => {
    router.replace(`/events/${eventId}/checkin`, { scroll: false }); 
    setResult({ status: 'STANDBY' });
    setIsScanning(false);
  };

  // ================= MÀN HÌNH ĐANG XỬ LÝ =================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <i className="ph-bold ph-spinner animate-spin text-5xl text-[#002D62]"></i>
        <p className="font-bold tracking-widest uppercase text-slate-500">Đang xử lý dữ liệu...</p>
      </div>
    );
  }

  // ================= MÀN HÌNH CAMERA QUÉT MÃ =================
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center py-10 max-w-md mx-auto animate-in zoom-in-95">
        <div className="w-full bg-white p-4 rounded-3xl shadow-lg border border-slate-200">
          <div className="flex justify-between items-center mb-4 px-2">
            <h2 className="font-black text-[#002D62]"><i className="ph-bold ph-scan"></i> Đưa mã QR vào khung</h2>
            <button onClick={() => setIsScanning(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 font-bold">
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
          <div id="nkba-qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37]"></div>
          <p className="text-center text-xs text-slate-400 mt-4 font-medium">
            Quét mã trên Thư mời điện tử hoặc Mã Code do NKBA cấp.
          </p>
        </div>
      </div>
    );
  }

  // ================= MÀN HÌNH CHỜ (STANDBY) =================
  if (result?.status === 'STANDBY') {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in">
        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center text-[#002D62] mb-6 border-4 border-blue-100">
          <i className="ph-bold ph-qr-code text-6xl"></i>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">CHẾ ĐỘ LỄ TÂN</h1>
        <p className="text-slate-500 text-center font-medium max-w-sm mb-8">
          Hệ thống đã sẵn sàng. Vui lòng bật Camera để Check-in khách mời VIP.
        </p>
        <button 
          onClick={() => setIsScanning(true)}
          className="px-8 py-4 bg-[#002D62] text-white font-black rounded-xl shadow-xl hover:bg-blue-900 transition-all flex items-center gap-3 text-lg"
        >
          <i className="ph-bold ph-camera"></i> BẤM ĐỂ MỞ CAMERA
        </button>
        <Link href={`/events/${eventId}`} className="mt-6 text-slate-400 hover:text-slate-600 font-bold underline">
          Quay lại quản lý sự kiện
        </Link>
      </div>
    );
  }

  // ================= MÀN HÌNH LỖI (VÉ SAI) =================
  // 👉 ĐÃ FIX: Chặn lỗi Cannot read properties of null
  if (!result || !result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-6 border-4 border-rose-200">
          <i className="ph-bold ph-x text-5xl"></i>
        </div>
        <h1 className="text-2xl font-black text-rose-600 mb-2">VÉ KHÔNG HỢP LỆ</h1>
        <p className="text-slate-500 text-center font-medium px-4">{result?.message || 'Không thể xác thực vé.'}</p>
        
        <div className="flex gap-4 mt-8">
          <button onClick={cancelToStandby} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
            Hủy bỏ
          </button>
          <button onClick={resetAndScanAgain} className="px-5 py-3 bg-[#002D62] text-white font-bold rounded-xl flex items-center gap-2">
            <i className="ph-bold ph-camera"></i> Quét lại
          </button>
        </div>
      </div>
    );
  }

  const guest = result.guest;

  // ================= MÀN HÌNH CHI TIẾT VÉ =================
  return (
    <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95">
      
      {/* 1. HIỂN THỊ ICON TƯƠNG ỨNG TRẠNG THÁI */}
      {result.code === 'READY' && (
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6 shadow-lg shadow-blue-500/30">
          <i className="ph-bold ph-identification-card text-5xl"></i>
        </div>
      )}
      {result.code === 'SUCCESS' && (
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/30">
          <i className="ph-bold ph-check text-5xl"></i>
        </div>
      )}
      {result.code === 'ALREADY_CHECKED_IN' && (
        <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-amber-500/30">
          <i className="ph-bold ph-warning text-5xl"></i>
        </div>
      )}

      {/* 2. TIÊU ĐỀ TRẠNG THÁI */}
      <h1 className={`text-2xl md:text-3xl font-black mb-1 text-center ${
        result.code === 'READY' ? 'text-[#002D62]' : 
        result.code === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'
      }`}>
        {result.code === 'READY' && 'XÁC NHẬN THÔNG TIN KHÁCH'}
        {result.code === 'SUCCESS' && 'CHECK-IN THÀNH CÔNG'}
        {result.code === 'ALREADY_CHECKED_IN' && 'KHÁCH NÀY ĐÃ VÀO CỬA TỪ TRƯỚC'}
      </h1>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 w-full max-w-md text-center mt-6">
        <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Thông tin Khách mời</p>
        
        {/* ĐÃ FIX: Đọc JSON trực tiếp, code sạch đẹp và không lo sập UI */}
        <h2 className="text-2xl font-black text-[#002D62] mb-1">
          {guest.salutation} {guest.guest_info?.name}
        </h2>
        <p className="text-slate-600 font-medium text-sm">
          {guest.guest_info?.company}
        </p>
        
        <div className="w-full border-t border-slate-100 my-5"></div>
        
        {guest.check_in_time && (
          <div className="text-sm text-slate-500 flex justify-between items-center bg-slate-50 p-3 rounded-xl mb-4">
            <span>Thời gian vào cửa:</span>
            <span className="font-bold text-slate-800">{new Date(guest.check_in_time).toLocaleTimeString('vi-VN')}</span>
          </div>
        )}

        <div className="text-sm text-slate-500 flex justify-between items-center bg-slate-50 p-3 rounded-xl">
          <span>Liên hệ:</span>
          <span className="font-bold text-slate-800">
             {guest.guest_info?.phone || '---'}
          </span>
        </div>
      </div>
      
      <div className="flex gap-4 mt-8">
        {result.code === 'READY' ? (
          <>
            <button onClick={resetAndScanAgain} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
              Hủy bỏ (Quét lại)
            </button>
            <button 
              onClick={handleConfirmCheckin}
              disabled={isConfirming}
              className="px-8 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isConfirming ? <><i className="ph-bold ph-spinner animate-spin text-xl"></i> ĐANG GHI NHẬN...</> : <><i className="ph-bold ph-check-circle text-xl"></i> XÁC NHẬN VÀO CỬA</>}
            </button>
          </>
        ) : (
          <>
            <button onClick={cancelToStandby} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
              Đóng lại
            </button>
            <button 
              onClick={resetAndScanAgain}
              className="px-8 py-3 bg-[#002D62] text-white font-black rounded-xl shadow-lg hover:bg-blue-900 transition-all flex items-center gap-2"
            >
              <i className="ph-bold ph-camera text-xl"></i> QUÉT KHÁCH TIẾP THEO
            </button>
          </>
        )}
      </div>

    </div>
  );
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <i className="ph-bold ph-spinner animate-spin text-4xl text-[#002D62]"></i>
      </div>
    }>
      <CheckinContent />
    </Suspense>
  );
}