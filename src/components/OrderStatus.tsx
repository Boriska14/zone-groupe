"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmt } from "@/lib/utils";
import WhatsAppButton from "./WhatsAppButton";

type O = { id: string; status: string; total: number };
const LABEL: Record<string, string> = {
  pending: "En attente de paiement", paid: "Paiement reçu — merci !", failed: "Paiement échoué",
  shipped: "Commande expédiée", delivered: "Commande livrée", cancelled: "Commande annulée",
};

export default function OrderStatus({ id }: { id: string }) {
  const [o, setO] = useState<O | null>(null);
  const [missing, setMissing] = useState(false);

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
      <WhatsAppButton
        className="btn btn-ghost mt-5 w-full"
        message={`Bonjour Zone Groupe, je vous écris au sujet de ma commande ${o.id.slice(0, 8)} (${fmt(o.total)}).`}
      />
      <Link href="/produits" className="btn btn-ghost mt-3 w-full">Continuer mes achats</Link>
    </div>
  );
}
