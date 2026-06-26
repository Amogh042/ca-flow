import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as activitiesService from "@/services/activities";
import type { ActivityRecord } from "@/data/workspace";
import { queryKeys } from "@/types/database";
import { toast } from "@/hooks/use-toast";

export function useActivities() {
  return useQuery<ActivityRecord[]>({
    queryKey: queryKeys.activities(),
    queryFn: activitiesService.fetchActivities,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation<void, unknown, ActivityRecord, { previous?: ActivityRecord[] }>({
    mutationFn: activitiesService.createActivity,
    onMutate: async (newActivity: ActivityRecord) => {
      await qc.cancelQueries(queryKeys.activities());
      const previous = qc.getQueryData<ActivityRecord[]>(queryKeys.activities());
      qc.setQueryData(queryKeys.activities(), (old) => [newActivity, ...(old || [])]);
      return { previous };
    },
    onError(err, newActivity, ctx) {
      qc.setQueryData(queryKeys.activities(), ctx?.previous);
      const message = (err as any)?.message || "Could not create activity";
      toast({ title: "Activity failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.activities());
    },
  });
}
