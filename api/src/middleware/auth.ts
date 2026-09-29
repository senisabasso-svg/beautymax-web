import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthPayload = { sub: string; email: string; role?: "admin" | "client" };

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
      client?: AuthPayload;
    }
  }
}

function readBearer(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readBearer(req);
  if (!token) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Falta JWT_SECRET" });
  }
  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    if (payload.role && payload.role !== "admin") {
      return res.status(401).json({ error: "No autorizado" });
    }
    req.admin = { ...payload, role: "admin" };
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}

export function requireClient(req: Request, res: Response, next: NextFunction) {
  const token = readBearer(req);
  if (!token) {
    return res.status(401).json({ error: "Debés iniciar sesión como cliente" });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Falta JWT_SECRET" });
  }
  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    if (payload.role !== "client") {
      return res.status(401).json({ error: "Debés iniciar sesión como cliente" });
    }
    req.client = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida o vencida" });
  }
}
