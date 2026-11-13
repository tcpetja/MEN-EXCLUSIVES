/**
 * Photographs every catalogue suit from the live 3D model.
 *
 *   npm run dev            (in another terminal)
 *   npm run render:stills  [-- --only=<slug>] [--base=http://localhost:3000]
 *
 * Writes public/suits/<slug>.webp, <slug>-detail.webp and hero.webp.
 * Product data is read from the running app (/api/catalogue), so the stills
 * always match lib/products.ts.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import sharp from "sharp";

// Playwright may be installed in the project or globally; require() finds either.
const { chromium } = createRequire(import.meta.url)("playwright");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "suits");
const arg = (name, fallback) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback;
const base = arg("base", "http://localhost:3000");
const only = arg("only", null);

const query = (suit, extra) => {
  const q = new URLSearchParams({
    cloth: suit.cloth,
    color: suit.color.replace("#", ""),
    pattern: suit.pattern,
    lapel: suit.lapel,
    buttons: suit.buttons,
    buttonFinish: suit.buttonFinish,
    satinLapel: suit.satinLapel ? "1" : "0",
    jetted: suit.jetted ? "1" : "0",
    neckwear: suit.neckwear,
    neckwearColor: suit.neckwearColor.replace("#", ""),
    pocketSquare: suit.pocketSquare ? "1" : "0",
    ...extra,
  });
  return `${base}/studio?${q}`;
};

const browser = await chromium.launch({
  // software WebGL so the script runs on machines without a GPU
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

async function shoot(url, file, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector('#studio[data-ready="true"]', { timeout: 120_000 });
  await page.waitForTimeout(250);
  const png = await page.screenshot({ type: "png" });
  await page.close();
  await sharp(png).webp({ quality: 86 }).toFile(path.join(outDir, file));
  console.log("rendered", file);
}

await mkdir(outDir, { recursive: true });
const res = await fetch(`${base}/api/catalogue`);
if (!res.ok) throw new Error(`Could not read the catalogue from ${base}. Is the dev server running?`);
const products = await res.json();

for (const product of products) {
  if (only && product.slug !== only) continue;
  await shoot(query(product.suit, { dist: "2.42", camY: "0.43", stand: "0" }), `${product.slug}.webp`, 960, 1200);
  await shoot(query(product.suit, { view: "chest" }), `${product.slug}-detail.webp`, 960, 1200);
}
if (!only || only === "hero") {
  await shoot(`${base}/studio?view=hero&glow=0`, "hero.webp", 1200, 1200);
}

await browser.close();
