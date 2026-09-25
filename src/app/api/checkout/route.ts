import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  items: z
    .array(
      z.object({
        title: z.string().min(1),
        quantity: z.number().int().positive(),
        unit_price: z.number().positive(),
      }),
    )
    .min(1),
  payer: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    })
    .optional(),
  external_reference: z.string().optional(),
});

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_MP !== "true") {
    return NextResponse.json(
      { error: "Mercado Pago está desactivado. Definí NEXT_PUBLIC_ENABLE_MP=true." },
      { status: 403 },
    );
  }

  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta MP_ACCESS_TOKEN." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "El pedido no es válido." }, { status: 400 });
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const preference = {
    items: parsed.data.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      currency_id: "UYU",
      unit_price: item.unit_price,
    })),
    payer: parsed.data.payer?.email
      ? { email: parsed.data.payer.email, name: parsed.data.payer.name }
      : undefined,
    external_reference: parsed.data.external_reference,
    back_urls: {
      success: `${site}/pedido-confirmado`,
      failure: `${site}/checkout`,
      pending: `${site}/pedido-confirmado`,
    },
    auto_return: "approved",
  };

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preference),
  });

  const data = (await response.json()) as { id?: string; init_point?: string };
  if (!response.ok || !data.init_point) {
    return NextResponse.json({ error: "No se pudo crear la preferencia de pago." }, { status: 502 });
  }

  return NextResponse.json({ id: data.id, init_point: data.init_point });
}
