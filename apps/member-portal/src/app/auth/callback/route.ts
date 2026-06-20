import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // 1. Phân tách URL để lấy các tham số truyền về từ email
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/'; // Trang đích sau khi xác thực thành công (mặc định là trang chủ)
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // 2. Xử lý trường hợp Supabase trả về lỗi trực tiếp trên URL
  // (Ví dụ: Link hết hạn, link sai định dạng hoặc Bot quét mail đã click trước làm hỏng mã code)
  if (error || errorDescription) {
    const loginUrl = new URL('/login', origin);
    // Gắn thông điệp lỗi lên URL để trang Login có thể đọc bằng useSearchParams và hiển thị cho user
    loginUrl.searchParams.set('error_description', errorDescription || 'Đường link xác thực không hợp lệ hoặc đã hết hạn.');
    return NextResponse.redirect(loginUrl);
  }

  // 3. Nếu luồng PKCE trả về mã `code` hợp lệ
  if (code) {
    const cookieStore = cookies();
    
    // Khởi tạo Supabase Client hoạt động ở môi trường Server (Route Handler)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Tiến hành đổi mã `code` lấy `session` đăng nhập chính thức
    // Khi hàm này chạy thành công, Supabase sẽ tự động thiết lập Auth Cookies hợp lệ trên trình duyệt của người dùng
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Xác thực thành công -> Điều hướng người dùng về trang đích (Ví dụ: Trang chủ "/" hoặc "/reset-password")
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      console.error('Lỗi đổi mã code lấy session:', exchangeError.message);
      return NextResponse.redirect(
        new URL(`/login?error_description=${encodeURIComponent(exchangeError.message)}`, request.url)
      );
    }
  }

  // 4. Trường hợp không có mã code và cũng không có lỗi (Fallback)
  return NextResponse.redirect(
    new URL('/login?error_description=Quá trình xác thực thất bại. Vui lòng thử lại.', request.url)
  );
}