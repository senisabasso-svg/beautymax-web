import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("text-[11px] font-semibold uppercase tracking-[0.16em] text-ink", className)}
      {...props}
    />
  );
}
