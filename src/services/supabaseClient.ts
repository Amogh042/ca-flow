import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "@/lib/supabase";

const { url, key } = supabaseConfig();

/**
 * Single exported `supabase` client. When environment is not configured
 * this value will be `null` and service functions should gracefully
 * fallback to local/no-op behavior.
 */
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export function isSupabaseConfigured(): boolean {
  return !!supabase;
}

