/**
 * The suit, cut in code.
 *
 * The jacket is described the way a cutter describes it: a body block
 * (elliptical sections stacked from hem to neck), a front edge, a lapel roll
 * line from the break point to the neck, and pieces laid on top of the body
 * (lapels, collar, pocket flaps). Front-view measurements are in metres, with
 * y = 0 at the hem and +x at the wearer's left (the viewer's right).
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ButtonsId, LapelId, Neckwear } from "./config";

/* ------------------------------------------------------------------ */
/* Interpolation                                                       */
/* ------------------------------------------------------------------ */

/** Monotone cubic interpolation, so the block never overshoots its keys. */
function pchip(xs: number[], ys: number[]) {
  const n = xs.length;
  const h: number[] = [];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = xs[i + 1] - xs[i];
    d[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  const m: number[] = new Array(n).fill(0);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) m[i] = 0;
    else {
      const w1 = 2 * h[i] + h[i - 1];
      const w2 = h[i] + 2 * h[i - 1];
      m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i];
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h[i] * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h[i] * m[i + 1]
    );
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const sgnpow = (v: number, e: number) => Math.sign(v) * Math.pow(Math.abs(v), e);

/* ------------------------------------------------------------------ */
/* The body block                                                      */
/* ------------------------------------------------------------------ */

// y, half-width, front depth, back depth, squareness of the section
const BLOCK: [number, number, number, number, number][] = [
  [-0.08, 0.196, 0.124, 0.12, 2.5],
  [0.0, 0.2, 0.128, 0.124, 2.5], // hem
  [0.14, 0.193, 0.127, 0.121, 2.5], // seat
  [0.31, 0.169, 0.118, 0.106, 2.4], // waist
  [0.5, 0.193, 0.139, 0.117, 2.4], // chest
  [0.6, 0.214, 0.133, 0.122, 2.4],
  [0.66, 0.229, 0.114, 0.114, 2.25], // shoulder point
  [0.698, 0.192, 0.093, 0.1, 2.2],
  [0.722, 0.132, 0.078, 0.086, 2.1],
  [0.738, 0.083, 0.068, 0.075, 2.0], // neck base
  [0.76, 0.063, 0.062, 0.067, 2.0],
  [0.82, 0.06, 0.06, 0.064, 2.0],
];

const blockY = BLOCK.map((k) => k[0]);
const halfWidth = pchip(blockY, BLOCK.map((k) => k[1]));
const frontDepth = pchip(blockY, BLOCK.map((k) => k[2]));
const backDepth = pchip(blockY, BLOCK.map((k) => k[3]));
const squareness = pchip(blockY, BLOCK.map((k) => k[4]));

export const HEM_Y = 0;
export const NECK_Y = 0.738;
const SHELL_TOP_Y = 0.745;
/** Where the lapel roll line meets the neck, in front view. */
const NECK_X = 0.058;
/** How far the lapping front stands proud of the front beneath it. */
const PROUD = 0.007;
/** Shirt and form sit this far inside the jacket. */
const INSET = -0.013;

function blockPoint(phi: number, y: number, out: THREE.Vector3) {
  const s = Math.sin(phi);
  const c = Math.cos(phi);
  const e = 2 / squareness(y);
  const depth = c >= 0 ? frontDepth(y) : backDepth(y);
  return out.set(halfWidth(y) * sgnpow(s, e), y, depth * sgnpow(c, e));
}

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _d = new THREE.Vector3();

function blockNormal(phi: number, y: number, out: THREE.Vector3) {
  const eps = 2e-3;
  blockPoint(phi + eps, y, _a);
  blockPoint(phi - eps, y, _b);
  _a.sub(_b);
  blockPoint(phi, y + eps, _c);
  blockPoint(phi, y - eps, _d);
  _c.sub(_d);
  return out.crossVectors(_a, _c).normalize();
}

const _n = new THREE.Vector3();

/** A point on the body, pushed `off` metres along the surface normal. */
function surface(phi: number, y: number, off: number, out: THREE.Vector3) {
  blockPoint(phi, y, out);
  if (off !== 0) {
    blockNormal(phi, y, _n);
    out.addScaledVector(_n, off);
  }
  return out;
}

/** Angle around the body for a front-view x at height y. */
function phiFromX(x: number, y: number) {
  const r = clamp(x / halfWidth(y), -1, 1);
  return Math.asin(clamp(sgnpow(r, squareness(y) / 2), -1, 1));
}

/* ------------------------------------------------------------------ */
/* Front specification per button configuration                        */
/* ------------------------------------------------------------------ */

