"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getProductById } from "@/lib/catalog";
import type { CartItem } from "@/types/product";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (productId: string, variantId: string, quantity?: number) => { ok: boolean; reason?: "stock" };
  setQuantity: (productId: string, variantId: string, quantity: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      addItem: (productId, variantId, quantity = 1) => {
        const product = getProductById(productId);
        const variant = product?.variants.find((entry) => entry.id === variantId);
        if (!variant || variant.stock <= 0) return { ok: false, reason: "stock" as const };

        const items = get().items;
        const existing = items.find((item) => item.productId === productId && item.variantId === variantId);
        const nextQuantity = Math.min(variant.stock, (existing?.quantity ?? 0) + quantity);
        if (existing && nextQuantity === existing.quantity) return { ok: false, reason: "stock" as const };

        const nextItems = existing
          ? items.map((item) =>
              item.productId === productId && item.variantId === variantId
                ? { ...item, quantity: nextQuantity }
                : item,
            )
          : [...items, { productId, variantId, quantity: nextQuantity }];

        set({ items: nextItems, isOpen: true });
        return { ok: true };
      },
      setQuantity: (productId, variantId, quantity) => {
        const product = getProductById(productId);
        const variant = product?.variants.find((entry) => entry.id === variantId);
        if (!variant) return;
        const safe = Math.max(0, Math.min(variant.stock, quantity));
        set({
          items:
            safe === 0
              ? get().items.filter((item) => !(item.productId === productId && item.variantId === variantId))
              : get().items.map((item) =>
                  item.productId === productId && item.variantId === variantId ? { ...item, quantity: safe } : item,
                ),
        });
      },
      removeItem: (productId, variantId) => {
        set({
          items: get().items.filter((item) => !(item.productId === productId && item.variantId === variantId)),
        });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: "beautymax-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export function useCartCount() {
  return useCart((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
}
