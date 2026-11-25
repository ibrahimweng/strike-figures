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
export type Visual = 'panel' | 'corner' | 'screenshot' | 'photo' | 'chart' | 'none';
/** the standard layout, or one of the brand book's poster layouts: tagline (picture above, logo over the words), hero (one huge number), cover (the logo large, the words small), card (the words on a white card over the picture), split (the headline in two parts round the picture) */
export type PostLayout = 'standard' | 'tagline' | 'hero' | 'cover' | 'card' | 'split';
export const LAYOUTS: PostLayout[] = ['standard', 'tagline', 'hero', 'cover', 'card', 'split'];
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
  family: 'sans' | 'mono' | 'pixel';
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
  /** 'right': x is the right edge; 'center': x is the middle */
  align?: 'left' | 'right' | 'center';
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
  /** the standard layout, or one of the poster layouts */
  layout: PostLayout;
  /** big numbers in Geist Pixel Circle */
  pixel: boolean;
}

export interface LogoPlace extends Rect {
  kind: 'lockup' | 'mark';
  /** the clear space kept round it, px */
  clear: number;
}

export interface CardLayout {
  width: number;
  height: number;
  ground: Ground;
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
  /** the words on a white card over the picture (card layout) */
  card: Rect | null;
  /** where a chart draws when it has no panel of its own (hero, split), and whether it sits back behind the words */
  chartArea: Rect | null;
  chartGhost: boolean;
  /** the hero's big number */
  big: TextBlock | null;
  /** where rays meet (split): the logo sits on it */
  hub: { x: number; y: number } | null;
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
  const base = { width: W, height: H, ground: spec.ground, palette, visual: spec.visual, card: null, chartArea: null, chartGhost: false, big: null, hub: null };
  if (spec.layout !== 'standard') return posterLayout(spec, measure);
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
      const x = b.align === 'right' ? b.x - w : b.align === 'center' ? b.x - w / 2 : b.x;
      out.push({ x, y: l.baseline - CAP * b.font.size, w, h: (CAP + DESC) * b.font.size });
    });
  }
  if (L.big)
    for (const l of L.big.lines) {
      const w = l.line.width;
      const x = L.big.align === 'right' ? L.big.x - w : L.big.align === 'center' ? L.big.x - w / 2 : L.big.x;
      out.push({ x, y: l.baseline - CAP * L.big.font.size, w, h: CAP * L.big.font.size });
    }
  if (L.panel) out.push(L.panel);
  if (L.frame && !L.card) out.push(L.frame);
  return out;
}

/* ---------- the brand book's poster layouts ---------- */

/** One block of words at one size, wrapped to `width`, from `top`. */
function setBlock(runs: Run[], font: FontSpec, x: number, top: number, width: number, color: string, hlColor: string, measure: Measure, align: TextBlock['align'] = 'left') {
  const lines = runs.length ? wrapBalanced(runs, width, s => measure(s, font)) : [];
  const first = top + CAP * font.size;
  const lead = font.size * leadingFor(font.size);
  const block: TextBlock = { font, color, hlColor, x, align, lines: lines.map((line, i) => ({ baseline: first + i * lead, line })) };
  const height = lines.length ? first + (lines.length - 1) * lead + DESC * font.size - top : 0;
  return { block: lines.length ? block : null, height, lines: lines.length, tooWide: widthOf(lines) > width + 0.5, rag: ragOf(lines) };
}

const runsOf = (s: string) => trimRuns(parseHighlight(s));

