/* Labels in Geist Mono, drawn as outlines (glyphs.json is made by
   `npm run glyphs`), so a label looks the same in every SVG viewer, in
   Figma and in a PNG, whether or not the font is installed. */
import glyphData from './glyphs.json';
import { type Cmd, parsePath } from './decal';
import type { P2 } from './math';

const G = glyphData as { upm: number; capHeight: number; advance: number; glyphs: Record<string, string> };
const cache = new Map<string, Cmd[]>();

const glyph = (ch: string): Cmd[] => {
  let c = cache.get(ch);
  if (!c) cache.set(ch, (c = parsePath(G.glyphs[ch] ?? G.glyphs['?'] ?? '')));
  return c;
};

/** Characters a label can use. */
export const hasGlyph = (ch: string) => ch === ' ' || ch in G.glyphs;

/**
 * Text as path commands with a capital height of 1: x runs right from the
 * anchor (shifted for alignment), y runs down, and the capitals are centred on y = 0.
 */
export function textCmds(text: string, align: 'start' | 'middle' | 'end' = 'start', tracking = 0): Cmd[] {
  const k = 1 / G.capHeight;
  const step = G.advance * k + tracking;
  const width = text.length * step - tracking;
  const x0 = align === 'start' ? 0 : align === 'middle' ? -width / 2 : -width;
  const out: Cmd[] = [];
  const move = (p: P2, i: number): P2 => ({ x: x0 + i * step + p.x * k, y: p.y * k + 0.5 });
  [...text].forEach((ch, i) => {
    if (ch === ' ') return;
    for (const c of glyph(ch)) {
      if (c.k === 'Z') out.push(c);
      else if (c.k === 'C') out.push({ k: 'C', c1: move(c.c1, i), c2: move(c.c2, i), p: move(c.p, i) });
      else out.push({ k: c.k, p: move(c.p, i) });
    }
  });
  return out;
}

/** How wide a label is, in capital heights. */
export const textWidth = (text: string, tracking = 0) => text.length * (G.advance / G.capHeight + tracking) - tracking;
