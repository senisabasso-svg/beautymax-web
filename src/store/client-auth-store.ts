"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiFetch } from "@/lib/api/client";

export type ClientProfile = {
  id: string;
  name: string;
  document: string;
  address: string;
  city: string;
  phone: string;
  salonName: string;
  email: string | null;
  status: string;
  hasActiveDiscount: boolean;
  activeDiscount: { code: string; percent: number; createdAt: string } | null;
};

interface ClientAuthState {
  token: string | null;
  client: ClientProfile | null;
  ready: boolean;
  setReady: (ready: boolean) => void;
  setSession: (token: string, client: ClientProfile) => void;
  clearSession: () => void;
  refreshMe: () => Promise<ClientProfile | null>;
  canSeePrices: () => boolean;
}

export const useClientAuth = create<ClientAuthState>()(
  persist(
    (set, get) => ({
      token: null,
      client: null,
      ready: false,
      setReady: (ready) => set({ ready }),
      setSession: (token, client) => set({ token, client }),
      clearSession: () => set({ token: null, client: null }),
      canSeePrices: () => {
        const { token, client } = get();
        return Boolean(token && client?.status === "active");
      },
      refreshMe: async () => {
        const token = get().token;
        if (!token) {
          set({ client: null });
          return null;
        }
        try {
          const client = await apiFetch<ClientProfile>("/clients/me", { token });
          set({ client });
          return client;
        } catch {
          set({ token: null, client: null });
          return null;
        }
      },
    }),
    {
      name: "beautymax-client-auth",
      partialize: (state) => ({
        token: state.token,
        client: state.client,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setReady(true);
      },
    },
  ),
);

export function useCanSeePrices() {
  const ready = useClientAuth((s) => s.ready);
  const token = useClientAuth((s) => s.token);
  const status = useClientAuth((s) => s.client?.status);
  if (!ready) return false;
  return Boolean(token && status === "active");
}
