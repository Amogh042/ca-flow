import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, CheckCircle2, CalendarCheck, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilings, useCreateFiling, useUpdateFiling } from "@/hooks/useFilings";
import { useClients } from "@/hooks/useClients";
import { toast } from "@/hooks/use-toast";

type StatusFilter = "all" | "pending" | "overdue" | "filed";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Compliance() {
  const filingsQuery = useFilings();
  const createFiling = useCreateFiling();
  const updateFiling = useUpdateFiling();
  const clientsQuery = useClients();
  const clients = clientsQuery.data ?? [];
  const clientLookup = new Map(clients.map((c) => [c.id, c]));

  const [showDrawer, setShowDrawer] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formType, setFormType] = useState("GST Return");
  const [formDueDate, setFormDueDate] = useState("");
  const [formNotes, setFormNotes] = useState("");

  function resetForm() {
    setFormTitle(""); setFormClientId(""); setFormType("GST Return");
    setFormDueDate(""); setFormNotes("");
  }

  function handleCreateFiling(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formDueDate) return;
    createFiling.mutate({
      clientId: formClientId,
      title: formTitle.trim(),
      dueDate: formDueDate,
      owner: "Unassigned",
      status: "pending",
      entity: formType,
      blocker: formNotes.trim() || undefined,
    }, {
      onSuccess() {
        toast({ title: "Filing created", description: formTitle.trim() });
        resetForm();
        setShowDrawer(false);
      },
    });
  }

  if (filingsQuery.isLoading) return <div className="max-w-7xl mx-auto py-8">Loading filings...</div>;
  if (filingsQuery.error) return <div className="max-w-7xl mx-auto py-8 text-red-400">Failed to load filings.</div>;

  const allFilings = filingsQuery.data ?? [];
  const now = new Date();

  const filings = allFilings
    .map((f) => {
      const isOverdue = f.status !== "filed" && f.dueDate && new Date(f.dueDate) < now;
      return { ...f, isOverdue };
    })
    .filter((f) => {
      if (search) {
        const q = search.toLowerCase();
        const clientName = clientLookup.get(f.clientId)?.name ?? "";
        if (!f.title.toLowerCase().includes(q) && !clientName.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === "pending") return f.status !== "filed" && !f.isOverdue;
      if (statusFilter === "overdue") return f.isOverdue;
      if (statusFilter === "filed") return f.status === "filed";
      return true;
    })
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));

  if (allFilings.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
            <p className="mt-1 text-sm text-secondary">Never miss a filing deadline again.</p>
          </div>
          <button onClick={() => setShowDrawer(true)} className="px-4 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center gap-2">
            <Plus className="h-4 w-4" /> New Filing
          </button>
        </div>
        <div className="card-surface p-16 text-center">
          <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-secondary" />
          <div className="text-lg font-semibold text-[var(--text-primary)]">No filings yet</div>
          <div className="mt-2 text-sm text-secondary max-w-md mx-auto">
            Add a client with their GSTIN or PAN to auto-generate compliance deadlines, or create a filing manually.
          </div>
        </div>
        {renderDrawer()}
      </div>
    );
  }

  const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "overdue", label: "Overdue" },
    { id: "filed", label: "Filed" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
          <p className="mt-1 text-sm text-secondary">Never miss a filing deadline again.</p>
        </div>
        <button onClick={() => setShowDrawer(true)} className="px-4 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Filing
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client or filing title..."
            className="glass-input w-full h-10 pl-9 pr-3 text-sm"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-card border border-white/10">
          {statusFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                statusFilter === f.id ? "bg-gradient-orange text-white" : "text-secondary hover:text-[var(--text-primary)]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filing List */}
      {filings.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <div className="text-sm text-secondary">No filings match your filter.</div>
        </div>
      ) : (
        <div className="card-surface divide-y divide-white/[0.04] overflow-hidden">
          {filings.map((f) => {
            const clientName = clientLookup.get(f.clientId)?.name ?? "—";
            return (
              <div key={f.id} className="group flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                <Link to={f.clientId ? `/clients/${f.clientId}` : "#"} className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-[var(--text-primary)]">{f.title}</div>
                    <div className="text-xs text-[var(--text-tertiary)]">{clientName}</div>
                  </div>
                  <div className="text-xs hidden sm:block text-secondary shrink-0">
                    {f.dueDate ? formatDate(f.dueDate) : "—"}
                  </div>
                </Link>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0",
                  f.status === "filed" ? "bg-emerald-500/15 text-emerald-300" :
                  f.isOverdue ? "bg-red-500/15 text-red-300" :
                  "bg-amber-500/15 text-amber-300"
                )}>
                  {f.isOverdue ? "overdue" : f.status}
                </span>
                {f.status !== "filed" && (
                  <button
                    onClick={() => updateFiling.mutate([f.id, { status: "filed" }], {
                      onSuccess() { toast({ title: "Marked as filed" }); },
                    })}
                    className="text-xs px-2.5 py-1 rounded-md border border-white/10 hover:border-primary/40 hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Mark Filed
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {renderDrawer()}
    </div>
  );

  function renderDrawer() {
    if (!showDrawer) return null;
    return (
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
              <label className="block text-xs font-medium text-secondary mb-1">Client *</label>
              <select value={formClientId} onChange={(e) => setFormClientId(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none">
                <option value="">— Select client —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Title *</label>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required placeholder="e.g. GST 3B — April 2026" className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Filing Type</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none">
                {["GST Return", "TDS Return", "Advance Tax", "ITR", "ROC Filing", "PT Return", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Due Date *</label>
              <input type="date" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Notes (optional)</label>
              <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} placeholder="Optional notes…" className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none resize-none" />
            </div>
            <button type="submit" disabled={createFiling.status === "pending"} className="w-full h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all disabled:opacity-50">
              {createFiling.status === "pending" ? "Creating…" : "Create Filing"}
            </button>
          </form>
        </div>
      </div>
    );
  }
}
