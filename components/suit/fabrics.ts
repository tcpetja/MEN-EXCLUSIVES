/**
 * Procedural cloth. Each cloth is one seamless tile (colour + height) drawn to
 * a canvas, plus the surface settings that make it read as that cloth under
 * light: wool is crisp, cashmere is soft, linen is dry, velvet glows at the edge.
 */
import * as THREE from "three";
import type { ClothId, ClothPattern } from "./config";

const SIZE = 512;

/* ---------- seamless noise ---------- */

function hash(x: number, y: number, seed: number) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

/** Value noise that tiles every `px` cells across and `py` cells down (integers). */
function tileNoise(x: number, y: number, px: number, py: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const wx = (v: number) => ((v % px) + px) % px;
  const wy = (v: number) => ((v % py) + py) % py;
  const a = hash(wx(xi), wy(yi), seed);
  const b = hash(wx(xi + 1), wy(yi), seed);
  const c = hash(wx(xi), wy(yi + 1), seed);
  const d = hash(wx(xi + 1), wy(yi + 1), seed);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, px: number, py: number, seed: number, octaves = 3) {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * tileNoise(x * f, y * f, px * f, py * f, seed + o * 17);
    amp *= 0.5;
    f *= 2;
  }
  return sum / (1 - Math.pow(0.5, octaves));
}

/* ---------- weaves: return height 0..1 and a tint multiplier ---------- */

type Weave = (px: number, py: number) => { h: number; tint: number; mix?: number };

// px, py are in pixels of a SIZE × SIZE tile that covers 32 mm of cloth

const wool: Weave = (px, py) => {
  // 2/2 twill: a diagonal rib about 1 mm wide
  const period = SIZE / 32;
  const d = (px + py) / period;
  const rib = 0.5 + 0.5 * Math.sin(d * Math.PI * 2);
  const yarn = 0.5 + 0.5 * Math.sin(((px - py) / (period * 0.5)) * Math.PI * 2);
  const fibre = fbm(px / 8, py / 8, SIZE / 8, SIZE / 8, 3, 2);
  const h = rib * 0.7 + yarn * 0.14 + fibre * 0.16;
  return { h, tint: 0.9 + 0.12 * rib + 0.08 * (fibre - 0.5) };
};

const chalkStripe: Weave = (px, py) => {
  const base = wool(px, py);
  // one stripe every 16 mm, chalked rather than drawn: soft and a little broken
  const spacing = SIZE / 2;
  const dx = Math.abs(((px + spacing / 2) % spacing) - spacing / 2);
  const line = Math.exp(-(dx * dx) / 9);
  const broken = 0.55 + 0.45 * fbm(px / 4, py / 8, SIZE / 4, SIZE / 8, 11, 2);
  return { ...base, mix: line * broken * 0.6 };
};

const cashmere: Weave = (px, py) => {
  // no visible weave: a brushed nap that lies downward
  const nap = fbm(px / 4, py / 16, SIZE / 4, SIZE / 16, 5, 3);
  const cloud = fbm(px / 64, py / 64, SIZE / 64, SIZE / 64, 9, 2);
  const h = nap * 0.85 + cloud * 0.15;
  return { h, tint: 0.95 + 0.12 * (nap - 0.5) + 0.03 * (cloud - 0.5) };
};

const linen: Weave = (px, py) => {
  // plain weave, about 1.3 mm per thread, with slubs
  const threads = 24;
  const cell = SIZE / threads;
  const u = px / cell;
  const v = py / cell;
  const iu = Math.floor(u);
  const iv = Math.floor(v);
  const warpThick = 0.75 + 0.5 * hash(iu % threads, 0, 21);
  const weftThick = 0.75 + 0.5 * hash(0, iv % threads, 22);
  const slubWarp = Math.pow(tileNoise(iu, v / 4, threads, threads / 4, 31), 4);
  const slubWeft = Math.pow(tileNoise(u / 4, iv, threads / 4, threads, 32), 4);
  const fu = u - iu - 0.5;
  const fv = v - iv - 0.5;
  const over = (iu + iv) % 2 === 0;
  const warp = Math.max(0, 1 - (Math.abs(fu) * 2.2) / warpThick) * (over ? 1 : 0.45) * (1 + 0.5 * slubWarp);
  const weft = Math.max(0, 1 - (Math.abs(fv) * 2.2) / weftThick) * (over ? 0.45 : 1) * (1 + 0.5 * slubWeft);
  const h = clamp01(Math.max(warp, weft) * 0.8 + 0.1 * tileNoise(px / 4, py / 4, SIZE / 4, SIZE / 4, 41));
  const thread = over ? hash(iu % threads, 7, 51) : hash(7, iv % threads, 52);
  return { h, tint: 0.86 + 0.16 * h + 0.05 * (thread - 0.5) + 0.05 * (slubWarp + slubWeft) };
};

