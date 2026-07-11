import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Plus, Search, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateFiling } from "@/hooks/useFilings";
import { useCreateActivity } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "@/hooks/use-toast";
import { getRiskLabel, type ClientRecord } from "@/data/workspace";
import ClientForm from "@/components/ClientForm";
import { filingTemplates } from "@/data/filingTemplates";
import { generateFilingsForClient } from "@/services/autoFilings";

type NewClientInput = Omit<
  ClientRecord,
  "id" | "lastActivity" | "openTasks" | "unreadItems" | "documentsReadyPct"
> & { _tmpId?: string };

export default function Clients() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ownerName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
  const clientsQuery = useClients();
  const createClient = useCreateClient();
  const createActivity = useCreateActivity();
  const planQuery = usePlan();
  const planData = planQuery.data;
  const planLoading = planQuery.isFetching && planData?.plan === "free";
  const createFilingMut = useCreateFiling();

  const [search, setSearch] = useState("");
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  if (clientsQuery.isLoading || planLoading) return <div className="max-w-7xl mx-auto py-8">Loading clients...</div>;
  if (clientsQuery.error) return <div className="max-w-7xl mx-auto py-8 text-red-400">Failed to load clients.</div>;

  const clients = clientsQuery.data ?? [];
  const userPlan = planData?.plan ?? "free";
  const clientLimit = userPlan === "free" ? 1 : userPlan === "firm" ? 10 : Infinity;
  const atLimit = clients.length >= clientLimit;
  const limitBannerText =
    userPlan === "free" ? "Free plan allows 1 client. Upgrade to add more."
    : userPlan === "firm" ? "Firm plan allows 10 clients."
    : "";
  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  function saveNewClient(values: any) {
    const payload: NewClientInput = {
      name: values.name,
      entityType: values.entityType,
      serviceLine: values.serviceLine,
      owner: values.owner || ownerName,
      health: values.health || "low",
      country: values.country || "",
      pan: values.pan || "",
      gstin: values.gstin || "",
      annualBilling: values.annualBilling || "",
      nextDeadline: values.nextDeadline || "No deadline linked yet",
      notes: values.notes || "",
      email: values.email || "",
      phone: values.phone || "",
      _tmpId: `tmp-${Date.now()}`,
    };
    createClient.mutate(payload, {
      onSuccess(data) {
        setShowAddDrawer(false);
        createActivity.mutate({
          id: `activity-${Date.now()}`,
          clientId: data.id,
          title: "Client workspace created",
          detail: `${data.name} was added as a new workspace.`,
          actor: data.owner,
          time: "Just now",
          kind: "client",
        });
        const autoFilings = generateFilingsForClient(data, filingTemplates);
        autoFilings.forEach((f) => createFilingMut.mutate(f));
        if (autoFilings.length > 0) {
          toast({ title: `Created ${autoFilings.length} compliance deadlines`, description: `Auto-generated filings for ${data.name}` });
        }
      },
      onError(err: any) {
        toast({ title: "Create failed", description: err?.message || "Failed to create client" });
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <button
          onClick={() => !atLimit && setShowAddDrawer(true)}
          disabled={atLimit}
          className={cn(
            "px-4 h-10 rounded-pill text-sm font-semibold transition-all flex items-center gap-2",
            atLimit
              ? "bg-white/10 text-secondary cursor-not-allowed"
              : "bg-gradient-orange text-white glow-orange hover:glow-orange-strong"
          )}
        >
          {atLimit ? <Lock className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          Add Client
        </button>
      </div>

      {atLimit && (
        <div className="card-surface p-4 flex items-center gap-4 border border-primary/20">
          <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center shrink-0">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--text-primary)]">Client limit reached</div>
            <div className="text-xs text-secondary mt-0.5">{limitBannerText}</div>
          </div>
          {userPlan === "free" && (
            <button onClick={() => navigate("/settings")} className="px-4 h-9 rounded-pill bg-gradient-orange text-white text-xs font-semibold glow-orange hover:glow-orange-strong transition-all shrink-0">
              Upgrade
            </button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-tertiary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name..."
          className="glass-input w-full h-10 pl-9 pr-3 text-sm"
        />
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <div className="card-surface p-12 text-center">
          <Users className="h-10 w-10 mx-auto mb-3 text-secondary" />
          <div className="text-lg font-semibold text-[var(--text-primary)]">
            {clients.length === 0 ? "No clients yet" : "No clients match your search"}
          </div>
          {clients.length === 0 && !atLimit && (
            <div className="mt-4">
              <button onClick={() => setShowAddDrawer(true)} className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" /> Add Client
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => {
            const initials = client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: "rgba(255, 251, 242, 0.55)",
                  backdropFilter: "blur(18px)",
                  WebkitBackdropFilter: "blur(18px)",
                  border: "1px solid rgba(255, 255, 255, 0.7)",
                  borderRadius: 12,
                  padding: "16px 20px",
                  boxShadow: "0 2px 8px rgba(90, 50, 10, 0.06)",
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full grid place-items-center text-xs font-bold text-white bg-gradient-orange shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {client.name}
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize shrink-0",
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
            );
          })}
        </div>
      )}

      {/* Add Client Drawer */}
      {showAddDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog">
          <div onClick={() => setShowAddDrawer(false)} className="absolute inset-0 bg-black/70" />
          <div className="relative w-full max-w-md h-full border-l border-white/10 p-6 overflow-y-auto" style={{ background: "var(--drawer-bg)" }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Add Client</h3>
              <button onClick={() => setShowAddDrawer(false)} className="h-8 w-8 grid place-items-center rounded-md hover:bg-white/5 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <ClientForm
              initial={{ name: "", entityType: "Private Limited", serviceLine: "Tax + Compliance", owner: ownerName, health: "low", country: "", pan: "", gstin: "", annualBilling: "", nextDeadline: "", notes: "", email: "", phone: "" }}
              submitting={createClient.status === "pending"}
              submitLabel="Create Client"
              onCancel={() => setShowAddDrawer(false)}
              onSubmit={saveNewClient}
            />
          </div>
        </div>
      )}
    </div>
  );
}
