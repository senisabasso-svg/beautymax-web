import type { Metadata } from "next";
import { CartPage } from "@/components/cart/CartPage";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Carrito",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Compra" title="Carrito" description="Revisá las presentaciones antes de confirmar el pedido." />
      <Container className="py-10 md:py-14">
        <CartPage />
      </Container>
    </>
  );
}
