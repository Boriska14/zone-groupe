import { notFound } from "next/navigation";
import Shell from "@/components/Shell";
import ProductActions from "@/components/ProductActions";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: p } = await supabase
    .from("products")
    .select("id,slug,name,brand,description,price,compare_at_price,stock,images,negotiable,categories(name,slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!p) notFound();

  const { data: avail } = await supabase.from("settings").select("value").eq("key", "admin_available").maybeSingle();
  const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;

  return (
    <Shell>
      <p className="text-sm text-slate">{cat ? `${cat.name} / ` : ""}{p.name}</p>
      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="card p-4">
          {p.images?.[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt={p.name} className="aspect-square w-full object-contain" />
          ) : (
            <div className="grid aspect-square place-items-center text-7xl text-slate/40">▣</div>
          )}
          {p.images?.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {p.images.slice(1).map((src: string) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="h-16 w-16 rounded-lg border border-mist object-contain" />
              ))}
            </div>
          )}
        </div>
        <div>
          {p.brand && <p className="text-xs font-semibold uppercase tracking-wide text-cyan-dark">{p.brand}</p>}
          <h1 className="mt-1 text-3xl font-extrabold">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{fmt(p.price)}</span>
            {p.compare_at_price > p.price && <span className="text-slate line-through">{fmt(p.compare_at_price)}</span>}
          </div>
          <p className={`mt-2 text-sm font-semibold ${p.stock > 0 ? "text-cyan-dark" : "text-red-600"}`}>
            {p.stock > 0 ? `En stock (${p.stock})` : "Épuisé"}
          </p>
          {p.description && <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-navy/80">{p.description}</p>}
          <ProductActions
            product={{ id: p.id, slug: p.slug, name: p.name, price: p.price, stock: p.stock, image: p.images?.[0], negotiable: p.negotiable }}
            adminAvailable={avail?.value === true}
          />
        </div>
      </div>
    </Shell>
  );
}
