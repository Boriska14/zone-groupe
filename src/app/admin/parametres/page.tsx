import { createClient } from "@/lib/supabase/server";
import { saveShop } from "../actions";

export const dynamic = "force-dynamic";

export default async function Parametres() {
  const db = await createClient();
  const { data } = await db.from("settings").select("value").eq("key", "shop").maybeSingle();
  const s = (data?.value ?? {}) as { phone?: string; whatsapp?: string; address?: string };
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Paramètres de la boutique</h1>
      <form action={saveShop} className="card mt-5 grid max-w-xl gap-4 p-5">
        <div><label className="label">Téléphone</label><input name="phone" defaultValue={s.phone} className="input" /></div>
        <div>
          <label className="label">WhatsApp du vendeur</label>
          <input name="whatsapp" defaultValue={s.whatsapp} className="input" placeholder="237690000000" />
          <p className="mt-1 text-xs text-slate">Format international, avec ou sans « + ». Les clients cliquent dessus pour vous écrire (fiche produit, panier, commande, pied de page).</p>
        </div>
        <div><label className="label">Adresse</label><input name="address" defaultValue={s.address} className="input" /></div>
        <div><button className="btn btn-primary">Enregistrer</button></div>
      </form>
      <p className="mt-4 text-sm text-slate">
        Le bouton « Disponible / Indisponible » du menu contrôle si les clients peuvent basculer la négociation vers vous.
      </p>
    </div>
  );
}
