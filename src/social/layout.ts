/* The card: one layout, worked out here without a canvas, drawn by
   render.ts for the preview and for every export alike, so what a manager
   sees is what they post.

   It follows Strike's posters: a 50 px grid; the illustration in its own
   panel, a touch off the ground, with the grid drawn faintly inside; a
   headline in Geist Medium set tight (90–96% leading, −3% tracking at size);
   lots of air; and the STRIKE lock-up as the sign-off, with the post's
   number opposite it.

   Landscape (1600×900): an 800 px square panel fills the height on one side
   (50 px margins), a 100 px gutter, then a 600 px slot for the words, which
   keep a cell clear of its outer side (550 px measure). Square (1200×1200):
   the panel spans the width, above or below the words, and takes whatever
   height (500–750 px, on the grid) the words leave. The lock-up signs off
   along the bottom, the post's number opposite it. */
import type { Ground } from '../model/ground';
import { type Line, parseHighlight, ragOf, type Run, strandedOf, widthOf, wrapBalanced, wrapPretty } from './text';

export type CardSize = 'landscape' | 'square';
/** where the illustration sits: left/right on a landscape card, top/bottom on a square one */
export type Side = 'left' | 'right';

export const CARD_SIZES: Record<CardSize, { width: number; height: number; label: string; short: string }> = {
  landscape: { width: 1600, height: 900, label: 'Landscape 16:9', short: '16:9' },
  square: { width: 1200, height: 1200, label: 'Square 1:1', short: '1:1' },
};

export const GRID = 50;

export interface Palette {
  ground: string;
  panel: string;
  grid: string;
  text: string;
  muted: string;
  /** *highlighted* headline words */
  hl: string;
  /** the logo's three chevrons, top to bottom */
  logo: [string, string, string];
}

export const PALETTES: Record<Ground, Palette> = {
  dark: {
    ground: '#0C0C0C',
    panel: '#141416',
    grid: 'rgba(255, 255, 255, 0.045)',
    text: '#F9F9F9',
    muted: '#8A8F98',
    hl: '#10B981',
    logo: ['#34D399', '#10B981', '#059669'],
  },
  light: {
    ground: '#F9F9F9',
    panel: '#F0F0F1',
    grid: 'rgba(12, 12, 12, 0.055)',
    text: '#0C0C0C',
    muted: '#6B6F76',
    hl: '#10B981',
    logo: ['#10B981', '#059669', '#047857'],
  },
  green: {
    ground: '#10B981',
    panel: '#0EA874',
    grid: 'rgba(255, 255, 255, 0.11)',
    text: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.75)',
    hl: '#0C0C0C',
    logo: ['#FFFFFF', 'rgba(255, 255, 255, 0.82)', 'rgba(255, 255, 255, 0.64)'],
  },
};

export interface FontSpec {
  family: 'sans' | 'mono';
  weight: number;
  /** px */
  size: number;
  /** letter spacing, in em */
  tracking: number;
}

/** The width of `text` set in `font`, in px. */
export type Measure = (text: string, font: FontSpec) => number;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextBlock {
  font: FontSpec;
  color: string;
  /** colour of *highlighted* segments */
  hlColor: string;
  x: number;
  lines: { baseline: number; line: Line }[];
}

export interface CardSpec {
  size: CardSize;
  ground: Ground;
  side: Side;
  eyebrow: string;
  headline: string;
  sub: string;
  /** e.g. "2/5", or null for none */
  number: string | null;
}

export interface CardLayout {
  width: number;
  height: number;
  palette: Palette;
  panel: Rect;
  /** where the figure's drawing goes, inside the panel (see fitFigure) */
  figureArea: Rect;
  /** the column the words live in */
  column: Rect;
  eyebrow: TextBlock | null;
  headline: TextBlock | null;
  sub: TextBlock | null;
  logo: Rect;
  word: { x: number; baseline: number; font: FontSpec; text: string; color: string };
  number: { right: number; baseline: number; font: FontSpec; text: string; color: string } | null;
  /** the words didn't fit, even at the smallest size: some were left off */
  overflow: boolean;
}

