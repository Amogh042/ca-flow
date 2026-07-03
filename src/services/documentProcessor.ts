import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { DBDocument, DBActivity } from "@/types/database";

// Simple sleep helper
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function processDocument(documentId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // fetch the document row
    const { data: row, error: fetchErr } = await supabase!.from<DBDocument>("documents").select("*").eq("id", documentId).single();
    if (fetchErr || !row) {
      console.warn("Document not found for processing:", fetchErr);
      return;
    }

    // mark as processing
    await supabase!.from<DBDocument>("documents").update({ status: "processing" }).eq("id", documentId);

    // simulate extraction time
    await sleep(1200);

    // Create simulated extraction output (placeholder only — no business mock data)
    const fileName = row.file_name || row.name || "document";
    const extractedText = `Simulated extracted text for ${fileName}. Extraction is a placeholder for future AI parsing.`;
    const words = extractedText.split(/\s+/).length;
    const extractedData = { summary_length: extractedText.length, words, fileName };
    const aiSummary = extractedText.slice(0, 180);
    const aiTags = [] as string[];
    if (fileName.toLowerCase().endsWith(".pdf")) aiTags.push("pdf");
    if (fileName.toLowerCase().endsWith(".xlsx") || fileName.toLowerCase().endsWith(".xls")) aiTags.push("spreadsheet");
    if (row.mime_type && row.mime_type.includes("spreadsheet")) aiTags.push("spreadsheet");

    const ext = (fileName.split(".").pop() || "").toLowerCase();
    const documentType = ext === "pdf" ? "pdf" : ext === "xlsx" || ext === "xls" ? "spreadsheet" : "document";
    const confidenceScore = Math.round((0.7 + Math.random() * 0.25) * 100) / 100; // 0.7-0.95

    // update row with extracted data
    const { error: updateErr } = await supabase!.from<DBDocument>("documents").update({
      extracted_text: extractedText,
      extracted_data: extractedData,
      ai_summary: aiSummary,
      ai_tags: aiTags,
      document_type: documentType,
      confidence_score: confidenceScore,
      status: "extracted",
    }).eq("id", documentId);

    if (updateErr) throw updateErr;

    let userId: string | null = null;
    try {
      const { data: userData } = await supabase!.auth.getUser();
      userId = userData?.user?.id ?? null;
    } catch (_) {}

    const activity: Partial<DBActivity> = {
      id: `act-${Date.now()}`,
      user_id: userId,
      client_id: row.client_id,
      title: "Document extracted",
      detail: `Extraction finished for ${fileName}`,
      actor: "system",
      time: new Date().toISOString(),
      kind: "document",
    };

    await supabase!.from<DBActivity>("activities").insert(activity as DBActivity);
  } catch (err: any) {
    console.warn("Document processing failed", err?.message || err);
    try {
      await supabase!.from<DBDocument>("documents").update({ status: "failed" }).eq("id", documentId);
    } catch (_) {}
    try {
      let failUserId: string | null = null;
      try {
        const { data: ud } = await supabase!.auth.getUser();
        failUserId = ud?.user?.id ?? null;
      } catch (_) {}
      await supabase!.from<DBActivity>("activities").insert({
        id: `act-${Date.now()}`,
        user_id: failUserId,
        client_id: null,
        title: "Document processing failed",
        detail: `Processing failed for document ${documentId}: ${err?.message || "unknown"}`,
        actor: "system",
        time: new Date().toISOString(),
        kind: "document",
      } as DBActivity);
    } catch (_) {}
  }
}
