import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { Filing } from "@/data/workspace";
import type { DBFiling } from "@/types/database";
import { toISOTimestampOrNull } from "@/lib/date";

function mapRowToFiling(r: DBFiling): Filing {
  return {
    id: r.id,
    clientId: r.client_id ?? "",
    title: r.title ?? "",
    dueDate: r.due_date ?? "",
    owner: r.owner ?? "",
    createdBy: r.user_id ?? undefined,
    status: (r.status as Filing["status"]) ?? "pending",
    entity: r.entity ?? "",
    blocker: r.blocker ?? undefined,
  };
}

export async function fetchFilings(): Promise<Filing[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from<DBFiling>("filings").select("*").order("due_date", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRowToFiling);
}

export async function fetchFilingsByClient(clientId?: string): Promise<Filing[]> {
  if (!isSupabaseConfigured()) return [];
  if (!clientId) return [];
  const { data, error } = await supabase!.from<DBFiling>("filings").select("*").eq("client_id", clientId).order("due_date", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapRowToFiling);
}

export async function createFiling(input: Omit<Filing, "id">): Promise<Filing> {
  if (!isSupabaseConfigured()) {
    return { id: `filing-local-${Date.now()}`, ...input } as Filing;
  }
  if (!input.clientId) {
    throw new Error("Filing must be attached to a valid client (clientId missing)");
  }

  try {
    // Ensure caller is authenticated; RLS policies often require an auth session
    let ownerVal: string | null | undefined = input.owner;
    let userId: string | null = null;
    try {
      const { data: userData } = await supabase!.auth.getUser();
      if (!userData?.user) throw new Error("Authentication required to create filings");
      userId = userData.user.id;
      if (!ownerVal) ownerVal = userId;
    } catch (e) {
      throw new Error("Authentication required to create filings");
    }

    const payload = {
      client_id: input.clientId,
      title: input.title || null,
      filing_type: input.entity || "Other",
      due_date: input.dueDate || null,
      owner: ownerVal || null,
      user_id: userId,
      status: input.status || "pending",
      entity: input.entity || null,
      blocker: input.blocker || null,
    };

    const { data, error } = await supabase!.from<DBFiling>("filings").insert(payload).select().single();
    if (error) {
      console.error("Create filing error:", error.message, error.details, error.hint);
      throw error;
    }
    return mapRowToFiling(data as DBFiling);
  } catch (err: any) {
    const message = err?.message || "Failed to create filing";
    console.error("Create filing failed:", message);
    throw new Error(message);
  }
}

export async function updateFiling(id: string, patch: Partial<Filing>): Promise<Filing> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  const payload: Partial<DBFiling> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.dueDate !== undefined) payload.due_date = patch.dueDate || null;
  if (patch.owner !== undefined) payload.owner = patch.owner;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.entity !== undefined) payload.entity = patch.entity;
  if (patch.blocker !== undefined) payload.blocker = patch.blocker;

  const { data, error } = await supabase!.from<DBFiling>("filings").update(payload).eq("id", id).select().single();
  if (error) {
    console.error("Update filing error:", error.message, error.details, error.hint);
    throw error;
  }
  return mapRowToFiling(data as DBFiling);
}

export async function deleteFiling(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase!.from("filings").delete().eq("id", id);
  if (error) throw error;
}

export async function markFilingStatus(id: string, status: Filing["status"]): Promise<Filing> {
  return updateFiling(id, { status });
}

// TODO: add realtime subscription helper for filings table
