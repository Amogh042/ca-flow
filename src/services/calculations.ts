import { supabase, isSupabaseConfigured, getVisibleUserIds } from "./supabaseClient";
import type { CalculationRecord } from "@/data/workspace";

function parseJson(v: any): Record<string, any> | null {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return null; }
}

function mapRowToCalculation(r: any): CalculationRecord {
  return {
    id: r.id,
    clientId: r.client_id ?? "",
    title: r.calculator_type ?? "",
    subtitle: r.subtitle ?? "",
    savedAt: r.saved_at ?? r.created_at ?? "",
    owner: r.owner ?? r.user_id ?? "",
    inputs: parseJson(r.input_data) ?? parseJson(r.input) ?? null,
    outputs: parseJson(r.output_data) ?? parseJson(r.result) ?? null,
  };
}

export async function fetchCalculations(): Promise<CalculationRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const userIds = await getVisibleUserIds();
  let query = supabase!.from("calculations").select("*").order("created_at", { ascending: false });
  if (userIds.length > 0) query = query.in("user_id", userIds);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRowToCalculation);
}

export async function createCalculation(input: Omit<CalculationRecord, "id">): Promise<CalculationRecord> {
  if (!isSupabaseConfigured()) {
    return { id: `calc-local-${Date.now()}`, ...input } as CalculationRecord;
  }

  let userId: string | null = null;
  try {
    const { data: userData } = await supabase!.auth.getUser();
    if (!userData?.user) throw new Error("Authentication required to save calculations");
    userId = userData.user.id;
  } catch (e) {
    throw new Error("Authentication required to save calculations");
  }

  const payload: Record<string, any> = {
    client_id: input.clientId,
    calculator_type: input.title,
    subtitle: input.subtitle || null,
    user_id: userId,
    owner: userId,
    saved_at: new Date().toISOString(),
    input_data: input.inputs ? JSON.stringify(input.inputs) : null,
    output_data: input.outputs ? JSON.stringify(input.outputs) : null,
  };

  const { data, error } = await supabase!.from("calculations").insert(payload).select().single();
  if (error) {
    console.error("Create calculation error:", error.message, error.details, error.hint);
    throw error;
  }
  return mapRowToCalculation(data);
}

export async function deleteCalculations(ids: string[]): Promise<void> {
  if (!isSupabaseConfigured() || ids.length === 0) return;
  const { error } = await supabase!.from("calculations").delete().in("id", ids);
  if (error) {
    console.error("Delete calculations error:", error.message, error.details, error.hint);
    throw error;
  }
}
