import { prisma } from "../../lib/prisma.js";
import { getEmConfig } from "./config.js";
import { listClientes } from "./client.js";
import { getCursor, saveCursor } from "./cursors.js";
import type { SyncResult } from "./types.js";

/**
 * Solo vincula / actualiza clientes web ya existentes (por documento o email).
 * No crea cuentas de salón desde el ERP para no mezclar el alta web con el padrón EM.
 */
export async function syncClients(): Promise<SyncResult> {
  const config = getEmConfig();
  const rows = (await listClientes(false, config)) ?? [];
  const result: SyncResult = {
    kind: "clients",
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
    fetched: rows.length,
    cursor: null,
  };

  for (const row of rows) {
    try {
      const emId = String(row.id);
      const document = row.documento?.trim();
      const email = row.enviarFacturaMail?.trim().toLowerCase() || null;

      const existing =
        (await prisma.client.findFirst({ where: { emClienteId: emId } })) ||
        (document
          ? await prisma.client.findFirst({ where: { document } })
          : null) ||
        (email ? await prisma.client.findFirst({ where: { email } }) : null);

      if (!existing) {
        result.skipped += 1;
        continue;
      }

      await prisma.client.update({
        where: { id: existing.id },
        data: {
          emClienteId: emId,
          emCodigo: row.codigo || existing.emCodigo,
        },
      });
      result.updated += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      result.errors.push(`Cliente ${row.id}: ${message}`);
    }
  }

  const now = new Date();
  await saveCursor("clients", now, JSON.stringify(result));
  result.cursor = now.toISOString();
  return result;
}
