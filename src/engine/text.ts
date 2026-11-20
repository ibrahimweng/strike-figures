/* Labels in Geist (Regular, and Medium for tickers), drawn as outlines
   (glyphs.json is made by `npm run glyphs`), so a label looks the same in
   every SVG viewer, in Figma, in a PNG, a video or a Lottie file, whether or
   not the font is installed. Letters are spaced by their own widths and
   the font's kerning. */
import glyphData from './glyphs.json';
import { type Cmd, parsePath } from './decal';
import type { P2 } from './math';

export type Weight = 'regular' | 'medium';

interface Face {
  glyphs: Record<string, [string, number]>;
  kern: Record<string, number>;
}
const G = glyphData as unknown as { upm: number; capHeight: number; weights: Record<Weight, Face> };
const cache = new Map<string, Cmd[]>();

const face = (w: Weight) => G.weights[w] ?? G.weights.regular;

const glyph = (ch: string, w: Weight): Cmd[] => {
  const key = `${w}:${ch}`;
  let c = cache.get(key);
  if (!c) {
    const f = face(w);
    cache.set(key, (c = parsePath((f.glyphs[ch] ?? f.glyphs['?'])?.[0] ?? '')));
  }
  return c;
};

/** Characters a label can use. */
export const hasGlyph = (ch: string) => ch in G.weights.regular.glyphs;

/** Where each character starts, and the whole width, in capital heights. */
function layout(text: string, tracking: number, w: Weight): { xs: number[]; width: number } {
  const f = face(w);
  const k = 1 / G.capHeight;
  const xs: number[] = [];
  let x = 0;
  const chars = [...text];
  chars.forEach((ch, i) => {
    if (i > 0) x += (f.kern[chars[i - 1]! + ch] ?? 0) * k;
    xs.push(x);
    x += ((f.glyphs[ch] ?? f.glyphs['?'])?.[1] ?? 600) * k + tracking;
  });
  return { xs, width: chars.length ? x - tracking : 0 };
}

/**
 * Text as path commands with a capital height of 1: x runs right from the
 * anchor (shifted for alignment), y runs down, and the capitals are centred on y = 0.
 */
export function textCmds(text: string, align: 'start' | 'middle' | 'end' = 'start', tracking = 0, weight: Weight = 'regular'): Cmd[] {
  const k = 1 / G.capHeight;
  const { xs, width } = layout(text, tracking, weight);
  const x0 = align === 'start' ? 0 : align === 'middle' ? -width / 2 : -width;
  const out: Cmd[] = [];
  [...text].forEach((ch, i) => {
    if (ch === ' ') return;
    const move = (p: P2): P2 => ({ x: x0 + xs[i]! + p.x * k, y: p.y * k + 0.5 });
    for (const c of glyph(ch, weight)) {
      if (c.k === 'Z') out.push(c);
      else if (c.k === 'C') out.push({ k: 'C', c1: move(c.c1), c2: move(c.c2), p: move(c.p) });
      else out.push({ k: c.k, p: move(c.p) });
    }
  });
  return out;
}

/** How wide a label is, in capital heights. */
export const textWidth = (text: string, tracking = 0, weight: Weight = 'regular') => layout(text, tracking, weight).width;
