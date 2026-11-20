import type { Camera } from '../engine/math';
import type { ShapeSpec } from '../engine/shapes';

export type { Camera } from '../engine/math';
export type { ShapeSpec } from '../engine/shapes';

/** How a halftone's value changes across a face. Coordinates are 0..1 across the face. */
export interface Gradient {
  type: 'none' | 'linear' | 'radial' | 'wave' | 'noise';
  /** degrees, for linear and wave */
  angle: number;
  /** linear: where the ramp starts and ends along its direction */
  start: number;
  end: number;
  /** radial: centre and reach */
  cx: number;
  cy: number;
  radius: number;
  /** wave and noise: how many bands or blobs across the face */
  frequency: number;
  phase: number;
  seed: number;
  affects: 'size' | 'opacity' | 'both';
  invert: boolean;
}

/** Dots laid flat on a face: an even grid, or a halftone when a gradient drives them. */
export interface DotFill {
  enabled: boolean;
  pattern: 'grid' | 'stagger';
  /** distance between dots, in world units */
  spacing: number;
  /** dot radius at full value, and at none */
  size: number;
  sizeMin: number;
  shape: 'circle' | 'square';
  color: string;
  opacity: number;
  opacityMin: number;
  gradient: Gradient;
  /** keep dots this far from the face's edges */
  inset: number;
  /** turn the grid on the face, degrees */
  angle: number;
  /** only fill part of the face: centre and size as fractions of the face */
  region: { x: number; y: number; w: number; h: number } | null;
}

export interface FaceStyle {
  /** a solid colour for this face; null keeps the object's fill */
  fill: string | null;
  dots: DotFill | null;
}

export interface ObjectStyle {
  /** null takes the theme's colour */
  outline: string | null;
  crease: string | null;
  fill: string | null;
  lineWidth: number | null;
  outlineOpacity: number;
  creaseOpacity: number;
  showCreases: boolean;
  /** stop creases this far short of the outline, in artboard units; null takes the theme's */
  creaseTrim: number | null;
  /** draw the creases along a cap this far down the sides, in world units */
  creaseDrop: number;
}

export interface Shadow {
  enabled: boolean;
  blur: number;
  dx: number;
  dy: number;
  opacity: number;
}

export interface Decal {
  kind: 'sunset' | 'svg';
  /** svg: the path data, normalised to a 1×1 box centred on 0 */
  paths: string[];
  /** the name of the file it came from */
  source: string;
  /** centre on the top face, in plan units from the object's centre */
  x: number;
  y: number;
  size: number;
  rotation: number;
  mode: 'stroke' | 'fill';
  color: string | null;
  width: number | null;
  opacity: number;
}

export interface SceneObject {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  shape: ShapeSpec;
  height: number;
  /** the centre of the object's base */
  position: [number, number, number];
  /** degrees: tilt (X), turn (Y), roll (Z) */
  rotation: [number, number, number];
  style: ObjectStyle;
  faces: {
    top: FaceStyle;
    bottom: FaceStyle;
    /** keyed by side face ("s0", "c1", ...) or "all" */
    sides: Record<string, FaceStyle>;
  };
  shadow: Shadow;
  guides: boolean;
  decal: Decal | null;
}

export interface Theme {
  name: string;
  background: string;
  /** export with no background */
  transparent: boolean;
  fill: string;
  outline: string;
  crease: string;
  guide: string;
  dot: string;
  accent: string;
  lineWidth: number;
  /** creases on a curved side stop where the side turns this far from facing you (0 draws them all) */
  creaseTaper: number;
  /** creases stop this far short of the outline, in artboard units */
  creaseTrim: number;
}

export interface Scene {
  id: string;
  name: string;
  /** a caption like "FIG 0.1" */
  label: string;
  artboard: { width: number; height: number };
  camera: Camera;
  theme: Theme;
  objects: SceneObject[];
  /** a built-in figure, which can be reset to how it shipped */
  preset: string | null;
}
