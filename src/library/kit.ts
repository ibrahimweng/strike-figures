/* The kit every library illustration is built with. It holds the house
   rules, so that fifty figures by one hand look like one set:

   1. Camera: Linear's 2:1 (yaw 45°, pitch 30°), on a 320 × 320 artboard,
      fitted with a 14% margin.
   2. Faces are the background colour; the drawing is lines and dots.
   3. Lines are 0.5 wide. The subject is outlined in #D0D6E0, things that
      support it in #62666D, and things in the background in #3E3E44.
      Creases are #3E3E44 (#2E2E32 on background things), trimmed short.
   4. Corners: the side corners nearly sharp, the front and back ones
      softly rounded, as Linear draws them.
   5. Dots: emerald for the one thing that matters, grey for the rest.
      Halftones for amount, curves for data. One emerald focus per figure.
   6. Labels: Geist Mono, small, grey, three at most, never on the focus.
   7. Floating things get a soft shadow and dotted guides down. */
import { renderScene } from '../engine/render';
import type { ShapeSpec } from '../engine/shapes';
import { defaultDots, defaultGradient, defaultTheme, LINEAR, newObject, STRIKE, uid } from '../model/defaults';
import type { DotFill, Gradient, Label, Scene, SceneObject } from '../model/types';
import { fitCamera } from '../ui/view';

export const C = {
  line: LINEAR.line,
  mid: LINEAR.mid,
  dim: LINEAR.dim,
  faint: LINEAR.faint,
  grey: LINEAR.dot,
  emerald: STRIKE.emerald500,
  bright: STRIKE.emerald400,
  pale: STRIKE.emerald300,
  deep: STRIKE.emerald600,
};

export type Tier = 'subject' | 'support' | 'ghost';
export type V = [number, number, number];

interface Opts {
  tier?: Tier;
  /** corner rounding for boxes: [back, right, front, left] or one radius */
  round?: number;
  shadow?: number;
  guides?: boolean;
  rot?: V;
  name?: string;
  trim?: number;
  /** walls only: turn the wall round the vertical, degrees */
  yaw?: number;
}

function style(o: SceneObject, opts: Opts) {
  const tier = opts.tier ?? 'subject';
  o.style.outline = tier === 'subject' ? C.line : tier === 'support' ? C.mid : C.dim;
  o.style.crease = tier === 'ghost' ? C.faint : C.dim;
  if (opts.trim !== undefined) o.style.creaseTrim = opts.trim;
  if (opts.shadow) o.shadow = { enabled: true, blur: opts.shadow, dx: 0, dy: Math.min(4, opts.shadow / 2), opacity: 0.7 };
  if (opts.guides) o.guides = true;
  if (opts.rot) o.rotation = opts.rot;
  return o;
}

/** Linear's corners: sides nearly sharp, front and back softly rounded. */
const linearCorners = (r: number): [number, number, number, number] => [r, Math.min(0.5, r), r * 1.3, Math.min(0.5, r)];

export function box(w: number, d: number, h: number, at: V, opts: Opts = {}): SceneObject {
  const r = opts.round ?? Math.min(4, Math.min(w, d) * 0.08);
  const shape: ShapeSpec = { kind: 'box', width: w, depth: d, radius: r, corners: linearCorners(r) };
  return style(newObject(shape, h, opts.name ?? 'Box', at), opts);
}

export function cyl(r: number, h: number, at: V, opts: Opts = {}): SceneObject {
  return style(newObject({ kind: 'cylinder', radius: r }, h, opts.name ?? 'Cylinder', at), opts);
}

export function sector(r: number, start: number, sweep: number, h: number, at: V, opts: Opts = {}): SceneObject {
  return style(newObject({ kind: 'sector', radius: r, start, sweep }, h, opts.name ?? 'Slice', at), opts);
}

export function poly(sides: number, r: number, h: number, at: V, opts: Opts = {}): SceneObject {
  return style(newObject({ kind: 'polygon', sides, radius: r, corner: opts.round ?? 2 }, h, opts.name ?? 'Prism', at), opts);
}

/** A flat plan shape pushed up (points in x, z). */
export function shape(points: [number, number][], h: number, at: V, opts: Opts = {}): SceneObject {
  return style(newObject({ kind: 'outline', points, radius: opts.round ?? 1.5 }, h, opts.name ?? 'Shape', at), opts);
}

/**
 * A standing wall whose face is a profile drawn in x (right) and y (up),
 * `thick` deep, its face toward +Z. Its visible face is the object's
 * "bottom" face, with y running up it, so masks and gradients read as drawn.
 */
export function wall(profile: [number, number][], thick: number, at: V, opts: Opts = {}): SceneObject {
  const o = newObject({ kind: 'outline', points: profile.map(([x, y]) => [x, y]), radius: opts.round ?? 1 }, thick, opts.name ?? 'Wall', [
    at[0],
    at[1],
    at[2] + thick / 2,
  ]);
  o.rotation = [-90, opts.yaw ?? 0, 0];
  return style(o, { ...opts, rot: undefined });
}

/** The face a wall shows to the camera. */
export const front = (o: SceneObject) => o.faces.bottom;

export function chevron(w: number, d: number, h: number, at: V, opts: Opts = {}): SceneObject {
  return style(newObject({ kind: 'chevron', width: w, depth: d }, h, opts.name ?? 'Chevron', at), opts);
}