interface FrontSpec {
  /** Height where the lapel begins to roll. */
  breakY: number;
  /** Front-view x of the lapping edge at the break (negative: past centre). */
  edgeX: number;
  /** Lowest fastening button; below this the fronts cut away. */
  lowestY: number;
  /** How far the fronts open at the hem. */
  cutaway: number;
  buttons: { x: number; y: number }[];
}

const FRONTS: Record<ButtonsId, FrontSpec> = {
  one: {
    breakY: 0.372,
    edgeX: -0.015,
    lowestY: 0.372,
    cutaway: 0.06,
    buttons: [{ x: 0.004, y: 0.372 }],
  },
  two: {
    breakY: 0.405,
    edgeX: -0.015,
    lowestY: 0.298,
    cutaway: 0.055,
    buttons: [
      { x: 0.004, y: 0.405 },
      { x: 0.004, y: 0.298 },
    ],
  },
  three: {
    breakY: 0.478,
    edgeX: -0.015,
    lowestY: 0.282,
    cutaway: 0.05,
    buttons: [
      { x: 0.004, y: 0.478 },
      { x: 0.004, y: 0.38 },
      { x: 0.004, y: 0.282 },
    ],
  },
  double: {
    breakY: 0.392,
    edgeX: -0.084,
    lowestY: 0.292,
    cutaway: 0.004,
    buttons: [
      { x: -0.094, y: 0.492 },
      { x: 0.094, y: 0.492 },
      { x: -0.066, y: 0.392 },
      { x: 0.066, y: 0.392 },
      { x: -0.066, y: 0.292 },
      { x: 0.066, y: 0.292 },
    ],
  },
};

/** Front-view x of the lapping (wearer's left) front edge at height y. */
function edgeX(spec: FrontSpec, y: number) {
  if (y >= spec.breakY) {
    const t = (y - spec.breakY) / (NECK_Y - spec.breakY);
    return lerp(spec.edgeX, NECK_X, t);
  }
  if (y >= spec.lowestY) return spec.edgeX;
  const t = (spec.lowestY - y) / (spec.lowestY - HEM_Y);
  return spec.edgeX + spec.cutaway * Math.pow(t, 1.7);
}

/** Offset of the lapping front at angle phi (it stands proud near its edge). */
function proudAt(spec: FrontSpec, phi: number, y: number) {
  const phi0 = phiFromX(edgeX(spec, y), y);
  if (phi < phi0 - 1e-4 || phi > Math.PI) return 0;
  const overlap = Math.max(0, -phi0);
  return PROUD * (1 - smoothstep(overlap + 0.08, overlap + 0.55, phi));
}

/* ------------------------------------------------------------------ */
/* Mesh helpers                                                        */
/* ------------------------------------------------------------------ */

const UV_RADIUS = 0.16;

interface GridVertex {
  p: THREE.Vector3;
  u: number;
  v: number;
}

/** Build an indexed grid; `fn` fills position and uv for each (column,row). */
function grid(
  cols: number,
  rows: number,
  fn: (i: number, j: number, out: GridVertex) => void,
  flip = false,
  /** First and last columns coincide (a tube): weld their normals. */
  closed = false,
) {
  const positions = new Float32Array(cols * rows * 3);
  const uvs = new Float32Array(cols * rows * 2);
  const vert: GridVertex = { p: new THREE.Vector3(), u: 0, v: 0 };
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      fn(i, j, vert);
      const k = j * cols + i;
      positions[k * 3] = vert.p.x;
      positions[k * 3 + 1] = vert.p.y;
      positions[k * 3 + 2] = vert.p.z;
      uvs[k * 2] = vert.u;
      uvs[k * 2 + 1] = vert.v;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      if (flip) index.push(a, c, b, b, c, d);
      else index.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  if (closed) {
    const normal = g.getAttribute("normal") as THREE.BufferAttribute;
    for (let j = 0; j < rows; j++) {
      const a = j * cols;
      const b = a + cols - 1;
      _a.fromBufferAttribute(normal, a).add(_b.fromBufferAttribute(normal, b)).normalize();
      normal.setXYZ(a, _a.x, _a.y, _a.z);
      normal.setXYZ(b, _a.x, _a.y, _a.z);
    }
  }
  return g;
}

type PY = { phi: number; y: number };
type XY = [number, number];

const toPY = ([x, y]: XY): PY => ({ phi: phiFromX(x, y), y });

function lineXY(a: XY, b: XY, n: number): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
  }
  return out;
}

function bezierXY(a: XY, c: XY, b: XY, n: number, t0 = 0, t1 = 1): XY[] {
  const out: XY[] = [];
  for (let i = 0; i < n; i++) {
    const t = lerp(t0, t1, i / (n - 1));
    const u = 1 - t;
    out.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    ]);
  }
  return out;
}

