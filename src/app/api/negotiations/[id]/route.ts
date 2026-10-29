import { NextResponse } from "next/server";
import { loadOwned, publicState } from "@/lib/negotiation-server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (!(await loadOwned(id, token))) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(await publicState(id));
}
