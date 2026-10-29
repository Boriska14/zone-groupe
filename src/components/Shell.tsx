import Header from "./Header";
import Footer from "./Footer";
import { createClient } from "@/lib/supabase/server";

export default async function Shell({ children }: { children: React.ReactNode }) {
  let shop: { phone?: string; address?: string } = {};
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("settings").select("value").eq("key", "shop").maybeSingle();
    shop = (data?.value as typeof shop) ?? {};
  } catch {}
  return (
    <>
      <Header />
      <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-8">{children}</main>
      <Footer phone={shop.phone} address={shop.address} />
    </>
  );
}
