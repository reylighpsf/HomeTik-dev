import { NextResponse } from 'next/server';
import { createServerSupabaseClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { UserRole } from '@hometik/shared-types';

export interface AuthContext {
  userId: string;
  role: UserRole;
  user: any;
}

/**
 * Mendapatkan role user dari JWT claim, app_metadata, user_metadata, atau tabel profiles
 */
export async function getCurrentUserRole(): Promise<AuthContext | null> {
  const { user, error: authError } = await getAuthenticatedUser();

  if (authError || !user) {
    return null;
  }

  // 1. Cek claim app_metadata / user_metadata
  let role: UserRole =
    (user.app_metadata?.role as UserRole) ||
    (user.app_metadata?.user_role as UserRole) ||
    (user.user_metadata?.role as UserRole);

  // 2. Jika belum ada di claim JWT, ambil langsung dari tabel profiles
  if (!role) {
    const supabase = await createServerSupabaseClient();
    const clientForDb =
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-service-role-key'
        ? supabaseAdmin
        : supabase;

    const { data: profile } = await clientForDb
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    role = (profile?.role as UserRole) || 'USER';
  }

  return {
    userId: user.id,
    role,
    user,
  };
}

/**
 * Guard untuk API route: memastikan pemanggil memiliki salah satu role yang diizinkan
 */
export async function requireRoles(allowedRoles: UserRole[]): Promise<
  | { authorized: true; context: AuthContext }
  | { authorized: false; response: NextResponse }
> {
  const authContext = await getCurrentUserRole();

  if (!authContext) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Unauthorized - Silakan login terlebih dahulu' },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(authContext.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Forbidden - Akses ditolak untuk role ${authContext.role}. Diperlukan role: ${allowedRoles.join(', ')}`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    context: authContext,
  };
}
