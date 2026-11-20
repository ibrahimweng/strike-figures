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

/** A curve across a face (0..1 each way, y up the face) that dots stay below or above, like a payoff or an area chart drawn in dots. */
export interface DotMask {
  mode: 'below' | 'above';
  points: [number, number][];
  /** draw the dots on the other side of the curve in this colour instead of leaving them out */
  altColor: string | null;
  altOpacity: number;
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
  /** keep dots to one side of a curve */
  mask: DotMask | null;
  /** a band of light passing across the dots (animation): where it is, 0..1 across the face, and how much it dims the rest */
  sweep?: { phase: number; amount: number } | null;
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
  /** dashed lines: the length of each dash, in artboard units (null: solid). Dashed shapes read as possible, not real. */
  dash?: number | null;
}

export interface Shadow {
  enabled: boolean;
  blur: number;
  dx: number;
  dy: number;
  opacity: number;
}

export interface Decal {
  /** strike: the Strike logo, flat; svg: a mark from a file; text: a few words */
  kind: 'strike' | 'svg' | 'text';
  /** text: the words, in Geist Mono */
  text: string;
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
  /** labels' colour */
  label: string;
}

/** A few words in Geist Mono: floating upright, or lying on the ground or a wall. */
export interface Label {
  id: string;
  text: string;
  position: [number, number, number];
  /** screen: always upright; ground: lying on the floor; xy / zy: on a wall facing +Z / +X */
  plane: 'screen' | 'ground' | 'xy' | 'zy';
  /** capital height, in world units */
  size: number;
  color: string | null;
  opacity: number;
  align: 'start' | 'middle' | 'end';
  /** degrees, turning the text within its plane */
  rotation: number;
  /** Geist Regular, or Medium for a ticker over its value */
  weight?: 'regular' | 'medium';
  /** move the text this many lines down its own plane (a value under its ticker) */
  offset?: number;
}

/**
 * A construction line: a path through points, or a circle (or part of one),
 * drawn over or under the shapes. Lines don't hide anything. Nodes mark
 * exact points: little squares or circles lying in the line's plane.
 */
export interface Line {
  id: string;
  kind: 'path' | 'circle';
  /** path: the points it runs through */
  points: [number, number, number][];
  closed: boolean;
  /** circle: centre, radius, and how it's turned (a flat circle on the ground, then tilted like an object) */
  center: [number, number, number];
  radius: number;
  rotation: [number, number, number];
  /** circle: the part drawn, 0..1 round from +X towards +Z (0 to 1 is the whole circle) */
  from: number;
  to: number;
  color: string | null;
  width: number | null;
  opacity: number;
  /** the length of each dash (null: solid) */
  dash: number | null;
  /** an arrowhead at the end */
  arrow: boolean;
  nodes: 'none' | 'square' | 'circle';
  /** a node's width, in world units */
  nodeSize: number;
  /** solid nodes are filled with the line's colour; hollow ones with the ground, outlined */
  nodeFill: 'solid' | 'hollow';
  /** path: which points get nodes (empty: all); circle: where round it they sit, 0..1 */
  nodeAt: number[];
  /** under the shapes, or over them */
  layer: 'under' | 'over';
}

/** How a figure moves when animated. Every loop ends where it starts. */
export interface Motion {
  /** designed: the illustration's own loop; turn: the camera goes round; build: the shapes rise into place; drift: light passes across the dots; none: still */
  kind: 'designed' | 'turn' | 'build' | 'drift' | 'none';
  /** seconds per loop */
  duration: number;
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
  labels: Label[];
  /** construction lines: dashed circles, spokes, rays, orbits */
  lines?: Line[];
  /** a built-in figure, which can be reset to how it shipped */
  preset: string | null;
  motion?: Motion;
  /** the ground it sits on; figures are drawn for the dark one and redrawn for the others */
  ground?: 'dark' | 'light' | 'green';
}