/** Catmull-Rom through control points in (phi, y). */
function splinePY(points: PY[], perSegment: number): PY[] {
  const out: PY[] = [];
  const get = (i: number) => points[clamp(i, 0, points.length - 1)];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const last = i === points.length - 2;
    for (let k = 0; k < perSegment + (last ? 1 : 0); k++) {
      const t = k / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ phi: f(p0.phi, p1.phi, p2.phi, p3.phi), y: f(p0.y, p1.y, p2.y, p3.y) });
    }
  }
  return out;
}

interface StripOptions {
  across: number;
  /** Offset from the body at rung position s (0 inner → 1 outer), sample k. */
  off: (phi: number, y: number, s: number, k: number) => number;
  /** Add a turned-under row beyond the inner edge (the roll of a lapel). */
  rollInner?: number;
  /** Add a turned-under row beyond the outer edge (gives the edge a thickness). */
  turnOuter?: boolean;
  flip?: boolean;
}

/** A piece of cloth laid on the body between two edges. */
function strip(inner: PY[], outer: PY[], o: StripOptions) {
  const n = inner.length;
  const extraIn = o.rollInner ? 1 : 0;
  const extraOut = o.turnOuter ? 1 : 0;
  const cols = o.across + 1 + extraIn + extraOut;
  return grid(
    cols,
    n,
    (i, k, vert) => {
      const a = inner[k];
      const b = outer[k];
      let s: number;
      let drop = 0;
      if (extraIn && i === 0) {
        s = -(o.rollInner ?? 0);
        drop = 0.0075;
      } else if (extraOut && i === cols - 1) {
        s = 1;
        drop = 0.003;
      } else {
        s = (i - extraIn) / o.across;
      }
      const phi = lerp(a.phi, b.phi, s);
      const y = lerp(a.y, b.y, s);
      surface(phi, y, o.off(phi, y, clamp(s, 0, 1), k) - drop, vert.p);
      vert.u = (phi * UV_RADIUS) / TILE;
      vert.v = y / TILE;
    },
    o.flip,
  );
}

/** Texture tile size in metres; fabrics.ts draws one tile at this scale. */
export const TILE = 0.032;

function mirrorPY(points: PY[]): PY[] {
  return points.map((p) => ({ phi: -p.phi, y: p.y }));
}

/* ------------------------------------------------------------------ */
/* Jacket body                                                         */
/* ------------------------------------------------------------------ */

function buildShell(spec: FrontSpec) {
  const cols = 220;
  const rows = 120;
  // column 0 is the turned edge of the lapping front; row 0 is the turned hem
  return grid(cols + 1, rows + 1, (i, j, vert) => {
    const y = j === 0 ? HEM_Y : lerp(HEM_Y, SHELL_TOP_Y, (j - 1) / (rows - 1));
    const phi0 = phiFromX(edgeX(spec, y), y);
    const phi1 = Math.PI * 2 - phi0;
    const u = i === 0 ? 0 : (i - 1) / (cols - 1);
    // gather columns toward both front edges, where the detail is
    const eased = u + 0.11 * Math.sin(2 * Math.PI * u) * -1;
    const phi = lerp(phi0, phi1, clamp(eased, 0, 1));
    let off = proudAt(spec, phi, y);
    if (i === 0) off -= 0.008;
    if (j === 0) off -= 0.006;
    surface(phi, y, off, vert.p);
    if (j === 0) vert.p.y += 0.004;
    vert.u = (phi * UV_RADIUS) / TILE;
    vert.v = y / TILE;
  });
}

/* ------------------------------------------------------------------ */
/* Lapels and collar                                                   */
/* ------------------------------------------------------------------ */

interface LapelPlan {
  inner: XY[];
  outer: XY[];
  /** Collar end, for notch and peak: gorge end C and collar point K. */
  gorge?: { G: XY; C: XY; K: XY };
  /** Shawl: where the lapel's outer edge reaches the neck. */
  outerNeck?: XY;
}

