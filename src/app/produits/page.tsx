import Link from "next/link";
import Shell from "@/components/Shell";
import ProductCard, { type ProductLite } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Catalogue({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string }>;
}) {
  const { categorie, q } = await searchParams;
  const supabase = await createClient();
  const { data: cats } = await supabase.from("categories").select("id,name,slug").eq("is_active", true).order("position");
  const current = cats?.find((c) => c.slug === categorie);

  let query = supabase
    .from("products")
    .select("id,slug,name,brand,price,compare_at_price,stock,images,negotiable")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (current) query = query.eq("category_id", current.id);
  if (q) query = query.ilike("name", `%${q.replace(/[%,]/g, "")}%`);
  const { data: products } = await query;

  return (
    <Shell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{current?.name ?? "Toute la boutique"}</h1>
        <form className="flex gap-2">
          {current && <input type="hidden" name="categorie" value={current.slug} />}
          <input name="q" defaultValue={q} placeholder="Rechercher…" className="input w-56" />
          <button className="btn btn-primary">OK</button>
        </form>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/produits" className={`rounded-full px-4 py-1.5 text-sm font-semibold ${!current ? "bg-navy text-white" : "bg-white"}`}>Tout</Link>
        {cats?.map((c) => (
          <Link key={c.id} href={`/produits?categorie=${c.slug}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${current?.id === c.id ? "bg-navy text-white" : "bg-white hover:bg-cyan"}`}>
            {c.name}
          </Link>
        ))}
      </div>
      {products?.length ? (
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {(products as ProductLite[]).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      ) : (
        <p className="mt-10 text-center text-slate">Aucun produit trouvé.</p>
      )}
    </Shell>
  );
}
