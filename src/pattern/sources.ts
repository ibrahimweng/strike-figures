/* Tone from pictures: an uploaded image, or a figure from Figures redrawn
   as gray faces (tops light, sides in two darker grays, lines dark and
   heavy), read back as darkness so the screen can turn it into dots. */
import { svgImage } from '../anim/encode';
import { frameSvg } from '../anim/motion';
import type { FaceStyle, Scene } from '../model/types';
import { contentBox, resolveFigure } from '../social/figure';
import { imageOf } from '../social/images';
import type { FigureRef } from '../social/types';
import type { ToneMap } from './field';

const MAX = 420;

/** Darkness of every pixel of a drawn picture, at most MAX px on its longer side. Transparent pixels hold no dots. */
function toneOf(img: CanvasImageSource, w: number, h: number, crop: { x: number; y: number; w: number; h: number } | null = null): ToneMap {
  const src = crop ?? { x: 0, y: 0, w, h };
  w = src.w;
  h = src.h;
  const k = Math.min(1, MAX / Math.max(w, h));
  const W = Math.max(1, Math.round(w * k));
  const H = Math.max(1, Math.round(h * k));
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.fillStyle = '#FFFFFF';
  if (crop) ctx.fillRect(0, 0, W, H);
  ctx.drawImage(img, src.x, src.y, src.w, src.h, 0, 0, W, H);
  const px = ctx.getImageData(0, 0, W, H).data;
  const data = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const a = px[i * 4 + 3]! / 255;
    if (a < 0.05) {
      data[i] = -1;
      continue;
    }
    const l = (0.299 * px[i * 4]! + 0.587 * px[i * 4 + 1]! + 0.114 * px[i * 4 + 2]!) / 255;
    data[i] = 1 - l;
  }
  return { w: W, h: H, data };
}

const images = new Map<string, Promise<ToneMap | null>>();

/** An uploaded image as tone, or null when it can't be found. */
export function imageTone(id: string): Promise<ToneMap | null> {
  let p = images.get(id);
  if (!p) {
    p = imageOf(id).then(img => (img ? toneOf(img, img.naturalWidth, img.naturalHeight) : null));
    images.set(id, p);
  }
  return p;
}

/** A figure redrawn for tone: no colour, faces in grays by which way they face, lines dark and heavy, no labels. */
export function toneScene(src: Scene): Scene {
  const sc = JSON.parse(JSON.stringify(src)) as Scene;
  const face = (fill: string): FaceStyle => ({ fill, dots: null });
  sc.theme = {
    ...sc.theme,
    background: '#FFFFFF',
    transparent: false,
    fill: '#B8B8B8',
    outline: '#161616',
    crease: '#4A4A4A',
    guide: '#FFFFFF',
    dot: '#3A3A3A',
    accent: '#161616',
    label: '#FFFFFF',
    lineWidth: sc.theme.lineWidth * 2.6,
  };
  for (const o of sc.objects) {
    o.style = { ...o.style, outline: null, crease: null, fill: null, lineWidth: o.style.lineWidth != null ? o.style.lineWidth * 2.6 : null, dash: null };
    const sides: Record<string, FaceStyle> = { all: face('#8E8E8E') };
    for (let i = 1; i < 24; i += 2) {
      sides[`s${i}`] = face('#4E4E4E');
      sides[`c${i}`] = face('#4E4E4E');
    }
    o.faces = { top: face('#E2E2E2'), bottom: face('#4E4E4E'), sides };
    o.decal = null;
    o.shadow = { ...o.shadow, enabled: false };
    o.guides = false;
  }
  sc.labels = [];
  sc.lines = (sc.lines ?? []).map(l => ({ ...l, color: '#2A2A2A', width: (l.width ?? 1) * 2.6 }));
  sc.motion = { kind: 'none', duration: sc.motion?.duration ?? 6 };
  return sc;
}

const figures = new Map<string, Promise<ToneMap | null>>();

/** A figure as tone. */
export function figureTone(ref: FigureRef): Promise<ToneMap | null> {
  const src = resolveFigure(ref);
  if (!src) return Promise.resolve(null);
  const key = ref.kind === 'library' ? `lib:${ref.id}` : `mine:${ref.id}:${JSON.stringify(src).length}`;
  let p = figures.get(key);
  if (!p) {
    const sc = toneScene(src);
    const { width, height } = sc.artboard;
    const k = Math.min(2, (MAX * 2) / Math.max(width, height));
    /* only the drawing, with a little air round it */
    const b = contentBox(src);
    const pad = 0.06 * Math.max(b.maxX - b.minX, b.maxY - b.minY);
    const x0 = Math.max(0, b.minX - pad);
    const y0 = Math.max(0, b.minY - pad);
    const crop = { x: x0 * k, y: y0 * k, w: (Math.min(width, b.maxX + pad) - x0) * k, h: (Math.min(height, b.maxY + pad) - y0) * k };
    p = svgImage(frameSvg(sc, 0, { background: true, idPrefix: 'tn' }), Math.round(width * k), Math.round(height * k))
      .then(img => toneOf(img, width * k, height * k, crop))
      .catch(() => null);
    figures.set(key, p);
  }
  return p;
}

/** Whatever tone a pattern reads from, if any. */
export function toneFor(spec: { kind: string; image: { id: string } | null; figure: FigureRef | null }): Promise<ToneMap | null> {
  if (spec.kind === 'image' && spec.image) return imageTone(spec.image.id);
  if (spec.kind === 'figure' && spec.figure) return figureTone(spec.figure);
  return Promise.resolve(null);
}

/** The tone map's cache key, to know when a pattern must reload it. */
export const toneKey = (spec: { kind: string; image: { id: string } | null; figure: FigureRef | null }) =>
  spec.kind === 'image' ? `i:${spec.image?.id ?? ''}` : spec.kind === 'figure' ? `f:${spec.figure ? (spec.figure.kind === 'library' ? spec.figure.id : spec.figure.id) : ''}` : '';
