import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "../config";
import { SERVICE_ROLE_KEY } from "../config.server";

/** Client service_role — SERVEUR UNIQUEMENT. Contourne la RLS : toujours valider les entrées avant. */
export function serviceClient() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase non configuré (URL ou clé service_role manquante).");
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}
