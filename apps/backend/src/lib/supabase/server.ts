import { createServerClient as createClient } from '@supabase/ssr';
import { createClient as createSupabaseJsClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

/**
 * Client stateless tanpa PKCE (flowType: 'implicit') khusus untuk alur Mobile OTP
 * agar Supabase GoTrue mengeluarkan token OTP standar (bukan PKCE code_challenge)
 * yang dapat langsung diverifikasi melalui /api/auth/otp/verify.
 */
export function createStatelessAuthClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createSupabaseJsClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Mengambil user terautentikasi baik dari Authorization: Bearer <jwt> (Mobile / Mitra App)
 * maupun dari cookie SSR (Web Dashboard).
 */
export async function getAuthenticatedUser() {
  const headerStore = await headers();
  const authHeader = headerStore.get('authorization');

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      const stateless = createStatelessAuthClient();
      const { data, error } = await stateless.auth.getUser(token);
      if (!error && data?.user) {
        return { user: data.user, error: null };
      }
    }
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as any)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
