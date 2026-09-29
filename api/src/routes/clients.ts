import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireClient } from "../middleware/auth.js";

export const clientsRouter = Router();

const REFERRAL_PERCENT = 10;

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  document: z.string().min(5).max(30),
  address: z.string().min(3).max(200),
  city: z.string().min(2).max(80),
  phone: z.string().min(8).max(30),
  salonName: z.string().min(2).max(120),
  referralCode: z.string().min(4).max(20).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function serializeClient(
  client: {
    id: string;
    name: string;
    document: string;
    address: string;
    city: string;
    phone: string;
    salonName: string;
    email: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    promoCodes?: Array<{
      id: string;
      code: string;
      percent: number;
      source?: string;
      usedAt: Date | null;
      createdAt: Date;
    }>;
    referredBy?: { id: string; name: string; salonName: string } | null;
  },
) {
  const activePromo =
    client.promoCodes?.find((p) => !p.usedAt && p.source !== "referral") ?? null;
  return {
    id: client.id,
    name: client.name,
    document: client.document,
    address: client.address,
    city: client.city,
    phone: client.phone,
    salonName: client.salonName,
    email: client.email,
    status: client.status,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt,
    hasActiveDiscount: Boolean(activePromo),
    activeDiscount: activePromo
      ? {
          code: activePromo.code,
          percent: activePromo.percent,
          createdAt: activePromo.createdAt,
        }
      : null,
    referredBy: client.referredBy
      ? {
          id: client.referredBy.id,
          name: client.referredBy.name,
          salonName: client.referredBy.salonName,
        }
      : null,
  };
}

