import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type Notification = {
  id: string;
  userEmail: string;
  title: string;
  description?: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type DBNotification = {
  id: string;
  user_email: string;
  title: string;
  description?: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
};

function mapRow(r: DBNotification): Notification {
  return {
    id: r.id,
    userEmail: r.user_email,
    title: r.title,
    description: r.description,
    type: r.type,
    isRead: r.is_read,
    createdAt: r.created_at,
  };
}

export async function fetchNotifications(): Promise<Notification[]> {
  if (!isSupabaseConfigured()) return [];
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData?.user?.email) return [];

  const { data, error } = await supabase!
    .from("notifications")
    .select("*")
    .eq("user_email", userData.user.email)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return [];
  return (data || []).map((r: any) => mapRow(r as DBNotification));
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase!.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { data: userData } = await supabase!.auth.getUser();
  if (!userData?.user?.email) return;
  await supabase!
    .from("notifications")
    .update({ is_read: true })
    .eq("user_email", userData.user.email)
    .eq("is_read", false);
}

export async function createNotification(input: {
  userEmail: string;
  title: string;
  description?: string;
  type?: string;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  await supabase!.from("notifications").insert({
    user_email: input.userEmail,
    title: input.title,
    description: input.description || null,
    type: input.type || "assignment",
  });
}
