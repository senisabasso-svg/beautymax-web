"use client";

import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAdminToken } from "@/lib/api/admin-auth";
import { apiFetch } from "@/lib/api/client";
import type { Product, Variant } from "@/types/product";

const categories = [
  "coloracion",
  "decoloracion",
  "tratamientos",
  "styling",
  "tijeras",
  "maquinas",
  "secadores",
  "planchas",
];

type FormVariant = Variant;

type FormState = {
  slug: string;
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  howToUse: string;
  benefits: string;
  images: string;
  badges: string;
  featured: boolean;
  requiresSelection: boolean;
  active: boolean;
  variants: FormVariant[];
};

function toForm(product?: Product): FormState {
  return {
    slug: product?.slug ?? "",
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    category: product?.category ?? "coloracion",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    howToUse: product?.howToUse ?? "",
    benefits: (product?.benefits ?? []).join("\n"),
    images: (product?.images ?? ["/productos/placeholder.svg"]).join("\n"),
    badges: (product?.badges ?? []).join(", "),
    featured: Boolean(product?.featured),
    requiresSelection: Boolean(product?.requiresSelection),
    active: true,
    variants: product?.variants?.length
      ? product.variants
      : [{ id: "", label: "Único", price: 0, stock: 10, sku: "" }],
  };
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => toForm(product));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function updateVariant(index: number, patch: Partial<FormVariant>) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAdminToken();
    if (!token) return;
    setPending(true);
    setError("");

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      howToUse: form.howToUse.trim() || null,
      benefits: form.benefits
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      images: form.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      badges: form.badges
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      featured: form.featured,
      requiresSelection: form.requiresSelection,
      active: form.active,
      variants: form.variants.map((v, i) => ({
        ...(v.id ? { id: v.id } : {}),
        label: v.label,
        price: Number(v.price),
        compareAtPrice: v.compareAtPrice ?? null,
        sku: v.sku || null,
        stock: Number(v.stock),
        colorName: v.colorName || null,
        colorHex: v.colorHex || null,
        sortOrder: i,
      })),
    };

    try {
      if (product) {
        await apiFetch(`/products/${product.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/products", {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      }
      router.replace("/admin/productos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border-white/20 bg-black text-cream"
            required
          />
        </Field>
        <Field label="Slug (URL)">
          <Input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className="border-white/20 bg-black text-cream"
            required
          />
        </Field>
        <Field label="Marca">
          <Input
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="border-white/20 bg-black text-cream"
            required
          />
        </Field>
        <Field label="Categoría">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="flex h-10 w-full rounded-md border border-white/20 bg-black px-3 text-cream"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Descripción corta">
        <Input
          value={form.shortDescription}
          onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
          className="border-white/20 bg-black text-cream"
          required
        />
      </Field>

      <Field label="Descripción">
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="min-h-28 w-full rounded-md border border-white/20 bg-black px-3 py-2 text-cream"
          required
        />
      </Field>

      <Field label="Cómo usar">
        <textarea
          value={form.howToUse}
          onChange={(e) => setForm({ ...form, howToUse: e.target.value })}
          className="min-h-20 w-full rounded-md border border-white/20 bg-black px-3 py-2 text-cream"
        />
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Beneficios (uno por línea)">
          <textarea
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
            className="min-h-24 w-full rounded-md border border-white/20 bg-black px-3 py-2 text-cream"
          />
        </Field>
        <Field label="Imágenes (una URL por línea)">
          <textarea
            value={form.images}
            onChange={(e) => setForm({ ...form, images: e.target.value })}
            className="min-h-24 w-full rounded-md border border-white/20 bg-black px-3 py-2 text-cream"
          />
        </Field>
      </div>

      <Field label="Badges (separados por coma: exclusivo, nuevo, mas-vendido)">
        <Input
          value={form.badges}
          onChange={(e) => setForm({ ...form, badges: e.target.value })}
          className="border-white/20 bg-black text-cream"
        />
      </Field>

      <div className="flex flex-wrap gap-6 text-sm text-cream/80">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm({ ...form, featured: e.target.checked })}
          />
          Destacado
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.requiresSelection}
            onChange={(e) => setForm({ ...form, requiresSelection: e.target.checked })}
          />
          Requiere elegir tono/variante
        </label>
      </div>

      <div className="space-y-3 border border-white/10 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-xl text-gold">Variantes / tonos</h3>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setForm({
                ...form,
                variants: [...form.variants, { id: "", label: "", price: 0, stock: 10 }],
              })
            }
          >
            Agregar
          </Button>
        </div>
        {form.variants.map((v, i) => (
          <div key={i} className="grid gap-2 border-t border-white/10 pt-3 md:grid-cols-6">
            <Input
              placeholder="Label / tono"
              value={v.label}
              onChange={(e) => updateVariant(i, { label: e.target.value })}
              className="border-white/20 bg-black text-cream md:col-span-2"
              required
            />
            <Input
              type="number"
              placeholder="Precio"
              value={v.price}
              onChange={(e) => updateVariant(i, { price: Number(e.target.value) })}
              className="border-white/20 bg-black text-cream"
              required
            />
            <Input
              type="number"
              placeholder="Stock"
              value={v.stock}
              onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
              className="border-white/20 bg-black text-cream"
              required
            />
            <Input
              placeholder="SKU"
              value={v.sku ?? ""}
              onChange={(e) => updateVariant(i, { sku: e.target.value })}
              className="border-white/20 bg-black text-cream"
            />
            <Input
              placeholder="#hex"
              value={v.colorHex ?? ""}
              onChange={(e) => updateVariant(i, { colorHex: e.target.value, colorName: v.label })}
              className="border-white/20 bg-black text-cream"
            />
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-cream/70">{label}</Label>
      {children}
    </div>
  );
}
