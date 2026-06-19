import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as documentsService from "@/services/documents";
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import type { DocumentRecord } from "@/data/workspace";
import { queryKeys } from "@/types/database";
import { toast } from "@/hooks/use-toast";

export function useDocuments() {
  return useQuery<DocumentRecord[]>({
    queryKey: queryKeys.documents(),
    queryFn: documentsService.fetchDocuments,
    staleTime: 1000 * 60,
    placeholderData: [],
  });
}

export function useDocumentsByClient(clientId?: string) {
  return useQuery<DocumentRecord[]>({
    queryKey: queryKeys.documents(clientId),
    queryFn: () => documentsService.fetchDocumentsByClient(clientId),
    enabled: !!clientId,
    placeholderData: [],
  });
}

export function useDocument(id?: string) {
  return useQuery<DocumentRecord | null>({
    queryKey: id ? queryKeys.document(id) : ["documents", "single"] as const,
    queryFn: () => documentsService.fetchDocumentById(id),
    enabled: !!id,
    placeholderData: null,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation<DocumentRecord, unknown, Omit<DocumentRecord, "id" | "updatedAt"> & { file?: File }, { previous?: DocumentRecord[]; tempId?: string }>({
    mutationFn: documentsService.createDocument,
    onMutate: async (newDoc) => {
      await qc.cancelQueries(queryKeys.documents());
      const previous = qc.getQueryData<DocumentRecord[]>(queryKeys.documents());
      const tempId = `doc-tmp-${Date.now()}`;
      let optimisticUploadedBy = "";
      if (isSupabaseConfigured()) {
        try {
          const { data: userData } = await supabase!.auth.getUser();
          optimisticUploadedBy = userData?.user?.id ?? "";
        } catch (_) {
          optimisticUploadedBy = "";
        }
        if (!optimisticUploadedBy) {
          throw new Error("Authentication required to upload documents");
        }
      }

      const temp: DocumentRecord = {
        id: tempId,
        clientId: newDoc.clientId,
        name: newDoc.name || newDoc.file?.name || "",
        type: newDoc.type || newDoc.file?.type || "file",
        period: newDoc.period || "",
        status: newDoc.status || "processing",
        source: newDoc.source || "upload",
        updatedAt: new Date().toISOString(),
        fileName: newDoc.file?.name,
        fileSize: newDoc.file?.size,
        mimeType: newDoc.file?.type,
        storagePath: newDoc.file ? `uploading://${newDoc.file.name}` : undefined,
        uploadedBy: optimisticUploadedBy,
        createdAt: new Date().toISOString(),
      };
      qc.setQueryData(queryKeys.documents(), (old) => [temp, ...(old || [])]);
      return { previous, tempId };
    },
    onError(err, newDoc, ctx) {
      qc.setQueryData(queryKeys.documents(), ctx?.previous);
      const message = (err as any)?.message || "Could not upload document";
      toast({ title: "Upload failed", description: message });
    },
    onSuccess(data, variables, ctx) {
      // Replace temp entry with server-provided row
      qc.setQueryData(queryKeys.documents(), (old) => (old || []).map((d) => (d.id === ctx?.tempId ? data : d)));
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.documents());
    },
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation<DocumentRecord, unknown, [string, Partial<DocumentRecord>], { previous?: DocumentRecord[] }>({
    mutationFn: documentsService.updateDocument,
    onMutate: async ([id, patch]: [string, Partial<DocumentRecord>]) => {
      await qc.cancelQueries(queryKeys.documents());
      const previous = qc.getQueryData<DocumentRecord[]>(queryKeys.documents());
      qc.setQueryData(queryKeys.documents(), (old) => old?.map((d) => (d.id === id ? { ...d, ...patch } : d)));
      return { previous };
    },
    onError(err, variables, ctx) {
      qc.setQueryData(queryKeys.documents(), ctx?.previous);
      const message = (err as any)?.message || "Could not update document";
      toast({ title: "Update failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.documents());
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string, { previous?: DocumentRecord[] }>({
    mutationFn: documentsService.deleteDocument,
    onMutate: async (id: string) => {
      await qc.cancelQueries(queryKeys.documents());
      const previous = qc.getQueryData<DocumentRecord[]>(queryKeys.documents());
      qc.setQueryData(queryKeys.documents(), (old) => old?.filter((d) => d.id !== id));
      return { previous };
    },
    onError(err, id, ctx) {
      qc.setQueryData(queryKeys.documents(), ctx?.previous);
      const message = (err as any)?.message || "Could not delete document";
      toast({ title: "Delete failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.documents());
    },
  });
}
