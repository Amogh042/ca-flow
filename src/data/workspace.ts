export type RiskLevel = "low" | "medium" | "high";
export type FilingStatus = "filed" | "in_review" | "in_progress" | "pending" | "overdue";

export type Filing = {
  id: string;
  clientId: string;
  title: string;
  dueDate: string;
  owner: string;
  status: FilingStatus;
  entity: string;
  blocker?: string;
};

export type ClientRecord = {
  id: string;
  name: string;
  entityType: string;
  serviceLine: string;
  owner: string;
  health: RiskLevel;
  country: string;
  pan: string;
  gstin?: string;
  annualBilling: string;
  openTasks: number;
  unreadItems: number;
  nextDeadline: string;
  lastActivity: string;
  documentsReadyPct: number;
  notes: string;
  email?: string;
  phone?: string;
};

export type DocumentRecord = {
  id: string;
  clientId: string;
  name: string;
  type: string;
  period: string;
  status:
    | "uploaded"
    | "processing"
    | "extracted"
    | "failed"
    | "reviewed"
    | "verified"
    | "needs_review"
    | "missing";
  source: string;
  updatedAt: string;
  // Storage metadata
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  storagePath?: string;
  uploadedBy?: string;
  createdAt?: string;
  // Extraction / AI fields
  extractedText?: string;
  extractedData?: any;
  aiSummary?: string;
  aiTags?: string[];
  documentType?: string;
  confidenceScore?: number;
};

export type ActivityRecord = {
  id: string;
  clientId?: string;
  title: string;
  detail: string;
  actor: string;
  time: string;
  kind: "filing" | "document" | "calculation" | "approval" | "ai" | "client";
};

export type CalculationRecord = {
  id: string;
  clientId: string;
  title: string;
  subtitle: string;
  savedAt: string;
  owner: string;
};

export type ReportRecord = {
  id: string;
  clientId: string;
  title: string;
  type: string;
  period: string;
  status: "draft" | "ready" | "sent";
  owner: string;
  updatedAt: string;
};

// Empty seeds: remove all hardcoded demo/finance data so the app starts in an appropriate empty state.
export const teamMembers: { name: string; role: string; utilisation: number }[] = [];
export const clients: ClientRecord[] = [];
export const filings: Filing[] = [];
export const documents: DocumentRecord[] = [];
export const activities: ActivityRecord[] = [];
export const reports: ReportRecord[] = [];
export const calculations: CalculationRecord[] = [];


export function getClientById(clientId?: string) {
  return clients.find((client) => client.id === clientId);
}

export function getClientFilings(clientId?: string) {
  return filings.filter((filing) => filing.clientId === clientId);
}

export function getClientDocuments(clientId?: string) {
  return documents.filter((document) => document.clientId === clientId);
}

export function getClientReports(clientId?: string) {
  return reports.filter((report) => report.clientId === clientId);
}

export function getClientActivities(clientId?: string) {
  return activities.filter((activity) => activity.clientId === clientId);
}

export function getClientCalculations(clientId?: string) {
  return calculations.filter((calculation) => calculation.clientId === clientId);
}

export function getRiskLabel(risk: RiskLevel) {
  if (risk === "high") return "Attention needed";
  if (risk === "medium") return "Watch closely";
  return "Healthy";
}

export function countFilingsByStatus(status: FilingStatus) {
  return filings.filter((filing) => filing.status === status).length;
}
