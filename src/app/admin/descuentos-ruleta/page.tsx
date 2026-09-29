"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminToken } from "@/lib/api/admin-auth";
import { ApiError, apiFetch } from "@/lib/api/client";

type RouletteItem = {
  id: string;
  percent: number;
  label: string | null;
  displayOnly: boolean;
  active: boolean;
  sortOrder: number;
};

export default function AdminRoulettePage() {
  const [items, setItems] = useState<RouletteItem[]>([]);
  const [percent, setPercent] = useState(10);
  const [displayOnly, setDisplayOnly] = useState(false);
  const [label, setLabel] = useState("");

  function load() {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<RouletteItem[]>("/promo/roulette-discounts", { token })
      .then(setItems)
      .catch((err) => toast.error(err instanceof ApiError ? err.message : "Error al cargar"));
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    try {
      await apiFetch("/promo/roulette-discounts", {
        method: "POST",
        token,
        body: JSON.stringify({
          percent,
          displayOnly,
          ...(label.trim() ? { label: label.trim() } : {}),
        }),
      });
      setLabel("");
      setDisplayOnly(false);
      toast.success("Descuento añadido a la ruleta");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear");
    }
  }

  async function toggle(item: RouletteItem, patch: Partial<RouletteItem>) {
    const token = getAdminToken();
    if (!token) return;
    try {
      await apiFetch(`/promo/roulette-discounts/${item.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(patch),
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar");
    }
  }

  async function remove(item: RouletteItem) {
    if (!confirm(`¿Eliminar el segmento ${item.percent}%?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await apiFetch(`/promo/roulette-discounts/${item.id}`, { method: "DELETE", token });
      toast.success("Eliminado");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
    }
  }

  return (
    <AdminGate>
      <AdminShell title="Descuentos ruleta">
        <p className="mb-6 max-w-2xl text-sm text-cream/60">
          Cada fila es un segmento de la ruleta. Marcá &quot;Solo aparece&quot; para que se vea el
          porcentaje pero nunca se pueda ganar. Si no está marcado, puede salir como premio.
        </p>

        <form onSubmit={onCreate} className="mb-8 flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs text-cream/50">Porcentaje</p>
            <Input
              type="number"
              min={1}
              max={90}
              value={percent}
              onChange={(e) => setPercent(Number(e.target.value))}
              className="w-24 border-white/20 bg-black text-cream"
              required
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-cream/50">Etiqueta (opcional)</p>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ej. Premium"
              className="border-white/20 bg-black text-cream"
            />
          </div>
          <label className="mb-2 flex items-center gap-2 text-sm text-cream/70">
            <input
              type="checkbox"
              checked={displayOnly}
              onChange={(e) => setDisplayOnly(e.target.checked)}
              className="h-4 w-4 accent-[#C9A24A]"
            />
            Solo aparece (nunca se gana)
          </label>
          <Button type="submit">Añadir a la ruleta</Button>
        </form>

        <div className="overflow-x-auto border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/5 text-cream/50">
              <tr>
                <th className="p-3">%</th>
                <th className="p-3">Etiqueta</th>
                <th className="p-3">Comportamiento</th>
                <th className="p-3">Activo</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="p-3 font-semibold text-gold">{item.percent}%</td>
                  <td className="p-3 text-cream/70">{item.label ?? "—"}</td>
                  <td className="p-3">
                    <label className="flex items-center gap-2 text-cream/70">
                      <input
                        type="checkbox"
                        checked={item.displayOnly}
                        onChange={(e) => void toggle(item, { displayOnly: e.target.checked })}
                        className="h-4 w-4 accent-[#C9A24A]"
                      />
                      Solo aparece
                    </label>
                  </td>
                  <td className="p-3">
                    <label className="flex items-center gap-2 text-cream/70">
                      <input
                        type="checkbox"
                        checked={item.active}
                        onChange={(e) => void toggle(item, { active: e.target.checked })}
                        className="h-4 w-4 accent-[#C9A24A]"
                      />
                      Activo
                    </label>
                  </td>
                  <td className="p-3">
                    <button
                      type="button"
                      className="text-xs text-cream/50 underline-offset-2 hover:text-cream hover:underline"
                      onClick={() => void remove(item)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminShell>
    </AdminGate>
  );
}
