import { createClient } from "@/lib/supabase/server";
import { saveCategory, deleteCategory } from "../actions";

export const dynamic = "force-dynamic";

export default async function Categories() {
  const db = await createClient();
  const { data: cats } = await db.from("categories").select("*").order("position");
  return (
    <div>
      <h1 className="text-2xl font-extrabold">Catégories</h1>

      <form action={saveCategory} className="card mt-5 grid gap-3 p-5 md:grid-cols-5">
        <div className="md:col-span-2"><label className="label">Nouvelle catégorie</label><input name="name" required className="input" placeholder="Ex. Consoles" /></div>
        <div className="md:col-span-2"><label className="label">Description</label><input name="description" className="input" /></div>
        <div><label className="label">Ordre</label><input name="position" type="number" defaultValue={0} className="input" /></div>
        <input type="hidden" name="is_active" value="on" />
        <div className="md:col-span-5"><button className="btn btn-primary">Ajouter</button></div>
      </form>

      <div className="mt-6 space-y-3">
        {cats?.map((c) => (
          <div key={c.id} className="card flex flex-wrap items-end gap-3 p-4">
            <form action={saveCategory} className="flex flex-1 flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={c.id} />
              <div className="min-w-40 flex-1"><label className="label">Nom</label><input name="name" defaultValue={c.name} className="input" /></div>
              <div className="min-w-40 flex-1"><label className="label">Description</label><input name="description" defaultValue={c.description ?? ""} className="input" /></div>
              <div className="w-20"><label className="label">Ordre</label><input name="position" type="number" defaultValue={c.position} className="input" /></div>
              <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" name="is_active" defaultChecked={c.is_active} /> Visible</label>
              <button className="btn btn-ghost">Enregistrer</button>
            </form>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn bg-rose text-navy hover:bg-rose/80">Supprimer</button>
            </form>
          </div>
        ))}
        {!cats?.length && <p className="text-slate">Aucune catégorie.</p>}
      </div>
      <p className="mt-4 text-xs text-slate">Supprimer une catégorie ne supprime pas ses produits : ils deviennent « sans catégorie ».</p>
    </div>
  );
}
