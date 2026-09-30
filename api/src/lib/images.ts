import convert from "heic-convert";
import sharp from "sharp";

const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
]);

export type PhotoKind = "jpeg" | "png" | "webp" | "heic" | "unknown";

export function sniffPhoto(buffer: Buffer): PhotoKind {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp") {
    const box = buffer.subarray(8, Math.min(buffer.length, 64)).toString("ascii").toLowerCase();
    for (const brand of HEIF_BRANDS) {
      if (box.includes(brand)) return "heic";
    }
  }
  return "unknown";
}

export async function prepareProductPhoto(input: Buffer) {
  const kind = sniffPhoto(input);
  if (kind === "unknown") {
    throw new Error(
      "Ese archivo no es una foto compatible. Desde el iPhone sirven JPEG y HEIC (la cámara por defecto). RAW y Live Photo en video no.",
    );
  }

  const jpeg =
    kind === "heic"
      ? Buffer.from(
          await convert({
            buffer: new Uint8Array(input),
            format: "JPEG",
            quality: 0.9,
          }),
        )
      : input;

  const bytes = await sharp(jpeg, { failOn: "error" })
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  if (!bytes.length || sniffPhoto(bytes) !== "jpeg") {
    throw new Error("No se pudo preparar la foto");
  }

  return { mimeType: "image/jpeg" as const, bytes };
}