function planLapel(style: LapelId, spec: FrontSpec): LapelPlan {
  const B: XY = [spec.edgeX, spec.breakY];
  const N: XY = [NECK_X, NECK_Y];
  const fold = (y: number): XY => [edgeX(spec, y), y];
  const len = Math.hypot(N[0] - B[0], N[1] - B[1]);
  // unit vector across the lapel, pointing away from the opening
  const across: XY = [(N[1] - B[1]) / len, -(N[0] - B[0]) / len];
  const double = spec.edgeX < -0.05;

  if (style === "shawl") {
    const n = 44;
    const inner = lineXY(B, N, n);
    const neckWidth = 0.04;
    const belly = double ? 0.04 : 0.03;
    const outer = inner.map(([x, y], i): XY => {
      const t = i / (n - 1);
      const w = neckWidth * smoothstep(0, 1, t) + belly * Math.pow(Math.sin(Math.PI * t), 1.2);
      return [x + across[0] * w, y + across[1] * w];
    });
    return { inner, outer, outerNeck: outer[n - 1] };
  }

  const peak = style === "peak";
  const G = fold(peak ? 0.672 : 0.666);
  const C: XY = peak ? [G[0] + 0.05, G[1] - 0.016] : [G[0] + 0.05, G[1] - 0.02];
  const T: XY = peak
    ? [C[0] + (double ? 0.046 : 0.04), C[1] + (double ? 0.044 : 0.038)]
    : [C[0] + 0.034, C[1] - 0.013];
  const K: XY = peak
    ? [lerp(C[0], T[0], 0.6) - 0.002, lerp(C[1], T[1], 0.6) + 0.004]
    : [C[0] + 0.02, C[1] + 0.03];

  const mid: XY = [(B[0] + T[0]) / 2, (B[1] + T[1]) / 2];
  const belly = (peak ? 0.03 : 0.014) + (double ? 0.012 : 0);
  const ctrl: XY = [mid[0] + across[0] * belly, mid[1] + across[1] * belly - (peak ? 0.03 : 0)];

  const n1 = 40;
  const n2 = 9;
  const split = 0.9;
  const inner = [...lineXY(B, G, n1), ...lineXY(G, C, n2).slice(1)];
  const outer = [...bezierXY(B, ctrl, T, n1, 0, split), ...bezierXY(B, ctrl, T, n2, split, 1).slice(1)];
  return { inner, outer, gorge: { G, C, K } };
}

function buildLapels(style: LapelId, spec: FrontSpec) {
  const plan = planLapel(style, spec);
  const inner = plan.inner.map(toPY);
  const outer = plan.outer.map(toPY);
  const n = inner.length;

  const lapping = strip(inner, outer, {
    across: 12,
    rollInner: 0.1,
    turnOuter: true,
    off: (phi, y, s, k) => {
      // the roll fades in from the break point so the lapel grows out of the front
      const grow = smoothstep(0, 0.12, k / (n - 1));
      return proudAt(spec, phi, y) + grow * lerp(0.0075, 0.0035, Math.sqrt(s)) + 0.0006;
    },
  });
  const under = strip(mirrorPY(inner), mirrorPY(outer), {
    across: 12,
    rollInner: 0.1,
    turnOuter: true,
    flip: true,
    off: (_phi, _y, s, k) => {
      const grow = smoothstep(0, 0.12, k / (n - 1));
      return grow * lerp(0.0048, 0.0028, Math.sqrt(s)) + 0.0004;
    },
  });
  return { geometry: mergeGeometries([lapping, under])!, plan };
}

function buildCollar(plan: LapelPlan, spec: FrontSpec) {
  const S: PY = { phi: 1.05, y: 0.7225 };
  const N = toPY([NECK_X, NECK_Y]);
  let innerHalf: PY[];
  let outerHalf: PY[];
  let seam = 0; // samples that lie along the gorge seam

  if (plan.gorge) {
    const G = toPY(plan.gorge.G);
    const C = toPY(plan.gorge.C);
    const K = toPY(plan.gorge.K);
    const K1: PY = { phi: lerp(K.phi, S.phi, 0.5), y: lerp(K.y, S.y, 0.4) };
    seam = 5;
    const lead = (a: PY, b: PY) =>
      Array.from({ length: seam }, (_, i) => ({
        phi: lerp(a.phi, b.phi, i / seam),
        y: lerp(a.y, b.y, i / seam),
      }));
    innerHalf = [
      ...lead(C, G),
      ...splinePY([G, N, { phi: 1.62, y: 0.757 }, { phi: 2.4, y: 0.768 }, { phi: Math.PI, y: 0.772 }], 10),
    ];
    outerHalf = [
      ...lead(K, K1),
      ...splinePY([K1, S, { phi: 1.72, y: 0.7265 }, { phi: 2.5, y: 0.7325 }, { phi: Math.PI, y: 0.736 }], 10),
    ];
  } else {
    const O = toPY(plan.outerNeck!);
    innerHalf = splinePY([N, { phi: 1.62, y: 0.757 }, { phi: 2.4, y: 0.768 }, { phi: Math.PI, y: 0.772 }], 10);
    outerHalf = splinePY([O, { phi: 1.72, y: 0.7265 }, { phi: 2.5, y: 0.7325 }, { phi: Math.PI, y: 0.736 }], 10);
  }

  // one continuous band: wearer's left, round the back, wearer's right
  const wrap = (half: PY[]) => [
    ...half,
    ...half
      .slice(0, -1)
      .reverse()
      .map((p) => ({ phi: Math.PI * 2 - p.phi, y: p.y })),
  ];
  const inner = wrap(innerHalf);
  const outer = wrap(outerHalf);
  const half = innerHalf.length - 1;

  return strip(inner, outer, {
    across: 8,
    turnOuter: true,
    rollInner: plan.gorge ? undefined : 0.12,
    off: (phi, y, s, k) => {
      const fromEnd = Math.min(k, 2 * half - k); // 0 at either front end
      const stand = smoothstep(seam, seam + 12, fromEnd); // collar stands up behind the neck
      const lapping = phi < Math.PI ? proudAt(spec, phi, y) : 0;
      const innerLift = lerp(phi < Math.PI ? 0.0075 : 0.0048, 0.0015, stand);
      return lapping + lerp(innerLift, 0.0042, Math.pow(s, 0.8));
    },
  });
}

