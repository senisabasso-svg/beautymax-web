"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppliedPromo, usePromo } from "@/store/promo-store";

export function PromoCodeField({ tone = "light" }: { tone?: "light" | "dark" }) {
  const applied = useAppliedPromo();
  const applyCode = usePromo((state) => state.applyCode);
  const clearApplied = usePromo((state) => state.clearApplied);
  const available = usePromo((state) => state.codes.filter((item) => !item.usedAt));
  const [value, setValue] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (applied) setValue(applied.code);
  }, [applied]);

  if (!ready) return null;

  async function onApply() {
    const raw = value.trim();
    if (!raw) {
      toast.error("Ingresá un código.");
      return;
    }

    try {
      const { apiFetch } = await import("@/lib/api/client");
      const remote = await apiFetch<{ code: string; percent: 10 | 20 }>("/promo/validate", {
        method: "POST",
        body: JSON.stringify({ code: raw }),
      });
      usePromo.getState().registerCode({
        code: remote.code,
        percent: remote.percent,
        createdAt: new Date().toISOString(),
      });
    } catch {
      // si el API no responde, probamos el código local de la ruleta
    }

    const result = applyCode(raw);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    toast.success(`Código aplicado · ${result.percent}% OFF`);
  }

  const dark = tone === "dark";

  return (
    <div className={dark ? "text-white" : "text-ink"}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-gold" : "text-ink"}`}>
        Código de descuento
      </p>
      {applied ? (
        <div className={`mt-3 flex items-center justify-between gap-3 border px-3 py-3 ${dark ? "border-gold/40" : "border-ink/15 bg-cream"}`}>
          <div>
            <p className="font-semibold tracking-wide">{applied.code}</p>
            <p className={`text-xs ${dark ? "text-white/70" : "text-muted"}`}>{applied.percent}% de descuento · un solo uso</p>
          </div>
          <button
            type="button"
            className={`text-[11px] font-semibold uppercase tracking-ui ${dark ? "text-gold" : "text-muted hover:text-ink"}`}
            onClick={() => {
              clearApplied();
              setValue("");
            }}
          >
            Quitar
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Input
            value={value}
            onChange={(event) => setValue(event.target.value.toUpperCase())}
            placeholder="BM10-XXXXXX"
            aria-label="Código de descuento"
            className={dark ? "border-white/20 bg-black text-white placeholder:text-white/40" : undefined}
          />
          <Button type="button" variant={dark ? "outline" : "outlineDark"} onClick={onApply}>
            Aplicar
          </Button>
        </div>
      )}
      {!applied && available.length > 0 ? (
        <ul className={`mt-3 space-y-1 text-xs ${dark ? "text-white/65" : "text-muted"}`}>
          {available.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                className={`underline decoration-gold underline-offset-2 ${dark ? "text-gold" : "text-ink"}`}
                onClick={() => {
                  setValue(item.code);
                  const result = applyCode(item.code);
                  if (result.ok) toast.success(`Código aplicado · ${result.percent}% OFF`);
                }}
              >
                Usar {item.code} ({item.percent}%)
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
