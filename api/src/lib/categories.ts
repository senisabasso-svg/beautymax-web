import { prisma } from "./prisma.js";
import { defaultCategories } from "./default-categories.js";

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function ensureDefaultCategories() {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({
    data: defaultCategories.map((category, index) => ({
      ...category,
      sortOrder: index,
      active: true,
    })),
  });
  await linkProductsBySlug();
}

/** Asocia productos que todavía guardan solo el slug de categoría. */
export async function linkProductsBySlug() {
  const categories = await prisma.category.findMany({ select: { id: true, slug: true } });
  for (const category of categories) {
    await prisma.product.updateMany({
      where: { category: category.slug, categoryId: null },
      data: { categoryId: category.id },
    });
  }
}
