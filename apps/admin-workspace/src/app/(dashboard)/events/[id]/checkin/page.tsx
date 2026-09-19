'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // Dùng Supabase Client trực tiếp để chia làm 2 bước
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';

function CheckinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams(); 
  
  const token = searchParams.get('token');
  const eventId = params.id as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false); // Trạng thái nút bấm Xác nhận

  // 1. Lắng nghe thay đổi Token để KIỂM TRA VÉ (Chưa check-in vội)
  useEffect(() => {
    if (!token) {
      setResult({ status: 'STANDBY' });
      setLoading(false);
      return;
    }

    const verifyTicket = async () => {
      setLoading(true);
      
      // ĐÃ FIX: Chỉ select bảng hiện tại để tránh lỗi Join (events), và gài thêm event_id để bảo mật
      const { data, error } = await supabase
        .from('event_guests')
        .select('*')
        .eq('tracking_token', token.trim())
        .eq('event_id', eventId)
        .single();

      if (error || !data) {
        console.error("Lỗi tìm vé:", error);
        setResult({ success: false, message: 'Mã QR không tồn tại, hoặc vé này thuộc về một sự kiện khác!' });
      } else if (data.rsvp_status === 'CHECKED_IN') {
        // Nếu đã check-in từ trước
        setResult({ success: true, code: 'ALREADY_CHECKED_IN', guest: data });
      } else {
        // Vé hợp lệ, đang chờ bấm nút
        setResult({ success: true, code: 'READY', guest: data });
      }
      setLoading(false);
    };

    verifyTicket();
  }, [token, eventId, supabase]);

  // 2. Kích hoạt Camera Quét QR 
  useEffect(() => {
    if (!isScanning) return;

    const html5QrCode = new Html5Qrcode("nkba-qr-reader");

    html5QrCode.start(
      { facingMode: "environment" }, 
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      (decodedText) => {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          setIsScanning(false);
          setLoading(true);

          // ĐÃ FIX: Cải tiến bộ đọc QR (Chấp nhận cả URL Web lẫn Text mã vé thường)
          let scannedToken = '';
          try {
            const url = new URL(decodedText);
            scannedToken = url.searchParams.get('token') || '';
          } catch (e) {
            // Nếu QR không phải là URL (bị lỗi parse), lấy trực tiếp nội dung text làm Token
            scannedToken = decodedText.trim();
          }

          if (scannedToken) {
            router.push(`/events/${eventId}/checkin?token=${scannedToken}`);
          } else {
            setResult({ success: false, message: 'Không thể nhận diện mã QR này.' });
            setLoading(false);
          }
        }).catch((err) => console.error("Lỗi khi dừng camera", err));
      },
      (error) => {}
    ).catch((err) => {
      console.error("Lỗi khởi động camera:", err);
      alert("Không thể mở Camera. Vui lòng cấp quyền truy cập trình duyệt!");
      setIsScanning(false);
    });

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
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


  // ================= MÀN HÌNH ĐANG XỬ LÝ =================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <i className="ph-bold ph-spinner animate-spin text-5xl text-[#002D62]"></i>
        <p className="font-bold tracking-widest uppercase text-slate-500">Đang trích xuất dữ liệu vé...</p>
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
  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-6 border-4 border-rose-200">
          <i className="ph-bold ph-x text-5xl"></i>
        </div>
        <h1 className="text-2xl font-black text-rose-600 mb-2">VÉ KHÔNG HỢP LỆ</h1>
        <p className="text-slate-500 text-center font-medium px-4">{result.message}</p>
        
        <div className="flex gap-4 mt-8">
          <Link href={`/events/${eventId}/checkin`} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
            Hủy bỏ
          </Link>
          <button onClick={() => { router.push(`/events/${eventId}/checkin`); setIsScanning(true); }} className="px-5 py-3 bg-[#002D62] text-white font-bold rounded-xl flex items-center gap-2">
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
        {result.code === 'ALREADY_CHECKED_IN' && 'KHÁCH NÀY ĐÃ CHECK-IN TỪ TRƯỚC'}
      </h1>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 w-full max-w-md text-center mt-6">
        <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Thông tin Khách mời</p>
        <h2 className="text-2xl font-black text-[#002D62] mb-1">{guest.salutation} {guest.guest_info?.name}</h2>
        <p className="text-slate-600 font-medium text-sm">
          {guest.guest_info?.position ? `${guest.guest_info.position} - ` : ''}{guest.guest_info?.company}
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
          <span className="font-bold text-slate-800">{guest.guest_info?.phone || '---'}</span>
        </div>
      </div>
      
      {/* 4. HIỂN THỊ NÚT BẤM THEO TỪNG TRẠNG THÁI */}
      <div className="flex gap-4 mt-8">
        {result.code === 'READY' ? (
          <>
            <Link href={`/events/${eventId}/checkin`} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
              Hủy bỏ (Quét lại)
            </Link>
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
            <Link href={`/events/${eventId}/checkin`} className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
              Đóng lại
            </Link>
            <button 
              onClick={() => { router.push(`/events/${eventId}/checkin`); setIsScanning(true); }}
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
    <Suspense>
      <CheckinContent />
    </Suspense>
  );
}