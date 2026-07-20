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

  // 1. Danh sách các "Vùng xanh" (Không cần thẻ vẫn vào được)
  const publicRoutes = ['/login', '/signup', '/auth/callback'];
  const isPublicRoute = publicRoutes.includes(path);

  console.log("\n=== 🕵️‍♂️ MIDDLEWARE BÁO CÁO ===");
  console.log("📍 Đang truy cập URL:", request.url);
  console.log("👤 Thẻ Auth (User):", user ? `Có (ID: ${user.id})` : "KHÔNG CÓ (NULL)");
  console.log("================================\n");

  // 2. LOGIC 1: Đã login mà lảng vảng ở trang công khai (như /login) -> Mời vào Dashboard
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. LOGIC 2: KHÔNG có thẻ VÀ đang cố vào "Vùng cấm" (không phải public route) -> Đuổi
  if (!user && !isPublicRoute) {
    // Lưu ý: Đảm bảo app admin (cổng 3002) của bạn CÓ trang /login này. 
    // Nếu trang login nằm ở cổng 3000, bạn phải fix cứng URL: return NextResponse.redirect('http://localhost:3000/login');
    return NextResponse.redirect(new URL('/login?error=middleware_kicked_you', request.url));
  }

  // 6. Hợp lệ -> Cho qua
  return response;
}

export const config = {
  // Cập nhật Matcher: Bỏ qua tất cả file tĩnh (.png, .jpg, .svg, .css, .js)
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
};