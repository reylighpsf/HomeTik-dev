import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ossralrurmrtnxyctdqs.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_tfHmyd7CWxizCsDW_15mgw_WmLcP0PO';

export const createClient = () => createBrowserClient(supabaseUrl, supabaseKey);
