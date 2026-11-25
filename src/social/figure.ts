/* The illustration on a card: found from its reference, redrawn for the
   card's ground, and rendered as SVG frames. */
import { frameCount, frameSvg, motionOf, playingKind, sceneAt } from '../anim/motion';
import { renderScene } from '../engine/render';
import { LIBRARY, libraryScene } from '../library';
import type { Ground } from '../model/ground';
import { onGround } from '../model/ground';
import { useStore } from '../model/store';
import type { Scene } from '../model/types';
import { PALETTES } from './layout';
import type { FigureRef, Post } from './types';

/* Cards are seen small on X (a 1600 px card shows about 500 px wide), so lines are drawn heavier than in the editor. */
const LINE_BOOST = 1.7;

export function resolveFigure(ref: FigureRef): Scene | null {
  if (ref.kind === 'library') return libraryScene(ref.id);
  return useStore.getState().scenes.find(s => s.id === ref.id) ?? ref.snapshot ?? null;
}

export function figureName(ref: FigureRef): string {
  if (ref.kind === 'library') {
    const it = LIBRARY.find(x => x.id === ref.id);
    return it ? `${it.code} ${it.title}` : ref.id;
  }
  return useStore.getState().scenes.find(s => s.id === ref.id)?.name ?? ref.name;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** The figure as it sits on a card: redrawn for the ground, faces filled in the panel's color (so the panel's grid stays behind them) or, drawn from a corner, the ground's own, lines heavier, and moving or still. */
export function cardScene(sc: Scene, ground: Ground, motion: { animated: boolean; duration: number | null }, faces: 'panel' | 'ground' = 'panel'): Scene {
  const pal = PALETTES[ground];
  const from = pal.ground.toUpperCase();
  const fill = faces === 'ground' && !pal.gradient ? pal.ground : pal.panel;
  const json = JSON.stringify(onGround(sc, ground), (_k, v) => (typeof v === 'string' && HEX.test(v) && v.toUpperCase() === from ? fill : v));
  const out = JSON.parse(json) as Scene;
  out.theme.lineWidth *= LINE_BOOST;
  for (const o of out.objects) if (o.style.lineWidth != null) o.style.lineWidth *= LINE_BOOST;
  const m = motionOf(sc);
  out.motion = motion.animated
    ? { kind: m.kind === 'none' ? 'designed' : m.kind, duration: motion.duration ?? m.duration }
    : { kind: 'none', duration: m.duration };
  return out;
}

/** A post's figure, ready for its card, or null if it can't be found or the post has no illustration. */
export function postScene(post: Post, ground: Ground, animated = post.animated): Scene | null {
  if (!hasFigure(post)) return null;
  const sc = resolveFigure(post.figure);
  return sc ? cardScene(sc, ground, { animated, duration: post.duration }, facesOf(post)) : null;
}

/** Whether a post's picture is an illustration. */
export const hasFigure = (post: Post) => post.visual === 'panel' || post.visual === 'corner';
/** Corner figures sit straight on the ground; panel figures on the panel. */
export const facesOf = (post: Post): 'panel' | 'ground' => (post.visual === 'corner' ? 'ground' : 'panel');

/** One frame of the figure as SVG (t in [0, 1); 0 is the still picture). */
export const figureSvg = (sc: Scene, t: number, idPrefix: string) => frameSvg(sc, t, { clipHidden: true, background: false, idPrefix });

export const loopSeconds = (sc: Scene) => motionOf(sc).duration;
export const loopFrames = (sc: Scene, fps: number) => frameCount(sc, fps);

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const boxes = new WeakMap<Scene, Box>();

/** Where the drawing actually is on a figure's artboard, over its whole loop when it moves its shapes, so the framing holds still while it plays and doesn't jump when motion is switched on. */
export function contentBox(src: Scene): Box {
  const hit = boxes.get(src);
  if (hit) return hit;
  const m = motionOf(src);
  const sc: Scene = { ...src, motion: { kind: m.kind === 'none' ? 'designed' : m.kind, duration: m.duration } };
  const kind = playingKind(sc);
  const ts = kind === 'turn' || kind === 'designed' ? [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6] : [0];
  let b: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const add = (x0: number, y0: number, x1: number, y1: number) => {
    if (![x0, y0, x1, y1].every(Number.isFinite)) return;
    b = { minX: Math.min(b.minX, x0), minY: Math.min(b.minY, y0), maxX: Math.max(b.maxX, x1), maxY: Math.max(b.maxY, y1) };
  };
  for (const t of ts) {
    const model = renderScene(sceneAt(sc, t));
    for (const l of model.layers) add(l.bbox.minX, l.bbox.minY, l.bbox.maxX, l.bbox.maxY);
    /* construction lines and labels, where the renderer reports them, count too */
    const loose = model as unknown as { linesUnder?: { pts?: { x: number; y: number }[] }[]; linesOver?: { pts?: { x: number; y: number }[] }[]; labels?: { ink?: Box }[]; groundLabels?: { ink?: Box }[] };
    for (const l of [...(loose.linesUnder ?? []), ...(loose.linesOver ?? [])]) for (const q of l.pts ?? []) add(q.x, q.y, q.x, q.y);
    for (const l of [...(loose.labels ?? []), ...(loose.groundLabels ?? [])]) if (l.ink) add(l.ink.minX, l.ink.minY, l.ink.maxX, l.ink.maxY);
  }
  if (!Number.isFinite(b.minX) || b.maxX - b.minX < 1 || b.maxY - b.minY < 1) b = { minX: 0, minY: 0, maxX: src.artboard.width, maxY: src.artboard.height };
  boxes.set(src, b);
  return b;
}
