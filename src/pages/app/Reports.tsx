import { useState } from "react";
import { ArrowUpRight, FileText, Plus, X, BarChart3, Send, CheckCircle2, Clock3, ChevronDown, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReports, useCreateReport } from "@/hooks/useReports";
import { useClients } from "@/hooks/useClients";
import { useCalculations } from "@/hooks/useCalculations";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { ClientRecord, CalculationRecord } from "@/data/workspace";

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

  const calculationsQuery = useCalculations();

  const [showDrawer, setShowDrawer] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formClientId, setFormClientId] = useState("");
  const [formType, setFormType] = useState("Tax Computation");
  const [formPeriod, setFormPeriod] = useState("");
  const [formStatus, setFormStatus] = useState<"draft" | "ready" | "sent">("draft");
  const [selectedCalcIds, setSelectedCalcIds] = useState<string[]>([]);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  if (clientsQuery.isLoading || reportsQuery.isLoading) return <div className="max-w-6xl mx-auto py-8">Loading reports...</div>;
  if (clientsQuery.error || reportsQuery.error) return <div className="max-w-6xl mx-auto py-8 text-red-400">Failed to load reports.</div>;

  const clients: ClientRecord[] = (clientsQuery.data ?? []) as ClientRecord[];
  const reports = reportsQuery.data ?? [];
  const allCalculations: CalculationRecord[] = (calculationsQuery.data ?? []) as CalculationRecord[];
  const clientCalcs = formClientId ? allCalculations.filter((c) => c.clientId === formClientId) : [];

  const countByStatus = (s: string) => reports.filter((r) => r.status === s).length;
  const ownerName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Unknown";

  function toggleCalcId(id: string) {
    setSelectedCalcIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function resetForm() {
    setFormTitle("");
    setFormClientId("");
    setFormType("Tax Computation");
    setFormPeriod("");
    setFormStatus("draft");
    setSelectedCalcIds([]);
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
    { label: "Total Reports", value: reports.length, icon: BarChart3, tone: "text-[var(--text-primary)]" },
    { label: "Draft", value: countByStatus("draft"), icon: Clock3, tone: "text-amber-300" },
    { label: "Ready", value: countByStatus("ready"), icon: CheckCircle2, tone: "text-sky-300" },
    { label: "Sent", value: countByStatus("sent"), icon: Send, tone: "text-emerald-300" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
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
            <div className="font-semibold text-[var(--text-primary)]">No reports yet</div>
            <div className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
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
            {reports.map((report) => {
              const reportCalcs = allCalculations.filter((c) => c.clientId === report.clientId);
              const isExpanded = expandedReportId === report.id;
              return (
                <div key={report.id}>
                  <div className="px-5 py-4 grid grid-cols-12 items-center gap-3 hover:bg-white/[0.02] transition-colors">
                    <div className="col-span-4 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="truncate text-sm font-medium text-[var(--text-primary)]">{report.title}</div>
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
                      <button
                        onClick={() => setExpandedReportId(isExpanded ? null : report.id)}
                        className="inline-flex items-center gap-1 text-xs text-primary"
                      >
                        {isExpanded ? "Close" : "Open"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-5 pb-4 border-t border-white/[0.04] bg-white/[0.01]">
                      <div className="p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div><span className="text-secondary">Type:</span> <span className="text-[var(--text-primary)]">{report.type}</span></div>
                          <div><span className="text-secondary">Period:</span> <span className="text-[var(--text-primary)]">{report.period || "—"}</span></div>
                          <div><span className="text-secondary">Client:</span> <span className="text-[var(--text-primary)]">{clients.find((c) => c.id === report.clientId)?.name || "—"}</span></div>
                          <div><span className="text-secondary">Status:</span> <span className="text-[var(--text-primary)]">{report.status}</span></div>
                        </div>
                        {reportCalcs.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-secondary mb-2">Linked calculations</div>
                            <div className="space-y-1.5">
                              {reportCalcs.map((calc) => (
                                <div key={calc.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                  <Calculator className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span className="text-sm text-[var(--text-primary)]">{calc.title}</span>
                                  {calc.subtitle && <span className="text-xs text-secondary ml-auto">{calc.subtitle}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {reportCalcs.length === 0 && (
                          <div className="text-xs text-secondary">No calculations linked to this report's client.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">New Report</h3>
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
                <label className="block text-xs font-medium text-secondary mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none"
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
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-primary/60 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Status</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "draft" | "ready" | "sent")}
                  className="w-full h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm text-[var(--text-primary)] focus:border-primary/60 outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="sent">Sent</option>
                </select>
              </div>

              {clientCalcs.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-secondary mb-2">Include calculations</label>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {clientCalcs.map((calc) => (
                      <label key={calc.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.04] cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedCalcIds.includes(calc.id)}
                          onChange={() => toggleCalcId(calc.id)}
                          className="accent-orange-500"
                        />
                        <Calculator className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-[var(--text-primary)] truncate">{calc.title}</span>
                        <span className="text-xs text-secondary ml-auto shrink-0">{calc.savedAt ? new Date(calc.savedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : ""}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

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
