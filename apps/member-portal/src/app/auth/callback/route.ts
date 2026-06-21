import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ? decodeURIComponent(searchParams.get('next')!) : '/';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error || errorDescription) {
    const loginUrl = new URL('/login', origin);
    loginUrl.searchParams.set('error_description', errorDescription || 'Đường link xác thực không hợp lệ hoặc đã hết hạn.');
    return NextResponse.redirect(loginUrl);
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
      return NextResponse.redirect(new URL(next, request.url));
    } else {
      return NextResponse.redirect(new URL(`/login?error_description=${encodeURIComponent(exchangeError.message)}`, request.url));
    }
  }

  return NextResponse.redirect(new URL('/login?error_description=Quá trình xác thực thất bại. Vui lòng thử lại.', request.url));
}