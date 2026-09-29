"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storeConfig, type DeliveryId, type PaymentId } from "@/config/store";
import { departments } from "@/data/departments";
import { cartTotals, resolveCart } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage, createOrderId, whatsappUrl, type OrderPayload } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { PromoCodeField } from "@/components/promo/PromoCodeField";
import { useCart } from "@/store/cart-store";
import { useClientAuth } from "@/store/client-auth-store";
import { useAppliedPromo, usePromo } from "@/store/promo-store";

const schema = z
  .object({
    name: z.string().min(2, "Ingresá tu nombre"),
    phone: z.string().min(8, "Ingresá un celular válido"),
    email: z.string().email("Ingresá un email válido"),
    department: z.string().min(1, "Elegí un departamento"),
    city: z.string().min(2, "Ingresá la ciudad"),
    address: z.string().optional(),
    salon: z.string().optional(),
    delivery: z.enum(["envio", "retiro"]),
    payment: z.enum(["mercadopago", "transferencia", "whatsapp"]),
  })
  .superRefine((value, ctx) => {
    if (value.delivery === "envio" && (value.address?.trim().length ?? 0) < 4) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Ingresá la dirección de envío" });
    }
  });

type FormValues = z.infer<typeof schema>;

export function CheckoutForm() {
  const router = useRouter();
  const items = useCart((state) => state.items);
  const clear = useCart((state) => state.clear);
  const promo = useAppliedPromo();
  const clientToken = useClientAuth((state) => state.token);
  const redeemApplied = usePromo((state) => state.redeemApplied);
  const lines = useMemo(() => resolveCart(items), [items]);
  const [pending, setPending] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      department: "",
      city: "",
      address: "",
      salon: "",
      delivery: "envio",
      payment: "mercadopago",
    },
  });
  const delivery = form.watch("delivery");
  const { subtotal, discount, shipping, total } = cartTotals(lines, delivery, promo?.percent ?? 0);

  if (lines.length === 0) {
    return (
      <div className="bg-white px-6 py-16 text-center">
        <p className="font-serif text-3xl">Tu carrito está vacío.</p>
        <Button asChild className="mt-6">
          <a href="/tienda">Ir a la tienda</a>
        </Button>
      </div>
    );
  }

  async function onSubmit(values: FormValues) {
    setPending(true);
    const order: OrderPayload = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      customer: {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        salon: values.salon?.trim(),
        department: values.department,
        city: values.city.trim(),
        address: values.address?.trim() ?? "",
      },
      delivery: values.delivery as DeliveryId,
      payment: values.payment as PaymentId,
      lines: lines.map((line) => ({
        name: line.name,
        brand: line.brand,
        variant: line.variantLabel,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      subtotal,
      discount,
      discountCode: promo?.code,
      discountPercent: promo?.percent,
      shipping,
      total,
    };

    try {
      try {
        const { apiFetch } = await import("@/lib/api/client");
        const saved = await apiFetch<{ id: string }>("/orders", {
          method: "POST",
          ...(clientToken ? { token: clientToken } : {}),
          body: JSON.stringify({
            customer: {
              name: values.name.trim(),
              phone: values.phone.trim(),
              email: values.email.trim(),
              salon: values.salon?.trim(),
              department: values.department,
              city: values.city.trim(),
              address: values.address?.trim(),
            },
            delivery: values.delivery,
            payment: values.payment,
            items: lines.map((line) => ({
              productId: line.productId,
              variantId: line.variantId,
              quantity: line.quantity,
            })),
            discountCode: promo?.code,
          }),
        });
        order.id = saved.id;
      } catch {
        toast.message("El pedido se abre por WhatsApp (API no disponible).");
      }

      if (storeConfig.enableMercadoPago && values.payment === "mercadopago") {
        toast.message("Mercado Pago se activa en una próxima fase. Seguimos por WhatsApp.");
      }

      sessionStorage.setItem("beautymax-order", JSON.stringify(order));
      window.open(whatsappUrl(buildOrderMessage(order)), "_blank", "noopener,noreferrer");
      redeemApplied();
      clear();
      router.push("/pedido-confirmado");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]" noValidate>
      <div className="space-y-8">
        <section className="space-y-4 bg-white p-5 md:p-7">
          <h2 className="font-serif text-3xl">Tus datos</h2>
          <Field label="Nombre" htmlFor="checkout-nombre" error={form.formState.errors.name?.message}>
            <Input id="checkout-nombre" autoComplete="name" {...form.register("name")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Celular" htmlFor="checkout-celular" error={form.formState.errors.phone?.message}>
              <Input id="checkout-celular" autoComplete="tel" inputMode="tel" {...form.register("phone")} />
            </Field>
            <Field label="Email" htmlFor="checkout-email" error={form.formState.errors.email?.message}>
              <Input id="checkout-email" autoComplete="email" inputMode="email" {...form.register("email")} />
            </Field>
          </div>
          <Field label="¿Sos profesional? Nombre del salón" htmlFor="checkout-salon" error={form.formState.errors.salon?.message}>
            <Input id="checkout-salon" {...form.register("salon")} placeholder="Opcional" />
          </Field>
        </section>
        <section className="space-y-4 bg-white p-5 md:p-7">
          <h2 className="font-serif text-3xl">Entrega</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {storeConfig.deliveries.map((option) => (
              <Choice
                key={option.id}
                checked={delivery === option.id}
                title={option.label}
                text={option.description}
                onSelect={() => form.setValue("delivery", option.id, { shouldValidate: true })}
              />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Departamento" htmlFor="checkout-departamento" error={form.formState.errors.department?.message}>
              <Select
                value={form.watch("department") || undefined}
                onValueChange={(value) => form.setValue("department", value, { shouldValidate: true })}
              >
                <SelectTrigger id="checkout-departamento" aria-label="Departamento">
                  <SelectValue placeholder="Elegí un departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Ciudad" htmlFor="checkout-ciudad" error={form.formState.errors.city?.message}>
              <Input id="checkout-ciudad" {...form.register("city")} />
            </Field>
          </div>
          {delivery === "envio" ? (
            <Field label="Dirección" htmlFor="checkout-direccion" error={form.formState.errors.address?.message}>
              <Input id="checkout-direccion" autoComplete="street-address" {...form.register("address")} />
            </Field>
          ) : null}
        </section>
        <section className="space-y-4 bg-white p-5 md:p-7">
          <h2 className="font-serif text-3xl">Pago</h2>
          <div className="grid gap-3">
            {storeConfig.payments.map((option) => (
              <Choice
                key={option.id}
                checked={form.watch("payment") === option.id}
                title={option.label}
                text={option.description}
                onSelect={() => form.setValue("payment", option.id)}
              />
            ))}
          </div>
          {!storeConfig.enableMercadoPago ? (
            <p className="text-sm text-muted">
              Al confirmar te abrimos WhatsApp con el pedido armado. Si elegís Mercado Pago, un asesor te pasa el link de pago.
            </p>
          ) : null}
        </section>
      </div>
      <aside className="h-fit bg-black p-5 text-white md:p-7 lg:sticky lg:top-28">
        <h2 className="font-serif text-3xl">Tu pedido</h2>
        <ul className="mt-5 space-y-3 text-sm">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.variantId}`} className="flex justify-between gap-4">
              <span>
                {line.name}
                <span className="block text-xs uppercase tracking-[0.12em] text-white/60">
                  {line.variantLabel} × {line.quantity}
                </span>
              </span>
              <span className="text-gold">{formatPrice(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-white/15 pt-4">
          <PromoCodeField tone="dark" />
        </div>
        <dl className="mt-6 space-y-2 border-t border-white/15 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-white/70">Subtotal</dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between">
              <dt className="text-white/70">Descuento {promo?.percent}%</dt>
              <dd className="text-gold">-{formatPrice(discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-white/70">Envío</dt>
            <dd>{shipping === 0 ? "Sin costo" : formatPrice(shipping)}</dd>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-gold">{formatPrice(total)}</dd>
          </div>
        </dl>
        <Button type="submit" className="mt-6 w-full" disabled={pending}>
          {pending ? "Enviando..." : "Confirmar pedido"}
        </Button>
      </aside>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-[#7A2E2E]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Choice({
  checked,
  title,
  text,
  onSelect,
}: {
  checked: boolean;
  title: string;
  text: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={checked}
      className={cn(
        "border px-4 py-3 text-left",
        checked ? "border-gold-deep bg-cream" : "border-ink/15 bg-white hover:border-gold-deep",
      )}
    >
      <span className="block text-sm font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-xs leading-relaxed text-muted">{text}</span>
    </button>
  );
}
