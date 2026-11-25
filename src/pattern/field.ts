/* Tone fields: for each point on the artboard, how large its dot is (0..1),
   or −1 where there is no dot at all (outside a disc, a cube, an image).
   Fields are drawn in their own space: centred on the pattern's anchor,
   turned by its rotation, one unit the pattern's scale times the artboard's
   shorter side. `t` (0..1) is the moment in the loop; every motion comes
   back to where it started at t = 1. */
import type { PatternSpec, ShapeKind } from './spec';

export type Field = (x: number, y: number) => number;

/** An image or figure read as tone: darkness 0..1, row by row. */
export interface ToneMap {
  w: number;
  h: number;
  data: Float32Array;
}

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (e0: number, e1: number, v: number) => {
  const k = clamp((v - e0) / (e1 - e0 || 1e-9));
  return k * k * (3 - 2 * k);
};

/** A repeatable random number 0..1 from integers. */
export function hash(a: number, b: number, c = 0): number {
  let h = (a * 374761393 + b * 668265263 + c * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Artboard point to the field's own space, and back. */
export interface Frame {
  unit: number;
  ax: number;
  ay: number;
  cos: number;
  sin: number;
  toLocal: (x: number, y: number) => [number, number];
  toArt: (u: number, v: number) => [number, number];
}

export function frameOf(spec: PatternSpec, W: number, H: number): Frame {
  const unit = Math.max(1e-6, spec.scale * Math.min(W, H));
  const ax = spec.x * W;
  const ay = spec.y * H;
  const cos = Math.cos(spec.rotate * DEG);
  const sin = Math.sin(spec.rotate * DEG);
  return {
    unit,
    ax,
    ay,
    cos,
    sin,
    toLocal: (x, y) => {
      const dx = (x - ax) / unit;
      const dy = (y - ay) / unit;
      return [dx * cos + dy * sin, -dx * sin + dy * cos];
    },
    toArt: (u, v) => [ax + (u * cos - v * sin) * unit, ay + (u * sin + v * cos) * unit],
  };
}

/** How the pattern moves at t: on when drift is up at all, gentler or fuller with it. */
const moving = (spec: PatternSpec) => spec.motion.drift > 0.001;

/* ---------- wave ---------- */

function waveField(spec: PatternSpec, W: number, H: number, t: number): Field {
  const f = frameOf(spec, W, H);
  const w = spec.wave;
  const phase = moving(spec) ? TAU * t : 0;
  const breathe = moving(spec) ? 1 + 0.2 * spec.motion.drift * Math.sin(TAU * t) : 1;
  const A = w.amplitude * breathe;
  const len = Math.max(0.05, w.length);
  const th = Math.max(0.01, w.thickness);
  const bands = Math.max(1, Math.round(w.bands));
  const seed = spec.seed;
  return (x, y) => {
    const [u, v] = f.toLocal(x, y);
    let tone = 0;
    for (let b = 0; b < bands; b++) {
      const off = (b - (bands - 1) / 2) * th * 3.2;
      const c = A * Math.sin((TAU * u) / len + phase + b * 0.7) + 0.18 * A * Math.sin((TAU * u) / (len * 0.53) + 2 * phase + seed) + off;
      const d = v - c;
      const core = Math.exp(-((d / th) ** 2));
      /* a haze of small dots on one side of the band */
      const halo = d < 0 ? w.spread * 0.42 * Math.exp(d / (th * 3.2)) : 0;
      tone = Math.max(tone, core, halo);
    }
    if (w.fade > 0) {
      const s = x / W;
      tone *= smooth(0, w.fade, s) * smooth(0, w.fade, 1 - s);
    }
    return tone;
  };
}

/* ---------- discs, shaded from one side ---------- */

interface Disc {
  cx: number;
  cy: number;
  r: number;
  /** the dark side faces this way */
  dx: number;
  dy: number;
}

export function discsOf(spec: PatternSpec, t: number): Disc[] {
  const d = spec.discs;
  const n = Math.max(1, Math.round(d.count));
  const R = Math.max(0.05, d.radius);
  const sway = moving(spec) ? 0.5 * spec.motion.drift * Math.sin(TAU * t) : 0;
  const out: Disc[] = [];
  const dir = (a: number) => ({ dx: Math.cos(a), dy: Math.sin(a) });
  switch (d.layout) {
    case 'petals': {
      /* round a centre, each dark on the side facing it, turned a little like a pinwheel */
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (TAU * i) / n;
        const cx = Math.cos(a) * R * 1.5;
        const cy = Math.sin(a) * R * 1.5;
        out.push({ cx, cy, r: R, ...dir(a + Math.PI + 0.45 + sway) });
      }
      break;
    }
    case 'pair':
      out.push({ cx: -R * 0.9, cy: 0, r: R, ...dir(0.35 + sway) }, { cx: R * 0.9, cy: 0, r: R, ...dir(Math.PI + 0.35 + sway) });
      break;
    case 'row':
      for (let i = 0; i < n; i++) out.push({ cx: (i - (n - 1) / 2) * R * 2.1, cy: 0, r: R, ...dir(Math.PI / 2 + sway + i * 0.15) });
      break;
    default:
      for (let i = 0; i < n; i++) {
        const h1 = hash(i, 1, spec.seed);
        const h2 = hash(i, 2, spec.seed);
        const h3 = hash(i, 3, spec.seed);
        out.push({ cx: (h1 - 0.5) * 1.6, cy: (h2 - 0.5) * 1.1, r: R * (0.55 + 0.6 * h3), ...dir(h3 * TAU + sway) });
      }
  }
  return out;
}

function discsField(spec: PatternSpec, W: number, H: number, t: number): Field {
  const f = frameOf(spec, W, H);
  const discs = discsOf(spec, t);
  return (x, y) => {
    const [u, v] = f.toLocal(x, y);
    let tone = -1;
    for (const d of discs) {
      const px = u - d.cx;
      const py = v - d.cy;
      if (px * px + py * py > d.r * d.r) continue;
      const k = (px * d.dx + py * d.dy) / d.r;
      tone = Math.max(tone, clamp((k + 1) / 2) ** 1.15);
    }
    return tone;
  };
}

/* ---------- rings and blobs ---------- */

function ringsField(spec: PatternSpec, W: number, H: number, t: number): Field {
  const f = frameOf(spec, W, H);
  const r = spec.rings;
  const n = Math.max(1, Math.round(r.blobs));
  const sway = moving(spec) ? 0.6 * spec.motion.drift * Math.sin(TAU * t) : 0;
  const size = Math.max(0.03, r.size);
  const blobs = Array.from({ length: n }, (_, i) => {
    const a = -Math.PI * 0.8 + (TAU * i) / n + (hash(i, 7, spec.seed) - 0.5) * 0.6 + sway;
    const dist = n === 1 ? 0 : size * (1.05 + 0.3 * hash(i, 8, spec.seed));
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, s: size * (0.85 + 0.35 * hash(i, 9, spec.seed)) };
  });
  const reach = Math.max(0.1, r.reach);
  return (x, y) => {
    const [u, v] = f.toLocal(x, y);
    let blob = 0;
    for (const b of blobs) blob = Math.max(blob, Math.exp(-((u - b.x) ** 2 + (v - b.y) ** 2) / (b.s * b.s)));
    const env = 1 - smooth(reach * 0.55, reach, Math.hypot(u, v));
    return (0.1 + 0.9 * blob) * env;
  };
}

