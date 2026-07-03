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
    mutationFn: ({ teamId, email }: { teamId: string; email: string }) =>
      teamsService.addTeamMember(teamId, email),
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
