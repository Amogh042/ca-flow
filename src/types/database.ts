// Minimal DB types that represent the expected Supabase table rows.
// These mirror the app's runtime types but use snake_case for DB columns.

/**
 * Supabase DB types for the application's tables.
 *
 * These types model the PostgreSQL row shape (snake_case) returned
 * by Supabase queries. Insert/update shapes are provided where useful.
 *
 * Relationship notes:
 * - DB* types represent the database row (snake_case columns).
 * - *_Insert types represent the payload shape sent to Supabase when
 *   creating a new row (server will set `id`, `created_at`, `updated_at`).
 * - Application UI uses camelCased `ClientRecord`, `DocumentRecord`, etc.
 *   service code maps between DB* and app types.
 */

export type RiskLevel = "low" | "medium" | "high";
export type FilingStatus = "filed" | "in_review" | "in_progress" | "pending" | "overdue";

// Clients
export type DBClient = {
  id: string;
  name: string;
  entity_type: string;
  service_line: string;
  owner: string;
  created_by?: string | null;
  health: RiskLevel;
  country?: string | null;
  pan?: string | null;
  gstin?: string | null;
  annual_billing?: string | null;
  open_tasks?: number | null;
  unread_items?: number | null;
  next_deadline?: string | null;
  last_activity?: string | null;
  documents_ready_pct?: number | null;
  notes?: string | null;
  email?: string | null;
  phone?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DBClientInsert = Omit<DBClient, "id" | "created_at" | "updated_at">;

// Filings
export type DBFiling = {
  id: string;
  client_id: string;
  title: string;
  due_date?: string | null;
  owner?: string | null;
  status: FilingStatus;
  entity?: string | null;
  blocker?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DBFilingInsert = Omit<DBFiling, "id" | "created_at" | "updated_at">;

// Documents
export type DBDocument = {
  id: string;
  client_id: string;
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
  uploaded_by?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  storage_path?: string | null;
  extracted_text?: string | null;
  extracted_data?: any | null;
  ai_summary?: string | null;
  ai_tags?: string[] | null;
  document_type?: string | null;
  confidence_score?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DBDocumentInsert = Omit<DBDocument, "id" | "created_at" | "updated_at">;

// Activities / timeline
export type DBActivity = {
  id: string;
  client_id?: string | null;
  title: string;
  detail: string;
  actor: string;
  time: string;
  kind: "filing" | "document" | "calculation" | "approval" | "ai" | "client";
  created_at?: string | null;
};

export type DBActivityInsert = Omit<DBActivity, "id" | "created_at">;

// Reports
export type DBReport = {
  id: string;
  client_id: string;
  title: string;
  type: string;
  period: string;
  status: "draft" | "ready" | "sent";
  owner: string;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DBReportInsert = Omit<DBReport, "id" | "created_at" | "updated_at">;

// Calculations
export type DBCalculation = {
  id: string;
  client_id: string;
  title: string;
  subtitle?: string | null;
  saved_at?: string | null;
  owner?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DBCalculationInsert = Omit<DBCalculation, "id" | "created_at" | "updated_at">;

// Workflows (lightweight representation)
export type DBWorkflow = {
  id: string;
  title: string;
  client_id?: string | null;
  type?: string | null;
  assignee?: string | null;
  due_date?: string | null;
  status: "pending" | "in-progress" | "done" | "blocked";
  priority?: "high" | "medium" | "low";
  subtasks?: number | null;
  completed_subtasks?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DBWorkflowInsert = Omit<DBWorkflow, "id" | "created_at" | "updated_at">;

// Document Requests
export type DocumentRequestStatus = "requested" | "reminded" | "received" | "verified";

export type DBDocumentRequest = {
  id: string;
  client_id: string;
  title: string;
  description?: string | null;
  due_date?: string | null;
  status: DocumentRequestStatus;
  requested_by?: string | null;
  document_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  clients?: { name: string } | null;
};

export type DBDocumentRequestInsert = Omit<DBDocumentRequest, "id" | "created_at" | "updated_at" | "clients">;

// Generic helpers
export type DBRow = DBClient | DBFiling | DBDocument | DBActivity | DBReport | DBCalculation | DBWorkflow | DBDocumentRequest;

// Query key helpers (used by react-query hooks). These helpers centralize the
// query key shapes so callers get consistent and type-safe keys.
export const queryKeys = {
  clients: () => ["clients"] as const,
  client: (id: string) => ["clients", id] as const,
  filings: (clientId?: string) => (clientId ? ["filings", clientId] as const : ["filings"] as const),
  documents: (clientId?: string) => (clientId ? ["documents", clientId] as const : ["documents"] as const),
  document: (id: string) => ["documents", id] as const,
  reports: () => ["reports"] as const,
  calculations: () => ["calculations"] as const,
  activities: () => ["activities"] as const,
  workflows: () => ["workflows"] as const,
  documentRequests: (clientId?: string) => (clientId ? ["documentRequests", clientId] as const : ["documentRequests"] as const),
};
