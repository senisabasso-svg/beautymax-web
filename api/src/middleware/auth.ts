import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type AuthPayload = { sub: string; email: string };

declare global {
  namespace Express {
    interface Request {
      admin?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No autorizado" });
  }
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: "Falta JWT_SECRET" });
  }
  try {
    const token = header.slice(7);
    req.admin = jwt.verify(token, secret) as AuthPayload;
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido o vencido" });
  }
}
