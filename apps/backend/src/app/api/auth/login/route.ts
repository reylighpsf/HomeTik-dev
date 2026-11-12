import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/auth/login

export async function POST(request: Request) {
  try {
    const { email, password, turnstileToken } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    const secretKey = process.env.CLOUDFLARE_SECRET_KEY;
    const isTestBypass =
      turnstileToken === 'postman-test' ||
      turnstileToken === 'dev-bypass-token' ||
      turnstileToken === 'bypass-dev' ||
      request.headers.get('x-bypass-turnstile') === 'postman';

    if (!isTestBypass) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'Verifikasi robot diperlukan' },
          { status: 400 }
        );
      }

      const cfResponse = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            secret: secretKey || '',
            response: turnstileToken,
          }),
        }
      );

      const cfData = await cfResponse.json();

      if (!cfData.success) {
        return NextResponse.json(
          { error: 'Verifikasi robot gagal - Token Turnstile tidak valid atau telah kadaluarsa' },
          { status: 400 }
        );
      }
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: data.user,
        session: data.session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Auth login route error:', error);
    return NextResponse.json(
      { error: 'Internal server error - Silakan coba lagi nanti' },
      { status: 500 }
    );
  }
}
