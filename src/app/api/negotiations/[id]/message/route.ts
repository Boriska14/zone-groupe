import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/admin";
import { adminAvailable, loadOwned, publicState, MAX_CUSTOMER_MESSAGES } from "@/lib/negotiation-server";
import { botReply, isAgreement, parseOffer } from "@/lib/negotiation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim().slice(0, 500);
  const neg = await loadOwned(id, String(body.token ?? ""));
  if (!neg) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  if (!text) return NextResponse.json({ error: "Message vide." }, { status: 400 });
  if (neg.status !== "open") return NextResponse.json({ error: "Négociation terminée." }, { status: 409 });

  const db = serviceClient();
  const { count } = await db.from("negotiation_messages")
    .select("id", { count: "exact", head: true }).eq("negotiation_id", id).eq("sender", "customer");
  if ((count ?? 0) >= MAX_CUSTOMER_MESSAGES) {
    return NextResponse.json({ error: "Nombre maximal de messages atteint." }, { status: 429 });
  }

  const offer = parseOffer(text);
  await db.from("negotiation_messages").insert({ negotiation_id: id, sender: "customer", content: text, offer });
  await db.from("negotiations").update({ updated_at: new Date().toISOString() }).eq("id", id);

  // Mode gérant : le gérant répond depuis l'admin.
  if (neg.mode === "admin") return NextResponse.json(await publicState(id));

  // Mode bot : toute la logique et le plancher restent côté serveur.
  const [{ data: product }, { data: floor }, avail] = await Promise.all([
    db.from("products").select("price").eq("id", neg.product_id).single(),
    db.from("product_floors").select("min_price").eq("product_id", neg.product_id).maybeSingle(),
    adminAvailable(),
  ]);
  const price = product!.price as number;
  const min = floor?.min_price != null ? Math.min(floor.min_price, price) : null;

  // "ok" après un dernier prix : le client accepte le dernier prix annoncé par le bot.
  let effectiveOffer = offer;
  if (offer == null && isAgreement(text) && min != null) {
    const { data: lastBot } = await db.from("negotiation_messages").select("content")
      .eq("negotiation_id", id).eq("sender", "bot").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const m = lastBot?.content.match(/(\d[\d\s]*\d)\s*FCFA/);
    if (m && /dernier prix|descendre à/.test(lastBot!.content)) {
      effectiveOffer = parseInt(m[1].replace(/\s/g, ""), 10);
    }
  }

  const round = effectiveOffer != null ? neg.rounds + 1 : neg.rounds;
  const reply = botReply({ price, min, offer: effectiveOffer, round, adminAvailable: avail });

  // Garde-fou final : jamais d'accord sous le plancher.
  if (reply.acceptedPrice != null && min != null && reply.acceptedPrice < min) {
    return NextResponse.json({ error: "Erreur de calcul." }, { status: 500 });
  }

  await db.from("negotiation_messages").insert({ negotiation_id: id, sender: "bot", content: reply.text });
  const patch: Record<string, unknown> = { rounds: round, updated_at: new Date().toISOString() };
  if (reply.acceptedPrice != null) {
    patch.status = "accepted";
    patch.agreed_price = reply.acceptedPrice;
    patch.expires_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  }
  await db.from("negotiations").update(patch).eq("id", id);
  return NextResponse.json(await publicState(id));
}
