import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { DBWorkflow, DBWorkflowInsert } from "@/types/database";
import { toISOTimestampOrNull } from "@/lib/date";

export type Workflow = {
  id: string;
  title: string;
  client?: string;
  type?: string;
  assignee?: string;
  createdBy?: string;
  dueDate?: string;
  status: "pending" | "in-progress" | "done" | "blocked";
  priority?: "high" | "medium" | "low";
  subtasks?: number;
  completedSubtasks?: number;
};

function mapRowToWorkflow(r: DBWorkflow): Workflow {
  return {
    id: r.id,
    title: r.title,
    client: r.client_id ?? undefined,
    type: r.type ?? undefined,
    assignee: r.assignee ?? undefined,
    createdBy: r.user_id ?? undefined,
    dueDate: r.due_date ?? undefined,
    status: r.status,
    priority: r.priority ?? undefined,
    subtasks: r.subtasks ?? 0,
    completedSubtasks: r.completed_subtasks ?? 0,
  };
}

export async function fetchWorkflows(): Promise<Workflow[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase!.from<DBWorkflow>("workflows").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRowToWorkflow);
}

export async function createWorkflow(input: Omit<Workflow, "id">): Promise<Workflow> {
  if (!isSupabaseConfigured()) {
    return { id: `wf-local-${Date.now()}`, ...input } as Workflow;
  }

  let userId: string | null = null;
  try {
    const { data: userData } = await supabase!.auth.getUser();
    if (userData?.user?.id) userId = userData.user.id;
  } catch (_) {}

  const payload: DBWorkflowInsert = {
    title: input.title,
    user_id: userId,
    client_id: input.client || null,
    type: input.type || null,
    assignee: input.assignee || null,
    due_date: toISOTimestampOrNull(input.dueDate),
    status: input.status,
    priority: input.priority || null,
    subtasks: input.subtasks ?? 0,
    completed_subtasks: input.completedSubtasks ?? 0,
  };

  const { data, error } = await supabase!.from<DBWorkflow>("workflows").insert(payload).select().single();
  if (error) {
    console.error("Create workflow error:", error.message, error.details, error.hint);
    throw error;
  }
  return mapRowToWorkflow(data as DBWorkflow);
}

export async function updateWorkflow(id: string, patch: Partial<Workflow>): Promise<Workflow> {
  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");

  const payload: Partial<DBWorkflow> = {};
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.client !== undefined) payload.client_id = patch.client;
  if (patch.type !== undefined) payload.type = patch.type;
  if (patch.assignee !== undefined) payload.assignee = patch.assignee;
  if (patch.dueDate !== undefined) payload.due_date = toISOTimestampOrNull(patch.dueDate as string | undefined);
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.priority !== undefined) payload.priority = patch.priority;
  if (patch.subtasks !== undefined) payload.subtasks = patch.subtasks;
  if (patch.completedSubtasks !== undefined) payload.completed_subtasks = patch.completedSubtasks;

  const { data, error } = await supabase!.from<DBWorkflow>("workflows").update(payload).eq("id", id).select().single();
  if (error) {
    console.error("Update workflow error:", error.message, error.details, error.hint);
    throw error;
  }
  return mapRowToWorkflow(data as DBWorkflow);
}

export async function deleteWorkflow(id: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase!.from("workflows").delete().eq("id", id);
  if (error) throw error;
}

// TODO: implement realtime subscriptions using supabase.channel for workflows
