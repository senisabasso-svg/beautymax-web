import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const onSale = typeof compareAtPrice === "number" && compareAtPrice > price;

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
