import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { ReportRecord } from "@/data/workspace";
import type { DBReport } from "@/types/database";

function mapRowToReport(r: DBReport): ReportRecord {
  return {
    id: r.id,
    clientId: r.client_id,
    title: r.title,
    type: r.type,
    period: r.period,
    status: r.status,
    owner: r.owner,
    updatedAt: r.updated_at ?? "",
  };
}

export async function fetchReports(): Promise<ReportRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from<DBReport>("reports").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRowToReport);
}

export async function createReport(input: Omit<ReportRecord, "id" | "updatedAt">): Promise<ReportRecord> {
  if (!isSupabaseConfigured()) {
    return { id: `report-local-${Date.now()}`, ...input, updatedAt: "Just now" } as ReportRecord;
  }
  try {
    // ensure authenticated; RLS policies commonly require a session
    let ownerVal: string | null | undefined = input.owner;
    try {
      const { data: userData } = await supabase!.auth.getUser();
      if (!userData?.user) throw new Error("Authentication required to create reports");
      if (!ownerVal && userData.user?.id) ownerVal = userData.user.id;
    } catch (e) {
      throw new Error("Authentication required to create reports");
    }

    const payload: Partial<DBReport> = {
      client_id: input.clientId,
      title: input.title,
      type: input.type,
      period: input.period,
      status: input.status,
      owner: ownerVal || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase!.from<DBReport>("reports").insert(payload).select().single();
    if (error) throw error;
    return mapRowToReport(data as DBReport);
  } catch (err: any) {
    const message = err?.message || "Failed to create report";
    throw new Error(message);
  }
}
