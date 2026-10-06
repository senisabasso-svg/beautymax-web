import { prisma } from "../../lib/prisma.js";
import { prepareProductPhoto } from "../../lib/images.js";
import { getEmConfig } from "./config.js";
import { listImagenes } from "./client.js";
import { getCursor, saveCursor } from "./cursors.js";
import type { SyncResult } from "./types.js";

function decodeBase64Image(raw: string) {
  const trimmed = raw.trim();
  const match = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (match) {
    return Buffer.from(match[2], "base64");
  }
  return Buffer.from(trimmed, "base64");
}

export async function syncImages(options: { full?: boolean } = {}): Promise<SyncResult> {
  const config = getEmConfig();
  const desde = options.full ? new Date("2000-01-01T00:00:00.000Z") : await getCursor("images");
  const rows = (await listImagenes({ desde, config })) ?? [];
  const result: SyncResult = {
    kind: "images",
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
      if (!row.imagenBase64?.trim()) {
        result.skipped += 1;
        continue;
      }

      const emId = String(row.articuloId);
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { emArticuloId: emId },
            ...(row.articuloCodigo ? [{ emCodigo: row.articuloCodigo }] : []),
          ],
        },
      });
      if (!product) {
        result.skipped += 1;
        continue;
      }

      const buffer = decodeBase64Image(row.imagenBase64);
      const prepared = await prepareProductPhoto(buffer);
      const saved = await prisma.storedImage.create({
        data: { mimeType: prepared.mimeType, bytes: prepared.bytes },
      });
      const url = config.mediaBaseUrl
        ? `${config.mediaBaseUrl}/media/${saved.id}`
        : `/media/${saved.id}`;

      await prisma.product.update({
        where: { id: product.id },
        data: {
          images: [url],
          emSyncedAt: new Date(),
        },
      });
      result.updated += 1;

      if (row.modificado) {
        const mod = new Date(row.modificado);
        if (!Number.isNaN(mod.getTime()) && mod > newest) newest = mod;
      } else {
        newest = new Date();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      result.errors.push(`Imagen ${row.articuloId}: ${message}`);
    }
  }

  const cursor = rows.length ? newest : desde;
  await saveCursor("images", cursor, JSON.stringify(result));
  result.cursor = cursor.toISOString();
  return result;
}
