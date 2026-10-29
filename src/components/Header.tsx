"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function Header() {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-30 bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan text-navy">Z</span>
          ZONE <span className="text-cyan">GROUPE</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href="/produits" className="hover:text-cyan">Boutique</Link>
          <Link href="/panier" className="relative rounded-xl bg-white/10 px-3.5 py-2 hover:bg-white/20">
            Panier
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1 text-xs font-bold text-navy">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
