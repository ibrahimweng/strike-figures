import { describe, expect, it } from 'vitest';
import { CARD_SIZES, type CardSize, type CardSpec, CLEAR, fitFigure, GRID, headlineFont, headlineLeading, layoutCard, LOCKUP_RATIO, type Measure, occupied, PALETTES, RISK_LINE, type Visual } from '../src/social/layout';
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
    visual: 'panel',
    aspect: null,
    logo: 'auto',
    eyebrow: 'Options',
    headline: 'Options on every market, *every hour.*',
    sub: 'Stocks, indices, crypto and compute, on one exchange.',
    number: '1/3',
    risk: true,
    ...p,
  });
  type R = { x: number; y: number; w: number; h: number };
  const inside = (r: R, W: number, H: number) => r.x >= -0.5 && r.y >= -0.5 && r.x + r.w <= W + 0.5 && r.y + r.h <= H + 0.5;
  const overlaps = (a: R, b: R) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  const grow = (r: R, d: number): R => ({ x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d });
  const VISUALS: Visual[] = ['panel', 'corner', 'screenshot', 'photo', 'none'];
  const SIZES: CardSize[] = ['landscape', 'square', 'portrait'];

  it('comes in three sizes: 16:9, 1:1 and 4:5, all on the 50 px grid', () => {
    expect(CARD_SIZES.landscape).toMatchObject({ width: 1600, height: 900 });
    expect(CARD_SIZES.square).toMatchObject({ width: 1200, height: 1200 });
    expect(CARD_SIZES.portrait).toMatchObject({ width: 1200, height: 1500 });
    for (const s of SIZES) expect([CARD_SIZES[s].width % GRID, CARD_SIZES[s].height % GRID]).toEqual([0, 0]);
  });

  it('keeps everything on the card, nothing overlapping and the logo clear, in every size, picture and option', () => {
    const headlines = ['Every hour.', 'Options on every market, *every hour.*', 'A much longer headline that has to wrap over several lines to fit in the space'];
    for (const size of SIZES)
      for (const visual of VISUALS)
        for (const side of ['left', 'right'] as const)
          for (const headline of headlines)
            for (const risk of [true, false])
              for (const number of ['2/5', null])
                for (const aspect of [0.5, 1.6, 2.4]) {
                  const L = layoutCard(spec({ size, visual, side, headline, risk, number, aspect, sub: 'And a sub-line that is a full sentence long, to see where it stops.' }), fake);
                  const { width: W, height: H } = CARD_SIZES[size];
                  const where = `${size}/${visual}/${side}/${risk}/${number}/${aspect}: ${headline}`;
                  expect(inside(L.logo, W, H), where).toBe(true);
                  const boxes = occupied(L);
                  for (const b of boxes) expect(inside(b, W, H), `${where} inside`).toBe(true);
                  /* nothing comes within the logo's clear space */
                  for (const b of boxes) expect(overlaps(b, grow(L.logo, L.logo.clear)), `${where} clear space`).toBe(false);
                  /* words never touch the picture */
                  const words = occupied({ ...L, panel: null, frame: null, number: null, risk: null });
                  for (const pic of [L.panel, L.frame]) if (pic) for (const w of words) expect(overlaps(w, pic), `${where} words/picture`).toBe(false);
                  /* the number and the risk line keep off the words */
                  const foot = occupied({ ...L, panel: null, frame: null, eyebrow: null, headline: null, sub: null });
                  for (const a of foot) for (const w of words) expect(overlaps(a, w), `${where} foot/words`).toBe(false);
                  /* a corner drawing is clipped clear of the words and the logo */
                  if (L.figureClip && visual === 'corner') {
                    for (const w of words) expect(overlaps(w, L.figureClip), `${where} corner/words`).toBe(false);
                    expect(overlaps(grow(L.logo, L.logo.clear), L.figureClip), `${where} corner/logo`).toBe(false);
                  }
                }
  });

  it('signs off with the full lockup when it fits, the mark when asked', () => {
    for (const size of SIZES) for (const visual of VISUALS) expect(layoutCard(spec({ size, visual }), fake).logo.kind).toBe('lockup');
    const L = layoutCard(spec({ logo: 'mark' }), fake);
    expect(L.logo.kind).toBe('mark');
    expect(L.logo.w).toBe(L.logo.h);
    expect(L.logoFellBack).toBe(false);
    const lockup = layoutCard(spec(), fake).logo;
    expect(lockup.w / lockup.h).toBeCloseTo(LOCKUP_RATIO);
    expect(lockup.clear).toBe(Math.ceil(CLEAR * lockup.h));
  });

  it('puts the risk line on the logo row when it fits, on its own row when it does not', () => {
    const wide = layoutCard(spec({ visual: 'none' }), fake);
    expect(wide.risk!.lines).toHaveLength(1);
    expect(wide.risk!.align).toBe('right');
    const narrow = layoutCard(spec({ visual: 'panel' }), fake);
    expect(narrow.risk!.lines[0]!.baseline).toBeLessThan(narrow.logo.y);
    expect(layoutCard(spec({ risk: false }), fake).risk).toBeNull();
    expect(plainOf(wide.risk!.lines.map(l => l.line.text).join(' '))).toBe(RISK_LINE);
  });

  it('puts a square panel on the grid, the words in the other column', () => {
    const L = layoutCard(spec(), fake);
    expect([L.width, L.height]).toEqual([1600, 900]);
    expect(L.panel).toEqual({ x: GRID, y: GRID, w: 800, h: 800 });
    expect(L.column.x).toBeGreaterThanOrEqual(L.panel!.x + L.panel!.w + GRID);
    expect(L.column.x + L.column.w).toBeLessThanOrEqual(1600 - GRID);
    const R = layoutCard(spec({ side: 'right' }), fake);
    expect(R.panel!.x + R.panel!.w).toBe(1600 - GRID);
    expect(R.column.x + R.column.w).toBeLessThanOrEqual(R.panel!.x - GRID);
  });

  it('frames a screenshot in its own shape', () => {
    for (const size of SIZES)
      for (const aspect of [0.5, 1, 1.78, 2.5]) {
        const L = layoutCard(spec({ size, visual: 'screenshot', aspect }), fake);
        expect(L.panel).toBeNull();
        expect(L.frame!.w / L.frame!.h).toBeCloseTo(aspect, 2);
      }
  });

  it('sizes the headline down until it fits, within the line limit', () => {
    const short = layoutCard(spec({ headline: 'Every hour.' }), fake);
    const long = layoutCard(spec({ headline: 'Options on every market, every hour, every day of the week, on one exchange with one margin account' }), fake);
    expect(short.headline!.font.size).toBeGreaterThan(long.headline!.font.size);
    expect(long.headline!.lines.length).toBeLessThanOrEqual(5);
    expect(long.overflow).toBe(false);
  });

  it('sets the headline by the type chart: leading and tracking follow the size', () => {
    for (const [size, lead, track] of [[120, 0.9, -0.03], [64, 1, -0.02], [40, 1.2, -0.01], [20, 1.3, 0]] as const) {
      expect(headlineLeading(size)).toBe(lead);
      expect(headlineFont(size).tracking).toBe(track);
    }
  });

  it('says so when the words cannot fit at all', () => {
    const L = layoutCard(spec({ headline: 'word '.repeat(200) }), fake);
    expect(L.overflow).toBe(true);
  });

  it('stacks a square or portrait card: the picture spans the width, above or below the words', () => {
    for (const size of ['square', 'portrait'] as const) {
      const W = CARD_SIZES[size].width;
      const top = layoutCard(spec({ size, side: 'left' }), fake);
      expect(top.panel!.x).toBe(GRID);
      expect(top.panel!.w).toBe(W - 2 * GRID);
      expect(top.panel!.y).toBe(GRID);
      expect(top.headline!.lines[0]!.baseline).toBeGreaterThan(top.panel!.y + top.panel!.h);
      const below = layoutCard(spec({ size, side: 'right' }), fake);
      expect(below.headline!.lines.at(-1)!.baseline).toBeLessThan(below.panel!.y);
      /* the panel's edges sit on the grid */
      for (const L of [top, below]) for (const v of [L.panel!.x, L.panel!.y, L.panel!.w, L.panel!.h]) expect(v % GRID).toBe(0);
    }
  });

  it('colors highlights by ground: green on black, Mark Deep on white, black on green, green on photos', () => {
    expect(layoutCard(spec({ ground: 'dark' }), fake).headline!.hlColor).toBe('#10B981');
    expect(layoutCard(spec({ ground: 'light' }), fake).headline!.hlColor).toBe('#047857');
    expect(layoutCard(spec({ ground: 'green' }), fake).headline!.hlColor).toBe('#0C0C0C');
    expect(layoutCard(spec({ visual: 'photo', ground: 'light' }), fake).headline!.color).toBe('#FFFFFF');
    expect(PALETTES.green.text).toBe('#FFFFFF');
    expect(PALETTES.green.gradient).not.toBeNull();
  });

  it('leaves out what is empty', () => {
    const L = layoutCard(spec({ eyebrow: '', sub: '  ', number: null, risk: false }), fake);
    expect(L.eyebrow).toBeNull();
    expect(L.sub).toBeNull();
    expect(L.number).toBeNull();
    expect(L.risk).toBeNull();
    expect(L.headline!.lines[0]!.baseline).toBeLessThan(GRID + 160);
  });

  it('sets the small line above as typed, in sentence case', () => {
    expect(layoutCard(spec({ eyebrow: 'Trading hours' }), fake).eyebrow!.lines[0]!.line.text).toBe('Trading hours');
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
