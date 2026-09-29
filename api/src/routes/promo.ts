import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireClient } from "../middleware/auth.js";

export const promoRouter = Router();

const DEFAULT_SEGMENTS = [
  { percent: 10, displayOnly: false },
  { percent: 20, displayOnly: false },
  { percent: 10, displayOnly: false },
  { percent: 15, displayOnly: true },
  { percent: 10, displayOnly: false },
  { percent: 20, displayOnly: false },
  { percent: 10, displayOnly: false },
  { percent: 25, displayOnly: true },
];

function makeCode(percent: number) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BM${percent}-${suffix}`;
}

async function ensureRouletteDefaults() {
  const count = await prisma.rouletteDiscount.count();
  if (count > 0) return;
  await prisma.rouletteDiscount.createMany({
    data: DEFAULT_SEGMENTS.map((item, index) => ({
      percent: item.percent,
      displayOnly: item.displayOnly,
      sortOrder: index,
      active: true,
    })),
  });
}

async function getWheelSegments() {
  await ensureRouletteDefaults();
  return prisma.rouletteDiscount.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
}

promoRouter.get("/wheel", async (_req, res) => {
  const segments = await getWheelSegments();
  return res.json(
    segments.map((s) => ({
      id: s.id,
      percent: s.percent,
      displayOnly: s.displayOnly,
      label: s.label,
    })),
  );
});

promoRouter.post("/spin", requireClient, async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.client!.sub },
    include: {
      promoCodes: {
        where: { usedAt: null, source: "wheel" },
        take: 1,
      },
    },
  });

  if (!client || client.status !== "active") {
    return res.status(403).json({ error: "Solo clientes activos pueden girar la ruleta" });
  }

  if (client.promoCodes.length > 0) {
    const existing = client.promoCodes[0];
    return res.status(409).json({
      error: "Ya tenés un código de descuento activo. Usalo antes de girar de nuevo.",
      code: existing.code,
      percent: existing.percent,
    });
  }

  const segments = await getWheelSegments();
  const winnable = segments.filter((s) => !s.displayOnly);
  if (winnable.length === 0) {
    return res.status(503).json({ error: "No hay descuentos disponibles en la ruleta" });
  }

  const picked = winnable[Math.floor(Math.random() * winnable.length)];
  const code = makeCode(picked.percent);
  const created = await prisma.promoCode.create({
    data: {
      code,
      percent: picked.percent,
      source: "wheel",
      clientId: client.id,
    },
  });

  return res.json({
    code: created.code,
    percent: created.percent,
    createdAt: created.createdAt,
    segments: segments.map((s) => s.percent),
  });
});

promoRouter.post("/validate", async (req, res) => {
  const code = z.string().min(3).safeParse(req.body?.code);
  if (!code.success) return res.status(400).json({ error: "Código inválido" });
  const normalized = code.data.trim().toUpperCase().replace(/\s+/g, "");
  const promo = await prisma.promoCode.findUnique({ where: { code: normalized } });
  if (!promo || promo.usedAt) {
    return res.status(404).json({ error: "Código no válido o ya usado" });
  }
  return res.json({ code: promo.code, percent: promo.percent });
});

promoRouter.get("/", requireAuth, async (_req, res) => {
  const codes = await prisma.promoCode.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      client: { select: { id: true, name: true, email: true, salonName: true } },
    },
  });
  return res.json(codes);
});

promoRouter.post("/", requireAuth, async (req, res) => {
  const schema = z.object({
    code: z.string().min(3).optional(),
    percent: z.number().int().min(1).max(90),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });
  const percent = parsed.data.percent;
  const code = (parsed.data.code ?? makeCode(percent)).trim().toUpperCase();
  const created = await prisma.promoCode.create({
    data: { code, percent, source: "admin" },
  });
  return res.status(201).json(created);
});

promoRouter.get("/roulette-discounts", requireAuth, async (_req, res) => {
  await ensureRouletteDefaults();
  const items = await prisma.rouletteDiscount.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return res.json(items);
});

promoRouter.post("/roulette-discounts", requireAuth, async (req, res) => {
  const schema = z.object({
    percent: z.number().int().min(1).max(90),
    displayOnly: z.boolean().optional(),
    label: z.string().max(40).optional(),
    active: z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  const maxOrder = await prisma.rouletteDiscount.aggregate({ _max: { sortOrder: true } });
  const created = await prisma.rouletteDiscount.create({
    data: {
      percent: parsed.data.percent,
      displayOnly: parsed.data.displayOnly ?? false,
      label: parsed.data.label?.trim() || null,
      active: parsed.data.active ?? true,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });
  return res.status(201).json(created);
});

promoRouter.patch("/roulette-discounts/:id", requireAuth, async (req, res) => {
  const schema = z.object({
    percent: z.number().int().min(1).max(90).optional(),
    displayOnly: z.boolean().optional(),
    label: z.string().max(40).nullable().optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos inválidos" });

  const existing = await prisma.rouletteDiscount.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Descuento no encontrado" });

  const updated = await prisma.rouletteDiscount.update({
    where: { id: existing.id },
    data: {
      ...(parsed.data.percent !== undefined ? { percent: parsed.data.percent } : {}),
      ...(parsed.data.displayOnly !== undefined ? { displayOnly: parsed.data.displayOnly } : {}),
      ...(parsed.data.label !== undefined ? { label: parsed.data.label } : {}),
      ...(parsed.data.active !== undefined ? { active: parsed.data.active } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
    },
  });
  return res.json(updated);
});

promoRouter.delete("/roulette-discounts/:id", requireAuth, async (req, res) => {
  const existing = await prisma.rouletteDiscount.findUnique({ where: { id: req.params.id } });
  if (!existing) return res.status(404).json({ error: "Descuento no encontrado" });
  await prisma.rouletteDiscount.delete({ where: { id: existing.id } });
  return res.json({ ok: true });
});
