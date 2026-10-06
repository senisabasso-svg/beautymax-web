import type { Client, Order, OrderItem, Variant } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { assertEmOrderConfigured, getEmConfig } from "./config.js";
import { createPedido } from "./client.js";
import type { EmDoc, EmDocItem } from "./types.js";

type OrderWithRelations = Order & {
  items: OrderItem[];
  client: Client | null;
};

function guessTipoDoc(document: string) {
  const digits = document.replace(/\D/g, "");
  // Heurística Uruguay: RUT suele ser más largo que CI.
  if (digits.length >= 11) return 0;
  if (digits.length >= 6) return 1;
  return 3;
}

function impuestoFromEnv() {
  const codigo = Number(process.env.EM_DEFAULT_IMPUESTO_CODIGO ?? 2);
  const tasa = Number(process.env.EM_DEFAULT_IMPUESTO_TASA ?? 22);
  return {
    impuestoCodigo: Number.isFinite(codigo) ? codigo : 2,
    impuestoTasa: Number.isFinite(tasa) ? tasa : 22,
  };
}

async function resolveArticuloId(item: OrderItem): Promise<{ articuloId: number; codigo: string } | null> {
  let variant: Variant | null = null;
  if (item.variantId) {
    variant = await prisma.variant.findUnique({ where: { id: item.variantId } });
  }
  const emId = variant?.emArticuloId;
  const codigo = (variant?.sku || item.sku || "").trim();
  if (emId && Number.isFinite(Number(emId))) {
    return { articuloId: Number(emId), codigo: codigo || emId };
  }
  if (codigo) {
    const bySku = await prisma.variant.findFirst({
      where: { sku: codigo, emArticuloId: { not: null } },
    });
    if (bySku?.emArticuloId) {
      return { articuloId: Number(bySku.emArticuloId), codigo };
    }
    const byProduct = await prisma.product.findFirst({
      where: { emCodigo: codigo, emArticuloId: { not: null } },
      select: { emArticuloId: true },
    });
    if (byProduct?.emArticuloId) {
      return { articuloId: Number(byProduct.emArticuloId), codigo };
    }
  }
  return null;
}

function buildReceptor(order: OrderWithRelations, guestAsGeneric: boolean) {
  const client = order.client;
  if (client) {
    return {
      clienteGenerico: false,
      clienteId: client.emClienteId ? Number(client.emClienteId) || 0 : 0,
      clienteCodigo: client.emCodigo ?? "",
      clienteNombre: client.name,
      receptorTipoDoc: guessTipoDoc(client.document),
      receptorRazon: client.salonName || client.name,
      receptorRut: client.document,
      receptorDireccion: client.address,
      receptorCiudad: client.city,
      receptorPais: "UY",
      receptorMail: client.email ?? order.customerEmail,
      receptorTel: client.phone || order.customerPhone,
    };
  }

  if (guestAsGeneric) {
    return {
      clienteGenerico: true,
      clienteId: 0,
      clienteCodigo: "",
      clienteNombre: "",
      receptorTipoDoc: 0,
      receptorRazon: "",
      receptorRut: "",
      receptorDireccion: "",
      receptorCiudad: "",
      receptorPais: "",
      receptorMail: "",
      receptorTel: "",
    };
  }

  return {
    clienteGenerico: false,
    clienteId: 0,
    clienteCodigo: "",
    clienteNombre: order.customerName,
    receptorTipoDoc: 3,
    receptorRazon: order.customerSalon || order.customerName,
    receptorRut: "",
    receptorDireccion: order.address ?? "",
    receptorCiudad: order.city,
    receptorPais: "UY",
    receptorMail: order.customerEmail,
    receptorTel: order.customerPhone,
  };
}

