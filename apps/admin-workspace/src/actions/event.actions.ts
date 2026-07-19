// apps/admin-workspace/src/actions/event.actions.ts
'use server';

import { createAdminClient } from '@nkba/supabase/client';
import { revalidatePath } from 'next/cache';

// Định nghĩa kiểu dữ liệu (Interface) cho Form Data để TypeScript bắt lỗi
interface CreateEventFormData {
  event_code: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED';
  event_date: string;
  capacity: number;
  location: string;
  format: string;
  description: string;
}

export async function createEventAction(formData: CreateEventFormData) {
  try {
    // 1. Khởi tạo Supabase Client dành riêng cho Admin (Bypass RLS)
    const supabase = createAdminClient();

    // 2. Gom nhóm dữ liệu phụ vào trường JSONB "details"
    const details = {
      location: formData.location || '',
      format: formData.format || '',
      description: formData.description || '',
    };

    // 3. Thực hiện Insert vào Database
    const { data, error } = await supabase
      .from('events')
      .insert([
        {
          event_code: formData.event_code.trim(),
          title: formData.title.trim(),
          status: formData.status,
          event_date: formData.event_date ? new Date(formData.event_date).toISOString() : null,
          capacity: formData.capacity || 0,
          details: details,
        }
      ])
      .select()
      .single(); // Lấy về 1 bản ghi vừa tạo

    if (error) {
      console.error('Supabase Insert Error:', error);
      // Xử lý lỗi phổ biến (Ví dụ: Trùng event_code)
      if (error.code === '23505') {
        throw new Error('Mã sự kiện (Event Code) này đã tồn tại. Vui lòng chọn mã khác.');
      }
      throw new Error(error.message);
    }

    // 4. Xóa cache của trang danh sách sự kiện để hiển thị dữ liệu mới nhất
    revalidatePath('/events');

    // 5. Trả về kết quả thành công cho Frontend
    return { 
      success: true, 
      message: 'Tạo sự kiện thành công!',
      data: data
    };

  } catch (error: any) {
    console.error('Lỗi Server Action (createEventAction):', error);
    return { 
      success: false, 
      message: error.message || 'Đã có lỗi xảy ra phía máy chủ.' 
    };
  }
  
}

export async function getEventDetails(eventId: string) {
  try {
    // 1. Lấy thông tin chi tiết của sự kiện
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('Lỗi lấy sự kiện:', eventError);
      return { success: false, message: 'Không tìm thấy sự kiện' };
    }

    // 2. Lấy danh sách khách mời của sự kiện đó
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('event_guests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (guestsError) {
      console.error('Lỗi lấy khách mời:', guestsError);
      return { success: false, message: 'Không thể lấy danh sách khách mời' };
    }

    return { 
      success: true, 
      event, 
      guests 
    };

  } catch (error: any) {
    console.error('Lỗi Server Action (getEventDetails):', error);
    return { success: false, message: 'Lỗi hệ thống' };
  }
}
