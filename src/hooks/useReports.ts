import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as reportsService from "@/services/reports";
import type { ReportRecord } from "@/data/workspace";
import { queryKeys } from "@/types/database";
import { toast } from "@/hooks/use-toast";

export function useReports() {
  return useQuery<ReportRecord[]>({
    queryKey: queryKeys.reports(),
    queryFn: reportsService.fetchReports,
    staleTime: 1000 * 60,
    placeholderData: [],
  });
}

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation<ReportRecord, unknown, Omit<ReportRecord, "id" | "updatedAt">, { previous?: ReportRecord[] }>({
    mutationFn: reportsService.createReport,
    onMutate: async (newReport: Omit<ReportRecord, "id" | "updatedAt">) => {
      await qc.cancelQueries(queryKeys.reports());
      const previous = qc.getQueryData<ReportRecord[]>(queryKeys.reports());
      const temp = { id: `rep-tmp-${Date.now()}`, ...newReport, updatedAt: "Just now" } as ReportRecord;
      qc.setQueryData(queryKeys.reports(), (old) => [temp, ...(old || [])]);
      return { previous };
    },
    onError(err, newReport, ctx) {
      qc.setQueryData(queryKeys.reports(), ctx?.previous);
      const message = (err as any)?.message || "Could not save report";
      toast({ title: "Save failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.reports());
    },
  });
}
