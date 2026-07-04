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

let _teamIdsCache: { ids: string[]; ts: number } | null = null;
const TEAM_CACHE_TTL = 60_000;

/**
 * Returns every user_id whose data the current user should see.
 * Bidirectional: the owner sees members' data and members see the
 * owner's + each other's data.  For users not on any team, returns
 * just their own id.  Result is cached for 60 s.
 */
export async function getVisibleUserIds(): Promise<string[]> {
  if (!supabase) return [];

  if (_teamIdsCache && Date.now() - _teamIdsCache.ts < TEAM_CACHE_TTL) {
    return _teamIdsCache.ids;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const ids = new Set<string>([user.id]);

  try {
    const email = user.email;
    if (!email) {
      _teamIdsCache = { ids: [user.id], ts: Date.now() };
      return [user.id];
    }

    let teamId: string | null = null;

    // 1. Am I a team owner?
    const { data: ownedTeam } = await supabase
      .from("teams")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (ownedTeam) {
      teamId = ownedTeam.id;
    }

    // 2. If not an owner, am I a member?
    if (!teamId) {
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id, user_id, teams(owner_id)")
        .eq("email", email)
        .maybeSingle();

      if (membership) {
        teamId = membership.team_id;
        const ownerId = (membership as any).teams?.owner_id;
        if (ownerId) ids.add(ownerId);

        // Stamp our user_id on the membership row so the owner's
        // queries can resolve us by user_id later.
        if (!membership.user_id) {
          supabase
            .from("team_members")
            .update({ user_id: user.id })
            .eq("team_id", teamId)
            .eq("email", email)
            .then();
        }
      }
    }

    // 3. Collect all user_ids in this team
    if (teamId) {
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("team_id", teamId)
        .not("user_id", "is", null);

      if (members) {
        for (const m of members) {
          if (m.user_id) ids.add(m.user_id);
        }
      }
    }
  } catch {
    // team lookup failed — fall back to own data only
  }

  const result = Array.from(ids);
  _teamIdsCache = { ids: result, ts: Date.now() };
  return result;
}
