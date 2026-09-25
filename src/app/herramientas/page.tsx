import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Catalog } from "@/components/shop/Catalog";
import { Container } from "@/components/ui/container";
import { toolCategories } from "@/config/store";
import { getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Herramientas",
  description: "Tijeras y máquinas Kiepe Italia. Acero japonés, filo navaja y modelo para zurdos.",
};

export default function HerramientasPage() {
  const tools = new Set<string>(toolCategories);
  const products = getProducts().filter((product) => tools.has(product.category));

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
        eyebrow="Kiepe Italia"
        title="Herramientas"
        description="Tijeras de acero japonés, filo de navaja y máquinas Hepike by Kiepe. También podés consultar secadores y planchas con un asesor."
      />
    </Suspense>
  );
}
