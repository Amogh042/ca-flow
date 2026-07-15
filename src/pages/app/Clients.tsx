import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Lock, Plus, Users, X } from "lucide-react";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useCreateActivity } from "@/hooks/useActivities";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "@/hooks/use-toast";
import { getRiskLabel, type ClientRecord } from "@/data/workspace";
import ClientForm from "@/components/ClientForm";

const AVATAR_COLORS = [
  "#5B8C3E", "#C25014", "#8B6F47", "#6B7C5E", "#A0522D",
  "#4A7C59", "#7B6544", "#9B4F3A", "#5C7A3D", "#8C6B3A",
];

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
  const needAttention = clients.filter((c) => c.health === "high" || c.health === "medium").length;
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const displayClients = statusFilter
    ? clients.filter((c) => {
        if (statusFilter === "healthy") return c.health === "low";
        if (statusFilter === "attention") return c.health === "high";
        if (statusFilter === "watch") return c.health === "medium";
        return true;
      })
    : clients;

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
      },
      onError(err: any) {
        toast({ title: "Create failed", description: err?.message || "Failed to create client" });
      },
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: "'Instrument Serif', 'Georgia', serif", fontSize: 36, fontWeight: 400, lineHeight: 1.1, color: "var(--text-primary)" }}>
            Clients
          </h1>
          <p className="mt-1" style={{ fontSize: 13, color: "rgba(31,26,20,0.45)" }}>
            {clients.length} active{needAttention > 0 ? ` · ${needAttention} need attention` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(31,26,20,0.15)",
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
          </button>
          <button
            onClick={() => !atLimit && setShowAddDrawer(true)}
            disabled={atLimit}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: atLimit ? "rgba(31,26,20,0.15)" : "rgba(31,26,20,0.85)",
              fontSize: 13,
              fontWeight: 600,
              color: atLimit ? "rgba(31,26,20,0.4)" : "#fff",
              cursor: atLimit ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {atLimit ? <Lock className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            New client
          </button>
        </div>
      </div>

      {/* Filter chips */}
      {filterOpen && (
        <div className="flex items-center gap-2">
          {[
            { key: null, label: "All" },
            { key: "healthy", label: "Healthy" },
            { key: "watch", label: "Watch closely" },
            { key: "attention", label: "Attention needed" },
          ].map((f) => (
            <button
              key={f.key ?? "all"}
              onClick={() => setStatusFilter(f.key)}
              style={{
                padding: "5px 12px",
                borderRadius: 6,
                border: "1px solid rgba(31,26,20,0.1)",
                background: statusFilter === f.key ? "rgba(31,26,20,0.08)" : "transparent",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--text-primary)",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

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

      {/* Client Table */}
      {displayClients.length === 0 && clients.length === 0 ? (
        <div
          style={{
            background: "rgba(255, 251, 242, 0.5)",
            border: "1px solid rgba(31, 26, 20, 0.08)",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <Users className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(31,26,20,0.3)" }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>No clients yet</div>
          {!atLimit && (
            <div className="mt-4">
              <button
                onClick={() => setShowAddDrawer(true)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: "rgba(31,26,20,0.85)",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#fff",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus className="h-3.5 w-3.5" /> New client
              </button>
            </div>
          )}
        </div>
      ) : displayClients.length === 0 ? (
        <div
          style={{
            background: "rgba(255, 251, 242, 0.5)",
            border: "1px solid rgba(31, 26, 20, 0.08)",
            borderRadius: 12,
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 14, color: "rgba(31,26,20,0.5)" }}>No clients match your search</div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(255, 251, 242, 0.5)",
            border: "1px solid rgba(31, 26, 20, 0.08)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {/* Table header */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "11px 20px",
              borderBottom: "1px solid rgba(31, 26, 20, 0.06)",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(31,26,20,0.45)", textTransform: "uppercase" }}>
              Client
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(31,26,20,0.45)", textTransform: "uppercase" }}>
              Status
            </span>
          </div>

          {/* Client rows */}
          {displayClients.map((client, idx) => {
            const initials = client.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const colorIdx = client.name.charCodeAt(0) % AVATAR_COLORS.length;
            const isLast = idx === displayClients.length - 1;

            return (
              <div
                key={client.id}
                onClick={() => navigate(`/clients/${client.id}`)}
                className="flex items-center justify-between cursor-pointer transition-colors"
                style={{
                  padding: "14px 20px",
                  borderBottom: isLast ? "none" : "1px solid rgba(31, 26, 20, 0.06)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(31,26,20,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="shrink-0 grid place-items-center rounded-full"
                    style={{
                      width: 36,
                      height: 36,
                      background: AVATAR_COLORS[colorIdx],
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {initials}
                  </div>
                  <span className="truncate" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
                    {client.name}
                  </span>
                </div>
                <span
                  className="shrink-0"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: 6,
                    ...(client.health === "high"
                      ? { background: "rgba(220,38,38,0.08)", color: "#b91c1c" }
                      : client.health === "medium"
                        ? { background: "rgba(217,119,6,0.08)", color: "#b45309" }
                        : { background: "rgba(22,163,74,0.08)", color: "#15803d" }),
                  }}
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
