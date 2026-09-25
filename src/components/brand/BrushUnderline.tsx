import { useId } from "react";
import { cn } from "@/lib/utils";

export function BrushUnderline({ className }: { className?: string }) {
  const id = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 240 28" className={cn("h-[0.55em] w-full", className)} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9A7B2F" />
          <stop offset="50%" stopColor="#E8D29A" />
          <stop offset="100%" stopColor="#C9A24A" />
        </linearGradient>
      </defs>
      <path
        d="M3 18c22 7 34-12 58-8 26 4 30 12 56 7 22-4 34-13 58-7 14 3 30 6 52 1"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path
        d="M14 15c28 3 46-7 78-2 30 5 42-6 86-3"
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}
