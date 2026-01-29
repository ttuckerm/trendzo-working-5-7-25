import { NextResponse } from "next/server";
import { getIdea, updateIdeaWithProposal } from "@/lib/server/deimStore";

function base() {
  return process.env.NEXT_PUBLIC_BASE_URL || "";
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const idea = await getIdea(id);
  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  const r = await fetch(`${base()}/api/intel/orchestrate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idea: idea.text, objective: "propose_changeset" }),
  }).catch(() => null);

  if (!r || !r.ok) {
    return NextResponse.json({ error: "Orchestrator failed" }, { status: 502 });
  }
  const proposal = await r.json();
  const updated = await updateIdeaWithProposal(id, proposal);
  return NextResponse.json({ ok: true, idea: updated, proposal });
}
