import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  FileClock,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  LockKeyhole,
  Plus,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useDocuments, useCreateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import { useDocumentRequests, useCreateDocumentRequest, useUpdateDocumentRequest, useDeleteDocumentRequest } from "@/hooks/useDocumentRequests";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import type { ClientRecord, DocumentRecord } from "@/data/workspace";
import type { DocumentRequest } from "@/services/documentRequests";
import type { DocumentRequestStatus } from "@/types/database";

type UploadedFile = {
  name: string;
  type: string;
  clientId?: string;
  period: string;
};

function detectType(name: string): string {
  const lowered = name.toLowerCase();
  if (lowered.endsWith(".xlsx") || lowered.endsWith(".xls")) return "Workbook";
  if (lowered.endsWith(".csv")) return "CSV";
  if (lowered.endsWith(".pdf")) return "PDF";
  return "Document";
}

const STATUS_CONFIG: Record<DocumentRequestStatus, { label: string; bg: string; text: string }> = {
  requested: { label: "Requested", bg: "bg-amber-500/15", text: "text-amber-300" },
  reminded: { label: "Reminded", bg: "bg-orange-500/15", text: "text-orange-300" },
  received: { label: "Received", bg: "bg-emerald-500/15", text: "text-emerald-300" },
  verified: { label: "Verified", bg: "bg-sky-500/15", text: "text-sky-300" },
};

function isOverdue(req: DocumentRequest): boolean {
  if (req.status === "received" || req.status === "verified") return false;
  if (!req.dueDate) return false;
  return new Date(req.dueDate) < new Date();
}

const defaultForm = { clientId: "", title: "", description: "", dueDate: "" };

export default function Documents() {
  const [tab, setTab] = useState<"files" | "requests">("files");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-secondary">Document Vault</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Connect evidence, requests, and review readiness
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-secondary">
            Upload, organize, and track documents across client workspaces.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-white/[0.08]">
        <button
          onClick={() => setTab("files")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors relative",
            tab === "files" ? "text-[var(--text-primary)]" : "text-secondary hover:text-[var(--text-primary)]",
          )}
        >
          <FolderOpen className="inline-block h-4 w-4 mr-2" />
          Files
          {tab === "files" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
        <button
          onClick={() => setTab("requests")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium transition-colors relative",
            tab === "requests" ? "text-[var(--text-primary)]" : "text-secondary hover:text-[var(--text-primary)]",
          )}
        >
          <FileClock className="inline-block h-4 w-4 mr-2" />
          Requests
          {tab === "requests" && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
        </button>
      </div>

      {tab === "files" ? <FilesTab /> : <RequestsTab />}
    </div>
  );
}

