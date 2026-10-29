/** Numéro WhatsApp -> chiffres internationaux (sans +), indicatif Cameroun (237) ajouté si absent. */
export function waNumber(raw?: string | null): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (!d.startsWith("237")) d = "237" + d;
  return d.length >= 11 && d.length <= 15 ? d : null;
}

/** Lien wa.me avec message prérempli ; null si aucun numéro valide. */
export function waLink(raw: string | null | undefined, text: string): string | null {
  const n = waNumber(raw);
  return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : null;
}
