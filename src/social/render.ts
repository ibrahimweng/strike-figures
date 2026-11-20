/* Drawing cards on a canvas, from the one layout (layout.ts), for the
   preview and for every export: PNG, MP4 and GIF. */
import { FPS } from '../anim/motion';
import { canvasPng, encodeGif, encodeVideo, type FrameSource, svgImage } from '../anim/encode';
import { strikeLogoPaths } from '../engine/decal';
import type { Ground } from '../model/ground';
import type { Scene } from '../model/types';
import { cardScene, contentBox, figureSvg, loopFrames, postScene, resolveFigure } from './figure';
import { CARD_SIZES, type CardLayout, type CardSpec, fitFigure, type FontSpec, GRID, layoutCard, type Measure, type Rect, type TextBlock } from './layout';
import { groundOfPost, type Post, sizeOfPost, type Thread } from './types';

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
  return {
    size: sizeOfPost(thread, post),
    ground: groundOfPost(thread, post),
    side: post.side,
    eyebrow: post.eyebrow,
    headline: post.headline,
    sub: post.sub,
    number: thread.numberCards && n > 1 ? `${index + 1}/${n}` : null,
  };
}

export const layoutOf = (thread: Thread, post: Post, index: number) => layoutCard(specOf(thread, post, index), measure);

let logo: Path2D[] | null = null;

function drawBlock(ctx: CanvasRenderingContext2D, b: TextBlock | null) {
  if (!b) return;
  setFont(ctx, b.font);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  for (const { baseline, line } of b.lines)
    for (const seg of line.segments) {
      if (!seg.text.trim()) continue;
      ctx.fillStyle = seg.hl ? b.hlColor : b.color;
      ctx.fillText(seg.text, b.x + seg.x, baseline);
    }
}

/** Everything on the card but the figure, in card pixels (scale the context first for other sizes). */
export function drawBase(ctx: CanvasRenderingContext2D, L: CardLayout) {
  const { palette: pal, panel: p } = L;
  ctx.fillStyle = pal.ground;
  ctx.fillRect(0, 0, L.width, L.height);

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

  drawBlock(ctx, L.eyebrow);
  drawBlock(ctx, L.headline);
  drawBlock(ctx, L.sub);

  logo ??= strikeLogoPaths().map(d => new Path2D(d));
  ctx.save();
  ctx.translate(L.logo.x + L.logo.w / 2, L.logo.y + L.logo.h / 2);
  ctx.scale(L.logo.w, L.logo.h);
  for (let i = logo.length - 1; i >= 0; i--) {
    ctx.fillStyle = pal.logo[i] ?? pal.logo[0];
    ctx.fill(logo[i]!);
  }
  ctx.restore();

  setFont(ctx, L.word.font);
  ctx.textAlign = 'left';
  ctx.fillStyle = L.word.color;
  ctx.fillText(L.word.text, L.word.x, L.word.baseline);

  if (L.number) {
    setFont(ctx, L.number.font);
    ctx.textAlign = 'right';
    ctx.fillStyle = L.number.color;
    /* canvas adds the letter spacing after the last character too; take it back so the number sits on the edge */
    ctx.fillText(L.number.text, L.number.right + L.number.font.tracking * L.number.font.size, L.number.baseline);
    ctx.textAlign = 'left';
  }
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
}

/** Where a post's figure is drawn on its card (its whole artboard; the panel clips it). */
export function figureRect(L: CardLayout, post: Post): Rect | null {
  const src = resolveFigure(post.figure);
  return src ? fitFigure(L.figureArea, contentBox(src), src.artboard) : null;
}

/** Draw a figure image clipped to the panel. */
export function drawFigure(ctx: CanvasRenderingContext2D, L: CardLayout, img: CanvasImageSource, r: Rect) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(L.panel.x, L.panel.y, L.panel.w, L.panel.h);
  ctx.clip();
  ctx.drawImage(img, r.x, r.y, r.w, r.h);
  ctx.restore();
}

/** The figure at moment t, rasterised at the size it will be drawn. */
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
export const stillSvg = (src: Scene, ground: Ground) =>
  remember(stills, `${sceneId(src)}|${ground}`, () => figureSvg(cardScene(src, ground, { animated: false, duration: null }), 0, 'ts'), 24);

/** The still figure as an image w×h px. */
export function stillImage(src: Scene, ground: Ground, w: number, h: number): Promise<HTMLImageElement> {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const key = `${sceneId(src)}|${ground}|${W}x${H}`;
  const p = remember(images, key, () => svgImage(stillSvg(src, ground), W, H), 48);
  p.catch(() => images.delete(key));
  return p;
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
  drawBase(ctx, L);
  const src = resolveFigure(post.figure);
  const r = figureRect(L, post);
  if (src && r) drawFigure(ctx, L, await stillImage(src, groundOfPost(thread, post), r.w * scale, r.h * scale), r);
  return { canvas, layout: L };
}

export async function cardPng(thread: Thread, post: Post, index: number): Promise<Blob> {
  const { canvas } = await renderCard(thread, post, index, 1);
  return canvasPng(canvas);
}

/** The card, moving: the words and panel drawn once, the figure redrawn each frame. */
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
  drawBase(bctx, L);
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
