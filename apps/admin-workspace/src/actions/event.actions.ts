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
    const supabaseAdmin = createAdminClient();

    // 1. Lấy thông tin chi tiết của sự kiện (Bắt buộc phải có)
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError) {
      console.error('❌ Lỗi lấy sự kiện từ DB:', eventError);
      return { success: false, message: 'Không tìm thấy sự kiện' };
    }

    // 2. Lấy danh sách khách mời (Linh động, lỗi thì cho qua)
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from('event_guests')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (guestsError) {
      // Chỉ in lỗi ra Terminal để DEV biết sửa DB, KHÔNG chặn luồng hiển thị sự kiện
      console.error('⚠️ Lỗi lấy khách mời (Bỏ qua để không sập trang):', guestsError);
    }

    // 3. Trả về thành công, nếu khách mời lỗi thì trả về mảng rỗng
    return { 
      success: true, 
      event: event, 
      guests: guests || [] 
    };

  } catch (error: any) {
    console.error('❌ Lỗi Server Action (getEventDetails):', error);
    return { success: false, message: 'Lỗi hệ thống' };
  }
}

// src/actions/event.actions.ts

// Hàm thêm khách mời (hỗ trợ thêm hàng loạt)
export async function addEventGuestsAction(eventId: string, guestsData: any[]) {
  try {
    const supabaseAdmin = createAdminClient();

    // 1. Chuyển đổi dữ liệu từ Client thành định dạng chuẩn của Database
    const inserts = guestsData.map((g) => ({
      event_id: eventId,
      guest_info: {
        name: g.name || '',
        email: g.email || '',
        phone: g.phone || '',
        company: g.company || '',
        position: g.position || ''
      },
      source: g.source || 'MANUAL',
      rsvp_status: 'PENDING',
      
      // 👇 THÊM ĐÚNG DÒNG NÀY ĐỂ FIX LỖI 👇
      tracking_token: crypto.randomUUID() 
    }));

    // 2. Insert vào bảng event_guests
    const { error } = await supabaseAdmin
      .from('event_guests')
      .insert(inserts);

    if (error) throw new Error(error.message);

    // 3. Xóa cache trang chi tiết để nó tự cập nhật danh sách
    revalidatePath(`/events/${eventId}`);

    return { success: true, message: `Đã thêm thành công ${guestsData.length} khách mời!` };
  } catch (error: any) {
    console.error('Lỗi khi thêm khách mời:', error);
    return { success: false, message: error.message || 'Lỗi hệ thống' };
  }
}

// (Tùy chọn) Hàm lấy danh sách hội viên - Bạn chỉnh lại tên bảng 'companies' cho đúng với DB của bạn nhé
export async function getMembersForEvent() {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('companies') // Đổi thành bảng hội viên thực tế của bạn
      .select('id, name, email, phone')
      .limit(100); 

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, data: [] };
  }
}