/* Geist's proportions, per em */
export const CAP = 0.71;
const DESC = 0.2;

const MARGIN = GRID;

export const headlineFont = (size: number): FontSpec => ({ family: 'sans', weight: 500, size, tracking: size >= 64 ? -0.03 : -0.02 });
/** brand: 80 px and up sets at 90%, 45–80 px at 100%; a touch looser as the size falls */
export const headlineLeading = (size: number) => (size >= 80 ? 0.92 : size >= 64 ? 0.95 : 1);

const subFont = (size: number): FontSpec => ({ family: 'sans', weight: 400, size, tracking: -0.01 });
const SUB_LEADING = 1.28;
const eyebrowFont = (size: number): FontSpec => ({ family: 'sans', weight: 500, size, tracking: 0.12 });
const wordFont = (size: number): FontSpec => ({ family: 'sans', weight: 500, size, tracking: 0.3 });
const numberFont = (size: number): FontSpec => ({ family: 'sans', weight: 400, size, tracking: 0.02 });

/* the drawing keeps this share of the panel's shorter side clear all round */
const FIGURE_PAD = 0.11;
/* and is never drawn more than this many times its artboard size (lines thicken as it grows) */
const MAX_FIGURE_SCALE = 3.4;

const inset = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });

/** Where to draw a figure's whole artboard so that its drawing (`box`, in artboard units) sits centred in `area`, as large as fits. */
export function fitFigure(area: Rect, box: { minX: number; minY: number; maxX: number; maxY: number }, artboard: { width: number; height: number }): Rect {
  const bw = Math.max(1, box.maxX - box.minX);
  const bh = Math.max(1, box.maxY - box.minY);
  const k = Math.min(area.w / bw, area.h / bh, MAX_FIGURE_SCALE);
  const cx = area.x + area.w / 2 - ((box.minX + box.maxX) / 2) * k;
  const cy = area.y + area.h / 2 - ((box.minY + box.maxY) / 2) * k;
  return { x: cx, y: cy, w: artboard.width * k, h: artboard.height * k };
}

const snapDown = (v: number) => Math.floor(v / GRID + 1e-6) * GRID;
const snapUp = (v: number) => Math.ceil(v / GRID - 1e-6) * GRID;

interface Scale {
  /** sizes for a headline of a few words (two lines at most), like a big number */
  display: number[];
  /** headline sizes to try, largest first */
  sizes: number[];
  maxLines: number;
  sub: number;
  eyebrow: number;
  word: number;
  number: number;
  logo: number;
}

const SCALES: Record<CardSize, Scale> = {
  landscape: { display: range(150, 98, 4), sizes: range(96, 44, 2), maxLines: 5, sub: 34, eyebrow: 26, word: 29, number: 26, logo: 46 },
  square: { display: range(170, 108, 4), sizes: range(104, 48, 2), maxLines: 4, sub: 38, eyebrow: 28, word: 29, number: 26, logo: 46 },
};

function range(from: number, to: number, step: number) {
  const out: number[] = [];
  for (let v = from; v >= to; v -= step) out.push(v);
  return out;
}

