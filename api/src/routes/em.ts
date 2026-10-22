import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  epochCursor,
  getArticuloById,
  getClienteByCodigo,
  getClienteById,
  getEmConfig,
  listArticulos,
  listCiudades,
  listClientes,
  listCursors,
  listFamilias,
  listImagenes,
  listStock,
  pingEm,
  pushOrderToEm,
  syncClients,
  syncImages,
  syncProducts,
  syncStock,
} from "../integrations/em/index.js";

export const emRouter = Router();

emRouter.use(requireAuth);

function parseBool(value: unknown, fallback: boolean) {
  if (value == null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  const raw = String(value).toLowerCase();
  if (["1", "true", "yes", "on"].includes(raw)) return true;
  if (["0", "false", "no", "off"].includes(raw)) return false;
  return fallback;
}

function paginate<T>(items: T[] | null | undefined, query: { limit?: unknown; offset?: unknown }) {
  const list = Array.isArray(items) ? items : [];
  const limitRaw = Number(query.limit ?? 100);
  const offsetRaw = Number(query.offset ?? 0);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 1000) : 100;
  const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;
  return {
    count: list.length,
    limit,
    offset,
    items: list.slice(offset, offset + limit),
  };
}

function emError(res: import("express").Response, error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  return res.status(400).json({ error: message });
}

emRouter.get("/status", async (_req, res) => {
  const config = getEmConfig();
  const cursors = await listCursors();
  return res.json({
    enabled: config.enabled,
    configured: Boolean(config.baseUrl && config.token && config.listaPrecio),
    orderPushReady: Boolean(
      config.enabled && config.baseUrl && config.token && config.listaPrecio && config.tipoDocPedido,
    ),
    autoPushOrders: config.autoPushOrders,
    listaPrecio: config.listaPrecio || null,
    deposito: config.deposito,
    soloWeb: config.soloWeb,
    terminal: config.terminal,
    usuario: config.usuario,
    defaultCategory: config.defaultCategory,
    defaultBrand: config.defaultBrand,
    mediaBaseUrl: config.mediaBaseUrl || null,
    cursors: cursors.map((c) => ({
      id: c.id,
      lastAt: c.lastAt,
      summary: c.summary,
      updatedAt: c.updatedAt,
    })),
  });
});

emRouter.post("/ping", async (_req, res) => {
  try {
    const result = await pingEm();
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar";
    return res.status(400).json({ error: message });
  }
});

const syncBody = z.object({
  full: z.boolean().optional(),
});

/** Preview / listados crudos desde Easy Management (no escriben en Postgres). */
emRouter.get("/remote/familias", async (_req, res) => {
  try {
    const items = (await listFamilias()) ?? [];
    return res.json({ count: items.length, items });
  } catch (error) {
    return emError(res, error, "Error listando familias");
  }
});

emRouter.get("/remote/clientes", async (req, res) => {
  try {
    const all = parseBool(req.query.all, false);
    const items = (await listClientes(all)) ?? [];
    return res.json(paginate(items, req.query));
  } catch (error) {
    return emError(res, error, "Error listando clientes EM");
  }
});

emRouter.get("/remote/clientes/ciudades", async (req, res) => {
  try {
    const activos = parseBool(req.query.activos, true);
    const items = (await listCiudades(activos)) ?? [];
    return res.json({ count: items.length, items });
  } catch (error) {
    return emError(res, error, "Error listando ciudades EM");
  }
});

emRouter.get("/remote/clientes/codigo/:codigo", async (req, res) => {
  try {
    const item = await getClienteByCodigo(req.params.codigo);
    if (!item) return res.status(404).json({ error: "Cliente no encontrado en EM" });
    return res.json(item);
  } catch (error) {
    return emError(res, error, "Error obteniendo cliente EM");
  }
});

emRouter.get("/remote/clientes/id/:id", async (req, res) => {
  try {
    const item = await getClienteById(req.params.id);
    if (!item) return res.status(404).json({ error: "Cliente no encontrado en EM" });
    return res.json(item);
  } catch (error) {
    return emError(res, error, "Error obteniendo cliente EM");
  }
});