/* ─── Files Tab (existing functionality) ─── */
function FilesTab() {
  const clientsQuery = useClients();
  const documentsQuery = useDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  if (clientsQuery.isLoading || documentsQuery.isLoading)
    return <div className="py-8">Loading documents...</div>;
  if (clientsQuery.error || documentsQuery.error)
    return <div className="py-8 text-red-400">Failed to load documents.</div>;

  const clients = (clientsQuery.data ?? []) as ClientRecord[];
  const seededDocuments = (documentsQuery.data ?? []) as DocumentRecord[];
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (seededDocuments.length === 0) {
    return (
      <div className="card-surface p-16 text-center">
        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-secondary" />
        <div className="text-lg font-semibold text-[var(--text-primary)]">No documents yet</div>
        <div className="mt-2 text-sm text-secondary max-w-md mx-auto">
          Upload client documents or create document requests to track what's missing.
        </div>
        <div className="mt-4 flex justify-center gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
          >
            <Upload className="h-4 w-4" /> Upload Document
          </button>
        </div>
        <input ref={inputRef} type="file" multiple accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </div>
    );
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadedFile[] = Array.from(fileList).map((file, index) => ({
      name: file.name,
      type: detectType(file.name),
      clientId: clients.length ? clients[index % clients.length]?.id ?? "" : "",
      period: "Apr 2026",
    }));
    newFiles.forEach((file) => {
      createDocument.mutate({
        clientId: file.clientId,
        name: file.name,
        type: file.type,
        period: file.period,
        status: "processing",
        source: "Local upload",
      });
    });
  };

  const mergedFiles = useMemo(
    () =>
      seededDocuments.map((document) => ({
        id: document.id,
        name: document.name,
        size: "-",
        type: document.type,
        uploadedAt: document.updatedAt ?? "-",
        clientId: document.clientId,
        period: document.period,
        status: document.status === "verified" ? "verified" : "processing",
        sourceStatus: document.status,
      })),
    [seededDocuments],
  );

  return (
    <>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="px-4 h-10 rounded-pill bg-card border border-white/10 hover:border-primary/40 text-sm font-medium flex items-center gap-2 transition-all"
        >
          <FileSpreadsheet className="h-4 w-4 text-primary" /> Import workbook
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="px-4 h-10 rounded-pill bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Upload className="h-4 w-4" /> Upload evidence
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <InsightCard label="Needs review" value={`${seededDocuments.filter((d) => d.status === "needs_review").length}`} detail="Items blocking final sign-off" icon={FileSearch} />
        <InsightCard label="Missing" value={`${seededDocuments.filter((d) => d.status === "missing").length}`} detail="Client-side collection still open" icon={FileClock} tone="warning" />
        <InsightCard label="Total documents" value={`${seededDocuments.length}`} detail="Files in the vault" icon={LockKeyhole} tone="success" />
      </div>

      <input ref={inputRef} type="file" multiple accept=".xlsx,.xls,.csv,.pdf" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        className="card-surface w-full p-12 flex flex-col items-center gap-3 transition-all"
        style={{
          borderStyle: "dashed",
          borderColor: dragging ? "var(--color-primary)" : "var(--border-color)",
          background: dragging ? "var(--color-primary-glow)" : undefined,
        }}
      >
        <div className="h-14 w-14 rounded-xl bg-primary/10 grid place-items-center">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-[var(--text-primary)]">
            {dragging ? "Drop files into the vault" : "Drop files here or click to upload"}
          </div>
          <div className="mt-1 text-xs text-secondary">
            Supported: Excel (.xlsx .xls), CSV, and PDF. Route them to the right client workspace next.
          </div>
        </div>
      </button>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.85fr]">
        <div className="card-surface overflow-hidden">
          <div className="px-5 py-3 grid grid-cols-12 text-[10px] uppercase tracking-wider font-semibold border-b border-white/[0.06] bg-white/[0.02] text-secondary">
            <div className="col-span-4">Document</div>
            <div className="col-span-2">Client</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Period</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-white/[0.04]">
            {mergedFiles.map((file) => (
              <div key={file.id} className="px-5 py-3 grid grid-cols-12 items-center hover:bg-white/[0.02] transition-colors group gap-3">
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-[var(--text-primary)]">{file.name}</div>
                    <div className="text-xs text-secondary">{file.uploadedAt}</div>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-secondary">
                  {clients.find((c) => c.id === file.clientId)?.name || "Unassigned"}
                </div>
                <div className="col-span-2 text-xs text-secondary">{file.type}</div>
                <div className="col-span-2 text-xs text-secondary">{file.period}</div>
                <div className="col-span-1">
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    file.sourceStatus === "missing" ? "bg-red-500/15 text-red-300"
                      : file.sourceStatus === "needs_review" ? "bg-amber-500/15 text-amber-300"
                        : file.status === "processing" ? "bg-sky-500/15 text-sky-300"
                          : "bg-emerald-500/15 text-emerald-300",
                  )}>
                    {(file.sourceStatus || file.status).replace("_", " ")}
                  </span>
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteDocument.mutate(file.id)}
                    className="opacity-0 group-hover:opacity-100 h-6 w-6 rounded-md grid place-items-center hover:bg-destructive/20 transition-all text-secondary"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Review queue</div>
            <p className="mt-1 text-sm text-secondary">
              Documents that need attention before they can be used in filings or reports.
            </p>
            <div className="mt-4 space-y-3">
              {seededDocuments
                .filter((d) => d.status === "needs_review" || d.status === "missing")
                .map((document) => (
                  <div key={document.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-sm font-medium text-[var(--text-primary)]">{document.name}</div>
                    <div className="mt-1 text-xs text-secondary">
                      {clients.find((c) => c.id === document.clientId)?.name} · {document.period}
                    </div>
                    <div className="mt-3 text-sm text-amber-200">
                      {document.status === "missing" ? "Awaiting client upload." : "Requires review before use in filings or reports."}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Requests Tab ─── */
function RequestsTab() {
  const { user } = useAuth();
  const clientsQuery = useClients();
  const requestsQuery = useDocumentRequests();
  const createRequest = useCreateDocumentRequest();
  const updateRequest = useUpdateDocumentRequest();
  const deleteRequest = useDeleteDocumentRequest();

  const clients = (clientsQuery.data ?? []) as ClientRecord[];
  const requests = (requestsQuery.data ?? []) as DocumentRequest[];

  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [filterClient, setFilterClient] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const totalRequests = requests.length;
  const pendingCount = requests.filter((r) => r.status === "requested" || r.status === "reminded").length;
  const overdueCount = requests.filter(isOverdue).length;
  const receivedCount = requests.filter((r) => r.status === "received" || r.status === "verified").length;

  const filtered = requests.filter((r) => {
    if (filterClient && r.clientId !== filterClient) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  function handleSubmit() {
    if (!form.clientId || !form.title) {
      toast({ title: "Missing fields", description: "Client and document title are required." });
      return;
    }
    createRequest.mutate(
      {
        clientId: form.clientId,
        title: form.title,
        description: form.description || undefined,
        dueDate: form.dueDate || undefined,
        status: "requested",
        requestedBy: user?.email || user?.id || "Unknown",
      },
      {
        onSuccess() {
          toast({ title: "Request created", description: `"${form.title}" requested` });
          setForm(defaultForm);
          setShowDrawer(false);
        },
      },
    );
  }

  function handleStatusChange(id: string, status: DocumentRequestStatus) {
    updateRequest.mutate([id, { status }], {
      onSuccess() {
        toast({ title: "Status updated", description: `Request marked as ${status}` });
      },
    });
  }

  return (
    <>
      {/* Stats bar */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Requests" value={totalRequests} icon={FileText} />
        <StatCard label="Pending" value={pendingCount} icon={FileClock} tone="warning" />
        <StatCard label="Overdue" value={overdueCount} icon={AlertTriangle} tone="danger" />
        <StatCard label="Received" value={receivedCount} icon={CheckCircle2} tone="success" />
      </div>

      {/* Filters + Action */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary pointer-events-none" />
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="glass-select pl-9 pr-4 h-10 text-sm min-w-[180px]"
          >
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="glass-select px-4 h-10 text-sm min-w-[150px]"
        >
          <option value="">All statuses</option>
          <option value="requested">Requested</option>
          <option value="reminded">Reminded</option>
          <option value="received">Received</option>
          <option value="verified">Verified</option>
        </select>

        <div className="flex-1" />

        <button
          onClick={() => setShowDrawer(true)}
          className="px-4 h-10 rounded-pill bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Request Document
        </button>
      </div>

      {/* Requests table */}
      <div className="card-surface overflow-hidden">
        <div className="px-5 py-3 grid grid-cols-12 text-[10px] uppercase tracking-wider font-semibold border-b border-white/[0.06] bg-white/[0.02] text-secondary">
          <div className="col-span-3">Document</div>
          <div className="col-span-2">Client</div>
          <div className="col-span-2">Due Date</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-3 text-right">Actions</div>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-secondary">
              No document requests found. Click "Request Document" to create one.
            </div>
          ) : (
            filtered.map((req) => {
              const overdue = isOverdue(req);
              const cfg = STATUS_CONFIG[req.status];
              return (
                <div key={req.id} className="px-5 py-3 grid grid-cols-12 items-center hover:bg-white/[0.02] transition-colors group gap-3">
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-2">
                      {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                      <span className="truncate text-sm text-[var(--text-primary)]">{req.title}</span>
                    </div>
                    {req.description && (
                      <div className="text-xs text-secondary mt-0.5 truncate">{req.description}</div>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-secondary">
                    {req.clientName || clients.find((c) => c.id === req.clientId)?.name || "—"}
                  </div>
                  <div className="col-span-2 text-xs text-secondary">
                    {req.dueDate ? new Date(req.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    {overdue && <span className="ml-1 text-red-400 font-medium">Overdue</span>}
                  </div>
                  <div className="col-span-2">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", cfg.bg, cfg.text)}>
                      {cfg.label}
                    </span>
                  </div>
                  <div className="col-span-3 flex justify-end gap-1.5">
                    {req.status === "requested" && (
                      <button
                        onClick={() => handleStatusChange(req.id, "reminded")}
                        className="h-7 px-2.5 rounded-md border border-white/10 hover:border-orange-400/40 text-xs text-secondary hover:text-orange-300 transition-colors flex items-center gap-1"
                      >
                        <Bell className="h-3 w-3" /> Remind
                      </button>
                    )}
                    {(req.status === "requested" || req.status === "reminded") && (
                      <button
                        onClick={() => handleStatusChange(req.id, "received")}
                        className="h-7 px-2.5 rounded-md border border-white/10 hover:border-emerald-400/40 text-xs text-secondary hover:text-emerald-300 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="h-3 w-3" /> Received
                      </button>
                    )}
                    {req.status === "received" && (
                      <button
                        onClick={() => handleStatusChange(req.id, "verified")}
                        className="h-7 px-2.5 rounded-md border border-white/10 hover:border-sky-400/40 text-xs text-secondary hover:text-sky-300 transition-colors flex items-center gap-1"
                      >
                        <ShieldCheck className="h-3 w-3" /> Verify
                      </button>
                    )}
                    <button
                      onClick={() => deleteRequest.mutate(req.id)}
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-md grid place-items-center hover:bg-destructive/20 transition-all text-secondary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Drawer */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Request Document</h3>
              <button onClick={() => setShowDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Client *</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="glass-select w-full h-10 px-3 text-sm"
                >
                  <option value="">Select a client</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Document title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. March purchase register"
                  className="glass-input w-full h-10 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. PDF preferred, password-protected OK"
                  rows={3}
                  className="glass-input w-full px-3 py-2 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="glass-input w-full h-10 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">Requested by</label>
                <input
                  type="text"
                  value={user?.email || user?.id || ""}
                  disabled
                  className="glass-input w-full h-10 px-3 text-sm opacity-60"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDrawer(false)}
                  className="flex-1 h-10 rounded-pill border border-white/10 text-sm text-secondary hover:text-[var(--text-primary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createRequest.status === "pending"}
                  className="flex-1 h-10 rounded-pill bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {createRequest.status === "pending" ? "Creating..." : "Create Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Shared components ─── */
function InsightCard({ label, value, detail, icon: Icon, tone }: {
  label: string; value: string; detail: string; icon: typeof FileSearch; tone?: "warning" | "success";
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-secondary">{label}</div>
        <Icon className={cn("h-4 w-4", tone === "warning" ? "text-amber-300" : tone === "success" ? "text-emerald-300" : "text-primary")} />
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
      <div className="mt-1 text-sm text-secondary">{detail}</div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }: {
  label: string; value: number; icon: typeof FileText; tone?: "warning" | "danger" | "success";
}) {
  return (
    <div className="card-surface p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-secondary">{label}</div>
        <Icon className={cn("h-4 w-4", tone === "danger" ? "text-red-400" : tone === "warning" ? "text-amber-300" : tone === "success" ? "text-emerald-300" : "text-primary")} />
      </div>
      <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}