const velvet: Weave = (px, py) => {
  // a dense pile: fine grain, with broad soft marks where the pile lies over
  const grain = tileNoise(px / 2, py / 2, SIZE / 2, SIZE / 2, 61);
  const crush = fbm(px / 64, py / 128, SIZE / 64, SIZE / 128, 63, 2);
  return { h: grain * 0.9 + crush * 0.1, tint: 0.9 + 0.05 * (crush - 0.5) + 0.08 * (grain - 0.5) };
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/* ---------- surface settings ---------- */

export interface ClothSurface {
  roughness: number;
  sheen: number;
  sheenRoughness: number;
  /** How far the sheen colour is lifted from the cloth colour toward white. */
  sheenLift: number;
  bumpScale: number;
}

export const CLOTH_SURFACE: Record<ClothId, ClothSurface> = {
  wool: { roughness: 0.72, sheen: 0.4, sheenRoughness: 0.5, sheenLift: 0.3, bumpScale: 1.6 },
  cashmere: { roughness: 0.97, sheen: 0.7, sheenRoughness: 0.75, sheenLift: 0.22, bumpScale: 0.9 },
  linen: { roughness: 0.95, sheen: 0.1, sheenRoughness: 0.9, sheenLift: 0.15, bumpScale: 2.2 },
  velvet: { roughness: 1, sheen: 1, sheenRoughness: 0.42, sheenLift: 0.3, bumpScale: 0.5 },
};

/* ---------- texture drawing ---------- */

export interface ClothTextures {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

const cache = new Map<string, ClothTextures>();

function weaveFor(cloth: ClothId, pattern: ClothPattern): Weave {
  if (cloth === "wool") return pattern === "chalkstripe" ? chalkStripe : wool;
  if (cloth === "cashmere") return cashmere;
  if (cloth === "linen") return linen;
  return velvet;
}

function draw(cloth: ClothId, color: string, pattern: ClothPattern, size: number) {
  const weave = weaveFor(cloth, pattern);
  const base = new THREE.Color(color); // linear working space
  const chalk = new THREE.Color("#d9d2c2");
  const out = new THREE.Color();
  const colour = new Uint8ClampedArray(size * size * 4);
  const height = new Uint8ClampedArray(size * size * 4);
  const k = SIZE / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const { h, tint, mix } = weave(x * k, y * k);
      out.copy(base).multiplyScalar(tint);
      if (mix) out.lerp(chalk, mix);
      // back to sRGB bytes for the canvas
      out.convertLinearToSRGB();
      const i = (y * size + x) * 4;
      colour[i] = out.r * 255;
      colour[i + 1] = out.g * 255;
      colour[i + 2] = out.b * 255;
      colour[i + 3] = 255;
      const hv = clamp01(h) * 255;
      height[i] = hv;
      height[i + 1] = hv;
      height[i + 2] = hv;
      height[i + 3] = 255;
    }
  }
  return { colour, height };
}

function toTexture(pixels: Uint8ClampedArray, size: number, srgb: boolean, anisotropy: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.putImageData(new ImageData(pixels as Uint8ClampedArray<ArrayBuffer>, size, size), 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = anisotropy;
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export function getClothTextures(
  cloth: ClothId,
  color: string,
  pattern: ClothPattern,
  anisotropy = 8,
): ClothTextures {
  const key = `${cloth}:${color}:${pattern}`;
  let entry = cache.get(key);
  if (!entry) {
    const { colour, height } = draw(cloth, color, pattern, SIZE);
    entry = {
      map: toTexture(colour, SIZE, true, anisotropy),
      bumpMap: toTexture(height, SIZE, false, anisotropy),
    };
    cache.set(key, entry);
    // keep the cache small: a customer rarely revisits more than a few cloths
    if (cache.size > 10) {
      const oldest = cache.keys().next().value as string;
      const stale = cache.get(oldest)!;
      stale.map.dispose();
      stale.bumpMap.dispose();
      cache.delete(oldest);
    }
  }
  return entry;
}

/** A small flat swatch (data URL) of the same weave, for 2D interface use. */
export function drawSwatch(cloth: ClothId, color: string, pattern: ClothPattern, size = 128) {
  const { colour, height } = draw(cloth, color, pattern, size);
  // bake a little light from the height so the weave reads without a renderer
  for (let i = 0; i < colour.length; i += 4) {
    const shade = 0.78 + 0.44 * (height[i] / 255);
    colour[i] *= shade;
    colour[i + 1] *= shade;
    colour[i + 2] *= shade;
  }
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d")!.putImageData(new ImageData(colour as Uint8ClampedArray<ArrayBuffer>, size, size), 0, 0);
  return canvas.toDataURL("image/png");
}
