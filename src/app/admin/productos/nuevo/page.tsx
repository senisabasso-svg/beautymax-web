"use client";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <AdminGate>
      <AdminShell title="Nuevo producto">
        <ProductForm />
      </AdminShell>
    </AdminGate>
  );
}
