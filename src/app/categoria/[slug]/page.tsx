import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Catalog } from "@/components/shop/Catalog";
import { Container } from "@/components/ui/container";
import { getCategories, loadCatalog, loadCategories, getProductsByCategory } from "@/lib/catalog";

type Params = { slug: string };

export function generateStaticParams() {
  return getCategories().map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const categories = await loadCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) return {};
  return { title: category.name, description: category.description };
}

export default async function CategoryPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const categories = await loadCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  await loadCatalog();

  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <ProductGridSkeleton />
        </Container>
      }
    >
      <Catalog
        products={getProductsByCategory(category.slug)}
        eyebrow={category.eyebrow}
        title={category.name}
        description={category.description}
        lockedCategory={category.slug}
      />
    </Suspense>
  );
}