/* ---------- solids: a dotted cube, stack, steps, cylinder or sphere (2:1 isometric) ---------- */

/* the brand's 2:1 isometric: both ground axes leave the screen at a 2:1 slope */
const IC = Math.cos(Math.atan(0.5));
const IS = Math.sin(Math.atan(0.5));

interface Box {
  x0: number;
  y0: number;
  z0: number;
  lx: number;
  ly: number;
  lz: number;
}

const boxesOf = (kind: ShapeKind): Box[] => {
  switch (kind) {
    case 'stack': {
      /* three slabs with a gap between them */
      const h = 0.28;
      const g = 0.08;
      return [0, 1, 2].map(i => ({ x0: 0, y0: i * (h + g), z0: 0, lx: 1, ly: h, lz: 1 }));
    }
    case 'steps':
      return [0, 1, 2].map(i => ({ x0: i * 0.62, y0: 0, z0: -i * 0.62, lx: 0.6, ly: 0.45 + i * 0.45, lz: 0.6 }));
    default:
      return [{ x0: 0, y0: 0, z0: 0, lx: 1, ly: 1, lz: 1 }];
  }
};

/** Screen bounds of world points under the 2:1 view (X right, Y down). */
const project = (x: number, y: number, z: number): [number, number] => [(x - z) * IC, (x + z) * IS - y];

