import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { getBrands } from "@/lib/catalog";

export function BrandsRow() {
  const brands = getBrands();

  return (
    <section id="marcas" className="bg-white py-16 md:py-24">
      <Container>
        <SectionHeading eyebrow="Marcas" title="Originales, de salón" description="Trabajamos las líneas que ya usás en la cabina." />
        <ul className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
          {brands.map((brand) => (
            <li key={brand.slug}>
              <Link
                href={`/marca/${brand.slug}`}
                className="font-serif text-2xl text-muted transition-colors hover:text-ink md:text-3xl"
              >
                {brand.name}
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
