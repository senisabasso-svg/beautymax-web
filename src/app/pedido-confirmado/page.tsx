import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/checkout/OrderConfirmation";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Gracias" title="Pedido armado" description="El resumen quedó listo para coordinar con Beautymax." />
      <Container className="py-10 md:py-14">
        <OrderConfirmation />
      </Container>
    </>
  );
}
