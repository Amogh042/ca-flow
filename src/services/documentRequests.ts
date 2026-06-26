import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { DBDocumentRequest, DBDocumentRequestInsert, DocumentRequestStatus } from "@/types/database";
import { toISOTimestampOrNull } from "@/lib/date";

export type DocumentRequest = {
  id: string;
  clientId: string;
  clientName?: string;
  title: string;
  description?: string;
  dueDate?: string;
  status: DocumentRequestStatus;
  requestedBy?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
};

function mapRow(r: DBDocumentRequest): DocumentRequest {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.clients?.name ?? undefined,
    title: r.title,
    description: r.description ?? undefined,
    dueDate: r.due_date ?? undefined,
    status: r.status,
    requestedBy: r.requested_by ?? undefined,
    documentId: r.document_id ?? undefined,
    createdAt: r.created_at ?? undefined,
    updatedAt: r.updated_at ?? undefined,
  };
}

export async function fetchDocumentRequests(): Promise<DocumentRequest[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!
    .from<DBDocumentRequest>("document_requests")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function fetchDocumentRequestsByClient(clientId?: string): Promise<DocumentRequest[]> {
  if (!isSupabaseConfigured() || !clientId) return [];
  const { data, error } = await supabase!
    .from<DBDocumentRequest>("document_requests")
    .select("*, clients(name)")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function createDocumentRequest(input: Omit<DocumentRequest, "id" | "clientName" | "createdAt" | "updatedAt">): Promise<DocumentRequest> {
  if (!isSupabaseConfigured()) {
    return { id: `dr-local-${Date.now()}`, ...input } as DocumentRequest;
  }

  const payload: DBDocumentRequestInsert = {
    client_id: input.clientId,
    title: input.title,
    description: input.description || null,
    due_date: toISOTimestampOrNull(input.dueDate),
    status: input.status,
    requested_by: input.requestedBy || null,
    document_id: input.documentId || null,
  };

  const { data, error } = await supabase!
    .from<DBDocumentRequest>("document_requests")
    .insert(payload)
    .select("*, clients(name)")
    .single();
  if (error) throw error;
  return mapRow(data as DBDocumentRequest);
}

export async function updateDocumentRequest(id: string, patch: Partial<DocumentRequest>): Promise<DocumentRequest> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  const payload: Partial<DBDocumentRequest> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.dueDate !== undefined) payload.due_date = toISOTimestampOrNull(patch.dueDate);
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.requestedBy !== undefined) payload.requested_by = patch.requestedBy;
  if (patch.documentId !== undefined) payload.document_id = patch.documentId;

  const { data, error } = await supabase!
    .from<DBDocumentRequest>("document_requests")
    .update(payload)
    .eq("id", id)
    .select("*, clients(name)")
    .single();
  if (error) throw error;
  return mapRow(data as DBDocumentRequest);
}

export async function deleteDocumentRequest(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase!.from("document_requests").delete().eq("id", id);
  if (error) throw error;
}
