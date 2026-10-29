import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminChat from "@/components/admin/AdminChat";

export const dynamic = "force-dynamic";

export default async function Negociations({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const db = await createClient();
  const { data: list } = await db
    .from("negotiations").select("id,mode,status,agreed_price,updated_at,products(name)")
    .order("updated_at", { ascending: false }).limit(60);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Négociations</h1>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="card max-h-[70vh] divide-y divide-mist overflow-y-auto lg:col-span-1">
          {list?.map((n) => {
            const prod = Array.isArray(n.products) ? n.products[0] : n.products;
            return (
              <Link key={n.id} href={`/admin/negociations?id=${n.id}`}
                className={`block p-3 text-sm hover:bg-mist ${id === n.id ? "bg-mist" : ""}`}>
                <p className="font-semibold">{prod?.name ?? "Produit"}</p>
                <p className="text-xs text-slate">
                  {n.mode === "admin" ? "● Attend le gérant" : "Assistant"} · {n.status === "accepted" ? "accepté" : n.status === "open" ? "ouverte" : "clôturée"} · {new Date(n.updated_at).toLocaleString("fr-FR")}
                </p>
              </Link>
            );
          })}
          {!list?.length && <p className="p-4 text-sm text-slate">Aucune négociation.</p>}
        </div>
        <div className="lg:col-span-2">
          {id ? <AdminChat key={id} id={id} /> : <p className="text-slate">Sélectionnez une conversation.</p>}
        </div>
      </div>
    </div>
  );
}
