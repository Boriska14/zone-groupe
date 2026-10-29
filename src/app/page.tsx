import Link from "next/link";
import Shell from "@/components/Shell";
import ProductCard, { type ProductLite } from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const COLS = "id,slug,name,brand,price,compare_at_price,stock,images,negotiable";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: cats }, { data: featured }, { data: latest }] = await Promise.all([
    supabase.from("categories").select("id,name,slug").eq("is_active", true).order("position"),
    supabase.from("products").select(COLS).eq("is_active", true).eq("is_featured", true).limit(8),
    supabase.from("products").select(COLS).eq("is_active", true).order("created_at", { ascending: false }).limit(8),
  ]);
  const list = (featured?.length ? featured : latest) as ProductLite[] | null;

  return (
    <Shell>
      <section className="overflow-hidden rounded-3xl bg-navy p-8 text-white md:p-14">
        <div className="max-w-xl">
          <span className="rounded-full bg-rose px-3 py-1 text-xs font-bold text-navy">Nouveau · Négociez en direct</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            L&apos;électronique au <span className="text-cyan">juste prix</span>.
          </h1>
          <p className="mt-4 text-slate">
            Discutez le prix de chaque produit avec notre assistant ou directement avec le gérant, puis payez par MTN ou Orange Money.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/produits" className="btn btn-accent">Voir la boutique</Link>
          </div>
        </div>
      </section>

      {!!cats?.length && (
        <section className="mt-10">
          <h2 className="text-xl font-extrabold">Catégories</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {cats.map((c) => (
              <Link key={c.id} href={`/produits?categorie=${c.slug}`}
                className="card px-4 py-5 text-center text-sm font-semibold transition hover:bg-cyan hover:text-navy">
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">{featured?.length ? "Sélection" : "Nouveautés"}</h2>
        {list?.length ? (
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {list.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <p className="mt-4 text-slate">Aucun produit pour le moment.</p>
        )}
      </section>
    </Shell>
  );
}
