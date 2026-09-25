export type PaymentId = "mercadopago" | "transferencia" | "whatsapp";
export type DeliveryId = "envio" | "retiro";

function resolveSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  try {
    return new URL(raw).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const storeConfig = {
  name: "Beautymax Distribuidora",
  shortName: "Beautymax",
  tagline: "Exclusividad total al profesional",
  description:
    "Distribuidora uruguaya de productos profesionales de peluquería y barbería. Más de 40 años con exclusividad total al profesional.",
  locale: "es-UY",
  currency: "UYU",
  whatsappDisplay: "+598 97 428 888",
  whatsappE164: "59897428888",
  instagram: "@beautymaxuy",
  instagramHandle: "beautymaxuy",
  instagramUrl: "https://instagram.com/beautymaxuy",
  /** TODO precio real — monto a partir del cual el envío estimado es gratis */
  freeShippingFrom: 8000,
  /** TODO precio real — costo estimado de envío a domicilio por DAC o agencia */
  shippingCost: 350,
  topBar: [
    "Pagá en cuotas sin interés",
    "Asesoramiento para profesionales",
    "Envíos a todo Uruguay",
  ],
  payments: [
    {
      id: "mercadopago" as PaymentId,
      label: "Mercado Pago",
      description: "Tarjetas en cuotas sin interés",
    },
    {
      id: "transferencia" as PaymentId,
      label: "Transferencia bancaria",
      description: "Te pasamos los datos al confirmar el pedido",
    },
    {
      id: "whatsapp" as PaymentId,
      label: "Coordinar por WhatsApp",
      description: "Un asesor te confirma el pago",
    },
  ],
  deliveries: [
    {
      id: "envio" as DeliveryId,
      label: "Envío a domicilio",
      description: "DAC o agencia a todo el país",
    },
    {
      id: "retiro" as DeliveryId,
      label: "Retiro",
      description: "Coordinamos dirección y horario por WhatsApp",
    },
  ],
  siteUrl: resolveSiteUrl(),
  enableMercadoPago: process.env.NEXT_PUBLIC_ENABLE_MP === "true",
  /** Ruleta de descuento al entrar: segmentos 10% y 20% */
  discountWheel: {
    enabled: true,
    title: "Girá para obtener códigos de descuento",
    subtitle: "Cada código es de un solo uso. Aplicálo en el carrito al pagar.",
  },
} as const;

export const navLinks = [
  { href: "/tienda", label: "Tienda" },
  { href: "/organic-pro", label: "Organic Pro" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/marcas", label: "Marcas" },
  { href: "/contacto", label: "Contacto" },
] as const;

export const toolCategories = ["tijeras", "maquinas", "secadores", "planchas"] as const;
