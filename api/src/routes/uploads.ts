import { Router } from "express";
import multer from "multer";
import { prepareProductPhoto } from "../lib/images.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 8 },
});

export const uploadsRouter = Router();

uploadsRouter.post("/", requireAuth, (req, res) => {
  upload.array("files", 8)(req, res, async (err: unknown) => {
    if (err) {
      const tooBig = typeof err === "object" && err !== null && "code" in err && err.code === "LIMIT_FILE_SIZE";
      return res.status(400).json({
        error: tooBig ? "Cada foto puede pesar hasta 20 MB" : "No se pudo leer el archivo",
      });
    }

    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (!files.length) {
      return res.status(400).json({ error: "Elegí al menos una foto" });
    }

    const urls: string[] = [];
    try {
      for (const file of files) {
        const prepared = await prepareProductPhoto(file.buffer);
        const saved = await prisma.storedImage.create({
          data: { mimeType: prepared.mimeType, bytes: prepared.bytes },
        });
        urls.push(`/media/${saved.id}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo guardar la foto";
      return res.status(400).json({ error: message });
    }

    return res.status(201).json({ urls });
  });
});