/* ------------------------------------------------------------------ */
/* Pockets                                                             */
/* ------------------------------------------------------------------ */

function buildPockets(spec: FrontSpec, jetted: boolean) {
  const parts: THREE.BufferGeometry[] = [];
  const height = jetted ? 0.011 : 0.052;
  for (const side of [1, -1] as const) {
    const top = lineXY([0.074, 0.212], [0.176, 0.206], 16).map(toPY);
    const bottom = lineXY([0.076, 0.212 - height], [0.178, 0.206 - height], 16).map(toPY);
    const inner = side === 1 ? top : mirrorPY(top);
    const outer = side === 1 ? bottom : mirrorPY(bottom);
    parts.push(
      strip(inner, outer, {
        across: jetted ? 2 : 5,
        turnOuter: true,
        flip: side === -1,
        off: (phi, y, s) => (side === 1 ? proudAt(spec, phi, y) : 0) + lerp(0.0022, 0.0046, s),
      }),
    );
  }
  // breast welt on the wearer's left chest
  const weltTop = lineXY([0.082, 0.578], [0.168, 0.59], 12).map(toPY);
  const weltBottom = lineXY([0.083, 0.556], [0.169, 0.568], 12).map(toPY);
  parts.push(
    strip(weltTop, weltBottom, {
      across: 3,
      turnOuter: true,
      off: (phi, y) => proudAt(spec, phi, y) + 0.0026,
    }),
  );
  return mergeGeometries(parts)!;
}

function buildPocketSquare(spec: FrontSpec) {
  // a soft two-point fold standing 14 mm above the breast welt
  const n = 21;
  const base = lineXY([0.092, 0.5785], [0.158, 0.588], n).map(toPY);
  const top = lineXY([0.09, 0.5785], [0.16, 0.588], n).map(([x, y], i): XY => {
    const t = i / (n - 1);
    const peaks = 0.006 + 0.011 * Math.pow(Math.abs(Math.sin(Math.PI * (t * 1.5 + 0.2))), 0.7);
    return [x, y + peaks];
  });
  return strip(top.map(toPY), base, {
    across: 3,
    off: (phi, y) => proudAt(spec, phi, y) + 0.0036,
  });
}

/* ------------------------------------------------------------------ */
/* Sleeves                                                             */
/* ------------------------------------------------------------------ */

const sleevePath = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(0.194, 0.669, -0.004),
    new THREE.Vector3(0.214, 0.52, -0.008),
    new THREE.Vector3(0.232, 0.3, 0.004),
    new THREE.Vector3(0.238, 0.066, 0.042),
  ],
  false,
  "centripetal",
);
const sleeveRx = pchip([0, 0.25, 0.6, 1], [0.056, 0.053, 0.048, 0.042]);
const sleeveRz = pchip([0, 0.25, 0.6, 1], [0.09, 0.08, 0.067, 0.0575]);
const CAP = 0.085;

const _t = new THREE.Vector3();
const _u = new THREE.Vector3();
const _w = new THREE.Vector3();
const X_AXIS = new THREE.Vector3(1, 0, 0);

/** A point on the wearer's-left sleeve; mirror x for the right. */
function sleevePoint(t: number, theta: number, scale: number, out: THREE.Vector3) {
  const tt = clamp(t, 0, 1);
  sleevePath.getPoint(tt, out);
  sleevePath.getTangent(tt, _t);
  _u.copy(X_AXIS).addScaledVector(_t, -X_AXIS.dot(_t)).normalize();
  _w.crossVectors(_t, _u);
  const cap = tt < CAP ? Math.sqrt(1 - Math.pow(1 - tt / CAP, 2)) : 1;
  out.addScaledVector(_u, Math.cos(theta) * sleeveRx(tt) * cap * scale);
  out.addScaledVector(_w, Math.sin(theta) * sleeveRz(tt) * cap * scale);
  if (t > 1) out.addScaledVector(_t, (t - 1) * sleevePath.getLength());
  return out;
}

