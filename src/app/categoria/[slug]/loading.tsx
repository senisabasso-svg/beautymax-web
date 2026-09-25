import { ProductGridSkeleton } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="py-16">
      <ProductGridSkeleton />
    </Container>
  );
}
