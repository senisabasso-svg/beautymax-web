"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FreeShippingBar } from "@/components/cart/FreeShippingBar";
import { PromoCodeField } from "@/components/promo/PromoCodeField";
import { ProductImage } from "@/components/product/ProductImage";
import { QuantityInput } from "@/components/product/QuantityInput";
import { Button } from "@/components/ui/button";
import { cartTotals, resolveCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart-store";
import { useAppliedPromo } from "@/store/promo-store";

export function CartPage() {
  const [ready, setReady] = useState(false);
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const promo = useAppliedPromo();
  const lines = resolveCart(items);
  const { subtotal, discount, shipping, total } = cartTotals(lines, "envio", promo?.percent ?? 0);

  useEffect(() => setReady(true), []);

  if (!ready) {
    return <div className="h-64 animate-pulse bg-black/5" />;
  }

  if (lines.length === 0) {
    return (
      <div className="bg-white px-6 py-16 text-center">
        <p className="font-serif text-4xl text-ink">Tu carrito está vacío.</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">Cuando sumes un producto, lo vas a ver acá con la variante y el total.</p>
        <Button asChild className="mt-8">
          <Link href="/tienda">Explorá la tienda</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr]">
      <ul className="space-y-6">
        {lines.map((line) => (
          <li key={`${line.productId}-${line.variantId}`} className="grid grid-cols-[96px_1fr] gap-4 border-b border-ink/10 pb-6 sm:grid-cols-[120px_1fr]">
            <Link href={`/producto/${line.slug}`} className="relative block aspect-[4/5] overflow-hidden bg-white">
              <ProductImage src={line.image} alt={`${line.name} de ${line.brand}`} brand={line.brand} name={line.name} sizes="120px" />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{line.brand}</p>
              <Link href={`/producto/${line.slug}`} className="font-serif text-2xl text-ink">
                {line.name}
              </Link>
              <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{line.variantLabel}</p>
              <p className="mt-2 font-semibold">{formatPrice(line.lineTotal)}</p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <QuantityInput
                  value={line.quantity}
                  max={line.stock}
                  onChange={(quantity) => setQuantity(line.productId, line.variantId, quantity)}
                  label={`Cantidad de ${line.name}`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(line.productId, line.variantId)}
                  className="text-[11px] font-semibold uppercase tracking-ui text-muted hover:text-ink"
                >
                  Quitar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit bg-white p-6">
        <PromoCodeField />
        <div className="mt-5">
          <FreeShippingBar subtotal={subtotal} />
        </div>
        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold">{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted">Descuento {promo?.percent}%</dt>
              <dd className="font-semibold text-gold-deep">-{formatPrice(discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-muted">Envío estimado</dt>
            <dd className="font-semibold">{shipping === 0 ? "Gratis" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between border-t border-ink/10 pt-3 text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-semibold">{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted">El envío es una referencia. El costo final por DAC o agencia se confirma al coordinar.</p>
        <Button asChild className="mt-6 w-full">
          <Link href="/checkout">Finalizar compra</Link>
        </Button>
      </aside>
    </div>
  );
}
