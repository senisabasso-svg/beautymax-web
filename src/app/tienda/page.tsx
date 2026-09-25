import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Catalog } from "@/components/shop/Catalog";
import { Container } from "@/components/ui/container";
import { loadCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Catálogo profesional de coloración, tratamientos y herramientas para salones en Uruguay.",
};

export default async function TiendaPage() {
  const products = await loadCatalog();
  return (
    <Suspense
      fallback={
        <Container className="py-16">
          <ProductGridSkeleton />
        </Container>
      }
    >
      <Catalog
        products={products}
        eyebrow="Catálogo"
        title="Tienda"
        description="Color, decoloración, tratamientos y herramientas para peluquerías, barberías y coloristas."
      />
    </Suspense>
  );
}
