"use client";

import { FormEvent, useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminToken } from "@/lib/api/admin-auth";
import { apiFetch } from "@/lib/api/client";

type Promo = {
  id: string;
  code: string;
  percent: number;
  source: string;
  usedAt: string | null;
  createdAt: string;
};

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<Promo[]>([]);
  const [percent, setPercent] = useState(10);
  const [custom, setCustom] = useState("");

  function load() {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<Promo[]>("/promo", { token }).then(setCodes);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    await apiFetch("/promo", {
      method: "POST",
      token,
      body: JSON.stringify({
        percent,
        ...(custom.trim() ? { code: custom.trim().toUpperCase() } : {}),
      }),
    });
    setCustom("");
    load();
  }

  return (
    <AdminGate>
      <AdminShell title="Códigos de descuento">
        <form onSubmit={onCreate} className="mb-8 flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs text-cream/50">Porcentaje</p>
            <select
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="h-10 rounded border border-white/20 bg-black px-3 text-cream"
            >
              {[10, 15, 20, 25].map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs text-cream/50">Código (opcional)</p>
            <Input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="Auto si vacío"
              className="border-white/20 bg-black text-cream"
            />
          </div>
          <Button type="submit">Crear código</Button>
        </form>

        <div className="overflow-x-auto border border-white/10">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-white/5 text-cream/50">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">%</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {codes.map((c) => (
                <tr key={c.id}>
                  <td className="p-3 font-mono text-gold">{c.code}</td>
                  <td className="p-3">{c.percent}%</td>
                  <td className="p-3 text-cream/60">{c.source}</td>
                  <td className="p-3 text-cream/60">{c.usedAt ? "Usado" : "Disponible"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </AdminGate>
  );
}