/** The foot of a centred poster: the risk line centred along the bottom, the logo centred above it, the number top right. */
function centerFoot(spec: CardSpec, W: number, H: number, scale: Scale, palette: Palette, measure: Measure, kind: 'lockup' | 'mark'): Foot {
  const h = LOGO_H;
  const clear = Math.ceil(CLEAR * h);
  let bottom = H - MARGIN;
  let risk: TextBlock | null = null;
  if (spec.risk) {
    const rFont = riskFont(scale.risk);
    const lines = wrapBalanced([{ text: RISK_LINE, hl: false }], W - 2 * MARGIN, s => measure(s, rFont));
    const lead = rFont.size * leadingFor(rFont.size);
    const lastBase = bottom - DESC * rFont.size;
    const firstBase = lastBase - (lines.length - 1) * lead;
    risk = { font: rFont, color: palette.muted, hlColor: palette.muted, x: W / 2, align: 'center', lines: lines.map((line, i) => ({ baseline: firstBase + i * lead, line })) };
    bottom = firstBase - CAP * rFont.size - clear - GRID / 4;
  }
  const w = kind === 'lockup' ? h * LOCKUP_RATIO : h;
  const logo: LogoPlace = { kind, x: W / 2 - w / 2, y: bottom - h, w, h, clear };
  return { logo, number: topNumber(spec, W, scale, palette, measure), risk, top: logo.y - clear, fellBack: false };
}

/** The post's number ("2/5"), top right. */
function topNumber(spec: CardSpec, W: number, scale: Scale, palette: Palette, measure: Measure): TextBlock | null {
  if (!spec.number) return null;
  const nFont = numberFont(scale.number);
  return { font: nFont, color: palette.muted, hlColor: palette.muted, x: W - MARGIN, align: 'right', lines: [{ baseline: MARGIN + CAP * nFont.size, line: lineOf(spec.number, measure(spec.number, nFont)) }] };
}

/** The headline's number, with the words before and after it: "Listed options are closed *81%* of the week." */
export function splitHero(headline: string): { before: string; num: string; after: string } | null {
  const runs = parseHighlight(headline);
  const plain = runs.map(r => r.text).join('');
  /* the highlighted phrase when it holds a number, else the first number */
  let at = -1;
  let num = '';
  let i = 0;
  for (const r of runs) {
    if (r.hl && /\d/.test(r.text) && at < 0) {
      at = i;
      num = r.text;
    }
    i += r.text.length;
  }
  if (at < 0) {
    const m = /[$€£]?\d[\d,.]*\s?(?:%|[kKmMbB]\b|x\b)?/.exec(plain);
    if (!m) return null;
    at = m.index;
    num = m[0];
  }
  const clean = (s: string) => s.replace(/\s+/g, ' ').trim();
  return { before: clean(plain.slice(0, at)), num: clean(num), after: clean(plain.slice(at + num.length)).replace(/^[,.;:]\s*/, '') };
}

/** The headline in two parts for the split layout: up to the first comma or line break, and the rest. */
export function splitTwo(headline: string): [string, string] {
  const plain = parseHighlight(headline)
    .map(r => (r.hl ? `*${r.text}*` : r.text))
    .join('');
  const nl = plain.indexOf('\n');
  if (nl > 0) return [plain.slice(0, nl).trim(), plain.slice(nl + 1).trim()];
  const comma = plain.search(/,\s/);
  if (comma > 0 && comma < plain.length - 3) return [plain.slice(0, comma + 1).trim(), plain.slice(comma + 1).trim()];
  const words = plain.split(/\s+/);
  const k = Math.ceil(words.length / 2);
  return [words.slice(0, k).join(' '), words.slice(k).join(' ')];
}

/** Sizes to try for poster words, largest first. */
const posterSizes = (size: CardSize) => (size === 'landscape' ? range(120, 48, 2) : range(150, 52, 2));

const emptyLayout = (spec: CardSpec, palette: Palette, logo: LogoPlace) => ({
  width: CARD_SIZES[spec.size].width,
  height: CARD_SIZES[spec.size].height,
  ground: spec.ground,
  palette,
  visual: spec.visual,
  panel: null as Rect | null,
  figureArea: null as Rect | null,
  figureClip: null as Rect | null,
  figureOpacity: 1,
  frame: null as Rect | null,
  photo: spec.visual === 'photo',
  column: { x: MARGIN, y: MARGIN, w: 0, h: 0 } as Rect,
  eyebrow: null as TextBlock | null,
  headline: null as TextBlock | null,
  sub: null as TextBlock | null,
  logo,
  number: null as TextBlock | null,
  risk: null as TextBlock | null,
  card: null as Rect | null,
  chartArea: null as Rect | null,
  chartGhost: false,
  big: null as TextBlock | null,
  hub: null as { x: number; y: number } | null,
  logoFellBack: false,
  overflow: false,
});

