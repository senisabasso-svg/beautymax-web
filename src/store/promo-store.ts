"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createPromoCode,
  normalizePromoCode,
  type DiscountPercent,
  type PromoCode,
} from "@/lib/promo";

interface PromoState {
  hasSpun: boolean;
  codes: PromoCode[];
  appliedCode: string | null;
  awardCode: (percent: DiscountPercent, preset?: PromoCode) => PromoCode;
  registerCode: (promo: PromoCode) => void;
  applyCode: (raw: string) => { ok: true; percent: DiscountPercent } | { ok: false; reason: string };
  clearApplied: () => void;
  redeemApplied: () => void;
  getAvailableCodes: () => PromoCode[];
}

export const usePromo = create<PromoState>()(
  persist(
    (set, get) => ({
      hasSpun: false,
      codes: [],
      appliedCode: null,
      awardCode: (percent, preset) => {
        const promo = preset ?? createPromoCode(percent);
        const exists = get().codes.some((item) => item.code === promo.code);
        set({
          hasSpun: true,
          codes: exists ? get().codes : [...get().codes, promo],
        });
        return promo;
      },
      registerCode: (promo) => {
        if (get().codes.some((item) => item.code === promo.code)) return;
        set({ codes: [...get().codes, promo] });
      },
      applyCode: (raw) => {
        const code = normalizePromoCode(raw);
        if (!code) return { ok: false, reason: "Ingresá un código." };

        const entry = get().codes.find((item) => item.code === code);
        if (!entry) {
          return { ok: false, reason: "Ese código no es válido." };
        }
        if (entry.usedAt) {
          return { ok: false, reason: "Ese código ya se usó. Es de un solo uso." };
        }

        set({ appliedCode: code });
        return { ok: true, percent: entry.percent as DiscountPercent };
      },
      clearApplied: () => set({ appliedCode: null }),
      redeemApplied: () => {
        const applied = get().appliedCode;
        if (!applied) return;
        set({
          appliedCode: null,
          codes: get().codes.map((item) =>
            item.code === applied ? { ...item, usedAt: new Date().toISOString() } : item,
          ),
        });
      },
      getAvailableCodes: () => get().codes.filter((item) => !item.usedAt),
    }),
    {
      name: "beautymax-promo",
      partialize: (state) => ({
        hasSpun: state.hasSpun,
        codes: state.codes,
        appliedCode: state.appliedCode,
      }),
    },
  ),
);

export function useAppliedPromo() {
  const appliedCode = usePromo((state) => state.appliedCode);
  const codes = usePromo((state) => state.codes);
  if (!appliedCode) return null;
  const entry = codes.find((item) => item.code === appliedCode && !item.usedAt);
  return entry ?? null;
}
