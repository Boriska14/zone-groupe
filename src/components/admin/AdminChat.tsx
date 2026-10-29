"use client";
import { useCallback, useEffect, useState } from "react";
import { fmt } from "@/lib/utils";

type Msg = { id: string; sender: string; content: string };
type Data = {
  negotiation: { id: string; mode: string; status: string; agreed_price: number | null; products: { name: string; price: number } };
  min: number | null;
  messages: Msg[];
};

export default function AdminChat({ id }: { id: string }) {
  const [d, setD] = useState<Data | null>(null);
  const [text, setText] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/negotiations/${id}`);
    if (r.ok) setD(await r.json());
  }, [id]);
  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t); }, [load]);

  const act = async (payload: Record<string, unknown>) => {
    setError("");
    const r = await fetch(`/api/admin/negotiations/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) setError(j.error || "Erreur");
    else { setText(""); load(); }
  };

  if (!d) return <p className="text-slate">Chargement…</p>;
  const n = d.negotiation;
  const priceNum = parseInt(price.replace(/\s/g, ""), 10);
  const belowFloor = d.min != null && priceNum > 0 && priceNum < d.min;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-navy px-4 py-3 text-white">
        <div>
          <p className="font-semibold">{n.products.name}</p>
          <p className="text-xs text-slate">Prix {fmt(n.products.price)} · Plancher {d.min != null ? fmt(d.min) : "non défini"}</p>
        </div>
        <div className="text-xs">
          <span className="rounded-full bg-white/10 px-2 py-1">{n.mode === "admin" ? "Gérant" : "Assistant"}</span>{" "}
          <span className="rounded-full bg-cyan px-2 py-1 font-bold text-navy">{n.status === "accepted" ? `Accepté ${fmt(n.agreed_price!)}` : n.status === "open" ? "Ouverte" : "Clôturée"}</span>
        </div>
      </div>
      <div className="h-72 space-y-2 overflow-y-auto bg-mist/60 p-3">
        {d.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "customer" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
              m.sender === "customer" ? "bg-cyan text-navy" : m.sender === "admin" ? "bg-navy text-white" : m.sender === "system" ? "bg-rose text-xs" : "bg-white"}`}>
              <p className="text-[10px] font-bold uppercase opacity-60">{m.sender === "customer" ? "Client" : m.sender === "bot" ? "Assistant" : m.sender === "admin" ? "Vous" : "Système"}</p>
              {m.content}
            </div>
          </div>
        ))}
      </div>
      {n.status === "open" && (
        <div className="space-y-3 border-t border-mist p-3">
          <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) act({ action: "reply", text }); }} className="flex gap-2">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Répondre au client…" />
            <button className="btn btn-primary">Envoyer</button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <input className="input !w-40" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Prix final" inputMode="numeric" />
            <button className="btn btn-accent" onClick={() => priceNum > 0 && act({ action: "accept", price: priceNum })}>Accepter ce prix</button>
            {n.mode === "admin" && <button className="btn btn-ghost" onClick={() => act({ action: "bot" })}>Rendre la main à l&apos;assistant</button>}
            <button className="btn bg-rose text-navy" onClick={() => act({ action: "close" })}>Clôturer</button>
          </div>
          {belowFloor && <p className="text-xs font-semibold text-red-600">Attention : ce prix est sous votre plancher ({fmt(d.min!)}).</p>}
        </div>
      )}
      {error && <p className="px-3 pb-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
