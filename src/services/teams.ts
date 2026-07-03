import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type Team = {
  id: string;
  ownerId: string;
  name: string;
  createdAt?: string;
};

export type TeamMember = {
  id: string;
  teamId: string;
  email: string;
  userId?: string | null;
  role: "owner" | "member";
  joinedAt?: string | null;
  invitedAt?: string;
};

type DBTeam = {
  id: string;
  owner_id: string;
  name: string;
  created_at?: string;
};

type DBTeamMember = {
  id: string;
  team_id: string;
  email: string;
  user_id?: string | null;
  role: "owner" | "member";
  joined_at?: string | null;
  invited_at?: string;
};

function mapTeam(r: DBTeam): Team {
  return { id: r.id, ownerId: r.owner_id, name: r.name, createdAt: r.created_at };
}

function mapMember(r: DBTeamMember): TeamMember {
  return {
    id: r.id,
    teamId: r.team_id,
    email: r.email,
    userId: r.user_id,
    role: r.role,
    joinedAt: r.joined_at,
    invitedAt: r.invited_at,
  };
}

export async function fetchTeam(): Promise<Team | null> {
  if (!isSupabaseConfigured()) return null;
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData?.user) return null;

  const { data, error } = await supabase!
    .from("teams")
    .select("*")
    .eq("owner_id", userData.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return mapTeam(data as DBTeam);
}

export async function createTeam(name: string): Promise<Team> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData?.user) throw new Error("Authentication required");

  const { data, error } = await supabase!
    .from("teams")
    .insert({ owner_id: userData.user.id, name })
    .select()
    .single();

  if (error) throw error;
  return mapTeam(data as DBTeam);
}

export async function getOrCreateTeam(ownerId: string): Promise<Team> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  const { data: existing, error: fetchError } = await supabase!
    .from("teams")
    .select("*")
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return mapTeam(existing as DBTeam);

  const { data: created, error: createError } = await supabase!
    .from("teams")
    .insert({ owner_id: ownerId, name: "My Firm" })
    .select()
    .single();

  if (createError) throw createError;
  return mapTeam(created as DBTeam);
}

export async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  if (!isSupabaseConfigured() || !teamId) return [];
  const { data, error } = await supabase!
    .from("team_members")
    .select("*")
    .eq("team_id", teamId)
    .order("invited_at", { ascending: true });

  if (error) throw error;
  return (data || []).map((r: any) => mapMember(r as DBTeamMember));
}

export async function addTeamMember(teamId: string, email: string): Promise<TeamMember> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  const { data, error } = await supabase!
    .from("team_members")
    .insert({ team_id: teamId, email, role: "member" })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("This email is already a team member");
    throw error;
  }
  return mapMember(data as DBTeamMember);
}

export async function removeTeamMember(memberId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase!.from("team_members").delete().eq("id", memberId);
  if (error) throw error;
}
