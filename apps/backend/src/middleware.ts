import { createClient } from '@/utils/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Daftar Route Publik (Guest Mode):
 * Boleh diakses tanpa token / session autentikasi
 */
export const PUBLIC_API_ROUTES = [
  /^\/api\/auth(\/.*)?$/,
  /^\/api\/services(\/.*)?$/,
  /^\/api\/barbers\/public(\/.*)?$/,
  /^\/api\/barbers\/nearby(\/.*)?$/,
];

/**
 * Daftar Route Terproteksi (Protected Routes):
 * WAJIB memiliki token JWT valid
 */
export const PROTECTED_API_ROUTES = [
  /^\/api\/bookings(\/.*)?$/,
  /^\/api\/wallet(\/.*)?$/,
  /^\/api\/dispatch(\/.*)?$/,
  /^\/api\/admin(\/.*)?$/,
  /^\/api\/barbers\/location(\/.*)?$/,
];

/**
 * Next.js Middleware: Route Guarding & Authentication
 * Memisahkan akses Tamu (Guest) dan Pengguna Masuk (Logged-in)
 */
export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const pathname = request.nextUrl.pathname;

  // 1. Ekstrak dan validasi JWT dari request
  let user = null;

  // Evaluasi dari cookie session (Web Browser Client)
  try {
    const { data: cookieAuth, error: cookieError } = await supabase.auth.getUser();
    if (!cookieError && cookieAuth?.user) {
      user = cookieAuth.user;
    }
  } catch {
    // Sesi cookie tidak valid / expired
  }

  // Jika tidak ditemukan di cookie, periksa header Authorization: Bearer <token> (React Native Mobile Client)
  if (!user) {
    const authHeader =
      request.headers.get('Authorization') || request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const { data: tokenAuth, error: tokenError } = await supabase.auth.getUser(token);
          if (!tokenError && tokenAuth?.user) {
            user = tokenAuth.user;
          }
        } catch {
          // Token expired / invalid
        }
      }
    }
  }

  // 2. Cek apakah route termasuk ke dalam Protected Routes
  const isProtectedRoute = PROTECTED_API_ROUTES.some((pattern) => pattern.test(pathname));

  if (isProtectedRoute) {
    // Jika pengguna Tamu (tanpa token atau token expired), kembalikan HTTP 401 Unauthorized standar
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message:
            'Akses ditolak. Sesi autentikasi tidak ditemukan atau telah kedaluwarsa. Silakan login terlebih dahulu.',
          statusCode: 401,
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    // Role-based checking tambahan untuk route Admin
    if (pathname.startsWith('/api/admin')) {
      const role = user.app_metadata?.role || user.app_metadata?.user_role;
      if (role && role !== 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'Akses ditolak. Diperlukan hak akses administrator.',
            statusCode: 403,
            timestamp: new Date().toISOString(),
          },
          { status: 403 }
        );
      }
    }
  }

  // 3. Proteksi Halaman Admin Web Dashboard (/admin)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = user.app_metadata?.role || user.app_metadata?.user_role;
    if (role && role !== 'ADMIN') {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'Akses khusus administrator',
          statusCode: 403,
        },
        { status: 403 }
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
