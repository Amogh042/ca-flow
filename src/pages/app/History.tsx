import { Activity, Bot, CheckCircle2, FileClock, FolderKanban } from "lucide-react";
import { useActivities } from "@/hooks/useActivities";
import { useClients } from "@/hooks/useClients";
import { useCalculations } from "@/hooks/useCalculations";
import { useFilings } from "@/hooks/useFilings";
import { useReports } from "@/hooks/useReports";

export default function History() {
  const activitiesQuery = useActivities();
  const clientsQuery = useClients();
  const calculationsQuery = useCalculations();
  const filingsQuery = useFilings();
  const reportsQuery = useReports();

  if (activitiesQuery.isLoading || clientsQuery.isLoading || calculationsQuery.isLoading || filingsQuery.isLoading || reportsQuery.isLoading) {
    return <div className="max-w-6xl mx-auto py-8">Loading history...</div>;
  }
  if (activitiesQuery.error || clientsQuery.error || calculationsQuery.error || filingsQuery.error || reportsQuery.error) {
    return <div className="max-w-6xl mx-auto py-8 text-red-400">Failed to load history.</div>;
  }

  const activities = activitiesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const calculations = calculationsQuery.data ?? [];
  const filings = filingsQuery.data ?? [];
  const reports = reportsQuery.data ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-secondary">Audit Trail</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">History should explain every important change</h1>
        <p className="mt-2 max-w-3xl text-sm text-secondary">
          Finance users need to know who changed what, when, and on which client workspace.
          This screen turns the previous placeholder into a real traceability layer.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <HistoryStat label="Timeline events" value={`${activities.length}`} />
        <HistoryStat label="Workflow actions" value={`${filings.length + reports.length}`} />
        <HistoryStat label="Saved calculations" value={`${calculations.length}`} />
        <HistoryStat label="Client workspaces" value={`${clients.length}`} />
      </div>

      <div className="card-surface p-6">
        <div className="space-y-5">
          {activities.map((item) => (
            <div key={item.id} className="flex gap-4">
              <div className="mt-1 h-10 w-10 rounded-2xl bg-white/[0.06] grid place-items-center shrink-0">
                {item.kind === "filing" ? (
                  <FileClock className="h-4 w-4 text-amber-300" />
                ) : item.kind === "document" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                ) : item.kind === "calculation" ? (
                  <FolderKanban className="h-4 w-4 text-primary" />
                ) : item.kind === "ai" ? (
                  <Bot className="h-4 w-4 text-primary" />
                ) : (
                  <Activity className="h-4 w-4 text-white/70" />
                )}
              </div>

              <div className="min-w-0 flex-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-secondary">{item.detail}</div>
                  </div>
                  <div className="text-right text-xs text-secondary">
                    <div>{item.time}</div>
                    <div>{item.actor}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-tertiary">
                  <span>Kind: {item.kind}</span>
                  {item.clientId ? <span>Client: {clients.find((client) => client.id === item.clientId)?.name}</span> : null}
                  <span>Thread-safe history for reviews, exports, and accountability.</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface p-5">
      <div className="text-xs uppercase tracking-wide text-secondary">{label}</div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
    </div>
  );
}
