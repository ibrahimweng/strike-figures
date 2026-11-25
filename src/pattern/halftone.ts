/* The dots: a screen laid over the artboard (a square grid, a staggered one,
   or concentric rings round the pattern's centre), each point sized by the
   tone under it. Ribbons lay their own dots along the ribbon. The glitch
   flickers a few dots at a time; the drift lives in the fields. */
import { type Field, fieldOf, frameOf, hash, type ToneMap } from './field';
import type { PatternSpec } from './spec';

export interface Dot {
  x: number;
  y: number;
  /** radius, and the second radius and turn of an ellipse (ribbons) */
  r: number;
  ry: number;
  rot: number;
  /** opacity 0..1, before the pattern's own */
  a: number;
  /** the tone that sized it, 0..1 */
  tone: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DotOptions {
  /** an image or figure, read as tone */
  map?: ToneMap | null;
  /** keep these clear: dots shrink inside them and fade back in over `pad` px */
  clear?: { rects: Rect[]; amount: number; pad: number } | null;
}

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
export const MAX_DOTS = 90000;
const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (e0: number, e1: number, v: number) => {
  const k = clamp((v - e0) / (e1 - e0 || 1e-9));
  return k * k * (3 - 2 * k);
};

/** How many times the glitch changes over one loop: about four times a second. */
export const glitchSteps = (spec: PatternSpec) => Math.max(4, Math.round(spec.motion.seconds * 4));

/** A dot's opacity at moment t: most hold still, a few flicker. Repeats exactly every loop. */
export function glitchAlpha(spec: PatternSpec, i: number, j: number, t: number): number {
  const g = spec.motion.glitch;
  if (g <= 0.001) return 1;
  const steps = glitchSteps(spec);
  const s = ((Math.floor(t * steps) % steps) + steps) % steps;
  if (hash(i, j, s * 31 + spec.seed) >= g * 0.3) return 1;
  return 0.12 + 0.6 * hash(j, i, s * 17 + 5);
}

/** The curve from tone to dot size: contrast pushes tones apart; density makes every dot larger or smaller. */
export function curve(spec: PatternSpec, tone: number): number {
  const c = clamp(spec.contrast, -0.5, 1);
  let v = clamp((tone - 0.5) * (1 + 1.5 * c) + 0.5);
  const gamma = 2 ** (-clamp(spec.density, -1, 1) * 1.2);
  v = v ** gamma;
  return v;
}

function clearMask(clear: DotOptions['clear']): ((x: number, y: number) => number) | null {
  if (!clear || clear.amount <= 0 || !clear.rects.length) return null;
  const { rects, amount, pad } = clear;
  return (x, y) => {
    let m = 0;
    for (const r of rects) {
      const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
      const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
      const d = Math.hypot(dx, dy);
      m = Math.max(m, 1 - smooth(0, pad, d));
      if (m >= 1) break;
    }
    return 1 - amount * m;
  };
}

/** Every dot of the pattern on a W×H artboard at moment t. */
export function patternDots(spec: PatternSpec, W: number, H: number, t = 0, opts: DotOptions = {}): Dot[] {
  const s = Math.max(4, spec.spacing);
  const rMax = (clamp(spec.dot, 0.05, 1.4) * s) / 2;
  const floor = clamp(spec.floor, 0, 1);
  const mask = clearMask(opts.clear);
  const out: Dot[] = [];
  const push = (x: number, y: number, tone: number, i: number, j: number, ry = 1, rot = 0) => {
    if (tone < 0) return;
    let tn = tone;
    if (mask) tn *= mask(x, y);
    const v = curve(spec, tn);
    if (v <= 0.002 && floor <= 0) return;
    const r = rMax * (floor + (1 - floor) * v);
    if (r < 0.35) return;
    const a = glitchAlpha(spec, i, j, t);
    out.push({ x, y, r, ry: r * ry, rot, a, tone: v });
  };

  if (spec.kind === 'ribbon') {
    ribbonDots(spec, W, H, t, s, push);
    return out;
  }

  const field: Field = fieldOf(spec, W, H, t, opts.map ?? null);
  /* pictures hold still, so their screen drifts instead: one cell per loop, which lands back on the same grid */
  const shift = (spec.kind === 'image' || spec.kind === 'figure') && spec.motion.drift > 0.001 ? t * s : 0;

  if (spec.screen === 'rings') {
    const cx = spec.x * W;
    const cy = spec.y * H;
    const far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) + s;
    push(cx, cy, field(cx, cy), 0, 0);
    for (let k = 1; k * s <= far && out.length < MAX_DOTS; k++) {
      const r = k * s + (shift % s);
      const n = Math.max(6, Math.round((TAU * r) / s));
      for (let m = 0; m < n; m++) {
        const a = (TAU * m) / n;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (x < -s || y < -s || x > W + s || y > H + s) continue;
        push(x, y, field(x, y), k, m);
      }
    }
    return out;
  }

