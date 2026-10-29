"use client";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton({ light }: { light?: boolean }) {
  const out = async () => {
    await createClient().auth.signOut();
    window.location.href = "/connexion-admin";
  };
  return (
    <button onClick={out} className={`btn w-full ${light ? "btn-ghost" : "bg-white/10 text-white hover:bg-white/20"}`}>
      Se déconnecter
    </button>
  );
}
