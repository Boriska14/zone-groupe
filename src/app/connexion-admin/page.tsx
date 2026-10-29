"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError("Identifiants incorrects."); setBusy(false); return; }
    window.location.href = "/admin";
  };

  return (
    <div className="grid min-h-screen place-items-center bg-navy px-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8">
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-cyan text-2xl font-extrabold text-navy">Z</span>
          <h1 className="mt-3 text-xl font-extrabold">Espace administrateur</h1>
          <p className="text-sm text-slate">Zone Groupe</p>
        </div>
        <div><label className="label">Email</label><input type="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="label">Mot de passe</label><input type="password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn btn-primary w-full" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
      </form>
    </div>
  );
}
