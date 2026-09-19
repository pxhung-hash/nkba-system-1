// admin-workspace/src/app/(dashboard)/events/checkin/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { processCheckinAction } from '@/actions/checkin.actions';
import Link from 'next/link';
import { Html5Qrcode } from 'html5-qrcode';

function CheckinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);

  // 1. Lắng nghe thay đổi Token để gọi API Check-in
  useEffect(() => {
    if (!token) {
      setResult({ status: 'STANDBY' });
      setLoading(false);
      return;
    }

    setLoading(true);
    processCheckinAction(token).then((res) => {
      setResult(res);
      setLoading(false);
    });
  }, [token]);

  // 2. Kích hoạt Camera Quét QR khi bật chế độ isScanning
  useEffect(() => {
    if (!isScanning) return;

    // Sử dụng bộ lõi Html5Qrcode để ép quyền kiểm soát Camera
    const html5QrCode = new Html5Qrcode("nkba-qr-reader");

    // Lệnh khởi động Camera
    html5QrCode.start(
      { facingMode: "environment" }, // 👉 BẮT BUỘC DÙNG CAMERA MẶT SAU
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      (decodedText) => {
        // KHI QUÉT THÀNH CÔNG: Tắt camera an toàn và xử lý dữ liệu
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
          setIsScanning(false);
          setLoading(true);

          try {
            const url = new URL(decodedText);
            const scannedToken = url.searchParams.get('token');

            if (scannedToken) {
              router.push(`/events/checkin?token=${scannedToken}`);
            } else {
              setResult({ success: false, message: 'Mã QR không thuộc hệ thống NKBA.' });
              setLoading(false);
            }
          } catch (e) {
            setResult({ success: false, message: 'Định dạng mã QR không hợp lệ.' });
            setLoading(false);
          }
        }).catch((err) => console.error("Lỗi khi dừng camera", err));
      },
      (error) => {
        // Bỏ qua các cảnh báo dò khung hình trống
      }
    ).catch((err) => {
      console.error("Không thể khởi động camera mặt sau:", err);
      alert("Không thể mở Camera. Vui lòng cấp quyền truy cập Camera cho trình duyệt!");
      setIsScanning(false);
    });

    // Dọn dẹp bộ nhớ và tắt đèn Camera khi người dùng ấn nút [X] đóng đột ngột
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch((error) => console.error("Lỗi khi tắt Camera", error));
      }
    };
  }, [isScanning, router]);

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
          
          {/* Thẻ div chứa luồng video từ Camera */}
          <div id="nkba-qr-reader" className="w-full rounded-2xl overflow-hidden border-2 border-[#D4AF37]"></div>
          
          <p className="text-center text-xs text-slate-400 mt-4 font-medium">
            Hệ thống sẽ tự động nhận diện vé của khách mời.
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
        
        <Link href="/events" className="mt-6 text-slate-400 hover:text-slate-600 font-bold underline">
          Quay lại danh sách
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
        <p className="text-slate-500 text-center font-medium">{result.message}</p>
        
        <div className="flex gap-4 mt-8">
          <Link href="/events" className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
            Hủy bỏ
          </Link>
          <button onClick={() => { router.push('/events/checkin'); setIsScanning(true); }} className="px-5 py-3 bg-[#002D62] text-white font-bold rounded-xl flex items-center gap-2">
            <i className="ph-bold ph-camera"></i> Quét lại
          </button>
        </div>
      </div>
    );
  }

  const guest = result.guest;

  // ================= MÀN HÌNH THÀNH CÔNG HOẶC ĐÃ CHECK-IN TRƯỚC ĐÓ =================
  return (
    <div className="flex flex-col items-center justify-center py-10">
      
      {result.code === 'SUCCESS' ? (
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-500/30 animate-in zoom-in">
          <i className="ph-bold ph-check text-5xl"></i>
        </div>
      ) : (
        <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg shadow-amber-500/30">
          <i className="ph-bold ph-warning text-5xl"></i>
        </div>
      )}

      <h1 className={`text-2xl md:text-3xl font-black mb-1 text-center ${result.code === 'SUCCESS' ? 'text-emerald-600' : 'text-amber-600'}`}>
        {result.code === 'SUCCESS' ? 'CHECK-IN THÀNH CÔNG' : 'KHÁCH ĐÃ CHECK-IN'}
      </h1>
      <p className="text-slate-500 text-xs md:text-sm font-bold uppercase tracking-widest mb-8 text-center">{guest.events?.title}</p>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 w-full max-w-md text-center">
        <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Khách mời VIP</p>
        <h2 className="text-2xl font-black text-[#002D62] mb-1">{guest.salutation} {guest.guest_info?.name}</h2>
        <p className="text-slate-600 font-medium text-sm">
          {guest.guest_info?.position ? `${guest.guest_info.position} - ` : ''}{guest.guest_info?.company}
        </p>
        
        <div className="w-full border-t border-slate-100 my-5"></div>
        
        <div className="text-sm text-slate-500 flex justify-between items-center bg-slate-50 p-3 rounded-xl">
          <span>Thời gian vào cửa:</span>
          <span className="font-bold text-slate-800">{new Date(guest.check_in_time).toLocaleTimeString('vi-VN')}</span>
        </div>
      </div>
      
      <div className="flex gap-4 mt-8">
        <Link href="/events" className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2">
          Đóng
        </Link>
        <button 
          onClick={() => { router.push('/events/checkin'); setIsScanning(true); }}
          className="px-5 py-3 bg-[#002D62] text-white font-bold rounded-xl shadow-md hover:bg-blue-900 flex items-center gap-2"
        >
          <i className="ph-bold ph-camera"></i> Quét khách tiếp
        </button>
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