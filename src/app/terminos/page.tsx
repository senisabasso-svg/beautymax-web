import type { Metadata } from "next";
import { LegalArticle } from "@/components/layout/LegalArticle";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = {
  title: "Términos",
  description: "Condiciones de compra en la tienda online de Beautymax Distribuidora.",
};

export default function TermsPage() {
  return (
    <LegalArticle title="Términos" description="Cómo se confirma un pedido en la tienda de Beautymax.">
      <p>
        Al armar un pedido en {storeConfig.name} estás pidiendo una reserva de productos profesionales. El pedido queda confirmado cuando un asesor te lo valida por WhatsApp, con stock, precio y forma de entrega.
      </p>
      <h2>Precios</h2>
      <p>
        Los precios publicados están en pesos uruguayos e incluyen IVA cuando corresponde. Las cuentas de salón pueden tener una lista mayorista distinta: pedila por WhatsApp. Nos reservamos el derecho de corregir un error evidente de carga antes de confirmar.
      </p>
      <h2>Stock</h2>
      <p>
        El stock que ves en la tienda es orientativo. Si una presentación se agota entre que armás el pedido y lo confirmamos, te ofrecemos una alternativa o te avisamos para ajustarlo.
      </p>
      <h2>Pago</h2>
      <p>
        Podés pagar con Mercado Pago en cuotas, por transferencia o coordinando el pago por WhatsApp. El despacho se hace con el pago acreditado, salvo un acuerdo distinto con tu salón.
      </p>
      <h2>Uso profesional</h2>
      <p>
        Varios productos están pensados para peluquerías, barberías y coloristas. Seguí siempre el modo de uso de la marca y el criterio de tu cabina.
      </p>
    </LegalArticle>
  );
}
