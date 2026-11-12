import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// ==========================================
// ROUTE: POST /api/auth/logout
// Deskripsi: Logout pengguna dan invalidate session
// ==========================================
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Akun berhasil logout' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout gagal - Coba refresh halaman' },
      { status: 500 }
    );
  }
}
