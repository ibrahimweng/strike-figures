/* The card: one layout, worked out here without a canvas, drawn by
   render.ts for the preview and for every export alike, so what someone
   sees is what they post.

   It follows Strike's brand book: a 50 px grid; a headline in Geist Medium
   set by the type chart (90% leading and −3% tracking at 80 px and up, 100%
   and −2% at 45–79 px, 120% and −1% at 25–44 px); lots of air; one picture
   that stays quieter than the words; and the official logo as the sign-off,
   with clear space all round it (the width of the S in STRIKE).

   Three sizes: landscape 1600×900 (16:9), square 1200×1200 (1:1) and
   portrait 1200×1500 (4:5, which Instagram shows at 1080×1350).

   Five kinds of picture:
   - panel: an illustration in its own panel, the grid drawn faintly inside;
   - corner: an illustration drawn large from a corner, bleeding off the
     edges, behind nothing (the words keep their own column);
   - screenshot: an uploaded image in a frame that hugs it, at true colors;
   - photo: an uploaded photo filling the card, toned so the words read;
   - none: the words and the logo alone.

   Landscape cards put the picture beside the words; square and portrait
   cards stack them. The logo signs off bottom left: the full lockup when it
   fits, else the mark alone. The risk line and the post's number sit along
   the bottom with it, or the risk line takes its own row above. Nothing ever
   comes within the logo's clear space. */
import type { Ground } from '../model/ground';
import { type Line, parseHighlight, ragOf, type Run, strandedOf, widthOf, wrapBalanced, wrapPretty } from './text';

export type CardSize = 'landscape' | 'square' | 'portrait';
/** where the picture sits: first (left on a landscape card, top on the others) or second */
export type Side = 'left' | 'right';
export type Visual = 'panel' | 'corner' | 'screenshot' | 'photo' | 'none';
export type LogoChoice = 'auto' | 'lockup' | 'mark';

export const CARD_SIZES: Record<CardSize, { width: number; height: number; label: string; short: string }> = {
  landscape: { width: 1600, height: 900, label: 'Landscape 16:9', short: '16:9' },
  square: { width: 1200, height: 1200, label: 'Square 1:1', short: '1:1' },
  portrait: { width: 1200, height: 1500, label: 'Portrait 4:5', short: '4:5' },
};

export const SIZE_ORDER: CardSize[] = ['landscape', 'square', 'portrait'];

export const GRID = 50;

/** The risk line Strike puts on every ad. */
export const RISK_LINE = 'Options involve risk. Closed beta, invite required.';

export interface Palette {
  ground: string;
  /** the poster gradient, top to bottom, when the ground is one */
  gradient: string[] | null;
  panel: string;
  grid: string;
  text: string;
  muted: string;
  /** *highlighted* headline words */
  hl: string;
  /** which official logo files sign it off (assets/logo) */
  logo: 'green' | 'black' | 'white';
}

export const PALETTES: Record<Ground, Palette> = {
  dark: {
    ground: '#0C0C0C',
    gradient: null,
    panel: '#141416',
    grid: 'rgba(255, 255, 255, 0.045)',
    text: '#F9F9F9',
    muted: '#8A8F98',
    hl: '#10B981',
    logo: 'green',
  },
  light: {
    ground: '#F9F9F9',
    gradient: null,
    panel: '#F0F0F1',
    grid: 'rgba(12, 12, 12, 0.055)',
    text: '#0C0C0C',
    muted: '#6B6F76',
    /* green on a light ground is Mark Deep (5.2:1); Strike Green would be 2.4:1 */
    hl: '#047857',
    logo: 'black',
  },
  /* the brand book's poster gradient: mint at the top, Strike Green, Mark Deep at the foot; white type, highlights in ground black */
  green: {
    ground: '#10B981',
    gradient: ['#60E9A1', '#10B981', '#017857'],
    panel: '#0EA874',
    grid: 'rgba(255, 255, 255, 0.11)',
    text: '#FFFFFF',
    muted: 'rgba(255, 255, 255, 0.8)',
    hl: '#0C0C0C',
    logo: 'white',
  },
};

