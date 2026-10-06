"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/brand/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { Container } from "@/components/ui/container";
import { apiFetch } from "@/lib/api/client";
import type { Product } from "@/types/product";

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Product[]>("/products")
      .then((items) => {
        if (cancelled) return;
        setProducts(items.filter((product) => product.featured).slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!products.length) return null;

  return (
    <section className="bg-white py-16 md:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Selección"
            title="Productos destacados"
            description="Lo que más se mueve en cabina. Precios de referencia: confirmalos con el equipo si comprás como salón."
          />
        </Reveal>
        <div className="mt-12 flex snap-x gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible xl:grid-cols-4">
          {products.map((product) => (
            <div key={product.id} className="w-[72%] shrink-0 snap-start sm:w-[46%] md:w-auto">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/tienda"
            className="text-[12px] font-semibold uppercase tracking-ui text-ink underline decoration-gold decoration-2 underline-offset-4"
          >
            Ver toda la tienda
          </Link>
        </div>
      </Container>
    </section>
  );
}
