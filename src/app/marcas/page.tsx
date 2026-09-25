import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/container";
import { getBrands, getProductsByBrand } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Marcas",
  description: "Organic Pro, Pro You, Plasma, Wella Professionals, Revlon Professional, Silkey y Kiepe Italia.",
};

export default function BrandsPage() {
  const brands = getBrands();

  return (
    <>
      <PageHero eyebrow="Originales" title="Marcas" description="Las líneas que Beautymax distribuye para el trabajo de salón." />
      <Container className="grid gap-4 py-12 md:grid-cols-2 md:py-16">
        {brands.map((brand) => (
          <Link key={brand.slug} href={`/marca/${brand.slug}`} className="group border border-ink/10 bg-white p-6 hover:border-gold-deep">
            <p className="font-serif text-3xl text-ink group-hover:text-gold-deep">{brand.name}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">{brand.description}</p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-ui text-ink">
              {getProductsByBrand(brand.name).length} productos
            </p>
          </Link>
        ))}
      </Container>
    </>
  );
}
