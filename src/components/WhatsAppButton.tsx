"use client";
import { useShop } from "./ShopContext";
import { waLink } from "@/lib/whatsapp";

const Icon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.4 13.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-3-1.2-4.9-4.200-5-4.400-.1-.2-1.200-1.600-1.200-3s.7-2.100 1-2.400c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 1.900c.1.200.1.400 0 .5l-.4.600-.3.400c-.1.100-.2.300-.1.500.4.800 1.100 1.500 1.900 2 .6.400 1.100.6 1.300.7.200.100.400.100.500-.1l.7-.8c.2-.2.300-.2.500-.1l1.800.9c.200.100.400.200.400.300.1.100.1.700-.1 1.300Z" />
  </svg>
);

/** Bouton « contacter le vendeur sur WhatsApp ». Masqué tant qu'aucun numéro n'est configuré. */
export default function WhatsAppButton({
  message, label = "Contacter le vendeur sur WhatsApp", className = "btn btn-ghost w-full",
}: { message: string | (() => string); label?: string; className?: string }) {
  const { whatsapp } = useShop();
  if (!whatsapp) return null;
  const open = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Le message est calculé au clic (ex. URL courante) pour rester valable côté serveur comme côté client.
    const text = typeof message === "function" ? message() : message;
    const href = waLink(whatsapp, text);
    if (href) e.currentTarget.href = href;
  };
  return (
    <a
      href={waLink(whatsapp, typeof message === "string" ? message : "Bonjour, j'ai une question.") ?? "#"}
      onClick={open} target="_blank" rel="noopener noreferrer" className={className}
    >
      <Icon /> {label}
    </a>
  );
}

/** Pastille flottante affichée sur toutes les pages. */
export function FloatingWhatsApp() {
  const { whatsapp } = useShop();
  const href = waLink(whatsapp, "Bonjour Zone Groupe, j'ai une question.");
  if (!href) return null;
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer" aria-label="Contacter le vendeur sur WhatsApp"
      className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-card transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm4.4 13.6c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1-3-1.2-4.9-4.200-5-4.400-.1-.2-1.200-1.600-1.200-3s.7-2.100 1-2.400c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 1.900c.1.200.1.400 0 .5l-.4.600-.3.400c-.1.100-.2.300-.1.500.4.800 1.100 1.500 1.900 2 .6.400 1.100.6 1.300.7.200.100.400.100.500-.1l.7-.8c.2-.2.300-.2.500-.1l1.800.9c.200.100.400.200.400.300.1.100.1.700-.1 1.300Z" />
      </svg>
    </a>
  );
}
