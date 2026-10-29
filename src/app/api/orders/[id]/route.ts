import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/admin";
import { paymentProvider } from "@/lib/payment";
import { markPaid, syncOrderPayment } from "@/lib/payment-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Statut public d'une commande (l'identifiant UUID non devinable sert de secret).
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  await syncOrderPayment(id).catch(() => {}); // confirme auprès de nyole si encore en attente
  const db = serviceClient();
  const { data: o } = await db.from("orders").select("id,status,total,created_at").eq("id", id).maybeSingle();
  if (!o) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json(o);
}

// Simulation de paiement — UNIQUEMENT si PAYMENT_PROVIDER=mock (jamais en production réelle).
export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (paymentProvider() !== "mock") return NextResponse.json({ error: "Interdit." }, { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  const db = serviceClient();
  const { data: o } = await db.from("orders").select("id,status").eq("id", id).maybeSingle();
  if (!o) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  if (o.status === "pending") await markPaid(id);
  return NextResponse.json({ ok: true });
}