/** The words, stacked from `top`: eyebrow, headline, sub-line. Returns the blocks and how tall they stand (cap top of the first line to below the last line's descenders). */
function stack(
  spec: CardSpec,
  x: number,
  top: number,
  width: number,
  hsize: number,
  scale: Scale,
  palette: Palette,
  measure: Measure,
  subSize = scale.sub,
) {
  const at = (font: FontSpec) => (s: string) => measure(s, font);
  let y = top;
  let bottom = top;
  let eyebrow: TextBlock | null = null;
  let headline: TextBlock | null = null;
  let sub: TextBlock | null = null;
  let tooWide = false;

  const eyebrowText = parseHighlight(spec.eyebrow).map(r => r.text).join('').trim().toUpperCase();
  if (eyebrowText) {
    const font = eyebrowFont(scale.eyebrow);
    const base = y + CAP * font.size;
    const line = wrapBalanced([{ text: eyebrowText.replace(/\n/g, ' '), hl: false }], width, at(font))[0]!;
    eyebrow = { font, color: palette.muted, hlColor: palette.muted, x, lines: [{ baseline: base, line }] };
    bottom = base + DESC * font.size;
    y = base + Math.max(30, 0.5 * hsize);
  }

  const hRuns = trimRuns(parseHighlight(spec.headline));
  let lastBase = y;
  if (hRuns.length) {
    const font = headlineFont(hsize);
    const lines = wrapBalanced(hRuns, width, at(font));
    tooWide ||= widthOf(lines) > width + 0.5;
    const lead = hsize * headlineLeading(hsize);
    const first = y + CAP * hsize;
    headline = { font, color: palette.text, hlColor: palette.hl, x, lines: lines.map((line, i) => ({ baseline: first + i * lead, line })) };
    lastBase = first + (lines.length - 1) * lead;
    bottom = lastBase + DESC * hsize;
    y = lastBase + 0.2 * hsize + 30;
  }

  const sRuns = trimRuns(parseHighlight(spec.sub));
  if (sRuns.length) {
    const font = subFont(subSize);
    /* a sentence reads best filling its measure, narrowed only to save a stranded last word */
    const lines = wrapPretty(sRuns, Math.min(width, subSize * 20), at(font));
    tooWide ||= widthOf(lines) > width + 0.5;
    const first = y + CAP * subSize;
    sub = { font, color: palette.muted, hlColor: palette.text, x, lines: lines.map((line, i) => ({ baseline: first + i * subSize * SUB_LEADING, line })) };
    bottom = first + (lines.length - 1) * subSize * SUB_LEADING + DESC * subSize;
  }
  const lines = headline?.lines.length ?? 0;
  const hl = headline?.lines.map(l => l.line) ?? [];
  return { eyebrow, headline, sub, height: bottom - top, lines, tooWide, rag: ragOf(hl), stranded: strandedOf(hl) };
}

function trimRuns(runs: Run[]): Run[] {
  const text = runs.map(r => r.text).join('');
  return text.trim() ? runs : [];
}

/* A good headline: an even rag (no line under half the longest in its paragraph) and no word stranded on a line of its own. */
const GOOD_RAG = 0.5;
const good = (s: { rag: number; stranded: number }) => s.rag >= GOOD_RAG && s.stranded === 0;
/* how far below the largest fitting size we'll go to set it well */
const GIVE = 0.68;

/* The largest headline size at which the words fit `maxHeight` within the line limit and set well; a few words go bigger still. If no size within reach sets well, the best-set of them. */
function fit(spec: CardSpec, x: number, top: number, width: number, maxHeight: number, scale: Scale, palette: Palette, measure: Measure) {
  /* a few words can go big, on one or two lines */
  for (const size of scale.display) {
    const s = stack(spec, x, top, width, size, scale, palette, measure);
    if (s.lines <= 2 && s.height <= maxHeight && !s.tooWide && good(s)) return { ...s, overflow: false };
  }
  let best: ReturnType<typeof stack> | null = null;
  let firstSize = 0;
  for (const size of scale.sizes) {
    const s = stack(spec, x, top, width, size, scale, palette, measure);
    if (s.lines > scale.maxLines || s.height > maxHeight || s.tooWide) continue;
    firstSize ||= size;
    if (good(s)) return { ...s, overflow: false };
    if (!best || s.stranded < best.stranded || (s.stranded === best.stranded && s.rag > best.rag + 0.05)) best = s;
    if (size < firstSize * GIVE) break;
  }
  if (best) return { ...best, overflow: false };
  /* still too long: a smaller sub-line, then cut lines from the end */
  const min = scale.sizes[scale.sizes.length - 1]!;
  const s = stack(spec, x, top, width, min, scale, palette, measure, Math.round(scale.sub * 0.8));
  if (s.lines <= scale.maxLines && s.height <= maxHeight && !s.tooWide) return { ...s, overflow: false };
  const limit = top + maxHeight;
  const keep = (b: TextBlock | null) => (b ? { ...b, lines: b.lines.filter(l => l.baseline <= limit) } : null);
  return { ...s, headline: keep(s.headline), sub: keep(s.sub), overflow: true };
}

