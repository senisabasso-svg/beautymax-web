import type { Metadata } from "next";
import { LegalArticle } from "@/components/layout/LegalArticle";
import { storeConfig } from "@/config/store";

export const metadata: Metadata = {
  title: "Privacidad",
  description: "Qué datos usa Beautymax para tomar un pedido y cómo los cuidamos.",
};

export default function PrivacyPage() {
  return (
    <LegalArticle title="Privacidad" description="Usamos tus datos para preparar el pedido y nada más.">
      <p>
        Cuando completás el checkout o el formulario de contacto, te pedimos nombre, celular, email y, si corresponde, el nombre del salón y la dirección de entrega.
      </p>
      <h2>Para qué los usamos</h2>
      <ul>
        <li>Armar y confirmar el pedido por WhatsApp.</li>
        <li>Coordinar el envío o el retiro.</li>
        <li>Responder una consulta de producto o de cuenta profesional.</li>
      </ul>
      <h2>Con quién se comparten</h2>
      <p>
        El mensaje del pedido se envía al WhatsApp de Beautymax ({storeConfig.whatsappDisplay}). Si elegís Mercado Pago, los datos de pago los procesa Mercado Pago con sus propias condiciones. No vendemos tu información.
      </p>
      <h2>El carrito en tu navegador</h2>
      <p>
        El carrito se guarda en tu dispositivo para que no se borre si cerrás la pestaña. No incluye tus datos de contacto hasta que completás el checkout.
      </p>
      <h2>Consultas</h2>
      <p>
        Si querés corregir o eliminar un dato de un pedido, escribinos por WhatsApp o por Instagram {storeConfig.instagram}.
      </p>
    </LegalArticle>
  );
}
