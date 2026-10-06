import { brands, categories } from "@/data/taxonomy";
import { brandSlug } from "@/lib/utils";
import type { CategoryInfo, Product } from "@/types/product";
import { getApiUrl } from "@/lib/api/client";

/** Catálogo en memoria: solo productos del API (Easy Management). */
let catalog: Product[] = [];
let categoryCatalog: CategoryInfo[] = categories;

export function replaceCatalog(products: Product[]) {
  catalog = products;
}

export function getProducts() {
  return catalog;
}

export async function loadCatalog(): Promise<Product[]> {
  const base = getApiUrl();
  try {
    const res = await fetch(`${base}/products`, { cache: "no-store" });
    if (!res.ok) throw new Error("API catalog error");
    const data = (await res.json()) as Product[];
    if (Array.isArray(data)) {
      replaceCatalog(data);
      return data;
    }
  } catch {
    // Sin fallback local: la tienda solo muestra lo sincronizado desde EM.
  }
  replaceCatalog([]);
  return [];
}

export function getProductBySlug(slug: string) {
  return catalog.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return catalog.find((product) => product.id === id);
}

export function replaceCategories(next: CategoryInfo[]) {
  if (next.length) categoryCatalog = next;
}

export async function loadCategories(): Promise<CategoryInfo[]> {
  const base = getApiUrl();
  try {
    const res = await fetch(`${base}/categories`, { cache: "no-store" });
    if (!res.ok) throw new Error("API categories error");
    const data = (await res.json()) as CategoryInfo[];
    if (Array.isArray(data) && data.length > 0) {
      replaceCategories(data);
      return data;
    }
  } catch {
    // fallback local
  }
  return categoryCatalog;
}

export function getProductsByCategory(category: string) {
  return catalog.filter((product) => product.category === category);
}

export function getProductsByBrand(brand: string) {
  const normalized = brandSlug(brand);
  return catalog.filter((product) => brandSlug(product.brand) === normalized);
}

export function getFeaturedProducts() {
  return catalog.filter((product) => product.featured);
}

export function getRelatedProducts(product: Product, limit = 4) {
  const sameCategory = catalog.filter(
    (item) => item.category === product.category && item.id !== product.id,
  );
  const sameBrand = catalog.filter(
    (item) => item.brand === product.brand && item.id !== product.id && item.category !== product.category,
  );
  return [...sameCategory, ...sameBrand].slice(0, limit);
}

export function getCategories() {
  return categoryCatalog;
}

export function getCategoryBySlug(slug: string) {
  return categoryCatalog.find((category) => category.slug === slug);
}

export function getBrands() {
  return brands;
}

export function getBrandBySlug(slug: string) {
  return brands.find((brand) => brand.slug === slug);
}

export function searchProducts(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return catalog;
  return catalog.filter((product) => {
    const haystack = [product.name, product.brand, product.shortDescription, product.category]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

export function minPrice(product: Product) {
  return Math.min(...product.variants.map((variant) => variant.price));
}

export function maxPrice(product: Product) {
  return Math.max(...product.variants.map((variant) => variant.price));
}

export function isInStock(product: Product) {
  return product.variants.some((variant) => variant.stock > 0);
}

export function defaultVariant(product: Product) {
  return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
}

export function productRequiresSelection(product: Product) {
  if (product.requiresSelection) return true;
  return product.variants.some((variant) => Boolean(variant.colorHex || variant.colorName));
}

export function productHasColors(product: Product) {
  return product.variants.some((variant) => Boolean(variant.colorHex || variant.colorName));
}
