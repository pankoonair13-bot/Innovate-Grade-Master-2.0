import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("⚠️ Supabase URL or Anon Key is missing from .env.local!");
}

declare global {
  var supabaseInstance: SupabaseClient | undefined;
}

export const supabase =
  globalThis.supabaseInstance ??
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Bypasses Firefox Web Lock API lock contention
      lock: async (name, acquireTimeout, fn) => await fn(),
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.supabaseInstance = supabase;
}