"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage, whatsappUrl, type OrderPayload } from "@/lib/whatsapp";

export function OrderConfirmation() {
  const [order, setOrder] = useState<OrderPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("beautymax-order");
    if (raw) {
      try {
        setOrder(JSON.parse(raw) as OrderPayload);
      } catch {
        setOrder(null);
      }
    }
    setReady(true);
  }, []);

  if (!ready) return <div className="h-64 animate-pulse bg-black/5" />;

  if (!order) {
    return (
      <div className="bg-white px-6 py-16 text-center">
        <p className="font-serif text-4xl">No encontramos un pedido reciente.</p>
        <Button asChild className="mt-6">
          <Link href="/tienda">Volver a la tienda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl bg-white p-6 md:p-10">
      <p className="text-[11px] font-semibold uppercase tracking-section text-ink">Pedido recibido</p>
      <h2 className="mt-2 font-serif text-4xl text-ink">{order.id}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Te abrimos WhatsApp con el detalle. Si no se abrió, reenviá el mensaje y un asesor te confirma stock, envío y pago.
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        {order.lines.map((line) => (
          <li key={`${line.name}-${line.variant}`} className="flex justify-between gap-4 border-b border-ink/10 pb-3">
            <span>
              {line.name}
              <span className="block text-xs uppercase tracking-[0.12em] text-muted">
                {line.variant} × {line.quantity}
              </span>
            </span>
            <span className="font-semibold">{formatPrice(line.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        {order.discount && order.discount > 0 ? (
          <div className="flex justify-between">
            <dt className="text-muted">
              Descuento{order.discountCode ? ` (${order.discountCode})` : ""}
            </dt>
            <dd className="font-semibold text-gold-deep">-{formatPrice(order.discount)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between">
          <dt className="text-muted">Envío</dt>
          <dd>{order.shipping === 0 ? "Sin costo" : formatPrice(order.shipping)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-muted">
        {order.customer.name} · {order.customer.city}, {order.customer.department}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <a href={whatsappUrl(buildOrderMessage(order))} target="_blank" rel="noreferrer">
            Reenviar por WhatsApp
          </a>
        </Button>
        <Button asChild variant="outlineDark">
          <Link href="/tienda">Seguir comprando</Link>
        </Button>
      </div>
    </div>
  );
}
