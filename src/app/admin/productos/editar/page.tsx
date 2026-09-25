"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";
import { getAdminToken } from "@/lib/api/admin-auth";
import { apiFetch } from "@/lib/api/client";
import type { Product } from "@/types/product";

function EditProductInner() {
  const search = useSearchParams();
  const id = search.get("id");
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getAdminToken();
    if (!token || !id) {
      setError("Falta el id del producto");
      return;
    }
    apiFetch<Product[]>("/products?admin=1", { token })
      .then((list) => {
        const found = list.find((p) => p.id === id);
        if (!found) setError("Producto no encontrado");
        else setProduct(found);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error"));
  }, [id]);

  return (
    <AdminShell title="Editar producto">
      {error ? <p className="text-red-400">{error}</p> : null}
      {!product && !error ? <p className="text-cream/50">Cargando…</p> : null}
      {product ? <ProductForm product={product} /> : null}
    </AdminShell>
  );
}

export default function EditProductPage() {
  return (
    <AdminGate>
      <Suspense fallback={<div className="p-8 text-cream/50">Cargando…</div>}>
        <EditProductInner />
      </Suspense>
    </AdminGate>
  );
}
