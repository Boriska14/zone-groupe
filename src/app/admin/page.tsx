import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const db = await createClient();
  const count = (t: string, f?: (q: any) => any) => {
    let q = db.from(t).select("id", { count: "exact", head: true });
    if (f) q = f(q);
    return q;
  };
  const [products, orders, pending, openNeg, paid, low] = await Promise.all([
    count("products"),
    count("orders"),
    count("orders", (q) => q.eq("status", "pending")),
    count("negotiations", (q) => q.eq("status", "open")),
    db.from("orders").select("total").in("status", ["paid", "shipped", "delivered"]),
    db.from("products").select("id,name,stock").lte("stock", 3).eq("is_active", true).limit(8),
  ]);
  const revenue = (paid.data ?? []).reduce((s, o) => s + o.total, 0);
  const stats = [
    ["Chiffre d'affaires", fmt(revenue)],
    ["Commandes", String(orders.count ?? 0)],
    ["En attente de paiement", String(pending.count ?? 0)],
    ["Négociations ouvertes", String(openNeg.count ?? 0)],
    ["Produits", String(products.count ?? 0)],
  ];
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(([k, v]) => (
          <div key={k} className="card p-4">
            <p className="text-xs font-semibold uppercase text-slate">{k}</p>
            <p className="mt-1 text-xl font-extrabold">{v}</p>
          </div>
        ))}
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-extrabold">Stock faible</h2>
        {low.data?.length ? (
          <ul className="mt-3 divide-y divide-mist text-sm">
            {low.data.map((p) => (
              <li key={p.id} className="flex justify-between py-2">
                <Link href={`/admin/produits/${p.id}`} className="font-medium hover:text-cyan-dark">{p.name}</Link>
                <span className={p.stock === 0 ? "font-bold text-red-600" : "text-slate"}>{p.stock} en stock</span>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm text-slate">Aucune alerte.</p>}
      </div>
    </div>
  );
}
