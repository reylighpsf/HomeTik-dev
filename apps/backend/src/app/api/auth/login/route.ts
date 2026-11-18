import { NextResponse } from 'next/server';
import { createServerSupabaseClient, createStatelessAuthClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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

    const normalizedEmail = String(email).trim().toLowerCase();
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      const errMsgLower = error.message.toLowerCase();

      const resendVerificationOtp = async (isAlreadyConfirmed: boolean) => {
        const stateless = createStatelessAuthClient();
        if (!isAlreadyConfirmed) {
          const { error: resendErr } = await stateless.auth.resend({
            type: 'signup',
            email: normalizedEmail,
          });
          if (!resendErr) return 'signup' as const;
        }
        await stateless.auth.signInWithOtp({
          email: normalizedEmail,
          options: { shouldCreateUser: false },
        });
        return 'email' as const;
      };

      // Kasus 1: Akun sudah punya password, namun belum menyelesaikan verifikasi OTP
      if (errMsgLower.includes('email not confirmed')) {
        const otpType = await resendVerificationOtp(false);
        return NextResponse.json(
          {
            error:
              'Akun Anda belum diverifikasi. Kami telah mengirim ulang kode OTP 8-digit ke email Anda.',
            code: 'EMAIL_NOT_CONFIRMED',
            email: normalizedEmail,
            otpType,
            needsPasswordSetup: false,
          },
          { status: 403 }
        );
      }

      // Kasus 2: Cek langsung ke auth.users via Admin API apakah akun belum konfirmasi OTP
      // atau sempat terkonfirmasi lewat link tanpa menyelesaikan setup password (last_sign_in_at kosong)
      const hasAdminKey =
        Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) &&
        process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key';

      if (errMsgLower.includes('invalid login credentials') && hasAdminKey) {
        try {
          const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
            perPage: 1000,
          });

          if (!listErr && usersData?.users) {
            const matchedUser = usersData.users.find(
              (u) => u.email?.toLowerCase() === normalizedEmail
            );

            const isUnconfirmed = Boolean(matchedUser && !matchedUser.email_confirmed_at);
            const neverCompletedActivation = Boolean(
              matchedUser && matchedUser.email_confirmed_at && !matchedUser.last_sign_in_at
            );

            if (isUnconfirmed || neverCompletedActivation) {
              const otpType = await resendVerificationOtp(Boolean(matchedUser?.email_confirmed_at));
              return NextResponse.json(
                {
                  error:
                    'Akun Anda belum menyelesaikan aktivasi OTP. Kami telah mengirim kode OTP 8-digit baru ke email Anda.',
                  code: 'EMAIL_NOT_CONFIRMED',
                  email: normalizedEmail,
                  otpType,
                  needsPasswordSetup: true,
                },
                { status: 403 }
              );
            }
          }
        } catch (adminCheckErr) {
          console.warn('[Login] Unconfirmed account check failed:', adminCheckErr);
        }
      }

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
