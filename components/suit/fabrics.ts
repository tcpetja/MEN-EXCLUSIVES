/**
 * Cloth as the renderer sees it: the weave tile from weaves.ts as textures,
 * plus the surface settings that make it read as that cloth under light.
 * Wool is crisp, cashmere is soft, linen is dry, velvet glows at the edge.
 */
import * as THREE from "three";
import type { ClothId, ClothPattern } from "./config";
import { WEAVE_SIZE, drawWeave } from "./weaves";

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

export interface ClothTextures {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

const cache = new Map<string, ClothTextures>();

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
    const { colour, height } = drawWeave(cloth, color, pattern, WEAVE_SIZE);
    entry = {
      map: toTexture(colour, WEAVE_SIZE, true, anisotropy),
      bumpMap: toTexture(height, WEAVE_SIZE, false, anisotropy),
    };
    cache.set(key, entry);
  }
  return entry;
}
