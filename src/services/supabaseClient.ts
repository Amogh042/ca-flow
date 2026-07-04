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

/**
 * Returns the list of user_ids whose data the current user should see.
 * Always includes the current user; also includes the team owner if
 * the current user is a team member (inheriting Firm plan).
 */
export async function getVisibleUserIds(): Promise<string[]> {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const ids = [user.id];

  try {
    const email = user.email;
    if (!email) return ids;

    const { data: membership } = await supabase
      .from("team_members")
      .select("team_id, teams(owner_id)")
      .eq("email", email)
      .maybeSingle();

    const ownerId = (membership as any)?.teams?.owner_id;
    if (ownerId && ownerId !== user.id) {
      ids.push(ownerId);
    }
  } catch {
    // team lookup failed — fall back to own data only
  }

  return ids;
}
