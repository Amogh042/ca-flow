import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { DocumentRecord } from "@/data/workspace";
import type { DBDocument, DBDocumentInsert } from "@/types/database";
import * as documentProcessor from "./documentProcessor";

function mapRowToDocument(r: DBDocument): DocumentRecord {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.file_name ?? r.name,
    type: r.type,
    period: r.period,
    status: r.status,
    source: r.source,
    updatedAt: r.updated_at ?? r.created_at ?? "",
    fileName: r.file_name ?? r.name,
    fileSize: r.file_size ?? 0,
    mimeType: r.mime_type ?? "",
    storagePath: r.storage_path ?? "",
    uploadedBy: r.uploaded_by ?? "",
    createdAt: r.created_at ?? undefined,
    extractedText: r.extracted_text ?? undefined,
    extractedData: r.extracted_data ?? undefined,
    aiSummary: r.ai_summary ?? undefined,
    aiTags: r.ai_tags ?? undefined,
    documentType: r.document_type ?? undefined,
    confidenceScore: r.confidence_score ?? undefined,
  };
}

export async function fetchDocuments(): Promise<DocumentRecord[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from<DBDocument>("documents").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRowToDocument);
}

export async function fetchDocumentsByClient(clientId?: string): Promise<DocumentRecord[]> {
  if (!isSupabaseConfigured() || !clientId) return [];
  const { data, error } = await supabase!.from<DBDocument>("documents").select("*").eq("client_id", clientId).order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRowToDocument);
}

export async function fetchDocumentById(id?: string): Promise<DocumentRecord | null> {
  if (!isSupabaseConfigured() || !id) return null;
  const { data, error } = await supabase!.from<DBDocument>("documents").select("*").eq("id", id).single();
  if (error) {
    // return null for not found
    if ((error as any)?.code === "PGRST116") return null;
    throw error;
  }
  return mapRowToDocument(data as DBDocument);
}

export async function createDocument(input: Omit<DocumentRecord, "id" | "updatedAt"> & { file?: File }): Promise<DocumentRecord> {
  if (!isSupabaseConfigured()) {
    return {
      id: `doc-local-${Date.now()}`,
      ...input,
      updatedAt: new Date().toISOString(),
      fileName: input.file?.name,
      fileSize: input.file?.size,
      mimeType: input.file?.type,
      storagePath: input.file ? `local://${input.file.name}` : undefined,
      uploadedBy: "local",
      createdAt: new Date().toISOString(),
    } as DocumentRecord;
  }
  if (!input.clientId) {
    throw new Error("Document must be attached to a valid client (clientId missing)");
  }

  try {
    // Ensure caller is authenticated; RLS policies often require an auth session
    let userId: string | null | undefined = undefined;
    try {
      const { data: userData } = await supabase!.auth.getUser();
      if (!userData?.user) throw new Error("Authentication required to upload documents");
      userId = userData.user.id;
    } catch (e) {
      throw new Error("Authentication required to upload documents");
    }

    // If a file is provided, upload to Supabase Storage first
    if (input.file) {
      const file = input.file;
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${input.clientId}/${year}/${month}/${Date.now()}-${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase!.storage
        .from("client-documents")
        .upload(storagePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const payload: DBDocumentInsert = {
        client_id: input.clientId,
        name: input.name || file.name,
        type: input.type || file.type || "file",
        period: input.period || null,
        // mark uploaded; background worker will move to processing/extracted
        status: input.status || "uploaded",
        source: input.source || "upload",
        uploaded_by: userId || null,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      };

      const { data, error } = await supabase!.from<DBDocument>("documents").insert(payload).select().single();
      if (error) throw error;
      const row = mapRowToDocument(data as DBDocument);
      // trigger background processing (best-effort; do not block response)
      void documentProcessor.processDocument(row.id).catch((e) => console.warn("Document processing failed:", e));
      return row;
    }

    // No file: just insert metadata row
    const payload: DBDocumentInsert = {
      client_id: input.clientId,
      name: input.name,
      type: input.type,
      period: input.period,
      status: input.status,
      source: input.source,
      uploaded_by: userId || null,
    };

    const { data, error } = await supabase!.from<DBDocument>("documents").insert(payload).select().single();
    if (error) throw error;
    const row = mapRowToDocument(data as DBDocument);
    // trigger background processing for metadata-only uploads as well
    void documentProcessor.processDocument(row.id).catch((e) => console.warn("Document processing failed:", e));
    return row;
  } catch (err: any) {
    const message = err?.message || "Failed to create document";
    throw new Error(message);
  }
}

export async function updateDocument(id: string, patch: Partial<DocumentRecord>): Promise<DocumentRecord> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const payload: Partial<DBDocument> = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.period !== undefined) payload.period = patch.period;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.source !== undefined) payload.source = patch.source;
  if (patch.fileName !== undefined) payload.file_name = patch.fileName;
  if (patch.fileSize !== undefined) payload.file_size = patch.fileSize;
  if (patch.mimeType !== undefined) payload.mime_type = patch.mimeType;
  if (patch.storagePath !== undefined) payload.storage_path = patch.storagePath;
  if ((patch as any).extractedText !== undefined) payload.extracted_text = (patch as any).extractedText;
  if ((patch as any).extractedData !== undefined) payload.extracted_data = (patch as any).extractedData;
  if ((patch as any).aiSummary !== undefined) payload.ai_summary = (patch as any).aiSummary;
  if ((patch as any).aiTags !== undefined) payload.ai_tags = (patch as any).aiTags;
  if ((patch as any).documentType !== undefined) payload.document_type = (patch as any).documentType;
  if ((patch as any).confidenceScore !== undefined) payload.confidence_score = (patch as any).confidenceScore;

  const { data, error } = await supabase!.from<DBDocument>("documents").update(payload).eq("id", id).select().single();
  if (error) throw error;
  return mapRowToDocument(data as DBDocument);
}

export async function deleteDocument(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    // Fetch storage_path if present so we can remove the object from storage
    const { data: row, error: selectErr } = await supabase!.from<DBDocument>("documents").select("storage_path").eq("id", id).single();
    if (selectErr && selectErr.code !== "PGRST116") {
      // ignore not found or proceed to attempt delete
    }
    const storagePath = (row as any)?.storage_path;
    if (storagePath) {
      try {
        const { error: rmErr } = await supabase!.storage.from("client-documents").remove([storagePath]);
        if (rmErr) {
          // log but don't block DB delete
          console.warn("Failed to remove storage object", rmErr);
        }
      } catch (e) {
        console.warn("Storage remove failed", e);
      }
    }

    const { error } = await supabase!.from("documents").delete().eq("id", id);
    if (error) throw error;
  } catch (err: any) {
    const message = err?.message || "Failed to delete document";
    throw new Error(message);
  }
}

// TODO: add file upload helpers (to storage) and realtime notifications.
