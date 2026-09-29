"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { Donut, MeterList, Trend, type Slice } from "@/components/admin/ReportCharts";
import { Button } from "@/components/ui/button";
import { getAdminToken } from "@/lib/api/admin-auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";

type Report = {
  days: number;
  summary: {
    orders: number;
    revenue: number;
    openOrders: number;
    delayedOrders: number;
    visits: number;
    visitors: number;
    productViews: number;
    averageDeliveryHours: number | null;
  };
  ordersByStatus: Array<{ label: string; value: number }>;
  ordersByDelivery: Array<{ label: string; value: number }>;
  ordersByPayment: Array<{ label: string; value: number }>;
  departments: Array<{ label: string; value: number }>;
  delayBuckets: Array<{ label: string; value: number }>;
  slowest: Array<{
    id: string;
    publicId: string;
    customerName: string;
    city: string;
    status: string;
    hours: number;
    hoursInStatus: number;
  }>;
  series: Array<{ date: string; revenue: number; orders: number; visits: number; visitors: number; productViews: number }>;
  topPages: Array<{ path: string; views: number }>;
  topProducts: Array<{ name: string; views: number; sold: number }>;
  topSold: Array<{ name: string; units: number }>;
};

const periods = [
  { days: 7, label: "7 días" },
  { days: 30, label: "30 días" },
  { days: 90, label: "90 días" },
  { days: 0, label: "Todo" },
];

const palette = ["#C9A24A", "#E8D29A", "#F3E6C4", "#9A7B2F", "#8A8A8A", "#D7C4A3", "#6E5A2E", "#FFFFFF"];

const names: Record<string, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  envio: "Envío",
  retiro: "Retiro",
  mercadopago: "Mercado Pago",
  transferencia: "Transferencia",
  whatsapp: "WhatsApp",
  "/": "Inicio",
  "/tienda": "Tienda",
  "/organic-pro": "Organic Pro",
  "/herramientas": "Herramientas",
  "/marcas": "Marcas",
  "/contacto": "Contacto",
  "/carrito": "Carrito",
  "/checkout": "Checkout",
};

function paint(rows: Array<{ label: string; value: number }>): Slice[] {
  return rows
    .filter((row) => row.value > 0)
    .map((row, index) => ({
      label: names[row.label] ?? row.label,
      value: row.value,
      color: palette[index % palette.length],
    }));
}

function waitLabel(hours: number) {
  if (hours < 24) return `${hours} h`;
  const days = Math.max(1, Math.round(hours / 24));
  return days === 1 ? "1 día" : `${days} días`;
}

function pageName(path: string) {
  if (names[path]) return names[path];
  if (path.startsWith("/categoria/")) return `Categoría ${path.slice(11)}`;
  if (path.startsWith("/marca/")) return `Marca ${path.slice(7)}`;
  if (path.startsWith("/producto/")) return path.slice(10);
  return path;
}

export default function AdminReportsPage() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    apiFetch<Report>(`/admin/reports?days=${days}`, { token })
      .then(setReport)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "No se pudo cargar el reporte"))
      .finally(() => setLoading(false));
  }, [days]);

  const summary = report?.summary;

  return (
    <AdminGate>
      <AdminShell title="Reportes">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-xl text-sm text-cream/55">
            Pedidos, demoras, miradas de productos y visitas de la tienda. Las visitas empiezan a contarse desde este deploy.
          </p>
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <Button
                key={period.days}
                type="button"
                size="sm"
                variant={days === period.days ? "gold" : "outline"}
                className={days === period.days ? undefined : "border-white/20 text-cream"}
                onClick={() => setDays(period.days)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {loading || !summary ? (
          <p className="text-cream/50">Cargando reportes…</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat label="Facturado" value={formatPrice(summary.revenue)} hint={`${summary.orders} pedidos`} />
              <Stat label="Pedidos abiertos" value={String(summary.openOrders)} hint={`${summary.delayedOrders} con más de 48 h`} />
              <Stat
                label="Entrega media"
                value={summary.averageDeliveryHours == null ? "—" : waitLabel(summary.averageDeliveryHours)}
                hint="Desde el alta hasta entregado"
              />
              <Stat
                label="Visitas"
                value={String(summary.visits)}
                hint={`${summary.visitors} sesiones · ${summary.productViews} miradas`}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Donut title="Pedidos" caption="Por estado" slices={paint(report.ordersByStatus)} center={String(summary.orders)} />
              <Donut title="Entrega" caption="Envío o retiro" slices={paint(report.ordersByDelivery)} />
              <Donut title="Cobro" caption="Medio de pago" slices={paint(report.ordersByPayment)} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Trend
                title="Facturación"
                caption="Total por día"
                points={report.series}
                valueKey="revenue"
                formatValue={(value) => formatPrice(value)}
              />
              <Trend title="Visitas" caption="Páginas vistas por día" points={report.series} valueKey="visits" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <Donut
                title="Demoras"
                caption="Pedidos que todavía no se entregaron"
                slices={paint(report.delayBuckets)}
                center={String(summary.openOrders)}
              />
              <article className="border border-white/10 bg-white/[0.03] p-5">
                <h2 className="font-serif text-2xl text-cream">Los que más esperan</h2>
                <p className="mt-1 text-xs text-cream/45">Tiempo desde que entró el pedido y desde el último cambio de estado.</p>
                {report.slowest.length === 0 ? (
                  <p className="mt-5 text-sm text-cream/40">No hay pedidos abiertos.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-white/10">
                    {report.slowest.map((order) => (
                      <li key={order.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                        <div>
                          <p className="text-cream">{order.publicId}</p>
                          <p className="text-xs text-cream/45">
                            {order.customerName} · {order.city} · {names[order.status] ?? order.status}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-gold">{waitLabel(order.hours)}</p>
                          <p className="text-[11px] text-cream/40">{waitLabel(order.hoursInStatus)} en este estado</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <MeterList
                title="Más mirados"
                caption="Fichas de producto abiertas"
                rows={report.topProducts.map((product) => ({
                  label: product.name,
                  value: product.views,
                  hint: product.sold ? `${product.sold} vendidos en el período` : "Sin ventas en el período",
                }))}
              />
              <MeterList
                title="Más vendidos"
                caption="Unidades en pedidos"
                rows={report.topSold.map((product) => ({ label: product.name, value: product.units }))}
              />
              <MeterList
                title="Páginas"
                caption="Dónde entra la gente"
                rows={report.topPages.map((page) => ({ label: pageName(page.path), value: page.views }))}
              />
            </div>

            <MeterList
              title="Destinos"
              caption="Pedidos por departamento"
              rows={report.departments.map((row) => ({ label: row.label, value: row.value }))}
            />
          </div>
        )}
      </AdminShell>
    </AdminGate>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.03] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cream/40">{label}</p>
      <p className="mt-2 font-serif text-3xl text-gold">{value}</p>
      <p className="mt-1 text-xs text-cream/45">{hint}</p>
    </div>
  );
}
