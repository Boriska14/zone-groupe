import { serviceClient } from "./supabase/admin";

export const MAX_CUSTOMER_MESSAGES = 25;

/** Charge une négociation et vérifie que le jeton de session correspond (propriété). */
export async function loadOwned(id: string, token: string) {
  const db = serviceClient();
  const { data: neg } = await db.from("negotiations").select("*").eq("id", id).maybeSingle();
  if (!neg || !token || neg.session_token !== token) return null;
  return neg;
}

export async function adminAvailable() {
  const db = serviceClient();
  const { data } = await db.from("settings").select("value").eq("key", "admin_available").maybeSingle();
  return data?.value === true;
}

/** Réponse publique : n'expose jamais le prix plancher ni le jeton. */
export async function publicState(id: string) {
  const db = serviceClient();
  const [{ data: n }, { data: messages }, avail] = await Promise.all([
    db.from("negotiations").select("id,mode,status,agreed_price,expires_at").eq("id", id).single(),
    db.from("negotiation_messages").select("id,sender,content,created_at").eq("negotiation_id", id).order("created_at"),
    adminAvailable(),
  ]);
  let status = n!.status;
  if (status === "accepted" && n!.expires_at && new Date(n!.expires_at) < new Date()) status = "closed";
  return { negotiation: { id: n!.id, mode: n!.mode, status, agreed_price: n!.agreed_price, adminAvailable: avail }, messages: messages ?? [] };
}