function buildSleeveTube(side: 1 | -1, t0: number, t1: number, scale: number, rows: number) {
  const cols = 40;
  return grid(
    cols + 1,
    rows + 1,
    (i, j, vert) => {
      const theta = (i / cols) * Math.PI * 2;
      const t = lerp(t0, t1, j / rows);
      sleevePoint(t, theta, scale, vert.p);
      vert.p.x *= side;
      vert.u = (theta * 0.07) / TILE;
      vert.v = (t * 0.64) / TILE;
    },
    side === -1,
    true,
  );
}

function buildSleeves() {
  return mergeGeometries([buildSleeveTube(1, 0, 1, 1, 64), buildSleeveTube(-1, 0, 1, 1, 64)])!;
}

function buildShirtCuffs() {
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [1, -1] as const) {
    parts.push(buildSleeveTube(side, 0.95, 1.02, 0.9, 3));
  }
  return mergeGeometries(parts)!;
}

function buildCuffEnds() {
  // a dark disc inside each cuff so the sleeve does not read as hollow
  const parts: THREE.BufferGeometry[] = [];
  for (const side of [1, -1] as const) {
    const centre = sleevePath.getPoint(0.99);
    const disc = grid(
      25,
      2,
      (i, j, vert) => {
        if (j === 0) vert.p.copy(centre);
        else sleevePoint(0.99, (i / 24) * Math.PI * 2, 0.9, vert.p);
        vert.p.x *= side;
        vert.u = 0;
        vert.v = 0;
      },
      side === 1,
    );
    parts.push(disc);
  }
  return mergeGeometries(parts)!;
}

/* ------------------------------------------------------------------ */
/* Shirt, form, neckwear                                               */
/* ------------------------------------------------------------------ */

function buildBody(y0: number, y1: number, off: number, rows: number) {
  const cols = 96;
  return grid(cols + 1, rows + 1, (i, j, vert) => {
    const phi = (i / cols) * Math.PI * 2;
    const y = lerp(y0, y1, j / rows);
    surface(phi, y, off, vert.p);
    vert.u = (phi * UV_RADIUS) / TILE;
    vert.v = y / TILE;
  }, false, true);
}

function buildShirtCollar() {
  const parts: THREE.BufferGeometry[] = [];
  // the band round the neck, open at the throat
  const cols = 72;
  parts.push(
    grid(cols + 1, 5, (i, j, vert) => {
      const phi = lerp(0.03, Math.PI * 2 - 0.03, i / cols);
      const top = 0.772 + 0.007 * (1 - Math.cos(phi)) * 0.5;
      const y = lerp(0.736, top, j / 4);
      surface(phi, y, INSET + 0.0075 - 0.002 * (j / 4), vert.p);
      vert.u = phi;
      vert.v = y * 10;
    }),
  );
  // the two leaves turning down to the collar points
  for (const side of [1, -1] as const) {
    const front = bezierXY([0.007, 0.7665], [0.016, 0.74], [0.043, 0.7105], 12).map(toPY);
    const back = lineXY([0.03, 0.771], [0.068, 0.742], 12).map(toPY);
    const inner = side === 1 ? front : mirrorPY(front);
    const outer = side === 1 ? back : mirrorPY(back);
    parts.push(
      strip(inner, outer, {
        across: 5,
        flip: side === 1,
        off: (_p, _y, s) => INSET + lerp(0.0075, 0.005, s),
      }),
    );
  }
  return mergeGeometries(parts)!;
}

