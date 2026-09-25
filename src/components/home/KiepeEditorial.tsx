import Link from "next/link";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/container";
import { getProducts } from "@/lib/catalog";

const points = ["Acero japonés", "Filo de navaja", "Modelo para zurdos", "Calidad 4 estrellas"];

export function KiepeEditorial() {
  const products = getProducts().filter((product) => product.brand === "Kiepe Italia").slice(0, 4);

  return (
    <section className="bg-cream py-16 md:py-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Herramientas"
              title="Kiepe Italia"
              description="Tijeras y máquinas Hepike by Kiepe para el corte de todos los días."
            />
            <ul className="mt-8 space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-center gap-3 text-sm text-ink">
                  <span className="gold-line h-px w-8" />
                  {point}
                </li>
              ))}
            </ul>
            <Link href="/herramientas" className="mt-8 inline-flex text-[12px] font-semibold uppercase tracking-ui text-ink underline decoration-gold decoration-2 underline-offset-4">
              Ver herramientas
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-2">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
