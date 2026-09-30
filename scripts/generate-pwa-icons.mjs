import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public/icons");

mkdirSync(outDir, { recursive: true });

function iconSvg(size) {
  const pad = Math.round(size * 0.14);
  const fontSize = Math.round(size * 0.42);
  const subSize = Math.round(size * 0.08);
  const lineY = Math.round(size * 0.72);
  const lineW = Math.round(size * 0.42);
  const cx = size / 2;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.18)}" fill="#0E0E0E"/>
  <text x="${cx}" y="${Math.round(size * 0.52)}" text-anchor="middle" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="${Math.round(size * 0.01)}" fill="#F7F4EE">BM</text>
  <rect x="${cx - lineW / 2}" y="${lineY}" width="${lineW}" height="${Math.max(2, Math.round(size * 0.012))}" fill="#C9A24A"/>
  <text x="${cx}" y="${Math.round(size * 0.86)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" font-weight="600" letter-spacing="${Math.round(size * 0.04)}" fill="#C9A24A">BEAUTYMAX</text>
</svg>`;
}

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "maskable-512.png", size: 512, maskable: true },
];

for (const entry of sizes) {
  const svg = entry.maskable
    ? iconSvg(entry.size).replace(
        `rx="${Math.round(entry.size * 0.18)}"`,
        'rx="0"',
      )
    : iconSvg(entry.size);

  await sharp(Buffer.from(svg))
    .png()
    .toFile(join(outDir, entry.name));

  console.log(`wrote ${entry.name}`);
}

writeFileSync(join(outDir, "icon.svg"), iconSvg(512));
console.log("wrote icon.svg");
