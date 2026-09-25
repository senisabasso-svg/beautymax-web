"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductImage } from "@/components/product/ProductImage";
import { cn } from "@/lib/utils";

export function ProductGallery({
  images,
  name,
  brand,
}: {
  images: string[];
  name: string;
  brand: string;
}) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = images[active] ?? "";
  const alt = `${name} de ${brand}`;

  return (
    <div>
      <button
        type="button"
        className="relative block aspect-[4/5] w-full overflow-hidden rounded-card bg-cream text-left shadow-soft"
        onClick={() => setZoom(true)}
        aria-label={`Ampliar foto de ${name}`}
      >
        <ProductImage src={current} alt={alt} brand={brand} name={name} priority sizes="(max-width: 1024px) 100vw, 50vw" />
      </button>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagen ${index + 1} de ${name}`}
              className={cn(
                "relative h-20 w-16 overflow-hidden rounded-btn bg-cream",
                index === active ? "ring-2 ring-gold-deep" : "ring-1 ring-ink/10",
              )}
            >
              <ProductImage src={image} alt="" brand={brand} name={name} sizes="64px" />
            </button>
          ))}
        </div>
      ) : null}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent title={`Foto ampliada de ${name}`} className="aspect-[4/5] max-h-[90vh] overflow-hidden bg-cream p-0">
          <div className="relative h-[80vh] w-full">
            <ProductImage src={current} alt={alt} brand={brand} name={name} sizes="90vw" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
