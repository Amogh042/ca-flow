import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { CalculationRecord } from "@/data/workspace";

function mapRowToCalculation(r: any): CalculationRecord {
  return {
    id: r.id,
    clientId: r.client_id ?? "",
    title: r.calculator_name ?? r.title ?? "",
    subtitle: r.calculator_slug ?? r.subtitle ?? "",
    savedAt: r.created_at ?? r.saved_at ?? "",
    owner: r.created_by ?? r.owner ?? "",
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

  let createdBy: string | null = null;
  try {
    const { data: userData } = await supabase!.auth.getUser();
    if (!userData?.user) throw new Error("Authentication required to save calculations");
    createdBy = userData.user.id;
  } catch (e) {
    throw new Error("Authentication required to save calculations");
  }

  // Try naming convention A: calculator_name / calculator_slug / created_by
  const payloadA: Record<string, any> = {
    client_id: input.clientId,
    calculator_name: input.title,
    calculator_slug: input.subtitle || null,
    created_by: createdBy,
  };

  const resA = await supabase!.from("calculations").insert(payloadA).select().single();
  if (!resA.error) return mapRowToCalculation(resA.data);

  // If A failed with schema error, try naming convention B: title / subtitle / owner / saved_at
  if (resA.error.message?.includes("schema cache") || resA.error.message?.includes("column")) {
    console.warn("Calculations: convention A failed, trying convention B.", resA.error.message);
    const payloadB: Record<string, any> = {
      client_id: input.clientId,
      title: input.title,
      subtitle: input.subtitle || null,
      saved_at: new Date().toISOString(),
      owner: createdBy,
    };

    const resB = await supabase!.from("calculations").insert(payloadB).select().single();
    if (!resB.error) return mapRowToCalculation(resB.data);

    console.error("Create calculation error (both conventions failed):", resB.error.message);
    throw resB.error;
  }

  console.error("Create calculation error:", resA.error.message);
  throw resA.error;
}
