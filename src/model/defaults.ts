import type { ShapeSpec } from '../engine/shapes';
import type { DotFill, FaceStyle, Gradient, Scene, SceneObject, Theme } from './types';

export const uid = () => Math.random().toString(36).slice(2, 10);

/* Strike's colours, from strikelabs.app: emerald 300–900 on near-black */
export const STRIKE = {
  ink: '#0C0C0C',
  emerald300: '#6EE7B7',
  emerald400: '#34D399',
  emerald500: '#10B981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065F46',
  emerald900: '#064E3B',
};

/* Strike's brand palette (brand book, Color). Black and white carry the
   system; Strike Green is the signal. The rest appear only in data
   infographics, each with one meaning: Watermelon is loss, Shamrock profit,
   Yellow, Sky and Purple tell series apart. (The brand book prints Sky's hex
   as #EE5E74, a copy of Watermelon's; its RGB, 7 136 247, is #0788F7.) */
export const BRAND = {
  ground: '#0C0C0C',
  white: '#F9F9F9',
  green: '#10B981',
  deep: '#047857',
  mint: '#50EBA0',
  shamrock: '#3FD4AB',
  watermelon: '#EE5E74',
  yellow: '#FFEF3C',
  sky: '#0788F7',
  purple: '#976FE6',
};

/* The greys every figure is drawn in: the ground (Strike's #0C0C0C), three
   line strengths (subject, support, background) and the grey of neutral dots. */
export const TONE = {
  ink: '#0C0C0C',
  line: '#D0D6E0',
  mid: '#62666D',
  dim: '#3E3E44',
  faint: '#2E2E32',
  dot: '#E4E5E9',
};

export const THEMES: Theme[] = [
  {
    name: 'Green dots',
    background: TONE.ink,
    transparent: false,
    fill: TONE.ink,
    outline: TONE.line,
    crease: TONE.dim,
    guide: TONE.dim,
    dot: STRIKE.emerald500,
    accent: STRIKE.emerald400,
    lineWidth: 0.5,
    creaseTaper: 0.7,
    creaseTrim: 4,
    label: TONE.mid,
  },
  {
    name: 'Grey dots',
    background: TONE.ink,
    transparent: false,
    fill: TONE.ink,
    outline: TONE.line,
    crease: TONE.dim,
    guide: TONE.dim,
    dot: TONE.dot,
    accent: TONE.line,
    lineWidth: 0.5,
    creaseTaper: 0.7,
    creaseTrim: 4,
    label: TONE.mid,
  },
  {
    name: 'Green lines',
    background: TONE.ink,
    transparent: false,
    fill: TONE.ink,
    outline: STRIKE.emerald400,
    crease: STRIKE.emerald800,
    guide: STRIKE.emerald800,
    dot: STRIKE.emerald500,
    accent: STRIKE.emerald300,
    lineWidth: 0.5,
    creaseTaper: 0.7,
    creaseTrim: 4,
    label: TONE.mid,
  },
];

export const defaultTheme = (): Theme => ({ ...THEMES[0]! });

export const defaultGradient = (): Gradient => ({
  type: 'none',
  angle: 0,
  start: 0,
  end: 1,
  cx: 0.5,
  cy: 0.5,
  radius: 0.7,
  frequency: 2,
  phase: 0,
  seed: 7,
  affects: 'size',
  invert: false,
});

export const defaultDots = (color = ''): DotFill => ({
  enabled: true,
  pattern: 'grid',
  spacing: 4,
  size: 0.9,
  sizeMin: 0.15,
  shape: 'circle',
  color,
  opacity: 1,
  opacityMin: 0.1,
  gradient: defaultGradient(),
  inset: 2,
  angle: 0,
  region: null,
  mask: null,
});

export const emptyFace = (): FaceStyle => ({ fill: null, dots: null });

export function newObject(shape: ShapeSpec, height: number, name: string, at: [number, number, number] = [0, 0, 0]): SceneObject {
  return {
    id: uid(),
    name,
    visible: true,
    locked: false,
    shape,
    height,
    position: at,
    rotation: [0, 0, 0],
    style: { outline: null, crease: null, fill: null, lineWidth: null, outlineOpacity: 1, creaseOpacity: 1, showCreases: true, creaseTrim: null, creaseDrop: 0 },
    faces: { top: emptyFace(), bottom: emptyFace(), sides: {} },
    shadow: { enabled: false, blur: 8, dx: 0, dy: 4, opacity: 0.6 },
    guides: false,
    decal: null,
  };
}

/** The shapes the toolbar adds, sized for a 320-unit artboard. */
export const KINDS = {
  box: { label: 'Box', make: () => newObject({ kind: 'box', width: 60, depth: 60, radius: 4 }, 60, 'Box') },
  slab: { label: 'Slab', make: () => newObject({ kind: 'box', width: 120, depth: 120, radius: 6 }, 14, 'Slab') },
  fin: { label: 'Fin', make: () => newObject({ kind: 'box', width: 120, depth: 4, radius: 1.2 }, 50, 'Fin') },
  cylinder: { label: 'Cylinder', make: () => newObject({ kind: 'cylinder', radius: 30 }, 40, 'Cylinder') },
  hexagon: { label: 'Hexagon', make: () => newObject({ kind: 'polygon', sides: 6, radius: 36, corner: 3 }, 24, 'Hexagon') },
  chevron: { label: 'Chevron', make: () => newObject({ kind: 'chevron', width: 140, depth: 72 }, 12, 'Chevron') },
} as const;

export type Kind = keyof typeof KINDS;

export function blankScene(name = 'Untitled figure'): Scene {
  return {
    id: uid(),
    name,
    label: 'FIG 1.0',
    artboard: { width: 320, height: 320 },
    camera: { yaw: 45, pitch: 30, zoom: 1, panX: 0, panY: 40 },
    theme: defaultTheme(),
    objects: [],
    labels: [],
    preset: null,
  };
}