function posterLayout(spec: CardSpec, measure: Measure): CardLayout {
  switch (spec.layout) {
    case 'tagline':
      return taglineLayout(spec, measure);
    case 'hero':
      return heroLayout(spec, measure);
    case 'cover':
      return coverLayout(spec, measure);
    case 'card':
      return cardLayout(spec, measure);
    case 'split':
      return splitLayout(spec, measure);
    default:
      return layoutCard({ ...spec, layout: 'standard' }, measure);
  }
}

/* Tagline (4.9): the picture fills the top and runs off it; the logo signs on above the words at the foot. */
function taglineLayout(spec: CardSpec, measure: Measure): CardLayout {
  const { width: W, height: H } = CARD_SIZES[spec.size];
  const palette = spec.visual === 'photo' ? PHOTO_PALETTE : PALETTES[spec.ground];
  const scale = SCALES[spec.size];
  const wide = spec.size === 'landscape';
  const inner = W - 2 * MARGIN;
  /* the risk line along the bottom; the number top right */
  let bottom = H - MARGIN;
  let risk: TextBlock | null = null;
  const clear = Math.ceil(CLEAR * LOGO_H);
  if (spec.risk) {
    const rFont = riskFont(scale.risk);
    const lines = wrapBalanced([{ text: RISK_LINE, hl: false }], inner, s => measure(s, rFont));
    const lead = rFont.size * leadingFor(rFont.size);
    const lastBase = bottom - DESC * rFont.size;
    const firstBase = lastBase - (lines.length - 1) * lead;
    risk = { font: rFont, color: palette.muted, hlColor: palette.muted, x: MARGIN, lines: lines.map((line, i) => ({ baseline: firstBase + i * lead, line })) };
    bottom = firstBase - CAP * rFont.size - GRID;
  }
  /* the words, as large as fit in the lower part */
  const colW = wide ? Math.min(inner, 1100) : inner - GRID;
  const words = fit(spec, MARGIN, 0, colW, Math.round(H * (wide ? 0.42 : 0.36)), { ...scale, ...TYPE_ONLY[spec.size] }, palette, measure);
  const wordsTop = bottom - words.height;
  const w = shiftWords(words, wordsTop);
  /* the logo above the words, a clear space and a half off them */
  const kind: 'lockup' | 'mark' = spec.logo === 'mark' ? 'mark' : 'lockup';
  const lw = kind === 'lockup' ? LOGO_H * LOCKUP_RATIO : LOGO_H;
  const gap = Math.max(clear * 1.5, (w.headline?.font.size ?? 60) * 0.32);
  const logo: LogoPlace = { kind, x: MARGIN, y: wordsTop - gap - LOGO_H, w: lw, h: LOGO_H, clear };
  const picBottom = logo.y - clear - GRID / 2;
  const L = emptyLayout(spec, palette, logo);
  L.eyebrow = w.eyebrow;
  L.headline = w.headline;
  L.sub = w.sub;
  L.risk = risk;
  L.number = topNumber(spec, W, scale, palette, measure);
  L.overflow = words.overflow;
  L.column = { x: MARGIN, y: wordsTop, w: colW, h: words.height };
  const top = L.number ? MARGIN + GRID : 0;
  const region: Rect = { x: MARGIN, y: Math.max(MARGIN, top), w: inner, h: Math.max(GRID * 4, picBottom - Math.max(MARGIN, top)) };
  if (spec.visual === 'panel' || spec.visual === 'corner') {
    L.figureArea = { x: W * 0.06, y: -H * 0.06, w: W * 1.02, h: (picBottom + H * 0.06) * 1.04 };
    L.figureClip = { x: 0, y: 0, w: W, h: picBottom };
    L.figureOpacity = 0.85;
  } else if (spec.visual === 'chart') L.panel = region;
  else if (spec.visual === 'screenshot') L.frame = fitAspect(region, spec.aspect ?? 1.6);
  return L;
}

