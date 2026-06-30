import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { CalculationRecord } from "@/data/workspace";
import type { DBCalculation, DBCalculationInsert } from "@/types/database";
import { toISOTimestampOrNull } from "@/lib/date";

function mapRowToCalculation(r: DBCalculation): CalculationRecord {
  return {
    id: r.id,
    clientId: r.client_id,
    title: r.title,
    subtitle: r.subtitle ?? "",
    savedAt: r.saved_at ?? "",
    owner: r.owner ?? "",
  };
}

export async function fetchCalculations(): Promise<CalculationRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from<DBCalculation>("calculations").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRowToCalculation);
}

export async function createCalculation(input: Omit<CalculationRecord, "id">): Promise<CalculationRecord> {
  if (!isSupabaseConfigured()) {
    return { id: `calc-local-${Date.now()}`, ...input } as CalculationRecord;
  }
  try {
    let ownerVal: string | null | undefined = input.owner;
    try {
      const { data: userData } = await supabase!.auth.getUser();
      if (!userData?.user) throw new Error("Authentication required to save calculations");
      if (!ownerVal && userData.user?.id) ownerVal = userData.user.id;
    } catch (e) {
      throw new Error("Authentication required to save calculations");
    }

    const payload: DBCalculationInsert = {
      client_id: input.clientId,
      title: input.title,
      subtitle: input.subtitle || null,
      saved_at: toISOTimestampOrNull(input.savedAt),
      owner: ownerVal || null,
    };

    const { data, error } = await supabase!.from<DBCalculation>("calculations").insert(payload).select().single();
    if (error) {
      console.error("Create calculation error:", error.message, error.details, error.hint);
      throw error;
    }
    return mapRowToCalculation(data as DBCalculation);
  } catch (err: any) {
    const message = err?.message || "Failed to save calculation";
    console.error("Create calculation failed:", message);
    throw new Error(message);
  }
}
