import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Edit2, Trash2, CheckCircle, Plus, X, Calculator } from "lucide-react";
import { useClients, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useFilingsByClient, useUpdateFiling, useCreateFiling } from "@/hooks/useFilings";
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from "@/hooks/useWorkflows";
import { useCalculations } from "@/hooks/useCalculations";
import { useAuth } from "@/contexts/AuthContext";
import ClientForm from "@/components/ClientForm";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getRiskLabel } from "@/data/workspace";

type DetailTab = "tasks" | "filings" | "calculations";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientsQuery = useClients();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const filingsQuery = useFilingsByClient(id);
  const workflowsQuery = useWorkflows();
  const calculationsQuery = useCalculations();

  const updateFiling = useUpdateFiling();
  const createFilingMut = useCreateFiling();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const { user } = useAuth();

  const clients = clientsQuery.data ?? [];
  const client = clients.find((c) => c.id === id);

  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>("tasks");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showFilingForm, setShowFilingForm] = useState(false);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskNotes, setTaskNotes] = useState("");

  // Filing form state
  const [filingTitle, setFilingTitle] = useState("");
  const [filingType, setFilingType] = useState("GST Return");
  const [filingDueDate, setFilingDueDate] = useState("");

  if (clientsQuery.status === "pending") return <div className="max-w-7xl mx-auto py-8">Loading client...</div>;
  if (!client) return <div className="max-w-7xl mx-auto py-8">Client not found.</div>;

  const selectedFilings = filingsQuery.data ?? [];
  const clientTasks = (workflowsQuery.data ?? []).filter((w) => w.client === id);
  const calculations = (calculationsQuery.data ?? []).filter((c) => c.clientId === id);

  function handleUpdate(values: Partial<typeof client>) {
    updateClient.mutate([client.id, values], {
      onSuccess() {
        toast({ title: "Client updated", description: `${client.name} updated` });
        setEditing(false);
      },
      onError() {
        toast({ title: "Update failed", description: "Could not update client" });
      },
    });
  }

  function handleDelete() {
    deleteClient.mutate(client.id, {
      onSuccess() {
        toast({ title: "Client deleted", description: `${client.name} removed` });
        navigate("/clients");
      },
      onError() {
        toast({ title: "Delete failed", description: "Could not delete client" });
      },
    });
  }

  function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDueDate) return;
    createWorkflow.mutate({
      title: taskTitle.trim(),
      client: id,
      dueDate: taskDueDate,
      status: "pending",
      type: taskNotes.trim() || undefined,
    }, {
      onSuccess() {
        toast({ title: "Task created", description: taskTitle.trim() });
        setTaskTitle(""); setTaskDueDate(""); setTaskNotes("");
        setShowTaskForm(false);
      },
    });
  }

  function handleCreateFiling(e: React.FormEvent) {
    e.preventDefault();
    if (!filingTitle.trim() || !filingDueDate) return;
    createFilingMut.mutate({
      clientId: id!,
      title: filingTitle.trim(),
      dueDate: filingDueDate,
      owner: user?.user_metadata?.full_name || "Unassigned",
      status: "pending",
      entity: filingType,
    }, {
      onSuccess() {
        toast({ title: "Filing created", description: filingTitle.trim() });
        setFilingTitle(""); setFilingDueDate(""); setFilingType("GST Return");
        setShowFilingForm(false);
      },
    });
  }

  const today = new Date();

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "tasks", label: "Tasks" },
    { id: "filings", label: "Filings" },
    { id: "calculations", label: "Calculations" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Client Header */}
      <div className="card-surface p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">{client.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary">
              <span>{client.entityType}</span>
              {client.pan && <><span>·</span><span>PAN: {client.pan}</span></>}
              {client.gstin && <><span>·</span><span>GSTIN: {client.gstin}</span></>}
            </div>
            <div className="mt-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                  client.health === "high" ? "bg-red-500/15 text-red-300" :
                  client.health === "medium" ? "bg-amber-500/15 text-amber-300" :
                  "bg-emerald-500/15 text-emerald-300",
                )}
              >
                {getRiskLabel(client.health)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="h-9 px-3 rounded-md bg-white/5 text-sm text-[var(--text-primary)] flex items-center gap-1.5">
              <Edit2 className="h-3.5 w-3.5" /> Edit
            </button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <button className="h-9 px-3 rounded-md bg-destructive/10 text-sm text-destructive flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete client</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete {client.name}? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link to="/clients" className="text-sm text-primary ml-3">Back to clients</Link>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => { setShowTaskForm(true); setActiveTab("tasks"); }}
          className="flex-1 h-11 rounded-xl bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Create Task
        </button>
        <button
          onClick={() => { setShowFilingForm(true); setActiveTab("filings"); }}
          className="flex-1 h-11 rounded-xl bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" /> Create Filing
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-card border border-white/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === t.id ? "bg-gradient-orange text-white" : "text-secondary hover:text-[var(--text-primary)]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "tasks" && (
        <div className="card-surface p-5 space-y-3">
          {showTaskForm && (
            <form onSubmit={handleCreateTask} className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">New Task</span>
                <button type="button" onClick={() => setShowTaskForm(false)} className="text-secondary"><X className="h-4 w-4" /></button>
              </div>
              <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required placeholder="Task title" className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none" />
              <input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none" />
              <textarea value={taskNotes} onChange={(e) => setTaskNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none resize-none" />
              <button type="submit" disabled={createWorkflow.status === "pending"} className="w-full h-10 rounded-lg bg-gradient-orange text-white text-sm font-semibold disabled:opacity-50">
                {createWorkflow.status === "pending" ? "Creating…" : "Create Task"}
              </button>
            </form>
          )}

          {clientTasks.length === 0 && !showTaskForm ? (
            <div className="text-center py-8 text-sm text-secondary">No tasks yet. Create one above.</div>
          ) : (
            clientTasks.map((task) => {
              const overdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < today;
              return (
                <div key={task.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors", overdue ? "border-red-500/30 bg-red-500/5" : "border-white/[0.06] bg-white/[0.02]")}>
                  <button
                    onClick={() => updateWorkflow.mutate([task.id, { status: task.status === "done" ? "pending" : "done" }])}
                    className={cn("h-5 w-5 rounded-full border-2 grid place-items-center shrink-0 transition-colors", task.status === "done" ? "border-emerald-400 bg-emerald-400" : "border-white/30 hover:border-primary")}
                  >
                    {task.status === "done" && <CheckCircle className="h-3 w-3 text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", task.status === "done" ? "line-through text-secondary" : "text-[var(--text-primary)]")}>{task.title}</div>
                    <div className="text-xs text-secondary mt-0.5">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "No due date"}
                      {task.type && ` · ${task.type}`}
                    </div>
                  </div>
                  <button onClick={() => deleteWorkflow.mutate(task.id)} className="h-7 w-7 grid place-items-center rounded-md hover:bg-white/5 text-secondary shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "filings" && (
        <div className="card-surface p-5 space-y-3">
          {showFilingForm && (
            <form onSubmit={handleCreateFiling} className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--text-primary)]">New Filing</span>
                <button type="button" onClick={() => setShowFilingForm(false)} className="text-secondary"><X className="h-4 w-4" /></button>
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

          {selectedFilings.length === 0 && !showFilingForm ? (
            <div className="text-center py-8 text-sm text-secondary">No filings yet. Create one above.</div>
          ) : (
            selectedFilings.map((f) => {
              const overdue = f.status !== "filed" && f.dueDate && new Date(f.dueDate) < today;
              return (
                <div key={f.id} className={cn("flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors", overdue ? "border-red-500/30 bg-red-500/5" : "border-white/[0.06] bg-white/[0.02]")}>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{f.title}</div>
                    <div className="text-xs text-secondary mt-0.5">
                      {f.entity} · Due {f.dueDate ? new Date(f.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                      f.status === "filed" ? "bg-emerald-500/15 text-emerald-300" :
                      overdue ? "bg-red-500/15 text-red-300" :
                      "bg-amber-500/15 text-amber-300"
                    )}>
                      {overdue && f.status !== "filed" ? "overdue" : f.status}
                    </span>
                    {f.status !== "filed" && (
                      <button
                        onClick={() => updateFiling.mutate([f.id, { status: "filed" }])}
                        className="text-xs px-2.5 py-1 rounded-md border border-white/10 hover:border-primary/40 hover:text-primary flex items-center gap-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        <CheckCircle className="h-3 w-3" /> Mark Filed
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "calculations" && (
        <div className="card-surface p-5 space-y-3">
          {calculations.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-8 w-8 mx-auto mb-3 text-secondary" />
              <p className="text-sm text-secondary">
                No calculations saved yet.{" "}
                <Link to="/calculators" className="text-primary hover:underline">
                  Go to Calculators
                </Link>{" "}
                to compute and save to this client.
              </p>
            </div>
          ) : (
            calculations.map((calc) => (
              <div key={calc.id} className="px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-sm font-medium text-[var(--text-primary)]">{calc.title}</div>
                <div className="text-xs text-secondary mt-0.5">
                  {calc.subtitle && <span>{calc.subtitle} · </span>}
                  Saved: {calc.savedAt || "—"}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Drawer */}
      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setEditing(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit client</h3>
              <button onClick={() => setEditing(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ClientForm
              initial={client}
              submitting={updateClient.status === "pending"}
              submitLabel="Save changes"
              onCancel={() => setEditing(false)}
              onSubmit={handleUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
