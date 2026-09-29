export type Category = string;

export type Badge = "exclusivo" | "nuevo" | "mas-vendido";

export interface Variant {
  id: string;
  label: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stock: number;
  /** Tono de coloración (ej. 7.1 Rubio ceniza) */
  colorName?: string;
  /** Hex del swatch en la ficha */
  colorHex?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  shortDescription: string;
  description: string;
  howToUse?: string;
  benefits?: string[];
  images: string[];
  variants: Variant[];
  badges?: Badge[];
  featured?: boolean;
  /**
   * Si es true, hay que elegir variante (color/presentación) antes de sumar al carrito.
   * Útil para coloraciones con varios tonos.
   */
  requiresSelection?: boolean;
}

export interface CategoryInfo {
  id?: string;
  slug: string;
  name: string;
  description: string;
  eyebrow: string;
  active?: boolean;
  productCount?: number;
  sortOrder?: number;
}

export interface BrandInfo {
  slug: string;
  name: string;
  description: string;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}