function buildNeckwear(kind: Neckwear, spec: FrontSpec) {
  if (kind === "open") return null;
  const parts: THREE.BufferGeometry[] = [];
  const p = new THREE.Vector3();
  const throatZ = (y: number) => surface(0, y, INSET, p).z;

  if (kind === "tie") {
    const n = 30;
    const bottom = Math.max(0.22, spec.breakY - 0.12);
    const left: PY[] = [];
    const right: PY[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const y = lerp(0.728, bottom, t);
      const w = lerp(0.0135, 0.041, Math.pow(t, 0.85));
      left.push(toPY([-w, y]));
      right.push(toPY([w, y]));
    }
    parts.push(
      strip(left, right, {
        across: 6,
        flip: true,
        off: (_p, _y, s) => INSET + 0.004 + 0.005 * Math.sin(Math.PI * s),
      }),
    );
    // the knot
    const knotRows = 8;
    parts.push(
      grid(9, knotRows + 1, (i, j, vert) => {
        const s = i / 8;
        const t = j / knotRows;
        const y = lerp(0.76, 0.7235, t);
        const w = lerp(0.0215, 0.014, Math.pow(t, 1.3));
        const bulge = Math.sin(Math.PI * s) * (0.0125 - 0.004 * t) + 0.005;
        vert.p.set(lerp(-w, w, s), y, throatZ(y) + bulge);
        vert.u = s;
        vert.v = t;
      }, true),
    );
  } else {
    // bow tie: two pinched wings and a centre knot, standing proud of the throat
    const z = throatZ(0.752) + 0.012;
    for (const side of [1, -1] as const) {
      parts.push(
        grid(
          9,
          7,
          (i, j, vert) => {
            const s = i / 8; // centre → tip
            const t = j / 6; // top → bottom
            const half = lerp(0.008, 0.0215, Math.pow(s, 0.7)) * (1 - 0.12 * Math.pow(s, 6));
            const x = lerp(0.006, 0.058, s);
            const fold = Math.sin(Math.PI * t) * 0.006 * (0.4 + s);
            vert.p.set(side * x, 0.752 + lerp(half, -half, t), z + fold - 0.012 * s * s);
            vert.u = s;
            vert.v = t;
          },
          side === 1,
        ),
      );
    }
    parts.push(
      grid(7, 7, (i, j, vert) => {
        const s = i / 6;
        const t = j / 6;
        vert.p.set(
          lerp(-0.0085, 0.0085, s),
          0.752 + lerp(0.0105, -0.0105, t),
          z + 0.004 + Math.sin(Math.PI * s) * 0.007,
        );
        vert.u = s;
        vert.v = t;
      }, true),
    );
  }
  return mergeGeometries(parts)!;
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export interface ButtonPlacement {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  radius: number;
}

const UP = new THREE.Vector3(0, 1, 0);

function placeFrontButtons(spec: FrontSpec): ButtonPlacement[] {
  return spec.buttons.map(({ x, y }) => {
    const phi = phiFromX(x, y);
    const off = proudAt(spec, phi, y) + 0.0015;
    const position = surface(phi, y, off, new THREE.Vector3());
    const normal = blockNormal(phi, y, new THREE.Vector3());
    return {
      position,
      quaternion: new THREE.Quaternion().setFromUnitVectors(UP, normal),
      radius: 0.0108,
    };
  });
}

function placeCuffButtons(): ButtonPlacement[] {
  const out: ButtonPlacement[] = [];
  const theta = -1.0;
  for (const side of [1, -1] as const) {
    for (let i = 0; i < 4; i++) {
      const t = 0.905 + i * 0.0235;
      const position = sleevePoint(t, theta, 1.02, new THREE.Vector3());
      const centre = sleevePath.getPoint(t);
      const normal = position.clone().sub(centre).normalize();
      position.x *= side;
      normal.x *= side;
      out.push({
        position,
        quaternion: new THREE.Quaternion().setFromUnitVectors(UP, normal),
        radius: 0.0072,
      });
    }
  }
  return out;
}

/** A shallow dished button, modelled lying flat with +y as its face. */
export function buildButtonGeometry() {
  const profile = [
    [0, 0.0034],
    [0.5, 0.0031],
    [0.78, 0.0024],
    [0.9, 0.0036],
    [1, 0.0026],
    [1, 0.0004],
    [0.9, 0],
  ].map(([r, h]) => new THREE.Vector2(r, h));
  const g = new THREE.LatheGeometry(profile, 28);
  return g;
}

/* ------------------------------------------------------------------ */
/* Dress form hardware                                                 */
/* ------------------------------------------------------------------ */

function buildNeckCap() {
  const parts: THREE.BufferGeometry[] = [];
  const cols = 48;
  // collar of the cap, a shallow dome and a finial
  parts.push(
    grid(cols + 1, 8, (i, j, vert) => {
      const phi = (i / cols) * Math.PI * 2;
      const t = j / 7;
      // rises 20 mm, then closes over the top
      const rise = [0, 0.004, 0.016, 0.02, 0.0225, 0.0238, 0.0245, 0.0248][j];
      const shrink = [1.06, 1.08, 1.08, 1.04, 0.86, 0.6, 0.3, 0.0][j];
      blockPoint(phi, 0.79, vert.p);
      vert.p.x *= shrink;
      vert.p.z *= shrink;
      vert.p.y = 0.787 + rise;
      vert.u = i / cols;
      vert.v = t;
    }),
  );
  const finial = new THREE.SphereGeometry(0.0105, 20, 14);
  finial.translate(0, 0.787 + 0.0248 + 0.012, 0);
  parts.push(finial);
  const stem = new THREE.CylinderGeometry(0.004, 0.006, 0.008, 12);
  stem.translate(0, 0.787 + 0.0248 + 0.003, 0);
  parts.push(stem);
  return mergeGeometries(parts.map((g) => g.toNonIndexed()))!.deleteAttribute("uv");
}

const STAND_FLOOR_Y = -0.86;
/** The form stops just inside the hem, so nothing shows beneath the jacket. */
const FORM_BOTTOM_Y = 0.012;

function buildStand() {
  const parts: THREE.BufferGeometry[] = [];
  const top = FORM_BOTTOM_Y;
  const pole = new THREE.CylinderGeometry(0.011, 0.011, top - STAND_FLOOR_Y, 20);
  pole.translate(0, (top + STAND_FLOOR_Y) / 2, 0);
  parts.push(pole);
  const foot = new THREE.CylinderGeometry(0.035, 0.17, 0.035, 48);
  foot.translate(0, STAND_FLOOR_Y + 0.0175, 0);
  parts.push(foot);
  return mergeGeometries(parts.map((g) => g.toNonIndexed()))!;
}

function buildFormBase() {
  // closes the underside of the form
  return grid(
    49,
    2,
    (i, j, vert) => {
      if (j === 0) vert.p.set(0, FORM_BOTTOM_Y, 0);
      else surface((i / 48) * Math.PI * 2, FORM_BOTTOM_Y, INSET, vert.p);
      vert.u = 0;
      vert.v = 0;
    },
  );
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

/** Parts that never change with the configuration. */
export interface StaticParts {
  sleeves: THREE.BufferGeometry;
  shirtCuffs: THREE.BufferGeometry;
  cuffEnds: THREE.BufferGeometry;
  shirt: THREE.BufferGeometry;
  shirtCollar: THREE.BufferGeometry;
  trousers: THREE.BufferGeometry;
  formBase: THREE.BufferGeometry;
  neck: THREE.BufferGeometry;
  neckCap: THREE.BufferGeometry;
  stand: THREE.BufferGeometry;
  button: THREE.BufferGeometry;
  cuffButtons: ButtonPlacement[];
}

let staticParts: StaticParts | null = null;

export function getStaticParts(): StaticParts {
  staticParts ??= {
    sleeves: buildSleeves(),
    shirtCuffs: buildShirtCuffs(),
    cuffEnds: buildCuffEnds(),
    shirt: buildBody(0.262, 0.742, INSET, 60),
    shirtCollar: buildShirtCollar(),
    trousers: buildBody(FORM_BOTTOM_Y, 0.262, INSET, 24),
    formBase: buildFormBase(),
    neck: buildBody(0.74, 0.79, INSET - 0.002, 6),
    neckCap: buildNeckCap(),
    stand: buildStand(),
    button: buildButtonGeometry(),
    cuffButtons: placeCuffButtons(),
  };
  return staticParts;
}

/** Parts that are re-cut when lapel, buttons or trim change. */
export interface CutParts {
  shell: THREE.BufferGeometry;
  lapels: THREE.BufferGeometry;
  collar: THREE.BufferGeometry;
  pockets: THREE.BufferGeometry;
  pocketSquare: THREE.BufferGeometry;
  neckwear: THREE.BufferGeometry | null;
  frontButtons: ButtonPlacement[];
}

export interface CutOptions {
  lapel: LapelId;
  buttons: ButtonsId;
  jetted: boolean;
  neckwear: Neckwear;
}

export function cutSuit(o: CutOptions): CutParts {
  const spec = FRONTS[o.buttons];
  const { geometry: lapels, plan } = buildLapels(o.lapel, spec);
  return {
    shell: buildShell(spec),
    lapels,
    collar: buildCollar(plan, spec),
    pockets: buildPockets(spec, o.jetted),
    pocketSquare: buildPocketSquare(spec),
    neckwear: buildNeckwear(o.neckwear, spec),
    frontButtons: placeFrontButtons(spec),
  };
}

export function disposeCut(parts: CutParts) {
  parts.shell.dispose();
  parts.lapels.dispose();
  parts.collar.dispose();
  parts.pockets.dispose();
  parts.pocketSquare.dispose();
  parts.neckwear?.dispose();
}

/** Vertical centre of the jacket, for framing. */
export const SUIT_CENTRE_Y = 0.39;
export const FLOOR_Y = STAND_FLOOR_Y;
