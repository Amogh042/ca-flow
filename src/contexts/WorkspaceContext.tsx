import { createContext, ReactNode, useContext, useState } from "react";
import type {
  ActivityRecord,
  CalculationRecord,
  ClientRecord,
  DocumentRecord,
  Filing,
  FilingStatus,
  ReportRecord,
} from "@/data/workspace";
import { useQueryClient } from "@tanstack/react-query";
import { useClients } from "@/hooks/useClients";
import { useFilings, useFilingsByClient } from "@/hooks/useFilings";
import { useDocuments, useDocumentsByClient } from "@/hooks/useDocuments";
import { useActivities } from "@/hooks/useActivities";
import { useCalculations } from "@/hooks/useCalculations";
import { useReports } from "@/hooks/useReports";
import * as clientsService from "@/services/clients";
import * as filingsService from "@/services/filings";
import * as documentsService from "@/services/documents";
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import * as calculationsService from "@/services/calculations";
import * as reportsService from "@/services/reports";
import { queryKeys } from "@/types/database";

type WorkspaceState = {
  clients: ClientRecord[];
  filings: Filing[];
  documents: DocumentRecord[];
  activities: ActivityRecord[];
  reports: ReportRecord[];
  calculations: CalculationRecord[];
  selectedClientId: string;
};

type NewClientInput = Omit<
  ClientRecord,
  "id" | "lastActivity" | "openTasks" | "unreadItems" | "documentsReadyPct"
>;

type UploadDocumentInput = {
  clientId?: string;
  name: string;
  type: string;
  period: string;
  source: string;
};

type SaveCalculationInput = {
  clientId: string;
  title: string;
  subtitle: string;
  owner?: string;
};

type WorkspaceContextValue = WorkspaceState & {
  setSelectedClientId: (clientId: string) => void;
  addClient: (input: NewClientInput) => string;
  markFilingStatus: (filingId: string, status: FilingStatus) => void;
  addUploadedDocuments: (inputs: UploadDocumentInput[]) => void;
  removeDocument: (documentId: string) => void;
  saveCalculation: (input: SaveCalculationInput) => void;
  addReport: (report: Omit<ReportRecord, "id" | "updatedAt">) => void;
};

