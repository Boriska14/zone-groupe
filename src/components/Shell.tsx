import Header from "./Header";
import Footer from "./Footer";
import { ShopProvider } from "./ShopContext";
import { FloatingWhatsApp } from "./WhatsAppButton";
import { createClient } from "@/lib/supabase/server";
import { waNumber } from "@/lib/whatsapp";

export default async function Shell({ children }: { children: React.ReactNode }) {
  let shop: { phone?: string; whatsapp?: string; address?: string } = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "shop").maybeSingle();
    shop = (data?.value as typeof shop) ?? {};
  } catch {}
  // Numéro réglé dans Admin > Paramètres ; sinon NEXT_PUBLIC_WHATSAPP_NUMBER.
  const whatsapp = waNumber(shop.whatsapp) ?? waNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
  return (
    <ShopProvider whatsapp={whatsapp}>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-8">{children}</main>
      <Footer phone={shop.phone} address={shop.address} whatsapp={whatsapp} />
      <FloatingWhatsApp />
    </ShopProvider>
  );
}
