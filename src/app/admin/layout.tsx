import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/server";
import { setAvailability } from "./actions";
import LogoutButton from "@/components/admin/LogoutButton";

export const dynamic = "force-dynamic";

const NAV = [
  ["/admin", "Tableau de bord"],
  ["/admin/produits", "Produits"],
  ["/admin/categories", "Catégories"],
  ["/admin/commandes", "Commandes"],
  ["/admin/negociations", "Négociations"],
  ["/admin/parametres", "Paramètres"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const a = await requireAdmin();
  if (!a) redirect("/connexion-admin");
  const { data: avail } = await a.supabase.from("settings").select("value").eq("key", "admin_available").maybeSingle();
  const available = avail?.value === true;

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-navy text-white md:w-60 md:shrink-0">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <p className="text-lg font-extrabold">ZONE <span className="text-cyan">GROUPE</span></p>
          <p className="text-xs text-slate">Administration</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:space-y-1">
          {NAV.map(([href, label]) => (
            <Link key={href} href={href} className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10">{label}</Link>
          ))}
          <Link href="/" className="block whitespace-nowrap rounded-lg px-3 py-2 text-sm text-slate hover:bg-white/10">↗ Voir la boutique</Link>
        </nav>
        <div className="hidden space-y-3 border-t border-white/10 p-4 md:block">
          <form action={setAvailability}>
            <input type="hidden" name="available" value={available ? "0" : "1"} />
            <p className="mb-2 text-xs text-slate">Chat client avec le gérant</p>
            <button className={`btn w-full ${available ? "bg-cyan text-navy" : "bg-white/10 text-white"}`}>
              {available ? "● Disponible" : "○ Indisponible"}
            </button>
          </form>
          <LogoutButton />
        </div>
      </aside>
      <div className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mb-4 flex items-center gap-3 md:hidden">
          <form action={setAvailability}>
            <input type="hidden" name="available" value={available ? "0" : "1"} />
            <button className={`btn ${available ? "bg-cyan text-navy" : "bg-navy text-white"}`}>{available ? "● Disponible" : "○ Indisponible"}</button>
          </form>
          <LogoutButton light />
        </div>
        {children}
      </div>
    </div>
  );
}
