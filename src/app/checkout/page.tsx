import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHero } from "@/components/layout/PageHero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Compra" title="Checkout" description="Dejanos tus datos y te confirmamos el pedido por WhatsApp." />
      <Container className="py-10 md:py-14">
        <CheckoutForm />
      </Container>
    </>
  );
}