export async function pushOrderToEm(orderId: string) {
  const config = getEmConfig();
  assertEmOrderConfigured(config);

  const order = await prisma.order.findFirst({
    where: { OR: [{ id: orderId }, { publicId: orderId }] },
    include: { items: true, client: true },
  });
  if (!order) throw new Error("Pedido no encontrado");

  if (order.emNroDoc && order.emSyncStatus === "synced") {
    return {
      skipped: true as const,
      reason: "El pedido ya fue enviado a Easy Management",
      order,
    };
  }

  const discountPercent =
    order.discountPercent ??
    (order.subtotal > 0 ? Math.round((order.discount / order.subtotal) * 10000) / 100 : 0);
  const { impuestoCodigo, impuestoTasa } = impuestoFromEnv();

  const detalle: EmDocItem[] = [];
  const missing: string[] = [];

  for (const item of order.items) {
    const resolved = await resolveArticuloId(item);
    if (!resolved) {
      missing.push(`${item.name} (${item.sku || item.variantLabel})`);
      continue;
    }
    detalle.push({
      articuloId: resolved.articuloId,
      codigoIngresado: resolved.codigo,
      descripcion: `${item.name} — ${item.variantLabel}`,
      descripcionAdicional: "",
      unidad: "UN",
      cantidad: item.quantity,
      precioUnitario: item.unitPrice,
      precioOriginal: item.unitPrice,
      impuestoCodigo,
      impuestoTasa,
      descuentoPorc: discountPercent,
      noFacturable: false,
      promocion: order.discountCode ?? "",
      grupos: "",
      serie: "",
      utilidad: 0,
      subTotalItem: 0,
    });
  }

  if (!detalle.length) {
    const error = `Ningún ítem tiene vínculo con Easy Management: ${missing.join(", ")}`;
    await prisma.order.update({
      where: { id: order.id },
      data: { emSyncStatus: "error", emSyncError: error },
    });
    throw new Error(error);
  }

  const observaciones = [
    `Web ${order.publicId}`,
    order.delivery === "retiro" ? "Retiro" : "Envío",
    order.payment,
    order.notes?.trim(),
    missing.length ? `Sin mapear: ${missing.join("; ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 480);

  const doc: EmDoc = {
    cabezal: {
      fecha: order.createdAt.toISOString(),
      nroDoc: 0,
      terminal: config.terminal,
      tipoDocCodigo: config.tipoDocPedido,
      usuario: config.usuario,
      observaciones,
    },
    receptor: buildReceptor(order, config.guestAsGeneric),
    valorizado: {
      monedaCodigo: config.monedaCodigo,
      tipoCambio: config.tipoCambio,
      formaPagoDias: 0,
      listaPrecioCodigo: config.listaPrecio,
      importeManual: 0,
    },
    detalle,
  };

  try {
    const response = await createPedido(doc, config);
    const terminal = String(response.Terminal ?? response.terminal ?? config.terminal);
    const tipoDoc = String(response.TipoDoc ?? response.tipoDoc ?? config.tipoDocPedido);
    const nroDoc = String(response.NroDoc ?? response.nroDoc ?? "");

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        emTerminal: terminal,
        emTipoDoc: tipoDoc,
        emNroDoc: nroDoc || null,
        emSyncedAt: new Date(),
        emSyncStatus: "synced",
        emSyncError: missing.length
          ? `Enviado parcial. Sin mapear: ${missing.join("; ")}`
          : null,
      },
      include: { items: true, client: true },
    });

    return { skipped: false as const, order: updated, response };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error enviando a Easy Management";
    await prisma.order.update({
      where: { id: order.id },
      data: { emSyncStatus: "error", emSyncError: message.slice(0, 500) },
    });
    throw error;
  }
}

export async function maybeAutoPushOrder(orderId: string) {
  const config = getEmConfig();
  if (!config.enabled || !config.autoPushOrders) return;
  try {
    await pushOrderToEm(orderId);
  } catch (error) {
    console.error("[em] No se pudo enviar el pedido", orderId, error);
  }
}
