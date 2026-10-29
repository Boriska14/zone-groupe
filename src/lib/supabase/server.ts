import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../config";

export async function createClient() {
  const cookieStore = await cookies();
  const url = SUPABASE_URL;
  const key = SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Sans ces variables, createServerClient lève une exception et toute page affiche « Application error ».
    console.error("Supabase non configuré : renseignez src/lib/config.ts (URL + clé anon).");
  }
  return createServerClient(
    url || "http://localhost:54321",
    key || "missing-anon-key",
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options: CookieOptions }[]) => {
          try {
            list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // appelé depuis un Server Component : ignoré (le middleware rafraîchit la session)
          }
        },
      },
    }
  );
}

/** Retourne l'utilisateur connecté seulement s'il est admin, sinon null. */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return null;
  const { data: isAdmin } = await supabase.rpc("is_admin");
  return isAdmin ? { supabase, user: data.user } : null;
}
