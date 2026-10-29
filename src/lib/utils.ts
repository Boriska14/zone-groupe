export const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(Math.round(n)).replace(/ /g, " ") + " FCFA";

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const toInt = (v: FormDataEntryValue | null, fallback = 0) => {
  const n = parseInt(String(v ?? "").replace(/\s/g, ""), 10);
  return Number.isFinite(n) ? n : fallback;
};
