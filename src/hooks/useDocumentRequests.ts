import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as service from "@/services/documentRequests";
import type { DocumentRequest } from "@/services/documentRequests";
import { queryKeys } from "@/types/database";

export function useDocumentRequests() {
  return useQuery<DocumentRequest[]>({
    queryKey: queryKeys.documentRequests(),
    queryFn: service.fetchDocumentRequests,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

export function useDocumentRequestsByClient(clientId?: string) {
  return useQuery<DocumentRequest[]>({
    queryKey: queryKeys.documentRequests(clientId),
    queryFn: () => service.fetchDocumentRequestsByClient(clientId),
    enabled: !!clientId,
    placeholderData: [],
  });
}

export function useCreateDocumentRequest() {
  const qc = useQueryClient();
  return useMutation<DocumentRequest, unknown, Omit<DocumentRequest, "id" | "clientName" | "createdAt" | "updatedAt">, { previous?: DocumentRequest[] }>({
    mutationFn: service.createDocumentRequest,
    onMutate: async (input) => {
      await qc.cancelQueries(queryKeys.documentRequests());
      const previous = qc.getQueryData<DocumentRequest[]>(queryKeys.documentRequests());
      const temp: DocumentRequest = { id: `dr-tmp-${Date.now()}`, ...input, createdAt: new Date().toISOString() };
      qc.setQueryData(queryKeys.documentRequests(), (old) => [temp, ...(old || [])]);
      return { previous };
    },
    onError(_err, _input, ctx) {
      qc.setQueryData(queryKeys.documentRequests(), ctx?.previous);
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.documentRequests());
    },
  });
}

export function useUpdateDocumentRequest() {
  const qc = useQueryClient();
  return useMutation<DocumentRequest, unknown, [string, Partial<DocumentRequest>], { previous?: DocumentRequest[] }>({
    mutationFn: ([id, patch]) => service.updateDocumentRequest(id, patch),
    onMutate: async ([id, patch]) => {
      await qc.cancelQueries(queryKeys.documentRequests());
      const previous = qc.getQueryData<DocumentRequest[]>(queryKeys.documentRequests());
      qc.setQueryData(queryKeys.documentRequests(), (old) => old?.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      return { previous };
    },
    onError(_err, _vars, ctx) {
      qc.setQueryData(queryKeys.documentRequests(), ctx?.previous);
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.documentRequests());
    },
  });
}

export function useDeleteDocumentRequest() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string, { previous?: DocumentRequest[] }>({
    mutationFn: service.deleteDocumentRequest,
    onMutate: async (id) => {
      await qc.cancelQueries(queryKeys.documentRequests());
      const previous = qc.getQueryData<DocumentRequest[]>(queryKeys.documentRequests());
      qc.setQueryData(queryKeys.documentRequests(), (old) => old?.filter((r) => r.id !== id));
      return { previous };
    },
    onError(_err, _id, ctx) {
      qc.setQueryData(queryKeys.documentRequests(), ctx?.previous);
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.documentRequests());
    },
  });
}
