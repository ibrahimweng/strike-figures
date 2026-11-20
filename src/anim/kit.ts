/* Helpers for writing loops. A loop gets a copy of the figure and the moment
   t (0 ≤ t < 1) and changes the copy; at t = 0 and t → 1 it must leave the
   figure as drawn. Changes are relative (heights are scaled, positions
   nudged), so loops still work on figures someone has edited.

   The house rule for motion, from Strike's tone of voice (calm, exact, never
   hyped): one idea moves at a time, slowly, with eased starts and stops, and
   comes back to rest. No bounces, no flashes. */
import type { DotFill, Scene, SceneObject } from '../model/types';

export type V = [number, number, number];

/** Smoothstep, clamped: 0 before 0, 1 after 1. */
export const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** 0 outside [a, b]; inside, rises smoothly to 1 at the middle and falls back to 0. */
export const bump = (t: number, a: number, b: number) => (t <= a || t >= b ? 0 : 0.5 - 0.5 * Math.cos((2 * Math.PI * (t - a)) / (b - a)));

/** Up at [a, b] then down at [c, d]: 0 → 1 → 0 with a hold between. */
export const hold = (t: number, a: number, b: number, c: number, d: number) => (t < c ? ease((t - a) / (b - a)) : 1 - ease((t - c) / (d - c)));

/** Goes 0 → 1 over the loop, wrapping (for things that travel round). */
export const cycle = (t: number, k = 1) => (t * k) % 1;

/** The objects whose names start with `prefix`, in order. */
export const named = (sc: Scene, prefix: string) => sc.objects.filter(o => o.name.startsWith(prefix));

/** The first object called `name` (exactly), if it's still there. */
export const one = (sc: Scene, name: string) => sc.objects.find(o => o.name === name) ?? null;

/** Every dot fill on an object (top, bottom, sides). */
export function dotsOf(o: SceneObject): DotFill[] {
  const out: DotFill[] = [];
  for (const f of [o.faces.top, o.faces.bottom, ...Object.values(o.faces.sides)]) if (f.dots?.enabled) out.push(f.dots);
  return out;
}

export function allDots(sc: Scene, f: (d: DotFill, o: SceneObject) => void) {
  for (const o of sc.objects) for (const d of dotsOf(o)) f(d, o);
}

/** Scale an object's height from its base, and its lift off the ground with it (k = 0 hides it). */
export function grow(o: SceneObject | null, k: number) {
  if (!o) return;
  o.height *= Math.max(0, k);
  o.position = [o.position[0], o.position[1] * Math.max(0, Math.min(1, k)), o.position[2]];
  if (k < 0.015) o.visible = false;
}

/** Slide an object by d × k. */
export function move(o: SceneObject | null, d: V, k: number) {
  if (!o) return;
  o.position = [o.position[0] + d[0] * k, o.position[1] + d[1] * k, o.position[2] + d[2] * k];
}

/** Turn an object round the vertical by `deg`. */
export function spin(o: SceneObject | null, deg: number) {
  if (!o) return;
  o.rotation = [o.rotation[0], o.rotation[1] + deg, o.rotation[2]];
}

/** Dim an object's lines and dots by k (0..1). Its faces still hide what's behind it. */
export function fade(o: SceneObject | null, k: number) {
  if (!o) return;
  o.style.outlineOpacity *= k;
  o.style.creaseOpacity *= k;
  for (const d of dotsOf(o)) d.opacity *= k;
  if (o.decal) o.decal.opacity *= k;
}

/** 0 at the start and end of the loop, 1 in the middle: lets an effect fade in and out so the loop rests at t = 0. */
export const envelope = (t: number) => 0.5 - 0.5 * Math.cos(2 * Math.PI * t);

/** Pass a band of light across an object's dots during the loop (`lag`: how far behind, 0..1). */
export function sweep(o: SceneObject | null, t: number, amount = 0.7, lag = 0) {
  if (!o) return;
  for (const d of dotsOf(o)) d.sweep = { phase: t - lag, amount: amount * envelope(t) };
}

/** Shift a dot fill's wave along (one whole period over the loop keeps it seamless). */
export function wave(o: SceneObject | null, by: number) {
  if (!o) return;
  for (const d of dotsOf(o)) if (d.gradient.type === 'wave') d.gradient.phase += by;
}

/** Turn an object round a vertical axis through `centre` (a clock hand round its dial). */
export function orbit(o: SceneObject | null, deg: number, centre: V = [0, 0, 0]) {
  if (!o) return;
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const dx = o.position[0] - centre[0];
  const dz = o.position[2] - centre[2];
  o.position = [centre[0] + c * dx + s * dz, o.position[1], centre[2] - s * dx + c * dz];
  o.rotation = [o.rotation[0], o.rotation[1] + deg, o.rotation[2]];
}

/** A wave that travels: 0 at t = 0 and t = 1, swinging ±1 in between, `lag` (0..1) behind. */
export const swing = (t: number, lag = 0) => Math.sin(2 * Math.PI * (t - lag)) * (0.5 - 0.5 * Math.cos(2 * Math.PI * t));

/** The numbers in a name ("Cell 3,4" → [3, 4], "Column 5 · 3" → [5, 3], "Node 212" → [212]). */
export const nums = (name: string) => (name.match(/\d+/g) ?? []).map(Number);
