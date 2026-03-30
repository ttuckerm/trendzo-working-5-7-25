import { supabaseAdmin } from "@/lib/server/supabaseAdmin";

export type IdeaRow = {
  id: string;
  idea_date: string; // YYYY-MM-DD
  text: string;
  status: "logged" | "researched";
  proposal_json: any | null;
  created_at: string;
};

// In-memory fallback when Supabase is not configured
const mem = { ideas: new Map<string, IdeaRow>() };

function todayISO(d?: Date) {
  const dt = d ?? new Date();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${dt.getFullYear()}-${m}-${day}`;
}
function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function createIdea(text: string, date?: string): Promise<IdeaRow> {
  const idea_date = date || todayISO();
  if (!supabaseAdmin) {
    const row: IdeaRow = {
      id: uuid(),
      idea_date,
      text,
      status: "logged",
      proposal_json: null,
      created_at: new Date().toISOString(),
    };
    mem.ideas.set(row.id, row);
    return row;
  }
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .insert({ idea_date, text, status: "logged", proposal_json: null })
    .select()
    .single();
  if (error) throw error;
  return data as IdeaRow;
}

export async function listIdeasByDate(date?: string): Promise<IdeaRow[]> {
  const d = date || todayISO();
  if (!supabaseAdmin) {
    return Array.from(mem.ideas.values())
      .filter((r) => r.idea_date === d)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .select("*")
    .eq("idea_date", d)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as IdeaRow[];
}

export async function getIdea(id: string): Promise<IdeaRow | null> {
  if (!supabaseAdmin) {
    return mem.ideas.get(id) ?? null;
  }
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as IdeaRow;
}

export async function updateIdeaWithProposal(id: string, proposal_json: any) {
  if (!supabaseAdmin) {
    const row = mem.ideas.get(id);
    if (!row) return null;
    row.status = "researched";
    row.proposal_json = proposal_json;
    mem.ideas.set(id, row);
    return row;
  }
  const { data, error } = await supabaseAdmin
    .from("ideas")
    .update({ status: "researched", proposal_json })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as IdeaRow;
}