# CalcOS — Project Audit & Build Plan

Generated: 2026-06-18

---

## PROJECT AUDIT

### 1. Routes & Pages

| Route | Page Component | Status |
|-------|---------------|--------|
| `/` | Redirect → `/dashboard` | N/A |
| `/login` | `Login.tsx` | **REAL** — Supabase auth (email+password), works when Supabase configured |
| `/signup` | `Signup.tsx` | **REAL** — Supabase auth signup |
| `/dashboard` | `Dashboard.tsx` | **REAL** — Pulls live data from Supabase hooks (clients, filings, documents, activities). Shows stat cards, urgent queue, client watchlist, team capacity, recent activity. All numbers are dynamic. |
| `/clients` | `Clients.tsx` | **REAL** — Full CRUD (create/read/update/delete) via Supabase. Master-detail layout. Shows linked filings, documents, reports, calculations, and activities per client. |
| `/clients/:id` | `ClientDetails.tsx` | **REAL** — Detailed client view with file upload (Supabase Storage), filing status changes, document management, notes editing, activity feed. |
| `/compliance` | `Compliance.tsx` | **REAL** — Reads filings from Supabase. List view with overdue/this-week/this-month/later grouping. Calendar view with dot indicators. "Mark Filed" button updates Supabase + creates activity. "Assign" button is **UI-only (no-op)**. "Add Filing" button is **UI-only (no-op)**. |
| `/documents` | `Documents.tsx` | **REAL** — Reads documents from Supabase. Upload via file picker or drag-drop creates document records. Delete works. Review queue shows items needing attention. |
| `/documents/:id` | `DocumentDetails.tsx` | **PLACEHOLDER** — file exists but likely thin (not fully read, exists in file tree) |
| `/workflows` | `Workflows.tsx` | **MOCK** — Has full UI (list + board views, filters, status columns) but `fetchWorkflows()` is hardcoded to return `[]`. Does NOT use the existing `useWorkflows` hook or Supabase service. The "New Task" button is a no-op. |
| `/calculators/:category` | `Calculators.tsx` | **REAL** — 100+ calculators cataloged across 10 categories with search and country filtering. |
| `/calculator/:slug` | `CalculatorDetail.tsx` | **REAL** — 100 fully implemented calculator components with real formulas. Save-to-client-workspace functionality works via Supabase. |
| `/ai` | `CalcAI.tsx` | **REAL** (when configured) — Chat interface calling Gemini 2.5 Flash API. Renders structured markdown responses. Falls back to config instructions when API key is missing. |
| `/history` | `Placeholder.tsx` | **PLACEHOLDER** — "Coming soon" screen |
| `/reports` | `Placeholder.tsx` | **PLACEHOLDER** — "Coming soon" screen |
| `/settings` | `Settings.tsx` | **MOCK** — 5 tabs (Profile, Preferences, Appearance, Notifications, Account). All settings save to **localStorage only** — nothing persists to Supabase. Theme/font-size changes apply visually. Account actions (export, clear, delete) are no-ops. Plan upgrade buttons are no-ops. |

### 2. Data & State

**Database**: Supabase (PostgreSQL) — the project is fully wired for it.

- `src/services/supabaseClient.ts` creates a client from `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` env vars.
- If env vars are missing, `supabase = null` and all service functions return empty arrays (graceful fallback).
- Auth: Supabase Auth via `AuthContext.tsx`. `ProtectedRoute.tsx` redirects unauthenticated users to `/login`. When Supabase is not configured, `user` stays null and loading completes — meaning the app immediately redirects to login with no way to proceed.

