import { prisma } from "../../lib/prisma.js";
import { getEmConfig } from "./config.js";
import { listStock } from "./client.js";
import { getCursor, saveCursor } from "./cursors.js";
import type { SyncResult } from "./types.js";

function stockToInt(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

export async function syncStock(options: { full?: boolean } = {}): Promise<SyncResult> {
  const config = getEmConfig();
  const desde = options.full ? new Date("2000-01-01T00:00:00.000Z") : await getCursor("stock");
  const rows = (await listStock({ desde, config })) ?? [];
  const result: SyncResult = {
    kind: "stock",
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    fetched: rows.length,
    cursor: null,
  };

  let newest = desde;
  for (const row of rows) {
    try {
      const emId = String(row.ArticuloId);
      const codigo = row.ArticuloCodigo?.trim();
      const stock = stockToInt(row.Stock);

      const variant =
        (await prisma.variant.findFirst({ where: { emArticuloId: emId } })) ||
        (codigo
          ? await prisma.variant.findFirst({ where: { sku: codigo } })
          : null) ||
        (await prisma.product
          .findFirst({
            where: { OR: [{ emArticuloId: emId }, ...(codigo ? [{ emCodigo: codigo }] : [])] },
            include: { variants: { orderBy: { sortOrder: "asc" }, take: 1 } },
          })
          .then((p) => p?.variants[0] ?? null));

      if (!variant) {
        result.skipped += 1;
        continue;
      }

      await prisma.variant.update({
        where: { id: variant.id },
        data: { stock, emArticuloId: emId },
      });
      await prisma.product.update({
        where: { id: variant.productId },
        data: {
          active: row.Publicar,
          emSyncedAt: new Date(),
          ...(codigo ? { emCodigo: codigo, emArticuloId: emId } : { emArticuloId: emId }),
        },
      });
      result.updated += 1;
      if (row.Modificado) {
        const mod = new Date(row.Modificado);
        if (!Number.isNaN(mod.getTime()) && mod > newest) newest = mod;
      } else {
        newest = new Date();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      result.errors.push(`Stock ${row.ArticuloId}: ${message}`);
    }
  }

  const cursor = rows.length ? newest : desde;
  await saveCursor("stock", cursor, JSON.stringify(result));
  result.cursor = cursor.toISOString();
  return result;
}
