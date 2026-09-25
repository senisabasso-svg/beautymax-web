import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Email o contraseña inválidos" });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Falta JWT_SECRET" });
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: "7d" });
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRouter.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  const secret = process.env.JWT_SECRET;
  if (!header?.startsWith("Bearer ") || !secret) {
    return res.status(401).json({ error: "No autorizado" });
  }
  try {
    const payload = jwt.verify(header.slice(7), secret) as { sub: string; email: string };
    const user = await prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "No autorizado" });
    return res.json({ id: user.id, email: user.email, name: user.name });
  } catch {
    return res.status(401).json({ error: "No autorizado" });
  }
});