emRouter.get("/remote/articulos", async (req, res) => {
  try {
    const config = getEmConfig();
    const activos = parseBool(req.query.activos, true);
    const soloWeb = parseBool(req.query.soloWeb, config.soloWeb);
    const full = parseBool(req.query.full, true);
    const desde = full ? epochCursor() : new Date(String(req.query.desde ?? epochCursor().toISOString()));
    const items = (await listArticulos({ activos, soloWeb, desde })) ?? [];
    return res.json({
      ...paginate(items, req.query),
      filtros: { activos, soloWeb, listaPrecio: config.listaPrecio, desde: desde.toISOString() },
    });
  } catch (error) {
    return emError(res, error, "Error listando artículos EM");
  }
});

emRouter.get("/remote/articulos/:id", async (req, res) => {
  try {
    const item = await getArticuloById(req.params.id);
    if (!item) return res.status(404).json({ error: "Artículo no encontrado en EM" });
    return res.json(item);
  } catch (error) {
    return emError(res, error, "Error obteniendo artículo EM");
  }
});

emRouter.get("/remote/stock", async (req, res) => {
  try {
    const activos = parseBool(req.query.activos, true);
    const full = parseBool(req.query.full, true);
    const desde = full ? epochCursor() : new Date(String(req.query.desde ?? epochCursor().toISOString()));
    const items = (await listStock({ activos, desde })) ?? [];
    return res.json({
      ...paginate(items, req.query),
      filtros: { activos, desde: desde.toISOString() },
    });
  } catch (error) {
    return emError(res, error, "Error listando stock EM");
  }
});

emRouter.get("/remote/imagenes", async (req, res) => {
  try {
    const activos = parseBool(req.query.activos, true);
    const full = parseBool(req.query.full, true);
    const desde = full ? epochCursor() : new Date(String(req.query.desde ?? epochCursor().toISOString()));
    const items = (await listImagenes({ activos, desde })) ?? [];
    // No mandamos base64 gigante al admin salvo que pidan includeBase64=1
    const includeBase64 = parseBool(req.query.includeBase64, false);
    const mapped = items.map((row) => ({
      ...row,
      imagenBase64: includeBase64 ? row.imagenBase64 : undefined,
      tieneImagen: Boolean(row.imagenBase64?.trim()),
      imagenBase64Chars: row.imagenBase64?.length ?? 0,
    }));
    return res.json({
      ...paginate(mapped, req.query),
      filtros: { activos, desde: desde.toISOString() },
    });
  } catch (error) {
    return emError(res, error, "Error listando imágenes EM");
  }
});

emRouter.post("/sync/products", async (req, res) => {
  const parsed = syncBody.safeParse(req.body ?? {});
  try {
    const result = await syncProducts({ full: parsed.success ? parsed.data.full : false });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sincronizando productos";
    return res.status(400).json({ error: message });
  }
});

emRouter.post("/sync/stock", async (req, res) => {
  const parsed = syncBody.safeParse(req.body ?? {});
  try {
    const result = await syncStock({ full: parsed.success ? parsed.data.full : false });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sincronizando stock";
    return res.status(400).json({ error: message });
  }
});

emRouter.post("/sync/images", async (req, res) => {
  const parsed = syncBody.safeParse(req.body ?? {});
  try {
    const result = await syncImages({ full: parsed.success ? parsed.data.full : false });
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sincronizando imágenes";
    return res.status(400).json({ error: message });
  }
});

emRouter.post("/sync/clients", async (_req, res) => {
  try {
    const result = await syncClients();
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error sincronizando clientes";
    return res.status(400).json({ error: message });
  }
});

emRouter.post("/sync/all", async (req, res) => {
  const parsed = syncBody.safeParse(req.body ?? {});
  const full = parsed.success ? Boolean(parsed.data.full) : false;
  try {
    const products = await syncProducts({ full });
    const stock = await syncStock({ full });
    const images = await syncImages({ full });
    const clients = await syncClients();
    return res.json({ products, stock, images, clients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error en sincronización completa";
    return res.status(400).json({ error: message });
  }
});

emRouter.post("/orders/:id/push", async (req, res) => {
  try {
    const result = await pushOrderToEm(req.params.id);
    return res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el pedido";
    return res.status(400).json({ error: message });
  }
});
