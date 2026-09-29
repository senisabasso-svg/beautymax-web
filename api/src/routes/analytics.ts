import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const analyticsRouter = Router();

const eventSchema = z.object({
  path: z.string().min(1).max(180),
  kind: z.enum(["page", "product"]),
  label: z.string().max(180).optional(),
  sessionId: z.string().max(80).optional(),
});

analyticsRouter.post("/", async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Evento inválido" });

  const path = parsed.data.path.split("?")[0].slice(0, 180);
  if (!path.startsWith("/") || path.startsWith("/admin")) {
    return res.json({ ok: true });
  }

  const sessionId = parsed.data.sessionId?.trim() || null;
  if (sessionId) {
    const recent = await prisma.pageView.findFirst({
      where: {
        sessionId,
        path,
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
      },
      select: { id: true },
    });
    if (recent) return res.json({ ok: true });
  }

  let label = parsed.data.label?.trim() || path;
  if (parsed.data.kind === "product") {
    const slug = decodeURIComponent(path.replace(/^\/producto\//, "").split("/")[0] || "");
    if (slug) {
      const product = await prisma.product.findUnique({
        where: { slug },
        select: { name: true },
      });
      label = product?.name || slug;
    }
  }

  await prisma.pageView.create({
    data: {
      path,
      kind: parsed.data.kind,
      label,
      sessionId,
    },
  });

  return res.status(201).json({ ok: true });
});
