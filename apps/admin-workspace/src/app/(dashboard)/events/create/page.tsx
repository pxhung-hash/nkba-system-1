// src/app/(dashboard)/events/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import Server Action chúng ta vừa tạo
import { createEventAction } from '@/actions/event.actions'; 

export default function CreateEventPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State quản lý dữ liệu form
  const [formData, setFormData] = useState({
    event_code: '',
    title: '',
    status: 'DRAFT',
    event_date: '',
    capacity: 0,
    // Các trường dưới đây sẽ được gom vào cột JSONB "details" khi lưu vào DB
    location: '',
    format: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 0 : value
    }));
  };

  
  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>, submitStatus: 'DRAFT' | 'PUBLISHED') => {
    // 1. Lấy form bao quanh nút bấm hiện tại
    const form = e.currentTarget.form;
    
    // 2. Bắt trình duyệt kiểm tra xem có ô bắt buộc nào bị bỏ trống không
    if (form && !form.checkValidity()) {
      form.reportValidity(); // Hiển thị cảnh báo đỏ của trình duyệt
      return; // Dừng lại, không chạy tiếp code bên dưới
    }
    e.preventDefault();
    setIsSubmitting(true);
    
    // XỬ LÝ CHUẨN HÓA MÚI GIỜ (Ép về chuẩn UTC +00 để lưu Database)
    let isoDate = formData.event_date;
    if (isoDate) {
      // Khởi tạo Date object, trình duyệt sẽ tự hiểu chuỗi này đang là giờ Việt Nam
      // Sau đó .toISOString() sẽ tự động trừ đi 7 tiếng để ra chuỗi UTC có đuôi 'Z'
      isoDate = new Date(formData.event_date).toISOString(); 
    }

    // Gán trạng thái và ngày giờ đã chuẩn hóa
    const finalData = { 
      ...formData, 
      status: submitStatus,
      event_date: isoDate // Ghi đè lại bằng chuỗi UTC
    };

    try {
      console.log('Đang gửi dữ liệu xuống Server Action...', finalData);
      
      // GỌI TRỰC TIẾP SERVER ACTION TẠI ĐÂY
      const result = await createEventAction(finalData);
      
      if (result.success) {
        // Chuyển hướng về trang danh sách sau khi tạo thành công
        router.push('/events');
      } else {
        // Báo lỗi nếu Server trả về false
        alert('Không thể tạo sự kiện: ' + result.message);
      }
      
    } catch (error) {
      console.error('Lỗi khi tạo sự kiện:', error);
      alert('Đã có lỗi hệ thống xảy ra. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* HEADER SECTION */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/events" 
          className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-[#002D62] hover:border-[#002D62] transition-colors shadow-sm"
        >
          <i className="ph-bold ph-arrow-left"></i>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tạo Sự kiện Mới</h1>
          <p className="text-slate-500 text-sm mt-1">Thiết lập thông tin và cấu hình khách mời cho chiến dịch.</p>
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
                placeholder="VD: NKBA-LAUNCH-2026" 
                required
                className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none font-mono font-bold"
              />
              <p className="text-[11px] text-slate-400">Mã duy nhất, viết liền không dấu, dùng để tạo URL.</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên Sự kiện *</label>
              <input 
                type="text" 
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="VD: Lễ Ra Mắt Liên Minh NKBA" 
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
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Số lượng tối đa (Capacity) *</label>
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
                placeholder="VD: Speech & Outdoor BBQ" 
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
              placeholder="VD: Viet Long House, Hà Nội" 
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
              placeholder="Nhập giới thiệu ngắn gọn về mục tiêu và nội dung sự kiện..." 
              className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#002D62] focus:bg-white outline-none resize-none leading-relaxed"
            ></textarea>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-200">
          <Link 
            href="/events" 
            className="px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
          >
            Hủy bỏ
          </Link>
          
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, 'DRAFT')}
            disabled={isSubmitting}
            className="px-6 py-3 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
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
              <><i className="ph-bold ph-check-circle"></i> Xuất bản sự kiện</>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}