  const a = spec.angle * DEG;
  const e1 = [Math.cos(a), Math.sin(a)] as const;
  const e2 = [-Math.sin(a), Math.cos(a)] as const;
  const stag = spec.screen === 'stagger';
  const rowStep = stag ? s * 0.8660254 : s;
  const n = Math.ceil(Math.hypot(W, H) / 2 / Math.min(s, rowStep)) + 2;
  const ox = W / 2 + shift * (e1[0] + e2[0]);
  const oy = H / 2 + shift * (e1[1] + e2[1]);
  for (let j = -n; j <= n; j++) {
    const half = stag && j % 2 !== 0 ? 0.5 : 0;
    for (let i = -n; i <= n; i++) {
      const gx = (i + half) * s;
      const gy = j * rowStep;
      const x = ox + gx * e1[0] + gy * e2[0];
      const y = oy + gx * e1[1] + gy * e2[1];
      if (x < -s || y < -s || x > W + s || y > H + s) continue;
      push(x, y, field(x, y), i, j);
    }
    if (out.length >= MAX_DOTS) break;
  }
  return out;
}

/* A ribbon: a centre line that waves, and a width that turns about it, so where it twists edge-on its dots crowd and shrink. */
function ribbonDots(spec: PatternSpec, W: number, H: number, t: number, s: number, push: (x: number, y: number, tone: number, i: number, j: number, ry?: number, rot?: number) => void) {
  const f = frameOf(spec, W, H);
  const rb = spec.ribbon;
  const moving = spec.motion.drift > 0.001;
  const phase = moving ? TAU * t : 0;
  const len = Math.max(0.2, rb.length);
  const lam = len / 1.25;
  const A = rb.amplitude;
  const half = Math.max(0.02, rb.width) / 2;
  const rows = Math.max(3, Math.round((2 * half * f.unit) / s));
  const centre = (u: number) => A * Math.sin((TAU * u) / lam + phase + spec.seed);
  const slope = (u: number) => ((A * TAU) / lam) * Math.cos((TAU * u) / lam + phase + spec.seed);
  const twist = (u: number) => Math.PI * rb.twists * (u / len) + phase;
  let u = -len / 2;
  let step = 0;
  while (u <= len / 2 && step < 4000) {
    const m = slope(u);
    const tl = Math.hypot(1, m);
    const tx = 1 / tl;
    const ty = m / tl;
    /* the normal, in the field's space */
    const nx = -ty;
    const ny = tx;
    const th = twist(u);
    const facing = Math.cos(th);
    const ends = Math.min(1, (u + len / 2) / (len * 0.08), (len / 2 - u) / (len * 0.08));
    const rot = Math.atan2(f.sin * tx + f.cos * ty, f.cos * tx - f.sin * ty);
    for (let r = 0; r < rows; r++) {
      const v = -1 + (2 * (r + 0.5)) / rows;
      const off = v * half * facing;
      const [x, y] = f.toArt(u + nx * off, centre(u) + ny * off);
      if (x < -s || y < -s || x > W + s || y > H + s) continue;
      const tone = (0.22 + 0.78 * Math.abs(facing)) * (1 - 0.25 * v * v) * (facing >= 0 ? 1 : 0.78) * Math.max(0, ends);
      push(x, y, tone, step, r, Math.max(0.35, Math.abs(facing)), rot);
    }
    /* about one spacing along the line, on the artboard */
    u += s / (f.unit * tl);
    step++;
  }
}
