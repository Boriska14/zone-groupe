import { serviceClient } from "./supabase/admin";
import { fetchRemoteStatus } from "./payment";

/** Passe la commande à "payée" UNE seule fois et décrémente le stock (idempotent). */
export async function markPaid(orderId: string) {
  const db = serviceClient();
  const { data: updated } = await db
    .from("orders").update({ status: "paid" })
    .eq("id", orderId).in("status", ["pending", "failed"]).select("id");
  if (!updated?.length) return false; // déjà traitée

  const { data: items } = await db.from("order_items").select("product_id,qty").eq("order_id", orderId);
  for (const it of items ?? []) {
    if (!it.product_id) continue;
    const { data: p } = await db.from("products").select("stock").eq("id", it.product_id).single();
    if (p) await db.from("products").update({ stock: Math.max(0, p.stock - it.qty) }).eq("id", it.product_id);
  }
  return true;
}

/** Confirme auprès de nyole (jamais sur la foi d'un corps de requête) puis met à jour la commande. */
export async function syncOrderPayment(orderId: string) {
  const db = serviceClient();
  const { data: o } = await db.from("orders").select("id,status,total,payment_ref").eq("id", orderId).maybeSingle();
  if (!o || o.status !== "pending" || !o.payment_ref) return;

  const r = await fetchRemoteStatus(o.payment_ref);
  if (!r) return;
  if (r.status === "SUCCESS" && r.paid && r.currency === "XAF" && r.amount >= o.total) {
    await markPaid(o.id);
  } else if (r.status === "CANCELLED") {
    await db.from("orders").update({ status: "cancelled" }).eq("id", o.id).eq("status", "pending");
  }
}
