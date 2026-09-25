import type { MetadataRoute } from "next";
import { storeConfig } from "@/config/store";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const base = storeConfig.siteUrl.replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/checkout", "/pedido-confirmado", "/carrito", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