/* ---- dots ---- */

interface DotOpts {
  color?: string;
  spacing?: number;
  size?: number;
  min?: number;
  opacity?: number;
  opacityMin?: number;
  inset?: number;
  stagger?: boolean;
  square?: boolean;
  gradient?: Partial<Gradient>;
  region?: DotFill['region'];
  mask?: { mode: 'below' | 'above'; points: [number, number][]; alt?: string | null; altOpacity?: number };
  angle?: number;
}

export function dots(o: DotOpts = {}): DotFill {
  const d = defaultDots(o.color ?? C.emerald);
  d.spacing = o.spacing ?? 3.5;
  d.size = o.size ?? 0.85;
  d.sizeMin = o.min ?? 0.12;
  d.opacity = o.opacity ?? 1;
  d.opacityMin = o.opacityMin ?? 0.15;
  d.inset = o.inset ?? 2.5;
  d.pattern = o.stagger ? 'stagger' : 'grid';
  d.shape = o.square ? 'square' : 'circle';
  d.angle = o.angle ?? 0;
  d.region = o.region ?? null;
  d.gradient = { ...defaultGradient(), ...(o.gradient ?? {}) };
  if (o.gradient && !o.gradient.affects) d.gradient.affects = 'both';
  d.mask = o.mask ? { mode: o.mask.mode, points: o.mask.points, altColor: o.mask.alt ?? null, altOpacity: o.mask.altOpacity ?? 0.3 } : null;
  return d;
}

/** Neutral dots: the grey Linear uses, faint. */
export const greyDots = (o: DotOpts = {}) => dots({ color: C.grey, opacity: 0.28, ...o });

export function onTop(o: SceneObject, d: DotFill) {
  o.faces.top.dots = d;
  return o;
}

export function onSides(o: SceneObject, d: DotFill, key = 'all') {
  o.faces.sides[key] = { fill: null, dots: d };
  return o;
}

export function onFront(o: SceneObject, d: DotFill) {
  front(o).dots = d;
  return o;
}

/** A curve for a top face, read with x along +X and "up" towards the back (−Z), as it looks on screen. */
export const topCurve = (points: [number, number][]): { mode: 'above'; points: [number, number][] } => ({
  mode: 'above',
  points: points.map(([x, y]) => [x, 1 - y]),
});

/** A thin beam between two ground points, at height y. */
export function beam(a: [number, number], b: [number, number], y: number, thick: number, opts: Opts = {}): SceneObject {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const L = Math.hypot(dx, dz);
  const o = box(L, thick, thick, [(a[0] + b[0]) / 2, y, (a[1] + b[1]) / 2], { round: 0.5, ...opts, name: opts.name ?? 'Beam' });
  o.rotation = [0, (Math.atan2(-dz, dx) * 180) / Math.PI, 0];
  return o;
}

/** An arrow pointing along +X, as a plan outline. */
export const arrowPoints = (len: number, shaft: number, head: number, headLen: number): [number, number][] => [
  [-len / 2, -shaft / 2],
  [len / 2 - headLen, -shaft / 2],
  [len / 2 - headLen, -head / 2],
  [len / 2, 0],
  [len / 2 - headLen, head / 2],
  [len / 2 - headLen, shaft / 2],
  [-len / 2, shaft / 2],
];

/** A gear's outline: teeth round a disc. */
export function gearPoints(teeth: number, outer: number, inner: number): [number, number][] {
  const pts: [number, number][] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    for (const [f, r] of [
      [0, inner],
      [0.18, outer],
      [0.5, outer],
      [0.68, inner],
    ] as const) {
      const t = a + f * step;
      pts.push([Math.cos(t) * r, Math.sin(t) * r]);
    }
  }
  return pts;
}

/* ---- labels ---- */

export function label(text: string, at: V, opts: Partial<Omit<Label, 'id' | 'text' | 'position'>> = {}): Label {
  return { id: uid(), text, position: at, plane: 'screen', size: 4.2, color: null, opacity: 1, align: 'middle', rotation: 0, ...opts };
}

/* ---- the figure ---- */

export function figure(name: string, objects: SceneObject[], labels: Label[] = [], o: { margin?: number; yaw?: number; pitch?: number } = {}): Scene {
  const sc: Scene = {
    id: uid(),
    name,
    label: '',
    artboard: { width: 320, height: 320 },
    camera: { yaw: o.yaw ?? 45, pitch: o.pitch ?? 30, zoom: 1, panX: 0, panY: 0 },
    theme: defaultTheme(),
    objects,
    labels,
    preset: null,
  };
  const cam = fitCamera(sc, renderScene(sc), o.margin ?? 0.14);
  if (cam) sc.camera = cam;
  return sc;
}

/* ---- data helpers ---- */

/** A smooth bump, 0..1. */
export const bell = (x: number, mu = 0.5, s = 0.18) => Math.exp(-((x - mu) ** 2) / (2 * s * s));

/** Points of a function on 0..1, for masks and walls. */
export const sample = (f: (x: number) => number, n = 24): [number, number][] => Array.from({ length: n + 1 }, (_, i) => [i / n, f(i / n)]);

/** A seeded random, so every figure draws the same each time. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
