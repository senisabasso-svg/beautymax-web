"use client";

import { useClientAuth } from "@/store/client-auth-store";

/** Dispara el modal de la ruleta en modo registro (escuchado por DiscountWheel). */
export function openClientRegister() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bm:open-client-auth", { detail: { mode: "register" } }));
}

export function openClientLogin() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("bm:open-client-auth", { detail: { mode: "login" } }));
}

export function PriceGateMessage({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const client = useClientAuth((s) => s.client);
  const token = useClientAuth((s) => s.token);

  if (token && client?.status === "pending") {
    return (
      <p className={className}>
        {compact ? "Pendiente de aprobación" : "Tu registro está pendiente de aceptación."}
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={openClientRegister}
      className={className}
    >
      {compact ? "Precio para clientes" : "Registrate como cliente para ver precios"}
    </button>
  );
}
