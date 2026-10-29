import { createClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "../actions";
import { fmt } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES: [string, string][] = [
  ["pending", "En attente"], ["paid", "Payée"], ["shipped", "Expédiée"],
  ["delivered", "Livrée"], ["failed", "Échouée"], ["cancelled", "Annulée"],
];

export default async function Commandes() {
  const db = await createClient();
  const { data: orders } = await db
    .from("orders").select("*, order_items(name,qty,unit_price)").order("created_at", { ascending: false }).limit(100);
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Commandes</h1>
      <div className="mt-5 space-y-3">
        {orders?.map((o) => (
          <div key={o.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">#{o.id.slice(0, 8)} · {o.customer_name}</p>
                <p className="text-sm text-slate">{o.phone} · {o.city}, {o.address}</p>
                <p className="text-xs text-slate">{new Date(o.created_at).toLocaleString("fr-FR")} · {o.operator?.toUpperCase()} {o.momo_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-extrabold">{fmt(o.total)}</p>
                <form action={updateOrderStatus} className="mt-1 flex gap-2">
                  <input type="hidden" name="id" value={o.id} />
                  <select name="status" defaultValue={o.status} className="input !py-1.5">
                    {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <button className="btn btn-ghost !py-1.5">OK</button>
                </form>
              </div>
            </div>
            <ul className="mt-3 border-t border-mist pt-2 text-sm">
              {o.order_items?.map((i: { name: string; qty: number; unit_price: number }, idx: number) => (
                <li key={idx} className="flex justify-between"><span>{i.qty} × {i.name}</span><span>{fmt(i.unit_price * i.qty)}</span></li>
              ))}
            </ul>
          </div>
        ))}
        {!orders?.length && <p className="text-slate">Aucune commande.</p>}
      </div>
    </div>
  );
}
