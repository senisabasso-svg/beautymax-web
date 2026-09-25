import type { Metadata } from "next";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/container";
import { getProductsByBrand } from "@/lib/catalog";
import { advisorMessage, whatsappUrl } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Organic Pro",
  description: "Línea exclusiva de Beautymax. Fórmulas sin sal, activos naturales y resultados visibles para salones.",
};

const points = [
  { title: "Sin sal", text: "Fórmulas pensadas para el lavado frecuente de cabina, sin castigar el cuero cabelludo." },
  { title: "Activos naturales", text: "Cuidado de salón con una lectura más suave para el cabello trabajado." },
  { title: "Resultado visible", text: "Brillo, cuerpo y control del tono para que la clienta lo note al salir." },
];

export default function OrganicPage() {
  const products = getProductsByBrand("Organic Pro");

  return (
    <>
      <section className="bg-black text-white">
        <Container className="py-20 md:py-28">
          <p className="text-[11px] font-semibold uppercase tracking-section text-gold">Exclusivo Beautymax</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-semibold leading-tight md:text-7xl">Organic Pro</h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/75">
            Fórmulas sin sal, activos naturales y resultados visibles para salones. La línea que Beautymax trabaja en exclusiva para el profesional uruguayo.
          </p>
        </Container>
      </section>
      <section className="bg-cream">
        <Container className="grid gap-8 py-16 md:grid-cols-3 md:py-20">
          {points.map((point) => (
            <article key={point.title}>
              <div className="gold-line h-px w-12" />
              <h2 className="mt-4 font-serif text-3xl text-ink">{point.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{point.text}</p>
            </article>
          ))}
        </Container>
      </section>
      <section className="bg-white py-16 md:py-24">
        <Container>
          <h2 className="font-serif text-4xl text-ink md:text-5xl">La línea</h2>
          <div className="mt-10">
            <ProductGrid products={products} />
          </div>
          <a
            href={whatsappUrl(advisorMessage())}
            target="_blank"
            rel="noreferrer"
            className="mt-12 inline-flex h-12 items-center rounded-btn bg-gold px-6 text-[12px] font-semibold uppercase tracking-ui text-black hover:bg-gold-deep"
          >
            Consultar precios de salón
          </a>
        </Container>
      </section>
    </>
  );
}
