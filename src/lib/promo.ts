export type DiscountPercent = 10 | 20;

export interface PromoCode {
  code: string;
  percent: DiscountPercent;
  createdAt: string;
  usedAt?: string;
}

/** Segmentos de la ruleta: más chances de 10%, menos de 20%. */
export const wheelSegments: DiscountPercent[] = [10, 20, 10, 10, 20, 10, 10, 20];

export function createPromoCode(percent: DiscountPercent): PromoCode {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return {
    code: `BM${percent}-${suffix}`,
    percent,
    createdAt: new Date().toISOString(),
  };
}

export function normalizePromoCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function discountAmount(subtotal: number, percent: number) {
  if (subtotal <= 0 || percent <= 0) return 0;
  return Math.round((subtotal * percent) / 100);
}