/** Words on a photo: white, the highlight in Strike Green, the logo flat white. */
export const PHOTO_PALETTE: Palette = {
  ground: '#0C0C0C',
  gradient: null,
  panel: '#0C0C0C',
  grid: 'rgba(255, 255, 255, 0)',
  text: '#FFFFFF',
  muted: 'rgba(255, 255, 255, 0.78)',
  hl: '#10B981',
  logo: 'white',
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
  /** color of *highlighted* segments */
  hlColor: string;
  x: number;
  /** 'right': x is the right edge */
  align?: 'left' | 'right';
  lines: { baseline: number; line: Line }[];
}

export interface CardSpec {
  size: CardSize;
  ground: Ground;
  side: Side;
  visual: Visual;
  /** the picture's shape (width / height): a screenshot's crop. null when unknown or not needed */
  aspect: number | null;
  logo: LogoChoice;
  eyebrow: string;
  headline: string;
  sub: string;
  /** e.g. "2/5", or null for none */
  number: string | null;
  /** show the risk line */
  risk: boolean;
}

export interface LogoPlace extends Rect {
  kind: 'lockup' | 'mark';
  /** the clear space kept round it, px */
  clear: number;
}

export interface CardLayout {
  width: number;
  height: number;
  palette: Palette;
  visual: Visual;
  /** the illustration's panel (panel pictures only) */
  panel: Rect | null;
  /** where the figure's drawing goes (see fitFigure), and what it is clipped to */
  figureArea: Rect | null;
  figureClip: Rect | null;
  /** how strongly the figure is drawn: corner figures sit back */
  figureOpacity: number;
  /** a screenshot's frame, hugging its shape */
  frame: Rect | null;
  /** an uploaded photo fills the card */
  photo: boolean;
  /** the column the words live in */
  column: Rect;
  eyebrow: TextBlock | null;
  headline: TextBlock | null;
  sub: TextBlock | null;
  logo: LogoPlace;
  number: TextBlock | null;
  risk: TextBlock | null;
  /** the logo had to be the mark alone: not enough room for the lockup */
  logoFellBack: boolean;
  /** the words didn't fit, even at the smallest size: some were left off */
  overflow: boolean;
}

/* Geist's proportions, per em */
export const CAP = 0.71;
const DESC = 0.2;

const MARGIN = GRID;

/* the official lockup is 4.34 times as wide as it is tall; the mark is square */
export const LOCKUP_RATIO = 547.19 / 126.18;
/** clear space round the logo: the width of the S in STRIKE, 0.37 of the mark's height */
export const CLEAR = 0.37;
const LOGO_H = 46;

/* the type chart, screen sizes: line height and tracking by size */
export const leadingFor = (size: number) => (size >= 80 ? 0.9 : size >= 45 ? 1 : size >= 25 ? 1.2 : size >= 15 ? 1.3 : 1.35);
export const trackingFor = (size: number) => (size >= 80 ? -0.03 : size >= 45 ? -0.02 : size >= 25 ? -0.01 : size >= 15 ? 0 : 0.01);

export const headlineFont = (size: number): FontSpec => ({ family: 'sans', weight: 500, size, tracking: trackingFor(size) });
/** brand: 80 px and up sets at 90%, 45–79 px at 100%, 25–44 px at 120% */
export const headlineLeading = (size: number) => leadingFor(size);

const subFont = (size: number): FontSpec => ({ family: 'sans', weight: 400, size, tracking: trackingFor(size) });
const eyebrowFont = (size: number): FontSpec => ({ family: 'sans', weight: 500, size, tracking: trackingFor(size) });
const numberFont = (size: number): FontSpec => ({ family: 'sans', weight: 400, size, tracking: trackingFor(size) });
const riskFont = (size: number): FontSpec => ({ family: 'sans', weight: 400, size, tracking: trackingFor(size) });

/* the drawing keeps this share of the panel's shorter side clear all round */
const FIGURE_PAD = 0.11;
/* and is never drawn more than this many times its artboard size (lines thicken as it grows) */
const MAX_FIGURE_SCALE = 3.4;

const inset = (r: Rect, d: number): Rect => ({ x: r.x + d, y: r.y + d, w: r.w - 2 * d, h: r.h - 2 * d });

