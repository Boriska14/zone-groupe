"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ImageUploader({ initial }: { initial: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError("");
    const supabase = createClient();
    const added: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/") || f.size > 5 * 1024 * 1024) { setError("Images uniquement, 5 Mo max."); continue; }
      const ext = f.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("products").upload(path, f, { contentType: f.type });
      if (error) { setError(error.message); continue; }
      added.push(supabase.storage.from("products").getPublicUrl(path).data.publicUrl);
    }
    setUrls((u) => [...u, ...added]);
    setBusy(false);
  };

  return (
    <div>
      <label className="label">Images (la première est l&apos;image principale)</label>
      <input type="hidden" name="images" value={urls.join("\n")} />
      <div className="flex flex-wrap gap-3">
        {urls.map((u) => (
          <div key={u} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate/30 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-contain" />
            <button type="button" onClick={() => setUrls((x) => x.filter((y) => y !== u))}
              className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-navy text-xs text-white">×</button>
          </div>
        ))}
        <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate/50 text-center text-xs text-slate hover:border-cyan">
          {busy ? "…" : "+ Ajouter"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
