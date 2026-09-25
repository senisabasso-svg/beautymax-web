"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { searchProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { minPrice } from "@/lib/catalog";

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => (query.trim() ? searchProducts(query).slice(0, 6) : []), [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Buscar en la tienda" className="top-[12%] w-[min(100%-1.5rem,640px)] translate-y-0 p-0">
        <label htmlFor="busqueda-global" className="sr-only">
          Buscar productos
        </label>
        <div className="flex items-center gap-3 border-b border-ink/10 px-4">
          <Search className="h-4 w-4 text-gold-deep" strokeWidth={1.25} />
          <input
            id="busqueda-global"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar productos o marcas"
            className="h-14 w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {query.trim() && results.length === 0 ? (
            <p className="px-3 py-6 text-sm text-muted">No encontramos resultados para «{query.trim()}».</p>
          ) : null}
          <ul>
            {results.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/producto/${product.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between gap-4 px-3 py-3 hover:bg-white"
                >
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{product.brand}</span>
                    <span className="font-serif text-lg text-ink">{product.name}</span>
                  </span>
                  <span className="text-sm font-semibold text-ink">{formatPrice(minPrice(product))}</span>
                </Link>
              </li>
            ))}
          </ul>
          {query.trim() ? (
            <Link
              href={`/tienda?q=${encodeURIComponent(query.trim())}`}
              onClick={() => onOpenChange(false)}
              className="mt-1 block px-3 py-3 text-[11px] font-semibold uppercase tracking-ui text-ink underline decoration-gold decoration-2 underline-offset-4"
            >
              Ver todos los resultados
            </Link>
          ) : (
            <p className="px-3 py-6 text-sm text-muted">Escribí el nombre de un producto o una marca.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
