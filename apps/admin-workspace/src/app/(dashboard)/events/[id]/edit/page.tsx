// src/app/(dashboard)/events/[id]/edit/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getEventDetails, updateEventAction } from '@/actions/event.actions';

// Hàm hỗ trợ: Chuyển đổi chuỗi UTC thành định dạng YYYY-MM-DDThh:mm (Local Time)
const formatForDateTimeInput = (utcString: string) => {
  if (!utcString) return '';
  const date = new Date(utcString);
  // Lấy độ lệch múi giờ so với UTC (tính bằng mili giây)
  const tzOffset = date.getTimezoneOffset() * 60000;
  // Trừ đi offset để khi toISOString() nó không bị ép về lại UTC
  const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  return localISOTime;
};

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State quản lý dữ liệu form
  const [formData, setFormData] = useState({
    event_code: '',
    title: '',
    status: 'DRAFT',
    event_date: '',
    capacity: 0,
    location: '',
    format: '',
    description: ''
  });

  // Tải dữ liệu sự kiện hiện tại
  const fetchEventData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await getEventDetails(eventId);
      
      if (res.success && res.event) {
        const ev = res.event;
        setFormData({
          event_code: ev.event_code || '',
          title: ev.title || '',
          status: ev.status || 'DRAFT',
          event_date: formatForDateTimeInput(ev.event_date), // <-- Đã áp dụng hàm dịch ngược múi giờ
          capacity: ev.capacity || 0,
          location: ev.details?.location || '',
          format: ev.details?.format || '',
          description: ev.details?.description || ''
        });
      } else {
        alert('Không tìm thấy sự kiện!');
        router.push('/events');
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu sự kiện:', err);
    } finally {
      setIsLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>, submitStatus: 'DRAFT' | 'PUBLISHED') => {
    const form = e.currentTarget.form;
    
    if (form && !form.checkValidity()) {
      form.reportValidity();
      return; 
    }
    e.preventDefault();
    setIsSubmitting(true);
    
    // Ép về chuẩn UTC trước khi gửi xuống DB
    let isoDate = formData.event_date;
    if (isoDate) {
      isoDate = new Date(formData.event_date).toISOString(); 
    }

    const finalData = { 
      ...formData, 
      status: submitStatus,
      event_date: isoDate 
    };

    try {
      const result = await updateEventAction(eventId, finalData);
      
      if (result.success) {
        router.push(`/events/${eventId}`); // Cập nhật xong thì quay về trang chi tiết
      } else {
        alert('Lỗi cập nhật: ' + result.message);
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      alert('Đã có lỗi hệ thống xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <i className="ph-bold ph-spinner animate-spin text-3xl text-[#002D62]"></i>
        <p className="text-slate-400 text-sm font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href={`/events/${eventId}`} 
          className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-[#002D62] hover:border-[#002D62] transition-colors shadow-sm"
        >
          <i className="ph-bold ph-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Chỉnh sửa Sự kiện</h1>
          <p className="text-slate-500 text-sm mt-1">Cập nhật thông tin chiến dịch: <span className="font-mono font-bold text-slate-700">{formData.event_code}</span></p>
        </div>
      </div>

      {/* FORM SECTION */}
      <form className="space-y-8">
        
        {/* BLOCK 1: THÔNG TIN CƠ BẢN */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#002D62] border-b border-slate-100 pb-3 flex items-center gap-2">
            <i className="ph-fill ph-info"></i> Thông tin cơ bản
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mã Sự kiện (Event Code) *</label>
              <input 
                type="text" 
                name="event_code"
                value={formData.event_code}
                onChange={handleChange}
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none font-mono font-bold"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Sự kiện *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none font-bold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* BLOCK 2: HẬU CẦN & ĐỊA ĐIỂM */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#002D62] border-b border-slate-100 pb-3 flex items-center gap-2">
            <i className="ph-fill ph-calendar-check"></i> Hậu cần & Không gian
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày giờ tổ chức *</label>
              <input 
                type="datetime-local" 
                name="event_date"
                value={formData.event_date}
                onChange={handleChange}
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số lượng (Capacity) *</label>
              <input 
                type="number" 
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="0"
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hình thức</label>
              <input 
                type="text" 
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Địa điểm tổ chức *</label>
            <input 
              type="text" 
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none"
            />
          </div>
        </div>

        {/* BLOCK 3: CHI TIẾT SỰ KIỆN */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#002D62] border-b border-slate-100 pb-3 flex items-center gap-2">
            <i className="ph-fill ph-text-align-left"></i> Mô tả chi tiết
          </h2>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nội dung tóm tắt</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none resize-none leading-relaxed"
            ></textarea>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <Link 
            href={`/events/${eventId}`} 
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Hủy bỏ
          </Link>
          
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            disabled={isSubmitting}
            className={`px-6 py-3 border text-sm font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 ${
              formData.status === 'DRAFT' 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Lưu bản nháp
          </button>
          
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, 'PUBLISHED')}
            disabled={isSubmitting}
            className="px-8 py-3 bg-[#002D62] text-white text-sm font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-lg shadow-blue-900/20 flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><i className="ph-bold ph-spinner animate-spin"></i> Đang xử lý...</>
            ) : (
              <><i className="ph-bold ph-floppy-disk"></i> Cập nhật & Xuất bản</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}