import Link from "next/link";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/container";
import { getProductsByBrand } from "@/lib/catalog";

export function OrganicEditorial() {
  const products = getProductsByBrand("Organic Pro").slice(0, 4);

  return (
    <section className="bg-black py-16 text-white md:py-24">
      <Container>
        <div className="grid items-end gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <SectionHeading
              align="left"
              tone="light"
              eyebrow="Línea exclusiva"
              title="Organic Pro"
              description="Fórmulas sin sal, activos naturales y resultados visibles para salones."
            />
            <Link
              href="/organic-pro"
              className="mt-8 inline-flex h-12 items-center rounded-btn border border-gold px-6 text-[12px] font-semibold uppercase tracking-ui text-gold hover:bg-gold hover:text-black"
            >
              Conocer la línea
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="rounded-card bg-cream p-3 text-ink">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
