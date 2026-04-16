import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// env.get() is safe in Node.js/SSR prerender contexts — falls back to undefined.
// When running as a prerender (no real Supabase credentials), the client is
// created with placeholder values. Auth APIs are never called during static
// prerender so this is safe.
const supabaseUrl = env.get('VITE_SUPABASE_URL') ?? 'https://placeholder.supabase.co';
const supabaseAnonKey = env.get('VITE_SUPABASE_ANON_KEY') ?? 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
