import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, Edit2, Trash2, Calendar, UploadCloud, File, CheckCircle, Clock, User, Download } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/services/supabaseClient";
import { useDeleteDocument } from "@/hooks/useDocuments";
import { useClients, useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { useDocumentsByClient, useCreateDocument } from "@/hooks/useDocuments";
import { useFilingsByClient, useUpdateFiling, useCreateFiling } from "@/hooks/useFilings";
import { useActivities, useCreateActivity } from "@/hooks/useActivities";
import { useDocumentRequestsByClient } from "@/hooks/useDocumentRequests";
import { filingTemplates } from "@/data/filingTemplates";
import { generateFilingsForClient } from "@/services/autoFilings";
import { useCalculations } from "@/hooks/useCalculations";
import { useAuth } from "@/contexts/AuthContext";
import ClientForm from "@/components/ClientForm";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getRiskLabel } from "@/data/workspace";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientsQuery = useClients();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const documentsQuery = useDocumentsByClient(id);
  const filingsQuery = useFilingsByClient(id);
  const docRequestsQuery = useDocumentRequestsByClient(id);
  const activitiesQuery = useActivities();
  const calculationsQuery = useCalculations();

  const createDocument = useCreateDocument();
  const deleteDocument = useDeleteDocument();
  const updateFiling = useUpdateFiling();
  const createFilingMut = useCreateFiling();
  const createActivity = useCreateActivity();
  const { user } = useAuth();

  const clients = clientsQuery.data ?? [];
  const client = clients.find((c) => c.id === id);

  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (clientsQuery.status === "pending") return <div className="max-w-7xl mx-auto py-8">Loading client...</div>;
  if (!client) return <div className="max-w-7xl mx-auto py-8">Client not found.</div>;

  const selectedDocuments = documentsQuery.data ?? [];
  const selectedFilings = filingsQuery.data ?? [];
  const pendingDocRequests = (docRequestsQuery.data ?? []).filter((r) => r.status === "requested" || r.status === "reminded");
  const recentActivities = (activitiesQuery.data ?? []).filter((a) => a.clientId === client.id).slice(0, 50);
  const calculations = (calculationsQuery.data ?? []).filter((c) => c.clientId === client.id);

  function handleUpdate(values: Partial<typeof client>) {
    updateClient.mutate([client.id, values], {
      onSuccess() {
        toast({ title: "Workspace updated", description: `${client.name} updated` });
        setEditing(false);
      },
      onError() {
        toast({ title: "Update failed", description: "Could not update client" });
      },
    });
  }

  // Upload placeholder: registers metadata row and marks processing -> verified via background worker
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  function handlePickFile() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !id) return;
    files.forEach((file) => {
      createDocument.mutate({
        clientId: id,
        name: file.name,
        type: file.type || "file",
        period: "",
        status: "processing",
        source: "upload",
        file,
      }, {
        onSuccess() {
          createActivity.mutate({
            id: `act-${Date.now()}`,
            clientId: id,
            title: "Document uploaded",
            detail: `${file.name} uploaded`,
            actor: user?.id ?? client.owner,
            time: new Date().toISOString(),
            kind: "document",
          });
          toast({ title: "Upload registered", description: `${file.name} is processing` });
        },
      });
    });
    e.currentTarget.value = "";
  }

  function handleFileList(list: FileList | null) {
    const files = Array.from(list || []);
    if (!files.length || !id) return;
    files.forEach((file) => {
      createDocument.mutate({
        clientId: id,
        name: file.name,
        type: file.type || "file",
        period: "",
        status: "processing",
        source: "upload",
        file,
      }, {
        onSuccess() {
          createActivity.mutate({
            id: `act-${Date.now()}`,
            clientId: id,
            title: "Document uploaded",
            detail: `${file.name} uploaded`,
            actor: user?.id ?? client.owner,
            time: new Date().toISOString(),
            kind: "document",
          });
          toast({ title: "Upload registered", description: `${file.name} is processing` });
        },
      });
    });
  }

  function formatTime(iso?: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch (_) {
      return iso;
    }
  }

  function handleChangeFilingStatus(filingId: string, status: typeof selectedFilings[number]["status"]) {
    if (!filingId) return;
    updateFiling.mutate([filingId, { status }], {
      onSuccess(updated) {
        createActivity.mutate({
          id: `act-${Date.now()}`,
          clientId: client.id,
          title: `Filing ${updated.title} status updated`,
          detail: `Status set to ${status}`,
          actor: user?.id ?? client.owner,
          time: new Date().toISOString(),
          kind: "filing",
        });
      },
      onError(err) {
        toast({ title: "Update failed", description: (err as any)?.message || "Could not update filing" });
      },
    });
  }

  function handleDelete() {
    deleteClient.mutate(client.id, {
      onSuccess() {
        toast({ title: "Workspace deleted", description: `${client.name} removed` });
        navigate("/clients");
      },
      onError() {
        toast({ title: "Delete failed", description: "Could not delete client" });
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="card-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-secondary">
              Workspace
              <ChevronRight className="h-3 w-3" />
              {client.serviceLine}
            </div>
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mt-2">{client.name}</h2>
            <p className="mt-1 text-sm text-secondary">{client.entityType} · {client.country} · Owner {client.owner}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(true)} className="h-9 px-3 rounded-md bg-white/5 text-sm text-[var(--text-primary)]"> <Edit2 className="inline-block mr-2" /> Edit</button>
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <button className="h-9 px-3 rounded-md bg-destructive/10 text-sm text-destructive"><Trash2 className="inline-block mr-2" /> Delete</button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete workspace</AlertDialogTitle>
                  <AlertDialogDescription>Are you sure you want to delete {client.name}? This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Link to="/clients" className="text-sm text-primary ml-3">Back to workspaces</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="space-y-6">
          {/* Compliance timeline */}
          <div className="card-surface p-4" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFileList(e.dataTransfer.files); }}>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Compliance timeline</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const autoFilings = generateFilingsForClient(client, filingTemplates);
                    autoFilings.forEach((f) => createFilingMut.mutate(f));
                    if (autoFilings.length > 0) {
                      toast({
                        title: `Generated ${autoFilings.length} filings`,
                        description: `Upcoming deadlines created for ${client.name}`,
                      });
                    } else {
                      toast({
                        title: "No filings generated",
                        description: "Add PAN or GSTIN to the client profile to auto-generate compliance deadlines.",
                      });
                    }
                  }}
                  className="text-xs px-2.5 py-1 rounded-md border border-white/10 hover:border-primary/40 hover:text-primary text-secondary transition-colors flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" /> Generate upcoming filings
                </button>
                <div className="text-xs text-secondary">{selectedFilings.length} items</div>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {selectedFilings.length ? selectedFilings.map((f) => (
                <div key={f.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{f.title}</div>
                    <div className="mt-1 text-xs text-secondary">Due {f.dueDate ?? "—"} · Owner {f.owner}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={cn("text-xs px-2 py-1 rounded-md font-medium", f.status === "overdue" ? "bg-destructive text-white" : f.status === "filed" ? "bg-green-600/20 text-green-300" : "bg-white/5 text-secondary")}>{f.status}</div>
                    <button onClick={() => handleChangeFilingStatus(f.id, "filed")} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/4 text-[var(--text-primary)]"><CheckCircle className="h-4 w-4" /></button>
                    <button onClick={() => handleChangeFilingStatus(f.id, "in_review")} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/4 text-[var(--text-primary)]">!</button>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-secondary">No filings for this workspace.</div>
              )}
            </div>
          </div>

          {/* Documents panel */}
          <div className="card-surface p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Documents</div>
              <div className="flex items-center gap-2">
                <input ref={fileInputRef} onChange={handleFileChange} type="file" className="hidden" multiple />
                <button onClick={handlePickFile} className="h-9 px-3 rounded-md bg-white/5 text-sm text-[var(--text-primary)]"><UploadCloud className="inline-block mr-2" />Upload</button>
              </div>
            </div>
            <div className="mt-3 space-y-3">
              {selectedDocuments.length ? selectedDocuments.map((d) => (
                <div key={d.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><File className="h-4 w-4" />{d.name}</div>
                    <div className="mt-1 text-xs text-secondary">{d.type} · {d.period || "—"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-secondary">{d.status === "processing" ? <span className="text-yellow-300">Processing</span> : <span className="text-green-300">Verified</span>} · {formatTime(d.updatedAt)}</div>
                    <button onClick={async () => {
                      if (!isSupabaseConfigured() || !d.storagePath) {
                        toast({ title: "Download failed", description: "File not available" });
                        return;
                      }
                      try {
                        const { data, error } = await supabase!.storage.from("client-documents").download(d.storagePath);
                        if (error || !data) throw error || new Error("No data");
                        const url = URL.createObjectURL(data);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = d.fileName || d.name;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                        URL.revokeObjectURL(url);
                      } catch (err: any) {
                        toast({ title: "Download failed", description: err?.message || "Could not download file" });
                      }
                    }} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/4 text-[var(--text-primary)]" title="Download"><Download className="h-4 w-4" /></button>
                    <button onClick={() => deleteDocument.mutate(d.id, { onSuccess() { toast({ title: "Deleted" }); }, onError(err) { toast({ title: "Delete failed", description: (err as any)?.message || "Could not delete document" }); } })} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/4 text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-secondary">No documents uploaded yet.</div>
              )}
            </div>
          </div>

          {/* Pending Document Requests */}
          <div className="card-surface p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text-primary)]">Pending Documents</div>
              <div className="text-xs text-secondary">{pendingDocRequests.length} pending</div>
            </div>
            <div className="mt-3 space-y-3">
              {pendingDocRequests.length ? pendingDocRequests.map((r) => {
                const overdue = r.dueDate && new Date(r.dueDate) < new Date();
                return (
                  <div key={r.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center gap-2">
                      {overdue && <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{r.title}</div>
                    </div>
                    {r.description && <div className="mt-1 text-xs text-secondary">{r.description}</div>}
                    <div className="mt-1 text-xs text-secondary">
                      Due {r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"} ·{" "}
                      <span className={cn(
                        "font-medium",
                        r.status === "reminded" ? "text-orange-300" : "text-amber-300",
                      )}>
                        {r.status}
                      </span>
                      {overdue && <span className="ml-1 text-red-400 font-medium">Overdue</span>}
                    </div>
                  </div>
                );
              }) : (
                <div className="text-sm text-secondary">No pending document requests.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wide text-secondary">Workspace health</div>
                <div className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{getRiskLabel(client.health)}</div>
              </div>
              <div className="text-xs text-secondary">Owner: {client.owner}</div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-secondary">Notes</div>
              <textarea
                className="w-full mt-2 p-3 rounded-md bg-white/3 text-[var(--text-primary)] text-sm"
                defaultValue={client.notes}
                onBlur={(e) => {
                  const v = e.currentTarget.value;
                  if (v !== client.notes) {
                    updateClient.mutate([client.id, { notes: v }], {
                      onSuccess() {
                        toast({ title: "Notes saved" });
                      },
                      onError() {
                        toast({ title: "Save failed", description: "Could not save notes" });
                      },
                    });
                  }
                }}
                placeholder="Add workspace notes..."
              />
            </div>
          </div>

          <div className="card-surface p-4">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Activity feed</div>
            <div className="mt-3 space-y-3">
              {recentActivities.length ? recentActivities.map((a) => (
                <div key={a.id} className="rounded-md p-3 bg-white/2 border border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[var(--text-primary)]">{a.title}</div>
                    <div className="text-xs text-secondary">{formatTime(a.time)}</div>
                  </div>
                  <div className="mt-1 text-xs text-secondary">{a.detail} · Actor: {a.actor}</div>
                </div>
              )) : (
                <div className="text-sm text-secondary">No recent activity</div>
              )}
            </div>
          </div>

          <div className="card-surface p-4">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Calculations / Attachments</div>
            <div className="mt-3 space-y-3">
              {calculations.length ? calculations.map((c) => (
                <div key={c.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{c.title}</div>
                  <div className="mt-1 text-xs text-secondary">Saved: {c.savedAt || "—"} · Owner: {c.owner || "—"}</div>
                </div>
              )) : (
                <div className="text-sm text-secondary">No calculations saved for this workspace.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setEditing(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Edit client workspace</h3>
              <button onClick={() => setEditing(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">x</button>
            </div>
            <ClientForm
              initial={client}
              submitting={updateClient.status === "pending"}
              submitLabel="Save changes"
              onCancel={() => setEditing(false)}
              onSubmit={handleUpdate}
            />
          </div>
        </div>
      )}
    </div>
  );
}
