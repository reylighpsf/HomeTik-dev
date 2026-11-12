import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { verifyOtpSchema } from '@/lib/validators/auth';

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
// ROUTE: POST /api/auth/otp/verify
// Deskripsi: Verifikasi kode OTP dan dapatkan session user
// ==========================================
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = verifyOtpSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: validation.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { phone, email, token, type } = validation.data;
    const supabase = await createServerSupabaseClient();

    let verifyResult;

    if (phone) {
      const formattedPhone = normalizePhoneNumber(phone);
      verifyResult = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token,
        type: type === 'phone_change' ? 'phone_change' : 'sms',
      });
    } else if (email) {
      verifyResult = await supabase.auth.verifyOtp({
        email,
        token,
        type: type === 'email' ? 'email' : 'magiclink',
      });
    }

    if (!verifyResult || verifyResult.error) {
      return NextResponse.json(
        { error: verifyResult?.error?.message ?? 'Kode OTP salah atau telah kadaluarsa' },
        { status: 400 }
      );
    }

    const { data } = verifyResult;

    return NextResponse.json(
      {
        success: true,
        message: 'Verifikasi OTP berhasil',
        user: data.user,
        session: data.session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[OTP Verify] Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error saat verifikasi OTP' },
      { status: 500 }
    );
  }
}
