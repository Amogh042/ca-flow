import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  Briefcase,
  Building2,
  ChevronRight,
  CircleAlert,
  FileText,
  FolderKanban,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRiskLabel,
  type ClientRecord,
} from "@/data/workspace";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import ClientForm from "@/components/ClientForm";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDocumentsByClient } from "@/hooks/useDocuments";
import { useFilings, useFilingsByClient, useCreateFiling } from "@/hooks/useFilings";
import { useActivities, useCreateActivity } from "@/hooks/useActivities";
import { filingTemplates } from "@/data/filingTemplates";
import { generateFilingsForClient } from "@/services/autoFilings";
import { useCalculations } from "@/hooks/useCalculations";
import { useReports } from "@/hooks/useReports";

type NewClient = ClientRecord & {
  email?: string;
  phone?: string;
};

type NewClientInput = Omit<
  ClientRecord,
  "id" | "lastActivity" | "openTasks" | "unreadItems" | "documentsReadyPct"
> & { _tmpId?: string };

const defaultNewClient: NewClient = {
  id: "draft-client",
  name: "",
  entityType: "Private Limited",
  serviceLine: "Tax + Compliance",
  owner: "",
  health: "low",
  country: "",
  pan: "",
  gstin: "",
  annualBilling: "",
  openTasks: 0,
  unreadItems: 0,
  nextDeadline: "No deadline linked yet",
  lastActivity: "No activity yet",
  documentsReadyPct: 0,
  notes: "",
  email: "",
  phone: "",
};

