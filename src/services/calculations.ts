import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { CalculationRecord } from "@/data/workspace";

function mapRowToCalculation(r: any): CalculationRecord {
  return {
    id: r.id,
    clientId: r.client_id ?? "",
    title: r.calculator_type ?? "",
    subtitle: r.subtitle ?? "",
    savedAt: r.saved_at ?? r.created_at ?? "",
    owner: r.owner ?? r.user_id ?? "",
  };
}

export async function fetchCalculations(): Promise<CalculationRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from("calculations").select("*").order("created_at", { ascending: false });
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
  };

  const { data, error } = await supabase!.from("calculations").insert(payload).select().single();
  if (error) {
    console.error("Create calculation error:", error.message, error.details, error.hint);
    throw error;
  }
  return mapRowToCalculation(data);
}
