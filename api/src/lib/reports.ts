import { prisma } from "./prisma.js";

function sinceDate(days: number) {
  if (days <= 0) return null;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function dayKey(date: Date) {
  const shifted = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

function hoursBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / 36e5);
}

function bucket(hours: number) {
  if (hours < 24) return "Menos de 24 h";
  if (hours < 72) return "1 a 3 días";
  if (hours < 168) return "3 a 7 días";
  return "Más de una semana";
}

export async function buildReport(days: number) {
  const since = sinceDate(days);
  const now = new Date();

  const [orders, openOrders, views] = await Promise.all([
    prisma.order.findMany({
      where: since ? { createdAt: { gte: since } } : undefined,
      include: { items: true, milestones: { orderBy: { createdAt: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.order.findMany({
      where: { status: { in: ["nuevo", "confirmado", "enviado"] } },
      include: { milestones: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pageView.findMany({
      where: since ? { createdAt: { gte: since } } : undefined,
      select: { path: true, kind: true, label: true, sessionId: true, createdAt: true },
    }),
  ]);

  const byStatus = new Map<string, number>();
  const byDelivery = new Map<string, number>();
  const byPayment = new Map<string, number>();
  const byDepartment = new Map<string, number>();
  const revenueDays = new Map<string, { total: number; orders: number }>();
  const sold = new Map<string, number>();
  const deliveryHours: number[] = [];

  let revenue = 0;
  for (const order of orders) {
    byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1);
    byDelivery.set(order.delivery, (byDelivery.get(order.delivery) ?? 0) + 1);
    byPayment.set(order.payment, (byPayment.get(order.payment) ?? 0) + 1);
    byDepartment.set(order.department, (byDepartment.get(order.department) ?? 0) + 1);
    revenue += order.total;
    const key = dayKey(order.createdAt);
    const day = revenueDays.get(key) ?? { total: 0, orders: 0 };
    day.total += order.total;
    day.orders += 1;
    revenueDays.set(key, day);
    for (const item of order.items) {
      sold.set(item.name, (sold.get(item.name) ?? 0) + item.quantity);
    }
    if (order.status === "entregado") {
      const done = order.milestones.find((m) => m.status === "entregado");
      const start = order.milestones[0]?.createdAt ?? order.createdAt;
      const end = done?.createdAt ?? order.updatedAt;
      deliveryHours.push(hoursBetween(start, end));
    }
  }

  const delayBuckets = new Map<string, number>([
    ["Menos de 24 h", 0],
    ["1 a 3 días", 0],
    ["3 a 7 días", 0],
    ["Más de una semana", 0],
  ]);
  const slowest = openOrders
    .map((order) => {
      const hours = hoursBetween(order.createdAt, now);
      const stuckSince = order.milestones[0]?.createdAt ?? order.createdAt;
      const hoursInStatus = hoursBetween(stuckSince, now);
      const label = bucket(hours);
      delayBuckets.set(label, (delayBuckets.get(label) ?? 0) + 1);
      return {
        id: order.id,
        publicId: order.publicId,
        customerName: order.customerName,
        city: order.city,
        status: order.status,
        hours: Math.round(hours),
        hoursInStatus: Math.round(hoursInStatus),
      };
    })
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 8);

  const visitDays = new Map<string, { visits: number; productViews: number; sessions: Set<string> }>();
  const pages = new Map<string, number>();
  const products = new Map<string, { label: string; views: number }>();
  const sessions = new Set<string>();

  for (const view of views) {
    const key = dayKey(view.createdAt);
    const day = visitDays.get(key) ?? { visits: 0, productViews: 0, sessions: new Set<string>() };
    day.visits += 1;
    if (view.kind === "product") day.productViews += 1;
    if (view.sessionId) {
      day.sessions.add(view.sessionId);
      sessions.add(view.sessionId);
    }
    visitDays.set(key, day);
    if (view.kind === "page") pages.set(view.path, (pages.get(view.path) ?? 0) + 1);
    if (view.kind === "product") {
      const current = products.get(view.label) ?? { label: view.label, views: 0 };
      current.views += 1;
      products.set(view.label, current);
    }
  }

  const daysInRange = fillDays(since, now);
  const series = daysInRange.map((date) => ({
    date,
    revenue: revenueDays.get(date)?.total ?? 0,
    orders: revenueDays.get(date)?.orders ?? 0,
    visits: visitDays.get(date)?.visits ?? 0,
    visitors: visitDays.get(date)?.sessions.size ?? 0,
    productViews: visitDays.get(date)?.productViews ?? 0,
  }));

  const averageDeliveryHours = deliveryHours.length
    ? Math.round(deliveryHours.reduce((sum, n) => sum + n, 0) / deliveryHours.length)
    : null;

  return {
    days,
    summary: {
      orders: orders.length,
      revenue,
      openOrders: openOrders.length,
      delayedOrders: openOrders.filter((order) => hoursBetween(order.createdAt, now) >= 48).length,
      visits: views.filter((view) => view.kind === "page").length,
      visitors: sessions.size,
      productViews: views.filter((view) => view.kind === "product").length,
      averageDeliveryHours,
    },
    ordersByStatus: mapSlices(byStatus),
    ordersByDelivery: mapSlices(byDelivery),
    ordersByPayment: mapSlices(byPayment),
    departments: [...byDepartment.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    delayBuckets: [...delayBuckets.entries()].map(([label, value]) => ({ label, value })),
    slowest,
    series,
    topPages: [...pages.entries()]
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8),
    topProducts: [...products.values()]
      .map((product) => ({
        name: product.label,
        views: product.views,
        sold: sold.get(product.label) ?? 0,
      }))
      .sort((a, b) => b.views - a.views || b.sold - a.sold)
      .slice(0, 8),
    topSold: [...sold.entries()]
      .map(([name, units]) => ({ name, units }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 8),
  };
}

function mapSlices(source: Map<string, number>) {
  return [...source.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function fillDays(since: Date | null, now: Date) {
  const localNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate()));
  const localSince = since ? new Date(since.getTime() - 3 * 60 * 60 * 1000) : null;
  const start = localSince
    ? new Date(Date.UTC(localSince.getUTCFullYear(), localSince.getUTCMonth(), localSince.getUTCDate()))
    : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  const days: string[] = [];
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += 24 * 60 * 60 * 1000) {
    days.push(new Date(cursor).toISOString().slice(0, 10));
  }
  return days.slice(-90);
}
