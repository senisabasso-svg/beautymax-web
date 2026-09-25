import { Container } from "@/components/ui/container";
import { advisorMessage, whatsappUrl } from "@/lib/whatsapp";

export function ProfessionalCta() {
  return (
    <section className="bg-black text-white">
      <Container className="py-16 md:py-24">
        <div className="mx-auto max-w-3xl border border-gold/50 px-6 py-12 text-center md:px-12">
          <p className="text-[11px] font-semibold uppercase tracking-section text-gold">Cuenta profesional</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold md:text-5xl">¿Sos profesional?</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/75 md:text-base">
            Abrí tu cuenta y accedé a precios mayoristas, cuotas sin interés y asesoramiento para el salón. Escribinos y te atendemos por WhatsApp.
          </p>
          <a
            href={whatsappUrl(advisorMessage())}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex h-12 items-center rounded-btn bg-gold px-6 text-[12px] font-semibold uppercase tracking-ui text-black hover:bg-gold-deep"
          >
            Pedir precios mayoristas
          </a>
        </div>
      </Container>
    </section>
  );
}
