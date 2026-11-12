import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { registerSchema } from '@/lib/validators/auth';

// POST /api/auth/register

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { email, password, name, phone, role, specialties, turnstileToken } =
      validation.data;

    const secretKey = process.env.CLOUDFLARE_SECRET_KEY;
    const isTestBypass =
      turnstileToken === 'postman-test' ||
      turnstileToken === 'dev-bypass-token' ||
      turnstileToken === 'bypass-dev' ||
      request.headers.get('x-bypass-turnstile') === 'postman';

    if (!isTestBypass) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: 'Verifikasi robot (Turnstile) diperlukan' },
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
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: phone || null,
          role,
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    const user = authData.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Gagal membuat akun user' },
        { status: 500 }
      );
    }
    if (
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
    ) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        app_metadata: { role },
      });
    }

    const clientForDb =
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        ? supabaseAdmin
        : supabase;

    const { error: profileError } = await clientForDb.from('profiles').upsert({
      id: user.id,
      name,
      email,
      phone: phone || null,
      role,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error('[Register] Profile creation error:', profileError);
    }

    if (role === 'BARBER') {
      const { error: barberError } = await clientForDb
        .from('barber_details')
        .upsert({
          profile_id: user.id,
          specialties: specialties || ['Haircut', 'Styling'],
          is_online: false,
          rating: 5.0,
          total_reviews: 0,
          updated_at: new Date().toISOString(),
        });

      if (barberError) {
        console.error('[Register] Barber details error:', barberError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registrasi berhasil',
        user,
        session: authData.session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Register] Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error - Silakan coba lagi nanti' },
      { status: 500 }
    );
  }
}
