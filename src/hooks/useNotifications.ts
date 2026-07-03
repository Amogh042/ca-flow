import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as notifService from "@/services/notifications";
import type { Notification } from "@/services/notifications";
import { useAuth } from "@/contexts/AuthContext";

export function useNotifications() {
  const { user } = useAuth();
  return useQuery<Notification[]>({
    queryKey: ["notifications", user?.email],
    queryFn: notifService.fetchNotifications,
    staleTime: 30_000,
    enabled: !!user?.email,
    placeholderData: [],
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notifService.markNotificationRead(id),
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notifService.markAllNotificationsRead(),
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
