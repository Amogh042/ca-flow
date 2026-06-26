import { useState } from "react";
import { Plus, Search, CheckCircle2, Clock, AlertCircle, Circle, Calendar, Trash2, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow, useDeleteWorkflow } from "@/hooks/useWorkflows";
import { useClients } from "@/hooks/useClients";
import type { Workflow } from "@/services/workflows";
import { toast } from "@/hooks/use-toast";

type Status = Workflow["status"];
type Priority = NonNullable<Workflow["priority"]>;

const statusConfig: Record<Status, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Circle, color: "text-[var(--text-tertiary)]", bg: "bg-white/5" },
  "in-progress": { label: "In Progress", icon: Clock, color: "text-blue-400", bg: "bg-blue-400/10" },
  done: { label: "Done", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
  blocked: { label: "Blocked", icon: AlertCircle, color: "text-red-400", bg: "bg-red-400/10" },
};

const priorityConfig: Record<Priority, { color: string; bg: string }> = {
  high: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" },
  medium: { color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" },
  low: { color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
};

const TASK_TYPES = ["Filing", "Document Collection", "Review", "Advisory", "Other"];
const ALL_STATUSES: Status[] = ["pending", "in-progress", "done", "blocked"];

type ViewMode = "list" | "board";

const defaultForm: Omit<Workflow, "id"> = {
  title: "",
  client: "",
  type: "",
  assignee: "",
  dueDate: "",
  status: "pending",
  priority: undefined,
  subtasks: 0,
  completedSubtasks: 0,
};

export default function Workflows() {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState<Omit<Workflow, "id">>(defaultForm);

  const workflowsQuery = useWorkflows();
  const createWorkflow = useCreateWorkflow();
  const updateWorkflow = useUpdateWorkflow();
  const deleteWorkflow = useDeleteWorkflow();
  const clientsQuery = useClients();

  const clients = clientsQuery.data ?? [];
  const source = workflowsQuery.data ?? [];
  const isLoading = workflowsQuery.isLoading;

  function clientName(clientId?: string) {
    if (!clientId) return "—";
    return clients.find((c) => c.id === clientId)?.name ?? "—";
  }

  const filtered = source.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterAssignee !== "all" && t.assignee !== filterAssignee) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchesTitle = t.title.toLowerCase().includes(q);
      const matchesClient = clientName(t.client).toLowerCase().includes(q);
      if (!matchesTitle && !matchesClient) return false;
    }
    return true;
  });

  const stats = {
    total: source.length,
    inProgress: source.filter((t) => t.status === "in-progress").length,
    blocked: source.filter((t) => t.status === "blocked").length,
    done: source.filter((t) => t.status === "done").length,
  };

  const assignees = [...new Set(source.map((t) => t.assignee).filter(Boolean))] as string[];

  function handleCreate() {
    if (!form.title.trim()) return;
    createWorkflow.mutate(
      {
        ...form,
        client: form.client || undefined,
        type: form.type || undefined,
        assignee: form.assignee || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority || undefined,
      },
      {
        onSuccess() {
          setForm(defaultForm);
          setShowDrawer(false);
          toast({ title: "Task created" });
        },
        onError(err: any) {
          toast({ title: "Create failed", description: err?.message || "Could not create task" });
        },
      },
    );
  }

  function handleStatusChange(id: string, status: Status) {
    updateWorkflow.mutate([id, { status }], {
      onError(err: any) {
        toast({ title: "Update failed", description: err?.message || "Could not update task" });
      },
    });
  }

  function handleDelete(id: string) {
    deleteWorkflow.mutate(id, {
      onError(err: any) {
        toast({ title: "Delete failed", description: err?.message || "Could not delete task" });
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-secondary mb-1">TASK MANAGEMENT</p>
          <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
          <p className="mt-1 text-secondary text-sm">Track compliance tasks, filings, and deliverables across all client workspaces</p>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-orange text-white glow-orange shrink-0"
        >
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tasks", value: stats.total, color: "text-[var(--text-primary)]" },
          { label: "In Progress", value: stats.inProgress, color: "text-blue-400" },
          { label: "Blocked", value: stats.blocked, color: "text-red-400" },
          { label: "Completed", value: stats.done, color: "text-green-400" },
        ].map((stat) => (
          <div key={stat.label} className="card-surface p-4">
            <div className="text-xs text-secondary uppercase tracking-wide">{stat.label}</div>
            <div className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filters + View toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or clients..."
            className="glass-input w-full h-9 pl-9 pr-3 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card-elevated border border-white/10">
            {(["all", "pending", "in-progress", "done", "blocked"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  filterStatus === s ? "bg-gradient-orange text-white" : "text-secondary hover:text-[var(--text-primary)]",
                )}
              >
                {s === "all" ? "All" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Assignee filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="glass-select h-9 px-3 text-xs rounded-lg"
          >
            <option value="all">All assignees</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-card-elevated border border-white/10">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-all capitalize",
                  view === v ? "bg-gradient-orange text-white" : "text-secondary hover:text-[var(--text-primary)]",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List View */}
      {view === "list" && (
        <div className="card-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Task", "Client", "Type", "Assignee", "Due Date", "Status", "Priority", ""].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-widest text-tertiary px-4 py-3 bg-white/[0.02]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6">
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((n) => (
                        <div key={n} className="h-6 rounded bg-white/[0.02] animate-pulse" />
                      ))}
                    </div>
                  </td>
                </tr>
              ) : source.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <GitBranch className="h-10 w-10 mx-auto mb-3 text-secondary" />
                    <div className="text-lg font-semibold text-[var(--text-primary)]">No tasks yet</div>
                    <div className="mt-1 text-sm text-secondary">Create your first task to start tracking work across client workspaces.</div>
                    <button
                      onClick={() => setShowDrawer(true)}
                      className="mt-4 px-4 py-2 rounded-lg bg-gradient-orange text-white text-sm font-semibold"
                    >
                      Create first task
                    </button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-secondary text-sm">
                    No tasks match your filters
                  </td>
                </tr>
              ) : (
                filtered.map((task, i) => {
                  const sc = statusConfig[task.status];
                  const pc = task.priority ? priorityConfig[task.priority] : { color: "text-secondary", bg: "bg-white/5" };
                  return (
                    <tr
                      key={task.id}
                      className={cn("border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group", i % 2 === 0 ? "" : "bg-white/[0.01]")}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text-primary)] truncate max-w-[200px]">{task.title}</div>
                        <div className="text-xs text-tertiary mt-0.5">
                          {task.completedSubtasks ?? 0}/{task.subtasks ?? 0} subtasks
                        </div>
                      </td>
                      <td className="px-4 py-3 text-secondary text-xs">{clientName(task.client)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-secondary">{task.type ?? "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-gradient-orange grid place-items-center text-[9px] font-bold text-white shrink-0">
                            {task.assignee ? task.assignee.charAt(0) : ""}
                          </div>
                          <span className="text-xs text-secondary">{task.assignee ?? "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-secondary">{task.dueDate ?? "—"}</td>
                      <td className="px-4 py-3">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as Status)}
                          className={cn("text-xs font-medium px-2 py-1 rounded-full appearance-none cursor-pointer border-0 outline-none", sc.bg, sc.color)}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {statusConfig[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border capitalize", pc.color, pc.bg)}>
                          {task.priority ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Board View */}
      {view === "board" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ALL_STATUSES.map((status) => {
                const sc = statusConfig[status];
                const StatusIcon = sc.icon;
                return (
                  <div key={status} className="space-y-3">
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl", sc.bg)}>
                      <StatusIcon className={cn("h-4 w-4", sc.color)} />
                      <span className={cn("text-xs font-semibold", sc.color)}>{sc.label}</span>
                      <span className="ml-auto text-xs text-secondary">—</span>
                    </div>
                    <div className="space-y-2">
                      {[1, 2].map((n) => (
                        <div key={n} className="h-10 rounded bg-white/[0.02] animate-pulse" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : source.length === 0 ? (
            <div className="card-surface p-16 text-center">
              <GitBranch className="h-10 w-10 mx-auto mb-3 text-secondary" />
              <div className="text-lg font-semibold text-[var(--text-primary)]">No tasks yet</div>
              <div className="mt-1 text-sm text-secondary">Create your first task to start tracking work across client workspaces.</div>
              <button onClick={() => setShowDrawer(true)} className="mt-4 px-4 py-2 rounded-lg bg-gradient-orange text-white text-sm font-semibold">
                Create first task
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {ALL_STATUSES.map((status) => {
                const sc = statusConfig[status];
                const StatusIcon = sc.icon;
                const columnTasks = filtered.filter((t) => t.status === status);
                return (
                  <div key={status} className="space-y-3">
                    <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl", sc.bg)}>
                      <StatusIcon className={cn("h-4 w-4", sc.color)} />
                      <span className={cn("text-xs font-semibold", sc.color)}>{sc.label}</span>
                      <span className="ml-auto text-xs text-secondary">{columnTasks.length}</span>
                    </div>
                    <div className="space-y-2">
                      {columnTasks.length ? (
                        columnTasks.map((task) => {
                          const pc = task.priority ? priorityConfig[task.priority] : { color: "text-secondary", bg: "bg-white/5" };
                          return (
                            <div key={task.id} className="card-surface p-3 space-y-2 group hover:bg-white/[0.06] transition-colors">
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-sm font-medium text-[var(--text-primary)] leading-snug">{task.title}</div>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-red-400 shrink-0"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="text-xs text-secondary">{clientName(task.client)}</div>
                              <div className="flex items-center justify-between gap-2">
                                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize", pc.color, pc.bg)}>
                                  {task.priority ?? "—"}
                                </span>
                                <div className="flex items-center gap-1">
                                  <div className="h-4 w-4 rounded-full bg-gradient-orange grid place-items-center text-[8px] font-bold text-white">
                                    {task.assignee ? task.assignee.charAt(0) : ""}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-[10px] text-tertiary">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {task.dueDate ?? "—"}
                                </span>
                                <span>
                                  {task.completedSubtasks ?? 0}/{task.subtasks ?? 0}
                                </span>
                              </div>
                              {/* Status change buttons */}
                              <div className="flex gap-1 pt-1">
                                {ALL_STATUSES.filter((s) => s !== task.status).map((s) => {
                                  const targetSc = statusConfig[s];
                                  return (
                                    <button
                                      key={s}
                                      onClick={() => handleStatusChange(task.id, s)}
                                      className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-md transition-all", targetSc.bg, targetSc.color, "hover:brightness-125")}
                                    >
                                      {targetSc.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-tertiary text-xs">No tasks</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create Task Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create task</h3>
              <button onClick={() => setShowDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <FormField label="Title">
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="glass-input w-full h-10 px-3 text-sm"
                  placeholder="e.g. File GSTR-3B for Acme Corp"
                />
              </FormField>

              <FormField label="Client">
                <select
                  value={form.client ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, client: e.target.value }))}
                  className="glass-select w-full h-10 px-3 rounded-[10px] text-sm"
                >
                  <option value="">No client linked</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Type">
                  <select
                    value={form.type ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                    className="glass-select w-full h-10 px-3 rounded-[10px] text-sm"
                  >
                    <option value="">Select type</option>
                    {TASK_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Priority">
                  <select
                    value={form.priority ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, priority: (e.target.value || undefined) as Priority | undefined }))}
                    className="glass-select w-full h-10 px-3 rounded-[10px] text-sm"
                  >
                    <option value="">No priority</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Assignee">
                <input
                  value={form.assignee ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, assignee: e.target.value }))}
                  className="glass-input w-full h-10 px-3 text-sm"
                  placeholder="Team member name"
                />
              </FormField>

              <FormField label="Due Date">
                <input
                  type="date"
                  value={form.dueDate ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                  className="glass-input w-full h-10 px-3 text-sm"
                />
              </FormField>

              <button
                onClick={handleCreate}
                disabled={!form.title.trim() || createWorkflow.status === "pending"}
                className="w-full h-11 mt-2 rounded-lg bg-gradient-orange text-white font-semibold glow-orange disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {createWorkflow.status === "pending" ? "Creating..." : "Create task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-secondary">{label}</label>
      {children}
    </div>
  );
}
