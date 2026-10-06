import { prisma } from "../../lib/prisma.js";
import { epochCursor } from "./client.js";

export async function getCursor(id: string) {
  const row = await prisma.emSyncCursor.findUnique({ where: { id } });
  return row?.lastAt ?? epochCursor();
}

export async function saveCursor(id: string, lastAt: Date, summary: string) {
  await prisma.emSyncCursor.upsert({
    where: { id },
    create: { id, lastAt, summary },
    update: { lastAt, summary },
  });
}

export async function listCursors() {
  return prisma.emSyncCursor.findMany({ orderBy: { id: "asc" } });
}
