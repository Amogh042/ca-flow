import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as workflowsService from "@/services/workflows";
import type { Workflow } from "@/services/workflows";
import { queryKeys } from "@/types/database";

export function useWorkflows() {
  return useQuery<Workflow[]>({
    queryKey: queryKeys.workflows(),
    queryFn: workflowsService.fetchWorkflows,
    staleTime: 1000 * 60,
    placeholderData: [],
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation<Workflow, unknown, Omit<Workflow, "id">, { previous?: Workflow[] }>({
    mutationFn: workflowsService.createWorkflow,
    onMutate: async (newWf: Omit<Workflow, "id">) => {
      await qc.cancelQueries(queryKeys.workflows());
      const previous = qc.getQueryData<Workflow[]>(queryKeys.workflows());
      const tempId = `wf-tmp-${Date.now()}`;
      const temp = { id: tempId, ...newWf } as Workflow;
      qc.setQueryData(queryKeys.workflows(), (old) => [temp, ...(old || [])]);
      return { previous };
    },
    onError(err, newWf, ctx) {
      qc.setQueryData(queryKeys.workflows(), ctx?.previous);
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.workflows());
    },
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation<Workflow, unknown, [string, Partial<Workflow>], { previous?: Workflow[] }>({
    mutationFn: workflowsService.updateWorkflow,
    onMutate: async ([id, patch]: [string, Partial<Workflow>]) => {
      await qc.cancelQueries(queryKeys.workflows());
      const previous = qc.getQueryData<Workflow[]>(queryKeys.workflows());
      qc.setQueryData(queryKeys.workflows(), (old) => old?.map((w) => (w.id === id ? { ...w, ...patch } : w)));
      return { previous };
    },
    onError(err, variables, ctx) {
      qc.setQueryData(queryKeys.workflows(), ctx?.previous);
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.workflows());
    },
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string, { previous?: Workflow[] }>({
    mutationFn: workflowsService.deleteWorkflow,
    onMutate: async (id: string) => {
      await qc.cancelQueries(queryKeys.workflows());
      const previous = qc.getQueryData<Workflow[]>(queryKeys.workflows());
      qc.setQueryData(queryKeys.workflows(), (old) => old?.filter((w) => w.id !== id));
      return { previous };
    },
    onError(err, id, ctx) {
      qc.setQueryData(queryKeys.workflows(), ctx?.previous);
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.workflows());
    },
  });
}
