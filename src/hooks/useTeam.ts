import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as teamsService from "@/services/teams";
import type { Team, TeamMember } from "@/services/teams";
import { useAuth } from "@/contexts/AuthContext";

export function useTeam() {
  const { user } = useAuth();
  return useQuery<Team | null>({
    queryKey: ["team", user?.id],
    queryFn: teamsService.fetchTeam,
    staleTime: 60_000,
    enabled: !!user?.id,
  });
}

// Like useTeam, but atomically creates the team record if the user
// doesn't have one yet (e.g. first Team page visit after a Firm
// coupon redemption never went through the manual createTeam flow).
export function useEnsureTeam(enabled: boolean) {
  const { user } = useAuth();
  return useQuery<Team>({
    queryKey: ["team", user?.id],
    queryFn: () => teamsService.getOrCreateTeam(user!.id),
    staleTime: 60_000,
    enabled: enabled && !!user?.id,
    retry: 1,
  });
}

export function useTeamMembers(teamId?: string) {
  return useQuery<TeamMember[]>({
    queryKey: ["team-members", teamId],
    queryFn: () => teamsService.fetchTeamMembers(teamId!),
    staleTime: 30_000,
    enabled: !!teamId,
    placeholderData: [],
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => teamsService.createTeam(name),
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["team"] });
    },
  });
}

export function useAddTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ teamId, email, name }: { teamId: string; email: string; name?: string }) =>
      teamsService.addTeamMember(teamId, email, name),
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => teamsService.removeTeamMember(memberId),
    onSuccess() {
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
  });
}
