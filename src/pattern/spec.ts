/* Halftone patterns: fields of dots that grow and shrink to draw a wave, a
   twisted ribbon, discs, rings, a dotted cube or an image. They sit behind
   posts and posters that look empty, quiet enough that the words stay first:
   on black the dots are a dark gray, on white a very light gray, unless the
   person picks a colour.

   A pattern is a tone field (0 = no dot, 1 = the largest dot) read through a
   screen of dots (a square grid, a staggered one, or concentric rings). It
   moves in two ways, both looping: a slow drift of the field, and a glitch
   that flickers single dots. */
import type { Ground } from '../model/ground';
import type { PostImage } from '../social/images';
import type { FigureRef } from '../social/types';

export type PatternKind = 'wave' | 'ribbon' | 'discs' | 'rings' | 'shape' | 'image' | 'figure';
export type Screen = 'grid' | 'stagger' | 'rings';
export type DotShape = 'circle' | 'square' | 'char';
export type ShapeKind = 'cube' | 'stack' | 'steps' | 'cylinder' | 'sphere';
export type DiscLayout = 'petals' | 'pair' | 'row' | 'scatter';

export interface PatternSpec {
  kind: PatternKind;
  /* ---- the screen ---- */
  screen: Screen;
  /** px between dots, on the artboard */
  spacing: number;
  /** degrees the grid is turned */
  angle: number;
  /** the largest dot, as a share of the spacing (1: dots touch) */
  dot: number;
  /** the smallest dot drawn wherever the field reaches, as a share of the largest (0: they shrink away) */
  floor: number;
  shape: DotShape;
  /** -0.5..1: how hard the tones are pushed apart */
  contrast: number;
  /** -1..1: smaller (−) or larger (+) dots throughout */
  density: number;
  /* ---- where the field sits ---- */
  /** its centre, 0..1 across and down */
  x: number;
  y: number;
  /** its size against the artboard's shorter side */
  scale: number;
  /** degrees */
  rotate: number;
  seed: number;
  /* ---- each kind's own ---- */
  wave: { amplitude: number; length: number; thickness: number; spread: number; fade: number; bands: number };
  ribbon: { width: number; twists: number; amplitude: number; length: number };
  discs: { layout: DiscLayout; count: number; radius: number };
  rings: { blobs: number; size: number; reach: number };
  solid: { kind: ShapeKind; light: 'left' | 'right'; depth: number };
  image: PostImage | null;
  /** dark areas make large dots; `invert` makes light ones */
  invert: boolean;
  figure: FigureRef | null;
  /* ---- colour and motion ---- */
  /** null: the quiet colour for the ground */
  color: string | null;
  opacity: number;
  /** 0..1 each; seconds per loop */
  motion: { drift: number; glitch: number; seconds: number };
}

export const KINDS: { value: PatternKind; label: string; title: string }[] = [
  { value: 'wave', label: 'Wave', title: 'A band of larger dots flowing across' },
  { value: 'ribbon', label: 'Ribbon', title: 'A twisted ribbon of dots, in 3D' },
  { value: 'discs', label: 'Discs', title: 'Discs shaded from one side, like a halftone detail' },
  { value: 'rings', label: 'Rings', title: 'Dots on concentric rings, swelling into blobs' },
  { value: 'shape', label: 'Cube', title: 'A dotted isometric cube, stack, steps, cylinder or sphere' },
  { value: 'figure', label: 'Figure', title: 'Any illustration from Figures, drawn in dots' },
  { value: 'image', label: 'Image', title: 'Your photo or image, turned into dots' },
];

export const DEFAULT_PATTERN: PatternSpec = {
  kind: 'wave',
  screen: 'grid',
  spacing: 18,
  angle: 0,
  dot: 0.9,
  floor: 0,
  shape: 'circle',
  contrast: 0,
  density: 0,
  x: 0.5,
  y: 0.6,
  scale: 1,
  rotate: -18,
  seed: 3,
  wave: { amplitude: 0.12, length: 1.4, thickness: 0.12, spread: 0.6, fade: 0.15, bands: 1 },
  ribbon: { width: 0.34, twists: 1.5, amplitude: 0.22, length: 1.8 },
  discs: { layout: 'petals', count: 4, radius: 0.34 },
  rings: { blobs: 2, size: 0.3, reach: 0.95 },
  solid: { kind: 'cube', light: 'left', depth: 0.35 },
  image: null,
  invert: false,
  figure: null,
  color: null,
  opacity: 1,
  motion: { drift: 0.5, glitch: 0.15, seconds: 8 },
};

/** A stored pattern, with anything missing (an older save) filled from the defaults. */
export function fillPattern(raw: Partial<PatternSpec> | null | undefined): PatternSpec {
  const d = DEFAULT_PATTERN;
  const r = raw ?? {};
  return {
    ...d,
    ...r,
    wave: { ...d.wave, ...r.wave },
    ribbon: { ...d.ribbon, ...r.ribbon },
    discs: { ...d.discs, ...r.discs },
    rings: { ...d.rings, ...r.rings },
    solid: { ...d.solid, ...r.solid },
    motion: { ...d.motion, ...r.motion },
  };
}

/** The ground a pattern is made on, in the Patterns tab: the post grounds, a light gray, or none. */
export type PatternGround = Ground | 'gray' | 'none';

export const GROUND_COLOR: Record<PatternGround, string | null> = {
  dark: '#0C0C0C',
  light: '#F9F9F9',
  gray: '#E8E8E9',
  green: '#10B981',
  none: null,
};

