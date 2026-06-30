import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as calculationsService from "@/services/calculations";
import type { CalculationRecord } from "@/data/workspace";
import { queryKeys } from "@/types/database";
import { toast } from "@/hooks/use-toast";

export function useCalculations() {
  return useQuery<CalculationRecord[]>({
    queryKey: queryKeys.calculations(),
    queryFn: calculationsService.fetchCalculations,
    staleTime: 1000 * 60,
    placeholderData: [],
  });
}

export function useDeleteCalculations() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string[]>({
    mutationFn: calculationsService.deleteCalculations,
    onSuccess() {
      qc.invalidateQueries(queryKeys.calculations());
      toast({ title: "Deleted", description: "Calculations removed" });
    },
    onError(err) {
      const message = (err as any)?.message || "Could not delete calculations";
      toast({ title: "Delete failed", description: message });
    },
  });
}

export function useCreateCalculation() {
  const qc = useQueryClient();
  return useMutation<CalculationRecord, unknown, Omit<CalculationRecord, "id">, { previous?: CalculationRecord[] }>({
    mutationFn: calculationsService.createCalculation,
    onMutate: async (newCalc: Omit<CalculationRecord, "id">) => {
      await qc.cancelQueries(queryKeys.calculations());
      const previous = qc.getQueryData<CalculationRecord[]>(queryKeys.calculations());
      const temp = { id: `calc-tmp-${Date.now()}`, ...newCalc } as CalculationRecord;
      qc.setQueryData(queryKeys.calculations(), (old) => [temp, ...(old || [])]);
      return { previous };
    },
    onError(err, newCalc, ctx) {
      qc.setQueryData(queryKeys.calculations(), ctx?.previous);
      const message = (err as any)?.message || "Could not save calculation";
      toast({ title: "Save failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.calculations());
    },
  });
}
