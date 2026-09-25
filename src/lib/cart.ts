import { storeConfig } from "@/config/store";
import type { DeliveryId } from "@/config/store";
import { getProductById } from "@/lib/catalog";
import type { CartItem } from "@/types/product";

export interface ResolvedCartLine {
  productId: string;
  variantId: string;
  quantity: number;
  name: string;
  brand: string;
  slug: string;
  image: string;
  variantLabel: string;
  sku?: string;
  unitPrice: number;
  stock: number;
  lineTotal: number;
}

export function resolveCart(items: CartItem[]): ResolvedCartLine[] {
  return items.flatMap((item) => {
    const product = getProductById(item.productId);
    const variant = product?.variants.find((entry) => entry.id === item.variantId);
    if (!product || !variant) return [];
    const quantity = Math.min(item.quantity, variant.stock);
    if (quantity <= 0) return [];
    return [
      {
        productId: product.id,
        variantId: variant.id,
        quantity,
        name: product.name,
        brand: product.brand,
        slug: product.slug,
        image: product.images[0] ?? "",
        variantLabel: variant.label,
        sku: variant.sku,
        unitPrice: variant.price,
        stock: variant.stock,
        lineTotal: variant.price * quantity,
      },
    ];
  });
}

export function cartSubtotal(lines: ResolvedCartLine[]) {
  return lines.reduce((sum, line) => sum + line.lineTotal, 0);
}

export function shippingFor(subtotal: number, delivery: DeliveryId) {
  if (delivery === "retiro" || subtotal <= 0) return 0;
  if (subtotal >= storeConfig.freeShippingFrom) return 0;
  return storeConfig.shippingCost;
}

export function freeShippingRemaining(subtotal: number) {
  return Math.max(0, storeConfig.freeShippingFrom - subtotal);
}

export function cartTotals(
  lines: ResolvedCartLine[],
  delivery: DeliveryId,
  discountPercent = 0,
) {
  const subtotal = cartSubtotal(lines);
  const discount = discountPercent > 0 ? Math.round((subtotal * discountPercent) / 100) : 0;
  const shipping = shippingFor(subtotal, delivery);
  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, discount, shipping, total };
}
