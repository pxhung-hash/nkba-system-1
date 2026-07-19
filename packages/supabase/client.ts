import { createClient } from '@supabase/supabase-js'

// Lấy biến môi trường
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Bổ sung key cho Admin

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Thiếu biến môi trường: NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

/**
 * 1. PUBLIC CLIENT: Dùng ở Client Components (Public Site, Form đăng ký)
 * Quyền hạn: Bị giới hạn bởi Row Level Security (RLS)
 */
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 2. ADMIN CLIENT: Dùng ĐỘC QUYỀN ở Server Actions / API Routes của Admin
 * Quyền hạn: Vượt qua RLS (Bypass RLS), có thể đọc/ghi mọi bảng
 * Dùng dạng Function (Factory) để tạo instance mới mỗi khi gọi, tránh rò rỉ dữ liệu trên Server
 */
export const createAdminClient = () => {
  if (!supabaseServiceKey) {
    throw new Error('Thiếu biến môi trường: SUPABASE_SERVICE_ROLE_KEY ở cổng đang chạy!')
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}