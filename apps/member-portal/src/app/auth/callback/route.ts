import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // Tự động giải mã tham số (VD: %2Freset-password thành /reset-password)
    let next = searchParams.get('next') ? decodeURIComponent(searchParams.get('next')!) : '/';
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    if (error || errorDescription) {
      return NextResponse.redirect(`${origin}/login?error_description=${errorDescription || 'Link không hợp lệ hoặc đã hết hạn.'}`);
    }

    if (code) {
      const cookieStore = cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) { return cookieStore.get(name)?.value; },
            set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
            remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }); },
          },
        }
      );

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        if (!next.startsWith('/')) next = `/${next}`;
        
        if (next === '/login') {
          return NextResponse.redirect(`${origin}/login?message=Xác thực email thành công! Vui lòng đăng nhập.`);
        }
        return NextResponse.redirect(`${origin}${next}`);
      } else {
        return NextResponse.redirect(`${origin}/login?error_description=${encodeURIComponent(exchangeError.message)}`);
      }
    }

    return NextResponse.redirect(`${origin}/login?error_description=Không tìm thấy mã xác thực bảo mật.`);
  } catch (err) {
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/login?error_description=Hệ thống đang bận. Vui lòng thử lại sau.`);
  }
}