function solidField(spec: PatternSpec, W: number, H: number, t: number): Field {
  const f = frameOf(spec, W, H);
  const s = spec.solid;
  const depth = clamp(s.depth, 0, 1);
  const lightLeft = s.light === 'left';
  /* a soft band of light passes across while it moves */
  const sweep = moving(spec) ? { at: -1.6 + 3.2 * t, k: 0.45 * spec.motion.drift } : null;
  const lit = (u: number, v: number, tone: number) => {
    if (!sweep) return tone;
    const d = (u + v) * 0.7 - sweep.at;
    return tone * (1 - sweep.k * Math.exp(-((d / 0.28) ** 2)));
  };

  if (s.kind === 'sphere') {
    const R = 0.5;
    const L = lightLeft ? [-0.55, -0.62, 0.56] : [0.55, -0.62, 0.56];
    const ll = Math.hypot(L[0]!, L[1]!, L[2]!);
    return (x, y) => {
      const [u, v] = f.toLocal(x, y);
      const r2 = (u * u + v * v) / (R * R);
      if (r2 > 1) return -1;
      const nz = Math.sqrt(1 - r2);
      const lam = Math.max(0, ((u / R) * L[0]! + (v / R) * L[1]! + nz * L[2]!) / ll);
      return lit(u, v, clamp(0.1 + 0.88 * (1 - lam) ** (1 + depth)));
    };
  }

  if (s.kind === 'cylinder') {
    const R = 0.42;
    const h = 0.62;
    const rx = R * Math.SQRT2 * IC;
    const ry = R * Math.SQRT2 * IS;
    /* centre the drawing on the anchor */
    const oy = (h + 2 * ry) / 2 - ry;
    return (x, y) => {
      const [u, vv] = f.toLocal(x, y);
      const v = vv - oy;
      if (Math.abs(u) > rx) return -1;
      const e = ry * Math.sqrt(Math.max(0, 1 - (u / rx) ** 2));
      const topY = -h;
      if (v >= topY - e && v <= topY + e) {
        /* the top */
        const q = (v - (topY - e)) / (2 * ry);
        return lit(u, vv, clamp(0.18 + depth * 0.3 * q));
      }
      if (v > topY + e && v <= e) {
        const side = (u / rx + 1) / 2;
        const shade = lightLeft ? side : 1 - side;
        const q = (v - (topY + e)) / Math.max(1e-6, h);
        return lit(u, vv, clamp(0.4 + 0.5 * shade + depth * 0.25 * (q - 0.5)));
      }
      return -1;
    };
  }

  /* boxes: find the box's visible faces, front to back */
  const boxes = boxesOf(s.kind);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const b of boxes)
    for (const cx of [b.x0, b.x0 + b.lx])
      for (const cy of [b.y0, b.y0 + b.ly])
        for (const cz of [b.z0, b.z0 + b.lz]) {
          const [X, Y] = project(cx, cy, cz);
          minX = Math.min(minX, X);
          maxX = Math.max(maxX, X);
          minY = Math.min(minY, Y);
          maxY = Math.max(maxY, Y);
        }
  /* scale the drawing to one unit tall, centred */
  const k = 1 / Math.max(1e-6, maxY - minY);
  const mx = (minX + maxX) / 2;
  const my = (minY + maxY) / 2;
  const order = boxes.slice().sort((a, b) => b.x0 + b.lx + b.z0 + b.lz + 0.5 * (b.y0 + b.ly) - (a.x0 + a.lx + a.z0 + a.lz + 0.5 * (a.y0 + a.ly)));
  const tTop = 0.16;
  const tLight = 0.5;
  const tDark = 0.86;
  return (x, y) => {
    const [u, v] = f.toLocal(x, y);
    const X = u / k + mx;
    const Y = v / k + my;
    for (const b of order) {
      const x1 = b.x0 + b.lx;
      const y1 = b.y0 + b.ly;
      const z1 = b.z0 + b.lz;
      /* top: y = y1 */
      {
        const a = X / IC;
        const c = (Y + y1) / IS;
        const wx = (a + c) / 2;
        const wz = (c - a) / 2;
        if (wx >= b.x0 && wx <= x1 && wz >= b.z0 && wz <= z1) {
          const q = (wx - b.x0) / b.lx / 2 + (wz - b.z0) / b.lz / 2;
          return lit(u, v, clamp(tTop + depth * 0.28 * q));
        }
      }
      /* right face: x = x1 */
      {
        const wz = x1 - X / IC;
        const wy = (x1 + wz) * IS - Y;
        if (wz >= b.z0 && wz <= z1 && wy >= b.y0 && wy <= y1) {
          const q = 1 - (wy - b.y0) / b.ly;
          return lit(u, v, clamp((lightLeft ? tDark : tLight) + depth * 0.22 * (q - 0.5)));
        }
      }
      /* left face: z = z1 */
      {
        const wx = X / IC + z1;
        const wy = (wx + z1) * IS - Y;
        if (wx >= b.x0 && wx <= x1 && wy >= b.y0 && wy <= y1) {
          const q = 1 - (wy - b.y0) / b.ly;
          return lit(u, v, clamp((lightLeft ? tLight : tDark) + depth * 0.22 * (q - 0.5)));
        }
      }
    }
    return -1;
  };
}

