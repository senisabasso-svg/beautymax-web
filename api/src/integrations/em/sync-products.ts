import { prisma } from "../../lib/prisma.js";
import { ensureDefaultCategories, slugify } from "../../lib/categories.js";
import { getEmConfig } from "./config.js";
import { listArticulos } from "./client.js";
import { getCursor, saveCursor } from "./cursors.js";
import type { EmArticulo, SyncResult } from "./types.js";

function moneyToInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function stockToInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function textOr(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function articleSlug(codigo: string, nombre: string) {
  const base = slugify(`em-${codigo}-${nombre}`) || slugify(`em-${codigo}`) || `em-${codigo}`;
  return base.slice(0, 80);
}

async function uniqueSlug(base: string, excludeProductId?: string) {
  let candidate = base;
  let i = 2;
  while (true) {
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeProductId) return candidate;
    candidate = `${base}-${i}`.slice(0, 80);
    i += 1;
  }
}

async function resolveCategory(familiaNombre?: string | null) {
  await ensureDefaultCategories();
  const config = getEmConfig();
  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true, slug: true, name: true },
  });

  if (familiaNombre?.trim()) {
    const famSlug = slugify(familiaNombre);
    const bySlug = categories.find((c) => c.slug === famSlug);
    if (bySlug) return bySlug;
    const byName = categories.find(
      (c) => slugify(c.name) === famSlug || familiaNombre.toLowerCase().includes(c.name.toLowerCase()),
    );
    if (byName) return byName;
  }

  const fallback =
    categories.find((c) => c.slug === config.defaultCategory) ??
    categories[0] ??
    null;
  if (!fallback) {
    throw new Error("No hay categorías activas para mapear productos de Easy Management");
  }
  return fallback;
}

function isWebActive(article: EmArticulo, soloWeb: boolean) {
  // Si pedimos solo web, respetamos `publicar`. Si no, todo lo activo de EM sale a la tienda.
  return soloWeb ? Boolean(article.publicar) : true;
}

async function findExistingProduct(article: EmArticulo) {
  const emId = String(article.id);
  const codigo = article.codigo?.trim();

  const byEmId = await prisma.product.findFirst({
    where: { emArticuloId: emId },
    include: { variants: { orderBy: { sortOrder: "asc" } } },
  });
  if (byEmId) return byEmId;

  if (codigo) {
    const byCodigo = await prisma.product.findFirst({
      where: { emCodigo: codigo },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    if (byCodigo) return byCodigo;

    const bySku = await prisma.variant.findFirst({
      where: { sku: codigo },
      include: { product: { include: { variants: { orderBy: { sortOrder: "asc" } } } } },
    });
    if (bySku) return bySku.product;
  }

  return null;
}

async function upsertArticle(article: EmArticulo): Promise<"created" | "updated" | "skipped"> {
  const config = getEmConfig();
  const codigo = article.codigo?.trim();
  if (!codigo) return "skipped";

  const name = textOr(article.nombre, codigo);
  const description = textOr(
    article.informacion || article.descripcion1 || article.descripcion2,
    name,
  );
  const shortDescription = textOr(article.descripcion1 || article.descripcion2, name).slice(0, 280);
  const label = textOr(article.unidadMedida, "Único");
  const price = moneyToInt(article.precioConImp);
  const stock = stockToInt(article.stock);
  const category = await resolveCategory(article.familia?.nombre);
  const emId = String(article.id);
  const active = isWebActive(article, config.soloWeb);
  const existing = await findExistingProduct(article);
  const now = new Date();

  if (!existing) {
    const slug = await uniqueSlug(articleSlug(codigo, name));
    await prisma.product.create({
      data: {
        slug,
        name,
        brand: config.defaultBrand,
        category: category.slug,
        categoryId: category.id,
        shortDescription,
        description,
        images: ["/productos/placeholder.svg"],
        active,
        source: "em",
        emArticuloId: emId,
        emCodigo: codigo,
        emSyncedAt: now,
        variants: {
          create: {
            label,
            price,
            sku: codigo,
            stock,
            sortOrder: 0,
            emArticuloId: emId,
          },
        },
      },
    });
    return "created";
  }

  const primaryVariant =
    existing.variants.find((v) => v.emArticuloId === emId) ||
    existing.variants.find((v) => v.sku === codigo) ||
    existing.variants[0];

  // Al vincularlo con EM pasa a ser producto de la API (único origen de la tienda).
  const keepManualCopy = existing.source === "manual";

  await prisma.product.update({
    where: { id: existing.id },
    data: {
      ...(keepManualCopy
        ? {
            // Conservamos textos/fotos cargados a mano; precio/stock vienen de EM.
            active,
          }
        : {
            name,
            category: category.slug,
            categoryId: category.id,
            shortDescription,
            description,
            active,
          }),
      source: "em",
      emArticuloId: emId,
      emCodigo: codigo,
      emSyncedAt: now,
    },
  });

  if (primaryVariant) {
    await prisma.variant.update({
      where: { id: primaryVariant.id },
      data: {
        ...(keepManualCopy ? {} : { label }),
        price,
        sku: codigo,
        stock,
        emArticuloId: emId,
      },
    });
  } else {
    await prisma.variant.create({
      data: {
        productId: existing.id,
        label,
        price,
        sku: codigo,
        stock,
        sortOrder: existing.variants.length,
        emArticuloId: emId,
      },
    });
  }

  return "updated";
}

export async function syncProducts(options: { full?: boolean } = {}): Promise<SyncResult> {
  const config = getEmConfig();
  const desde = options.full ? new Date("2000-01-01T00:00:00.000Z") : await getCursor("products");
  const articles = (await listArticulos({ desde, config })) ?? [];
  const result: SyncResult = {
    kind: "products",
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    fetched: articles.length,
    cursor: null,
  };

  const seenEmIds = new Set<string>();
  let newest = desde;
  for (const article of articles) {
    try {
      const status = await upsertArticle(article);
      if (article.id != null) seenEmIds.add(String(article.id));
      if (status === "created") result.created += 1;
      else if (status === "updated") result.updated += 1;
      else result.skipped += 1;
      newest = new Date();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      result.errors.push(`Artículo ${article.id}/${article.codigo}: ${message}`);
    }
  }

  // La tienda solo publica productos EM: apagamos todo lo manual / local.
  const deactivatedManual = await prisma.product.updateMany({
    where: { source: { not: "em" }, active: true },
    data: { active: false },
  });

  // En sync full, lo que no vino de EM deja de mostrarse en la web.
  let deactivatedMissing = 0;
  if (options.full) {
    if (seenEmIds.size) {
      deactivatedMissing = (
        await prisma.product.updateMany({
          where: {
            source: "em",
            active: true,
            OR: [{ emArticuloId: null }, { emArticuloId: { notIn: [...seenEmIds] } }],
          },
          data: { active: false },
        })
      ).count;
    } else {
      deactivatedMissing = (
        await prisma.product.updateMany({
          where: { source: "em", active: true },
          data: { active: false },
        })
      ).count;
    }
  }

  const deactivated = deactivatedManual.count + deactivatedMissing;
  if (deactivated) {
    result.errors.push(`Desactivados fuera de EM / no listados: ${deactivated}`);
  }

  const cursor = articles.length ? newest : desde;
  const summary = JSON.stringify(result);
  await saveCursor("products", cursor, summary);
  result.cursor = cursor.toISOString();
  return result;
}
