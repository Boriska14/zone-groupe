import { fmt } from "./utils";

/** Extrait un montant d'un message libre : "45 000", "45000 fcfa", "45k". */
export function parseOffer(text: string): number | null {
  const cleaned = text.toLowerCase().replace(/fcfa|xaf|cfa/g, " ");
  const m = cleaned.match(/(\d[\d\s.,]*\d|\d)\s*(k|mille)?\b/);
  if (!m) return null;
  let n = parseInt(m[1].replace(/[\s.,]/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  if (m[2]) n *= 1000;
  return n;
}

// Part de la marge (prix - plancher) que le bot accepte de céder à chaque tour.
const CURVE = [0.3, 0.55, 0.75, 0.9, 1];

/** Prix demandé par le bot au tour `round` (1-based). Ne descend JAMAIS sous `min`. */
export function botAsk(price: number, min: number, round: number) {
  const share = CURVE[Math.min(round, CURVE.length) - 1];
  const raw = price - (price - min) * share;
  const rounded = Math.ceil(raw / 500) * 500; // arrondi vers le haut : jamais sous le plancher
  return Math.max(min, Math.min(price, rounded));
}

export type BotResult = { text: string; acceptedPrice?: number };

export function botReply(opts: {
  price: number;
  min: number | null;
  offer: number | null;
  round: number;
  adminAvailable: boolean;
}): BotResult {
  const { price, min, offer, round, adminAvailable } = opts;
  const adminHint = adminAvailable ? " Vous pouvez aussi discuter directement avec le gérant (bouton ci-dessous)." : "";

  if (min == null) {
    return { text: `Ce produit est vendu à ${fmt(price)}, prix ferme côté assistant.${adminHint}` };
  }
  if (offer == null) {
    return { text: `Quel prix souhaitez-vous ? Indiquez un montant en FCFA (ex. ${fmt(Math.round(price * 0.9 / 500) * 500)}).` };
  }
  if (offer >= price) {
    return { text: `Vous n'avez pas besoin de négocier plus : ${fmt(price)} est le prix affiché. Je vous le réserve à ce tarif.`, acceptedPrice: price };
  }
  const ask = botAsk(price, min, round);
  if (offer >= ask) {
    return { text: `Marché conclu à ${fmt(offer)} ! Ce prix est réservé 24 h pour vous. Ajoutez-le au panier ci-dessous.`, acceptedPrice: offer };
  }
  if (ask <= min) {
    return { text: `Je ne peux pas aller plus bas que ${fmt(min)} : c'est mon dernier prix. Si cela vous convient, répondez "ok" ou proposez ${fmt(min)}.${adminHint}` };
  }
  return { text: `${fmt(offer)}, c'est un peu juste. Je peux descendre à ${fmt(ask)}. Qu'en pensez-vous ?` };
}

export function isAgreement(text: string) {
  return /^(ok|d['’]?accord|oui|marché conclu|ça marche|c'est bon|deal)\b/i.test(text.trim());
}
