/* Dotted fills: dots laid flat on a face, either an even grid or a halftone
   whose dots grow, shrink or fade with a gradient. Each dot is a circle on
   the face, so on screen it is the ellipse the face's tilt makes of it. */
import type { DotFill, DotMask, Gradient } from '../model/types';
import { type P2, DEG, TAU, clamp, lerp } from './math';

/** A dot on the artboard: centre and two conjugate half-axes. */
export interface Dot {
  c: P2;
  a: P2;
  b: P2;
}

export interface DotGroup {
  color: string;
  opacity: number;
  shape: 'circle' | 'square';
  dots: Dot[];
}

/** A face, seen as a flat (u, v) sheet in world units. */
export interface FaceFrame {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
  /** 0..1 across the face, for gradients and regions */
  nu: (u: number) => number;
  nv: (v: number) => number;
  /** is (u, v) on the face, at least `inset` from its edges? */
  inside: (u: number, v: number, inset: number) => boolean;
  /** where (u, v) lands, and the screen vectors of one world unit along u and v there; null when that spot faces away */
  map: (u: number, v: number) => { c: P2; U: P2; V: P2 } | null;
}

const MAX_DOTS = 24000;

function hash(i: number, j: number, seed: number) {
  let h = (i * 374761393 + j * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}

/** The gradient's value at a point on the face, 0..1. */
export function gradientValue(g: Gradient, x: number, y: number): number {
  let v = 1;
  const ca = Math.cos(g.angle * DEG);
  const sa = Math.sin(g.angle * DEG);
  const s = (x - 0.5) * ca + (y - 0.5) * sa + 0.5;
  const t = -(x - 0.5) * sa + (y - 0.5) * ca + 0.5;
  switch (g.type) {
    case 'none':
      v = 1;
      break;
    case 'linear': {
      const span = g.end - g.start;
      v = Math.abs(span) < 1e-6 ? (s >= g.start ? 1 : 0) : clamp((s - g.start) / span);
      break;
    }
    case 'radial': {
      const d = Math.hypot(x - g.cx, y - g.cy) / Math.max(1e-6, g.radius);
      v = 1 - clamp(d);
      break;
    }
    case 'wave':
      v = 0.5 + 0.5 * Math.sin(TAU * (g.frequency * s + g.phase) + 1.2 * Math.sin(TAU * g.frequency * 0.5 * t));
      break;
    case 'noise': {
      const f = Math.max(0.1, g.frequency);
      const n = valueNoise(x * f, y * f, g.seed) * 0.65 + valueNoise(x * f * 2.1, y * f * 2.1, g.seed + 7) * 0.35;
      v = clamp((n - 0.2) / 0.6);
      break;
    }
  }
  return g.invert ? 1 - v : v;
}

/** The height of a mask's curve at x, straight between its points. */
export function curveY(points: [number, number][], x: number): number {
  if (!points.length) return 0.5;
  const pts = points.slice().sort((a, b) => a[0] - b[0]);
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x0, y0] = pts[i - 1]!;
    if (x <= x1) return x1 - x0 < 1e-12 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1]![1];
}

const onSide = (m: DotMask, x: number, y: number) => {
  const c = curveY(m.points, x);
  return m.mode === 'below' ? y <= c + 1e-9 : y >= c - 1e-9;
};

/** The dots a fill puts on one face. */
export function faceDots(fill: DotFill, frame: FaceFrame, color: string): DotGroup[] {
  if (!fill.enabled || fill.spacing <= 0) return [];
  const s = fill.spacing;
  const reg = fill.region;
  /* the part of the face being filled, in (u, v) */
  const toU = (n: number) => frame.uMin + n * (frame.uMax - frame.uMin);
  const toV = (n: number) => frame.vMin + n * (frame.vMax - frame.vMin);
  const u0 = reg ? toU(reg.x - reg.w / 2) : frame.uMin;
  const u1 = reg ? toU(reg.x + reg.w / 2) : frame.uMax;
  const v0 = reg ? toV(reg.y - reg.h / 2) : frame.vMin;
  const v1 = reg ? toV(reg.y + reg.h / 2) : frame.vMax;
  const cu = (u0 + u1) / 2;
  const cv = (v0 + v1) / 2;
  const ca = Math.cos(fill.angle * DEG);
  const sa = Math.sin(fill.angle * DEG);
  /* how far the grid must reach, in its own turned axes */
  const corners = [
    [u0, v0],
    [u1, v0],
    [u0, v1],
    [u1, v1],
  ].map(([u, v]) => {
    const du = u! - cu;
    const dv = v! - cv;
    return [du * ca + dv * sa, -du * sa + dv * ca] as const;
  });
  const iMax = Math.ceil(Math.max(...corners.map(c => Math.abs(c[0]))) / s) + 1;
  const jMax = Math.ceil(Math.max(...corners.map(c => Math.abs(c[1]))) / s) + 1;
  if ((2 * iMax + 1) * (2 * jMax + 1) > MAX_DOTS * 4) return [];
  const buckets = new Map<string, Dot[]>();
  const mask = fill.mask && fill.mask.points.length ? fill.mask : null;
  let count = 0;
  const sizeBy = fill.gradient.type !== 'none' && fill.gradient.affects !== 'opacity';
  const fadeBy = fill.gradient.type !== 'none' && fill.gradient.affects !== 'size';
  for (let j = -jMax; j <= jMax; j++) {
    const shift = fill.pattern === 'stagger' && j % 2 !== 0 ? 0.5 : 0;
    for (let i = -iMax; i <= iMax; i++) {
      const gx = (i + shift) * s;
      const gy = j * s;
      const u = cu + gx * ca - gy * sa;
      const v = cv + gx * sa + gy * ca;
      if (u < u0 - 1e-9 || u > u1 + 1e-9 || v < v0 - 1e-9 || v > v1 + 1e-9) continue;
      if (!frame.inside(u, v, fill.inset)) continue;
      const nu = frame.nu(u);
      const nv = frame.nv(v);
      const g = gradientValue(fill.gradient, nu, nv);
      const r = sizeBy ? lerp(fill.sizeMin, fill.size, g) : fill.size;
      let o = fadeBy ? lerp(fill.opacityMin, fill.opacity, g) : fill.opacity;
      let col = color;
      if (mask && !onSide(mask, nu, nv)) {
        if (!mask.altColor) continue;
        col = mask.altColor;
        o *= mask.altOpacity;
      }
      if (r < 0.02 || o < 0.01) continue;
      const m = frame.map(u, v);
      if (!m) continue;
      let a: P2 = { x: m.U.x * r, y: m.U.y * r };
      let b: P2 = { x: m.V.x * r, y: m.V.y * r };
      if (fill.shape === 'square') {
        a = { x: (m.U.x * ca + m.V.x * sa) * r, y: (m.U.y * ca + m.V.y * sa) * r };
        b = { x: (-m.U.x * sa + m.V.x * ca) * r, y: (-m.U.y * sa + m.V.y * ca) * r };
      }
      const key = `${col}|${Math.round(clamp(o) * 20)}`;
      let list = buckets.get(key);
      if (!list) buckets.set(key, (list = []));
      list.push({ c: m.c, a, b });
      if (++count >= MAX_DOTS) break;
    }
    if (count >= MAX_DOTS) break;
  }
  return [...buckets.entries()]
    .map(([k, dots]) => {
      const [c, q] = k.split('|');
      return { color: c!, opacity: Number(q) / 20, shape: fill.shape, dots };
    })
    .sort((x, y) => (x.color === y.color ? x.opacity - y.opacity : x.color === color ? 1 : -1));
}
