"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PageHero } from "@/components/layout/PageHero";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Container } from "@/components/ui/container";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { categories as allCategories } from "@/data/taxonomy";
import { apiFetch } from "@/lib/api/client";
import { minPrice } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { brandSlug, cn } from "@/lib/utils";
import type { Category, CategoryInfo, Product } from "@/types/product";

type Sort = "destacados" | "precio-asc" | "precio-desc" | "nombre";

function sortProducts(list: Product[], sort: Sort) {
  const copy = [...list];
  if (sort === "precio-asc") return copy.sort((a, b) => minPrice(a) - minPrice(b));
  if (sort === "precio-desc") return copy.sort((a, b) => minPrice(b) - minPrice(a));
  if (sort === "nombre") return copy.sort((a, b) => a.name.localeCompare(b.name, "es"));
  return copy.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || a.name.localeCompare(b.name, "es"));
}

export function Catalog({
  products,
  eyebrow,
  title,
  description,
  lockedCategory,
}: {
  products: Product[];
  eyebrow: string;
  title: string;
  description?: string;
  lockedCategory?: Category;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qParam = params.get("q") ?? "";
  const [query, setQuery] = useState(qParam);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [remoteCategories, setRemoteCategories] = useState<CategoryInfo[] | null>(null);
  const category = lockedCategory ?? params.get("categoria") ?? "";
  const brand = params.get("marca") ?? "";
  const sort = (params.get("orden") as Sort) || "destacados";
  const min = params.get("min") ?? "";
  const max = params.get("max") ?? "";

  useEffect(() => {
    setQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<CategoryInfo[]>("/categories")
      .then((items) => {
        if (!cancelled) setRemoteCategories(items);
      })
      .catch(() => {
        /* sin API: quedan las categorías locales */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (query === qParam) return;
      update("q", query.trim());
    }, 250);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const search = next.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  const brands = useMemo(() => {
    const names = Array.from(new Set(products.map((product) => product.brand)));
    return names.sort((a, b) => a.localeCompare(b, "es"));
  }, [products]);

  const categoryNames = useMemo(() => {
    const source = remoteCategories ?? allCategories;
    return new Map(source.map((item) => [item.slug, item.name]));
  }, [remoteCategories]);

  const categoryOptions = useMemo(() => {
    const slugs = Array.from(new Set(products.map((product) => product.category)));
    return slugs
      .filter((slug) => !remoteCategories || remoteCategories.some((item) => item.slug === slug))
      .map((slug) => ({ slug, name: categoryNames.get(slug) ?? slug }));
  }, [products, categoryNames, remoteCategories]);

  const filtered = useMemo(() => {
    const minValue = min ? Number(min) : undefined;
    const maxValue = max ? Number(max) : undefined;
    const term = qParam.trim().toLowerCase();
    const list = products.filter((product) => {
      if (!lockedCategory && category && product.category !== category) return false;
      if (brand && brandSlug(product.brand) !== brand) return false;
      if (term) {
        const haystack = `${product.name} ${product.brand} ${product.shortDescription}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      const matchesPrice = product.variants.some((variant) => {
        if (minValue !== undefined && !Number.isNaN(minValue) && variant.price < minValue) return false;
        if (maxValue !== undefined && !Number.isNaN(maxValue) && variant.price > maxValue) return false;
        return true;
      });
      return matchesPrice;
    });
    return sortProducts(list, sort);
  }, [products, category, brand, qParam, min, max, sort, lockedCategory]);

  const activeFilters = Number(Boolean(brand)) + Number(Boolean(min || max)) + Number(Boolean(!lockedCategory && category));

  const renderFilters = (scope: string) => (
    <div className="space-y-6">
      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Buscar</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre o marca"
          className="mt-2 h-12 w-full rounded-btn border border-ink/15 bg-white px-3 text-sm"
        />
      </label>
      {!lockedCategory && categoryOptions.length > 0 ? (
        <fieldset>
          <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Categoría</legend>
          <div className="mt-3 space-y-2">
            <FilterOption name={`${scope}-categoria`} checked={!category} label="Todas" onSelect={() => update("categoria", "")} />
            {categoryOptions.map((item) => (
              <FilterOption
                key={item.slug}
                name={`${scope}-categoria`}
                checked={category === item.slug}
                label={item.name}
                onSelect={() => update("categoria", item.slug)}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Marca</legend>
        <div className="mt-3 space-y-2">
          <FilterOption name={`${scope}-marca`} checked={!brand} label="Todas" onSelect={() => update("marca", "")} />
          {brands.map((name) => (
            <FilterOption
              key={name}
              name={`${scope}-marca`}
              checked={brand === brandSlug(name)}
              label={name}
              onSelect={() => update("marca", brandSlug(name))}
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">Precio</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            inputMode="numeric"
            placeholder="Mín."
            value={min}
            onChange={(event) => update("min", event.target.value.replace(/[^\d]/g, ""))}
            aria-label="Precio mínimo"
            className="h-11 rounded-btn border border-ink/15 bg-white px-3 text-sm"
          />
          <input
            inputMode="numeric"
            placeholder="Máx."
            value={max}
            onChange={(event) => update("max", event.target.value.replace(/[^\d]/g, ""))}
            aria-label="Precio máximo"
            className="h-11 rounded-btn border border-ink/15 bg-white px-3 text-sm"
          />
        </div>
      </fieldset>
      {activeFilters > 0 || qParam ? (
        <button
          type="button"
          className="text-[11px] font-semibold uppercase tracking-ui text-ink underline decoration-gold decoration-2 underline-offset-4"
          onClick={() => {
            setQuery("");
            router.replace(pathname, { scroll: false });
          }}
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );

  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description} />
      <Container className="py-10 md:py-14">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">{renderFilters("escritorio")}</div>
          </aside>
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {filtered.length} {filtered.length === 1 ? "producto" : "productos"}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-11 rounded-btn border border-ink/15 px-4 text-[11px] font-semibold uppercase tracking-ui lg:hidden"
                  onClick={() => setFiltersOpen(true)}
                >
                  Filtrar{activeFilters ? ` (${activeFilters})` : ""}
                </button>
                <label className="sr-only" htmlFor="orden">
                  Ordenar
                </label>
                <select
                  id="orden"
                  value={sort}
                  onChange={(event) => update("orden", event.target.value)}
                  className="h-11 rounded-btn border border-ink/15 bg-white px-3 text-sm"
                >
                  <option value="destacados">Destacados</option>
                  <option value="precio-asc">Precio: menor a mayor</option>
                  <option value="precio-desc">Precio: mayor a menor</option>
                  <option value="nombre">Nombre</option>
                </select>
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="border border-ink/10 bg-white px-6 py-16 text-center">
                <p className="font-serif text-3xl text-ink">
                  {qParam ? `No encontramos resultados para «${qParam}».` : "Todavía no hay productos en esta selección."}
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm text-muted">
                  Probá con otra búsqueda o escribinos: te armamos el pedido con lo que uses en el salón.
                </p>
                <button
                  type="button"
                  className="mt-6 text-[12px] font-semibold uppercase tracking-ui text-ink underline decoration-gold decoration-2 underline-offset-4"
                  onClick={() => {
                    setQuery("");
                    router.replace(pathname, { scroll: false });
                  }}
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <ProductGrid products={filtered} />
            )}
            {min || max ? (
              <p className="sr-only">
                Rango de precio {min ? formatPrice(Number(min)) : "sin mínimo"} a {max ? formatPrice(Number(max)) : "sin máximo"}
              </p>
            ) : null}
          </div>
        </div>
      </Container>
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" title="Filtros" className="overflow-y-auto bg-cream px-5 pb-8 pt-6">
          <p className="mb-5 pr-12 font-serif text-3xl">Filtros</p>
          {renderFilters("movil")}
        </SheetContent>
      </Sheet>
    </>
  );
}

function FilterOption({
  name,
  checked,
  label,
  onSelect,
}: {
  name: string;
  checked: boolean;
  label: string;
  onSelect: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="accent-black" />
      <span className={cn(checked && "font-semibold")}>{label}</span>
    </label>
  );
}
