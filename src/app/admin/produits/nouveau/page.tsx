import { createClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function Nouveau() {
  const db = await createClient();
  const { data: cats } = await db.from("categories").select("id,name").order("position");
  return (
    <div>
      <h1 className="mb-5 text-2xl font-extrabold">Nouveau produit</h1>
      <ProductForm categories={cats ?? []} />
    </div>
  );
}
