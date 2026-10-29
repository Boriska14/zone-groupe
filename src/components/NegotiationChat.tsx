"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCart, getSessionToken } from "@/lib/cart";
import { fmt } from "@/lib/utils";

type Msg = { id: string; sender: "customer" | "bot" | "admin" | "system"; content: string };
type State = { id: string; mode: "bot" | "admin"; status: "open" | "accepted" | "closed"; agreed_price: number | null; adminAvailable: boolean };
type P = { id: string; slug: string; name: string; price: number; image?: string };

export default function NegotiationChat({ product, adminAvailable }: { product: P; adminAvailable: boolean }) {
  const cart = useCart();
  const [state, setState] = useState<State | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const token = useRef("");
  const bottom = useRef<HTMLDivElement>(null);

  const apply = (d: { negotiation: State; messages: Msg[] }) => {
    setState(d.negotiation);
    setMsgs(d.messages);
  };

  useEffect(() => {
    token.current = getSessionToken();
    fetch("/api/negotiations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, token: token.current }),
    })
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : apply(d)))
      .catch(() => setError("Connexion impossible."));
  }, [product.id]);

  // Rafraîchissement régulier (réponses du gérant)
  const poll = useCallback(async () => {
    if (!state) return;
    const r = await fetch(`/api/negotiations/${state.id}?token=${token.current}`);
    if (r.ok) apply(await r.json());
  }, [state?.id]);
  useEffect(() => {
    if (!state || state.status === "closed") return;
    const t = setInterval(poll, 3000);
    return () => clearInterval(t);
  }, [state?.id, state?.status, poll]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [msgs.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state || !text.trim() || busy) return;
    setBusy(true); setError("");
    const r = await fetch(`/api/negotiations/${state.id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.current, text }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.error) return setError(d.error);
    setText("");
    apply(d);
  };

  const handoff = async () => {
    if (!state) return;
    const r = await fetch(`/api/negotiations/${state.id}/handoff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token.current }),
    });
    const d = await r.json();
    if (d.error) setError(d.error); else apply(d);
  };

  const addNegotiated = () => {
    if (!state?.agreed_price) return;
    cart.add({
      productId: product.id, slug: product.slug, name: product.name, image: product.image,
      price: state.agreed_price, qty: 1, negotiationId: state.id,
    });
    setAdded(true);
  };

  const accepted = state?.status === "accepted" && state.agreed_price;

  return (
    <div className="card overflow-hidden border border-cyan/40">
      <div className="flex items-center justify-between bg-navy px-4 py-2.5 text-sm text-white">
        <span className="font-semibold">Négociation · {state?.mode === "admin" ? "Gérant" : "Assistant"}</span>
        <span className="text-xs text-slate">Prix affiché {fmt(product.price)}</span>
      </div>
      <div className="h-64 space-y-2 overflow-y-auto bg-mist/60 p-3">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.sender === "customer" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
              m.sender === "customer" ? "bg-cyan text-navy"
              : m.sender === "admin" ? "bg-navy text-white"
              : m.sender === "system" ? "bg-rose text-navy text-xs"
              : "bg-white text-navy"}`}>
              {m.sender === "admin" && <p className="mb-0.5 text-[10px] font-bold uppercase text-cyan">Gérant</p>}
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottom} />
      </div>

      {accepted ? (
        <div className="space-y-2 border-t border-mist p-3">
          <p className="text-sm font-semibold">Prix accepté : {fmt(state!.agreed_price!)} (valable 24 h)</p>
          <button className="btn btn-primary w-full" onClick={addNegotiated}>Ajouter au panier à ce prix</button>
          {added && <p className="text-sm text-cyan-dark">Ajouté au panier.</p>}
        </div>
      ) : state?.status === "closed" ? (
        <p className="border-t border-mist p-3 text-sm text-slate">Négociation terminée.</p>
      ) : (
        <form onSubmit={send} className="space-y-2 border-t border-mist p-3">
          <div className="flex gap-2">
            <input className="input" value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Ex. : je propose 45 000 FCFA" disabled={!state} />
            <button className="btn btn-primary" disabled={busy || !state}>Envoyer</button>
          </div>
          {state?.mode === "bot" && (adminAvailable || state.adminAvailable) && (
            <button type="button" onClick={handoff} className="text-xs font-semibold text-cyan-dark underline">
              Parler au gérant (disponible)
            </button>
          )}
        </form>
      )}
      {error && <p className="px-3 pb-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
