import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

export const promoRouter = Router();

const percents = [10, 20, 10, 10, 20, 10, 10, 20] as const;

function makeCode(percent: number) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BM${percent}-${suffix}`;
}

promoRouter.post("/spin", async (_req, res) => {
  const percent = percents[Math.floor(Math.random() * percents.length)];
  const code = makeCode(percent);
  const created = await prisma.promoCode.create({
    data: { code, percent, source: "wheel" },
  });
  return res.json({
    code: created.code,
    percent: created.percent,
    createdAt: created.createdAt,
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
  });
  return res.json(codes);
});

promoRouter.post("/", requireAuth, async (req, res) => {
  const schema = z.object({
    code: z.string().min(3).optional(),
    percent: z.union([z.literal(10), z.literal(20), z.literal(15), z.literal(25)]),
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
