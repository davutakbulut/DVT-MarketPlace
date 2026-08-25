import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzgfhmsfvbwsxdddxxhb.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TKbpG-543Jsdt4epqu6JcQ_kmzZsLCI'
  );
}
