"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart, getSessionToken } from "@/lib/cart";
import { fmt } from "@/lib/utils";
import WhatsAppButton from "./WhatsAppButton";
import { useShop } from "./ShopContext";
import { waLink } from "@/lib/whatsapp";

export default function CartView() {
  const { items, total, setQty, remove, clear } = useCart();
  const { whatsapp, serverReady } = useShop();
  const [form, setForm] = useState({ name: "", phone: "", email: "", city: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!items.length) {
    return (
      <div className="card mt-6 p-10 text-center">
        <p className="text-slate">Votre panier est vide.</p>
        <Link href="/produits" className="btn btn-primary mt-4">Parcourir la boutique</Link>
      </div>
    );
  }

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!serverReady) {
      // Sans clé serveur : pas de commande en base, le récapitulatif part directement au vendeur sur WhatsApp.
      const lines = items.map((i) => `- ${i.qty} × ${i.name} (${fmt(i.price)})`).join("\n");
      const msg = `Bonjour Zone Groupe, je souhaite commander :\n${lines}\nTotal : ${fmt(total)}\n\nNom : ${form.name}\nTéléphone : ${form.phone}\nVille : ${form.city}\nAdresse : ${form.address}${form.notes ? `\nNote : ${form.notes}` : ""}`;
      const href = waLink(whatsapp, msg);
      if (!href) return setError("Le numéro WhatsApp du vendeur n'est pas encore configuré.");
      window.open(href, "_blank", "noopener");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: getSessionToken(),
          items: items.map((i) => ({ productId: i.productId, qty: i.qty, negotiationId: i.negotiationId })),
          customer: { name: form.name, phone: form.phone, email: form.email, city: form.city, address: form.address, notes: form.notes },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Erreur");
      clear();
      window.location.href = `/commande/${d.orderId}`;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 grid gap-8 md:grid-cols-5">
      <div className="space-y-3 md:col-span-3">
        {items.map((i) => (
          <div key={i.productId} className="card flex items-center gap-4 p-3">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-mist">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {i.image && <img src={i.image} alt="" className="h-full w-full object-contain" />}
            </div>
            <div className="min-w-0 flex-1">
              <Link href={`/produits/${i.slug}`} className="line-clamp-2 text-sm font-semibold">{i.name}</Link>
              <p className="text-sm font-bold">{fmt(i.price)}
                {i.negotiationId && <span className="ml-2 rounded-full bg-rose px-2 py-0.5 text-xs">prix négocié</span>}
              </p>
              <button onClick={() => remove(i.productId)} className="text-xs text-slate underline">Retirer</button>
            </div>
            <input type="number" min={1} value={i.qty} onChange={(e) => setQty(i.productId, +e.target.value)} className="input !w-16 text-center" />
          </div>
        ))}
        <p className="text-right text-lg font-extrabold">Total : {fmt(total)}</p>
        <p className="text-right text-xs text-slate">Le montant définitif est recalculé et vérifié par le serveur.</p>
      </div>

      <form onSubmit={pay} className="card space-y-3 p-5 md:col-span-2">
        <h2 className="font-extrabold">Livraison</h2>
        <div><label className="label">Nom complet</label><input required className="input" value={form.name} onChange={set("name")} /></div>
        <div><label className="label">Téléphone</label><input required className="input" value={form.phone} onChange={set("phone")} placeholder="6XXXXXXXX" /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label">Ville</label><input required className="input" value={form.city} onChange={set("city")} /></div>
          <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={set("email")} /></div>
        </div>
        <div><label className="label">Adresse / quartier</label><input required className="input" value={form.address} onChange={set("address")} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Envoi…" : serverReady ? `Commander · ${fmt(total)}` : `Commander sur WhatsApp · ${fmt(total)}`}</button>
        <p className="text-center text-xs text-slate">Le paiement se finalise avec le vendeur sur WhatsApp.</p>
        {serverReady && <WhatsAppButton
          label="Une question ? Écrire au vendeur"
          message={`Bonjour Zone Groupe, j'ai une question avant de commander : ${items.map((i) => `${i.qty} × ${i.name}`).join(", ")} (total ${fmt(total)}).`}
        />}
      </form>
    </div>
  );
}
