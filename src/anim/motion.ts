/* Motion: what a figure looks like at a moment t of its loop (0 ≤ t < 1).
   Every loop ends where it starts, and t = 0 is the figure as drawn, so a
   still export and the first frame of an animation are the same picture.

   A figure moves one of five ways (Scene.motion.kind):
   - designed: the illustration's own loop, written next to it in the library;
   - turn: the camera goes once round;
   - build: the shapes sink away and rise back into place, one after another;
   - drift: a band of light passes across the dots;
   - none: still. */
import { renderScene } from '../engine/render';
import { buildSvg, serialize, type El, type SvgOptions } from '../engine/svg';
import { LIBRARY } from '../library';
import { PRESET_LOOPS } from '../model/presets';
import type { Motion, Scene } from '../model/types';
import { allDots, bump, ease, envelope, grow } from './kit';

/** A designed loop: change the copy `sc` to how it looks at t. */
export type Loop = (sc: Scene, t: number) => void;

export const DEFAULT_MOTION: Motion = { kind: 'designed', duration: 4 };
export const FPS = 30;

export const MOTIONS: { value: Motion['kind']; label: string; hint: string }[] = [
  { value: 'designed', label: 'Loop', hint: 'The loop made for this illustration' },
  { value: 'turn', label: 'Turn', hint: 'The view goes once round' },
  { value: 'build', label: 'Build', hint: 'The shapes rise into place' },
  { value: 'drift', label: 'Drift', hint: 'Light passes across the dots' },
  { value: 'none', label: 'Still', hint: 'No motion' },
];

/** The loop drawn for this figure, if it has one. */
export function designedLoop(sc: Scene): Loop | null {
  const p = sc.preset ?? '';
  if (p.startsWith('lib:')) return LIBRARY.find(x => x.id === p.slice(4))?.loop ?? null;
  return PRESET_LOOPS[p] ?? null;
}

export const motionOf = (sc: Scene): Motion => sc.motion ?? DEFAULT_MOTION;

/** The motion that will actually play: a figure with no loop of its own drifts. */
export function playingKind(sc: Scene): Motion['kind'] {
  const m = motionOf(sc);
  return m.kind === 'designed' && !designedLoop(sc) ? 'drift' : m.kind;
}

/** How many frames one loop takes at `fps`. */
export const frameCount = (sc: Scene, fps = FPS) => Math.max(1, Math.round(motionOf(sc).duration * fps));

/** The figure at moment t of its loop, as a new scene (the original is untouched). */
export function sceneAt(scene: Scene, t: number): Scene {
  const kind = playingKind(scene);
  if (kind === 'none') return scene;
  const u = ((t % 1) + 1) % 1;
  const sc = structuredClone(scene);
  if (kind === 'designed') designedLoop(scene)!(sc, u);
  else if (kind === 'turn') sc.camera.yaw += 360 * u;
  else if (kind === 'build') build(sc, u);
  else drift(sc, u);
  return sc;
}

/** One frame as an SVG element tree (see engine/svg.ts). */
export const frameEl = (scene: Scene, t: number, opts: SvgOptions = {}): El => buildSvg(renderScene(sceneAt(scene, t)), opts);

/** One frame as SVG text. */
export const frameSvg = (scene: Scene, t: number, opts: SvgOptions = {}) => `${serialize(frameEl(scene, t, opts))}\n`;

/* Build: hold, sink away together, rise back one after another from the ground up, hold. */
function build(sc: Scene, u: number) {
  const order = sc.objects
    .map((o, i) => ({ o, i }))
    .sort((a, b) => a.o.position[1] - b.o.position[1] || a.i - b.i)
    .map(x => x.o);
  const n = Math.max(1, order.length);
  const out = ease((u - 0.08) / 0.17);
  let shown = 0;
  order.forEach((o, k) => {
    const start = 0.3 + (0.5 * k) / n;
    const back = ease((u - start) / Math.max(0.12, 0.5 / n + 0.08));
    const kk = u < 0.3 ? 1 - out : back;
    grow(o, kk);
    shown += kk;
  });
  const all = shown / n;
  for (const l of sc.labels) l.opacity *= all * all;
}

/* Drift: a band of light passes across every dotted face. A figure with no dots sways instead. */
function drift(sc: Scene, u: number) {
  let any = false;
  allDots(sc, d => {
    d.sweep = { phase: u, amount: 0.7 * envelope(u) };
    any = true;
  });
  if (!any) sc.camera.yaw += 10 * Math.sin(2 * Math.PI * u) * bump(u, 0, 1);
}
