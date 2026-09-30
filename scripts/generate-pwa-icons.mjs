import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "public/brand/logo-source.jpg");
const brandDir = join(root, "public/brand");
const iconDir = join(root, "public/icons");

mkdirSync(brandDir, { recursive: true });
mkdirSync(iconDir, { recursive: true });

function isPaper(r, g, b) {
  return r > 245 && g > 245 && b > 245;
}

async function circularLogo() {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (isPaper(data[i], data[i + 1], data[i + 2])) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const radius = Math.min(maxX - minX, maxY - minY) / 2;

  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dist = Math.hypot(x - cx, y - cy);
      const i = (y * w + x) * 4 + 3;
      if (dist >= radius) data[i] = 0;
      else if (dist > radius - 1.5) data[i] = Math.round((255 * (radius - dist)) / 1.5);
    }
  }

  return sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .png();
}

const logo = await circularLogo();
await logo.clone().resize(512, 512).png().toFile(join(brandDir, "logo.png"));
console.log("wrote public/brand/logo.png");

async function appIcon(size, scale) {
  const inner = Math.round(size * scale);
  const logoPng = await logo.clone().resize(inner, inner).png().toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([{ input: logoPng, gravity: "centre" }])
    .png();
}

const sizes = [
  { name: "icon-192.png", size: 192, scale: 0.92 },
  { name: "icon-512.png", size: 512, scale: 0.92 },
  { name: "apple-touch-icon.png", size: 180, scale: 0.92 },
  { name: "maskable-512.png", size: 512, scale: 0.8 },
];

for (const entry of sizes) {
  await (await appIcon(entry.size, entry.scale)).toFile(join(iconDir, entry.name));
  console.log(`wrote ${entry.name}`);
}
