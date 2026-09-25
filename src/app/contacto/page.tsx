import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/container";
import { storeConfig } from "@/config/store";
import { generalMessage, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escribinos por WhatsApp o Instagram. Beautymax Distribuidora, Uruguay.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero eyebrow="Estamos" title="Contacto" description="Asesoramiento para profesionales y pedidos a todo el país." />
      <Container className="grid gap-8 py-12 md:grid-cols-2 md:py-16">
        <div className="space-y-6">
          <a href={whatsappUrl(generalMessage())} target="_blank" rel="noreferrer" className="block border border-ink/10 bg-white p-6 hover:border-gold-deep">
            <p className="text-[11px] font-semibold uppercase tracking-section text-ink">WhatsApp</p>
            <p className="mt-2 font-serif text-3xl text-ink">{storeConfig.whatsappDisplay}</p>
          </a>
          <a href={storeConfig.instagramUrl} target="_blank" rel="noreferrer" className="block border border-ink/10 bg-white p-6 hover:border-gold-deep">
            <p className="text-[11px] font-semibold uppercase tracking-section text-ink">Instagram</p>
            <p className="mt-2 font-serif text-3xl text-ink">{storeConfig.instagram}</p>
          </a>
        </div>
        <ContactForm />
      </Container>
    </>
  );
}