/** Where to draw a figure's whole artboard so that its drawing (`box`, in artboard units) sits centered in `area`, as large as fits. */
export function fitFigure(area: Rect, box: { minX: number; minY: number; maxX: number; maxY: number }, artboard: { width: number; height: number }, maxScale = MAX_FIGURE_SCALE): Rect {
  const bw = Math.max(1, box.maxX - box.minX);
  const bh = Math.max(1, box.maxY - box.minY);
  const k = Math.min(area.w / bw, area.h / bh, maxScale);
  const cx = area.x + area.w / 2 - ((box.minX + box.maxX) / 2) * k;
  const cy = area.y + area.h / 2 - ((box.minY + box.maxY) / 2) * k;
  return { x: cx, y: cy, w: artboard.width * k, h: artboard.height * k };
}

/** The largest rect of shape `aspect` (w/h) inside `area`, centered in it. */
export function fitAspect(area: Rect, aspect: number): Rect {
  const a = Math.max(0.2, Math.min(5, aspect || 1));
  let w = area.w;
  let h = w / a;
  if (h > area.h) {
    h = area.h;
    w = h * a;
  }
  return { x: area.x + (area.w - w) / 2, y: area.y + (area.h - h) / 2, w, h };
}

/** Move the words down by dy. */
const shiftBlock = (b: TextBlock | null, dy: number): TextBlock | null => (b ? { ...b, lines: b.lines.map(l => ({ ...l, baseline: l.baseline + dy })) } : null);
const shiftWords = <T extends { eyebrow: TextBlock | null; headline: TextBlock | null; sub: TextBlock | null }>(w: T, dy: number): T => ({ ...w, eyebrow: shiftBlock(w.eyebrow, dy), headline: shiftBlock(w.headline, dy), sub: shiftBlock(w.sub, dy) });

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
  number: number;
  risk: number;
}

const SCALES: Record<CardSize, Scale> = {
  landscape: { display: range(150, 98, 4), sizes: range(96, 44, 2), maxLines: 5, sub: 34, eyebrow: 28, number: 26, risk: 24 },
  square: { display: range(170, 108, 4), sizes: range(104, 48, 2), maxLines: 4, sub: 38, eyebrow: 30, number: 26, risk: 24 },
  portrait: { display: range(170, 108, 4), sizes: range(104, 48, 2), maxLines: 5, sub: 38, eyebrow: 30, number: 26, risk: 24 },
};

/* with no picture beside them, the words are the picture: they set larger, on more lines */
const TYPE_ONLY: Record<CardSize, Partial<Scale>> = {
  landscape: { sizes: range(130, 56, 2), maxLines: 4 },
  square: { display: range(190, 120, 4), sizes: range(140, 60, 2), maxLines: 5 },
  portrait: { display: range(190, 120, 4), sizes: range(140, 60, 2), maxLines: 6 },
};

function range(from: number, to: number, step: number) {
  const out: number[] = [];
  for (let v = from; v >= to; v -= step) out.push(v);
  return out;
}