/* Hero (4.10): one huge number, with the words before it above and the words after it below; the mark centred at the foot. */
function heroLayout(spec: CardSpec, measure: Measure): CardLayout {
  const { width: W, height: H } = CARD_SIZES[spec.size];
  const palette = spec.visual === 'photo' ? PHOTO_PALETTE : PALETTES[spec.ground];
  const scale = SCALES[spec.size];
  const inner = W - 2 * MARGIN;
  const f = centerFoot(spec, W, H, scale, palette, measure, spec.logo === 'lockup' ? 'lockup' : 'mark');
  const parts = splitHero(spec.headline) ?? { before: parseHighlight(spec.headline).map(r => r.text).join(''), num: '', after: '' };
  const top = spec.number ? MARGIN + GRID : MARGIN;
  const room = f.top - GRID - top;
  const maxBig = Math.round(H * (spec.size === 'landscape' ? 0.4 : spec.size === 'square' ? 0.3 : 0.28));
  const bigFont = (size: number): FontSpec => (spec.pixel ? { family: 'pixel', weight: 400, size, tracking: 0 } : { family: 'sans', weight: 500, size, tracking: trackingFor(size) });
  let best: { size: number; big: number; h: number } | null = null;
  const eyebrowText = parseHighlight(spec.eyebrow).map(r => r.text).join('').trim();
  for (const size of posterSizes(spec.size)) {
    const font = headlineFont(size);
    const a = setBlock(runsOf(parts.before), font, MARGIN, 0, inner, palette.text, palette.hl, measure);
    const b = setBlock(runsOf(parts.after), font, MARGIN, 0, inner, palette.text, palette.hl, measure);
    if (a.tooWide || b.tooWide || a.lines > 2 || b.lines > 2) continue;
    /* the number as large as fits the width and its share of the height, and at least twice the words */
    let big = 0;
    if (parts.num) {
      for (let s = Math.round(maxBig / CAP); s >= size * 2; s -= 6) if (measure(parts.num, bigFont(s)) <= inner && CAP * s <= maxBig) {
        big = s;
        break;
      }
      if (!big) continue;
    }
    const sub = spec.sub.trim() ? setBlock(runsOf(spec.sub), subFont(scale.sub), MARGIN, 0, Math.min(inner, scale.sub * 22), palette.muted, palette.text, measure) : null;
    const gap = size * 0.3;
    const h = (eyebrowText ? scale.eyebrow * 1.6 : 0) + a.height + (big ? gap + CAP * big + DESC * big * 0.4 + gap : 0) + b.height + (sub ? 30 + sub.height : 0);
    if (h <= room) {
      best = { size, big, h };
      break;
    }
  }
  if (!best) best = { size: posterSizes(spec.size).at(-1)!, big: parts.num ? Math.round(maxBig / CAP / 2) : 0, h: room };
  const font = headlineFont(best.size);
  const L = emptyLayout(spec, palette, f.logo);
  let y = top;
  if (eyebrowText) {
    const ef = eyebrowFont(scale.eyebrow);
    L.eyebrow = { font: ef, color: palette.muted, hlColor: palette.muted, x: MARGIN, lines: [{ baseline: y + CAP * ef.size, line: lineOf(eyebrowText, measure(eyebrowText, ef)) }] };
    y += scale.eyebrow * 1.6;
  }
  const a = setBlock(runsOf(parts.before), font, MARGIN, y, inner, palette.text, palette.hl, measure);
  L.headline = a.block;
  y += a.height;
  if (best.big) {
    const bf = bigFont(best.big);
    y += best.size * 0.3;
    const base = y + CAP * best.big;
    L.big = { font: bf, color: palette.text, hlColor: palette.text, x: MARGIN - best.big * 0.04, lines: [{ baseline: base, line: lineOf(parts.num, measure(parts.num, bf)) }] };
    if (spec.visual === 'chart') {
      L.chartArea = { x: MARGIN, y: y - best.big * 0.08, w: inner, h: CAP * best.big * 1.16 + 34 };
      L.chartGhost = true;
    }
    y = base + DESC * best.big * 0.4 + best.size * 0.3;
  }
  const b = setBlock(runsOf(parts.after), font, MARGIN, y, inner, palette.text, palette.hl, measure);
  y += b.height;
  if (spec.sub.trim()) {
    const s = setBlock(runsOf(spec.sub), subFont(scale.sub), MARGIN, y + 30, Math.min(inner, scale.sub * 22), palette.muted, palette.text, measure);
    L.sub = s.block;
    y += 30 + s.height;
  }
  /* the words after the number share the headline's block, so both are measured and kept clear */
  if (b.block) L.headline = L.headline ? { ...L.headline, lines: [...L.headline.lines, ...b.block.lines] } : b.block;
  L.number = f.number;
  L.risk = f.risk;
  L.overflow = y > f.top - GRID / 2 + 0.5;
  L.column = { x: MARGIN, y: top, w: inner, h: y - top };
  const restTop = snapUp(y + GRID);
  if ((spec.visual === 'panel' || spec.visual === 'corner') && f.top - GRID - restTop > 4 * GRID) {
    L.figureArea = { x: W * 0.45, y: restTop, w: W * 0.6, h: (f.top - restTop) * 1.1 };
    L.figureClip = { x: W / 2 + L.logo.w, y: restTop - GRID / 2, w: W / 2 - L.logo.w, h: H - restTop + GRID / 2 };
    L.figureOpacity = 0.72;
  } else if (spec.visual === 'screenshot' && f.top - GRID - restTop > 4 * GRID) L.frame = fitAspect({ x: MARGIN, y: restTop, w: inner, h: f.top - GRID - restTop }, spec.aspect ?? 1.6);
  return L;
}

