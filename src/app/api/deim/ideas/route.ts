import { NextResponse } from "next/server";
import { createIdea, listIdeasByDate } from "@/lib/server/deimStore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? undefined;
  const rows = await listIdeasByDate(date);
  return NextResponse.json({ items: rows });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { text?: string; date?: string } | null;
  if (!body?.text) {
    return NextResponse.json({ error: "Missing 'text'." }, { status: 400 });
  }
  const row = await createIdea(body.text, body.date);
  return NextResponse.json(row);
}
