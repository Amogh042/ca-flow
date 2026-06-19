import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  FileClock,
  FolderSearch,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { teamMembers } from "@/data/workspace";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useFilings } from "@/hooks/useFilings";
import { useDocuments } from "@/hooks/useDocuments";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/AuthContext";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const greeting = getGreeting();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const clientsQuery = useClients();
  const filingsQuery = useFilings();
  const documentsQuery = useDocuments();
  const activitiesQuery = useActivities();
  const loading = clientsQuery.isLoading || filingsQuery.isLoading || documentsQuery.isLoading || activitiesQuery.isLoading;
  const hasError = !!(clientsQuery.error || filingsQuery.error || documentsQuery.error || activitiesQuery.error);

  const activities = activitiesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const documents = documentsQuery.data ?? [];
  const filings = filingsQuery.data ?? [];

  const countFilingsByStatus = (status: string) =>
    filings.filter((filing) => filing.status === status).length;

  const statCards = [
    {
      label: "At-risk engagements",
      value: `${clients.filter((client) => client.health !== "low").length}`,
      sub: "Client workspaces needing intervention",
      icon: ShieldAlert,
      tone: "warning",
    },
    {
      label: "Open compliance items",
      value: `${countFilingsByStatus("pending") + countFilingsByStatus("in_progress") + countFilingsByStatus("overdue")}`,
      sub: "Across tax, payroll, and advisory",
      icon: FileClock,
      tone: "neutral",
    },
    {
      label: "Documents waiting",
      value: `${documents.filter((document) => document.status === "missing" || document.status === "needs_review").length}`,
      sub: "Blocking filings or reviews",
      icon: FolderSearch,
      tone: "warning",
    },
    {
      label: "Advisory momentum",
      value: "—",
      sub: "Pipeline value across active engagements",
      icon: TrendingUp,
      tone: "success",
    },
  ];

  const urgentQueue = filings
    .filter((filing) => filing.status !== "filed")
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, 4);

  const watchlist = clients
    .slice()
    .sort((a, b) => b.openTasks - a.openTasks)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {loading && (
        <div className="max-w-7xl mx-auto py-2">
          <div className="rounded-md bg-white/5 p-3 text-sm text-secondary">Loading dashboard…</div>
        </div>
      )}
      {hasError && (
        <div className="max-w-7xl mx-auto py-2">
          <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-200">Some data failed to load. Displaying available items.</div>
        </div>
      )}
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="card-surface overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                  Dashboard
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {greeting}, {displayName}
                </h1>
                <p className="max-w-2xl text-sm text-secondary">
                  Here's what needs your attention across clients, filings, and documents.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 min-w-[220px]">
                <div className="flex items-center gap-2 text-primary text-sm font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Immediate actions
                </div>
                <p className="mt-2 text-sm text-white">
                  {countFilingsByStatus("overdue")} overdue filing{countFilingsByStatus("overdue") !== 1 ? 's' : ''}, {documents.filter((document) => document.status === "missing").length} missing document requests, and {clients.filter((c) => c.health !== "low").length} workspaces needing attention.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-secondary">
                Team Capacity
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                Delivery load by owner
              </h2>
            </div>
            <Link to="/clients" className="text-xs text-primary hover:underline">
              Open workspaces
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {teamMembers.map((member) => (
              <div key={member.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-xs text-secondary">{member.role}</div>
                  </div>
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      member.utilisation >= 90
                        ? "text-red-300"
                        : member.utilisation >= 80
                          ? "text-amber-300"
                          : "text-emerald-300",
                    )}
                  >
                    {member.utilisation}%
                  </div>
                </div>
                <div className="h-2 rounded-full bg-white/[0.06]">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      member.utilisation >= 90
                        ? "bg-red-400"
                        : member.utilisation >= 80
                          ? "bg-gradient-to-r from-orange-500 to-amber-400"
                          : "bg-emerald-400",
                    )}
                    style={{ width: `${member.utilisation}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-secondary">
                {card.label}
              </div>
              <card.icon
                className={cn(
                  "h-4 w-4",
                  card.tone === "warning"
                    ? "text-amber-300"
                    : card.tone === "success"
                      ? "text-emerald-300"
                      : "text-white/70",
                )}
              />
            </div>
            <div className="mt-3 text-3xl font-bold text-white">{card.value}</div>
            <div className="mt-1 text-sm text-secondary">{card.sub}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
        <div className="card-surface p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Urgent execution queue</h2>
              <p className="mt-1 text-sm text-secondary">
                Upcoming deadlines across all client workspaces.
              </p>
            </div>
            <Link to="/compliance" className="text-xs text-primary hover:underline">
              Open compliance board
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {urgentQueue.map((filing) => (
              <div
                key={filing.id}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                          filing.status === "overdue"
                            ? "bg-red-500/15 text-red-300"
                            : filing.status === "in_review"
                              ? "bg-sky-500/15 text-sky-300"
                              : filing.status === "in_progress"
                                ? "bg-amber-500/15 text-amber-300"
                                : "bg-white/10 text-white/70",
                        )}
                      >
                        {filing.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-secondary">{filing.entity}</span>
                    </div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {filing.title}
                    </div>
                      <div className="mt-1 text-sm text-secondary">
                        Owner: {filing.owner ?? "—"} · Due {filing.dueDate ?? "TBD"}
                      </div>
                    {filing.blocker && (
                      <div className="mt-2 text-sm text-amber-200">
                        Blocker: {filing.blocker}
                      </div>
                    )}
                  </div>

                  <Link
                    to="/clients"
                    className="inline-flex items-center gap-1 text-sm text-primary"
                  >
                    Open workspace <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Client watchlist</h2>
              <Link to="/clients" className="text-xs text-primary hover:underline">
                View portfolio
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {watchlist.map((client) => (
                <div
                  key={client.id}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div className="font-medium text-white">{client.name}</div>
                      </div>
                      <div className="mt-1 text-xs text-secondary">
                        {client.serviceLine} · Owner {client.owner}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        client.health === "high"
                          ? "bg-red-500/15 text-red-300"
                          : client.health === "medium"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-emerald-500/15 text-emerald-300",
                      )}
                    >
                      {client.health}
                    </span>
                  </div>
                  <div className="mt-3 text-sm text-secondary">{client.notes}</div>
                  <div className="mt-3 flex items-center justify-between text-xs text-secondary">
                    <span>{client.nextDeadline}</span>
                    <span>{client.openTasks} open tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent activity</h2>
              <Link to="/history" className="text-xs text-primary hover:underline">
                Full timeline
              </Link>
            </div>

            <div className="mt-4 space-y-4">
              {activities.length === 0 ? (
                <div className="text-center text-sm text-secondary">No recent activity</div>
              ) : (
                activities.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="mt-1 h-8 w-8 rounded-xl bg-white/[0.06] grid place-items-center">
                      {activity.kind === "filing" ? (
                        <Clock3 className="h-4 w-4 text-amber-300" />
                      ) : activity.kind === "document" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{activity.title}</div>
                      <div className="mt-1 text-sm text-secondary">{activity.detail}</div>
                      <div className="mt-1 text-xs text-tertiary">
                        {activity.actor} · {activity.time}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
