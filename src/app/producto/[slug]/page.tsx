import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductPurchase } from "@/components/product/ProductPurchase";
import { ProductTabs } from "@/components/product/ProductTabs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Container } from "@/components/ui/container";
import { storeConfig } from "@/config/store";
import {
  getProductBySlug,
  getRelatedProducts,
  isInStock,
  loadCatalog,
  maxPrice,
  minPrice,
} from "@/lib/catalog";
import { brandSlug } from "@/lib/utils";

type Params = { slug: string };

export async function generateStaticParams() {
  const products = await loadCatalog();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  await loadCatalog();
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images.map((image) => ({ url: image, alt: `${product.name} de ${product.brand}` })),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  await loadCatalog();
  const product = getProductBySlug(slug);
  if (!product) notFound();
  const related = getRelatedProducts(product);
  const low = minPrice(product);
  const high = maxPrice(product);

  return (
    <Container className="py-8 md:py-14">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.description,
          image: product.images.map((image) => new URL(image, storeConfig.siteUrl).toString()),
          sku: product.variants[0]?.sku,
          brand: { "@type": "Brand", name: product.brand },
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: storeConfig.currency,
            lowPrice: low,
            highPrice: high,
            availability: isInStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            url: `${storeConfig.siteUrl}/producto/${product.slug}`,
          },
        }}
      />
      <nav aria-label="Miga de pan" className="mb-6 text-[11px] uppercase tracking-[0.14em] text-muted">
        <Link href="/tienda" className="hover:text-ink">
          Tienda
        </Link>
        <span className="px-2">/</span>
        <Link href={`/marca/${brandSlug(product.brand)}`} className="hover:text-ink">
          {product.brand}
        </Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} name={product.name} brand={product.brand} />
        <ProductPurchase product={product} />
      </div>
      <ProductTabs product={product} />
      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-serif text-4xl text-ink">También te puede interesar</h2>
          <div className="gold-line mt-4 h-px w-16" />
          <div className="mt-8">
            <ProductGrid products={related} />
          </div>
        </section>
      ) : null}
    </Container>
  );
}
