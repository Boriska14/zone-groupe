import { saveProduct } from "@/app/admin/actions";
import ImageUploader from "./ImageUploader";

type Cat = { id: string; name: string };
type P = {
  id?: string; name?: string; brand?: string | null; category_id?: string | null; description?: string | null;
  price?: number; compare_at_price?: number | null; stock?: number; images?: string[];
  negotiable?: boolean; is_active?: boolean; is_featured?: boolean;
};

export default function ProductForm({ product, minPrice, categories }: { product?: P; minPrice?: number | null; categories: Cat[] }) {
  const p = product ?? {};
  return (
    <form action={saveProduct} className="card grid gap-4 p-5 md:grid-cols-2">
      {p.id && <input type="hidden" name="id" value={p.id} />}
      <div className="md:col-span-2"><label className="label">Nom du produit</label><input name="name" required defaultValue={p.name} className="input" /></div>
      <div><label className="label">Marque</label><input name="brand" defaultValue={p.brand ?? ""} className="input" /></div>
      <div>
        <label className="label">Catégorie</label>
        <select name="category_id" defaultValue={p.category_id ?? ""} className="input">
          <option value="">— Sans catégorie —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="md:col-span-2"><label className="label">Description</label><textarea name="description" rows={4} defaultValue={p.description ?? ""} className="input" /></div>

      <div><label className="label">Prix de vente (FCFA)</label><input name="price" type="number" min={1} required defaultValue={p.price} className="input" /></div>
      <div><label className="label">Ancien prix barré (optionnel)</label><input name="compare_at_price" type="number" min={0} defaultValue={p.compare_at_price ?? ""} className="input" /></div>

      <div className="rounded-xl bg-rose/40 p-3 md:col-span-2">
        <label className="label !text-navy">Prix plancher de négociation (FCFA) — jamais visible des clients</label>
        <input name="min_price" type="number" min={0} defaultValue={minPrice ?? ""} className="input" placeholder="Le plus bas prix que l'assistant peut accepter" />
        <p className="mt-1 text-xs text-navy/70">Laisser vide = l&apos;assistant refuse de baisser le prix (seul le gérant peut négocier). Doit être ≤ au prix de vente.</p>
      </div>

      <div><label className="label">Stock</label><input name="stock" type="number" min={0} defaultValue={p.stock ?? 0} className="input" /></div>
      <div className="flex flex-wrap items-end gap-5 pb-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="negotiable" defaultChecked={p.negotiable ?? true} /> Négociable</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_active" defaultChecked={p.is_active ?? true} /> Visible</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="is_featured" defaultChecked={p.is_featured ?? false} /> À la une</label>
      </div>

      <div className="md:col-span-2"><ImageUploader initial={p.images ?? []} /></div>
      <div className="md:col-span-2"><button className="btn btn-primary">Enregistrer le produit</button></div>
    </form>
  );
}
