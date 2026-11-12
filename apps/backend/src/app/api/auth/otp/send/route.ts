import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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

    const { phone, email, channel, name, role } = validation.data;
    const supabase = await createServerSupabaseClient();

    if (phone) {
      const formattedPhone = normalizePhoneNumber(phone);
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: channel as 'sms' | 'whatsapp',
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

    if (email) {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
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
          message: `Kode verifikasi berhasil dikirim ke email ${email}`,
          channel: 'email',
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