function stampNow() {
  return new Date().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  // Local UI state
  const [selectedClientId, setSelectedClientId] = useState("");

  // Queries (Supabase-backed). Hooks return loading/data; here we extract arrays.
  const clientsQuery = useClients();
  const filingsQuery = useFilings();
  const documentsQuery = useDocuments();
  const activitiesQuery = useActivities();
  const calculationsQuery = useCalculations();
  const reportsQuery = useReports();

  const clients = clientsQuery.data ?? [];
  const filings = filingsQuery.data ?? [];
  const documents = documentsQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const calculations = calculationsQuery.data ?? [];
  const reports = reportsQuery.data ?? [];

  // Add client with optimistic update: returns a temporary id synchronously
  function addClient(input: NewClientInput) {
    const tempId = `client-temp-${Date.now()}`;
    const tempClient: ClientRecord = {
      id: tempId,
      ...input,
      lastActivity: "Just now",
      openTasks: 0,
      unreadItems: 0,
      documentsReadyPct: 0,
    } as ClientRecord;

    const previous = qc.getQueryData<ClientRecord[]>(queryKeys.clients());
    qc.setQueryData(queryKeys.clients(), (old) => [tempClient, ...(old || [])]);

    const activity: ActivityRecord = {
      id: `activity-${Date.now()}`,
      clientId: tempId,
      title: "Client workspace created",
      detail: `${input.name} was added as a new workspace and is ready for filings, documents, and reports.`,
      actor: input.owner,
      time: "Just now",
      kind: "client",
    };
    const prevActivities = qc.getQueryData<ActivityRecord[]>(queryKeys.activities());
    qc.setQueryData(queryKeys.activities(), (old) => [activity, ...(old || [])]);

    setSelectedClientId(tempId);

    // Persist to Supabase; replace temp entry on success or rollback on error
    clientsService
      .createClient(input)
      .then((created) => {
        qc.setQueryData(queryKeys.clients(), (old: ClientRecord[] | undefined) =>
          (old || []).map((c) => (c.id === tempId ? created : c)),
        );
        qc.setQueryData(queryKeys.activities(), (old: ActivityRecord[] | undefined) =>
          (old || []).map((a) => (a.clientId === tempId ? { ...a, clientId: created.id } : a)),
        );
        setSelectedClientId(created.id);
      })
      .catch((err: any) => {
        // rollback
        qc.setQueryData(queryKeys.clients(), previous);
        qc.setQueryData(queryKeys.activities(), prevActivities);
        qc.invalidateQueries(queryKeys.clients());
        setSelectedClientId(previous?.[0]?.id ?? "");
        // Surface friendly error for RLS/insert failures
        const message = err?.message || "Failed to create workspace";
        try {
          // lazy import toast to avoid circular imports at module top
          const { toast } = require("@/hooks/use-toast");
          toast({ title: "Create failed", description: message });
        } catch (_) {
          // ignore if toast is unavailable
        }
      });

    return tempId;
  }

  function markFilingStatus(filingId: string, status: Filing["status"]) {
    const previous = qc.getQueryData<Filing[]>(queryKeys.filings());
    qc.setQueryData(queryKeys.filings(), (old) => old?.map((f) => (f.id === filingId ? { ...f, status } : f)));

    const filing = (previous || []).find((f) => f.id === filingId);
    if (filing) {
      const activity: ActivityRecord = {
        id: `activity-${Date.now()}`,
        clientId: filing.clientId,
        title: `${filing.title} updated`,
        detail: `Status moved to ${String(status).replace("_", " ")} for ${filing.entity}.`,
        actor: filing.owner,
        time: "Just now",
        kind: "filing",
      };
      const prevActivities = qc.getQueryData<ActivityRecord[]>(queryKeys.activities());
      qc.setQueryData(queryKeys.activities(), (old) => [activity, ...(old || [])]);

      filingsService
        .markFilingStatus(filingId, status)
        .then((updated) => {
          qc.setQueryData(queryKeys.filings(), (old) => old?.map((f) => (f.id === updated.id ? updated : f)));
        })
        .catch((err: any) => {
          qc.setQueryData(queryKeys.filings(), previous);
          qc.setQueryData(queryKeys.activities(), prevActivities);
          qc.invalidateQueries(queryKeys.filings());
          try {
            const { toast } = require("@/hooks/use-toast");
            const message = err?.message || "Failed to update filing status";
            toast({ title: "Update failed", description: message });
          } catch (_) {}
        });
    }
  }

  function addUploadedDocuments(inputs: UploadDocumentInput[]) {
    (async () => {
      // Guard: if Supabase is configured, ensure we have an authenticated user
      if (isSupabaseConfigured()) {
        try {
          const { data: userData } = await supabase!.auth.getUser();
          if (!userData?.user) {
            try {
              const { toast } = require("@/hooks/use-toast");
              toast({ title: "Not signed in", description: "Please sign in to upload documents" });
            } catch (_) {}
            return;
          }
        } catch (e) {
          try {
            const { toast } = require("@/hooks/use-toast");
            toast({ title: "Not signed in", description: "Please sign in to upload documents" });
          } catch (_) {}
          return;
        }
      }

      const prev = qc.getQueryData<DocumentRecord[]>(queryKeys.documents());
      const created = inputs.map((input, i) => ({
        id: `doc-temp-${Date.now()}-${i}`,
        clientId: input.clientId || selectedClientId,
        name: input.name,
        type: input.type,
        period: input.period,
        status: "processing",
        source: input.source,
        updatedAt: stampNow(),
      } as DocumentRecord));

      qc.setQueryData(queryKeys.documents(), (old) => [...created, ...(old || [])]);

      // create activities for each document
      const prevActivities = qc.getQueryData<ActivityRecord[]>(queryKeys.activities());
      const docActivities = created.map((d) => ({
        id: `activity-${d.id}`,
        clientId: d.clientId,
        title: "Document uploaded",
        detail: `${d.name} was added to the vault and is processing.`,
        actor: "system",
        time: "Just now",
        kind: "document",
      } as ActivityRecord));
      qc.setQueryData(queryKeys.activities(), (old) => [...docActivities, ...(old || [])]);

      // Persist each doc; if any error, rollback entire batch
      Promise.all(
        inputs.map((input) => {
          const payload: Omit<DocumentRecord, "id" | "updatedAt"> = {
            clientId: input.clientId || selectedClientId,
            name: input.name,
            type: input.type,
            period: input.period,
            status: "processing",
            source: input.source,
          };
          return documentsService.createDocument(payload);
        }),
      )
        .then((rows) => {
          // replace temp docs with server rows
          qc.setQueryData(queryKeys.documents(), (old) => {
            if (!old) return rows;
            return old.map((d) => {
              const found = rows.find((r) => r.name === d.name && (r.clientId || "") === (d.clientId || ""));
              return found ? found : d;
            });
          });
        })
        .catch((err: any) => {
          qc.setQueryData(queryKeys.documents(), prev);
          qc.setQueryData(queryKeys.activities(), prevActivities);
          qc.invalidateQueries(queryKeys.documents());
          try {
            const { toast } = require("@/hooks/use-toast");
            const message = err?.message || "Failed to upload documents";
            toast({ title: "Upload failed", description: message });
          } catch (_) {}
        });
    })();
  }

  function removeDocument(documentId: string) {
    const prev = qc.getQueryData<DocumentRecord[]>(queryKeys.documents());
    qc.setQueryData(queryKeys.documents(), (old) => old?.filter((d) => d.id !== documentId));
    documentsService
      .deleteDocument(documentId)
      .catch((err: any) => {
        qc.setQueryData(queryKeys.documents(), prev);
        try {
          const { toast } = require("@/hooks/use-toast");
          const message = err?.message || "Failed to delete document";
          toast({ title: "Delete failed", description: message });
        } catch (_) {}
      });
  }

  function saveCalculation(input: SaveCalculationInput) {
    const temp: CalculationRecord = {
      id: `calc-temp-${Date.now()}`,
      clientId: input.clientId,
      title: input.title,
      subtitle: input.subtitle,
      savedAt: "Just now",
      owner: input.owner || "system",
    };

    const prev = qc.getQueryData<CalculationRecord[]>(queryKeys.calculations());
    qc.setQueryData(queryKeys.calculations(), (old) => [temp, ...(old || [])]);

    calculationsService
      .createCalculation(temp)
      .then((row) => qc.setQueryData(["calculations"], (old) => (old || []).map((c) => (c.id === temp.id ? row : c))))
      .catch((err: any) => {
        qc.setQueryData(["calculations"], prev);
        try {
          const { toast } = require("@/hooks/use-toast");
          const message = err?.message || "Failed to save calculation";
          toast({ title: "Save failed", description: message });
        } catch (_) {}
      });
  }

  function addReport(report: Omit<ReportRecord, "id" | "updatedAt">) {
    const temp: ReportRecord = { id: `report-temp-${Date.now()}`, ...report, updatedAt: "Just now" } as ReportRecord;
    const prev = qc.getQueryData<ReportRecord[]>(queryKeys.reports());
    qc.setQueryData(queryKeys.reports(), (old) => [temp, ...(old || [])]);

    reportsService
      .createReport(report)
      .then((row) => qc.setQueryData(queryKeys.reports(), (old) => (old || []).map((r) => (r.id === temp.id ? row : r))))
      .catch((err: any) => {
        qc.setQueryData(queryKeys.reports(), prev);
        try {
          const { toast } = require("@/hooks/use-toast");
          const message = err?.message || "Failed to save report";
          toast({ title: "Save failed", description: message });
        } catch (_) {}
      });
  }

  const value: WorkspaceContextValue = {
    clients,
    filings,
    documents,
    activities,
    reports,
    calculations,
    selectedClientId,
    setSelectedClientId,
    addClient,
    markFilingStatus,
    addUploadedDocuments,
    removeDocument,
    saveCalculation,
    addReport,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
