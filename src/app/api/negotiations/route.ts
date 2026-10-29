import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/admin";
import { publicState } from "@/lib/negotiation-server";

// Démarre (ou reprend) la négociation d'un client pour un produit.
export async function POST(req: Request) {
  const { productId, token } = await req.json().catch(() => ({}));
  if (!productId || typeof token !== "string" || token.length < 16) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const db = serviceClient();
  const { data: product } = await db
    .from("products").select("id,name,price,negotiable,is_active,stock").eq("id", productId).maybeSingle();
  if (!product || !product.is_active || !product.negotiable) {
    return NextResponse.json({ error: "Ce produit n'est pas négociable." }, { status: 400 });
  }

  const { data: existing } = await db
    .from("negotiations").select("id")
    .eq("product_id", productId).eq("session_token", token).neq("status", "closed")
    .order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (existing) return NextResponse.json(await publicState(existing.id));

  const { data: neg, error } = await db
    .from("negotiations").insert({ product_id: productId, session_token: token }).select("id").single();
  if (error || !neg) return NextResponse.json({ error: "Création impossible." }, { status: 500 });

  await db.from("negotiation_messages").insert({
    negotiation_id: neg.id,
    sender: "bot",
    content: `Bonjour ! Le ${product.name} est affiché à ${new Intl.NumberFormat("fr-FR").format(product.price).replace(/ /g, " ")} FCFA. Quel prix proposez-vous ?`,
  });
  return NextResponse.json(await publicState(neg.id));
}
