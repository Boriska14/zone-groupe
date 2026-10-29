"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image?: string;
  price: number; // prix affiché (indicatif) — le serveur recalcule toujours
  qty: number;
  negotiationId?: string;
};

type Ctx = {
  items: CartItem[];
  count: number;
  total: number;
  add: (item: CartItem) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "zg_cart";

export function getSessionToken() {
  let t = localStorage.getItem("zg_token");
  if (!t) {
    t = crypto.randomUUID();
    localStorage.setItem("zg_token", t);
  }
  return t;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem(KEY) || "[]"));
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = (item: CartItem) =>
    setItems((cur) => {
      const i = cur.findIndex((c) => c.productId === item.productId);
      if (i === -1) return [...cur, item];
      const next = [...cur];
      // un prix négocié remplace le précédent ; sinon on cumule la quantité
      next[i] = item.negotiationId
        ? { ...item, qty: next[i].qty }
        : { ...next[i], qty: next[i].qty + item.qty };
      return next;
    });
  const setQty = (productId: string, qty: number) =>
    setItems((cur) => cur.map((c) => (c.productId === productId ? { ...c, qty: Math.max(1, qty) } : c)));
  const remove = (productId: string) => setItems((cur) => cur.filter((c) => c.productId !== productId));
  const clear = () => setItems([]);

  return (
    <CartCtx.Provider
      value={{
        items,
        count: items.reduce((s, i) => s + i.qty, 0),
        total: items.reduce((s, i) => s + i.qty * i.price, 0),
        add, setQty, remove, clear,
      }}
    >
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart hors CartProvider");
  return c;
}
