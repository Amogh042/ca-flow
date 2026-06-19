import { useState } from "react";
import { ArrowUpRight, FileText, Plus, X, BarChart3, Send, CheckCircle2, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReports, useCreateReport } from "@/hooks/useReports";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { ClientRecord } from "@/data/workspace";

const REPORT_TYPES = [
  "Tax Computation",
  "GST Summary",
  "Compliance Status",
  "Payroll Report",
  "Advisory Note",
  "Other",
];

export default function Reports() {
  const { user } = useAuth();
  const clientsQuery = useClients();
  const reportsQuery = useReports();
  const createReport = useCreateReport();

  const [showDrawer, setShowDrawer] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formType, setFormType] = useState("Tax Computation");
  const [formPeriod, setFormPeriod] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "ready" | "sent">("draft");

  if (clientsQuery.isLoading || reportsQuery.isLoading) return <div className="max-w-6xl mx-auto py-8">Loading reports...</div>;
  if (clientsQuery.error || reportsQuery.error) return <div className="max-w-6xl mx-auto py-8 text-red-400">Failed to load reports.</div>;

  const clients: ClientRecord[] = (clientsQuery.data ?? []) as ClientRecord[];
  const reports = reportsQuery.data ?? [];

  const countByStatus = (s: string) => reports.filter((r) => r.status === s).length;
  const ownerName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Unknown";

  function resetForm() {
    setFormTitle("");
    setFormClientId("");
    setFormType("Tax Computation");
    setFormPeriod("");
    setFormStatus("draft");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) return;
    createReport.mutate(
      {
        clientId: formClientId,
        title: formTitle.trim(),
        type: formType,
        period: formPeriod.trim(),
        status: formStatus,
        owner: ownerName,
      },
      {
        onSuccess() {
          toast({ title: "Report created", description: formTitle.trim() });
          resetForm();
          setShowDrawer(false);
        },
      },
    );
  }

  const stats = [
    { label: "Total Reports", value: reports.length, icon: BarChart3, tone: "text-white" },
    { label: "Draft", value: countByStatus("draft"), icon: Clock3, tone: "text-amber-300" },
    { label: "Ready", value: countByStatus("ready"), icon: CheckCircle2, tone: "text-sky-300" },
    { label: "Sent", value: countByStatus("sent"), icon: Send, tone: "text-emerald-300" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            Client-facing deliverables: review packs, advisory notes, and MIS summaries.
          </p>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="px-4 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Create Report
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-secondary">{s.label}</div>
              <s.icon className={cn("h-4 w-4", s.tone)} />
            </div>
            <div className={cn("mt-3 text-3xl font-bold", s.tone)}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card-surface overflow-hidden">
        <div className="px-5 py-3 grid grid-cols-12 text-[10px] uppercase tracking-wider font-semibold border-b border-white/[0.06] bg-white/[0.02] text-secondary">
          <div className="col-span-4">Deliverable</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-2">Type</div>
          <div className="col-span-2">Period</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Open</div>
        </div>

        {reports.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-secondary" />
            <div className="font-semibold text-white">No reports yet</div>
            <div className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
              Create your first report to get started with client deliverables.
            </div>
            <button
              onClick={() => setShowDrawer(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-gradient-orange text-white text-sm font-semibold glow-orange"
            >
              Create Report
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {reports.map((report) => (
              <div key={report.id} className="px-5 py-4 grid grid-cols-12 items-center gap-3 hover:bg-white/[0.02] transition-colors">
                <div className="col-span-4 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div className="truncate text-sm font-medium text-white">{report.title}</div>
                  </div>
                  <div className="mt-1 text-xs text-secondary">Updated {report.updatedAt} · Owner {report.owner}</div>
                </div>
                <div className="col-span-2 text-xs text-secondary truncate">
                  {clients.find((c) => c.id === report.clientId)?.name || "—"}
                </div>
                <div className="col-span-2 text-xs text-secondary">{report.type}</div>
                <div className="col-span-2 text-xs text-secondary">{report.period}</div>
                <div className="col-span-1">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      report.status === "draft"
                        ? "bg-amber-500/15 text-amber-300"
                        : report.status === "ready"
                          ? "bg-sky-500/15 text-sky-300"
                          : "bg-emerald-500/15 text-emerald-300",
                    )}
                  >
                    {report.status}
                  </span>
                </div>
                <div className="col-span-1 text-right">
                  <button className="inline-flex items-center gap-1 text-xs text-primary">
                    Open <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowDrawer(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "#111111" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">New Report</h3>
              <button onClick={() => setShowDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Title *</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder="e.g. Q4 Tax Computation — Acme Ltd"
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-primary/60 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Client</label>
                <select
                  value={formClientId}
                  onChange={(e) => setFormClientId(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white focus:border-primary/60 outline-none"
                >
                  <option value="">— No client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white focus:border-primary/60 outline-none"
                >
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Period</label>
                <input
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(e.target.value)}
                  placeholder="e.g. FY 2025-26, April 2026"
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/30 focus:border-primary/60 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "draft" | "ready" | "sent")}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-white focus:border-primary/60 outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="sent">Sent</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createReport.status === "pending"}
                  className="flex-1 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all disabled:opacity-50"
                >
                  {createReport.status === "pending" ? "Creating…" : "Create Report"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="h-10 px-4 rounded-pill border border-white/10 text-sm text-secondary hover:text-white transition-colors"
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
