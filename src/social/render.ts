/* Drawing cards on a canvas, from the one layout (layout.ts), for the
   preview and for every export: PNG, MP4 and GIF. */
import { FPS } from '../anim/motion';
import { canvasPng, encodeGif, encodeVideo, type FrameSource, svgImage } from '../anim/encode';
import type { Ground } from '../model/ground';
import type { Scene } from '../model/types';
import { cardScene, contentBox, facesOf, figureSvg, hasFigure, loopFrames, postScene, resolveFigure } from './figure';
import { coverRect, imageOf } from './images';
import { CARD_SIZES, type CardLayout, type CardSpec, fitFigure, type FontSpec, GRID, layoutCard, type Measure, type Rect, type TextBlock } from './layout';
import { logoImage } from './logos';
import { groundOfPost, isSingle, type Post, riskOfPost, sizeOfPost, type Thread } from './types';

const FAMILY = {
  sans: '"Geist Variable", ui-sans-serif, system-ui, sans-serif',
  mono: '"Geist Mono Variable", ui-monospace, "SF Mono", Menlo, monospace',
};

export const cssFont = (f: FontSpec) => `${f.weight} ${f.size}px ${FAMILY[f.family]}`;

let fontsReady: Promise<void> | null = null;

/** Geist, loaded before anything is measured or drawn. */
export function ensureFonts(): Promise<void> {
  fontsReady ??= Promise.all(
    ['400 64px "Geist Variable"', '500 64px "Geist Variable"', '400 64px "Geist Mono Variable"', '500 64px "Geist Mono Variable"'].map(f => document.fonts.load(f)),
  ).then(
    () => undefined,
    () => undefined,
  );
  return fontsReady;
}

