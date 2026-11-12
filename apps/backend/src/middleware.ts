import { createClient } from '@/utils/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 1. Proteksi Route Halaman Web Admin (/admin)
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = user.app_metadata?.role || user.app_metadata?.user_role;
    if (role && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses khusus administrator' },
        { status: 403 }
      );
    }
  }

  // 2. Proteksi API Route Admin (/api/admin)
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const role = user.app_metadata?.role || user.app_metadata?.user_role;
    if (role && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Diperlukan role ADMIN' },
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
