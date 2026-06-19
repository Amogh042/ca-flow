import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type Profile = {
  id: string;
  fullName: string;
  firmName: string;
  role: string;
  phone: string;
};

type DBProfile = {
  id: string;
  full_name: string | null;
  firm_name: string | null;
  role: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await supabase!
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  const row = data as DBProfile;
  return {
    id: row.id,
    fullName: row.full_name ?? "",
    firmName: row.firm_name ?? "",
    role: row.role ?? "",
    phone: row.phone ?? "",
  };
}

export async function updateProfile(
  userId: string,
  patch: Omit<Profile, "id">,
): Promise<Profile> {
  if (!isSupabaseConfigured()) {
    return { id: userId, ...patch };
  }
  const payload = {
    id: userId,
    full_name: patch.fullName || null,
    firm_name: patch.firmName || null,
    role: patch.role || null,
    phone: patch.phone || null,
    updated_at: new Date().toISOString(),
  };
  const { data: row, error } = await supabase!
    .from("profiles")
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  const r = row as DBProfile;
  return {
    id: r.id,
    fullName: r.full_name ?? "",
    firmName: r.firm_name ?? "",
    role: r.role ?? "",
    phone: r.phone ?? "",
  };
}

export async function updateUserMetadata(fullName: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase!.auth.updateUser({
    data: { full_name: fullName },
  });
  if (error) throw error;
}
