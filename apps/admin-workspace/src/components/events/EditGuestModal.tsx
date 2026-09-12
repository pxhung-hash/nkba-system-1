// src/components/events/EditGuestModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { updateGuestAction } from '@/actions/event.actions';
import { toast } from 'react-hot-toast';

interface EditGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  guest: any;
  eventId: string;
}

export default function EditGuestModal({ isOpen, onClose, onSuccess, guest, eventId }: EditGuestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    salutation: 'Anh',
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    rsvp_status: 'PENDING',
  });

  // Tự động điền dữ liệu cũ khi mở Modal
  useEffect(() => {
    if (guest && isOpen) {
      setFormData({
        salutation: guest.salutation || 'Anh',
        name: guest.guest_info?.name || '',
        email: guest.guest_info?.email || '',
        phone: guest.guest_info?.phone || '',
        company: guest.guest_info?.company || '',
        position: guest.guest_info?.position || '',
        rsvp_status: guest.rsvp_status || 'PENDING',
      });
    }
  }, [guest, isOpen]);

  if (!isOpen || !guest) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const loadingToast = toast.loading('Đang lưu thay đổi...');

    try {
      const res = await updateGuestAction(guest.id, eventId, formData);
      
      if (res.success) {
        toast.success(res.message, { id: loadingToast });
        onSuccess(); // Báo cho page.tsx biết để reload danh sách
      } else {
        toast.error(res.message, { id: loadingToast });
      }
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối máy chủ.', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-[#002D62] flex items-center gap-2">
              <i className="ph-bold ph-pencil-simple"></i> Sửa thông tin khách mời
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Cập nhật hồ sơ hoặc trạng thái xác nhận của {formData.name}</p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors"
          >
            <i className="ph-bold ph-x text-sm"></i>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Trạng thái RSVP */}
            <div className="md:col-span-3 bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng thái tham dự</label>
                <p className="text-sm text-slate-700 font-medium">Tình trạng vé hiện tại của khách</p>
              </div>
              <select 
                name="rsvp_status" 
                value={formData.rsvp_status} 
                onChange={handleChange}
                className="bg-white border border-slate-300 rounded-lg px-4 py-2 font-bold text-sm focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="PENDING">Chờ phản hồi (Pending)</option>
                <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
                <option value="DECLINED">Từ chối (Declined)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Danh xưng</label>
              <select 
                name="salutation" 
                value={formData.salutation} 
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#002D62] bg-slate-50 focus:bg-white"
              >
                <option value="Anh">Anh</option>
                <option value="Chị">Chị</option>
                <option value="Ông">Ông</option>
                <option value="Bà">Bà</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Họ và Tên *</label>
              <input 
                type="text" 
                name="name" 
                required
                value={formData.name} 
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#002D62] bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Số điện thoại</label>
              <input 
                type="tel" 
                name="phone" 
                value={formData.phone} 
                onChange={handleChange}
                placeholder="09xx..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#002D62] bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email</label>
              <input 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange}
                placeholder="email@company.com"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#002D62] bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Công ty / Doanh nghiệp</label>
              <input 
                type="text" 
                name="company" 
                value={formData.company} 
                onChange={handleChange}
                placeholder="Công ty CP Xây dựng..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#002D62] bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chức vụ</label>
              <input 
                type="text" 
                name="position" 
                value={formData.position} 
                onChange={handleChange}
                placeholder="Giám đốc, CEO..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#002D62] bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 mt-6 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-[#002D62] text-white font-bold rounded-xl hover:bg-blue-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin"></i> Đang lưu...</> : <><i className="ph-bold ph-floppy-disk"></i> Lưu thay đổi</>}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}