import { useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useFilings } from "@/hooks/useFilings";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import OnboardingGuide, { shouldShowOnboarding } from "@/components/app/OnboardingGuide";

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
  usePlan();

  const clients = clientsQuery.data ?? [];
  const filings = filingsQuery.data ?? [];

  const dataSettled = !clientsQuery.isFetching && !filingsQuery.isFetching;

  const [onboardingDismissed, setOnboardingDismissed] = useState(false);

  if (clientsQuery.error || filingsQuery.error) {
    return (
      <div className="max-w-7xl mx-auto py-16 text-center">
        <p className="text-sm text-secondary">Something went wrong loading your data. Please refresh the page.</p>
      </div>
    );
  }

  if (!dataSettled) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
          <div style={{ width: 24, height: 24, border: "2px solid var(--border-color)", borderTopColor: "var(--color-primary)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        </div>
      </div>
    );
  }

  const showOnboarding = !onboardingDismissed && shouldShowOnboarding(clients.length, filings.length, 0);

  if (showOnboarding) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 py-4">
        <OnboardingGuide onDismiss={() => setOnboardingDismissed(true)} />
      </div>
    );
  }

  const today = new Date();
  const todayStr = today.toDateString();

  const filingsDueToday = filings.filter(
    (f) => f.status !== "filed" && f.dueDate && new Date(f.dueDate).toDateString() === todayStr
  ).length;

  const filingsDueThisMonth = filings.filter((f) => {
    if (f.status === "filed" || !f.dueDate) return false;
    const d = new Date(f.dueDate);
    return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const openTasks = filings.filter((f) => f.status === "pending").length;

  const watchlist = clients.slice().sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return (order[a.health] ?? 2) - (order[b.health] ?? 2);
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Greeting */}
      <section>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          {greeting}, {displayName}
        </h1>
        <p className="mt-1 text-sm text-secondary">
          Here's what needs your attention today
        </p>
      </section>

      {/* Stat Cards — 2x2 grid */}
      <section className="grid gap-4 grid-cols-2">
        <StatCard
          label="FILINGS DUE TODAY"
          value={filingsDueToday}
          tone={filingsDueToday === 0 ? "success" : "warning"}
          subtitle={filingsDueToday === 0 ? "All clear for today" : undefined}
        />
        <StatCard label="ACTIVE CLIENTS" value={clients.length} />
        <StatCard
          label="FILINGS DUE THIS MONTH"
          value={filingsDueThisMonth}
          tone={filingsDueThisMonth > 0 ? "warning" : undefined}
        />
        <StatCard
          label="OPEN TASKS"
          value={openTasks}
          tone={openTasks > 0 ? "warning" : undefined}
        />
      </section>

      {/* Client Watchlist */}
      <section className="card-surface p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Client watchlist</h2>

        <div className="mt-4 space-y-2">
          {watchlist.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-secondary">
                No clients yet.{" "}
                <Link to="/clients" className="text-primary hover:underline">
                  Add your first client to get started.
                </Link>
              </p>
            </div>
          ) : (
            watchlist.map((client) => (
              <Link
                key={client.id}
                to={`/clients/${client.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/30 transition-colors"
              >
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {client.name}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0 capitalize",
                    client.health === "high"
                      ? "bg-red-500/15 text-red-300"
                      : client.health === "medium"
                        ? "bg-amber-500/15 text-amber-300"
                        : "bg-emerald-500/15 text-emerald-300",
                  )}
                >
                  {client.health}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone, subtitle }: {
  label: string;
  value: number;
  tone?: "warning" | "success";
  subtitle?: string;
}) {
  return (
    <div className="card-surface p-5 min-h-[120px] flex flex-col justify-between">
      <div className="text-[10px] uppercase tracking-wider text-secondary font-semibold">{label}</div>
      <div className="mt-auto">
        <div
          className={cn(
            "text-3xl font-bold",
            tone === "warning" ? "text-amber-300" :
            tone === "success" ? "text-emerald-400" :
            "text-[var(--text-primary)]"
          )}
        >
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-emerald-400 mt-1">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
