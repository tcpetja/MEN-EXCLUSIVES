/**
 * Lighting and camera states. Values mirror DESIGN.md §7.
 * The hero interpolates between the four chapter states as the page scrolls;
 * everything else uses STUDIO.
 */
import * as THREE from "three";

type Vec3 = [number, number, number];

export interface StageState {
  /** Rotation of the suit about its vertical axis, radians. */
  yaw: number;
  camera: Vec3;
  target: Vec3;
  /** Warm key light. */
  key: number;
  keyPos: Vec3;
  /** Cool rim from behind. */
  rim: number;
  /** Gold kicker from behind, opposite the rim. */
  kicker: number;
  fill: number;
  /** Strength of the reflected environment. */
  env: number;
}

export const LIGHT_COLORS = {
  key: new THREE.Color("#fff0dc"),
  rim: new THREE.Color("#9fc4ff"),
  kicker: new THREE.Color("#c8a766"),
};

export const STUDIO: StageState = {
  yaw: -0.38,
  camera: [0, 0.43, 2.5],
  target: [0, 0.37, 0],
  key: 3.4,
  keyPos: [1.5, 1.7, 2.6],
  rim: 5,
  kicker: 3.2,
  fill: 0.5,
  env: 0.7,
};

/** A tighter crop on the chest, for product imagery. */
export const STUDIO_CHEST: StageState = {
  ...STUDIO,
  yaw: -0.3,
  camera: [0.02, 0.56, 1.55],
  target: [0.01, 0.53, 0],
};

export const HERO_CHAPTERS: StageState[] = [
  // Silhouette: the suit emerges from the dark, edge-lit
  {
    yaw: -0.62,
    camera: [0, 0.45, 2.5],
    target: [0, 0.36, 0],
    key: 0.5,
    keyPos: [1.9, 1.5, 1.6],
    rim: 7,
    kicker: 5.5,
    fill: 0.12,
    env: 0.22,
  },
  // Cloth: close on the chest, a raking key that shows the weave
  {
    yaw: -0.32,
    camera: [-0.06, 0.57, 1.12],
    target: [-0.08, 0.55, 0],
    key: 4.4,
    keyPos: [2.6, 0.9, 1.5],
    rim: 2.5,
    kicker: 1.5,
    fill: 0.3,
    env: 0.5,
  },
  // Cut: turned to show shoulder, sleeve and waist under a cool profile light
  {
    yaw: 1.32,
    camera: [0, 0.47, 2.2],
    target: [0, 0.38, 0],
    key: 1.3,
    keyPos: [-1.6, 1.8, 2.2],
    rim: 8,
    kicker: 2.2,
    fill: 0.22,
    env: 0.4,
  },
  // Finish: square to the customer, full warm key
  {
    yaw: Math.PI * 2 - 0.3,
    camera: [0, 0.45, 2.5],
    target: [0, 0.36, 0],
    key: 3.6,
    keyPos: [1.5, 1.7, 2.6],
    rim: 5,
    kicker: 3.6,
    fill: 0.5,
    env: 0.75,
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number, out: Vec3) => {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
};

export function cloneStage(s: StageState): StageState {
  return { ...s, camera: [...s.camera], target: [...s.target], keyPos: [...s.keyPos] };
}

export function mixStage(a: StageState, b: StageState, t: number, out: StageState) {
  out.yaw = lerp(a.yaw, b.yaw, t);
  lerp3(a.camera, b.camera, t, out.camera);
  lerp3(a.target, b.target, t, out.target);
  lerp3(a.keyPos, b.keyPos, t, out.keyPos);
  out.key = lerp(a.key, b.key, t);
  out.rim = lerp(a.rim, b.rim, t);
  out.kicker = lerp(a.kicker, b.kicker, t);
  out.fill = lerp(a.fill, b.fill, t);
  out.env = lerp(a.env, b.env, t);
  return out;
}

const ease = (t: number) => t * t * (3 - 2 * t);

/** Stage state for a hero scroll position in 0..1. */
export function heroStage(progress: number, out: StageState) {
  const last = HERO_CHAPTERS.length - 1;
  const p = Math.min(1, Math.max(0, progress)) * last;
  const i = Math.min(last - 1, Math.floor(p));
  return mixStage(HERO_CHAPTERS[i], HERO_CHAPTERS[i + 1], ease(p - i), out);
}
