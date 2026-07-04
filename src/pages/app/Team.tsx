import { useState } from "react";
import { Users, X, Plus, Crown, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useEnsureTeam, useTeamMembers, useAddTeamMember, useRemoveTeamMember } from "@/hooks/useTeam";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const MAX_MEMBERS = 10;

function formatDate(dateStr?: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// TEMP DEBUG: JSON.stringify on a native Error yields "{}" since
// message/stack aren't enumerable — pull them out explicitly.
function describeError(err: unknown) {
  if (err instanceof Error) {
    return JSON.stringify({ name: err.name, message: err.message, stack: err.stack, ...err }, null, 2);
  }
  return JSON.stringify(err, null, 2);
}

export default function Team() {
  const { user } = useAuth();
  const { data: planData } = usePlan();
  const isFirm = planData?.plan === "firm";
  const isTeamMember = planData?.viaTeam === true;
  const teamQuery = useEnsureTeam(isFirm && !isTeamMember);
  const team = teamQuery.data;
  const membersQuery = useTeamMembers(team?.id);
  const members = membersQuery.data ?? [];
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  if (!isFirm) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <Users className="h-12 w-12 mx-auto text-secondary" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Team management is available with the Firm plan</h2>
        <p className="text-sm text-secondary">
          Upgrade at{" "}
          <a href="https://ca-flow.in/pricing" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
            ca-flow.in/pricing
          </a>
        </p>
      </div>
    );
  }

  if (isTeamMember) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <Users className="h-12 w-12 mx-auto text-primary" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">You're a team member</h2>
        <p className="text-sm text-secondary">
          You have Firm-level access through your team owner's plan. Only the team owner can manage members.
        </p>
      </div>
    );
  }

  if (teamQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-secondary" />
      </div>
    );
  }

  if (teamQuery.isError || !team) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-400" />
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Couldn't set up your team</h2>
        {/* TEMP DEBUG: full error dump instead of a generic message */}
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, textAlign: "left" }} className="text-red-400 bg-red-500/5 rounded-lg p-4 max-w-xl mx-auto overflow-auto">
          {teamQuery.error ? describeError(teamQuery.error) : "No team record and no error — query returned nothing."}
        </pre>
        <button
          onClick={() => teamQuery.refetch()}
          className="px-4 h-10 rounded-pill bg-gradient-orange text-white text-sm font-semibold glow-orange hover:glow-orange-strong transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  const ownerEmail = user?.email ?? "";
  const allMembers = [
    { id: "__owner__", email: ownerEmail, role: "owner" as const, joinedAt: team?.createdAt ?? null, teamId: team?.id ?? "", invitedAt: team?.createdAt },
    ...members.filter((m) => m.role !== "owner"),
  ];
  const memberCount = allMembers.length;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address");
      return;
    }
    if (trimmed === ownerEmail.toLowerCase()) {
      setError("You're already the team owner");
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === trimmed)) {
      setError("This email is already a team member");
      return;
    }
    if (memberCount >= MAX_MEMBERS) {
      setError("Maximum 10 members reached. Contact us for larger teams.");
      return;
    }
    addMember.mutate({ teamId: team.id, email: trimmed }, {
      onSuccess() {
        toast({ title: "Member added", description: trimmed });
        setEmail("");
      },
      onError(err: any) {
        setError(err?.message || "Failed to add member");
      },
    });
  }

  function handleRemove(memberId: string) {
    removeMember.mutate(memberId, {
      onSuccess() {
        toast({ title: "Member removed" });
        setConfirmRemove(null);
      },
      onError(err: any) {
        toast({ title: "Remove failed", description: err?.message });
        setConfirmRemove(null);
      },
    });
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team</h1>
          <p className="mt-1 text-secondary text-sm">Manage your firm's team members</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary">
          {memberCount}/{MAX_MEMBERS} members
        </span>
      </div>

      {/* Add member */}
      <div className="card-surface p-5 space-y-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Add team member</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            placeholder="colleague@example.com"
            type="email"
            className="glass-input flex-1 h-10 px-3 text-sm"
          />
          <button
            type="submit"
            disabled={addMember.status === "pending"}
            className="flex items-center gap-2 px-4 h-10 rounded-lg text-sm font-medium bg-gradient-orange text-white glow-orange transition-all disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </form>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <p className="text-xs text-tertiary">
          Team members who sign in with Google using this email will automatically see your clients, filings, and calculations.
        </p>
      </div>

      {/* Member list */}
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Members</h3>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {allMembers.map((m) => (
            <div key={m.id} className="group flex items-center gap-3 px-5 py-3">
              <div className="h-8 w-8 rounded-full grid place-items-center text-xs font-bold text-white bg-gradient-orange shrink-0">
                {m.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{m.email}</div>
                <div className="text-xs text-secondary mt-0.5">
                  Joined {formatDate(m.joinedAt || m.invitedAt)}
                </div>
              </div>
              <span className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                m.role === "owner" ? "bg-primary/15 text-primary" : "bg-white/10 text-secondary"
              )}>
                {m.role === "owner" && <Crown className="inline h-3 w-3 mr-0.5 -mt-0.5" />}
                {m.role === "owner" ? "Owner" : "Member"}
              </span>
              {m.role !== "owner" && (
                <button
                  onClick={() => setConfirmRemove(m.id)}
                  className="h-7 w-7 grid place-items-center rounded-md hover:bg-red-500/10 text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={!!confirmRemove} onOpenChange={() => setConfirmRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member</AlertDialogTitle>
            <AlertDialogDescription>
              This member will lose access to your clients, filings, and calculations. They can be re-added later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmRemove && handleRemove(confirmRemove)}
              disabled={removeMember.status === "pending"}
              className="bg-destructive text-white"
            >
              {removeMember.status === "pending" ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