/** Where everything on a card goes. Pure: give it a measure function (canvas measureText, or a fake in tests). */
export function layoutCard(spec: CardSpec, measure: Measure): CardLayout {
  const { width: W, height: H } = CARD_SIZES[spec.size];
  const palette = PALETTES[spec.ground];
  const scale = SCALES[spec.size];
  const word = { text: 'STRIKE', font: wordFont(scale.word), color: palette.text };
  const numFont = numberFont(scale.number);

  /* the lock-up: logo and word, caps centred on the logo */
  const lockup = (x: number, bottom: number) => {
    const s = scale.logo;
    const logo = { x, y: bottom - s, w: s, h: s };
    const baseline = bottom - s / 2 + (CAP * word.font.size) / 2;
    return { logo, word: { ...word, x: x + s * 1.4, baseline } };
  };

  if (spec.size === 'landscape') {
    const P = H - 2 * MARGIN;
    const gutter = 2 * GRID;
    const panelLeft = spec.side === 'left';
    const panel = { x: panelLeft ? MARGIN : W - MARGIN - P, y: MARGIN, w: P, h: P };
    /* the slot beside the panel is 600 px; the words keep a cell clear of its outer side, so a long line never runs to the card's edge (or, on the left, up to the panel) */
    const slot = W - 2 * MARGIN - P - gutter;
    const colX = panelLeft ? panel.x + P + gutter : MARGIN;
    const colW = slot - GRID;
    const footRight = panelLeft ? W - MARGIN : MARGIN + slot;
    const column = { x: colX, y: MARGIN, w: colW, h: P };
    const foot = lockup(colX, MARGIN + P);
    /* the words stop a cell clear of the lock-up */
    const maxHeight = foot.logo.y - GRID - MARGIN;
    const words = fit(spec, colX, MARGIN, colW, maxHeight, scale, palette, measure);
    return {
      width: W,
      height: H,
      palette,
      panel,
      figureArea: inset(panel, FIGURE_PAD * P),
      column,
      eyebrow: words.eyebrow,
      headline: words.headline,
      sub: words.sub,
      logo: foot.logo,
      word: foot.word,
      number: spec.number ? { right: footRight, baseline: foot.word.baseline, font: numFont, text: spec.number, color: palette.muted } : null,
      overflow: words.overflow,
    };
  }

  /* square: words and panel stacked, the lock-up along the bottom */
  const inner = W - 2 * MARGIN;
  const foot = lockup(MARGIN, H - MARGIN);
  const stackBottom = snapDown(foot.logo.y - GRID / 2);
  const textW = inner - 2 * GRID;
  const span = stackBottom - MARGIN - GRID;
  const minPanel = 10 * GRID;
  const maxPanel = 15 * GRID;
  const picFirst = spec.side === 'left';
  const words0 = fit(spec, MARGIN, 0, textW, span - minPanel, scale, palette, measure);
  const panelH = Math.min(maxPanel, Math.max(minPanel, snapDown(span - words0.height)));
  let panel: Rect;
  let textTop: number;
  if (picFirst) {
    panel = { x: MARGIN, y: MARGIN, w: inner, h: panelH };
    textTop = panel.y + panelH + GRID;
  } else {
    textTop = MARGIN;
    const y = Math.max(snapUp(MARGIN + words0.height + GRID), stackBottom - panelH);
    panel = { x: MARGIN, y, w: inner, h: stackBottom - y };
  }
  const words = fit(spec, MARGIN, textTop, textW, span - minPanel, scale, palette, measure);
  return {
    width: W,
    height: H,
    palette,
    panel,
    figureArea: inset(panel, FIGURE_PAD * Math.min(panel.w, panel.h)),
    column: { x: MARGIN, y: textTop, w: textW, h: words.height },
    eyebrow: words.eyebrow,
    headline: words.headline,
    sub: words.sub,
    logo: foot.logo,
    word: foot.word,
    number: spec.number ? { right: W - MARGIN, baseline: foot.word.baseline, font: numFont, text: spec.number, color: palette.muted } : null,
    overflow: words.overflow,
  };
}
