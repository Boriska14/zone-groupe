import { NextResponse } from "next/server";
import { verifyNyoleSignature } from "@/lib/payment";
import { syncOrderPayment } from "@/lib/payment-server";

// Webhook nyole (à déclarer dans le tableau de bord nyole) : https://VOTRE-SITE/api/payments/webhook
export async function POST(req: Request) {
  const raw = await req.text(); // corps brut, indispensable pour la signature
  if (!verifyNyoleSignature(raw, req.headers)) {
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }
  let evt: any;
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  if (evt.event === "payment.completed") {
    const orderId = evt?.data?.metadata?.order_id;
    // On ne se fie pas au contenu du webhook : on re-vérifie le statut chez nyole.
    if (typeof orderId === "string") await syncOrderPayment(orderId);
  }
  return NextResponse.json({ ok: true });
}
