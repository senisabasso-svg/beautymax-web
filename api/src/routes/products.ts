import { Router } from "express";
import { z } from "zod";
import { ensureDefaultCategories } from "../lib/categories.js";
import { prisma } from "../lib/prisma.js";
import { mapProduct } from "../lib/map-product.js";
import { requireAuth } from "../middleware/auth.js";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const { category, brand, featured, q, admin } = req.query;
  const isAdmin = admin === "1" && Boolean(req.headers.authorization);

  const products = await prisma.product.findMany({
    where: {
      ...(isAdmin ? {} : { active: true }),
      ...(typeof category === "string" ? { category } : {}),
      ...(typeof brand === "string" ? { brand: { equals: brand, mode: "insensitive" } } : {}),
      ...(featured === "1" || featured === "true" ? { featured: true } : {}),
      ...(typeof q === "string" && q.trim()
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { brand: { contains: q, mode: "insensitive" } },
              { shortDescription: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });

  return res.json(products.map(mapProduct));
});

productsRouter.get("/:slug", async (req, res) => {
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ slug: req.params.slug }, { id: req.params.slug }],
      active: true,
    },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });
  return res.json(mapProduct(product));
});

const variantSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1),
  price: z.number().int().nonnegative(),
  compareAtPrice: z.number().int().positive().optional().nullable(),
  sku: z.string().optional().nullable(),
  stock: z.number().int().nonnegative(),
  colorName: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

const productSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  shortDescription: z.string().min(1),
  description: z.string().min(1),
  howToUse: z.string().optional().nullable(),
  benefits: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  badges: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  requiresSelection: z.boolean().optional(),
  active: z.boolean().optional(),
  variants: z.array(variantSchema).min(1),
});

async function resolveCategory(slug: string) {
  await ensureDefaultCategories();
  return prisma.category.findUnique({ where: { slug } });
}

productsRouter.post("/", requireAuth, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const data = parsed.data;
  const category = await resolveCategory(data.category);
  if (!category || !category.active) {
    return res.status(400).json({ error: "Elegí una categoría cargada" });
  }
  const created = await prisma.product.create({
    data: {
      slug: data.slug,
      name: data.name,
      brand: data.brand,
      category: category.slug,
      categoryId: category.id,
      shortDescription: data.shortDescription,
      description: data.description,
      howToUse: data.howToUse ?? null,
      benefits: data.benefits ?? [],
      images: data.images ?? [],
      badges: data.badges ?? [],
      featured: data.featured ?? false,
      requiresSelection: data.requiresSelection ?? false,
      active: data.active ?? true,
      variants: {
        create: data.variants.map((v, i) => ({
          label: v.label,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          sku: v.sku ?? null,
          stock: v.stock,
          colorName: v.colorName ?? null,
          colorHex: v.colorHex ?? null,
          sortOrder: v.sortOrder ?? i,
        })),
      },
    },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  return res.status(201).json(mapProduct(created));
});

productsRouter.put("/:id", requireAuth, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Producto no encontrado" });

  const data = parsed.data;
  const category = await resolveCategory(data.category);
  if (!category || (!category.active && category.slug !== existing.category)) {
    return res.status(400).json({ error: "Elegí una categoría cargada" });
  }
  await prisma.variant.deleteMany({ where: { productId: existing.id } });
  const updated = await prisma.product.update({
    where: { id: existing.id },
    data: {
      slug: data.slug,
      name: data.name,
      brand: data.brand,
      category: category.slug,
      categoryId: category.id,
      shortDescription: data.shortDescription,
      description: data.description,
      howToUse: data.howToUse ?? null,
      benefits: data.benefits ?? [],
      images: data.images ?? [],
      badges: data.badges ?? [],
      featured: data.featured ?? false,
      requiresSelection: data.requiresSelection ?? false,
      active: data.active ?? true,
      variants: {
        create: data.variants.map((v, i) => ({
          ...(v.id ? { id: v.id } : {}),
          label: v.label,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          sku: v.sku ?? null,
          stock: v.stock,
          colorName: v.colorName ?? null,
          colorHex: v.colorHex ?? null,
          sortOrder: v.sortOrder ?? i,
        })),
      },
    },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  return res.json(mapProduct(updated));
});

productsRouter.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Producto no encontrado" });
  await prisma.product.update({ where: { id: existing.id }, data: { active: false } });
  return res.json({ ok: true });
});
