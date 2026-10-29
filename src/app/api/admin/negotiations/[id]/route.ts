import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/server";
import { serviceClient } from "@/lib/supabase/admin";

async function ctx(id: string) {
  const a = await requireAdmin();
  if (!a) return null;
  const db = serviceClient();
  const { data: neg } = await db.from("negotiations").select("*, products(name,price)").eq("id", id).maybeSingle();
  if (!neg) return null;
  const { data: floor } = await db.from("product_floors").select("min_price").eq("product_id", neg.product_id).maybeSingle();
  return { db, neg, min: floor?.min_price ?? null };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await ctx(id);
  if (!c) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const { data: messages } = await c.db.from("negotiation_messages")
    .select("id,sender,content,created_at").eq("negotiation_id", id).order("created_at");
  const { session_token, ...neg } = c.neg;
  return NextResponse.json({ negotiation: neg, min: c.min, messages: messages ?? [] });
}

// action: reply | accept | close | bot
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = await ctx(id);
  if (!c) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();

  if (body.action === "reply") {
    const text = String(body.text ?? "").trim().slice(0, 500);
    if (!text) return NextResponse.json({ error: "Message vide." }, { status: 400 });
    await c.db.from("negotiation_messages").insert({ negotiation_id: id, sender: "admin", content: text });
    await c.db.from("negotiations").update({ mode: "admin", updated_at: now }).eq("id", id);
  } else if (body.action === "accept") {
    const price = Math.floor(Number(body.price));
    const list = c.neg.products?.price ?? 0;
    if (!(price > 0) || price > list) return NextResponse.json({ error: `Prix invalide (max ${list}).` }, { status: 400 });
    await c.db.from("negotiations").update({
      status: "accepted", agreed_price: price, mode: "admin", updated_at: now,
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    }).eq("id", id);
    await c.db.from("negotiation_messages").insert({
      negotiation_id: id, sender: "admin",
      content: `C'est d'accord : ${new Intl.NumberFormat("fr-FR").format(price).replace(/ /g, " ")} FCFA, valable 24 h. Ajoutez-le au panier.`,
    });
  } else if (body.action === "close") {
    await c.db.from("negotiations").update({ status: "closed", updated_at: now }).eq("id", id);
    await c.db.from("negotiation_messages").insert({ negotiation_id: id, sender: "system", content: "Négociation clôturée par le gérant." });
  } else if (body.action === "bot") {
    await c.db.from("negotiations").update({ mode: "bot", updated_at: now }).eq("id", id);
    await c.db.from("negotiation_messages").insert({ negotiation_id: id, sender: "system", content: "L'assistant reprend la discussion." });
  } else {
    return NextResponse.json({ error: "Action inconnue." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
