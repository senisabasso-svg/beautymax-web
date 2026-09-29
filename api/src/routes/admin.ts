import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { buildReport } from "../lib/reports.js";
import { requireAuth } from "../middleware/auth.js";

export const adminRouter = Router();

adminRouter.get("/stats", requireAuth, async (_req, res) => {
  const [products, orders, unusedCodes, revenue, pendingClients, activeClients] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.promoCode.count({ where: { usedAt: null } }),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.client.count({ where: { status: "pending" } }),
    prisma.client.count({ where: { status: "active" } }),
  ]);
  const recent = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: true },
  });
  return res.json({
    products,
    orders,
    unusedCodes,
    revenue: revenue._sum.total ?? 0,
    pendingClients,
    activeClients,
    recent,
  });
});

adminRouter.get("/reports", requireAuth, async (req, res) => {
  const raw = Number(req.query.days ?? 30);
  const days = raw === 0 ? 0 : [7, 30, 90].includes(raw) ? raw : 30;
  const report = await buildReport(days);
  return res.json(report);
});
