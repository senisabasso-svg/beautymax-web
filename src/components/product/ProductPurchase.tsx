"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ColorTonePicker, selectedToneLines, type ToneQuantities } from "@/components/product/ColorTonePicker";
import { PriceTag } from "@/components/product/PriceTag";
import { QuantityInput } from "@/components/product/QuantityInput";
import { VariantSelector } from "@/components/product/VariantSelector";
import { formatPrice } from "@/lib/format";
import { productHasColors, productRequiresSelection } from "@/lib/catalog";
import { productInquiryMessage, whatsappUrl } from "@/lib/whatsapp";
import { useCanSeePrices } from "@/store/client-auth-store";
import { useCart } from "@/store/cart-store";
import type { Product } from "@/types/product";

const badgeLabel = {
  exclusivo: "Exclusivo",
  nuevo: "Nuevo",
  "mas-vendido": "Más vendido",
} as const;

export function ProductPurchase({ product }: { product: Product }) {
  const requiresSelection = productRequiresSelection(product);
  const hasColors = productHasColors(product);
  const firstAvailable = product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState<string | null>(
    hasColors || requiresSelection ? null : firstAvailable.id,
  );
  const [quantity, setQuantity] = useState(1);
  const [toneQty, setToneQty] = useState<ToneQuantities>({});
  const [selectionError, setSelectionError] = useState("");
  const addItem = useCart((state) => state.addItem);
  const open = useCart((state) => state.open);
  const canSeePrices = useCanSeePrices();

  const variant = useMemo(
    () => (variantId ? product.variants.find((entry) => entry.id === variantId) : undefined),
    [product.variants, variantId],
  );

  const toneLines = useMemo(() => selectedToneLines(product.variants, toneQty), [product.variants, toneQty]);
  const toneTotal = toneLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const toneUnits = toneLines.reduce((sum, line) => sum + line.quantity, 0);

  const displayPrice = hasColors
    ? toneLines.length === 1
      ? toneLines[0].variant.price
      : Math.min(...product.variants.map((entry) => entry.price))
    : (variant?.price ?? Math.min(...product.variants.map((entry) => entry.price)));

  const unavailable = hasColors
    ? !product.variants.some((entry) => entry.stock > 0)
    : variant
      ? variant.stock <= 0
      : !product.variants.some((entry) => entry.stock > 0);

  function setToneQuantity(id: string, next: number) {
    setToneQty((current) => {
      const copy = { ...current };
      if (next <= 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });
    setSelectionError("");
  }

  function add() {
    if (hasColors) {
      if (toneLines.length === 0) {
        setSelectionError("Elegí al menos un tono y la cantidad de tubos.");
        toast.error("Elegí los tonos primero");
        return;
      }

      let added = 0;
      for (const line of toneLines) {
        const result = addItem(product.id, line.variant.id, line.quantity);
        if (result.ok) added += 1;
      }

      if (added === 0) {
        toast.error("Sin stock de esos tonos");
        return;
      }

      setSelectionError("");
      setToneQty({});
      open();
      toast.success(
        added === 1 ? "Agregado · Ver carrito" : `Sumaste ${added} tonos · Ver carrito`,
        { action: { label: "Ver carrito", onClick: () => open() } },
      );
      return;
    }

    if (!variantId || !variant) {
      setSelectionError("Elegí una presentación antes de sumar al carrito.");
      toast.error("Elegí la presentación primero");
      return;
    }
    const result = addItem(product.id, variant.id, quantity);
    if (!result.ok) {
      toast.error("Sin stock de esta presentación");
      return;
    }
    setSelectionError("");
    open();
    toast.success("Agregado · Ver carrito", {
      action: { label: "Ver carrito", onClick: () => open() },
    });
  }

  const whatsappDetail = hasColors
    ? toneLines.length > 0
      ? toneLines.map((line) => `${line.variant.colorName ?? line.variant.label} × ${line.quantity}`).join(", ")
      : "consultar tonos"
    : (variant?.label ?? "consultar presentación");

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{product.brand}</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-ink md:text-5xl">{product.name}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {product.badges?.map((badge) => (
          <span key={badge} className="bg-black px-2 py-1 text-[10px] font-semibold uppercase tracking-ui text-gold">
            {badgeLabel[badge]}
          </span>
        ))}
      </div>
      <PriceTag
        className="mt-6 text-lg"
        price={displayPrice}
        compareAtPrice={variant?.compareAtPrice}
        prefix={hasColors || (!variant && product.variants.length > 1) ? "Desde" : undefined}
      />
      <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted">{product.shortDescription}</p>

      <div className="mt-8">
        {hasColors ? (
          <ColorTonePicker
            variants={product.variants}
            quantities={toneQty}
            onChange={setToneQuantity}
            error={selectionError}
          />
        ) : (
          <VariantSelector
            variants={product.variants}
            selectedId={variantId}
            requireSelection={requiresSelection}
            error={selectionError}
            onChange={(id) => {
              setVariantId(id);
              setQuantity(1);
              setSelectionError("");
            }}
          />
        )}
      </div>

      {hasColors && toneLines.length > 0 ? (
        <div className="mt-6 border border-ink/10 bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Tu pedido de color</p>
          <ul className="mt-3 space-y-2 text-sm">
            {toneLines.map((line) => (
              <li key={line.variant.id} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <span
                    className="h-4 w-4 rounded-full border border-ink/10"
                    style={{ backgroundColor: line.variant.colorHex ?? "#C9A24A" }}
                    aria-hidden="true"
                  />
                  <span>
                    {line.variant.colorName ?? line.variant.label}
                    <span className="text-muted"> × {line.quantity}</span>
                  </span>
                </span>
                <span className="font-semibold">
                  {canSeePrices ? formatPrice(line.lineTotal) : "—"}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 text-sm font-semibold">
            <span>
              {toneUnits} {toneUnits === 1 ? "tubo" : "tubos"} · {toneLines.length}{" "}
              {toneLines.length === 1 ? "tono" : "tonos"}
            </span>
            <span>{canSeePrices ? formatPrice(toneTotal) : "—"}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {!hasColors ? (
          <QuantityInput value={quantity} max={Math.max(variant?.stock ?? 1, 1)} onChange={setQuantity} />
        ) : null}
        <Button type="button" className="flex-1" onClick={add} disabled={unavailable}>
          {hasColors
            ? toneLines.length === 0
              ? "Elegí los tonos"
              : `Agregar ${toneUnits} ${toneUnits === 1 ? "tubo" : "tubos"} al carrito`
            : !variantId
              ? "Elegí la presentación"
              : unavailable
                ? "Sin stock"
                : "Agregar al carrito"}
        </Button>
      </div>
      <Button asChild variant="outlineDark" className="mt-3 w-full">
        <a href={whatsappUrl(productInquiryMessage(product.name, whatsappDetail))} target="_blank" rel="noreferrer">
          Consultar por WhatsApp
        </a>
      </Button>
    </div>
  );
}