/* ---------- an image or figure, read as tone ---------- */

/** Where a tone map sits: centred on the anchor, covering the artboard at scale 1. */
export function toneRect(spec: PatternSpec, map: ToneMap, W: number, H: number) {
  const k = Math.max(W / map.w, H / map.h) * spec.scale;
  const w = map.w * k;
  const h = map.h * k;
  return { x: spec.x * W - w / 2, y: spec.y * H - h / 2, w, h };
}

function toneField(spec: PatternSpec, map: ToneMap | null, W: number, H: number): Field {
  if (!map) return () => -1;
  const r = toneRect(spec, map, W, H);
  const at = (i: number, j: number) => map.data[Math.min(map.h - 1, Math.max(0, j)) * map.w + Math.min(map.w - 1, Math.max(0, i))]!;
  return (x, y) => {
    const fx = ((x - r.x) / r.w) * map.w - 0.5;
    const fy = ((y - r.y) / r.h) * map.h - 0.5;
    if (fx < -0.5 || fy < -0.5 || fx > map.w - 0.5 || fy > map.h - 0.5) return -1;
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const a = fx - i;
    const b = fy - j;
    const v = (at(i, j) * (1 - a) + at(i + 1, j) * a) * (1 - b) + (at(i, j + 1) * (1 - a) + at(i + 1, j + 1) * a) * b;
    return v < 0 ? -1 : spec.invert ? 1 - v : v;
  };
}

/** The pattern's tone field at moment t. Ribbons are not fields (their dots follow the ribbon): they get none. */
export function fieldOf(spec: PatternSpec, W: number, H: number, t = 0, map: ToneMap | null = null): Field {
  switch (spec.kind) {
    case 'wave':
      return waveField(spec, W, H, t);
    case 'discs':
      return discsField(spec, W, H, t);
    case 'rings':
      return ringsField(spec, W, H, t);
    case 'shape':
      return solidField(spec, W, H, t);
    case 'image':
    case 'figure':
      return toneField(spec, map, W, H);
    default:
      return () => -1;
  }
}
