import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Container } from "@/components/ui/container";
import { navLinks, storeConfig } from "@/config/store";

const legal = [
  { href: "/envios", label: "Envíos y devoluciones" },
  { href: "/terminos", label: "Términos" },
  { href: "/privacidad", label: "Privacidad" },
  { href: "/contacto", label: "Contacto" },
];

export function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="gold-line h-px w-full" />
      <Container className="grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Logo />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">{storeConfig.tagline}. Más de 40 años junto al salón profesional en Uruguay.</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-section text-gold">Tienda</p>
          <ul className="mt-4 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/75 hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-section text-gold">Ayuda</p>
          <ul className="mt-4 space-y-2">
            {legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-white/75 hover:text-gold">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-section text-gold">Contacto</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>
              <a className="hover:text-gold" href={`https://wa.me/${storeConfig.whatsappE164}`} target="_blank" rel="noreferrer">
                WhatsApp {storeConfig.whatsappDisplay}
              </a>
            </li>
            <li>
              <a className="hover:text-gold" href={storeConfig.instagramUrl} target="_blank" rel="noreferrer">
                Instagram {storeConfig.instagram}
              </a>
            </li>
          </ul>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-section text-gold">Medios de pago</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {storeConfig.payments.map((payment) => (
              <li key={payment.id} className="border border-white/20 px-2 py-1 text-[10px] uppercase tracking-ui text-white/80">
                {payment.label}
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <Container className="border-t border-white/10 py-5 text-xs text-white/50">
        © {new Date().getFullYear()} {storeConfig.name}. Todos los derechos reservados.
      </Container>
    </footer>
  );
}
