import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { CalculationRecord } from "@/data/workspace";
import type { DBCalculation, DBCalculationInsert } from "@/types/database";

function mapRowToCalculation(r: DBCalculation): CalculationRecord {
  return {
    id: r.id,
    clientId: r.client_id,
    title: r.calculator_name,
    subtitle: r.calculator_slug ?? "",
    savedAt: r.created_at ?? "",
    owner: r.created_by ?? "",
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
    let createdBy: string | null = null;
    try {
      const { data: userData } = await supabase!.auth.getUser();
      if (!userData?.user) throw new Error("Authentication required to save calculations");
      createdBy = userData.user.id;
    } catch (e) {
      throw new Error("Authentication required to save calculations");
    }

    const payload: DBCalculationInsert = {
      client_id: input.clientId,
      calculator_name: input.title,
      calculator_slug: input.subtitle || null,
      created_by: createdBy,
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