export default function Clients() {
  const { user } = useAuth();
  const ownerName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const clientsQuery = useClients();
  const allFilingsQuery = useFilings();
  const createClient = useCreateClient();
  const createActivity = useCreateActivity();
  const createFiling = useCreateFiling();

  if (clientsQuery.isLoading) {
    return <div className="max-w-7xl mx-auto py-8">Loading workspaces...</div>;
  }
  if (clientsQuery.error) {
    return <div className="max-w-7xl mx-auto py-8 text-red-400">Failed to load workspaces.</div>;
  }

  const workspaceClients = clientsQuery.data ?? [];
  const [showDrawer, setShowDrawer] = useState(false);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("All service lines");
  const [form, setForm] = useState<NewClient>({ ...defaultNewClient, owner: ownerName });
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const [editingClient, setEditingClient] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!selectedClientId && workspaceClients.length) setSelectedClientId(workspaceClients[0].id);
  }, [workspaceClients, selectedClientId]);

  const filteredClients = workspaceClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.owner.toLowerCase().includes(search.toLowerCase()) ||
      client.serviceLine.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      serviceFilter === "All service lines" || client.serviceLine === serviceFilter;

    return matchesSearch && matchesFilter;
  });

  const selectedClient = workspaceClients.find((client) => client.id === selectedClientId) ?? filteredClients[0];

  const documentsQuery = useDocumentsByClient(selectedClient?.id);
  const filingsQuery = useFilingsByClient(selectedClient?.id);
  const activitiesQuery = useActivities();
  const calculationsQuery = useCalculations();
  const reportsQuery = useReports();

  const selectedDocuments = documentsQuery.data ?? [];
  const selectedFilings = filingsQuery.data ?? [];
  const selectedReports = reportsQuery.data?.filter((r) => r.clientId === selectedClient?.id) ?? [];
  const selectedActivities = (activitiesQuery.data ?? []).filter((a) => a.clientId === selectedClient?.id);
  const selectedCalculations = (calculationsQuery.data ?? []).filter((c) => c.clientId === selectedClient?.id);

  const allFilings = allFilingsQuery.data ?? [];
  const pendingFilingsCount = allFilings.filter((f) => f.status !== "filed").length;

  const totals = {
    total: workspaceClients.length,
    atRisk: workspaceClients.filter((client) => client.health !== "low").length,
    pendingFilings: pendingFilingsCount,
  };

  const saveClient = () => {
    if (!form.name.trim()) return;
    const payload: NewClientInput = {
      name: form.name,
      entityType: form.entityType,
      serviceLine: form.serviceLine,
      owner: form.owner,
      health: form.health,
      country: form.country,
      pan: form.pan,
      gstin: form.gstin,
      annualBilling: form.annualBilling,
      nextDeadline: form.nextDeadline,
      notes: form.notes,
      email: form.email,
      phone: form.phone,
      _tmpId: `tmp-${Date.now()}`,
    };
    createClient.mutate(payload, {
      onSuccess(data) {
        setForm({ ...defaultNewClient, owner: ownerName });
        setShowDrawer(false);
        setSelectedClientId(data.id);
        createActivity.mutate({
          id: `activity-${Date.now()}`,
          clientId: data.id,
          title: "Client workspace created",
          detail: `${data.name} was added as a new workspace and is ready for filings, documents, and reports.`,
          actor: data.owner,
          time: "Just now",
          kind: "client",
        });

        const autoFilings = generateFilingsForClient(data, filingTemplates);
        autoFilings.forEach((f) => createFiling.mutate(f));
        if (autoFilings.length > 0) {
          toast({
            title: `Created ${autoFilings.length} compliance deadlines`,
            description: `Auto-generated filings for ${data.name}`,
          });
        }
      },
      onError(err: any) {
        const message = err?.message || "Failed to create workspace";
        toast({ title: "Create failed", description: message });
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-secondary">
            Client Workspaces
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Run finance work around clients, not isolated tools
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-secondary">
            Each workspace should become the home for compliance, calculations,
            documents, reporting, AI notes, and team ownership.
          </p>
        </div>
        <button
          onClick={() => setShowDrawer(true)}
          className="px-4 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Create workspace
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Active workspaces" value={`${totals.total}`} detail="Tax, compliance, payroll, and advisory" />
        <SummaryCard label="Attention needed" value={`${totals.atRisk}`} detail="Clients with blockers or overdue items" accent="warning" />
        <SummaryCard label="Pending filings" value={`${totals.pendingFilings}`} detail="Filings not yet completed" accent={totals.pendingFilings > 0 ? "warning" : "success"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-4">
          <div className="card-surface p-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by client, owner, or service line..."
                  className="glass-input w-full h-10 pl-9 pr-3 text-sm"
                />
              </div>
              <select
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="glass-select h-10 px-3 rounded-[10px] text-sm"
              >
                <option>All service lines</option>
                <option>Indirect Tax + CFO</option>
                <option>Tax Planning + Real Estate</option>
                <option>Payroll + Audit Support</option>
                <option>Tax + Compliance</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="card-surface p-8 text-center">
                <Users className="h-10 w-10 mx-auto mb-3 text-secondary" />
                <div className="text-lg font-semibold text-[var(--text-primary)]">No clients yet</div>
                <div className="mt-2 text-sm text-secondary">Add your first client workspace to get started.</div>
                <div className="mt-4">
                  <button onClick={() => setShowDrawer(true)} className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto">
                    <Plus className="h-4 w-4" /> Add Client
                  </button>
                </div>
              </div>
            ) : (
              filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={cn(
                    "card-surface w-full p-4 text-left",
                    selectedClient?.id === client.id && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        <div className="truncate text-base font-semibold text-[var(--text-primary)]">
                          {client.name}
                        </div>
                      </div>
                      <div className="mt-1 text-sm text-secondary">
                        {client.entityType} · {client.serviceLine}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0",
                        client.health === "high"
                          ? "bg-red-500/15 text-red-300"
                          : client.health === "medium"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-emerald-500/15 text-emerald-300",
                      )}
                    >
                      {getRiskLabel(client.health)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                    <Metric label="Owner" value={client.owner} />
                    <Metric label="Open tasks" value={`${client.openTasks}`} />
                    <Metric label="Docs ready" value={`${client.documentsReadyPct}%`} />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-secondary">
                    <span>{client.nextDeadline}</span>
                    <span>{client.lastActivity}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {selectedClient && (
          <div className="space-y-6">
            <div className="card-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-secondary">
                    Workspace
                    <ChevronRight className="h-3 w-3" />
                    {selectedClient.serviceLine}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-[var(--text-primary)]">{selectedClient.name}</h2>
                    <p className="mt-1 text-sm text-secondary">
                      {selectedClient.entityType} · {selectedClient.country} · Owner {selectedClient.owner}
                    </p>
                  </div>
                  <p className="max-w-3xl text-sm text-secondary">{selectedClient.notes}</p>
                </div>

                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 min-w-[220px]">
                  <div className="text-xs uppercase tracking-wide text-secondary">
                    Workspace health
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                    {getRiskLabel(selectedClient.health)}
                  </div>
                  <div className="mt-1 text-sm text-secondary">
                    {selectedClient.unreadItems} unread updates
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <DetailStat label="Open tasks" value={`${selectedClient.openTasks}`} icon={FolderKanban} />
                <DetailStat label="Compliance items" value={`${selectedFilings.length}`} icon={ShieldCheck} />
                <DetailStat label="Documents" value={`${selectedDocuments.length}`} icon={FileText} />
                <DetailStat label="Reports" value={`${selectedReports.length}`} icon={Briefcase} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setEditingClient(true)} className="h-9 px-3 rounded-md bg-white/5 text-sm text-[var(--text-primary)]">Edit</button>
              <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <button className="h-9 px-3 rounded-md bg-destructive/10 text-sm text-destructive">Delete</button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete workspace</AlertDialogTitle>
                    <AlertDialogDescription>Are you sure you want to delete {selectedClient.name}? This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      deleteClient.mutate(selectedClient.id, {
                        onSuccess() {
                          toast({ title: "Workspace deleted", description: `${selectedClient.name} removed` });
                          setSelectedClientId(workspaceClients[0]?.id ?? "");
                        },
                        onError() {
                          toast({ title: "Delete failed", description: "Could not delete client" });
                        }
                      });
                    }} className="bg-destructive text-white">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Link to={`/clients/${selectedClient.id}`} className="text-sm text-primary ml-3">Open details</Link>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
              <div className="space-y-6">
                <WorkspaceSection
                  title="Execution board"
                  subtitle="The filings and deadlines that currently define this client relationship."
                >
                  <div className="space-y-3">
                    {selectedFilings.map((filing) => (
                      <div
                        key={filing.id}
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-[var(--text-primary)]">{filing.title}</div>
                            <div className="mt-1 text-xs text-secondary">
                              Due {filing.dueDate} · Owner {filing.owner}
                            </div>
                            {filing.blocker && (
                              <div className="mt-2 text-sm text-amber-200">
                                Blocker: {filing.blocker}
                              </div>
                            )}
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                              filing.status === "overdue"
                                ? "bg-red-500/15 text-red-300"
                                : filing.status === "in_review"
                                  ? "bg-sky-500/15 text-sky-300"
                                  : filing.status === "in_progress"
                                    ? "bg-amber-500/15 text-amber-300"
                                    : filing.status === "filed"
                                      ? "bg-emerald-500/15 text-emerald-300"
                                      : "bg-white/10 text-[var(--text-secondary)]",
                            )}
                          >
                            {filing.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </WorkspaceSection>

                <WorkspaceSection
                  title="Document and deliverable readiness"
                  subtitle="Everything required to finish the month should be visible from here."
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    {selectedDocuments.map((document) => (
                      <div
                        key={document.id}
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
                      >
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{document.name}</div>
                        <div className="mt-1 text-xs text-secondary">
                          {document.type} · {document.period}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="text-secondary">{document.source}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 font-semibold",
                              document.status === "verified"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : document.status === "processing"
                                  ? "bg-sky-500/15 text-sky-300"
                                  : document.status === "needs_review"
                                    ? "bg-amber-500/15 text-amber-300"
                                    : "bg-red-500/15 text-red-300",
                            )}
                          >
                            {document.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <CircleAlert className="h-4 w-4 text-primary" />
                      Reports linked to this workspace
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedReports.map((report) => (
                        <div key={report.id} className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <div className="text-[var(--text-primary)]">{report.title}</div>
                            <div className="text-xs text-secondary">
                              {report.type} · {report.period}
                            </div>
                          </div>
                          <div className="text-xs text-secondary">
                            {report.status} · {report.owner}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Activity className="h-4 w-4 text-primary" />
                      Saved calculations
                    </div>
                    <div className="mt-3 space-y-2">
                      {selectedCalculations.length ? selectedCalculations.map((calculation) => (
                        <div key={calculation.id} className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <div className="text-[var(--text-primary)]">{calculation.title}</div>
                            <div className="text-xs text-secondary">{calculation.subtitle}</div>
                          </div>
                          <div className="text-xs text-secondary">{calculation.savedAt}</div>
                        </div>
                      )) : (
                        <div className="text-sm text-secondary">
                          No calculations linked yet. Save outputs from any calculator into this workspace.
                        </div>
                      )}
                    </div>
                  </div>
                </WorkspaceSection>
              </div>

              <div className="space-y-6">
                <WorkspaceSection
                  title="Client profile"
                  subtitle="The metadata that other modules should inherit automatically."
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ProfileTile label="PAN" value={selectedClient.pan} />
                    <ProfileTile label="GSTIN" value={selectedClient.gstin || "Not linked"} />
                    <ProfileTile label="Billing" value={selectedClient.annualBilling} />
                    <ProfileTile label="Next deadline" value={selectedClient.nextDeadline} />
                    <ProfileTile label="Email" value={selectedClient.email || "client@workspace.local"} icon={Mail} />
                    <ProfileTile label="Phone" value={selectedClient.phone || "+91 98XXX XXXXX"} icon={Phone} />
                  </div>
                </WorkspaceSection>

                <WorkspaceSection
                  title="Timeline"
                  subtitle="Why history needs to be first-class in a finance product."
                >
                  <div className="space-y-4">
                    {(selectedActivities.length ? selectedActivities : (activitiesQuery.data ?? []).slice(0, 3)).map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="mt-1 h-8 w-8 rounded-xl bg-white/[0.06] grid place-items-center">
                          <Activity className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[var(--text-primary)]">{activity.title}</div>
                          <div className="mt-1 text-sm text-secondary">{activity.detail}</div>
                          <div className="mt-1 text-xs text-tertiary">
                            {activity.actor} · {activity.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </WorkspaceSection>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingClient && selectedClient && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setEditingClient(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit client workspace</h3>
              <button onClick={() => setEditingClient(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">x</button>
            </div>
            <ClientForm
              initial={selectedClient}
              submitting={updateClient.status === "pending"}
              submitLabel="Save changes"
              onCancel={() => setEditingClient(false)}
              onSubmit={(values) => updateClient.mutate([selectedClient.id, values], {
                onSuccess() {
                  toast({ title: "Workspace updated", description: `${selectedClient.name} updated` });
                  setEditingClient(false);
                },
                onError() {
                  toast({ title: "Update failed", description: "Could not update client" });
                }
              })}
            />
          </div>
        </div>
      )}

      {showDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div
            onClick={() => setShowDrawer(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div
            className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto"
            style={{ background: "var(--drawer-bg)" }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create client workspace</h3>
              <button
                onClick={() => setShowDrawer(false)}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary"
              >
                x
              </button>
            </div>

            <div className="space-y-4">
              <FormField label="Client or entity name">
                <input
                  value={form.name}
                  onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                  className="glass-input w-full h-10 px-3 text-sm"
                  placeholder="Client or entity name"
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Entity type">
                  <select
                    value={form.entityType}
                    onChange={(event) => setForm((previous) => ({ ...previous, entityType: event.target.value }))}
                    className="glass-select w-full h-10 px-3 rounded-[10px] text-sm"
                  >
                    <option>Private Limited</option>
                    <option>LLP</option>
                    <option>Partnership</option>
                    <option>Individual</option>
                  </select>
                </FormField>

                <FormField label="Service line">
                  <select
                    value={form.serviceLine}
                    onChange={(event) => setForm((previous) => ({ ...previous, serviceLine: event.target.value }))}
                    className="glass-select w-full h-10 px-3 rounded-[10px] text-sm"
                  >
                    <option>Tax + Compliance</option>
                    <option>Indirect Tax + CFO</option>
                    <option>Tax Planning + Real Estate</option>
                    <option>Payroll + Audit Support</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="PAN">
                  <input
                    value={form.pan}
                    onChange={(event) => setForm((previous) => ({ ...previous, pan: event.target.value.toUpperCase() }))}
                    className="glass-input w-full h-10 px-3 text-sm"
                    placeholder="ABCDE1234F"
                  />
                </FormField>
                <FormField label="GSTIN">
                  <input
                    value={form.gstin}
                    onChange={(event) => setForm((previous) => ({ ...previous, gstin: event.target.value.toUpperCase() }))}
                    className="glass-input w-full h-10 px-3 text-sm"
                    placeholder="27ABCDE1234F1Z5"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Email">
                  <input
                    value={form.email}
                    onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
                    className="glass-input w-full h-10 px-3 text-sm"
                    placeholder="finance@client.com"
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    value={form.phone}
                    onChange={(event) => setForm((previous) => ({ ...previous, phone: event.target.value }))}
                    className="glass-input w-full h-10 px-3 text-sm"
                    placeholder="+91 98765 43210"
                  />
                </FormField>
              </div>

              <FormField label="Workspace notes">
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((previous) => ({ ...previous, notes: event.target.value }))}
                  className="glass-input w-full min-h-[96px] px-3 py-3 text-sm"
                  placeholder="What work should this workspace own?"
                />
              </FormField>

              <button
                onClick={saveClient}
                disabled={!form.name.trim()}
                className="w-full h-11 mt-2 rounded-lg bg-gradient-orange text-white font-semibold glow-orange disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Create workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent?: "warning" | "success";
}) {
  return (
    <div className="card-surface p-5">
      <div className="text-xs uppercase tracking-wide text-secondary">{label}</div>
      <div
        className={cn(
          "mt-2 text-3xl font-bold",
          accent === "warning"
            ? "text-amber-300"
            : accent === "success"
              ? "text-emerald-300"
              : "text-[var(--text-primary)]",
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-sm text-secondary">{detail}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-tertiary">{label}</div>
      <div className="mt-1 text-sm font-medium text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function DetailStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-secondary">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function WorkspaceSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-surface p-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="mt-1 text-sm text-secondary">{subtitle}</p>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ProfileTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-secondary">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <div className="mt-2 text-sm font-medium text-[var(--text-primary)]">{value}</div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-secondary">{label}</label>
      {children}
    </div>
  );
}
