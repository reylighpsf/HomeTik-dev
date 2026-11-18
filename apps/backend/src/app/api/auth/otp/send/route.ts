import { NextResponse } from 'next/server';
import { createStatelessAuthClient } from '@/lib/supabase/server';
import { sendOtpSchema } from '@/lib/validators/auth';

/**
 * Normalisasi format nomor telepon ke format internasional E.164 (+62 untuk Indonesia)
 */
function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+62' + cleaned.slice(1);
  } else if (cleaned.startsWith('62')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+62' + cleaned;
  }
  return cleaned;
}

// ==========================================
// ROUTE: POST /api/auth/otp/send
// Deskripsi: Kirim kode OTP via SMS/WhatsApp atau Email
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = sendOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { phone, email, password, channel, purpose, isResend, name, role } = validation.data;
    const supabase = createStatelessAuthClient();

    // Prioritaskan pengiriman OTP via Email (gratis bawaan Supabase) jika channel === 'email' atau email diisi tanpa phone
    if (channel === 'email' || (!phone && email)) {
      if (!email) {
        return NextResponse.json(
          { error: 'Alamat email wajib diisi untuk pengiriman OTP via Email' },
          { status: 400 }
        );
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 1. Kirim ulang OTP pendaftaran
      if (purpose === 'signup' && isResend) {
        const { error: resendErr } = await supabase.auth.resend({
          type: 'signup',
          email: normalizedEmail,
        });

        if (resendErr) {
          // Fallback untuk akun lama yang dibuat lewat signInWithOtp
          const { error: fallbackErr } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            options: { shouldCreateUser: false },
          });
          if (fallbackErr) {
            console.error('[OTP Send] Resend signup OTP error:', resendErr.message, fallbackErr.message);
            return NextResponse.json({ error: resendErr.message }, { status: 400 });
          }
        }

        return NextResponse.json(
          {
            success: true,
            message: `Kode OTP 8-digit baru berhasil dikirim ke email ${normalizedEmail}`,
            channel: 'email',
            otpType: 'signup',
          },
          { status: 200 }
        );
      }

      // 2. Registrasi akun baru dengan password langsung tersimpan + verifikasi OTP Confirm Signup
      if (purpose === 'signup' && password) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name: name || undefined,
              phone: phone || undefined,
              role: role || 'USER',
            },
          },
        });

        if (signUpError) {
          console.error('[OTP Send] SignUp error:', signUpError.message);
          return NextResponse.json({ error: signUpError.message }, { status: 400 });
        }

        // Anti-enumeration Supabase: jika email sudah terdaftar & terkonfirmasi, identities = []
        if (
          signUpData.user &&
          Array.isArray(signUpData.user.identities) &&
          signUpData.user.identities.length === 0
        ) {
          return NextResponse.json(
            {
              error: 'Email ini sudah terdaftar dan aktif. Silakan langsung masuk (Login).',
              code: 'USER_ALREADY_EXISTS',
            },
            { status: 400 }
          );
        }

        // Jika Confirm Email dimatikan di dashboard Supabase, session langsung aktif
        if (signUpData.session) {
          return NextResponse.json(
            {
              success: true,
              skipOtp: true,
              session: signUpData.session,
              user: signUpData.user,
              message: 'Akun berhasil dibuat dan langsung aktif.',
              channel: 'email',
            },
            { status: 200 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            message: `Kode OTP 8-digit berhasil dikirim ke email ${normalizedEmail}`,
            channel: 'email',
            otpType: 'signup',
          },
          { status: 200 }
        );
      }

      // 3. Lupa password atau OTP tanpa password
      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: purpose !== 'forgot_password',
          data: {
            name: name || undefined,
            phone: phone || undefined,
            role: role || 'USER',
          },
        },
      });

      if (error) {
        console.error('[OTP Send] Email OTP error:', error.message);
        const friendlyMsg =
          error.message.toLowerCase().includes('signups not allowed')
            ? 'Email tersebut belum terdaftar.'
            : error.message;
        return NextResponse.json({ error: friendlyMsg }, { status: 400 });
      }

      return NextResponse.json(
        {
          success: true,
          message: `Kode OTP 8-digit berhasil dikirim ke email ${normalizedEmail}`,
          channel: 'email',
          otpType: 'email',
        },
        { status: 200 }
      );
    }

    if (phone) {
      const formattedPhone = normalizePhoneNumber(phone);
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: channel as 'sms' | 'whatsapp',
          shouldCreateUser: purpose !== 'forgot_password',
          data: {
            name: name || undefined,
            role: role || 'USER',
          },
        },
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: `Kode OTP berhasil dikirim ke nomor ${formattedPhone} via ${channel.toUpperCase()}`,
          channel,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Nomor telepon atau email wajib disertakan' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[OTP Send] Route error:', error);
    return NextResponse.json(
      { error: 'Gagal mengirim OTP. Silakan coba lagi nanti.' },
      { status: 500 }
    );
  }
}
