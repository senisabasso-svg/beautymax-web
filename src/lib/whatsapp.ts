import { storeConfig, type DeliveryId, type PaymentId } from "@/config/store";
import { formatPrice } from "@/lib/format";

export function whatsappUrl(message: string) {
  return `https://wa.me/${storeConfig.whatsappE164}?text=${encodeURIComponent(message)}`;
}

export function productInquiryMessage(name: string, variant: string) {
  return `Hola Beautymax, quiero consultar por ${name} (${variant}).`;
}

export function advisorMessage() {
  return "Hola Beautymax, soy profesional y quiero asesoramiento y precios mayoristas.";
}

export function generalMessage() {
  return "Hola Beautymax, quiero hacer una consulta.";
}

export interface OrderLine {
  name: string;
  brand: string;
  variant: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface OrderPayload {
  id: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    salon?: string;
    department: string;
    city: string;
    address: string;
  };
  delivery: DeliveryId;
  payment: PaymentId;
  lines: OrderLine[];
  subtotal: number;
  discount?: number;
  discountCode?: string;
  discountPercent?: number;
  shipping: number;
  total: number;
}

const deliveryLabel: Record<DeliveryId, string> = {
  envio: "Envío a domicilio (DAC / agencia)",
  retiro: "Retiro en local",
};

const paymentLabel: Record<PaymentId, string> = {
  mercadopago: "Mercado Pago (tarjetas en cuotas)",
  transferencia: "Transferencia bancaria",
  whatsapp: "Coordinar por WhatsApp",
};

export function buildOrderMessage(order: OrderPayload) {
  const lines = order.lines
    .map((line) => {
      const sku = line.sku ? ` · SKU ${line.sku}` : "";
      return `• ${line.name} — ${line.variant} × ${line.quantity} — ${formatPrice(line.lineTotal)}${sku}`;
    })
    .join("\n");

  const salon = order.customer.salon?.trim()
    ? `\nSalón: ${order.customer.salon.trim()}`
    : "";

  return [
    `*Pedido ${order.id} — ${storeConfig.name}*`,
    "",
    "*Cliente*",
    `Nombre: ${order.customer.name}`,
    `Celular: ${order.customer.phone}`,
    `Email: ${order.customer.email}${salon}`,
    "",
    "*Entrega*",
    deliveryLabel[order.delivery],
    order.delivery === "envio"
      ? `${order.customer.address}, ${order.customer.city}, ${order.customer.department}`
      : `${order.customer.city}, ${order.customer.department}`,
    "",
    "*Pago*",
    paymentLabel[order.payment],
    "",
    "*Productos*",
    lines,
    "",
    "*Resumen*",
    `Subtotal: ${formatPrice(order.subtotal)}`,
    order.discount && order.discount > 0
      ? `Descuento${order.discountCode ? ` (${order.discountCode} · ${order.discountPercent}%)` : ""}: -${formatPrice(order.discount)}`
      : null,
    `Envío: ${order.shipping === 0 ? "Sin costo" : formatPrice(order.shipping)}`,
    `Total: ${formatPrice(order.total)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function createOrderId() {
  const stamp = new Date();
  const date = [
    stamp.getFullYear(),
    String(stamp.getMonth() + 1).padStart(2, "0"),
    String(stamp.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BM-${date}-${suffix}`;
}
