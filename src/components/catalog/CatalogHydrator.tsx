"use client";

import { useEffect } from "react";
import { apiFetch } from "@/lib/api/client";
import { replaceCatalog } from "@/lib/catalog";
import type { Product } from "@/types/product";

/** Hidrata el catálogo cliente desde Railway para carrito, búsqueda y stock. */
export function CatalogHydrator() {
  useEffect(() => {
    let cancelled = false;
    apiFetch<Product[]>("/products")
      .then((products) => {
        if (!cancelled && products.length) replaceCatalog(products);
      })
      .catch(() => {
        /* sin API: queda el catálogo local */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
