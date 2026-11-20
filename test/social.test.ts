import { describe, expect, it } from 'vitest';
import { CARD_SIZES, type CardSpec, fitFigure, GRID, layoutCard, type Measure, PALETTES } from '../src/social/layout';
import { findUrls, parseHighlight, plainOf, postText, ragOf, wrap, wrapBalanced, X_LIMIT, xLength } from '../src/social/text';

/* a monospaced fake: every character is half an em, plus the tracking */
const fake: Measure = (text, font) => [...text].length * font.size * (0.5 + font.tracking);
const at = (size: number) => (s: string) => [...s].length * size * 0.5;

describe('X character count', () => {
  it('counts plain Latin text one per character', () => {
    expect(xLength('Options on every market, every hour.')).toBe(36);
    expect(xLength('')).toBe(0);
    expect(xLength('line\nbreak')).toBe(10);
  });

  it('counts a link as 23, however long', () => {
    expect(xLength('https://strike.markets')).toBe(23);
    expect(xLength('See https://strike.markets/blog/a-very-long-path-to-somewhere?with=query')).toBe(4 + 23);
    expect(xLength('Read strike.markets/hours today')).toBe(5 + 23 + 6);
    /* the full stop after a link is the sentence's, not the link's */
    expect(findUrls('Go to strike.markets.')).toEqual([{ start: 6, end: 20 }]);
    expect(xLength('Go to strike.markets.')).toBe(6 + 23 + 1);
  });

  it("doesn't take handles, emails or plain numbers for links", () => {
    expect(findUrls('@strike and hi@strike.markets')).toEqual([]);
    expect(findUrls('32.5 hours, ~80 underlyings, e.g. this')).toEqual([]);
  });

  it('counts CJK and emoji as two', () => {
    expect(xLength('日本')).toBe(4);
    expect(xLength('🚀')).toBe(2);
    expect(xLength('a🚀b')).toBe(4);
    /* a family is one emoji of several code points: still two */
    expect(xLength('👨‍👩‍👧')).toBe(2);
    expect(xLength('🇺🇸')).toBe(2);
    /* curly quotes and dashes are in the light ranges; the ellipsis (U+2026) isn't */
    expect(xLength('“quote” — dash')).toBe(14);
    expect(xLength('wait…')).toBe(6);
  });

  it('counts the numbering when it is added', () => {
    expect(postText('Hello', 0, 3, true)).toBe('Hello\n\n1/3');
    expect(postText('Hello', 0, 1, true)).toBe('Hello');
    expect(postText('  Hello  ', 1, 3, false)).toBe('Hello');
    expect(xLength(postText('x'.repeat(X_LIMIT), 0, 5, true))).toBe(X_LIMIT + 5);
  });
});

describe('highlight syntax', () => {
  it('splits plain and *highlighted* runs', () => {
    expect(parseHighlight('Options on *every market*, every hour.')).toEqual([
      { text: 'Options on ', hl: false },
      { text: 'every market', hl: true },
      { text: ', every hour.', hl: false },
    ]);
    expect(parseHighlight('*all*')).toEqual([{ text: 'all', hl: true }]);
  });

  it('keeps a lone asterisk, and \\* as a literal one', () => {
    expect(parseHighlight('5 * 3')).toEqual([{ text: '5 * 3', hl: false }]);
    expect(parseHighlight('a *b* c*')).toEqual([
      { text: 'a ', hl: false },
      { text: 'b', hl: true },
      { text: ' c*', hl: false },
    ]);
    expect(parseHighlight('\\*not\\*')).toEqual([{ text: '*not*', hl: false }]);
  });

  it('can span a line break', () => {
    expect(parseHighlight('One *two\nthree*')).toEqual([
      { text: 'One ', hl: false },
      { text: 'two\nthree', hl: true },
    ]);
    expect(plainOf('One *two* three')).toBe('One two three');
  });
});

describe('wrapping', () => {
  const runs = parseHighlight('Options on every market, *every hour.*');

  it('fits as many words on a line as the width allows', () => {
    const lines = wrap(runs, 16 * 10, at(20)); // 16 characters a line
    expect(lines.map(l => l.text)).toEqual(['Options on every', 'market, every', 'hour.']);
    expect(lines.every(l => l.width <= 160)).toBe(true);
  });

  it('balances the rag so no word is left alone', () => {
    const greedy = wrap(runs, 30 * 10, at(20));
    expect(greedy.map(l => l.text)).toEqual(['Options on every market, every', 'hour.']);
    const even = wrapBalanced(runs, 30 * 10, at(20));
    expect(even).toHaveLength(2);
    expect(even.map(l => l.text)).toEqual(['Options on every', 'market, every hour.']);
    expect(ragOf(even)).toBeGreaterThan(ragOf(greedy));
  });

  it('keeps explicit line breaks, and colours each stretch of a line', () => {
    const lines = wrap(parseHighlight('Markets don’t close.\n*Neither do we.*'), 1000, at(20));
    expect(lines.map(l => l.text)).toEqual(['Markets don’t close.', 'Neither do we.']);
    expect(lines.map(l => l.para)).toEqual([0, 1]);
    expect(lines[1]!.segments).toEqual([{ text: 'Neither do we.', hl: true, x: 0 }]);
    const mixed = wrap(parseHighlight('Not *32.5.*'), 1000, at(20))[0]!;
    expect(mixed.segments).toEqual([
      { text: 'Not ', hl: false, x: 0 },
      { text: '32.5.', hl: true, x: 40 },
    ]);
  });

  it('gives a word too long for the line a line of its own', () => {
    const lines = wrap([{ text: 'a supercalifragilistic b', hl: false }], 50, at(10));
    expect(lines.map(l => l.text)).toEqual(['a', 'supercalifragilistic', 'b']);
  });
});

