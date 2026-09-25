import type { Metadata } from "next";
import { LegalArticle } from "@/components/layout/LegalArticle";
import { storeConfig } from "@/config/store";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Envíos y devoluciones",
  description: "Envíos de Beautymax a todo Uruguay por DAC o agencia, y cómo coordinar un cambio.",
};

export default function ShippingPage() {
  return (
    <LegalArticle
      title="Envíos y devoluciones"
      description="Llegamos a todo el país. El costo definitivo se confirma al armar el pedido."
    >
      <p>
        Enviamos a los 19 departamentos por DAC o agencia. También podés retirar: te confirmamos dirección y horario por WhatsApp al {storeConfig.whatsappDisplay}.
      </p>
      <h2>Costo estimado</h2>
      <p>
        El envío a domicilio tiene un costo de referencia de {formatPrice(storeConfig.shippingCost)}. A partir de {formatPrice(storeConfig.freeShippingFrom)} el envío estimado es sin costo. Ese número es una guía: el valor final depende de la zona, el peso y la agencia, y te lo confirmamos antes de despachar.
      </p>
      <h2>Plazos</h2>
      <p>
        Montevideo y el área metropolitana suelen salir en el día hábil siguiente a la confirmación del pago. El interior depende de la frecuencia de la agencia. No despachamos sábados, domingos ni feriados.
      </p>
      <h2>Devoluciones y cambios</h2>
      <ul>
        <li>Si el producto llega dañado o no coincide con el pedido, escribinos dentro de las 48 horas con fotos y el número de pedido.</li>
        <li>Los productos de color y cuidado se cambian si están cerrados y en su envase original.</li>
        <li>Las herramientas se revisan antes de un cambio. El filo y el uso profesional no se reponen si la pieza ya fue utilizada.</li>
        <li>Los gastos de retorno corren por cuenta de quien solicita el cambio, salvo error nuestro o un producto fallado.</li>
      </ul>
      <p>Esta información describe cómo trabajamos hoy. Si tu salón tiene una condición especial, la conversamos por WhatsApp.</p>
    </LegalArticle>
  );
}
