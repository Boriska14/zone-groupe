import Link from "next/link";
import { fmt } from "@/lib/utils";

export type ProductLite = {
  id: string; slug: string; name: string; brand: string | null; price: number;
  compare_at_price: number | null; stock: number; images: string[]; negotiable: boolean;
};

export default function ProductCard({ p }: { p: ProductLite }) {
  const promo = p.compare_at_price && p.compare_at_price > p.price;
  return (
    <Link href={`/produits/${p.slug}`} className="card group overflow-hidden transition hover:-translate-y-1">
      <div className="relative aspect-square bg-gradient-to-br from-mist to-white">
        {p.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.images[0]} alt={p.name} className="h-full w-full object-contain p-4 transition group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-5xl text-slate/50">▣</div>
        )}
        {p.negotiable && (
          <span className="absolute left-3 top-3 rounded-full bg-rose px-2.5 py-1 text-xs font-bold text-navy">Prix négociable</span>
        )}
        {p.stock === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-navy px-2.5 py-1 text-xs font-bold text-white">Épuisé</span>
        )}
      </div>
      <div className="p-4">
        {p.brand && <p className="text-xs font-semibold uppercase tracking-wide text-slate">{p.brand}</p>}
        <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-semibold">{p.name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-navy">{fmt(p.price)}</span>
          {promo && <span className="text-xs text-slate line-through">{fmt(p.compare_at_price!)}</span>}
        </div>
      </div>
    </Link>
  );
}
