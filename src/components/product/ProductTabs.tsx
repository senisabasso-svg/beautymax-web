"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

const tabs = [
  { id: "descripcion", label: "Descripción" },
  { id: "uso", label: "Modo de uso" },
  { id: "beneficios", label: "Beneficios" },
] as const;

export function ProductTabs({ product }: { product: Product }) {
  const [current, setCurrent] = useState<(typeof tabs)[number]["id"]>("descripcion");

  return (
    <div className="mt-14 border-t border-ink/10 pt-8">
      <div role="tablist" aria-label="Información del producto" className="flex gap-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={current === tab.id}
            aria-controls={`panel-${tab.id}`}
            onClick={() => setCurrent(tab.id)}
            className={cn(
              "whitespace-nowrap pb-3 text-[12px] font-semibold uppercase tracking-ui",
              current === tab.id ? "border-b border-gold-deep text-ink" : "text-muted",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="max-w-3xl pt-6 text-sm leading-relaxed text-muted" role="tabpanel" id={`panel-${current}`} aria-labelledby={`tab-${current}`}>
        {current === "descripcion" ? <p>{product.description}</p> : null}
        {current === "uso" ? <p>{product.howToUse ?? "Consultá el modo de uso con un asesor de Beautymax."}</p> : null}
        {current === "beneficios" ? (
          product.benefits?.length ? (
            <ul className="space-y-2">
              {product.benefits.map((benefit) => (
                <li key={benefit} className="flex gap-3">
                  <span className="gold-line mt-2 h-px w-6 shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>Consultá los beneficios de este producto con un asesor.</p>
          )
        ) : null}
      </div>
    </div>
  );
}
