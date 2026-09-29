"use client";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PriceGateMessage } from "@/components/client/PriceGate";
import { useCanSeePrices } from "@/store/client-auth-store";
import type { Variant } from "@/types/product";

export function VariantSelector({
  variants,
  selectedId,
  onChange,
  mode = "auto",
  requireSelection = false,
  error,
}: {
  variants: Variant[];
  selectedId: string | null;
  onChange: (id: string) => void;
  mode?: "auto" | "presentation" | "color";
  requireSelection?: boolean;
  error?: string;
}) {
  const canSeePrices = useCanSeePrices();
  const hasColors = variants.some((variant) => Boolean(variant.colorHex || variant.colorName));
  const isColor = mode === "color" || (mode === "auto" && hasColors);
  const title = isColor ? "Elegí el color" : "Elegí la presentación";
  const groupLabel = isColor ? "Color" : "Presentación";

  function priceLabel(variant: Variant, selected: boolean) {
    if (variant.stock <= 0) return "Sin stock";
    if (!canSeePrices) {
      return (
        <PriceGateMessage
          compact
          className={cn(
            "text-left text-[11px] underline-offset-2 hover:underline",
            selected ? "text-gold-light" : "text-gold-deep",
          )}
        />
      );
    }
    return formatPrice(variant.price);
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
        {title}
        {requireSelection ? <span className="text-gold-deep"> *</span> : null}
      </p>
      {!selectedId && requireSelection ? (
        <p className="mt-2 text-sm text-muted">Seleccioná un tono para continuar.</p>
      ) : null}
      {error ? (
        <p className="mt-2 text-xs text-[#7A2E2E]" role="alert">
          {error}
        </p>
      ) : null}

      {isColor ? (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label={groupLabel}>
          {variants.map((variant) => {
            const selected = variant.id === selectedId;
            const unavailable = variant.stock <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={unavailable}
                onClick={() => onChange(variant.id)}
                className={cn(
                  "flex min-h-[4.5rem] items-center gap-3 rounded-btn border px-3 py-2 text-left transition-colors",
                  selected ? "border-black bg-black text-gold" : "border-ink/15 bg-white text-ink hover:border-gold-deep",
                  unavailable && "cursor-not-allowed opacity-40",
                  error && !selectedId && "border-[#7A2E2E]/40",
                )}
              >
                <span
                  className={cn(
                    "h-9 w-9 shrink-0 rounded-full border",
                    selected ? "border-gold" : "border-ink/15",
                  )}
                  style={{ backgroundColor: variant.colorHex ?? "#C9A24A" }}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold leading-snug">{variant.colorName ?? variant.label}</span>
                  <span className={cn("mt-1 block text-[11px]", selected ? "text-gold-light" : "text-muted")}>
                    {priceLabel(variant, selected)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={groupLabel}>
          {variants.map((variant) => {
            const selected = variant.id === selectedId;
            const unavailable = variant.stock <= 0;
            return (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={unavailable}
                onClick={() => onChange(variant.id)}
                className={cn(
                  "min-h-11 rounded-btn border px-3 py-2 text-left text-xs font-semibold uppercase tracking-ui transition-colors",
                  selected ? "border-black bg-black text-gold" : "border-ink/15 bg-white text-ink hover:border-gold-deep",
                  unavailable && "cursor-not-allowed opacity-40",
                )}
              >
                <span className="block">{variant.label}</span>
                <span
                  className={cn(
                    "mt-1 block font-medium normal-case tracking-normal",
                    selected ? "text-gold-light" : "text-muted",
                  )}
                >
                  {priceLabel(variant, selected)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
