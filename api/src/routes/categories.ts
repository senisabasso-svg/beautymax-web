import { Prisma } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { ensureDefaultCategories, linkProductsBySlug, slugify } from "../lib/categories.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const categoriesRouter = Router();

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  eyebrow: z.string().optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

function mapCategory(category: {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  sortOrder: number;
  active: boolean;
  _count?: { products: number };
}) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    eyebrow: category.eyebrow,
    description: category.description,
    sortOrder: category.sortOrder,
    active: category.active,
    productCount: category._count?.products ?? 0,
  };
}

categoriesRouter.get("/", async (_req, res) => {
  await ensureDefaultCategories();
  const items = await prisma.category.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return res.json(items.map((item) => mapCategory(item)));
});

categoriesRouter.get("/manage", requireAuth, async (_req, res) => {
  await ensureDefaultCategories();
  await linkProductsBySlug();
  const items = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return res.json(items.map(mapCategory));
});

categoriesRouter.post("/", requireAuth, async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }

  const name = parsed.data.name.trim();
  const slug = slugify(parsed.data.slug?.trim() || name);
  if (!slug) return res.status(400).json({ error: "El slug no es válido" });

  const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
  try {
    const created = await prisma.category.create({
      data: {
        name,
        slug,
        eyebrow: parsed.data.eyebrow?.trim() ?? "",
        description: parsed.data.description?.trim() ?? "",
        active: parsed.data.active ?? true,
        sortOrder: parsed.data.sortOrder ?? (maxOrder._max.sortOrder ?? -1) + 1,
      },
      include: { _count: { select: { products: true } } },
    });
    return res.status(201).json(mapCategory(created));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe una categoría con ese slug" });
    }
    throw error;
  }
});

categoriesRouter.patch("/:id", requireAuth, async (req, res) => {
  const parsed = categorySchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", details: parsed.error.flatten() });
  }

  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Categoría no encontrada" });

  const name = parsed.data.name?.trim();
  const slug = parsed.data.slug !== undefined ? slugify(parsed.data.slug) : undefined;
  if (slug !== undefined && !slug) return res.status(400).json({ error: "El slug no es válido" });

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const category = await tx.category.update({
        where: { id: existing.id },
        data: {
          ...(name ? { name } : {}),
          ...(slug ? { slug } : {}),
          ...(parsed.data.eyebrow !== undefined ? { eyebrow: parsed.data.eyebrow.trim() } : {}),
          ...(parsed.data.description !== undefined ? { description: parsed.data.description.trim() } : {}),
          ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
          ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
        },
        include: { _count: { select: { products: true } } },
      });
      if (slug && slug !== existing.slug) {
        await tx.product.updateMany({
          where: { categoryId: existing.id },
          data: { category: slug },
        });
      }
      return category;
    });
    return res.json(mapCategory(updated));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe una categoría con ese slug" });
    }
    throw error;
  }
});

categoriesRouter.post("/:id/products", requireAuth, async (req, res) => {
  const parsed = z.object({ productId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) return res.status(404).json({ error: "Categoría no encontrada" });

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return res.status(404).json({ error: "Producto no encontrado" });

  await prisma.product.update({
    where: { id: product.id },
    data: { categoryId: category.id, category: category.slug },
  });

  return res.json({ ok: true });
});

categoriesRouter.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Categoría no encontrada" });

  const linked = await prisma.product.count({
    where: { OR: [{ categoryId: existing.id }, { category: existing.slug }] },
  });
  if (linked > 0) {
    return res.status(409).json({
      error: "Hay productos asociados. Movelos a otra categoría antes de eliminar.",
    });
  }

  await prisma.category.delete({ where: { id: existing.id } });
  return res.json({ ok: true });
});
