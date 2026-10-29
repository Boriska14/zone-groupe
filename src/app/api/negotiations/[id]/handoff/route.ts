import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/admin";
import { adminAvailable, loadOwned, publicState } from "@/lib/negotiation-server";

// Le client demande à parler au gérant (uniquement si celui-ci est marqué disponible).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { token } = await req.json().catch(() => ({}));
  const neg = await loadOwned(id, String(token ?? ""));
  if (!neg) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  if (!(await adminAvailable())) return NextResponse.json({ error: "Le gérant n'est pas disponible." }, { status: 409 });
  if (neg.status !== "open") return NextResponse.json({ error: "Négociation terminée." }, { status: 409 });

  const db = serviceClient();
  await db.from("negotiations").update({ mode: "admin", updated_at: new Date().toISOString() }).eq("id", id);
  await db.from("negotiation_messages").insert({
    negotiation_id: id, sender: "system", content: "Le gérant a été prévenu et va vous répondre ici.",
  });
  return NextResponse.json(await publicState(id));
}
