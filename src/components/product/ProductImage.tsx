"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function ProductPlaceholder({
  brand,
  name,
  className,
}: {
  brand: string;
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full w-full flex-col items-center justify-center bg-cream px-6 text-center", className)}>
      <span className="gold-line mb-5 h-px w-12" />
      <span className="font-serif text-2xl font-semibold text-gold-deep sm:text-3xl">{brand}</span>
      <span className="mt-3 max-w-[16rem] font-sans text-[10px] font-medium uppercase leading-relaxed tracking-[0.18em] text-muted">
        {name}
      </span>
      <span className="gold-line mt-5 h-px w-12" />
    </div>
  );
}

export function ProductImage({
  src,
  alt,
  brand,
  name,
  sizes = "(max-width: 768px) 50vw, 25vw",
  priority = false,
  className,
}: {
  src?: string;
  alt: string;
  brand: string;
  name: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const raster = Boolean(src && /\.(png|jpe?g|webp|avif)$/i.test(src));

  if (!src || failed) {
    return <ProductPlaceholder brand={brand} name={name} className={className} />;
  }

  if (!raster) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
