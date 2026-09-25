import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Catalog } from "@/components/shop/Catalog";
import { Container } from "@/components/ui/container";
import { getBrandBySlug, getBrands, getProductsByBrand, loadCatalog } from "@/lib/catalog";

type Params = { slug: string };

export function generateStaticParams() {
  return getBrands().map((brand) => ({ slug: brand.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return {};
  return { title: brand.name, description: brand.description };
}

export default async function BrandPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();
  await loadCatalog();

  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <ProductGridSkeleton />
        </Container>
      }
    >
      <Catalog products={getProductsByBrand(brand.name)} eyebrow="Marca" title={brand.name} description={brand.description} />
    </Suspense>
  );
}
