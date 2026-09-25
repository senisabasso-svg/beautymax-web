"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { getAdminToken } from "@/lib/api/admin-auth";
import { apiFetch } from "@/lib/api/client";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<Product[]>("/products?admin=1", {
      token,
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  async function deactivate(id: string) {
    const token = getAdminToken();
    if (!token) return;
    if (!confirm("¿Desactivar este producto?")) return;
    await apiFetch(`/products/${id}`, { method: "DELETE", token });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <AdminGate>
      <AdminShell title="Productos">
        <div className="mb-6 flex justify-end">
          <Button asChild>
            <Link href="/admin/productos/nuevo">Nuevo producto</Link>
          </Button>
        </div>
        {loading ? (
          <p className="text-cream/50">Cargando…</p>
        ) : (
          <div className="overflow-x-auto border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-white/5 text-cream/50">
                <tr>
                  <th className="p-3 font-medium">Producto</th>
                  <th className="p-3 font-medium">Marca</th>
                  <th className="p-3 font-medium">Desde</th>
                  <th className="p-3 font-medium">Variantes</th>
                  <th className="p-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="p-3">
                      <p className="font-medium text-cream">{product.name}</p>
                      <p className="text-xs text-cream/40">{product.slug}</p>
                    </td>
                    <td className="p-3 text-cream/70">{product.brand}</td>
                    <td className="p-3 text-gold">
                      {formatPrice(Math.min(...product.variants.map((v) => v.price)))}
                    </td>
                    <td className="p-3 text-cream/70">{product.variants.length}</td>
                    <td className="p-3 text-right">
                      <Link href={`/admin/productos/${product.id}`} className="mr-3 text-gold hover:underline">
                        Editar
                      </Link>
                      <button type="button" className="text-red-400 hover:underline" onClick={() => deactivate(product.id)}>
                        Baja
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminShell>
    </AdminGate>
  );
}
