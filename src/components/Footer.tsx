import { waLink } from "@/lib/whatsapp";

export default function Footer({ phone, address, whatsapp }: { phone?: string; address?: string; whatsapp?: string | null }) {
  return (
    <footer className="mt-16 bg-navy text-white/80">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
        <div>
          <p className="text-lg font-extrabold text-white">ZONE <span className="text-cyan">GROUPE</span></p>
          <p className="mt-2 text-slate">Votre boutique d&apos;électronique de confiance.</p>
        </div>
        <div>
          <p className="font-semibold text-white">Paiement</p>
          <p className="mt-2">Mobile Money uniquement (via nyole)</p>
        </div>
        <div>
          <p className="font-semibold text-white">Contact</p>
          {phone && <p className="mt-2">{phone}</p>}
          {whatsapp && (
            <p className="mt-2">
              <a href={waLink(whatsapp, "Bonjour Zone Groupe, j'ai une question.") ?? "#"} target="_blank" rel="noopener noreferrer" className="font-semibold text-white underline">
                WhatsApp : +{whatsapp}
              </a>
            </p>
          )}
          {address && <p>{address}</p>}
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate">
        © {new Date().getFullYear()} Zone Groupe
      </div>
    </footer>
  );
}
