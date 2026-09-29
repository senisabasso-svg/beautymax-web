import type { MetadataRoute } from "next";
import { storeConfig } from "@/config/store";
import { getBrands, getProducts, loadCategories } from "@/lib/catalog";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = storeConfig.siteUrl.replace(/\/$/, "");
  const staticPaths = ["", "/tienda", "/organic-pro", "/herramientas", "/marcas", "/contacto", "/envios", "/terminos", "/privacidad"];

  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path || "/"}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...getProducts().map((product) => ({
      url: `${base}/producto/${product.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(await loadCategories()).map((category) => ({
      url: `${base}/categoria/${category.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...getBrands().map((brand) => ({
      url: `${base}/marca/${brand.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
