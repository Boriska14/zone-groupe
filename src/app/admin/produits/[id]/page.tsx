import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const [{ data: p }, { data: floor }, { data: cats }] = await Promise.all([
    db.from("products").select("*").eq("id", id).maybeSingle(),
    db.from("product_floors").select("min_price").eq("product_id", id).maybeSingle(),
    db.from("categories").select("id,name").order("position"),
  ]);
  if (!p) notFound();
  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold">Modifier : {p.name}</h1>
      <ProductForm product={p} minPrice={floor?.min_price ?? null} categories={cats ?? []} />
    </div>
  );
}
