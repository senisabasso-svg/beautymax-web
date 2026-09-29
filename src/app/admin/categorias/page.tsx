"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAdminToken } from "@/lib/api/admin-auth";
import { ApiError, apiFetch } from "@/lib/api/client";
import type { Product } from "@/types/product";

type CategoryItem = {
  id: string;
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  active: boolean;
  productCount: number;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [eyebrow, setEyebrow] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [productToAssign, setProductToAssign] = useState("");

  function load() {
    const token = getAdminToken();
    if (!token) return;
    Promise.all([
      apiFetch<CategoryItem[]>("/categories/manage", { token }),
      apiFetch<Product[]>("/products?admin=1", { token }),
    ])
      .then(([nextCategories, nextProducts]) => {
        setItems(nextCategories);
        setProducts(nextProducts);
        setEditing((current) => nextCategories.find((item) => item.id === current?.id) ?? current);
      })
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
      await apiFetch("/categories", {
        method: "POST",
        token,
        body: JSON.stringify({
          name: name.trim(),
          slug: slugify(slug || name),
          eyebrow: eyebrow.trim(),
          description: description.trim(),
        }),
      });
      setName("");
      setSlug("");
      setSlugTouched(false);
      setEyebrow("");
      setDescription("");
      toast.success("Categoría creada");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo crear");
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token || !editing) return;
    try {
      const updated = await apiFetch<CategoryItem>(`/categories/${editing.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name: editing.name.trim(),
          slug: slugify(editing.slug),
          eyebrow: editing.eyebrow.trim(),
          description: editing.description.trim(),
          active: editing.active,
        }),
      });
      setEditing(updated);
      toast.success("Categoría actualizada");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo guardar");
    }
  }

  async function toggleActive(item: CategoryItem) {
    const token = getAdminToken();
    if (!token) return;
    try {
      await apiFetch(`/categories/${item.id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ active: !item.active }),
      });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar");
    }
  }

  async function remove(item: CategoryItem) {
    if (!confirm(`¿Eliminar la categoría ${item.name}?`)) return;
    const token = getAdminToken();
    if (!token) return;
    try {
      await apiFetch(`/categories/${item.id}`, { method: "DELETE", token });
      if (editing?.id === item.id) setEditing(null);
      toast.success("Categoría eliminada");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
    }
  }

  async function assignProduct() {
    const token = getAdminToken();
    if (!token || !editing || !productToAssign) return;
    try {
      await apiFetch(`/categories/${editing.id}/products`, {
        method: "POST",
        token,
        body: JSON.stringify({ productId: productToAssign }),
      });
      setProductToAssign("");
      toast.success("Producto asociado");
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo asociar");
    }
  }

  const assigned = editing ? products.filter((product) => product.category === editing.slug) : [];
  const available = editing ? products.filter((product) => product.category !== editing.slug) : [];

  return (
    <AdminGate>
      <AdminShell title="Categorías">
        <p className="mb-6 max-w-2xl text-sm text-cream/60">
          Cargá las categorías de la tienda y asociá los productos. Cada producto queda en una sola categoría.
        </p>

        <form onSubmit={onCreate} className="mb-8 grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs text-cream/50">Nombre</span>
            <Input
              value={name}
              onChange={(e) => {
                const next = e.target.value;
                setName(next);
                if (!slugTouched) setSlug(slugify(next));
              }}
              className="border-white/20 bg-black text-cream"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-cream/50">Slug</span>
            <Input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(slugify(e.target.value));
              }}
              className="border-white/20 bg-black text-cream"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-cream/50">Texto corto</span>
            <Input
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              placeholder="Ej. Cabina"
              className="border-white/20 bg-black text-cream"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="mb-1 block text-xs text-cream/50">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20 w-full rounded-md border border-white/20 bg-black px-3 py-2 text-cream"
            />
          </label>
          <div>
            <Button type="submit">Crear categoría</Button>
          </div>
        </form>

        <div className="overflow-x-auto border border-white/10">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-white/5 text-cream/50">
              <tr>
                <th className="p-3 font-medium">Categoría</th>
                <th className="p-3 font-medium">Slug</th>
                <th className="p-3 font-medium">Productos</th>
                <th className="p-3 font-medium">Visible</th>
                <th className="p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-cream/50">
                    Todavía no hay categorías.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="p-3">
                      <p className="font-medium text-cream">{item.name}</p>
                      {item.eyebrow ? <p className="text-xs text-cream/40">{item.eyebrow}</p> : null}
                    </td>
                    <td className="p-3 text-cream/70">{item.slug}</td>
                    <td className="p-3 text-gold">{item.productCount}</td>
                    <td className="p-3">
                      <label className="flex items-center gap-2 text-cream/70">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={() => void toggleActive(item)}
                          className="h-4 w-4 accent-[#C9A24A]"
                        />
                        Activa
                      </label>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        className="mr-3 text-gold hover:underline"
                        onClick={() => {
                          setEditing(item);
                          setProductToAssign("");
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="text-red-400 hover:underline" onClick={() => void remove(item)}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editing ? (
          <form onSubmit={saveEdit} className="mt-8 space-y-4 border border-white/10 p-4">
            <h2 className="font-serif text-2xl text-gold">Editar {editing.name}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Nombre</span>
                <Input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="border-white/20 bg-black text-cream"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Slug</span>
                <Input
                  value={editing.slug}
                  onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })}
                  className="border-white/20 bg-black text-cream"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-cream/50">Texto corto</span>
                <Input
                  value={editing.eyebrow}
                  onChange={(e) => setEditing({ ...editing, eyebrow: e.target.value })}
                  className="border-white/20 bg-black text-cream"
                />
              </label>
              <label className="flex items-end gap-2 pb-2 text-sm text-cream/70">
                <input
                  type="checkbox"
                  checked={editing.active}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="h-4 w-4 accent-[#C9A24A]"
                />
                Visible en la tienda
              </label>
              <label className="block md:col-span-2">
                <span className="mb-1 block text-xs text-cream/50">Descripción</span>
                <textarea
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="min-h-20 w-full rounded-md border border-white/20 bg-black px-3 py-2 text-cream"
                />
              </label>
            </div>
            <Button type="submit" size="sm">
              Guardar categoría
            </Button>
          </form>
        ) : null}

        {editing ? (
          <div className="mt-4 border border-white/10 p-4">
              <h3 className="font-serif text-xl text-cream">Productos asociados</h3>
              {assigned.length === 0 ? (
                <p className="mt-2 text-sm text-cream/50">Ningún producto en esta categoría.</p>
              ) : (
                <ul className="mt-3 divide-y divide-white/10 border border-white/10">
                  {assigned.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <span className="text-cream">{product.name}</span>
                      <span className="text-cream/40">{product.brand}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <label className="block min-w-64 flex-1">
                  <span className="mb-1 block text-xs text-cream/50">Asociar producto</span>
                  <select
                    value={productToAssign}
                    onChange={(e) => setProductToAssign(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-white/20 bg-black px-3 text-cream"
                  >
                    <option value="">Elegir producto</option>
                    {available.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} · {product.brand}
                      </option>
                    ))}
                  </select>
                </label>
                <Button type="button" size="sm" disabled={!productToAssign} onClick={() => void assignProduct()}>
                  Asociar
                </Button>
              </div>
          </div>
        ) : null}
      </AdminShell>
    </AdminGate>
  );
}
