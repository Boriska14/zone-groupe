"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import NegotiationChat from "./NegotiationChat";
import WhatsAppButton from "./WhatsAppButton";
import { useShop } from "./ShopContext";
import { fmt } from "@/lib/utils";

type P = { id: string; slug: string; name: string; price: number; stock: number; image?: string; negotiable: boolean };

export default function ProductActions({ product, adminAvailable }: { product: P; adminAvailable: boolean }) {
  const cart = useCart();
  const { serverReady } = useShop();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [chat, setChat] = useState(false);

  const addPlain = () => {
    cart.add({ productId: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price, qty });
    setAdded(true);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-xl border border-slate/40 bg-white">
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
          <span className="w-8 text-center text-sm font-semibold">{qty}</span>
          <button className="px-3 py-2" onClick={() => setQty((q) => Math.min(Math.max(product.stock, 1), q + 1))}>+</button>
        </div>
        <button className="btn btn-primary flex-1" disabled={product.stock === 0} onClick={addPlain}>
          Ajouter au panier
        </button>
      </div>
      {added && (
        <p className="text-sm">Ajouté. <Link href="/panier" className="font-semibold text-cyan-dark underline">Voir le panier</Link></p>
      )}
      <WhatsAppButton
        message={() => `Bonjour Zone Groupe, je suis intéressé(e) par « ${product.name} » (${fmt(product.price)}). ${window.location.href}`}
      />
      {serverReady && product.negotiable && product.stock > 0 && (
        <>
          <button className="btn btn-accent w-full" onClick={() => setChat((v) => !v)}>
            💬 {chat ? "Fermer la négociation" : "Négocier le prix"}
          </button>
          {chat && <NegotiationChat product={product} adminAvailable={adminAvailable} />}
        </>
      )}
    </div>
  );
}