**Tables (expected in Supabase)**:
- `clients` — core entity, all workspace data anchored here
- `filings` — compliance items linked to `client_id`
- `documents` — document metadata + storage paths, linked to `client_id`
- `activities` — timeline events, linked to `client_id`
- `calculations` — saved calculator outputs, linked to `client_id`
- `reports` — report records, linked to `client_id`
- `workflows` — task/workflow records (DB types exist, service exists, but Workflows page doesn't use them)

**State management**:
- `@tanstack/react-query` for server state (all hooks in `src/hooks/`)
- `WorkspaceContext` provides a convenience layer with optimistic mutations
- `CountryContext` holds selected country (defaults to India)
- `AuthContext` holds user/session from Supabase Auth
- `localStorage` used only for Settings preferences (theme, font-size, notifications)

**Data flow**: Pages → hooks (useClients, useFilings, etc.) → services (clients.ts, filings.ts, etc.) → Supabase client → PostgreSQL. Optimistic updates via react-query's `onMutate`.

**Seed data**: `src/data/workspace.ts` exports **empty arrays** for all entities. `teamMembers` is also empty. `strategicPriorities` has 3 hardcoded product vision items displayed on the dashboard hero section.

### 3. What is actually working

1. **Authentication** — Full signup/login/logout flow via Supabase Auth
2. **Client CRUD** — Create, read, update, delete client workspaces. Each client has: name, entity type, service line, owner, PAN, GSTIN, email, phone, notes, health status
3. **Client detail view** — Deep dive into a single client showing their filings, documents, calculations, activity feed
4. **Filing management** — View filings grouped by urgency (overdue, this week, this month, later). Mark filings as "filed" which persists to Supabase and creates an activity record. Calendar view with colored dots.
5. **Document management** — Upload files (drag-drop or picker), metadata saved to Supabase, file stored in Supabase Storage (`client-documents` bucket). Download and delete work.
6. **100 calculators** — Fully functional with real tax/finance formulas. Income tax, GST, EMI, salary, depreciation, ratios, valuation, investment, payroll, audit, real estate tools.
7. **Save calculator output to client** — Calculator results can be saved to a specific client workspace
8. **CalcAI chat** — Works when `VITE_GEMINI_API_KEY` is set. Finance-focused system prompt. Markdown rendering.
9. **Global search** — Cmd+K search modal across all 100+ calculators with keyboard navigation
10. **Settings** — Theme (dark/light via CSS inversion), font size, notification preferences (localStorage only)
11. **Activity timeline** — Every client create, filing status change, and document upload creates a traceable activity record
12. **Responsive sidebar** — Collapsible, with calculator categories and badge counts

### 4. What is mock / hardcoded

1. **`strategicPriorities`** in `workspace.ts` — 3 hardcoded product vision cards shown on dashboard hero
2. **`teamMembers`** in `workspace.ts` — Empty array, so "Team Capacity" section on dashboard shows nothing. When populated, the data is hardcoded (not from DB).
3. **Dashboard greeting** — Hardcoded "Amogh" name, not pulled from auth user or settings
4. **Sidebar user section** — Hardcoded "Amogh" / "amogh@calcos.com" / "Free" plan badge
5. **Workflows page** — Full UI (list + board + filters) but `fetchWorkflows()` returns `[]`. Ignores existing `useWorkflows` hook and Supabase service. "New Task" button does nothing.
6. **Compliance "Add Filing" button** — No-op, doesn't open a form
7. **Compliance "Assign" button** — No-op, doesn't do anything
8. **Settings** — All preferences save to localStorage only, not synced to user profile in Supabase
9. **"Advisory momentum" stat card** on dashboard — Always shows "—"
10. **"Annualised billing" stat** on clients page — Always shows "—"
11. **"Upgrade to Pro" buttons** — No payment integration, purely cosmetic
12. **Notification preferences** — Toggle states save locally but no notification system exists
13. **Account actions** (export data, clear history, delete account) — All no-ops
14. **History page** — Placeholder "coming soon"
15. **Reports page** — Placeholder "coming soon" (despite `Reports.tsx` existing in the file tree, the route uses `Placeholder`)
16. **Service line options** — Hardcoded list in client form, not configurable
17. **Document "Smart import targets"** — Static chip labels, no actual smart import logic
18. **Storage capacity bar** — Fake calculation (`seededDocuments.length * 1.8 + 12.4 MB`)

### 5. What is missing vs the product vision

**Product vision**: A CA firm opens the app every morning and immediately knows which clients need attention, which deadlines are approaching, which documents are missing, which tasks are pending, and which team members are responsible. Everything connected to real clients.

**Critical gaps**:

1. **No way to create filings** — Compliance page can display and mark filings, but there's no UI to create new ones. A CA firm needs to add GST returns, ITR filings, TDS deadlines, ROC filings etc. with due dates and assign them to team members and clients.

2. **Workflows page is dead** — The task management system has full UI and a full Supabase backend (`useWorkflows` hook, `workflows.ts` service) but the page doesn't use any of it. Tasks cannot be created, assigned, or tracked. This is the operational core of a CA firm.

3. **No team management** — `teamMembers` is hardcoded empty. No way to add team members, assign work, see capacity. A multi-person CA firm needs role-based access and workload visibility.

4. **No deadline intelligence** — No automated reminders, no "3 days before due" alerts, no overdue escalation. The compliance calendar shows dots but doesn't push urgency.

5. **No reporting engine** — Reports page is a placeholder. No way to generate client-facing deliverables (computation sheets, tax summaries, compliance status reports).

6. **CalcAI is not workspace-aware** — It's a generic chat. Doesn't know which client is selected, what documents exist, what filings are pending. Can't draft client-specific notes.

7. **No inter-entity linking** — Creating a filing doesn't auto-create document requirements. Uploading a document doesn't auto-resolve a filing blocker. Calculator output doesn't feed into reports. Everything is siloed.

8. **No audit trail for document verification** — Documents go from "processing" to "verified" but there's no review workflow (who verified it, when, what was checked).

9. **Settings don't persist to backend** — Profile name, firm, role, preferences are all localStorage. Logging in from another device loses everything.

10. **Dashboard is passive** — Shows data but doesn't drive action. No "click here to resolve this blocker" flows. No daily task list.

### 6. What should be removed or deprioritized

1. **"Strategic priorities" cards on dashboard** — These are internal product vision notes, not operational data. Remove them from the user-facing dashboard.

2. **"Upgrade to Pro" / pricing UI** — No payment system exists. The free/pro tier gating is cosmetic. Deprioritize until core features work. Keep calculator access open during MVP.

3. **Country selector in sidebar** — Multi-country support adds complexity. India is the primary market. The selector can stay but shouldn't drive development priorities.

4. **7 country flags on calculators** — UK, US, UAE, Singapore, Germany, Australia calculators exist but the core product serves Indian CA firms. Deprioritize international calc accuracy.

5. **"Design direction" / "Product direction" text blocks** — CalcAI sidebar and Documents page have internal product notes visible to end users. Remove these.

6. **Light mode (CSS inversion hack)** — It's a visual hack (`filter: invert(1) hue-rotate(180deg)`). Either build it properly or remove the option.

7. **History page** — Activity data already shows in dashboard and client detail. A dedicated timeline page is nice-to-have, not essential.

8. **Document AI extraction fields** — `extractedText`, `extractedData`, `aiSummary`, `aiTags`, `confidenceScore` exist in types but nothing populates them. Don't build UI for them until the extraction pipeline exists.

### 7. Priority build list — Next 5 things to build

#### #1: Wire up Workflows page to Supabase + add "Create Task" form

**What**: Connect the existing Workflows page to the existing `useWorkflows` hook and Supabase `workflows` service. Add a "Create Task" drawer that lets users create tasks with: title, client (dropdown from existing clients), type (filing, document-collection, review, advisory), assignee, due date, priority, status.

**Why it matters for a CA firm**: Task management is the daily operating rhythm. Every morning, an article clerk, a CA, or a partner needs to see: "What do I need to do today? Which client's GST return is due? Who needs to collect the bank statement?" Without working tasks, the app is a calculator catalog, not a firm OS.

**Files to modify**:
- `src/pages/app/Workflows.tsx` — Replace local `fetchWorkflows()` with `useWorkflows()` hook. Wire "New Task" button to open a creation drawer. Wire status changes to `useUpdateWorkflow()`.
- `src/hooks/useWorkflows.ts` — Already exists and works, no changes needed.
- `src/services/workflows.ts` — Already exists and works, no changes needed.

**Files to create**: None — all infrastructure exists.

#### #2: Add "Create Filing" form to Compliance page

**What**: The "Add Filing" button on the compliance page currently does nothing. Build a drawer/modal with: title, client (dropdown), due date, owner/assignee, entity name, filing type (GST, ITR, TDS, ROC, etc.), and optional blocker note.

**Why it matters for a CA firm**: Filings ARE the work. GSTR-1 is due on the 11th, GSTR-3B on the 20th, TDS on the 7th, advance tax quarterly. A CA firm tracks hundreds of these across dozens of clients. Without the ability to create filings, the compliance tracker is empty.

**Files to modify**:
- `src/pages/app/Compliance.tsx` — Wire the "Add Filing" button to open a form. Wire the "Assign" button to a reassignment flow.
- `src/services/filings.ts` — Add `createFiling()` function.
- `src/hooks/useFilings.ts` — Add `useCreateFiling()` mutation hook.

**Files to create**: None — form can be inline in Compliance.tsx.

#### #3: Replace hardcoded user info with auth-derived data

**What**: Dashboard says "Good morning, Amogh". Sidebar shows "Amogh / amogh@calcos.com". These are hardcoded strings. Replace with the actual authenticated user's name/email from `useAuth()` + Settings profile data.

**Why it matters for a CA firm**: When a partner and an article clerk both log in, they should see their own name. It's table-stakes for a multi-user tool. Also fixes the sidebar user avatar section.

**Files to modify**:
- `src/pages/app/Dashboard.tsx` — Replace hardcoded "Amogh" with user name from auth/settings
- `src/components/app/Sidebar.tsx` — Replace hardcoded user section with auth-derived data
- `src/pages/app/Settings.tsx` — Persist profile to Supabase `profiles` table instead of localStorage

**Files to create**:
- `src/services/profiles.ts` — Service for reading/writing user profile
- Supabase migration for `profiles` table

#### #4: Connect Reports page to real data

**What**: Route `/reports` currently renders `Placeholder`. A `Reports.tsx` page file exists but is unused. The `reports` table, service, and hook all exist. Wire them together with: a list of reports, a "Create Report" button that links a report to a client with type (tax computation, GST summary, compliance status), period, and status.

**Why it matters for a CA firm**: Reports are the deliverables that get sent to clients and filed with authorities. A tax computation sheet, a GST reconciliation summary, a compliance status report. Without reporting, the workspace captures data but can't produce output.

**Files to modify**:
- `src/App.tsx` — Change `/reports` route from `Placeholder` to `Reports` component
- `src/pages/app/Reports.tsx` — Build out with list + create form using `useReports()` hook

#### #5: Remove internal product notes from user-facing UI

**What**: Clean up dashboard `strategicPriorities` cards, CalcAI "Product direction" sidebar, Documents "Design direction" section, and other internal development notes that are visible to end users.

**Why it matters for a CA firm**: A CA opening the app should see client data, not "Move the product from tool-first to client-first". These notes break the illusion that this is a production tool and erode trust.

**Files to modify**:
- `src/pages/app/Dashboard.tsx` — Remove `strategicPriorities` import and rendering
- `src/data/workspace.ts` — Remove `strategicPriorities` export
- `src/pages/app/CalcAI.tsx` — Remove "Product direction" sidebar section
- `src/pages/app/Documents.tsx` — Remove "Design direction" section

---

## IMPLEMENTATION PLAN: Priority #1 — Wire Workflows to Supabase

### Overview

The Workflows page (`src/pages/app/Workflows.tsx`) has a complete UI — list view, board (kanban) view, status filters, assignee filters, search, stat cards. But it uses a local `fetchWorkflows()` that returns `[]` and never touches the database. Meanwhile, a complete Supabase integration already exists:

- `src/services/workflows.ts` — `fetchWorkflows()`, `createWorkflow()`, `updateWorkflow()`, `deleteWorkflow()`
- `src/hooks/useWorkflows.ts` — `useWorkflows()`, `useCreateWorkflow()`, `useUpdateWorkflow()`, `useDeleteWorkflow()`
- `src/types/database.ts` — `DBWorkflow`, `DBWorkflowInsert` types

The task is to connect the existing UI to the existing backend.

### Files to modify

#### 1. `src/pages/app/Workflows.tsx`

**Changes**:

a) **Replace local state + fetch with react-query hook**:
- Remove the local `useState<Task[] | null>(null)` and `useEffect` that calls `fetchWorkflows()`
- Import and use `useWorkflows()`, `useCreateWorkflow()`, `useUpdateWorkflow()`, `useDeleteWorkflow()` from `@/hooks/useWorkflows`
- Import `useClients()` from `@/hooks/useClients` (for client dropdown in create form)
- Map the hook's loading/error/data states to the existing UI patterns

