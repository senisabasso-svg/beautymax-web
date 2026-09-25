"use client";

import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminToken } from "@/lib/api/admin-auth";
import { apiFetch } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";

type Order = {
  id: string;
  publicId: string;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  city: string;
  department: string;
  delivery: string;
  payment: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string; variantLabel: string; quantity: number; lineTotal: number }>;
};

const statuses = ["nuevo", "confirmado", "enviado", "entregado", "cancelado"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  function load() {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<Order[]>("/orders", { token }).then(setOrders);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(id: string, status: string) {
    const token = getAdminToken();
    if (!token) return;
    await apiFetch(`/orders/${id}/status`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ status }),
    });
    load();
  }

  return (
    <AdminGate>
      <AdminShell title="Pedidos">
        <div className="space-y-4">
          {orders.length === 0 ? (
            <p className="text-cream/50">No hay pedidos todavía.</p>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-cream">{order.publicId}</p>
                    <p className="text-sm text-cream/60">
                      {order.customerName} · {order.customerPhone} · {order.customerEmail}
                    </p>
                    <p className="text-sm text-cream/50">
                      {order.city}, {order.department} · {order.delivery} · {order.payment}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg text-gold">{formatPrice(order.total)}</p>
                    <select
                      value={order.status}
                      onChange={(e) => setStatus(order.id, e.target.value)}
                      className="mt-2 rounded border border-white/20 bg-black px-2 py-1 text-sm text-cream"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-cream/70">
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.name} — {item.variantLabel} × {item.quantity} · {formatPrice(item.lineTotal)}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </div>
      </AdminShell>
    </AdminGate>
  );
}
