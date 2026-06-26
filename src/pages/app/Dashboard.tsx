import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileClock,
  FileText,
  FolderSearch,
  GitBranch,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useFilings } from "@/hooks/useFilings";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentRequests } from "@/hooks/useDocumentRequests";
import { useWorkflows } from "@/hooks/useWorkflows";
import { useActivities } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingGuide, { shouldShowOnboarding } from "@/components/app/OnboardingGuide";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function daysFromNow(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function Dashboard() {
  const greeting = getGreeting();
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const clientsQuery = useClients();
  const filingsQuery = useFilings();
  const documentsQuery = useDocuments();
  const docRequestsQuery = useDocumentRequests();
  const workflowsQuery = useWorkflows();
  const activitiesQuery = useActivities();
  const loading = clientsQuery.isLoading || filingsQuery.isLoading || documentsQuery.isLoading || activitiesQuery.isLoading;
  const hasError = !!(clientsQuery.error || filingsQuery.error || documentsQuery.error || activitiesQuery.error);

  const activities = activitiesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const documents = documentsQuery.data ?? [];
  const filings = filingsQuery.data ?? [];
  const docRequests = docRequestsQuery.data ?? [];
  const workflows = workflowsQuery.data ?? [];

  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const showOnboarding = !onboardingDismissed && shouldShowOnboarding(clients.length, filings.length, documents.length);

  if (showOnboarding && !loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 py-4">
        <OnboardingGuide onDismiss={() => setOnboardingDismissed(true)} />
      </div>
    );
  }

  // --- Derived data ---
  const pendingDocRequests = docRequests.filter((r) => r.status === "requested" || r.status === "reminded");
  const filingsDueThisWeek = filings.filter((f) => {
    if (f.status === "filed") return false;
    if (!f.dueDate) return false;
    const days = daysFromNow(f.dueDate);
    return days >= 0 && days <= 7;
  }).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const filingsDueThisMonth = filings.filter((f) => f.status !== "filed" && f.dueDate && isThisMonth(f.dueDate));

  const overdueWorkflows = workflows.filter((w) => {
    if (w.status === "done") return false;
    if (!w.dueDate) return false;
    return daysFromNow(w.dueDate) < 0;
  }).sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  const openWorkflows = workflows.filter((w) => w.status !== "done");

  const clientLookup = new Map(clients.map((c) => [c.id, c.name]));

  const watchlist = clients
    .slice()
    .sort((a, b) => b.openTasks - a.openTasks)
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {loading && (
        <div className="py-2">
          <div className="rounded-md bg-white/5 p-3 text-sm text-secondary">Loading dashboard…</div>
        </div>
      )}
      {hasError && (
        <div className="py-2">
          <div className="rounded-md bg-red-900/40 p-3 text-sm text-red-200">Some data failed to load. Displaying available items.</div>
        </div>
      )}

      {/* ─── Greeting + Quick Actions ─── */}
      <section className="card-surface overflow-hidden">
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-secondary">Dashboard</p>
            <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight">
              {greeting}, {displayName}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-secondary">
              Here's what needs your attention across clients, filings, and documents.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link to="/clients" className="px-3.5 h-9 rounded-pill bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Client
            </Link>
            <Link to="/compliance" className="px-3.5 h-9 rounded-pill bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add Filing
            </Link>
            <Link to="/workflows" className="px-3.5 h-9 rounded-pill bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Create Task
            </Link>
            <Link to="/documents" className="px-3.5 h-9 rounded-pill bg-primary/10 border border-primary/20 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Request Doc
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Today's Focus ─── */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Today's focus</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Filings Due This Week */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Filings due this week</span>
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                filingsDueThisWeek.length > 0 ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300",
              )}>
                {filingsDueThisWeek.length}
              </span>
            </div>
            {filingsDueThisWeek.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400 py-2">
                <CheckCircle2 className="h-4 w-4" /> No filings due this week
              </div>
            ) : (
              <div className="space-y-2">
                {filingsDueThisWeek.slice(0, 3).map((f) => (
                  <Link key={f.id} to="/compliance" className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-primary/30 transition-colors">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{f.title}</div>
                    <div className="mt-0.5 flex items-center justify-between text-xs text-secondary">
                      <span>{clientLookup.get(f.clientId) || f.entity || "—"}</span>
                      <span className={daysFromNow(f.dueDate) <= 1 ? "text-red-400 font-medium" : ""}>
                        {daysFromNow(f.dueDate) === 0 ? "Due today" : daysFromNow(f.dueDate) === 1 ? "Due tomorrow" : `Due in ${daysFromNow(f.dueDate)}d`}
                      </span>
                    </div>
                  </Link>
                ))}
                {filingsDueThisWeek.length > 3 && (
                  <Link to="/compliance" className="text-xs text-primary hover:underline">
                    +{filingsDueThisWeek.length - 3} more →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Pending Document Requests */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderSearch className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Pending doc requests</span>
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                pendingDocRequests.length > 0 ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/15 text-emerald-300",
              )}>
                {pendingDocRequests.length}
              </span>
            </div>
            {pendingDocRequests.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400 py-2">
                <CheckCircle2 className="h-4 w-4" /> All documents received
              </div>
            ) : (
              <div className="space-y-2">
                {pendingDocRequests.slice(0, 3).map((r) => {
                  const overdueDays = r.dueDate ? Math.max(0, -daysFromNow(r.dueDate)) : 0;
                  return (
                    <Link key={r.id} to="/documents" className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-primary/30 transition-colors">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{r.title}</div>
                      <div className="mt-0.5 flex items-center justify-between text-xs text-secondary">
                        <span>{r.clientName || clientLookup.get(r.clientId) || "—"}</span>
                        {overdueDays > 0 ? (
                          <span className="text-red-400 font-medium">{overdueDays}d overdue</span>
                        ) : r.dueDate ? (
                          <span>Due {new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
                {pendingDocRequests.length > 3 && (
                  <Link to="/documents" className="text-xs text-primary hover:underline">
                    +{pendingDocRequests.length - 3} more →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Overdue Tasks */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-[var(--text-primary)]">Overdue tasks</span>
              </div>
              <span className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-full",
                overdueWorkflows.length > 0 ? "bg-red-500/15 text-red-300" : "bg-emerald-500/15 text-emerald-300",
              )}>
                {overdueWorkflows.length}
              </span>
            </div>
            {overdueWorkflows.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-emerald-400 py-2">
                <CheckCircle2 className="h-4 w-4" /> No overdue tasks
              </div>
            ) : (
              <div className="space-y-2">
                {overdueWorkflows.slice(0, 3).map((w) => {
                  const overdueDays = Math.abs(daysFromNow(w.dueDate!));
                  return (
                    <Link key={w.id} to="/workflows" className="block rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-primary/30 transition-colors">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">{w.title}</div>
                      <div className="mt-0.5 flex items-center justify-between text-xs text-secondary">
                        <span>{w.assignee || "Unassigned"}</span>
                        <span className="text-red-400 font-medium">{overdueDays}d overdue</span>
                      </div>
                    </Link>
                  );
                })}
                {overdueWorkflows.length > 3 && (
                  <Link to="/workflows" className="text-xs text-primary hover:underline">
                    +{overdueWorkflows.length - 3} more →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Stat Cards ─── */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active clients" value={clients.length} icon={Users} />
        <StatCard label="Filings due this month" value={filingsDueThisMonth.length} icon={FileClock} tone={filingsDueThisMonth.length > 0 ? "warning" : undefined} />
        <StatCard label="Pending documents" value={pendingDocRequests.length} icon={FileText} tone={pendingDocRequests.length > 0 ? "warning" : undefined} />
        <StatCard label="Open tasks" value={openWorkflows.length} icon={GitBranch} tone={openWorkflows.length > 0 ? "neutral" : undefined} />
      </section>

      {/* ─── Watchlist + Activity ─── */}
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
        {/* Client Watchlist */}
        <div className="card-surface p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Client watchlist</h2>
            <Link to="/clients" className="text-xs text-primary hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {watchlist.length === 0 ? (
              <div className="text-center text-sm text-secondary py-4">No clients yet</div>
            ) : (
              watchlist.map((client) => {
                const clientFilings = filings.filter((f) => f.clientId === client.id && f.status !== "filed");
                const nextFiling = clientFilings.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0];
                const missingDocs = docRequests.filter((r) => r.clientId === client.id && (r.status === "requested" || r.status === "reminded")).length;

                return (
                  <Link
                    key={client.id}
                    to={`/clients/${client.id}`}
                    className="block rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <div className="font-medium text-[var(--text-primary)]">{client.name}</div>
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
                    <div className="mt-3 flex items-center justify-between text-xs text-secondary">
                      <span>
                        {nextFiling
                          ? `Next: ${nextFiling.title} — ${new Date(nextFiling.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                          : "No upcoming filings"}
                      </span>
                      {missingDocs > 0 && (
                        <span className="text-amber-300 font-medium">{missingDocs} missing doc{missingDocs !== 1 ? "s" : ""}</span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-surface p-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Recent activity</h2>

          <div className="mt-4 space-y-4">
            {activities.length === 0 ? (
              <div className="text-center text-sm text-secondary">No recent activity</div>
            ) : (
              activities.slice(0, 5).map((activity) => (
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
                    <div className="text-sm font-medium text-[var(--text-primary)]">{activity.title}</div>
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
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "warning" | "neutral";
}) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-secondary">{label}</div>
        <Icon className={cn("h-4 w-4", tone === "warning" ? "text-amber-300" : "text-[var(--text-secondary)]")} />
      </div>
      <div className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