b) **Add "Create Task" drawer**:
- Add a `showCreateDrawer` state
- Wire the "New Task" button's `onClick` to `setShowCreateDrawer(true)`
- Build a slide-out drawer (same pattern as Clients.tsx) with fields:
  - `title` (text input, required)
  - `client` (select dropdown populated from `useClients()`)
  - `type` (select: "Filing", "Document Collection", "Review", "Advisory", "Other")
  - `assignee` (text input — later can be a team member dropdown)
  - `dueDate` (date input)
  - `priority` (select: "high", "medium", "low")
  - `status` (default: "pending")
- On submit: call `createWorkflow.mutate()` with the form data
- On success: close drawer, show toast, workflow appears in list via react-query invalidation

c) **Wire status changes**:
- In board view: add drag-drop or click-to-change-status on task cards
- Minimum viable: a dropdown or button row on each card to change status → calls `useUpdateWorkflow()`

d) **Wire delete**:
- Add a delete button (on hover) for each task → calls `useDeleteWorkflow()`

**Data type mapping** (existing `Task` type in the page → existing `Workflow` type from service):

```
Task.id          → Workflow.id
Task.title       → Workflow.title
Task.client      → Workflow.client
Task.type        → Workflow.type
Task.assignee    → Workflow.assignee
Task.dueDate     → Workflow.dueDate
Task.status      → Workflow.status
Task.priority    → Workflow.priority
Task.subtasks    → Workflow.subtasks
Task.completedSubtasks → Workflow.completedSubtasks
```

