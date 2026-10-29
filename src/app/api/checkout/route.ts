import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/admin";
import { initPayment, paymentProvider } from "@/lib/payment";

type In = { productId: string; qty: number; negotiationId?: string };

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || !body.items.length || body.items.length > 30) {
    return NextResponse.json({ error: "Panier invalide." }, { status: 400 });
  }
  const c = body.customer ?? {};
  const name = String(c.name ?? "").trim(), phone = String(c.phone ?? "").trim();
  const address = String(c.address ?? "").trim(), city = String(c.city ?? "").trim();
  if (!name || !phone || !address || !city) return NextResponse.json({ error: "Informations de livraison incomplètes." }, { status: 400 });
  const operator = body.operator === "orange" ? "orange" : "mtn";
  const momoPhone = String(body.momoPhone ?? phone).trim();
  const token = String(body.token ?? "");

  const db = serviceClient();
  const items = body.items as In[];
  const ids = [...new Set(items.map((i) => i.productId))];
  const { data: products } = await db.from("products").select("id,name,price,stock,is_active").in("id", ids);
  const byId = new Map((products ?? []).map((p) => [p.id, p]));

  // Le serveur recalcule chaque prix : le prix envoyé par le navigateur n'est jamais utilisé.
  const lines: { product_id: string; name: string; unit_price: number; qty: number; negotiation_id: string | null }[] = [];
  for (const it of items) {
    const p = byId.get(it.productId);
    const qty = Math.floor(Number(it.qty));
    if (!p || !p.is_active || !(qty >= 1 && qty <= 100)) return NextResponse.json({ error: "Article invalide." }, { status: 400 });
    if (p.stock < qty) return NextResponse.json({ error: `Stock insuffisant pour « ${p.name} ».` }, { status: 409 });

    let unit = p.price as number;
    let negId: string | null = null;
    if (it.negotiationId) {
      const { data: n } = await db.from("negotiations").select("*").eq("id", it.negotiationId).maybeSingle();
      const valid = n && n.session_token === token && n.product_id === p.id && n.status === "accepted"
        && n.agreed_price != null && n.expires_at && new Date(n.expires_at) > new Date();
      if (valid) {
        unit = Math.min(n.agreed_price, p.price);
        negId = n.id;
      } else {
        return NextResponse.json({ error: `Le prix négocié pour « ${p.name} » a expiré. Renégociez ou retirez l'article.` }, { status: 409 });
      }
    }
    lines.push({ product_id: p.id, name: p.name, unit_price: unit, qty, negotiation_id: negId });
  }
  const total = lines.reduce((s, l) => s + l.unit_price * l.qty, 0);

  const { data: order, error } = await db.from("orders").insert({
    customer_name: name, phone, email: c.email || null, city, address, notes: c.notes || null,
    total, operator, momo_phone: momoPhone, payment_provider: paymentProvider(),
  }).select("id").single();
  if (error || !order) return NextResponse.json({ error: "Création de la commande impossible." }, { status: 500 });
  await db.from("order_items").insert(lines.map((l) => ({ ...l, order_id: order.id })));

  const site = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  try {
    const pay = await initPayment({
      orderId: order.id, amount: total, customerName: name, customerEmail: c.email || null, phone: momoPhone,
      successUrl: `${site}/commande/${order.id}`, cancelUrl: `${site}/panier`,
    });
    await db.from("orders").update({ payment_ref: pay.reference }).eq("id", order.id);
    return NextResponse.json({ orderId: order.id, paymentUrl: pay.paymentUrl });
  } catch (e) {
    await db.from("orders").update({ status: "failed" }).eq("id", order.id);
    return NextResponse.json({ error: "Le service de paiement est indisponible. Réessayez." }, { status: 502 });
  }
}
