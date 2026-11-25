import { describe, expect, it } from 'vitest';
import { adviseFor } from '../src/social/advice';
import { chartIssues, DEFAULT_CHART, exampleChart, fillChart, formatValue, highlightOf, parseRows, parseValue } from '../src/social/chart';
import { layoutCard, type Measure } from '../src/social/layout';
import { fillList, newPost } from '../src/social/store';
import { TEMPLATES } from '../src/social/templates';
import type { Thread } from '../src/social/types';

const fake: Measure = (text, font) => text.length * font.size * (font.family === 'pixel' ? 0.62 : 0.5);

describe('charts', () => {
  it('reads numbers typed any way', () => {
    expect(parseValue('1,234.5')).toBe(1234.5);
    expect(parseValue('$4.2M')).toBe(4_200_000);
    expect(parseValue('81%')).toBe(81);
    expect(parseValue('−3')).toBe(-3);
    expect(parseValue('IV 106.2%')).toBe(106.2);
    expect(parseValue('none')).toBeNull();
  });

  it('reads rows pasted from a sheet', () => {
    expect(parseRows('AMD, 106.2\nDELL\t551.9\n\nMSFT 32%\nnot a row')).toEqual([
      { label: 'AMD', value: 106.2 },
      { label: 'DELL', value: 551.9 },
      { label: 'MSFT', value: 32 },
    ]);
  });

  it('writes values with what goes round them', () => {
    expect(formatValue({ prefix: 'IV ', suffix: '%', decimals: null }, 106.2)).toBe('IV 106.2%');
    expect(formatValue({ prefix: '$', suffix: 'M', decimals: 1 }, 4)).toBe('$4.0M');
    expect(formatValue({ prefix: '', suffix: '', decimals: null }, -1200)).toBe('−1,200');
  });

  it('greens the one that matters', () => {
    const bars = fillChart({ kind: 'bars', rows: [{ label: 'a', value: 1 }, { label: 'b', value: 9 }, { label: 'c', value: 3 }] });
    expect(highlightOf(bars)).toBe(1);
    expect(highlightOf({ ...bars, kind: 'line' })).toBe(2);
    expect(highlightOf({ ...bars, highlight: 0 })).toBe(0);
    expect(highlightOf({ ...bars, highlight: -1 })).toBe(-1);
  });

  it('checks the data by the brand rules', () => {
    const ring = fillChart({ kind: 'ring', rows: [{ label: 'Closed', value: 81 }, { label: 'Open', value: 15 }], total: 100, source: 'x' });
    expect(chartIssues(ring).join(' ')).toMatch(/add up to 96/);
    const dup = fillChart({ kind: 'bars', rows: [{ label: 'AMD', value: 1 }, { label: 'amd', value: 2 }], source: 'x' });
    expect(chartIssues(dup).join(' ')).toMatch(/AMD appears twice/);
    expect(chartIssues(fillChart({ kind: 'bars', rows: [{ label: 'a', value: 1 }, { label: 'b', value: 2 }] })).join(' ')).toMatch(/source/);
    for (const k of ['number', 'bars', 'histogram', 'line', 'area', 'ring', 'wheel', 'rays'] as const) {
      const c = fillChart({ ...DEFAULT_CHART, ...exampleChart(k), kind: k });
      expect(chartIssues(c), k).toEqual([]);
    }
  });
});

describe('templates', () => {
  it('every template makes a post that lays out without overflowing, and breaks no brand rule', () => {
    for (const t of TEMPLATES) {
      const post = newPost(JSON.parse(JSON.stringify(t.post)));
      const thread: Thread = { kind: 'posts', ground: 'dark', size: 'landscape', numberText: false, numberCards: false, posts: [post] };
      const filled = fillList(thread, 'posts')!;
      const p = filled.posts[0]!;
      expect(p.layout, t.id).toBe(t.post.layout);
      const L = layoutCard({ size: p.size ?? 'landscape', ground: p.ground ?? 'dark', side: p.side, visual: p.visual, aspect: 1.6, logo: p.logo, eyebrow: p.eyebrow, headline: p.headline, sub: p.sub, number: null, risk: true, layout: p.layout, pixel: p.chart.pixel }, fake);
      expect(L.overflow, t.id).toBe(false);
      const fixes = adviseFor(filled, p, 0, { layout: null }).filter(a => a.level === 'fix' && a.action !== 'upload');
      expect(fixes.map(f => f.text), t.id).toEqual([]);
    }
  });
});

describe('pattern and layout suggestions', () => {
  const thread = (p: ReturnType<typeof newPost>): Thread => ({ kind: 'posts', ground: 'dark', size: 'square', numberText: false, numberCards: false, posts: [p] });
  it('offers a quiet pattern for a card that is mostly empty, and warns when a pattern is loud', () => {
    const bare = newPost({ visual: 'none', headline: 'Markets never close.' });
    const tip = adviseFor(thread(bare), bare, 0, { layout: null }).find(a => a.id === 'pattern:empty');
    expect(tip?.apply?.patch.pattern).toBeTruthy();
    const loud = newPost({ visual: 'none', headline: 'Markets never close.', pattern: { ...tip!.apply!.patch.pattern!, color: '#10B981', opacity: 1 } });
    const warn = adviseFor(thread(loud), loud, 0, { layout: null }).find(a => a.id === 'pattern:loud');
    expect(warn?.apply?.patch.pattern?.color).toBeNull();
  });
  it('says when the big-number layout has no number', () => {
    const p = newPost({ layout: 'hero', headline: 'Markets never close.' });
    expect(adviseFor(thread(p), p, 0, { layout: null }).some(a => a.id === 'hero:number')).toBe(true);
    const ok = newPost({ layout: 'hero', headline: 'Closed *81%* of the week.' });
    expect(adviseFor(thread(ok), ok, 0, { layout: null }).some(a => a.id === 'hero:number')).toBe(false);
  });
});
