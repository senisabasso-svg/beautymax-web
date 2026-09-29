import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defaultCategories } from "../src/lib/default-categories.ts";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

type SeedProduct = {
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

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@beautymax.uy").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "BeautymaxAdmin2026!";
  const name = process.env.ADMIN_NAME ?? "Beautymax Admin";

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  for (const [index, category] of defaultCategories.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        ...category,
        sortOrder: index,
        active: true,
      },
    });
  }

  const seedPath = join(__dirname, "seed-products.json");
  if (!existsSync(seedPath)) {
    console.warn("No está seed-products.json — solo se creó el admin.");
    console.log(`Admin: ${email} / ${password}`);
    return;
  }

  const products = JSON.parse(readFileSync(seedPath, "utf8")) as SeedProduct[];

  const categoryBySlug = new Map(
    (await prisma.category.findMany({ select: { id: true, slug: true } })).map((category) => [
      category.slug,
      category.id,
    ]),
  );

  for (const product of products) {
    const categoryId = categoryBySlug.get(product.category) ?? null;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        brand: product.brand,
        shortDescription: product.shortDescription,
        description: product.description,
        howToUse: product.howToUse ?? null,
        benefits: product.benefits ?? [],
        images: product.images,
        badges: product.badges ?? [],
        featured: Boolean(product.featured),
        requiresSelection: Boolean(product.requiresSelection),
        active: true,
      },
      create: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        categoryId,
        shortDescription: product.shortDescription,
        description: product.description,
        howToUse: product.howToUse ?? null,
        benefits: product.benefits ?? [],
        images: product.images,
        badges: product.badges ?? [],
        featured: Boolean(product.featured),
        requiresSelection: Boolean(product.requiresSelection),
        variants: {
          create: product.variants.map((v, i) => ({
            id: v.id,
            label: v.label,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            sku: v.sku ?? null,
            stock: v.stock,
            colorName: v.colorName ?? null,
            colorHex: v.colorHex ?? null,
            sortOrder: i,
          })),
        },
      },
    });

    // Sync variants on update (upsert doesn't recreate children)
    const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
    if (existing) {
      for (const [i, v] of product.variants.entries()) {
        await prisma.variant.upsert({
          where: { id: v.id },
          update: {
            label: v.label,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            sku: v.sku ?? null,
            stock: v.stock,
            colorName: v.colorName ?? null,
            colorHex: v.colorHex ?? null,
            sortOrder: i,
            productId: existing.id,
          },
          create: {
            id: v.id,
            productId: existing.id,
            label: v.label,
            price: v.price,
            compareAtPrice: v.compareAtPrice ?? null,
            sku: v.sku ?? null,
            stock: v.stock,
            colorName: v.colorName ?? null,
            colorHex: v.colorHex ?? null,
            sortOrder: i,
          },
        });
      }
    }
  }

  for (const [slug, id] of categoryBySlug) {
    await prisma.product.updateMany({
      where: { category: slug, categoryId: null },
      data: { categoryId: id },
    });
  }

  console.log(`Seed OK: ${products.length} productos + admin ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