/** The words, stacked from `top`: eyebrow, headline, sub-line. Returns the blocks and how tall they stand (cap top of the first line to below the last line's descenders). */
function stack(spec: CardSpec, x: number, top: number, width: number, hsize: number, scale: Scale, palette: Palette, measure: Measure, subSize = scale.sub) {
  const at = (font: FontSpec) => (s: string) => measure(s, font);
  let y = top;
  let bottom = top;
  let eyebrow: TextBlock | null = null;
  let headline: TextBlock | null = null;
  let sub: TextBlock | null = null;
  let tooWide = false;

  /* the small line above is set as typed: sentence case, like every label */
  const eyebrowText = parseHighlight(spec.eyebrow).map(r => r.text).join('').replace(/\s+/g, ' ').trim();
  if (eyebrowText) {
    const font = eyebrowFont(scale.eyebrow);
    const base = y + CAP * font.size;
    const line = wrapBalanced([{ text: eyebrowText, hl: false }], width, at(font))[0]!;
    tooWide ||= line.width > width + 0.5;
    eyebrow = { font, color: palette.muted, hlColor: palette.muted, x, lines: [{ baseline: base, line }] };
    bottom = base + DESC * font.size;
    y = base + Math.max(30, 0.5 * hsize);
  }

  const hRuns = trimRuns(parseHighlight(spec.headline));
  if (hRuns.length) {
    const font = headlineFont(hsize);
    const lines = wrapBalanced(hRuns, width, at(font));
    tooWide ||= widthOf(lines) > width + 0.5;
    const lead = hsize * headlineLeading(hsize);
    const first = y + CAP * hsize;
    headline = { font, color: palette.text, hlColor: palette.hl, x, lines: lines.map((line, i) => ({ baseline: first + i * lead, line })) };
    const lastBase = first + (lines.length - 1) * lead;
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
    const lead = subSize * leadingFor(subSize);
    sub = { font, color: palette.muted, hlColor: palette.text, x, lines: lines.map((line, i) => ({ baseline: first + i * lead, line })) };
    bottom = first + (lines.length - 1) * lead + DESC * subSize;
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

type Words = ReturnType<typeof stack> & { overflow: boolean };

/* The largest headline size at which the words fit `maxHeight` within the line limit and set well; a few words go bigger still. If no size within reach sets well, the best-set of them. */
function fit(spec: CardSpec, x: number, top: number, width: number, maxHeight: number, scale: Scale, palette: Palette, measure: Measure, cap = Infinity): Words {
  /* a few words can go big, on one or two lines */
  for (const size of scale.display) {
    if (size > cap) continue;
    const s = stack(spec, x, top, width, size, scale, palette, measure);
    if (s.lines <= 2 && s.height <= maxHeight && !s.tooWide && good(s)) return { ...s, overflow: false };
  }
  let best: ReturnType<typeof stack> | null = null;
  let firstSize = 0;
  for (const size of scale.sizes) {
    if (size > cap) continue;
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

/* ---------- the foot: logo, risk line, number ---------- */

interface Foot {
  logo: LogoPlace;
  number: TextBlock | null;
  risk: TextBlock | null;
  /** nothing above the foot may come lower than this */
  top: number;
  fellBack: boolean;
}

/**
 * The sign-off along the bottom of `row` (its x, width and bottom edge): the logo at the left, the number at the right,
 * the risk line between them when it fits, else on its own row above. The lockup when there is room for it, else the mark.
 */
function foot(spec: CardSpec, row: { x: number; w: number; bottom: number }, scale: Scale, palette: Palette, measure: Measure, opts: { numberAtTop?: { right: number; top: number } } = {}): Foot {
  const h = LOGO_H;
  const clear = Math.ceil(CLEAR * h);
  const nFont = numberFont(scale.number);
  const numW = spec.number && !opts.numberAtTop ? measure(spec.number, nFont) : 0;
  const rFont = riskFont(scale.risk);
  const riskW = spec.risk ? measure(RISK_LINE, rFont) : 0;
  const lockupW = h * LOCKUP_RATIO;
  /* the full lockup when it fits beside the number, keeping clear space; the mark alone otherwise */
  const lockupFits = lockupW + clear + (numW ? numW + GRID / 2 : 0) <= row.w;
  const kind: 'lockup' | 'mark' = spec.logo === 'mark' ? 'mark' : spec.logo === 'lockup' || lockupFits ? 'lockup' : 'mark';
  const fellBack = spec.logo === 'auto' && kind === 'mark';
  const w = kind === 'lockup' ? lockupW : h;
  const logo: LogoPlace = { kind, x: row.x, y: row.bottom - h, w, h, clear };
  const mid = logo.y + h / 2;

  let number: TextBlock | null = null;
  if (spec.number) {
    if (opts.numberAtTop) {
      const base = opts.numberAtTop.top + CAP * nFont.size;
      number = { font: nFont, color: palette.muted, hlColor: palette.muted, x: opts.numberAtTop.right, align: 'right', lines: [{ baseline: base, line: lineOf(spec.number, numW || measure(spec.number, nFont)) }] };
    } else {
      number = { font: nFont, color: palette.muted, hlColor: palette.muted, x: row.x + row.w, align: 'right', lines: [{ baseline: mid + (CAP * nFont.size) / 2, line: lineOf(spec.number, numW) }] };
    }
  }

  let risk: TextBlock | null = null;
  let top = logo.y - clear;
  if (spec.risk) {
    const left = logo.x + w + clear + GRID / 2;
    const right = row.x + row.w - (numW ? numW + GRID / 2 : 0);
    if (riskW <= right - left) {
      /* on the logo's row, set to the right edge before the number */
      risk = { font: rFont, color: palette.muted, hlColor: palette.muted, x: right, align: 'right', lines: [{ baseline: mid + (CAP * rFont.size) / 2, line: lineOf(RISK_LINE, riskW) }] };
    } else {
      /* its own row above the logo, wrapped to the row's width */
      const lines = wrapBalanced([{ text: RISK_LINE, hl: false }], row.w, s => measure(s, rFont));
      const lead = rFont.size * leadingFor(rFont.size);
      const lastBase = logo.y - clear - DESC * rFont.size;
      const firstBase = lastBase - (lines.length - 1) * lead;
      risk = { font: rFont, color: palette.muted, hlColor: palette.muted, x: row.x, lines: lines.map((line, i) => ({ baseline: firstBase + i * lead, line })) };
      top = firstBase - CAP * rFont.size - clear;
    }
  }
  return { logo, number, risk, top, fellBack };
}

function lineOf(text: string, width: number): Line {
  return { text, width, segments: [{ text, hl: false, x: 0 }], para: 0 };
}

/* ---------- the card ---------- */

/** Where everything on a card goes. Pure: give it a measure function (canvas measureText, or a fake in tests). */
export function layoutCard(spec: CardSpec, measure: Measure): CardLayout {
  const { width: W, height: H } = CARD_SIZES[spec.size];
  const palette = spec.visual === 'photo' ? PHOTO_PALETTE : PALETTES[spec.ground];
  const scale = SCALES[spec.size];
  const base = { width: W, height: H, palette, visual: spec.visual };
  const wide = spec.size === 'landscape';
  const pictureFirst = spec.side === 'left';

  /* ---- text only, or text on a photo: the words at the top, the logo at the foot ---- */
  if (spec.visual === 'none' || spec.visual === 'photo') {
    const f = foot(spec, { x: MARGIN, w: W - 2 * MARGIN, bottom: H - MARGIN }, scale, palette, measure);
    const colW = Math.min(W - 2 * MARGIN - (wide ? 4 * GRID : GRID), wide ? 1100 : 1000);
    const maxHeight = f.top - 2 * GRID - MARGIN;
    let words = fit(spec, MARGIN, MARGIN, colW, maxHeight, { ...scale, ...TYPE_ONLY[spec.size] }, palette, measure);
    /* the words at the foot instead, two cells above the logo, as on the brand book's tagline poster */
    if (spec.side === 'right' && !words.overflow) words = shiftWords(words, Math.max(0, f.top - 2 * GRID - MARGIN - words.height));
    return {
      ...base,
      panel: null,
      figureArea: null,
      figureClip: null,
      figureOpacity: 1,
      frame: null,
      photo: spec.visual === 'photo',
      column: { x: MARGIN, y: MARGIN, w: colW, h: words.height },
      eyebrow: words.eyebrow,
      headline: words.headline,
      sub: words.sub,
      logo: f.logo,
      number: f.number,
      risk: f.risk,
      logoFellBack: f.fellBack,
      overflow: words.overflow,
    };
  }

  /* ---- a tall screenshot on a square or portrait card: beside the words, at full height ---- */
  if (spec.visual === 'screenshot' && !wide && (spec.aspect ?? 1.6) < 0.8) {
    const f = foot(spec, { x: MARGIN, w: W - 2 * MARGIN, bottom: H - MARGIN }, scale, palette, measure);
    const bottom = snapDown(f.top - GRID / 2);
    const area = { x: 0, y: MARGIN, w: Math.round((W - 2 * MARGIN) * 0.5), h: bottom - MARGIN };
    const box = fitAspect(area, spec.aspect ?? 0.6);
    const picW = Math.max(snapUp(box.w), 8 * GRID);
    const pic = { x: pictureFirst ? MARGIN : W - MARGIN - picW, y: MARGIN, w: picW, h: bottom - MARGIN };
    const gutter = 2 * GRID;
    const colX = pictureFirst ? pic.x + pic.w + gutter : MARGIN;
    const colW = W - 2 * MARGIN - picW - gutter;
    const words = fit(spec, colX, MARGIN, colW, bottom - MARGIN, scale, palette, measure);
    const frame = fitAspect(pic, spec.aspect ?? 0.6);
    return {
      ...base,
      panel: null,
      figureArea: null,
      figureClip: null,
      figureOpacity: 1,
      frame: { ...frame, y: MARGIN },
      photo: false,
      column: { x: colX, y: MARGIN, w: colW, h: words.height },
      eyebrow: words.eyebrow,
      headline: words.headline,
      sub: words.sub,
      logo: f.logo,
      number: f.number,
      risk: f.risk,
      logoFellBack: f.fellBack,
      overflow: words.overflow,
    };
  }

  /* ---- corner: the words in a column, the illustration large from the far corner ---- */
  if (spec.visual === 'corner') {
    const colW = wide ? 700 : W - 2 * MARGIN - 4 * GRID;
    /* the foot keeps to the left, so the far corner belongs to the drawing */
    const f = foot(spec, { x: MARGIN, w: wide ? colW : 10 * GRID, bottom: H - MARGIN }, scale, palette, measure, {
      numberAtTop: { right: W - MARGIN, top: MARGIN },
    });
    if (wide) {
      const maxHeight = f.top - GRID / 2 - MARGIN;
      const words = fit(spec, MARGIN, MARGIN, colW, maxHeight, scale, palette, measure);
      /* the drawing starts a cell past the words and runs off the right and bottom edges */
      const x0 = MARGIN + colW + GRID;
      const area = { x: x0, y: Math.round(H * 0.16), w: Math.round((W - x0) * 1.3), h: Math.round(H * 1.02) };
      return {
        ...base,
        panel: null,
        figureArea: area,
        figureClip: { x: x0 - GRID / 2, y: 0, w: W - x0 + GRID / 2, h: H },
        figureOpacity: 0.72,
        frame: null,
        photo: false,
        column: { x: MARGIN, y: MARGIN, w: colW, h: words.height },
        eyebrow: words.eyebrow,
        headline: words.headline,
        sub: words.sub,
        logo: f.logo,
        number: f.number,
        risk: f.risk,
        logoFellBack: f.fellBack,
        overflow: words.overflow,
      };
    }
    /* square and portrait: the words at the top, the drawing below them, running off the bottom and right */
    const words = fit(spec, MARGIN, MARGIN, colW, Math.round(H * 0.42), scale, palette, measure);
    const y0 = snapUp(MARGIN + words.height + GRID);
    const x0 = MARGIN + 10 * GRID + GRID / 2;
    const area = { x: x0, y: y0, w: Math.round((W - x0) * 1.35), h: Math.round((H - y0) * 1.15) };
    return {
      ...base,
      panel: null,
      figureArea: area,
      /* the drawing keeps right of the foot: the logo and the risk line stay clear */
      figureClip: { x: x0, y: y0 - GRID / 2, w: W - x0, h: H - (y0 - GRID / 2) },
      figureOpacity: 0.72,
      frame: null,
      photo: false,
      column: { x: MARGIN, y: MARGIN, w: colW, h: words.height },
      eyebrow: words.eyebrow,
      headline: words.headline,
      sub: words.sub,
      logo: f.logo,
      number: f.number,
      risk: f.risk,
      logoFellBack: f.fellBack,
      overflow: words.overflow,
    };
  }

  /* ---- panel or screenshot, beside the words (landscape) ---- */
  const shot = spec.visual === 'screenshot';
  if (wide) {
    const P = H - 2 * MARGIN;
    const gutter = 2 * GRID;
    /* a panel is square; a screenshot's frame takes the shape of the image, up to 900 px wide */
    let pic: Rect;
    if (shot) {
      const box = fitAspect({ x: 0, y: MARGIN, w: 900, h: P }, spec.aspect ?? 16 / 10);
      const w = Math.max(snapUp(box.w), 400);
      pic = { x: pictureFirst ? MARGIN : W - MARGIN - w, y: MARGIN, w, h: P };
    } else {
      pic = { x: pictureFirst ? MARGIN : W - MARGIN - P, y: MARGIN, w: P, h: P };
    }
    const slot = W - 2 * MARGIN - pic.w - gutter;
    const colX = pictureFirst ? pic.x + pic.w + gutter : MARGIN;
    const colW = slot - GRID;
    const f = foot(spec, { x: colX, w: pictureFirst ? W - MARGIN - colX : slot, bottom: MARGIN + P }, scale, palette, measure);
    const maxHeight = f.top - GRID / 2 - MARGIN;
    const words = fit(spec, colX, MARGIN, colW, maxHeight, scale, palette, measure);
    const frame = shot ? fitAspect(pic, spec.aspect ?? 16 / 10) : null;
    return {
      ...base,
      panel: shot ? null : pic,
      figureArea: shot ? null : inset(pic, FIGURE_PAD * P),
      figureClip: shot ? null : pic,
      figureOpacity: 1,
      frame,
      photo: false,
      column: { x: colX, y: MARGIN, w: colW, h: P },
      eyebrow: words.eyebrow,
      headline: words.headline,
      sub: words.sub,
      logo: f.logo,
      number: f.number,
      risk: f.risk,
      logoFellBack: f.fellBack,
      overflow: words.overflow,
    };
  }

  /* ---- panel or screenshot, stacked with the words (square, portrait) ---- */
  const inner = W - 2 * MARGIN;
  const f = foot(spec, { x: MARGIN, w: inner, bottom: H - MARGIN }, scale, palette, measure);
  const stackBottom = snapDown(f.top - GRID / 2);
  const textW = inner - 2 * GRID;
  const span = stackBottom - MARGIN - GRID;
  const tall = spec.size === 'portrait';
  const minPanel = (tall ? 12 : 10) * GRID;
  const maxPanel = (tall ? 20 : 15) * GRID;
  /* a screenshot asks for the height its shape needs at full width, within limits */
  const want = shot ? Math.min(maxPanel, snapUp(inner / Math.max(0.2, spec.aspect ?? 16 / 10))) : maxPanel;
  const words0 = fit(spec, MARGIN, 0, textW, span - minPanel, scale, palette, measure);
  const panelH = Math.min(want, Math.max(minPanel, snapDown(span - words0.height)));
  let pic: Rect;
  let words: Words;
  if (pictureFirst) {
    pic = { x: MARGIN, y: MARGIN, w: inner, h: panelH };
    words = fit(spec, MARGIN, pic.y + panelH + GRID, textW, stackBottom - (pic.y + panelH + GRID), scale, palette, measure);
  } else {
    words = fit(spec, MARGIN, MARGIN, textW, span - minPanel, scale, palette, measure);
    const y = Math.max(snapUp(MARGIN + words.height + GRID), stackBottom - panelH);
    pic = { x: MARGIN, y, w: inner, h: stackBottom - y };
  }
  const frame = shot ? fitAspect(pic, spec.aspect ?? 16 / 10) : null;
  return {
    ...base,
    panel: shot ? null : pic,
    figureArea: shot ? null : inset(pic, FIGURE_PAD * Math.min(pic.w, pic.h)),
    figureClip: shot ? null : pic,
    figureOpacity: 1,
    frame,
    photo: false,
    column: { x: MARGIN, y: pictureFirst ? pic.y + pic.h + GRID : MARGIN, w: textW, h: words.height },
    eyebrow: words.eyebrow,
    headline: words.headline,
    sub: words.sub,
    logo: f.logo,
    number: f.number,
    risk: f.risk,
    logoFellBack: f.fellBack,
    overflow: words.overflow,
  };
}

/** Every rect on a card that must stay clear of the logo's clear space: words, picture, number, risk line. */
export function occupied(L: CardLayout, measureLine = (b: TextBlock, i: number) => b.lines[i]!.line.width): Rect[] {
  const out: Rect[] = [];
  for (const b of [L.eyebrow, L.headline, L.sub, L.number, L.risk]) {
    if (!b) continue;
    b.lines.forEach((l, i) => {
      const w = measureLine(b, i);
      const x = b.align === 'right' ? b.x - w : b.x;
      out.push({ x, y: l.baseline - CAP * b.font.size, w, h: (CAP + DESC) * b.font.size });
    });
  }
  if (L.panel) out.push(L.panel);
  if (L.frame) out.push(L.frame);
  return out;
}
