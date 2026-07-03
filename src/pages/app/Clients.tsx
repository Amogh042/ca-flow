import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Plus, Search, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateFiling } from "@/hooks/useFilings";
import { useCreateWorkflow } from "@/hooks/useWorkflows";
import { useCreateActivity } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "@/hooks/use-toast";
import { getRiskLabel, type ClientRecord } from "@/data/workspace";
import ClientForm from "@/components/ClientForm";
import { filingTemplates } from "@/data/filingTemplates";
import { generateFilingsForClient } from "@/services/autoFilings";

type NewClientInput = Omit<
  ClientRecord,
  "id" | "lastActivity" | "openTasks" | "unreadItems" | "documentsReadyPct"
> & { _tmpId?: string };

export default function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ownerName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const clientsQuery = useClients();
  const createClient = useCreateClient();
  const createActivity = useCreateActivity();
  const { data: planData } = usePlan();
  const isFree = planData?.plan === "free";
  const createFilingMut = useCreateFiling();
  const createWorkflow = useCreateWorkflow();

  const [search, setSearch] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  // Inline task/filing drawers
  const [taskClientId, setTaskClientId] = useState<string | null>(null);
  const [filingClientId, setFilingClientId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskNotes, setTaskNotes] = useState("");
  const [filingTitle, setFilingTitle] = useState("");
  const [filingType, setFilingType] = useState("GST Return");
  const [filingDueDate, setFilingDueDate] = useState("");

  if (clientsQuery.isLoading) return <div className="max-w-7xl mx-auto py-8">Loading clients...</div>;
  if (clientsQuery.error) return <div className="max-w-7xl mx-auto py-8 text-red-400">Failed to load clients.</div>;

  const clients = clientsQuery.data ?? [];
  const atFreeLimit = isFree && clients.length >= 1;
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate || !taskClientId) return;
    createWorkflow.mutate({
      title: taskTitle.trim(),
      client: taskClientId,
      dueDate: taskDueDate,
      status: "pending",
      type: taskNotes.trim() || undefined,
    }, {
      onSuccess() {
        toast({ title: "Task created", description: taskTitle.trim() });
        setTaskTitle(""); setTaskDueDate(""); setTaskNotes("");
        setTaskClientId(null);
      },
    });
  }

  function handleCreateFiling(e: React.FormEvent) {
    e.preventDefault();
    if (!filingTitle.trim() || !filingDueDate || !filingClientId) return;
    createFilingMut.mutate({
      clientId: filingClientId,
      title: filingTitle.trim(),
      dueDate: filingDueDate,
      owner: ownerName || "Unassigned",
      status: "pending",
      entity: filingType,
    }, {
      onSuccess() {
        toast({ title: "Filing created", description: filingTitle.trim() });
        setFilingTitle(""); setFilingDueDate(""); setFilingType("GST Return");
        setFilingClientId(null);
      },
    });
  }

  function saveNewClient(values: any) {
    const payload: NewClientInput = {
      name: values.name,
      entityType: values.entityType,
      serviceLine: values.serviceLine,
      owner: values.owner || ownerName,
      health: values.health || "low",
      country: values.country || "",
      pan: values.pan || "",
      gstin: values.gstin || "",
      annualBilling: values.annualBilling || "",
      nextDeadline: values.nextDeadline || "No deadline linked yet",
      notes: values.notes || "",
      email: values.email || "",
      phone: values.phone || "",
      _tmpId: `tmp-${Date.now()}`,
    };
    createClient.mutate(payload, {
      onSuccess(data) {
        setShowAddDrawer(false);
        createActivity.mutate({
          id: `activity-${Date.now()}`,
          clientId: data.id,
          title: "Client workspace created",
          detail: `${data.name} was added as a new workspace.`,
          actor: data.owner,
          time: "Just now",
          kind: "client",
        });
        const autoFilings = generateFilingsForClient(data, filingTemplates);
        autoFilings.forEach((f) => createFilingMut.mutate(f));
        if (autoFilings.length > 0) {
          toast({ title: `Created ${autoFilings.length} compliance deadlines`, description: `Auto-generated filings for ${data.name}` });
        }
      },
      onError(err: any) {
        toast({ title: "Create failed", description: err?.message || "Failed to create client" });
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <button
          onClick={() => !atFreeLimit && setShowAddDrawer(true)}
          disabled={atFreeLimit}
          className={cn(
            "px-4 h-10 rounded-pill text-sm font-semibold transition-all flex items-center gap-2",
            atFreeLimit
              ? "bg-white/10 text-secondary cursor-not-allowed"
              : "bg-gradient-orange text-white glow-orange hover:glow-orange-strong"
          )}
        >
          {atFreeLimit ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Add Client
        </button>
      </div>

      {atFreeLimit && (
        <div className="card-surface p-4 flex items-center gap-4 border border-primary/20">
          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Client limit reached</div>
            <div className="text-xs text-secondary mt-0.5">Free plan allows 1 client. Upgrade to add unlimited clients.</div>
          </div>
          <button onClick={() => navigate("/settings")} className="px-4 h-9 rounded-pill bg-gradient-orange text-white text-xs font-semibold glow-orange hover:glow-orange-strong transition-all shrink-0">
            Upgrade
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name..."
          className="glass-input w-full h-10 pl-9 pr-3 text-sm"
        />
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-secondary" />
          <div className="text-lg font-semibold text-[var(--text-primary)]">
            {clients.length === 0 ? "No clients yet" : "No clients match your search"}
          </div>
          {clients.length === 0 && !atFreeLimit && (
            <div className="mt-4">
              <button onClick={() => setShowAddDrawer(true)} className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" /> Add Client
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <div
              key={client.id}
              className="card-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/clients/${client.id}`}
                    className="text-base font-semibold text-[var(--text-primary)] hover:text-primary transition-colors"
                  >
                    {client.name}
                  </Link>
                  <div className="mt-1 text-sm text-secondary">
                    {client.entityType} · {client.serviceLine}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                      client.health === "high"
                        ? "bg-red-500/15 text-red-300"
                        : client.health === "medium"
                          ? "bg-amber-500/15 text-amber-300"
                          : "bg-emerald-500/15 text-emerald-300",
                    )}
                  >
                    {getRiskLabel(client.health)}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => { setTaskClientId(client.id); setFilingClientId(null); }}
                  className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Create Task
                </button>
                <button
                  onClick={() => { setFilingClientId(client.id); setTaskClientId(null); }}
                  className="text-xs px-3 py-1.5 rounded-md border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Add Filing
                </button>
              </div>

              {/* Inline Task Form */}
              {taskClientId === client.id && (
                <form onSubmit={handleCreateTask} className="mt-3 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">New Task for {client.name}</span>
                    <button type="button" onClick={() => setTaskClientId(null)} className="text-secondary"><X className="h-4 w-4" /></button>
                  </div>
                  <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required placeholder="Task title" className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none" />
                  <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none" />
                  <textarea value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none resize-none" />
                  <button type="submit" disabled={createWorkflow.status === "pending"} className="w-full h-10 rounded-lg bg-gradient-orange text-white text-sm font-semibold disabled:opacity-50">
                    {createWorkflow.status === "pending" ? "Creating…" : "Create Task"}
                  </button>
                </form>
              )}

              {/* Inline Filing Form */}
              {filingClientId === client.id && (
                <form onSubmit={handleCreateFiling} className="mt-3 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">New Filing for {client.name}</span>
                    <button type="button" onClick={() => setFilingClientId(null)} className="text-secondary"><X className="h-4 w-4" /></button>
                  </div>
                  <input value={filingTitle} onChange={(e) => setFilingTitle(e.target.value)} required placeholder="e.g. GSTR-3B April 2026" className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none" />
                  <select value={filingType} onChange={(e) => setFilingType(e.target.value)} className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none">
                    {["GST Return", "TDS Return", "Advance Tax", "ITR", "ROC Filing", "PT Return", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input type="date" value={filingDueDate} onChange={(e) => setFilingDueDate(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none" />
                  <button type="submit" disabled={createFilingMut.status === "pending"} className="w-full h-10 rounded-lg bg-gradient-orange text-white text-sm font-semibold disabled:opacity-50">
                    {createFilingMut.status === "pending" ? "Creating…" : "Create Filing"}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Client Drawer */}
      {showAddDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowAddDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add Client</h3>
              <button onClick={() => setShowAddDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ClientForm
              initial={{ name: "", entityType: "Private Limited", serviceLine: "Tax + Compliance", owner: ownerName, health: "low", country: "", pan: "", gstin: "", annualBilling: "", nextDeadline: "", notes: "", email: "", phone: "" }}
              submitting={createClient.status === "pending"}
              submitLabel="Create Client"
              onCancel={() => setShowAddDrawer(false)}
              onSubmit={saveNewClient}
            />
          </div>
        </div>
      )}
    </div>
  );
}
