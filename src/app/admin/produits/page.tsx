import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteProduct } from "../actions";
import { fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Produits() {
  const db = await createClient();
  const [{ data: products }, { data: floors }] = await Promise.all([
    db.from("products").select("id,name,price,stock,is_active,negotiable,images,categories(name)").order("created_at", { ascending: false }),
    db.from("product_floors").select("product_id,min_price"),
  ]);
  const floor = new Map((floors ?? []).map((f) => [f.product_id, f.min_price]));
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Produits</h1>
        <Link href="/admin/produits/nouveau" className="btn btn-primary">+ Nouveau produit</Link>
      </div>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-mist text-xs uppercase text-slate">
            <tr><th className="p-3">Produit</th><th>Prix</th><th>Plancher</th><th>Stock</th><th>Statut</th><th></th></tr>
          </thead>
          <tbody className="divide-y divide-mist">
            {products?.map((p) => {
              const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories;
              return (
                <tr key={p.id}>
                  <td className="p-3">
                    <Link href={`/admin/produits/${p.id}`} className="font-semibold hover:text-cyan-dark">{p.name}</Link>
                    <p className="text-xs text-slate">{cat?.name ?? "Sans catégorie"}</p>
                  </td>
                  <td>{fmt(p.price)}</td>
                  <td className="text-slate">{p.negotiable ? (floor.has(p.id) ? fmt(floor.get(p.id)!) : "non défini") : "—"}</td>
                  <td className={p.stock <= 3 ? "font-bold text-red-600" : ""}>{p.stock}</td>
                  <td>{p.is_active ? "Visible" : "Masqué"}</td>
                  <td className="pr-3 text-right">
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-xs text-red-600 underline">Supprimer</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!products?.length && <p className="p-6 text-center text-slate">Aucun produit. Créez le premier !</p>}
      </div>
    </div>
  );
}
