import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0", className)} aria-label="Beautymax Distribuidora, inicio">
      <Image
        src="/brand/logo.png"
        alt="Beautymax Distribuidora"
        width={512}
        height={512}
        priority
        className="h-11 w-11 object-contain md:h-[52px] md:w-[52px]"
      />
    </Link>
  );
}