describe('card layout', () => {
  const spec = (p: Partial<CardSpec> = {}): CardSpec => ({
    size: 'landscape',
    ground: 'dark',
    side: 'left',
    eyebrow: 'Options',
    headline: 'Options on every market, *every hour.*',
    sub: 'Stocks, indices, crypto and compute, on one exchange.',
    number: '1/3',
    ...p,
  });
  const inside = (r: { x: number; y: number; w: number; h: number }, W: number, H: number) => r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H;

  it('puts a square panel on the grid, the words in the other column', () => {
    const L = layoutCard(spec(), fake);
    expect([L.width, L.height]).toEqual([1600, 900]);
    expect(L.panel).toEqual({ x: GRID, y: GRID, w: 800, h: 800 });
    expect(L.column.x).toBeGreaterThanOrEqual(L.panel.x + L.panel.w + GRID);
    expect(L.column.x + L.column.w).toBeLessThanOrEqual(1600 - GRID);
    const R = layoutCard(spec({ side: 'right' }), fake);
    expect(R.panel.x + R.panel.w).toBe(1600 - GRID);
    expect(R.column.x + R.column.w).toBeLessThanOrEqual(R.panel.x - GRID);
  });

  it('never lets the words run into the panel or past the lock-up', () => {
    for (const side of ['left', 'right'] as const)
      for (const size of ['landscape', 'square'] as const) {
        const L = layoutCard(spec({ side, size, headline: 'A much longer headline that has to wrap over several lines to fit in', sub: 'And a sub-line that is a full sentence long, to see where it stops.' }), fake);
        const { width: W, height: H } = CARD_SIZES[size];
        expect(inside(L.panel, W, H)).toBe(true);
        for (const b of [L.eyebrow, L.headline, L.sub])
          for (const { baseline, line } of b?.lines ?? []) {
            expect(b!.x + line.width).toBeLessThanOrEqual(L.column.x + L.column.w + 0.5);
            expect(baseline).toBeLessThan(L.logo.y - GRID / 2);
            /* words and panel don't overlap */
            const top = baseline - b!.font.size;
            const clear = baseline < L.panel.y || top > L.panel.y + L.panel.h || b!.x >= L.panel.x + L.panel.w || b!.x + line.width <= L.panel.x;
            expect(clear).toBe(true);
          }
      }
  });

  it('sizes the headline down until it fits, within the line limit', () => {
    const short = layoutCard(spec({ headline: 'Every hour.' }), fake);
    const long = layoutCard(spec({ headline: 'Options on every market, every hour, every day of the week, on one exchange with one margin account' }), fake);
    expect(short.headline!.font.size).toBeGreaterThan(long.headline!.font.size);
    expect(long.headline!.lines.length).toBeLessThanOrEqual(5);
    expect(long.overflow).toBe(false);
  });

  it('says so when the words cannot fit at all', () => {
    const L = layoutCard(spec({ headline: 'word '.repeat(200) }), fake);
    expect(L.overflow).toBe(true);
  });

  it('stacks a square card: the panel spans the width, above or below the words', () => {
    const top = layoutCard(spec({ size: 'square', side: 'left' }), fake);
    expect(top.panel.x).toBe(GRID);
    expect(top.panel.w).toBe(1200 - 2 * GRID);
    expect(top.panel.y).toBe(GRID);
    expect(top.headline!.lines[0]!.baseline).toBeGreaterThan(top.panel.y + top.panel.h);
    const below = layoutCard(spec({ size: 'square', side: 'right' }), fake);
    expect(below.headline!.lines.at(-1)!.baseline).toBeLessThan(below.panel.y);
    /* the panel's edges sit on the grid */
    for (const L of [top, below]) for (const v of [L.panel.x, L.panel.y, L.panel.w, L.panel.h]) expect(v % GRID).toBe(0);
  });

  it('colours highlights by ground: green on black and white, black on green', () => {
    expect(layoutCard(spec({ ground: 'dark' }), fake).headline!.hlColor).toBe('#10B981');
    expect(layoutCard(spec({ ground: 'light' }), fake).headline!.hlColor).toBe('#10B981');
    expect(layoutCard(spec({ ground: 'green' }), fake).headline!.hlColor).toBe('#0C0C0C');
    expect(PALETTES.green.text).toBe('#FFFFFF');
  });

  it('leaves out what is empty', () => {
    const L = layoutCard(spec({ eyebrow: '', sub: '  ', number: null }), fake);
    expect(L.eyebrow).toBeNull();
    expect(L.sub).toBeNull();
    expect(L.number).toBeNull();
    expect(L.headline!.lines[0]!.baseline).toBeLessThan(GRID + 100);
  });

  it('fits a figure by its drawing, centred in the panel', () => {
    const area = { x: 100, y: 100, w: 600, h: 600 };
    const r = fitFigure(area, { minX: 60, minY: 110, maxX: 260, maxY: 210 }, { width: 320, height: 320 });
    /* the 200×100 drawing is scaled 3× to fill the width, its centre on the area's centre */
    expect(r.w).toBeCloseTo(320 * 3);
    expect(r.x + 160 * 3).toBeCloseTo(400);
    expect(r.y + 160 * 3).toBeCloseTo(400);
  });
});
