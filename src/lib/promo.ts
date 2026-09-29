export type DiscountPercent = number;

export interface PromoCode {
  code: string;
  percent: number;
  createdAt: string;
  usedAt?: string;
}

export interface WheelSegment {
  id?: string;
  percent: number;
  displayOnly?: boolean;
  label?: string | null;
}

/** Fallback si la API no responde. */
export const wheelSegments: number[] = [10, 20, 10, 15, 10, 20, 10, 25];

export function createPromoCode(percent: number): PromoCode {
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
