import { useState } from "react";
import { Plus, CheckCircle2, Search, X, Trash2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFilings, useCreateFiling, useUpdateFiling } from "@/hooks/useFilings";
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from "@/hooks/useWorkflows";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Compliance() {
  const { user } = useAuth();
  const ownerName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const filingsQuery = useFilings();
  const createFiling = useCreateFiling();
  const updateFiling = useUpdateFiling();
  const workflowsQuery = useWorkflows();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const clientsQuery = useClients();
  const clients = clientsQuery.data ?? [];
  const clientLookup = new Map(clients.map((c) => [c.id, c]));

  const [search, setSearch] = useState("");
  const [showFilingDrawer, setShowFilingDrawer] = useState(false);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);

  // Filing form
  const [fTitle, setFTitle] = useState("");
  const [fClientId, setFClientId] = useState("");
  const [fType, setFType] = useState("GST Return");
  const [fDueDate, setFDueDate] = useState("");
  const [fNotes, setFNotes] = useState("");

  // Task form
  const [tTitle, setTTitle] = useState("");
  const [tClientId, setTClientId] = useState("");
  const [tDueDate, setTDueDate] = useState("");
  const [tNotes, setTNotes] = useState("");

  function resetFilingForm() {
    setFTitle(""); setFClientId(""); setFType("GST Return"); setFDueDate(""); setFNotes("");
  }
  function resetTaskForm() {
    setTTitle(""); setTClientId(""); setTDueDate(""); setTNotes("");
  }

  function handleCreateFiling(e: React.FormEvent) {
    e.preventDefault();
    if (!fTitle.trim() || !fDueDate) return;
    createFiling.mutate({
      clientId: fClientId,
      title: fTitle.trim(),
      dueDate: fDueDate,
      owner: ownerName || "Unassigned",
      status: "pending",
      entity: fType,
      blocker: fNotes.trim() || undefined,
    }, {
      onSuccess() {
        toast({ title: "Filing created", description: fTitle.trim() });
        resetFilingForm();
        setShowFilingDrawer(false);
      },
    });
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!tTitle.trim() || !tDueDate) return;
    createWorkflow.mutate({
      title: tTitle.trim(),
      client: tClientId || undefined,
      dueDate: tDueDate,
      status: "pending",
      type: tNotes.trim() || undefined,
    }, {
      onSuccess() {
        toast({ title: "Task created", description: tTitle.trim() });
        resetTaskForm();
        setShowTaskDrawer(false);
      },
    });
  }

  const loading = filingsQuery.isLoading || workflowsQuery.isLoading;
  if (loading) return <div className="max-w-7xl mx-auto py-8">Loading...</div>;

  const now = new Date();
  const q = search.toLowerCase();

  // Tasks
  const allTasks = (workflowsQuery.data ?? [])
    .map((t) => {
      const overdue = t.dueDate && t.status !== "done" && new Date(t.dueDate) < now;
      return { ...t, overdue };
    })
    .filter((t) => {
      if (!q) return true;
      const clientName = clientLookup.get(t.client ?? "")?.name ?? "";
      return t.title.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.dueDate ?? "z").localeCompare(b.dueDate ?? "z"));

  // Filings
  const allFilings = (filingsQuery.data ?? [])
    .map((f) => {
      const isOverdue = f.status !== "filed" && f.dueDate && new Date(f.dueDate) < now;
      return { ...f, isOverdue };
    })
    .filter((f) => {
      if (!q) return true;
      const clientName = clientLookup.get(f.clientId)?.name ?? "";
      return f.title.toLowerCase().includes(q) || clientName.toLowerCase().includes(q);
    })
    .sort((a, b) => (a.dueDate ?? "z").localeCompare(b.dueDate ?? "z"));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name or title..."
          className="glass-input w-full h-10 pl-9 pr-3 text-sm"
        />
      </div>

      {/* Two Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT — Tasks */}
        <div className="card-surface rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Tasks</h2>
            <button
              onClick={() => setShowTaskDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-orange text-white glow-orange transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> New Task
            </button>
          </div>

          {allTasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary">No tasks yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {allTasks.map((task) => {
                const clientName = clientLookup.get(task.client ?? "")?.name ?? "";
                return (
                  <div key={task.id} className="group flex items-center gap-3 py-3">
                    <button
                      onClick={() => updateWorkflow.mutate([task.id, { status: task.status === "done" ? "pending" : "done" }])}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 grid place-items-center shrink-0 transition-colors",
                        task.status === "done" ? "border-emerald-400 bg-emerald-400" : "border-white/30 hover:border-primary"
                      )}
                    >
                      {task.status === "done" && <CheckCircle className="h-3 w-3 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-medium",
                        task.status === "done" ? "line-through text-secondary" :
                        task.overdue ? "text-red-300" : "text-[var(--text-primary)]"
                      )}>
                        {task.title}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        {clientName && <span>{clientName} · </span>}
                        {task.dueDate ? formatDate(task.dueDate) : "No due date"}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteWorkflow.mutate(task.id)}
                      className="h-7 w-7 grid place-items-center rounded-md hover:bg-white/5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT — Filings */}
        <div className="card-surface rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Filings</h2>
            <button
              onClick={() => setShowFilingDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-orange text-white glow-orange transition-all"
            >
              <Plus className="h-3.5 w-3.5" /> New Filing
            </button>
          </div>

          {allFilings.length === 0 ? (
            <div className="py-10 text-center text-sm text-secondary">No filings yet</div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {allFilings.map((f) => {
                const clientName = clientLookup.get(f.clientId)?.name ?? "";
                return (
                  <div key={f.id} className="group flex items-center gap-3 py-3">
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        "text-sm font-medium",
                        f.isOverdue ? "text-red-300" : "text-[var(--text-primary)]"
                      )}>
                        {f.title}
                      </div>
                      <div className="text-xs text-secondary mt-0.5">
                        {clientName && <span>{clientName} · </span>}
                        {f.entity && <span className="text-[var(--text-tertiary)]">{f.entity} · </span>}
                        {f.dueDate ? formatDate(f.dueDate) : "No due date"}
                      </div>
                    </div>
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
        </div>
      </div>

      {/* Task Drawer */}
      {showTaskDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowTaskDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Task</h3>
              <button onClick={() => setShowTaskDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Client</label>
                <select value={tClientId} onChange={(e) => setTClientId(e.target.value)} className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none">
                  <option value="">— No client —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Title *</label>
                <input value={tTitle} onChange={(e) => setTTitle(e.target.value)} required placeholder="Task title" className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Due Date *</label>
                <input type="date" value={tDueDate} onChange={(e) => setTDueDate(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Notes (optional)</label>
                <textarea value={tNotes} onChange={(e) => setTNotes(e.target.value)} rows={3} placeholder="Optional notes…" className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none resize-none" />
              </div>
              <button type="submit" disabled={createWorkflow.status === "pending"} className="w-full h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all disabled:opacity-50">
                {createWorkflow.status === "pending" ? "Creating…" : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Filing Drawer */}
      {showFilingDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowFilingDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Filing</h3>
              <button onClick={() => setShowFilingDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateFiling} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Client *</label>
                <select value={fClientId} onChange={(e) => setFClientId(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none">
                  <option value="">— Select client —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Title *</label>
                <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} required placeholder="e.g. GST 3B — April 2026" className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Filing Type</label>
                <select value={fType} onChange={(e) => setFType(e.target.value)} className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none">
                  {["GST Return", "TDS Return", "Advance Tax", "ITR", "ROC Filing", "PT Return", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Due Date *</label>
                <input type="date" value={fDueDate} onChange={(e) => setFDueDate(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Notes (optional)</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={3} placeholder="Optional notes…" className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none resize-none" />
              </div>
              <button type="submit" disabled={createFiling.status === "pending"} className="w-full h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all disabled:opacity-50">
                {createFiling.status === "pending" ? "Creating…" : "Create Filing"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
