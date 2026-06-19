/**
 * Supabase helper: expose runtime config and usage notes.
 *
 * This file does not require `@supabase/supabase-js` so the project
 * remains dependency-free until you opt to install the client.
 *
 * Usage (example):
 *
 * import { supabaseConfig } from '@/lib/supabase';
 * import { createClient } from '@supabase/supabase-js';
 *
 * const { url, key } = supabaseConfig();
 * if (url && key) {
 *   const supabase = createClient(url, key);
 * }
 */

export function supabaseConfig() {
  return {
    url: import.meta.env.VITE_SUPABASE_URL as string | undefined,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  };
}
