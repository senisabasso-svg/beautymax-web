import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="py-16">
      <div className="mb-8 h-10 w-48 animate-pulse bg-black/5" />
      <ProductGridSkeleton />
    </Container>
  );
}
