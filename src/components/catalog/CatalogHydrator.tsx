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
        if (!cancelled) replaceCatalog(Array.isArray(products) ? products : []);
      })
      .catch(() => {
        if (!cancelled) replaceCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
