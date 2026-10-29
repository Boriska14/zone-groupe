"use client";
import { createContext, useContext } from "react";

const Ctx = createContext<{ whatsapp: string | null }>({ whatsapp: null });

export function ShopProvider({ whatsapp, children }: { whatsapp: string | null; children: React.ReactNode }) {
  return <Ctx.Provider value={{ whatsapp }}>{children}</Ctx.Provider>;
}
export const useShop = () => useContext(Ctx);
