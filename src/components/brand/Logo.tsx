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
        className="h-16 w-16 object-contain md:h-[4.5rem] md:w-[4.5rem]"
      />
    </Link>
  );
}
