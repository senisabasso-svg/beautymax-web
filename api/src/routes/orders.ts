import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const ordersRouter = Router();

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    salon: z.string().optional(),
    department: z.string().min(1),
    city: z.string().min(2),
    address: z.string().optional(),
  }),
  delivery: z.enum(["envio", "retiro"]),
  payment: z.enum(["mercadopago", "transferencia", "whatsapp"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

function publicOrderId() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `BM-${Date.now().toString(36).toUpperCase()}-${n}`;
}

ordersRouter.post("/", async (req, res) => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Pedido inválido", details: parsed.error.flatten() });
  }

  const data = parsed.data;
  const lines: Array<{
    productId: string;
    variantId: string;
    name: string;
    brand: string;
    variantLabel: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }> = [];
  let subtotal = 0;

  for (const item of data.items) {
    const variant = await prisma.variant.findUnique({
      where: { id: item.variantId },
      include: { product: true },
    });
    if (!variant || !variant.product.active || variant.productId !== item.productId) {
      return res.status(400).json({ error: `Variante no disponible: ${item.variantId}` });
    }
    if (variant.stock < item.quantity) {
      return res.status(400).json({
        error: `Stock insuficiente para ${variant.product.name} (${variant.label})`,
      });
    }
    const lineTotal = variant.price * item.quantity;
    subtotal += lineTotal;
    lines.push({
      productId: variant.productId,
      variantId: variant.id,
      name: variant.product.name,
      brand: variant.product.brand,
      variantLabel: variant.label,
      sku: variant.sku,
      quantity: item.quantity,
      unitPrice: variant.price,
      lineTotal,
    });
  }

  let discount = 0;
  let discountPercent: number | null = null;
  let discountCode: string | null = null;
  let promoId: string | null = null;

  if (data.discountCode?.trim()) {
    const code = data.discountCode.trim().toUpperCase();
    const promo = await prisma.promoCode.findUnique({ where: { code } });
    if (!promo || promo.usedAt) {
      return res.status(400).json({ error: "El código de descuento no es válido o ya se usó" });
    }
    discountPercent = promo.percent;
    discount = Math.round((subtotal * promo.percent) / 100);
    discountCode = promo.code;
    promoId = promo.id;
  }

  const shippingCost = Number(process.env.SHIPPING_COST ?? 350);
  const freeFrom = Number(process.env.FREE_SHIPPING_FROM ?? 8000);
  const shipping =
    data.delivery === "retiro" ? 0 : subtotal - discount >= freeFrom ? 0 : shippingCost;
  const total = Math.max(0, subtotal - discount + shipping);
  const publicId = publicOrderId();

  const order = await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      await tx.variant.update({
        where: { id: line.variantId },
        data: { stock: { decrement: line.quantity } },
      });
    }

    const created = await tx.order.create({
      data: {
        publicId,
        customerName: data.customer.name,
        customerPhone: data.customer.phone,
        customerEmail: data.customer.email,
        customerSalon: data.customer.salon ?? null,
        department: data.customer.department,
        city: data.customer.city,
        address: data.customer.address ?? null,
        delivery: data.delivery,
        payment: data.payment,
        subtotal,
        discount,
        discountCode,
        discountPercent,
        shipping,
        total,
        notes: data.notes ?? null,
        items: { create: lines },
      },
      include: { items: true },
    });

    if (promoId) {
      await tx.promoCode.update({
        where: { id: promoId },
        data: { usedAt: new Date(), orderId: created.id },
      });
    }

    return created;
  });

  return res.status(201).json({
    id: order.publicId,
    total: order.total,
    discount: order.discount,
    shipping: order.shipping,
    payment: order.payment,
    createdAt: order.createdAt,
  });
});

ordersRouter.get("/", requireAuth, async (_req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return res.json(orders);
});

ordersRouter.get("/:id", requireAuth, async (req, res) => {
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: req.params.id }, { publicId: req.params.id }] },
    include: { items: true },
  });
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  return res.json(order);
});

ordersRouter.patch("/:id/status", requireAuth, async (req, res) => {
  const status = z.string().min(1).safeParse(req.body?.status);
  if (!status.success) return res.status(400).json({ error: "Status inválido" });
  const order = await prisma.order.findFirst({
    where: { OR: [{ id: req.params.id }, { publicId: req.params.id }] },
  });
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: status.data },
    include: { items: true },
  });
  return res.json(updated);
});
