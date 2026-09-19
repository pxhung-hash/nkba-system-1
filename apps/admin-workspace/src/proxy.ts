import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // 1. Tạo response mặc định
  let response = NextResponse.next({ request });

  // 2. Cài đặt "Máy đọc thẻ từ" của Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. Quét thẻ xem có User nào đang đứng trước cửa không
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // 4. Danh sách các "Vùng xanh" (Không cần thẻ vẫn vào được)
  const publicRoutes = ['/login', '/signup', '/auth/callback'];
  
  // 👉 SỬA DÒNG NÀY: MỞ CỬA THÊM CHO TRANG KHÁCH QUÉT QR (bắt đầu bằng /e/)
  const isPublicRoute = publicRoutes.includes(path) || path.startsWith('/su-kien') || path.startsWith('/e/');

  console.log("\n=== 🕵️‍♂️ MIDDLEWARE BÁO CÁO ===");
  console.log("📍 Đang truy cập URL:", request.url);
  console.log("👤 Thẻ Auth (User):", user ? `Có (ID: ${user.id})` : "KHÔNG CÓ (NULL)");
  console.log("================================\n");

  // 5. LOGIC 1: Đã login mà lảng vảng ở trang công khai (như /login) -> Mời vào Dashboard
  if (user && publicRoutes.includes(path)) { 
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 6. LOGIC 2: KHÔNG có thẻ VÀ đang cố vào "Vùng cấm" (không phải public route) -> Đuổi
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login?error=middleware_kicked_you', request.url));
  }

  // 7. Hợp lệ -> Cho qua
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};