/** The quiet dot color for a ground: a dark gray on black, a very light gray on white, white on light gray and on green. */
export function quietColor(ground: PatternGround): { color: string; opacity: number } {
  switch (ground) {
    case 'dark':
      return { color: '#2A2A2A', opacity: 1 };
    case 'light':
      return { color: '#E8E8E9', opacity: 1 };
    case 'gray':
      return { color: '#FFFFFF', opacity: 1 };
    case 'green':
      return { color: '#FFFFFF', opacity: 0.16 };
    default:
      return { color: '#0C0C0C', opacity: 1 };
  }
}

/** The colour and strength the dots are drawn in. */
export function inkOf(spec: PatternSpec, ground: PatternGround): { color: string; opacity: number } {
  if (spec.color) return { color: spec.color, opacity: spec.opacity };
  const q = quietColor(ground);
  return { color: q.color, opacity: q.opacity * spec.opacity };
}

const lum = (hex: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return 0;
  const n = parseInt(m[1]!, 16);
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch((n >> 16) & 255) + 0.7152 * ch((n >> 8) & 255) + 0.0722 * ch(n & 255);
};

/** How strongly the dots stand off the ground: the contrast ratio, eased by their opacity (1 = invisible). */
export function patternContrast(spec: PatternSpec, ground: PatternGround): number {
  const g = GROUND_COLOR[ground];
  if (!g) return 1;
  const ink = inkOf(spec, ground);
  const a = lum(ink.color);
  const b = ground === 'green' ? lum('#10B981') : lum(g);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return 1 + (ratio - 1) * Math.max(0, Math.min(1, ink.opacity));
}

/** Whether a pattern changes over its loop. */
export const patternMoves = (spec: PatternSpec) => spec.motion.drift > 0.001 || spec.motion.glitch > 0.001;

/** Patterns whose dots are louder than this compete with the words. */
export const LOUD = 1.9;

/* ---------- presets: the looks to start from ---------- */

export interface PatternPreset {
  id: string;
  label: string;
  spec: Partial<PatternSpec>;
}

export const PRESETS: PatternPreset[] = [
  {
    id: 'wave',
    label: 'Wave',
    spec: { kind: 'wave', screen: 'grid', angle: 0, spacing: 18, dot: 0.9, x: 0.5, y: 0.6, scale: 1, rotate: -22, wave: { amplitude: 0.06, length: 1.6, thickness: 0.09, spread: 0.75, fade: 0.04, bands: 1 } },
  },
  {
    id: 'soft-wave',
    label: 'Soft wave',
    spec: { kind: 'wave', screen: 'grid', angle: 45, spacing: 14, dot: 0.8, x: 0.5, y: 0.5, scale: 1, rotate: -10, wave: { amplitude: 0.12, length: 1.3, thickness: 0.09, spread: 0.35, fade: 0.16, bands: 1 } },
  },
  {
    id: 'ribbon',
    label: 'Ribbon',
    spec: { kind: 'ribbon', spacing: 20, dot: 0.8, x: 0.5, y: 0.5, scale: 1, rotate: 40, ribbon: { width: 0.36, twists: 2.5, amplitude: 0.22, length: 1.5 } },
  },
  {
    id: 'discs',
    label: 'Halftone discs',
    spec: { kind: 'discs', screen: 'grid', angle: 0, spacing: 16, dot: 0.9, x: 0.5, y: 0.5, scale: 0.85, rotate: 0, discs: { layout: 'petals', count: 4, radius: 0.3 } },
  },
  {
    id: 'rings',
    label: 'Rings',
    spec: { kind: 'rings', screen: 'rings', spacing: 18, dot: 0.9, x: 0.5, y: 0.5, scale: 1, rotate: 0, rings: { blobs: 2, size: 0.32, reach: 1 } },
  },
  {
    id: 'cube',
    label: 'Cube',
    spec: { kind: 'shape', screen: 'grid', angle: 0, spacing: 14, dot: 0.9, x: 0.6, y: 0.55, scale: 0.7, rotate: 0, solid: { kind: 'cube', light: 'left', depth: 0.35 } },
  },
  {
    id: 'stack',
    label: 'Stack',
    spec: { kind: 'shape', screen: 'grid', angle: 0, spacing: 14, dot: 0.9, x: 0.6, y: 0.55, scale: 0.75, rotate: 0, solid: { kind: 'stack', light: 'left', depth: 0.3 } },
  },
  {
    id: 'steps',
    label: 'Steps',
    spec: { kind: 'shape', screen: 'grid', angle: 0, spacing: 14, dot: 0.9, x: 0.5, y: 0.55, scale: 0.7, rotate: 0, solid: { kind: 'steps', light: 'left', depth: 0.3 } },
  },
  {
    id: 'sphere',
    label: 'Sphere',
    spec: { kind: 'shape', screen: 'rings', spacing: 14, dot: 0.9, x: 0.6, y: 0.58, scale: 0.78, rotate: 0, solid: { kind: 'sphere', light: 'left', depth: 0.3 } },
  },
];

export const presetSpec = (id: string, base: PatternSpec = DEFAULT_PATTERN): PatternSpec => {
  const p = PRESETS.find(x => x.id === id);
  const keep = { color: base.color, opacity: base.opacity, motion: base.motion, image: base.image, figure: base.figure, invert: base.invert };
  return fillPattern({ ...DEFAULT_PATTERN, ...p?.spec, ...keep });
};
