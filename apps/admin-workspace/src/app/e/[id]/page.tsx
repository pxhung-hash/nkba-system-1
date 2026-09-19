'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams } from 'next/navigation';

export default function GuestConnectPage() {
  const params = useParams();
  const supabase = createClient();
  
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [guest, setGuest] = useState<any>(null);
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFindTicket = async () => {
    if (!phone) return alert('Vui lòng nhập Số điện thoại!');
    setIsProcessing(true);
    
    const phoneClean = phone.trim().replace(/^0/, '');
    const { data, error } = await supabase
      .from('event_guests')
      .select('id, guest_info, networking_note')
      .eq('event_id', params.id)
      .ilike('guest_info->>phone', `%${phoneClean}%`)
      .limit(1)
      .single();

    if (error || !data) {
      alert('Không tìm thấy thông tin đăng ký với SĐT này. Vui lòng thử lại!');
    } else {
      setGuest(data);
      setNote(data.networking_note || '');
      setStep(2);
    }
    setIsProcessing(false);
  };

  const handleSendNote = async () => {
    setIsProcessing(true);
    const { error } = await supabase
      .from('event_guests')
      .update({ networking_note: note })
      .eq('id', guest.id);

    if (error) alert('Lỗi: ' + error.message);
    else setStep(3);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-amber-500">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-[#002D62] p-6 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
          <i className="ph-fill ph-handshake text-4xl text-amber-400 mb-2 relative z-10"></i>
          <h1 className="text-xl font-black relative z-10">NKBA Live Connect</h1>
          <p className="text-xs text-blue-200 mt-1 relative z-10">Kết nối giao thương trực tiếp tại sự kiện</p>
        </div>

        <div className="p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-bold text-slate-600 text-center mb-6">Nhập Số điện thoại bạn đã đăng ký để hiển thị Profile lên màn hình lớn.</p>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Nhập số điện thoại..." className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-lg font-bold text-center outline-none focus:border-[#002D62] transition-colors" />
              <button onClick={handleFindTicket} disabled={isProcessing} className="w-full h-14 bg-[#002D62] text-white font-black rounded-xl shadow-lg hover:bg-blue-900 transition-colors flex justify-center items-center gap-2">
                {isProcessing ? <i className="ph-bold ph-spinner animate-spin text-xl"></i> : 'TÌM HỒ SƠ CỦA TÔI'}
              </button>
            </div>
          )}

          {step === 2 && guest && (
            <div className="space-y-6 animate-in slide-in-from-right">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Xin chào</p>
                <h2 className="text-xl font-black text-[#002D62]">{guest.guest_info?.name || 'Khách mời'}</h2>
                <p className="text-sm font-bold text-slate-600">{guest.guest_info?.company}</p>
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Cập nhật lời chào / Nhu cầu giao thương</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="VD: Tôi đang tìm kiếm đối tác cung cấp thép..." className="w-full h-32 p-4 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium outline-none resize-none focus:border-[#002D62] transition-colors shadow-inner" />
              </div>
              <button onClick={handleSendNote} disabled={isProcessing} className="w-full h-14 bg-amber-500 text-[#002D62] font-black rounded-xl shadow-lg hover:bg-amber-400 transition-colors flex justify-center items-center gap-2">
                {isProcessing ? <i className="ph-bold ph-spinner animate-spin text-xl"></i> : <><i className="ph-bold ph-monitor-play text-xl"></i> PHÁT LÊN MÀN HÌNH</>}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4"><i className="ph-bold ph-check"></i></div>
              <h2 className="text-xl font-black text-emerald-600 mb-2">Đã Gửi Thành Công!</h2>
              <p className="text-sm font-medium text-slate-600">Profile và Lời nhắn của bạn đã được đẩy lên Bức tường Giao thương. Chúc bạn một sự kiện tuyệt vời!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}