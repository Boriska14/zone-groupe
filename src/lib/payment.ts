import crypto from "node:crypto";

/**
 * Paiement mobile money via nyole, et uniquement nyole (MTN MoMo, Orange Money).
 * Docs : https://nyole.com/docs/ — POST /v1/checkout/sessions, GET /v1/checkout/sessions/{id}/status,
 * webhook signé `X-Afriflow-Signature` (t=<ts>,v1=<HMAC-SHA256 hex de "<ts>.<corps brut>">).
 * Aucun autre moyen de paiement n'est branché : pas de mode simulation, pas d'autre agrégateur.
 */
const NYOLE_BASE = process.env.NYOLE_API_URL || "https://app.nyole.com/api/v1";

export type InitInput = {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail?: string | null;
  phone: string;
  successUrl: string;
  cancelUrl: string;
};
export type InitResult = { reference: string; paymentUrl: string };

export const PAYMENT_PROVIDER = "nyole";

/** Numéro camerounais -> format international (+237…) exigé par nyole. */
export function toInternational(phone: string) {
  const d = phone.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) return d;
  if (d.startsWith("00")) return "+" + d.slice(2);
  if (d.startsWith("237")) return "+" + d;
  return "+237" + d;
}

const secret = () => {
  const k = process.env.NYOLE_SECRET_KEY;
  if (!k) throw new Error("NYOLE_SECRET_KEY manquant");
  return k;
};

export async function initPayment(input: InitInput): Promise<InitResult> {
  const res = await fetch(`${NYOLE_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret()}`,
      "Idempotency-Key": `zg-${input.orderId}`,
    },
    body: JSON.stringify({
      amount: Math.round(input.amount), // XAF : pas de centimes
      currency: "XAF",
      customer_name: input.customerName,
      ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
      customer_phone: toInternational(input.phone),
      description: `Commande Zone Groupe ${input.orderId.slice(0, 8)}`,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: { order_id: input.orderId },
      merchant_name: "Zone Groupe",
    }),
  });
  if (!res.ok) throw new Error(`nyole HTTP ${res.status}`);
  const data = await res.json();
  if (!data.id || !data.url) throw new Error("Réponse nyole inattendue");
  return { reference: String(data.id), paymentUrl: String(data.url) };
}

export type RemoteStatus = { status: string; paid: boolean; amount: number; currency: string } | null;

/** Interroge nyole : seule source de vérité avec le webhook (la redirection success_url ne prouve rien). */
export async function fetchRemoteStatus(sessionId: string): Promise<RemoteStatus> {
  const res = await fetch(`${NYOLE_BASE}/checkout/sessions/${encodeURIComponent(sessionId)}/status`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const d = await res.json();
  return { status: String(d.status), paid: d.paid === true, amount: Number(d.amount), currency: String(d.currency) };
}

/** Vérifie `X-Afriflow-Signature: t=<ts>,v1=<hex>` sur "<ts>.<corps brut>" (tolérance 300 s). */
export function verifyNyoleSignature(rawBody: string, headers: Headers) {
  const ts = headers.get("x-afriflow-timestamp");
  const sig = (headers.get("x-afriflow-signature") || "").split(",").find((p) => p.startsWith("v1="))?.slice(3);
  if (!ts || !sig || !process.env.NYOLE_SECRET_KEY) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const expected = crypto.createHmac("sha256", process.env.NYOLE_SECRET_KEY).update(`${ts}.${rawBody}`).digest("hex");
  return expected.length === sig.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}
