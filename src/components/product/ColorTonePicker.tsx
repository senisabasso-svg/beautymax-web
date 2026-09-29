"use client";

import { Minus, Plus } from "lucide-react";
import { PriceGateMessage } from "@/components/client/PriceGate";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCanSeePrices } from "@/store/client-auth-store";
import type { Variant } from "@/types/product";

export type ToneQuantities = Record<string, number>;

export function ColorTonePicker({
  variants,
  quantities,
  onChange,
  error,
}: {
  variants: Variant[];
  quantities: ToneQuantities;
  onChange: (variantId: string, quantity: number) => void;
  error?: string;
}) {
  const canSeePrices = useCanSeePrices();
  const selectedCount = Object.values(quantities).filter((qty) => qty > 0).length;

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
        Elegí los tonos <span className="text-gold-deep">*</span>
      </p>
      <p className="mt-2 text-sm text-muted">
        Podés llevar varios: por ejemplo el 7.1 con 4 tubos y el 7.3 con 3. Sumá la cantidad de cada tono.
      </p>
      {error ? (
        <p className="mt-2 text-xs text-[#7A2E2E]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-2" role="list" aria-label="Tonos disponibles">
        {variants.map((variant) => {
          const qty = quantities[variant.id] ?? 0;
          const selected = qty > 0;
          const unavailable = variant.stock <= 0;
          const name = variant.colorName ?? variant.label;

          return (
            <div
              key={variant.id}
              role="listitem"
              className={cn(
                "flex items-center gap-3 rounded-btn border px-3 py-2.5 transition-colors",
                selected ? "border-black bg-black text-gold" : "border-ink/15 bg-white text-ink",
                unavailable && "opacity-40",
                error && selectedCount === 0 && "border-[#7A2E2E]/35",
              )}
            >
              <span
                className={cn("h-10 w-10 shrink-0 rounded-full border", selected ? "border-gold" : "border-ink/15")}
                style={{ backgroundColor: variant.colorHex ?? "#C9A24A" }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug">{name}</p>
                <p className={cn("text-[11px]", selected ? "text-gold-light" : "text-muted")}>
                  {unavailable ? (
                    "Sin stock"
                  ) : canSeePrices ? (
                    <>
                      {formatPrice(variant.price)}
                      {variant.sku ? ` · ${variant.sku}` : ""}
                    </>
                  ) : (
                    <PriceGateMessage
                      compact
                      className={cn(
                        "underline-offset-2 hover:underline",
                        selected ? "text-gold-light" : "text-gold-deep",
                      )}
                    />
                  )}
                </p>
              </div>
              {unavailable ? (
                <span className="text-[10px] font-semibold uppercase tracking-ui">Agotado</span>
              ) : (
                <div className={cn("inline-flex h-10 items-center border", selected ? "border-gold/50" : "border-ink/15 bg-cream")}>
                  <button
                    type="button"
                    className="inline-flex h-full w-9 items-center justify-center disabled:opacity-40"
                    onClick={() => onChange(variant.id, Math.max(0, qty - 1))}
                    disabled={qty <= 0}
                    aria-label={`Quitar una unidad de ${name}`}
                  >
                    <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                    {qty}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-full w-9 items-center justify-center disabled:opacity-40"
                    onClick={() => onChange(variant.id, Math.min(variant.stock, qty + 1))}
                    disabled={qty >= variant.stock}
                    aria-label={`Sumar una unidad de ${name}`}
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function selectedToneLines(variants: Variant[], quantities: ToneQuantities) {
  return variants
    .map((variant) => {
      const quantity = quantities[variant.id] ?? 0;
      if (quantity <= 0) return null;
      return {
        variant,
        quantity,
        lineTotal: variant.price * quantity,
      };
    })
    .filter((line): line is NonNullable<typeof line> => Boolean(line));
}
