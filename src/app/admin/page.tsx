"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminToken } from "@/lib/api/admin-auth";
import { apiFetch } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";

type Stats = {
  products: number;
  orders: number;
  unusedCodes: number;
  revenue: number;
  recent: Array<{
    id: string;
    publicId: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<Stats>("/admin/stats", { token }).then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <AdminGate>
      <AdminShell title="Dashboard">
        {!stats ? (
          <p className="text-cream/50">Cargando…</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Productos", value: String(stats.products) },
                { label: "Pedidos", value: String(stats.orders) },
                { label: "Códigos libres", value: String(stats.unusedCodes) },
                { label: "Facturado", value: formatPrice(stats.revenue) },
              ].map((card) => (
                <div key={card.label} className="border border-white/10 bg-white/5 p-5">
                  <p className="text-xs uppercase tracking-wider text-cream/50">{card.label}</p>
                  <p className="mt-2 font-serif text-3xl text-gold">{card.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl">Últimos pedidos</h2>
                <Link href="/admin/pedidos" className="text-sm text-gold hover:underline">
                  Ver todos
                </Link>
              </div>
              <div className="divide-y divide-white/10 border border-white/10">
                {stats.recent.length === 0 ? (
                  <p className="p-4 text-cream/50">Todavía no hay pedidos.</p>
                ) : (
                  stats.recent.map((order) => (
                    <div key={order.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
                      <div>
                        <p className="font-medium text-cream">{order.publicId}</p>
                        <p className="text-cream/50">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gold">{formatPrice(order.total)}</p>
                        <p className="text-cream/50">{order.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </AdminShell>
    </AdminGate>
  );
}
