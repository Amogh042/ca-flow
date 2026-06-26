import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as clientsService from "@/services/clients";
import type { ClientRecord } from "@/data/workspace";
import { queryKeys } from "@/types/database";
import { toast } from "@/hooks/use-toast";

export function useClients() {
  return useQuery<ClientRecord[]>({
    queryKey: queryKeys.clients(),
    queryFn: clientsService.fetchClients,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  type NewClientInput = Omit<
    ClientRecord,
    "id" | "lastActivity" | "openTasks" | "unreadItems" | "documentsReadyPct"
  > & { _tmpId?: string };

  return useMutation<ClientRecord, unknown, NewClientInput, { previous?: ClientRecord[]; tempId?: string }>({
    mutationFn: clientsService.createClient,
    async onMutate(newClient: NewClientInput) {
      await qc.cancelQueries(queryKeys.clients());
      const previous = qc.getQueryData<ClientRecord[]>(queryKeys.clients());
      const tempId = newClient._tmpId ?? `tmp-${Date.now()}`;
      const tempClient: ClientRecord = {
        id: tempId,
        name: newClient.name,
        entityType: newClient.entityType,
        serviceLine: newClient.serviceLine,
        owner: newClient.owner,
        health: newClient.health,
        country: newClient.country ?? "",
        pan: newClient.pan ?? "",
        gstin: newClient.gstin,
        annualBilling: newClient.annualBilling ?? "",
        openTasks: 0,
        unreadItems: 0,
        nextDeadline: newClient.nextDeadline ?? "",
        lastActivity: "Just now",
        documentsReadyPct: 0,
        notes: newClient.notes ?? "",
        email: newClient.email,
        phone: newClient.phone,
      };

      qc.setQueryData(queryKeys.clients(), (old: ClientRecord[] | undefined) => [tempClient, ...(old || [])]);
      return { previous, tempId };
    },
    onError(err, newClient, ctx) {
      qc.setQueryData(queryKeys.clients(), ctx?.previous);
      const message = (err as any)?.message || "Could not create workspace";
      toast({ title: "Create failed", description: message });
    },
    onSuccess(data, variables, ctx) {
      // Replace temp client with server-provided record
      qc.setQueryData(queryKeys.clients(), (old: ClientRecord[] | undefined) => {
        if (!old) return [data];
        return old.map((c) => (c.id === ctx?.tempId ? data : c));
      });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.clients());
    },
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation<ClientRecord, unknown, [string, Partial<ClientRecord>], { previous?: ClientRecord[] }>({
    mutationFn: clientsService.updateClient,
    onMutate: async ([id, patch]: [string, Partial<ClientRecord>]) => {
      await qc.cancelQueries(queryKeys.clients());
      const previous = qc.getQueryData<ClientRecord[]>(queryKeys.clients());
      qc.setQueryData(queryKeys.clients(), (old) => old?.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      return { previous };
    },
    onError(err, variables, ctx) {
      qc.setQueryData(queryKeys.clients(), ctx?.previous);
      const message = (err as any)?.message || "Could not update workspace";
      toast({ title: "Update failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.clients());
    },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation<void, unknown, string, { previous?: ClientRecord[] }>({
    mutationFn: clientsService.deleteClient,
    onMutate: async (id: string) => {
      await qc.cancelQueries(queryKeys.clients());
      const previous = qc.getQueryData<ClientRecord[]>(queryKeys.clients());
      qc.setQueryData(queryKeys.clients(), (old) => old?.filter((c) => c.id !== id));
      return { previous };
    },
    onError(err, id, ctx) {
      qc.setQueryData(queryKeys.clients(), ctx?.previous);
      const message = (err as any)?.message || "Could not delete workspace";
      toast({ title: "Delete failed", description: message });
    },
    onSettled() {
      qc.invalidateQueries(queryKeys.clients());
    },
  });
}
