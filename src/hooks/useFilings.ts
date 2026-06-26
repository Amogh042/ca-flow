import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as filingsService from "@/services/filings";
import type { Filing } from "@/data/workspace";
import { queryKeys } from "@/types/database";
import { toast } from "@/hooks/use-toast";

export function useFilings() {
  return useQuery<Filing[]>({
    queryKey: queryKeys.filings(),
    queryFn: filingsService.fetchFilings,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

export function useFilingsByClient(clientId?: string) {
  return useQuery<Filing[]>({
    queryKey: queryKeys.filings(clientId),
    queryFn: () => filingsService.fetchFilingsByClient(clientId),
    enabled: !!clientId,
    placeholderData: [],
  });
}

export function useCreateFiling() {
  const qc = useQueryClient();
  return useMutation<Filing, unknown, Omit<Filing, "id">, { previous?: Filing[]; tempId?: string }>({
    mutationFn: filingsService.createFiling,
    onMutate: async (newFiling: Omit<Filing, "id">) => {
      await qc.cancelQueries(queryKeys.filings());
      const previous = qc.getQueryData<Filing[]>(queryKeys.filings());
      const tempId = `filing-tmp-${Date.now()}`;
      const temp = { id: tempId, ...newFiling } as Filing;
      qc.setQueryData(queryKeys.filings(), (old) => [temp, ...(old || [])]);
      return { previous, tempId };
    },
    onError(err, newFiling, ctx) {
      qc.setQueryData(queryKeys.filings(), ctx?.previous);
      const message = (err as any)?.message || "Could not create filing";
      toast({ title: "Create filing failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.filings());
    },
  });
}

export function useUpdateFiling() {
  const qc = useQueryClient();
  return useMutation<Filing, unknown, [string, Partial<Filing>], { previous?: Filing[] }>({
    mutationFn: filingsService.updateFiling,
    onMutate: async ([id, patch]: [string, Partial<Filing>]) => {
      await qc.cancelQueries(queryKeys.filings());
      const previous = qc.getQueryData<Filing[]>(queryKeys.filings());
      qc.setQueryData(queryKeys.filings(), (old) => old?.map((f) => (f.id === id ? { ...f, ...patch } : f)));
      return { previous };
    },
    onError(err, variables, ctx) {
      qc.setQueryData(queryKeys.filings(), ctx?.previous);
      const message = (err as any)?.message || "Could not update filing";
      toast({ title: "Update filing failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.filings());
    },
  });
}

export function useDeleteFiling() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string, { previous?: Filing[] }>({
    mutationFn: filingsService.deleteFiling,
    onMutate: async (id: string) => {
      await qc.cancelQueries(queryKeys.filings());
      const previous = qc.getQueryData<Filing[]>(queryKeys.filings());
      qc.setQueryData(queryKeys.filings(), (old) => old?.filter((f) => f.id !== id));
      return { previous };
    },
    onError(err, id, ctx) {
      qc.setQueryData(queryKeys.filings(), ctx?.previous);
      const message = (err as any)?.message || "Could not delete filing";
      toast({ title: "Delete filing failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.filings());
    },
  });
}