/* Cover (1.5): the full logo large in the middle, the words small and centred at the foot. */
function coverLayout(spec: CardSpec, measure: Measure): CardLayout {
  const { width: W, height: H } = CARD_SIZES[spec.size];
  const palette = spec.visual === 'photo' ? PHOTO_PALETTE : PALETTES[spec.ground];
  const scale = SCALES[spec.size];
  /* the risk line centred at the very bottom */
  const f = centerFoot(spec, W, H, scale, palette, measure, 'mark');
  let bottom = spec.risk && f.risk ? f.risk.lines[0]!.baseline - CAP * f.risk.font.size - GRID / 2 : H - MARGIN;
  /* the words: small, centred, a narrow measure */
  const size = spec.size === 'landscape' ? 40 : 44;
  const width = Math.max(340, Math.round(W * 0.3));
  const sub = spec.sub.trim() ? setBlock(runsOf(spec.sub), subFont(Math.round(size * 0.7)), W / 2, 0, width, palette.muted, palette.text, measure, 'center') : null;
  const head = setBlock(runsOf(spec.headline), headlineFont(size), W / 2, 0, width, palette.text, palette.hl, measure, 'center');
  const total = head.height + (sub ? 18 + sub.height : 0);
  const top = bottom - total;
  const L = emptyLayout(spec, palette, f.logo);
  const placed = setBlock(runsOf(spec.headline), headlineFont(size), W / 2, top, width, palette.text, palette.hl, measure, 'center');
  L.headline = placed.block;
  if (sub) L.sub = setBlock(runsOf(spec.sub), subFont(Math.round(size * 0.7)), W / 2, top + head.height + 18, width, palette.muted, palette.text, measure, 'center').block;
  bottom = top;
  /* the logo: a third of the width at most, centred a little above the middle */
  const kind: 'lockup' | 'mark' = spec.logo === 'mark' ? 'mark' : 'lockup';
  const lw = kind === 'lockup' ? Math.round(W / 3) : Math.round(Math.min(W, H) * 0.16);
  const lh = kind === 'lockup' ? lw / LOCKUP_RATIO : lw;
  const ly = Math.min(Math.round(H * 0.46 - lh / 2), bottom - GRID * 2 - lh - CLEAR * lh);
  L.logo = { kind, x: Math.round(W / 2 - lw / 2), y: ly, w: lw, h: lh, clear: Math.ceil(CLEAR * lh) };
  L.number = f.number;
  L.risk = f.risk;
  L.overflow = head.tooWide || head.lines > 4;
  L.column = { x: W / 2 - width / 2, y: top, w: width, h: total };
  return L;
}

