"use client";

import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PriceGateMessage } from "@/components/client/PriceGate";
import { useCanSeePrices } from "@/store/client-auth-store";

export function PriceTag({
  price,
  compareAtPrice,
  tone = "dark",
  prefix,
  className,
}: {
  price: number;
  compareAtPrice?: number;
  tone?: "dark" | "light";
  prefix?: string;
  className?: string;
}) {
  const canSee = useCanSeePrices();
  const onSale = typeof compareAtPrice === "number" && compareAtPrice > price;

  if (!canSee) {
    return (
      <PriceGateMessage
        compact
        className={cn(
          "text-left text-sm font-medium underline-offset-2 hover:underline",
          tone === "light" ? "text-gold/90" : "text-gold-deep",
          className,
        )}
      />
    );
  }

  return (
    <p className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-sans text-sm font-semibold tracking-wide",
          tone === "light" ? "text-gold" : "text-ink",
        )}
      >
        {prefix ? `${prefix} ` : ""}
        {formatPrice(price)}
      </span>
      {onSale ? <span className="text-xs text-muted line-through">{formatPrice(compareAtPrice)}</span> : null}
    </p>
  );
}
