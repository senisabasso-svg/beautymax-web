"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FreeShippingBar } from "@/components/cart/FreeShippingBar";
import { PromoCodeField } from "@/components/promo/PromoCodeField";
import { QuantityInput } from "@/components/product/QuantityInput";
import { ProductImage } from "@/components/product/ProductImage";
import { cartTotals, resolveCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart-store";
import { useAppliedPromo } from "@/store/promo-store";

export function CartDrawer() {
  const open = useCart((state) => state.isOpen);
  const setOpen = useCart((state) => state.close);
  const openCart = useCart((state) => state.open);
  const items = useCart((state) => state.items);
  const setQuantity = useCart((state) => state.setQuantity);
  const removeItem = useCart((state) => state.removeItem);
  const promo = useAppliedPromo();
  const lines = resolveCart(items);
  const { subtotal, discount, shipping, total } = cartTotals(lines, "envio", promo?.percent ?? 0);
  const router = useRouter();

  function go(href: string) {
    setOpen();
    router.push(href);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? openCart() : setOpen())}>
      <SheetContent title="Tu carrito" description="Productos agregados a la compra" side="right" className="flex flex-col bg-cream">
        <div className="border-b border-ink/10 px-5 pb-4 pt-5 pr-14">
          <p className="font-serif text-3xl text-ink">Tu carrito</p>
        </div>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center px-5">
            <p className="font-serif text-2xl text-ink">Todavía no sumaste productos.</p>
            <p className="mt-2 text-sm text-muted">Explorá la tienda y armá tu pedido de cabina.</p>
            <Button type="button" className="mt-6" onClick={() => go("/tienda")}>
              Ir a la tienda
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {lines.map((line) => (
                <li key={`${line.productId}-${line.variantId}`} className="grid grid-cols-[72px_1fr] gap-3">
                  <Link
                    href={`/producto/${line.slug}`}
                    onClick={(event) => {
                      event.preventDefault();
                      go(`/producto/${line.slug}`);
                    }}
                    className="relative block h-24 overflow-hidden bg-white"
                  >
                    <ProductImage src={line.image} alt={`${line.name} de ${line.brand}`} brand={line.brand} name={line.name} sizes="72px" />
                  </Link>
                  <div>
                    <Link
                      href={`/producto/${line.slug}`}
                      onClick={(event) => {
                        event.preventDefault();
                        go(`/producto/${line.slug}`);
                      }}
                      className="font-serif text-lg leading-tight text-ink"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{line.variantLabel}</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatPrice(line.lineTotal)}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <QuantityInput
                        value={line.quantity}
                        max={line.stock}
                        onChange={(quantity) => setQuantity(line.productId, line.variantId, quantity)}
                        label={`Cantidad de ${line.name}`}
                      />
                      <button
                        type="button"
                        className="text-[11px] font-semibold uppercase tracking-ui text-muted hover:text-ink"
                        onClick={() => removeItem(line.productId, line.variantId)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-ink/10 px-5 py-5">
              <PromoCodeField />
              <div className="mt-4">
                <FreeShippingBar subtotal={subtotal} />
              </div>
              <dl className="mt-4 space-y-2 text-sm">
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
                <div className="flex justify-between text-base">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-semibold">{formatPrice(total)}</dd>
                </div>
              </dl>
              <div className="mt-5 grid gap-2">
                <Button type="button" onClick={() => go("/checkout")}>
                  Finalizar compra
                </Button>
                <Button type="button" variant="outlineDark" onClick={() => go("/carrito")}>
                  Ver carrito
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
