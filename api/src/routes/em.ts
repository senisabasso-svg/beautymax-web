import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import {
  getEmConfig,
  listCursors,
  pingEm,
  pushOrderToEm,
  syncClients,
  syncImages,
  syncProducts,
  syncStock,
} from "../integrations/em/index.js";

export const emRouter = Router();

emRouter.use(requireAuth);

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
