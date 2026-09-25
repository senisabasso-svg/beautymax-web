import type { Product, Variant } from "@prisma/client";

export type ApiProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  howToUse?: string;
  benefits?: string[];
  images: string[];
  badges?: string[];
  featured?: boolean;
  requiresSelection?: boolean;
  variants: Array<{
    id: string;
    label: string;
    price: number;
    compareAtPrice?: number;
    sku?: string;
    stock: number;
    colorName?: string;
    colorHex?: string;
  }>;
};

export function mapProduct(product: Product & { variants: Variant[] }): ApiProduct {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    shortDescription: product.shortDescription,
    description: product.description,
    howToUse: product.howToUse ?? undefined,
    benefits: product.benefits.length ? product.benefits : undefined,
    images: product.images,
    badges: product.badges.length ? (product.badges as ApiProduct["badges"]) : undefined,
    featured: product.featured || undefined,
    requiresSelection: product.requiresSelection || undefined,
    variants: product.variants
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((v) => ({
        id: v.id,
        label: v.label,
        price: v.price,
        compareAtPrice: v.compareAtPrice ?? undefined,
        sku: v.sku ?? undefined,
        stock: v.stock,
        colorName: v.colorName ?? undefined,
        colorHex: v.colorHex ?? undefined,
      })),
  };
}
