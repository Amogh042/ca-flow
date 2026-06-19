import { useMemo, useRef, useState } from "react";
import {
  FileBarChart,
  FileClock,
  FileSearch,
  FileSpreadsheet,
  FileText,
  LockKeyhole,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useDocuments, useCreateDocument, useDeleteDocument } from "@/hooks/useDocuments";
import type { ClientRecord, DocumentRecord } from "@/data/workspace";

type UploadedFile = {
  name: string;
  type: string;
  clientId?: string;
  period: string;
};

const smartImportTypes = [
  "Trial balance",
  "GSTR working papers",
  "Payroll register",
  "Boarding pack for advisory",
  "Bank statements",
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function detectType(name: string): string {
  const lowered = name.toLowerCase();
  if (lowered.endsWith(".xlsx") || lowered.endsWith(".xls")) return "Workbook";
  if (lowered.endsWith(".csv")) return "CSV";
  if (lowered.endsWith(".pdf")) return "PDF";
  return "Document";
}

export default function Documents() {
  const clientsQuery = useClients();
  const documentsQuery = useDocuments();
  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();

  if (clientsQuery.isLoading || documentsQuery.isLoading) return <div className="max-w-7xl mx-auto py-8">Loading documents...</div>;
  if (clientsQuery.error || documentsQuery.error) return <div className="max-w-7xl mx-auto py-8 text-red-400">Failed to load documents.</div>;

  const clients = (clientsQuery.data ?? []) as ClientRecord[];
  const seededDocuments = (documentsQuery.data ?? []) as DocumentRecord[];
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const now = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

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

  const storageLabel = `${(seededDocuments.length * 1.8 + 12.4).toFixed(1)} MB`;
  const storagePct = Math.min(62, 12 + seededDocuments.length * 8);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-secondary">
            Document Vault
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Connect evidence, requests, and review readiness
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-secondary">
            Upload, organize, and track documents across client workspaces.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 h-10 rounded-pill bg-card border border-white/10 hover:border-primary/40 text-sm font-medium flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" /> Import workbook
          </button>
          <button
            onClick={() => inputRef.current?.click()}
            className="px-4 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center gap-2"
          >
            <Upload className="h-4 w-4" /> Upload evidence
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="uppercase tracking-wide text-secondary">Vault capacity</span>
            <span className="text-secondary">{storageLabel} of 100 MB used</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-white/[0.05]">
            <div
              className="h-full bg-gradient-orange rounded-full transition-all duration-500"
              style={{ width: `${storagePct}%` }}
            />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <InsightCard label="Needs review" value="2" detail="Items blocking final sign-off" icon={FileSearch} />
            <InsightCard label="Missing requests" value="1" detail="Client-side collection still open" icon={FileClock} tone="warning" />
            <InsightCard label="Local processing" value="Yes" detail="No document content leaves the workspace" icon={LockKeyhole} tone="success" />
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FileBarChart className="h-4 w-4 text-primary" />
            Smart import targets
          </div>
          <p className="mt-1 text-sm text-secondary">
            Supported document types for structured import.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {smartImportTypes.map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-white/80"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv,.pdf"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <button
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className="card-surface w-full p-12 flex flex-col items-center gap-3 transition-all"
        style={{
          borderStyle: "dashed",
          borderColor: dragging ? "rgba(249,115,22,0.6)" : "rgba(255,255,255,0.12)",
          background: dragging ? "rgba(249,115,22,0.04)" : undefined,
        }}
      >
        <div className="h-14 w-14 rounded-xl bg-primary/10 grid place-items-center">
          <Upload className="h-7 w-7 text-primary" />
        </div>
        <div className="text-center">
          <div className="font-semibold text-white">
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
                    <div className="truncate text-sm text-white">{file.name}</div>
                    <div className="text-xs text-secondary">{file.uploadedAt}</div>
                  </div>
                </div>
                <div className="col-span-2 text-xs text-secondary">
                  {clients.find((client) => client.id === file.clientId)?.name || "Unassigned"}
                </div>
                <div className="col-span-2 text-xs text-secondary">{file.type}</div>
                <div className="col-span-2 text-xs text-secondary">{file.period}</div>
                <div className="col-span-1">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      file.sourceStatus === "missing"
                        ? "bg-red-500/15 text-red-300"
                        : file.sourceStatus === "needs_review"
                          ? "bg-amber-500/15 text-amber-300"
                          : file.status === "processing"
                            ? "bg-sky-500/15 text-sky-300"
                            : "bg-emerald-500/15 text-emerald-300",
                    )}
                  >
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
            <div className="text-sm font-semibold text-white">Review queue</div>
            <p className="mt-1 text-sm text-secondary">
              Documents that need attention before they can be used in filings or reports.
            </p>
            <div className="mt-4 space-y-3">
              {seededDocuments
                .filter((document) => document.status === "needs_review" || document.status === "missing")
                .map((document) => (
                  <div key={document.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="text-sm font-medium text-white">{document.name}</div>
                    <div className="mt-1 text-xs text-secondary">
                      {clients.find((client) => client.id === document.clientId)?.name} · {document.period}
                    </div>
                    <div className="mt-3 text-sm text-amber-200">
                      {document.status === "missing"
                        ? "Awaiting client upload."
                        : "Requires review before use in filings or reports."}
                    </div>
                  </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof FileSearch;
  tone?: "warning" | "success";
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-secondary">{label}</div>
        <Icon
          className={cn(
            "h-4 w-4",
            tone === "warning"
              ? "text-amber-300"
              : tone === "success"
                ? "text-emerald-300"
                : "text-primary",
          )}
        />
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-sm text-secondary">{detail}</div>
    </div>
  );
}
