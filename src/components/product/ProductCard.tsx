"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { toast } from "sonner";
import { defaultVariant, isInStock, maxPrice, minPrice, productHasColors, productRequiresSelection } from "@/lib/catalog";
import { useCart } from "@/store/cart-store";
import type { Product } from "@/types/product";
import { PriceTag } from "@/components/product/PriceTag";
import { ProductImage } from "@/components/product/ProductImage";

const badgeLabel = {
  exclusivo: "Exclusivo",
  nuevo: "Nuevo",
  "mas-vendido": "Más vendido",
} as const;

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCart((state) => state.addItem);
  const open = useCart((state) => state.open);
  const available = isInStock(product);
  const low = minPrice(product);
  const high = maxPrice(product);
  const alt = `${product.name} de ${product.brand}`;
  const needsSelection = productRequiresSelection(product);
  const hasColors = productHasColors(product);

  function add(event: MouseEvent) {
    event.preventDefault();
    if (needsSelection) {
      toast.message(hasColors ? "Elegí el color en la ficha" : "Elegí la presentación en la ficha");
      router.push(`/producto/${product.slug}`);
      return;
    }
    const variant = defaultVariant(product);
    const result = addItem(product.id, variant.id, 1);
    if (!result.ok) {
      toast.error("Sin stock de esta presentación");
      return;
    }
    open();
    toast.success("Agregado · Ver carrito", {
      action: { label: "Ver carrito", onClick: () => open() },
    });
  }

  return (
    <article className="group flex h-full flex-col">
      <Link href={`/producto/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-cream shadow-soft ring-1 ring-transparent transition duration-300 group-hover:ring-gold-deep">
          <div className="relative h-full w-full transition duration-700 ease-out group-hover:scale-[1.04] motion-reduce:transform-none">
            <ProductImage src={product.images[0]} alt={alt} brand={product.brand} name={product.name} />
          </div>
          <div className="absolute left-3 top-3 flex flex-col gap-1">
            {!available ? (
              <span className="bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-ui text-ink">Sin stock</span>
            ) : null}
            {needsSelection ? (
              <span className="bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-ui text-gold">
                {hasColors ? "Elegí color" : "Elegí opción"}
              </span>
            ) : null}
            {product.badges?.slice(0, needsSelection ? 1 : 2).map((badge) => (
              <span key={badge} className="bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-ui text-gold">
                {badgeLabel[badge]}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{product.brand}</p>
        <h3 className="mt-1 font-serif text-xl font-semibold leading-snug text-ink">{product.name}</h3>
      </Link>
      <PriceTag className="mt-2" price={low} prefix={low !== high ? "Desde" : undefined} />
      <button
        type="button"
        onClick={add}
        disabled={!available}
        className="mt-4 h-11 w-full rounded-btn border border-ink/15 text-[11px] font-semibold uppercase tracking-ui text-ink transition-colors hover:border-black hover:bg-black hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
      >
        {!available ? "Sin stock" : needsSelection ? (hasColors ? "Elegí el color" : "Elegí opción") : "Agregar al carrito"}
      </button>
    </article>
  );
}
