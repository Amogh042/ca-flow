import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, CheckCircle2, UserPlus, Calendar, CalendarCheck, List, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilings, useCreateFiling, useUpdateFiling } from "@/hooks/useFilings";
import { useClients } from "@/hooks/useClients";
import { useCreateActivity } from "@/hooks/useActivities";
import { toast } from "@/hooks/use-toast";
import type { Filing } from "@/data/workspace";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

type ViewMode = "list" | "calendar";
type StatTone = "text-success" | "text-warning" | "text-destructive";
type DotTone = "bg-success" | "bg-warning" | "bg-destructive";

const statusStyles: Record<string, { dot: string; badge: string }> = {
  overdue: { dot: "bg-destructive", badge: "bg-destructive/15 text-destructive" },
  pending: { dot: "bg-warning",     badge: "bg-warning/15 text-warning" },
  in_progress: { dot: "bg-warning", badge: "bg-warning/15 text-warning" },
  in_review: { dot: "bg-sky-500", badge: "bg-sky-500/15 text-sky-300" },
  filed:   { dot: "bg-success",     badge: "bg-success/15 text-success" },
};

function groupFilings(filings: Filing[]) {
  const today = new Date();
  const weekLater = new Date(today); weekLater.setDate(today.getDate() + 7);
  const monthLater = new Date(today); monthLater.setDate(today.getDate() + 30);

  const overdue: Filing[] = [];
  const thisWeek: Filing[] = [];
  const thisMonth: Filing[] = [];
  const later: Filing[] = [];

  filings.forEach((f) => {
    const d = new Date(f.dueDate);
    if (f.status === "filed") return;
    if (d < today) overdue.push(f);
    else if (d <= weekLater) thisWeek.push(f);
    else if (d <= monthLater) thisMonth.push(f);
    else later.push(f);
  });

  return { overdue, thisWeek, thisMonth, later };
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Compliance() {
  const filingsQuery = useFilings();
  const createFiling = useCreateFiling();
  const updateFiling = useUpdateFiling();
  const createActivity = useCreateActivity();
  const clientsQuery = useClients();
  const clients = clientsQuery.data ?? [];

  const [showDrawer, setShowDrawer] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formType, setFormType] = useState("GST Return");
  const [formDueDate, setFormDueDate] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [assigningFilingId, setAssigningFilingId] = useState<string | null>(null);
  const [assignValue, setAssignValue] = useState("");

  function resetForm() {
    setFormTitle("");
    setFormClientId("");
    setFormType("GST Return");
    setFormDueDate("");
    setFormAssignee("");
    setFormNotes("");
  }

  function handleCreateFiling(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formDueDate) return;
    createFiling.mutate(
      {
        clientId: formClientId,
        title: formTitle.trim(),
        dueDate: formDueDate,
        owner: formAssignee.trim() || "Unassigned",
        status: "pending",
        entity: formType,
        blocker: formNotes.trim() || undefined,
      },
      {
        onSuccess() {
          toast({ title: "Filing created", description: formTitle.trim() });
          resetForm();
          setShowDrawer(false);
        },
      },
    );
  }

  function handleAssign(filingId: string, newOwner: string) {
    if (!newOwner.trim()) return;
    updateFiling.mutate([filingId, { owner: newOwner.trim() }], {
      onSuccess(updated) {
        createActivity.mutate({
          id: `activity-${Date.now()}`,
          clientId: updated.clientId,
          title: `${updated.title} reassigned`,
          detail: `Assigned to ${newOwner.trim()}`,
          actor: updated.owner,
          time: "Just now",
          kind: "filing",
        });
        toast({ title: "Assignee updated", description: `${updated.title} → ${newOwner.trim()}` });
      },
    });
    setAssigningFilingId(null);
    setAssignValue("");
  }

  const now = new Date();
  const [view, setView] = useState<ViewMode>("list");
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  if (filingsQuery.isLoading) return <div className="max-w-7xl mx-auto py-8">Loading filings...</div>;
  if (filingsQuery.error) return <div className="max-w-7xl mx-auto py-8 text-red-400">Failed to load filings.</div>;

  const filings = filingsQuery.data ?? [];

  if (filings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance Tracker</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              Never miss a filing deadline again.
            </p>
          </div>
        </div>
        <div className="card-surface p-16 text-center">
          <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-secondary" />
          <div className="text-lg font-semibold text-[var(--text-primary)]">No filings yet</div>
          <div className="mt-2 text-sm text-secondary max-w-md mx-auto">
            Add a client with their GSTIN or PAN to auto-generate compliance deadlines.
          </div>
          <Link
            to="/clients"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            <Users className="h-4 w-4" /> Go to Clients
          </Link>
        </div>
      </div>
    );
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const visibleFilings = filings.filter(f => {
    const d = new Date(f.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const allGrouped = groupFilings(filings);

  const filed   = filings.filter(f => f.status === "filed").length;
  const pending = filings.filter(f => f.status === "pending" || f.status === "in_progress" || f.status === "in_review").length;
  const overdue = filings.filter(f => {
    return f.status !== "filed" && new Date(f.dueDate) < new Date();
  }).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Tracker</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Never miss a filing deadline again.
          </p>
        </div>
        <button onClick={() => setShowDrawer(true)} className="px-4 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Filing
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="h-9 w-9 grid place-items-center rounded-lg bg-card border border-white/10 hover:border-primary/40">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="font-semibold text-sm w-36 text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="h-9 w-9 grid place-items-center rounded-lg bg-card border border-white/10 hover:border-primary/40">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-4 text-xs">
          <Stat label="Filed"   value={filed}   color="text-success"     dot="bg-success" />
          <Stat label="Pending" value={pending} color="text-warning"     dot="bg-warning" />
          <Stat label="Overdue" value={overdue} color="text-destructive" dot="bg-destructive" />
        </div>

        <div className="grid grid-cols-2 p-1 rounded-lg bg-card border border-white/10">
          {[
            { v: "list" as const,     icon: List,     label: "List" },
            { v: "calendar" as const, icon: Calendar, label: "Calendar" },
          ].map((o) => (
            <button
              key={o.v}
              onClick={() => setView(o.v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5",
                view === o.v
                  ? "bg-gradient-orange text-white"
                  : "hover:text-[var(--text-primary)]"
              )}
              style={{ color: view === o.v ? undefined : "var(--text-secondary)" }}
            >
              <o.icon className="h-3.5 w-3.5" /> {o.label}
            </button>
          ))}
        </div>
      </div>

      {view === "list" ? (
        <div className="space-y-6">
          {(
            [
              { label: "Overdue",    items: allGrouped.overdue },
              { label: "This Week",  items: allGrouped.thisWeek },
              { label: "This Month", items: allGrouped.thisMonth },
              { label: "Later",      items: allGrouped.later },
            ] as const
          ).map(({ label, items }) => {
            if (!items.length) return null;
            return (
              <div key={label}>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--text-tertiary)" }}>
                  {label}
                </h3>
                <div className="card-surface divide-y divide-white/[0.04] overflow-hidden">
                  {items.map((f, i) => {
                    const s = statusStyles[f.status];
                    return (
                      <div key={i} className="group flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${s.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                            {f.title}
                          </div>
                          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                            {f.owner}
                          </div>
                        </div>
                        <div className="text-xs hidden sm:block" style={{ color: "var(--text-secondary)" }}>
                          {formatDate(f.dueDate)}
                        </div>
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-pill capitalize", s.badge)}>
                          {f.status}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              updateFiling.mutate([f.id, { status: "filed" }], {
                                onSuccess(updated) {
                                  createActivity.mutate({
                                    id: `activity-${Date.now()}`,
                                    clientId: updated.clientId,
                                    title: `${updated.title} updated`,
                                    detail: `Status moved to ${updated.status.replace("_", " ")} for ${updated.entity}.`,
                                    actor: updated.owner,
                                    time: "Just now",
                                    kind: "filing",
                                  });
                                },
                              });
                            }}
                            className="text-xs px-2.5 py-1 rounded-md border border-white/10 hover:border-primary/40 hover:text-primary flex items-center gap-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <CheckCircle2 className="h-3 w-3" /> Mark Filed
                          </button>
                          {assigningFilingId === f.id ? (
                            <input
                              autoFocus
                              value={assignValue}
                              onChange={(e) => setAssignValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") handleAssign(f.id, assignValue); if (e.key === "Escape") { setAssigningFilingId(null); setAssignValue(""); } }}
                              onBlur={() => { if (assignValue.trim()) handleAssign(f.id, assignValue); else { setAssigningFilingId(null); setAssignValue(""); } }}
                              placeholder="Assignee name…"
                              className="text-xs px-2 py-1 rounded-md border border-primary/40 bg-white/5 text-[var(--text-primary)] outline-none w-28"
                            />
                          ) : (
                            <button
                              onClick={() => { setAssigningFilingId(f.id); setAssignValue(f.owner); }}
                              className="text-xs px-2.5 py-1 rounded-md border border-white/10 hover:border-primary/40 hover:text-primary flex items-center gap-1"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              <UserPlus className="h-3 w-3" /> Assign
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!allGrouped.overdue.length && !allGrouped.thisWeek.length &&
           !allGrouped.thisMonth.length && !allGrouped.later.length && (
            <div className="card-surface p-12 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-success" />
              <div className="font-semibold">All caught up!</div>
              <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                No pending filings right now.
              </div>
            </div>
          )}
        </div>
      ) : (
        <CalendarView month={month} year={year} filings={visibleFilings} />
      )}

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Filing</h3>
              <button onClick={() => setShowDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFiling} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Title *</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder="e.g. GST 3B — April 2026"
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Client</label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none"
                >
                  <option value="">— No client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Filing Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none"
                >
                  {["GST Return", "TDS Return", "Advance Tax", "ITR", "ROC Filing", "PT Return", "Other"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Due Date *</label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Assignee</label>
                <input
                  value={formAssignee}
                  onChange={(e) => setFormAssignee(e.target.value)}
                  placeholder="Team member name"
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Notes / Blocker</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes or blockers…"
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createFiling.status === "pending"}
                  className="flex-1 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all disabled:opacity-50"
                >
                  {createFiling.status === "pending" ? "Creating…" : "Create Filing"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="h-10 px-4 rounded-pill border border-white/10 text-sm text-secondary hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const Stat = ({
  label,
  value,
  color,
  dot,
}: {
  label: string;
  value: number;
  color: StatTone;
  dot: DotTone;
}) => (
  <div className="flex items-center gap-2">
    <span className={`h-2 w-2 rounded-full ${dot}`} />
    <span style={{ color: "var(--text-tertiary)" }}>{label}</span>
    <span className={cn("font-bold", color)}>{value}</span>
  </div>
);

const CalendarView = ({ month, year, filings }: {
  month: number; year: number; filings: Filing[];
}) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const dotMap: Record<number, string> = {};
  filings.forEach(f => {
    const d = new Date(f.dueDate).getDate();
    if (f.status === "overdue" || (f.status !== "filed" && new Date(f.dueDate) < today)) {
      dotMap[d] = "bg-destructive";
    } else if (f.status === "pending" || f.status === "in_progress" || f.status === "in_review") {
      dotMap[d] = dotMap[d] || "bg-warning";
    } else if (f.status === "filed") {
      dotMap[d] = dotMap[d] || "bg-success";
    }
  });

  return (
    <div className="card-surface p-5">
      <div className="grid grid-cols-7 text-center text-[10px] uppercase tracking-wide mb-2"
        style={{ color: "var(--text-tertiary)" }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`pad-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const isToday =
            today.getDate() === d &&
            today.getMonth() === month &&
            today.getFullYear() === year;
          return (
            <button
              key={d}
              className={cn(
                "aspect-square rounded-lg border transition-all flex flex-col items-center justify-center text-xs",
                isToday
                  ? "border-primary/60 bg-primary/10 text-primary font-bold"
                  : "border-white/[0.04] hover:border-primary/40 hover:bg-primary/5"
              )}
              style={{ color: isToday ? undefined : "var(--text-secondary)" }}
            >
              <span>{d}</span>
              {dotMap[d] && (
                <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${dotMap[d]}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