/* Card (4.10): the picture fills the card; the words and the logo sit on a white card over it. */
function cardLayout(spec: CardSpec, measure: Measure): CardLayout {
  const { width: W, height: H } = CARD_SIZES[spec.size];
  const scale = SCALES[spec.size];
  const wide = spec.size === 'landscape';
  const ink = PALETTES.light;
  const card: Rect = wide ? { x: 3 * GRID, y: 2 * GRID, w: 13 * GRID, h: H - 4 * GRID } : { x: snapDown(W * 0.2), y: snapDown(H * 0.2), w: snapUp(W * 0.52), h: snapDown(H * 0.62) };
  const pad = GRID;
  const row = { x: card.x + pad, w: card.w - 2 * pad, bottom: card.y + card.h - pad };
  const f = foot(spec, row, scale, ink, measure);
  /* the headline, then the line below at the same size in gray: one sentence in two voices */
  const colW = card.w - 2 * pad;
  let chosen: { size: number; h: number } | null = null;
  for (const size of range(wide ? 96 : 104, 40, 2)) {
    const a = setBlock(runsOf(spec.headline), headlineFont(size), row.x, 0, colW, ink.text, ink.hl, measure);
    const b = setBlock(runsOf(spec.sub), headlineFont(size), row.x, 0, colW, ink.muted, ink.text, measure);
    const h = a.height + (b.block ? size * 0.12 + b.height : 0);
    if (!a.tooWide && !b.tooWide && a.lines + b.lines <= 6 && h <= f.top - GRID - (card.y + pad)) {
      chosen = { size, h };
      break;
    }
  }
  const size = chosen?.size ?? 40;
  const top = card.y + pad;
  const a = setBlock(runsOf(spec.headline), headlineFont(size), row.x, top, colW, ink.text, ink.hl, measure);
  const b = setBlock(runsOf(spec.sub), headlineFont(size), row.x, top + a.height + size * 0.12, colW, ink.muted, ink.text, measure);
  const L = emptyLayout(spec, ink, f.logo);
  L.card = card;
  L.headline = a.block;
  L.sub = b.block;
  L.number = f.number;
  L.risk = f.risk;
  L.logoFellBack = f.fellBack;
  L.overflow = !chosen;
  L.column = { x: row.x, y: top, w: colW, h: chosen?.h ?? 0 };
  /* the picture behind: a screenshot or chart to the right of the card, a figure there too, a photo everywhere */
  const right: Rect = wide ? { x: card.x + card.w + GRID, y: MARGIN, w: W - (card.x + card.w + GRID) - MARGIN, h: H - 2 * MARGIN } : { x: card.x + GRID, y: MARGIN, w: W - card.x - GRID - MARGIN, h: card.y - GRID - MARGIN };
  if (spec.visual === 'screenshot') L.frame = wide ? { x: card.x + card.w - 2 * GRID, y: MARGIN, w: W - (card.x + card.w - 2 * GRID), h: H - MARGIN } : { x: card.x + 2 * GRID, y: 0, w: W - card.x - 2 * GRID, h: card.y + card.h - 2 * GRID };
  else if (spec.visual === 'chart') L.panel = right;
  else if (spec.visual === 'panel' || spec.visual === 'corner') {
    L.figureArea = wide ? { x: card.x + card.w, y: 0, w: W - card.x - card.w + 2 * GRID, h: H } : { x: card.x, y: -GRID, w: W - card.x + GRID, h: card.y + GRID };
    L.figureClip = wide ? { x: card.x + card.w, y: 0, w: W - card.x - card.w, h: H } : { x: 0, y: 0, w: W, h: card.y };
    L.figureOpacity = 0.85;
  }
  return L;
}