These map 1:1. The page's `Task` type can be replaced with the imported `Workflow` type, or kept as a local alias.

### Component breakdown

```
Workflows.tsx
├── Header (title + "New Task" button)
├── Stats bar (total, in-progress, blocked, done — from useWorkflows data)
├── Filters bar (search, status, assignee, view toggle)
├── ListView or BoardView (existing, just swap data source)
│   └── TaskCard (existing, add status-change + delete actions)
└── CreateTaskDrawer (new)
    ├── Form fields (title, client, type, assignee, dueDate, priority)
    └── Submit button → useCreateWorkflow().mutate()
```

### Supabase table required

A `workflows` table must exist in Supabase with columns matching `DBWorkflow`:

```sql
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  type TEXT,
  assignee TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in-progress', 'done', 'blocked')),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  subtasks INTEGER DEFAULT 0,
  completed_subtasks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policy (same pattern as clients table)
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
```

### Estimated scope

- Lines of code to change in `Workflows.tsx`: ~80 (replace data source, add drawer)
- Lines of code to add (CreateTaskDrawer): ~120
- Services/hooks: 0 changes (already complete)
- DB migration: 1 table creation
- Risk: Low — all integration points already exist

### Definition of done

1. Opening `/workflows` fetches tasks from Supabase (shows loading state, then data or empty state)
2. Clicking "New Task" opens a drawer with form fields
3. Submitting the form creates a workflow in Supabase and it appears in the list
4. Changing a task's status persists to Supabase
5. Deleting a task removes it from Supabase
6. Board view and list view both show live data
7. Filters (search, status, assignee) work on live data
8. Creating a workflow linked to a client shows the client name in the task card