function setFont(ctx: CanvasRenderingContext2D, f: FontSpec) {
  ctx.font = cssFont(f);
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(f.tracking * f.size).toFixed(2)}px`;
}

let measurer: CanvasRenderingContext2D | null = null;
const widths = new Map<string, number>();

/** Text widths from a canvas, shared by the preview and the exports. */
export const measure: Measure = (text, font) => {
  const key = `${font.family}|${font.weight}|${font.size}|${font.tracking}|${text}`;
  let w = widths.get(key);
  if (w === undefined) {
    measurer ??= document.createElement('canvas').getContext('2d')!;
    setFont(measurer, font);
    w = measurer.measureText(text).width;
    if (widths.size > 20000) widths.clear();
    widths.set(key, w);
  }
  return w;
};

/** What a post's card says and how it looks. */
export function specOf(thread: Thread, post: Post, index: number): CardSpec {
  const n = thread.posts.length;
  const im = post.image;
  return {
    size: sizeOfPost(thread, post),
    ground: groundOfPost(thread, post),
    side: post.side,
    visual: post.visual,
    aspect: post.visual === 'screenshot' && im ? im.w / im.h : null,
    logo: post.logo,
    eyebrow: post.eyebrow,
    headline: post.headline,
    sub: post.sub,
    number: !isSingle(thread) && thread.numberCards && n > 1 ? `${index + 1}/${n}` : null,
    risk: riskOfPost(thread, post, index),
  };
}

export const layoutOf = (thread: Thread, post: Post, index: number) => layoutCard(specOf(thread, post, index), measure);

/* ---------- drawing ---------- */

function drawBlock(ctx: CanvasRenderingContext2D, b: TextBlock | null) {
  if (!b) return;
  setFont(ctx, b.font);
  ctx.textBaseline = 'alphabetic';
  for (const { baseline, line } of b.lines) {
    if (b.align === 'right') {
      ctx.textAlign = 'right';
      ctx.fillStyle = b.color;
      /* canvas adds the letter spacing after the last character too; take it back so the line sits on its edge */
      ctx.fillText(line.text, b.x + b.font.tracking * b.font.size, baseline);
      ctx.textAlign = 'left';
      continue;
    }
    ctx.textAlign = 'left';
    for (const seg of line.segments) {
      if (!seg.text.trim()) continue;
      ctx.fillStyle = seg.hl ? b.hlColor : b.color;
      ctx.fillText(seg.text, b.x + seg.x, baseline);
    }
  }
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  const k = Math.min(radius, r.w / 2, r.h / 2);
  ctx.beginPath();
  ctx.moveTo(r.x + k, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, k);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, k);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, k);
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, k);
  ctx.closePath();
}

/** The pictures a card needs, loaded: the logo, an uploaded screenshot or photo, and the still figure. */
export interface CardAssets {
  logo: HTMLImageElement | null;
  picture: HTMLImageElement | null;
}

/** Load what a card draws, at `px` device pixels per card pixel. */
export async function cardAssets(L: CardLayout, post: Post, px: number): Promise<CardAssets> {
  const [logo, picture] = await Promise.all([
    logoImage(L.palette.logo, L.logo.kind, L.logo.w * px, L.logo.h * px).catch(() => null),
    (L.visual === 'screenshot' || L.visual === 'photo') && post.image ? imageOf(post.image.id) : Promise.resolve(null),
  ]);
  return { logo, picture };
}

/** Everything on the card but the figure, in card pixels (scale the context first for other sizes). */
export function drawBase(ctx: CanvasRenderingContext2D, L: CardLayout, post: Post, assets: CardAssets) {
  const pal = L.palette;
  /* the ground: flat, or the poster gradient */
  if (pal.gradient) {
    const g = ctx.createLinearGradient(0, 0, 0, L.height);
    pal.gradient.forEach((c, i) => g.addColorStop(i / (pal.gradient!.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, L.width, L.height);

  /* a photo fills the card, toned so the words read: darker overall, darker still behind the words and the logo */
  if (L.photo) {
    const im = post.image;
    if (assets.picture && im) {
      const r = coverRect({ x: 0, y: 0, w: L.width, h: L.height }, im);
      ctx.save();
      if ('filter' in ctx) ctx.filter = 'saturate(0.85)';
      ctx.drawImage(assets.picture, r.x, r.y, r.w, r.h);
      ctx.restore();
    } else drawMissing(ctx, { x: 0, y: 0, w: L.width, h: L.height }, pal, 'Add a photo');
    ctx.fillStyle = 'rgba(12, 12, 12, 0.22)';
    ctx.fillRect(0, 0, L.width, L.height);
    const top = ctx.createLinearGradient(0, 0, 0, L.height * 0.62);
    top.addColorStop(0, 'rgba(12, 12, 12, 0.72)');
    top.addColorStop(1, 'rgba(12, 12, 12, 0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, L.width, L.height * 0.62);
    const foot = ctx.createLinearGradient(0, L.height * 0.7, 0, L.height);
    foot.addColorStop(0, 'rgba(12, 12, 12, 0)');
    foot.addColorStop(1, 'rgba(12, 12, 12, 0.6)');
    ctx.fillStyle = foot;
    ctx.fillRect(0, L.height * 0.7, L.width, L.height * 0.3);
  }

  /* the illustration's panel, with the grid drawn faintly inside */
  const p = L.panel;
  if (p) {
    ctx.fillStyle = pal.panel;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, p.h);
    ctx.clip();
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = p.x; x <= p.x + p.w + 0.1; x += GRID) {
      const cx = Math.min(Math.max(x, p.x + 0.5), p.x + p.w - 0.5);
      ctx.moveTo(cx, p.y);
      ctx.lineTo(cx, p.y + p.h);
    }
    for (let y = p.y; y <= p.y + p.h + 0.1; y += GRID) {
      const cy = Math.min(Math.max(y, p.y + 0.5), p.y + p.h - 0.5);
      ctx.moveTo(p.x, cy);
      ctx.lineTo(p.x + p.w, cy);
    }
    ctx.stroke();
    ctx.restore();
  }

  /* a screenshot, at true colors, in a frame that hugs it */
  if (L.frame) {
    const f = L.frame;
    const radius = 16;
    const im = post.image;
    ctx.save();
    roundRect(ctx, f, radius);
    ctx.clip();
    if (assets.picture && im) {
      ctx.fillStyle = pal.panel;
      ctx.fillRect(f.x, f.y, f.w, f.h);
      const r = coverRect(f, im);
      ctx.drawImage(assets.picture, r.x, r.y, r.w, r.h);
    } else drawMissing(ctx, f, pal, 'Add a screenshot');
    ctx.restore();
    roundRect(ctx, { x: f.x + 0.75, y: f.y + 0.75, w: f.w - 1.5, h: f.h - 1.5 }, radius);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = pal.text === '#0C0C0C' ? 'rgba(12, 12, 12, 0.12)' : 'rgba(255, 255, 255, 0.14)';
    ctx.stroke();
  }

  drawBlock(ctx, L.eyebrow);
  drawBlock(ctx, L.headline);
  drawBlock(ctx, L.sub);

  if (assets.logo) ctx.drawImage(assets.logo, L.logo.x, L.logo.y, L.logo.w, L.logo.h);
  drawBlock(ctx, L.number);
  drawBlock(ctx, L.risk);
}

/** Where a picture will go, until one is added. */
function drawMissing(ctx: CanvasRenderingContext2D, r: Rect, pal: CardLayout['palette'], label: string) {
  ctx.fillStyle = pal.panel;
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = pal.grid === 'rgba(255, 255, 255, 0)' ? 'rgba(255, 255, 255, 0.25)' : pal.muted;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.strokeRect(r.x + 12, r.y + 12, r.w - 24, r.h - 24);
  ctx.restore();
  setFont(ctx, { family: 'sans', weight: 500, size: 30, tracking: -0.01 });
  ctx.fillStyle = pal.muted;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

/** Where a post's figure is drawn on its card (its whole artboard; the clip trims it). */
export function figureRect(L: CardLayout, post: Post): Rect | null {
  if (!L.figureArea || !hasFigure(post)) return null;
  const src = resolveFigure(post.figure);
  /* a corner figure may grow larger: it is meant to run off the card */
  return src ? fitFigure(L.figureArea, contentBox(src), src.artboard, L.visual === 'corner' ? 6 : undefined) : null;
}

/** Draw a figure image, clipped to its place and set back as far as the layout asks. */
export function drawFigure(ctx: CanvasRenderingContext2D, L: CardLayout, img: CanvasImageSource, r: Rect) {
  const c = L.figureClip;
  if (!c) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(c.x, c.y, c.w, c.h);
  ctx.clip();
  ctx.globalAlpha = L.figureOpacity;
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  ctx.restore();
}

/** The figure at moment t, rasterized at the size it will be drawn. */
export async function figureImage(sc: Scene, t: number, w: number, h: number, idPrefix = 'tc'): Promise<HTMLImageElement> {
  return svgImage(figureSvg(sc, t, idPrefix), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

/* The still picture of a figure on a ground, as SVG and as images at the sizes asked for, kept for a while: typing in a post redraws its card often, and its figure needn't be redrawn each time. */
const ids = new WeakMap<Scene, number>();
let nextId = 1;
const sceneId = (sc: Scene) => {
  let id = ids.get(sc);
  if (!id) ids.set(sc, (id = nextId++));
  return id;
};
const stills = new Map<string, string>();
const images = new Map<string, Promise<HTMLImageElement>>();
const remember = <T,>(m: Map<string, T>, key: string, make: () => T, max: number): T => {
  let v = m.get(key);
  if (v === undefined) {
    v = make();
    if (m.size >= max) m.delete(m.keys().next().value!);
  } else m.delete(key);
  m.set(key, v);
  return v;
};

/** The still SVG of a figure as it sits on a card of this ground. */
export const stillSvg = (src: Scene, ground: Ground, faces: 'panel' | 'ground' = 'panel') =>
  remember(stills, `${sceneId(src)}|${ground}|${faces}`, () => figureSvg(cardScene(src, ground, { animated: false, duration: null }, faces), 0, 'ts'), 24);

/** The still figure as an image w×h px. */
export function stillImage(src: Scene, ground: Ground, w: number, h: number, faces: 'panel' | 'ground' = 'panel'): Promise<HTMLImageElement> {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const key = `${sceneId(src)}|${ground}|${faces}|${W}x${H}`;
  const p = remember(images, key, () => svgImage(stillSvg(src, ground, faces), W, H), 48);
  p.catch(() => images.delete(key));
  return p;
}

/** Draw a whole still card onto ctx (already scaled to card pixels), `px` device pixels per card pixel. */
export async function paintCard(ctx: CanvasRenderingContext2D, L: CardLayout, post: Post, ground: Ground, px: number, opts: { figure?: boolean; isLive?: () => boolean } = {}) {
  const assets = await cardAssets(L, post, px);
  const src = hasFigure(post) ? resolveFigure(post.figure) : null;
  const r = src ? figureRect(L, post) : null;
  const fig = opts.figure !== false && src && r ? await stillImage(src, ground, r.w * px, r.h * px, facesOf(post)).catch(() => null) : null;
  if (opts.isLive && !opts.isLive()) return;
  drawBase(ctx, L, post, assets);
  if (fig && r) drawFigure(ctx, L, fig, r);
}

/** A whole card on a new canvas: the still picture (frame 0). */
export async function renderCard(thread: Thread, post: Post, index: number, scale = 1): Promise<{ canvas: HTMLCanvasElement; layout: CardLayout }> {
  await ensureFonts();
  const L = layoutOf(thread, post, index);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(L.width * scale);
  canvas.height = Math.round(L.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  await paintCard(ctx, L, post, groundOfPost(thread, post), scale);
  return { canvas, layout: L };
}

export async function cardPng(thread: Thread, post: Post, index: number): Promise<Blob> {
  const { canvas } = await renderCard(thread, post, index, 1);
  return canvasPng(canvas);
}

/** The card, moving: everything but the figure drawn once, the figure redrawn each frame. */
export async function cardFrames(thread: Thread, post: Post, index: number, scale: number, fps: number): Promise<FrameSource> {
  await ensureFonts();
  const L = layoutOf(thread, post, index);
  const W = Math.round(L.width * scale);
  const H = Math.round(L.height * scale);
  const base = document.createElement('canvas');
  base.width = W;
  base.height = H;
  const bctx = base.getContext('2d')!;
  bctx.scale(scale, scale);
  drawBase(bctx, L, post, await cardAssets(L, post, scale));
  const sc = postScene(post, groundOfPost(thread, post), true);
  const r = figureRect(L, post);
  const frames = sc ? loopFrames(sc, fps) : 1;
  return {
    width: W,
    height: H,
    fps,
    frames,
    draw: async (i, ctx) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(base, 0, 0);
      if (!sc || !r) return;
      const img = await figureImage(sc, i / frames, r.w * scale, r.h * scale, 'tx');
      ctx.scale(scale, scale);
      drawFigure(ctx, L, img, r);
    },
  };
}

/* X takes GIFs up to 15 MB; half size keeps most loops well under. 25 fps is a whole number of GIF ticks (4 cs). */
export const GIF_SCALE = 0.5;
export const GIF_FPS = 25;
export const GIF_LIMIT = 15 * 1024 * 1024;

export async function cardVideo(thread: Thread, post: Post, index: number, opts: { onProgress?: (done: number, total: number) => void; signal?: AbortSignal }) {
  const src = await cardFrames(thread, post, index, 1, FPS);
  return encodeVideo(src, { ...opts, bitrate: 8_000_000 });
}

export async function cardGif(thread: Thread, post: Post, index: number, opts: { onProgress?: (done: number, total: number) => void; signal?: AbortSignal }) {
  const src = await cardFrames(thread, post, index, GIF_SCALE, GIF_FPS);
  return encodeGif(src, opts);
}

export const cardPixels = (thread: Thread, post: Post) => CARD_SIZES[sizeOfPost(thread, post)];
