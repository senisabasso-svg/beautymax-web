import { prisma } from "../../lib/prisma.js";
import { getEmConfig } from "./config.js";
import { listClientes } from "./client.js";
import { getCursor, saveCursor } from "./cursors.js";
import type { EmCliente, SyncResult } from "./types.js";

function textOr(value: string | null | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function mapEmClient(row: EmCliente) {
  const emId = String(row.id);
  const codigo = textOr(row.codigo, emId);
  const name = textOr(row.nombre || row.razonSocial, `Cliente ${codigo}`);
  const document = textOr(row.documento, `EM-${codigo}`).toUpperCase().replace(/\s+/g, "");
  const emailRaw = row.enviarFacturaMail?.trim().toLowerCase() || null;
  return {
    emId,
    codigo,
    name,
    document,
    address: textOr(row.direccion, "Sin dirección"),
    city: textOr(row.ciudad, "Sin ciudad"),
    phone: textOr(row.telefono, "00000000").replace(/\s+/g, ""),
    salonName: textOr(row.razonSocial || row.nombre, "Cliente general"),
    email: emailRaw,
  };
}

/**
 * Vincula clientes web existentes y crea como "imported" los que vienen de EM y no están en Beautymax.
 */
export async function syncClients(options: { all?: boolean } = {}): Promise<SyncResult> {
  const config = getEmConfig();
  const all = options.all ?? true;
  const rows = (await listClientes(all, config)) ?? [];
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
      if (row.esGenerico) {
        result.skipped += 1;
        continue;
      }

      const mapped = mapEmClient(row);

      const existing =
        (await prisma.client.findFirst({ where: { emClienteId: mapped.emId } })) ||
        (await prisma.client.findFirst({ where: { document: mapped.document } })) ||
        (mapped.email
          ? await prisma.client.findFirst({ where: { email: mapped.email } })
          : null);

      if (!existing) {
        let email = mapped.email;
        if (email) {
          const clash = await prisma.client.findUnique({ where: { email } });
          if (clash) email = null;
        }

        await prisma.client.create({
          data: {
            name: mapped.name,
            document: mapped.document,
            address: mapped.address,
            city: mapped.city,
            phone: mapped.phone,
            salonName: mapped.salonName,
            email,
            status: "imported",
            emClienteId: mapped.emId,
            emCodigo: mapped.codigo,
            passwordHash: null,
          },
        });
        result.created += 1;
        continue;
      }

      // Cliente web (pending/active): solo vínculo EM, sin pisar el alta del salón.
      if (existing.status === "pending" || existing.status === "active") {
        await prisma.client.update({
          where: { id: existing.id },
          data: {
            emClienteId: mapped.emId,
            emCodigo: mapped.codigo,
          },
        });
        result.updated += 1;
        continue;
      }

      // Importado (u otro): refrescar datos desde EM.
      let email = existing.email;
      if (!email && mapped.email) {
        const clash = await prisma.client.findUnique({ where: { email: mapped.email } });
        if (!clash) email = mapped.email;
      }

      await prisma.client.update({
        where: { id: existing.id },
        data: {
          name: mapped.name,
          document: mapped.document,
          address: mapped.address,
          city: mapped.city,
          phone: mapped.phone,
          salonName: mapped.salonName,
          email,
          status: "imported",
          emClienteId: mapped.emId,
          emCodigo: mapped.codigo,
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
