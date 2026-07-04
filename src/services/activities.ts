import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { ActivityRecord } from "@/data/workspace";
import type { DBActivity, DBActivityInsert } from "@/types/database";
import { toISOTimestampOrNull } from "@/lib/date";

function mapRowToActivity(r: DBActivity): ActivityRecord {
  return {
    id: r.id,
    clientId: r.client_id ?? undefined,
    title: r.title,
    detail: r.detail,
    actor: r.actor,
    time: r.time,
    kind: r.kind,
  };
}

export async function fetchActivities(): Promise<ActivityRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from<DBActivity>("activities").select("*").order("created_at", { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []).map(mapRowToActivity);
}

export async function createActivity(activity: ActivityRecord): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    let actorVal = activity.actor;
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase!.auth.getUser();
      userId = userData?.user?.id ?? null;
      if (!actorVal && userId) actorVal = userId;
    } catch (_) {}

    const payload: DBActivityInsert | Partial<DBActivity> = {
      id: activity.id,
      user_id: userId,
      client_id: activity.clientId || null,
      title: activity.title,
      detail: activity.detail,
      actor: actorVal,
      time: toISOTimestampOrNull(activity.time) ?? new Date().toISOString(),
      kind: activity.kind,
    };
    const { error } = await supabase!.from<DBActivity>("activities").insert(payload as Partial<DBActivity>);
    if (error) throw error;
  } catch (err: any) {
    const message = err?.message || "Failed to create activity";
    throw new Error(message);
  }
}
