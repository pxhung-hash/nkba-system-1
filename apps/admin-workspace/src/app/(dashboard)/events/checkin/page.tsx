// admin-workspace/src/app/(dashboard)/events/checkin/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { processCheckinAction } from '@/actions/checkin.actions';
import Link from 'next/link';

function CheckinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // NẾU KHÔNG CÓ TOKEN -> HIỂN THỊ MÀN HÌNH CHỜ (STANDBY)
    if (!token) {
      setResult({ status: 'STANDBY' });
      setLoading(false);
      return;
    }

    // CÓ TOKEN -> GỌI API KIỂM TRA
    processCheckinAction(token).then((res) => {
      setResult(res);
      setLoading(false);
    });
  }, [token]);

  // HÀM MỞ CAMERA ĐIỆN THOẠI ĐỂ QUÉT
  const handleOpenScanner = () => {
    // Gọi app Zalo hoặc Trình quét QR mặc định của HĐH
    window.location.href = 'intent://scan/#Intent;scheme=zxing;package=com.google.zxing.client.android;end';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <i className="ph-bold ph-spinner animate-spin text-5xl text-[#002D62]"></i>
        <p className="font-bold tracking-widest uppercase text-slate-500">Đang xử lý dữ liệu...</p>
      </div>
    );
  }

  // ================= MÀN HÌNH CHỜ (KHI LỄ TÂN VỪA BẤM NÚT VÀO) =================
  if (result.status === 'STANDBY') {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in">
        <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center text-[#002D62] mb-6 border-4 border-blue-100">
          <i className="ph-bold ph-qr-code text-6xl"></i>
        </div>
        <h1 className="text-2xl font-black text-slate-800 mb-2">CHẾ ĐỘ LỄ TÂN</h1>
        <p className="text-slate-500 text-center font-medium max-w-sm mb-8">
          Hệ thống đã sẵn sàng. Vui lòng sử dụng máy quét để Check-in khách mời VIP.
        </p>
        
        <button 
          onClick={handleOpenScanner}
          className="px-8 py-4 bg-[#002D62] text-white font-black rounded-xl shadow-xl hover:bg-blue-900 transition-all flex items-center gap-3 text-lg"
        >
          <i className="ph-bold ph-scan"></i> BẤM ĐỂ QUÉT VÉ
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
          <Link href="/events/checkin" className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50">
            Hủy bỏ
          </Link>
          <button onClick={handleOpenScanner} className="px-5 py-3 bg-[#002D62] text-white font-bold rounded-xl flex items-center gap-2">
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
        <Link href="/events/checkin" className="px-5 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 flex items-center gap-2">
          Đóng
        </Link>
        <button 
          onClick={handleOpenScanner}
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