import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  variant = "light",
  className,
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const color = variant === "light" ? "text-white" : "text-black";
  const line = variant === "light" ? "bg-white" : "bg-black";

  return (
    <Link href="/" className={cn("inline-flex flex-col leading-none", color, className)} aria-label="Beautymax Distribuidora, inicio">
      <span className="font-sans text-[18px] font-semibold tracking-[0.14em] sm:text-[22px]">
        BEAUTYMAX
        <sup className="ml-0.5 align-super text-[8px] font-medium tracking-normal">®</sup>
      </span>
      <span className="mt-1 text-[7px] font-medium tracking-[0.46em] sm:text-[8px]">DISTRIBUIDORA</span>
      <span className={cn("mt-1.5 h-px w-full", line)} />
    </Link>
  );
}