/* Split (4.10): the headline in two parts, top left and right of centre; rays or a picture between; the mark at the foot where the rays meet. */
function splitLayout(spec: CardSpec, measure: Measure): CardLayout {
  const { width: W, height: H } = CARD_SIZES[spec.size];
  const palette = spec.visual === 'photo' ? PHOTO_PALETTE : PALETTES[spec.ground];
  const scale = SCALES[spec.size];
  const f = centerFoot(spec, W, H, scale, palette, measure, spec.logo === 'lockup' ? 'lockup' : 'mark');
  const [p1, p2] = splitTwo(spec.headline);
  const top = spec.number ? MARGIN + GRID : MARGIN;
  const wA = Math.round(W * (spec.size === 'landscape' ? 0.5 : 0.62));
  const wB = Math.round(W * (spec.size === 'landscape' ? 0.46 : 0.6));
  let chosen = 0;
  for (const size of posterSizes(spec.size)) {
    const a = setBlock(runsOf(p1), headlineFont(size), MARGIN, top, wA, palette.text, palette.hl, measure);
    const b = setBlock(runsOf(p2), headlineFont(size), W - MARGIN, 0, wB, palette.text, palette.hl, measure, 'right');
    if (a.tooWide || b.tooWide || a.lines > 3 || b.lines > 2) continue;
    if (top + a.height + GRID + b.height <= f.top - 3 * GRID) {
      chosen = size;
      break;
    }
  }
  const size = chosen || posterSizes(spec.size).at(-1)!;
  const a = setBlock(runsOf(p1), headlineFont(size), MARGIN, top, wA, palette.text, palette.hl, measure);
  const bTop = Math.max(snapUp(top + a.height + GRID), Math.round(H * 0.4));
  const bHeight = setBlock(runsOf(p2), headlineFont(size), W - MARGIN, 0, wB, palette.text, palette.hl, measure, 'right').height;
  const b = setBlock(runsOf(p2), headlineFont(size), W - MARGIN, Math.min(bTop, f.top - 3 * GRID - bHeight), wB, palette.text, palette.hl, measure, 'right');
  const L = emptyLayout(spec, palette, f.logo);
  L.headline = a.block;
  L.sub = b.block ? { ...b.block, color: palette.text } : null;
  L.number = f.number;
  L.risk = f.risk;
  L.overflow = !chosen;
  L.column = { x: MARGIN, y: top, w: W - 2 * MARGIN, h: f.top - top };
  const hub = { x: W / 2, y: f.logo.y + f.logo.h / 2 };
  L.hub = hub;
  /* rays fan out below the second part of the words, so their labels keep clear of them */
  const bBottom = b.block ? b.block.lines.at(-1)!.baseline + DESC * size : top + a.height;
  const areaTop = spec.size === 'landscape' ? top + a.height + GRID : bBottom + GRID / 2;
  const area: Rect = { x: MARGIN, y: areaTop, w: W - 2 * MARGIN, h: hub.y - areaTop };
  if (spec.visual === 'chart') {
    L.chartArea = area;
    L.chartGhost = false;
  } else {
    /* a figure or a screenshot goes below the second part of the words, above the foot */
    const y0 = snapUp((b.block ? b.block.lines.at(-1)!.baseline + DESC * size : area.y) + GRID);
    const below: Rect = { x: MARGIN, y: y0, w: W - 2 * MARGIN, h: f.top - GRID / 2 - y0 };
    if (below.h > 3 * GRID && (spec.visual === 'panel' || spec.visual === 'corner')) {
      L.figureArea = { x: W * 0.1, y: below.y, w: W * 0.8, h: below.h };
      L.figureClip = below;
      L.figureOpacity = 0.75;
    } else if (below.h > 3 * GRID && spec.visual === 'screenshot') L.frame = fitAspect(below, spec.aspect ?? 1.6);
  }
  return L;
}