function makePromoCode(percent: number) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BM${percent}-${suffix}`;
}

function makeReferralCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

async function ensureReferralCode(clientId: string) {
  const current = await prisma.client.findUnique({
    where: { id: clientId },
    select: { referralCode: true, status: true },
  });
  if (!current || current.status !== "active") return null;
  if (current.referralCode) return current.referralCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = makeReferralCode();
    const taken = await prisma.client.findFirst({
      where: { referralCode },
      select: { id: true },
    });
    if (taken) continue;
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: { referralCode },
      select: { referralCode: true },
    });
    return updated.referralCode;
  }
  return null;
}

function makePassword(length = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function makeClientEmail(name: string, document: string) {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  const digits = document.replace(/\D/g, "").slice(-6) || Math.random().toString(36).slice(2, 8);
  return `${base || "cliente"}.${digits}@cliente.beautymax.uy`;
}

clientsRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Completá todos los datos del registro" });
  }

  const data = {
    name: parsed.data.name.trim(),
    document: parsed.data.document.trim().toUpperCase().replace(/\s+/g, ""),
    address: parsed.data.address.trim(),
    city: parsed.data.city.trim(),
    phone: parsed.data.phone.trim().replace(/\s+/g, ""),
    salonName: parsed.data.salonName.trim(),
  };

  const existing = await prisma.client.findFirst({
    where: {
      OR: [{ document: data.document }, { phone: data.phone }],
    },
  });
  if (existing) {
    return res.status(409).json({
      error:
        existing.status === "pending"
          ? "Ya tenés un registro pendiente de aceptación"
          : "Ya existe un cliente con ese documento o celular",
    });
  }

  const rawRef = parsed.data.referralCode?.trim().toUpperCase();
  const referrer = rawRef
    ? await prisma.client.findFirst({
        where: { referralCode: rawRef, status: "active" },
        select: { id: true },
      })
    : null;

  const created = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        ...data,
        referredById: referrer?.id ?? null,
      },
    });
    if (referrer) {
      const already = await tx.promoCode.findFirst({
        where: { referredClientId: client.id, source: "referral" },
        select: { id: true },
      });
      if (!already) {
        await tx.promoCode.create({
          data: {
            code: makePromoCode(REFERRAL_PERCENT),
            percent: REFERRAL_PERCENT,
            source: "referral",
            clientId: referrer.id,
            referredClientId: client.id,
          },
        });
      }
    }
    return client;
  });

  return res.status(201).json({
    id: created.id,
    status: created.status,
    message: "Solicitud enviada. Un administrador la revisará pronto.",
  });
});

clientsRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email o contraseña inválidos" });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const client = await prisma.client.findUnique({
    where: { email },
    include: { promoCodes: { orderBy: { createdAt: "desc" }, take: 5 } },
  });

  if (!client || !client.passwordHash) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }
  if (client.status !== "active") {
    return res.status(403).json({ error: "Tu cuenta aún no fue aceptada" });
  }
  if (!(await bcrypt.compare(parsed.data.password, client.passwordHash))) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) return res.status(500).json({ error: "Falta JWT_SECRET" });

  const token = jwt.sign({ sub: client.id, email: client.email!, role: "client" }, secret, {
    expiresIn: "30d",
  });

  return res.json({
    token,
    client: serializeClient(client),
  });
});

clientsRouter.get("/me", requireClient, async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.client!.sub },
    include: { promoCodes: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!client || client.status !== "active") {
    return res.status(401).json({ error: "Cliente no disponible" });
  }
  return res.json(serializeClient(client));
});

clientsRouter.post("/me/referral-link", requireClient, async (req, res) => {
  const code = await ensureReferralCode(req.client!.sub);
  if (!code) return res.status(403).json({ error: "Solo clientes activos pueden invitar" });
  return res.json({ code, percent: REFERRAL_PERCENT });
});

clientsRouter.get("/me/profile", requireClient, async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.client!.sub },
    include: {
      promoCodes: { orderBy: { createdAt: "desc" } },
      referrals: {
        select: { id: true, name: true, salonName: true, status: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!client || client.status !== "active") {
    return res.status(401).json({ error: "Cliente no disponible" });
  }

  const referralCode = await ensureReferralCode(client.id);

  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { clientId: client.id },
        ...(client.email
          ? [{ customerEmail: { equals: client.email, mode: "insensitive" as const } }]
          : []),
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const rewardByReferral = new Map(
    client.promoCodes
      .filter((promo) => promo.source === "referral" && promo.referredClientId)
      .map((promo) => [promo.referredClientId, promo]),
  );

  return res.json({
    client: serializeClient(client),
    referralCode,
    referralPercent: REFERRAL_PERCENT,
    referrals: client.referrals.map((referral) => {
      const reward = rewardByReferral.get(referral.id);
      return {
        id: referral.id,
        name: referral.name,
        salonName: referral.salonName,
        status: referral.status,
        createdAt: referral.createdAt,
        reward: reward
          ? {
              code: reward.code,
              percent: reward.percent,
              usedAt: reward.usedAt,
            }
          : null,
      };
    }),
    orders: orders.map((order) => ({
      id: order.id,
      publicId: order.publicId,
      status: order.status,
      createdAt: order.createdAt,
      delivery: order.delivery,
      payment: order.payment,
      department: order.department,
      city: order.city,
      address: order.address,
      shipping: order.shipping,
      discount: order.discount,
      total: order.total,
      items: order.items.map((item) => ({
        name: item.name,
        brand: item.brand,
        variantLabel: item.variantLabel,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
    })),
  });
});

clientsRouter.get("/", requireAuth, async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const clients = await prisma.client.findMany({
    where: status ? { status } : undefined,
    include: {
      referredBy: { select: { id: true, name: true, salonName: true } },
      promoCodes: {
        where: { usedAt: null, source: { not: "referral" } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(clients.map(serializeClient));
});

clientsRouter.patch("/:id/approve", requireAuth, async (req, res) => {
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
  if (client.status === "active" && client.email) {
    return res.status(400).json({ error: "El cliente ya está activo" });
  }

  let email = client.email;
  let plainPassword: string | null = null;
  let passwordHash = client.passwordHash;

  if (!email || !passwordHash) {
    email = makeClientEmail(client.name, client.document).toLowerCase();
    const clash = await prisma.client.findUnique({ where: { email } });
    if (clash && clash.id !== client.id) {
      email = `cliente.${Date.now().toString(36)}@cliente.beautymax.uy`;
    }
    plainPassword = makePassword();
    passwordHash = await bcrypt.hash(plainPassword, 10);
  }

  const updated = await prisma.client.update({
    where: { id: client.id },
    data: {
      status: "active",
      email,
      passwordHash,
    },
    include: { promoCodes: { where: { usedAt: null }, take: 1 } },
  });

  const siteUrl = (process.env.PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://beautymax-web.pages.dev").replace(
    /\/$/,
    "",
  );

  return res.json({
    client: serializeClient(updated),
    credentials: {
      email: updated.email!,
      password: plainPassword,
      siteUrl,
    },
  });
});

clientsRouter.patch("/:id/reject", requireAuth, async (req, res) => {
  const client = await prisma.client.findUnique({ where: { id: req.params.id } });
  if (!client) return res.status(404).json({ error: "Cliente no encontrado" });
  await prisma.promoCode.deleteMany({
    where: { referredClientId: client.id, usedAt: null },
  });
  await prisma.client.delete({ where: { id: client.id } });
  return res.json({ ok: true });
});
