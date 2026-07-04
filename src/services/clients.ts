import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type {
  ClientRecord,
  ActivityRecord,
} from "@/data/workspace";
import type { DBClient, DBActivity } from "@/types/database";
import { toISOTimestampOrNull } from "@/lib/date";

type NewClientInput = Omit<
  ClientRecord,
  "id" | "lastActivity" | "openTasks" | "unreadItems" | "documentsReadyPct"
>;

function mapRowToClient(r: DBClient): ClientRecord {
  return {
    id: r.id,
    name: r.name,
    entityType: r.entity_type,
    serviceLine: r.service_line,
    owner: r.owner,
    health: r.health,
    country: r.country ?? "",
    pan: r.pan ?? "",
    gstin: r.gstin,
    annualBilling: r.annual_billing ?? "",
    openTasks: r.open_tasks ?? 0,
    unreadItems: r.unread_items ?? 0,
    nextDeadline: r.next_deadline ?? "",
    lastActivity: r.last_activity ?? "No activity yet",
    documentsReadyPct: r.documents_ready_pct ?? 0,
    notes: r.notes ?? "",
    email: r.email,
    phone: r.phone,
  };
}

export async function fetchClients(): Promise<ClientRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from<DBClient>("clients").select("*").order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRowToClient);
}

export async function createClient(input: NewClientInput): Promise<ClientRecord> {
  if (!isSupabaseConfigured()) {
    // Fallback: return a locally-generated client (caller should treat as optimistic)
    return {
      id: `client-local-${Date.now()}`,
      ...input,
      lastActivity: "Just now",
      openTasks: 0,
      unreadItems: 0,
      documentsReadyPct: 0,
    } as ClientRecord;
  }
  try {
    // Attach authenticated user id as the owner to satisfy common RLS rules.
    // If Supabase is configured, a valid auth session is required for inserts.
    let ownerVal = input.owner;
    const { data: userData } = await supabase!.auth.getUser();
    if (!userData?.user?.id) {
      throw new Error("Authentication required to create workspace");
    }
    ownerVal = userData.user.id;

    const { data: planRow } = await supabase!
      .from("user_plans")
      .select("plan")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    const userPlan = planRow?.plan ?? "free";
    if (userPlan === "free") {
      const { count } = await supabase!
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userData.user.id);
      if ((count ?? 0) >= 1) {
        throw new Error("Free plan is limited to 1 client. Upgrade to add more.");
      }
    }

    const payload = {
      name: input.name,
      entity_type: input.entityType,
      service_line: input.serviceLine,
      owner: ownerVal,
      user_id: userData.user.id,
      created_by: userData.user.id,
      health: input.health,
      country: input.country || null,
      pan: input.pan || null,
      gstin: input.gstin || null,
      annual_billing: input.annualBilling || null,
      open_tasks: input.openTasks ?? 0,
      unread_items: input.unreadItems ?? 0,
        next_deadline: toISOTimestampOrNull(input.nextDeadline),
        last_activity: toISOTimestampOrNull(input.lastActivity),
      documents_ready_pct: input.documentsReadyPct ?? 0,
      notes: input.notes || "",
      email: input.email || null,
      phone: input.phone || null,
    };

    const { data, error } = await supabase!.from<DBClient>("clients").insert(payload).select().single();
    if (error) throw error;
    return mapRowToClient(data as DBClient);
  } catch (err: any) {
    // Normalize error so callers can show friendly messages.
    const message = err?.message || "Failed to create workspace";
    throw new Error(message);
  }
}

export async function updateClient(id: string, patch: Partial<ClientRecord>): Promise<ClientRecord> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  const payload: Partial<DBClient> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.entityType !== undefined) payload.entity_type = patch.entityType;
  if (patch.serviceLine !== undefined) payload.service_line = patch.serviceLine;
  if (patch.owner !== undefined) payload.owner = patch.owner;
  if (patch.health !== undefined) payload.health = patch.health;
  if (patch.country !== undefined) payload.country = patch.country;
  if (patch.pan !== undefined) payload.pan = patch.pan;
  if (patch.gstin !== undefined) payload.gstin = patch.gstin;
  if (patch.annualBilling !== undefined) payload.annual_billing = patch.annualBilling;
  if (patch.openTasks !== undefined) payload.open_tasks = patch.openTasks;
  if (patch.unreadItems !== undefined) payload.unread_items = patch.unreadItems;
  if (patch.nextDeadline !== undefined) payload.next_deadline = toISOTimestampOrNull(patch.nextDeadline);
  if (patch.lastActivity !== undefined) payload.last_activity = toISOTimestampOrNull(patch.lastActivity);
  if (patch.documentsReadyPct !== undefined) payload.documents_ready_pct = patch.documentsReadyPct;
  if (patch.notes !== undefined) payload.notes = patch.notes;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.phone !== undefined) payload.phone = patch.phone;

  const { data, error } = await supabase!.from<DBClient>("clients").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return mapRowToClient(data as DBClient);
}

export async function deleteClient(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase!.from("clients").delete().eq("id", id);
  if (error) throw error;
}

// Small helper to create an activity associated with client changes (optional)
export async function createActivity(activity: ActivityRecord): Promise<void> {
  if (!isSupabaseConfigured()) return;
  let userId: string | null = null;
  try {
    const { data: userData } = await supabase!.auth.getUser();
    userId = userData?.user?.id ?? null;
  } catch (_) {}

  const payload: Partial<DBActivity> = {
    id: activity.id,
    user_id: userId,
    client_id: activity.clientId || null,
    title: activity.title,
    detail: activity.detail,
    actor: activity.actor,
    time: toISOTimestampOrNull(activity.time) ?? new Date().toISOString(),
    kind: activity.kind,
  };
  const { error } = await supabase!.from<DBActivity>("activities").insert(payload);
  if (error) throw error;
}
