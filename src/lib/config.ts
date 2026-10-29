/**
 * Configuration du site SANS variables d'environnement Vercel.
 * Remplissez les 3 valeurs ci-dessous (Supabase > Project Settings > API), puis enregistrez : Vercel redéploie.
 * Ces deux clés-ci sont PUBLIQUES par conception (la sécurité repose sur les règles RLS du schéma SQL).
 * Si des variables d'environnement existent, elles ont la priorité.
 */
const FILE = {
  SUPABASE_URL: "https://pgxhmpvsderycbzlinzs.supabase.co",              // ex. https://abcdxyz.supabase.co
  SUPABASE_ANON_KEY: "sb_publishable_fPCpeR68uui7XH8mj4oAEA_jcMwSXsM", // commence par eyJ... ou sb_publishable_...
  WHATSAPP_NUMBER: "237697707229",                                  // ex. 237690000000 (sinon : Admin > Paramètres)
};

const valid = (v?: string) => (v && !v.startsWith("COLLER_ICI") ? v : undefined);

export const SUPABASE_URL = valid(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? valid(FILE.SUPABASE_URL);
export const SUPABASE_ANON_KEY = valid(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ?? valid(FILE.SUPABASE_ANON_KEY);
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || FILE.WHATSAPP_NUMBER;
