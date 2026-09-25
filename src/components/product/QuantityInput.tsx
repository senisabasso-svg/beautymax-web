"use client";

import { Minus, Plus } from "lucide-react";
import { useId } from "react";

export function QuantityInput({
  value,
  min = 1,
  max = 99,
  onChange,
  label = "Cantidad",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
}) {
  const inputId = useId();

  return (
    <div className="inline-flex h-12 items-center border border-ink/15 bg-white">
      <button
        type="button"
        className="inline-flex h-full w-11 items-center justify-center text-ink hover:text-gold-deep disabled:opacity-40"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Disminuir cantidad"
      >
        <Minus className="h-4 w-4" strokeWidth={1.25} />
      </button>
      <label className="sr-only" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        inputMode="numeric"
        className="h-full w-12 bg-transparent text-center text-sm font-semibold text-ink focus:outline-none"
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isNaN(next)) return;
          onChange(Math.max(min, Math.min(max, next)));
        }}
        aria-label={label}
      />
      <button
        type="button"
        className="inline-flex h-full w-11 items-center justify-center text-ink hover:text-gold-deep disabled:opacity-40"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar cantidad"
      >
        <Plus className="h-4 w-4" strokeWidth={1.25} />
      </button>
    </div>
  );
}
