import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const mediaRouter = Router();

mediaRouter.get("/:id", async (req, res) => {
  const file = await prisma.storedImage.findUnique({ where: { id: req.params.id } });
  if (!file) return res.status(404).json({ error: "Imagen no encontrada" });
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.send(Buffer.from(file.bytes));
});
