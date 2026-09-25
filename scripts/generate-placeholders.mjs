import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "src/data/products.ts"), "utf8").replaceAll("\r\n", "\n");
const blocks = source.split(/\n  \{\n/).slice(1);

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(text, size) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > size && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

mkdirSync(join(root, "public/productos"), { recursive: true });

for (const block of blocks) {
  const name = block.match(/name: "([^"]+)"/)?.[1];
  const brand = block.match(/brand: "([^"]+)"/)?.[1];
  const image = block.match(/"(\/productos\/[^"]+\.svg)"/)?.[1];
  if (!name || !brand || !image) continue;

  const lines = wrap(name, 28);
  const text = lines
    .map((line, index) => {
      const y = 690 + index * 28;
      return `<text x="400" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-size="22" fill="#6B6B6B">${escapeXml(line)}</text>`;
    })
    .join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000">
  <rect width="800" height="1000" fill="#F7F4EE"/>
  <rect x="48" y="48" width="704" height="904" fill="none" stroke="#C9A24A" stroke-width="1"/>
  <text x="400" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="54" fill="#9A7B2F">${escapeXml(brand)}</text>
  <line x1="280" y1="520" x2="520" y2="520" stroke="#C9A24A" stroke-width="2"/>
  ${text}
</svg>
`;

  writeFileSync(join(root, "public", image), svg);
  console.log(image);
}
