"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/utils";

type O = { id: string; status: string; total: number };
const LABEL: Record<string, string> = {
  pending: "En attente de paiement", paid: "Paiement reçu — merci !", failed: "Paiement échoué",
  shipped: "Commande expédiée", delivered: "Commande livrée", cancelled: "Commande annulée",
};

export default function OrderStatus({ id }: { id: string }) {
  const [o, setO] = useState<O | null>(null);
  const [missing, setMissing] = useState(false);
  const mock = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("mock");

  const load = async () => {
    const r = await fetch(`/api/orders/${id}`);
    if (!r.ok) return setMissing(true);
    setO(await r.json());
  };
  useEffect(() => {
    load();
    const t = setInterval(() => { if (!o || o.status === "pending") load(); }, 4000);
    return () => clearInterval(t);
  }, [id, o?.status]);

  const simulate = async () => { await fetch(`/api/orders/${id}`, { method: "POST" }); load(); };

  if (missing) return <p className="text-center text-slate">Commande introuvable.</p>;
  if (!o) return <p className="text-center text-slate">Chargement…</p>;
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">Commande {o.id.slice(0, 8)}</p>
      <h1 className="mt-2 text-2xl font-extrabold">{LABEL[o.status] ?? o.status}</h1>
      <p className="mt-2 text-lg font-bold text-cyan-dark">{fmt(o.total)}</p>
      {o.status === "pending" && (
        <p className="mt-3 text-sm text-slate">Validez le paiement sur votre téléphone (code PIN). Cette page se met à jour automatiquement.</p>
      )}
      {o.status === "pending" && mock && (
        <button onClick={simulate} className="btn btn-accent mt-5">Simuler le paiement (mode test)</button>
      )}
      <Link href="/produits" className="btn btn-ghost mt-6">Continuer mes achats</Link>
    </div>
  );
}
