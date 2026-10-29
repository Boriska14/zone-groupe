"use client";
import { createContext, useContext } from "react";

type Shop = { whatsapp: string | null; serverReady: boolean };
const Ctx = createContext<Shop>({ whatsapp: null, serverReady: false });

/** serverReady : la clé serveur existe (commandes en base + négociation). Sinon : commande par WhatsApp. */
export function ShopProvider({ whatsapp, serverReady, children }: Shop & { children: React.ReactNode }) {
  return <Ctx.Provider value={{ whatsapp, serverReady }}>{children}</Ctx.Provider>;
}
export const useShop = () => useContext(Ctx);
