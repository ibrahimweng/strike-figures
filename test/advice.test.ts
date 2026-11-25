import { describe, expect, it } from 'vitest';
// @ts-expect-error: the brand checker is plain JavaScript
import * as checker from '../skill/scripts/check.mjs';
import { adviseFor, highlightFor, sizeForAspect, suggestFigures, withHighlight } from '../src/social/advice';
import { examplePosts, exampleThread, newPost } from '../src/social/store';
import type { Post, Thread } from '../src/social/types';
import { AVOID, britishIn, isTitleCase, PROPER, TAGLINE, taglineVariant, toSentenceCase, toUS, UK_SPELLING } from '../src/social/voice';

const single = (p: Partial<Post>): { thread: Thread; post: Post } => {
  const post = newPost({ headline: 'Open 168 hours a week.', ...p });
  return { thread: { ...examplePosts(), posts: [post] }, post };
};
const ids = (p: Partial<Post>) => {
  const { thread, post } = single(p);
  return adviseFor(thread, post, 0, { layout: null }).map(a => a.id);
};

describe('word rules', () => {
  it('are the brand checker’s own lists', () => {
    expect(UK_SPELLING).toEqual(checker.UK_SPELLING);
    expect(AVOID.map(a => [a.word, a.re.source, a.fix])).toEqual(checker.AVOID.map((a: { word: string; re: RegExp; fix: string }) => [a.word, a.re.source, a.fix]));
    expect([...PROPER]).toEqual([...checker.PROPER]);
    expect(TAGLINE).toBe(checker.TAGLINE);
  });

  it('spots Title Case and puts it right, keeping names, acronyms, sentences and highlights', () => {
    expect(isTitleCase('Options On Every Market, Every Hour.')).toBe(true);
    expect(isTitleCase('Primary Palette')).toBe(true);
    expect(isTitleCase('Open 168 hours a week. Not 32.5.')).toBe(false);
    expect(isTitleCase('Strike Markets')).toBe(false);
    expect(toSentenceCase('Options On *Every Hour.* Trade With OpenAI And GPU Rates')).toBe('Options on *every hour.* Trade with OpenAI and GPU rates');
  });

  it('turns British spellings into US ones, and finds the tagline written another way', () => {
    expect(britishIn('Our colour palette is grey')).toEqual([{ word: 'colour', us: 'color' }, { word: 'grey', us: 'gray' }]);
    expect(toUS('Colour, centred')).toBe('Color, centered');
    expect(taglineVariant('Options On Every Market, Every Hour.')).not.toBeNull();
    expect(taglineVariant('Options on every market, every hour.')).toBeNull();
  });
});

describe('suggestions', () => {
  it('finds the illustration that fits a headline', () => {
    expect(suggestFigures('Open 168 hours a week. Never closes.')[0]!.id).toMatch(/always-(open|on)/);
    expect(suggestFigures('No key at Strike can move your funds')[0]!.id).toBe('vault');
    expect(suggestFigures('One margin account across every market').map(s => s.id)).toContain('unified-margin');
    expect(suggestFigures('Listed options are closed 81% of the week')[0]!.id).toBe('ticks-chart');
    expect(suggestFigures('')).toEqual([]);
  });

  it('suggests a better-fitting illustration, and nothing when the current one fits', () => {
    expect(ids({ headline: 'Open 168 hours a week.', figure: { kind: 'library', id: 'gpu' } }).some(i => i.startsWith('figure:'))).toBe(true);
    expect(ids({ headline: 'Open 168 hours a week.', figure: { kind: 'library', id: 'always-open' } }).some(i => i.startsWith('figure:'))).toBe(false);
  });

  it('picks the size a screenshot reads largest in', () => {
    expect(sizeForAspect(16 / 9)).toBe('landscape');
    expect(sizeForAspect(1)).toBe('square');
    expect(sizeForAspect(0.56)).toBe('portrait');
    const image = { id: 'x', w: 900, h: 1600, name: 'a.png', zoom: 1, fx: 0.5, fy: 0.5 };
    expect(ids({ visual: 'screenshot', image, size: 'landscape' })).toContain('size:shot:portrait');
    expect(ids({ visual: 'screenshot', image: null })).toContain('picture:add:screenshot');
  });

  it('offers a highlight: the number first, else the last clause', () => {
    expect(highlightFor('Listed options are closed 81% of the week.')).toBe('81%');
    expect(highlightFor('One exchange, every hour.')).toBe('every hour');
    expect(withHighlight('Closed 81% of the week.', '81%')).toBe('Closed *81%* of the week.');
    expect(ids({ headline: 'Strike is open *every* hour.' }).some(i => i.startsWith('hl:'))).toBe(false);
  });

  it('applies the brand’s words: case, spelling, avoided words, exclamations, the name, custody, counts, time zones', () => {
    const { thread, post } = single({
      headline: 'Trade 24/7 With Strike!',
      sub: 'Our colour-coded book. No key at Strike can move your money. 120 markets, expiry 20:00. STRIKE never closes.',
    });
    const got = adviseFor(thread, post, 0, { layout: null });
    const has = (id: string) => got.some(a => a.id === id);
    for (const id of ['case:headline', 'avoid:headline:24/7', 'bang:headline', 'us:sub', 'custody:sub', 'count:sub', 'tz:sub:20:00', 'name:sub']) expect(has(id), id).toBe(true);
    /* fixes come before tips */
    const firstTip = got.findIndex(a => a.level === 'tip');
    expect(got.slice(firstTip).every(a => a.level === 'tip')).toBe(true);
    /* and applying the fixes one by one, as someone would, puts it right */
    let fixed = post;
    for (let i = 0; i < 20; i++) {
      const next = adviseFor({ ...thread, posts: [fixed] }, fixed, 0, { layout: null }).find(a => a.level === 'fix' && a.apply);
      if (!next) break;
      fixed = { ...fixed, ...next.apply!.patch };
    }
    expect(fixed.sub).toContain('move your funds');
    expect(fixed.sub).toContain('about 80 underlyings');
    expect(fixed.sub).toContain('20:00 ET');
    expect(fixed.sub).toContain('Strike never closes');
  });

  it('leaves the brand’s own facts alone', () => {
    const got = ids({ headline: 'About 80 underlyings. *One margin account.*', sub: 'Open 168 hours a week, against about 32.5 for listed options.' });
    expect(got.filter(i => i.startsWith('count:') || i.startsWith('check:'))).toEqual([]);
    expect(ids({ headline: 'Volume up *37%* this week.' }).some(i => i.startsWith('check:'))).toBe(true);
  });

  it('asks for the risk line on an ad without it, and forgets what was dismissed', () => {
    expect(ids({ headline: 'Trade options every hour.', risk: false })).toContain('risk');
    expect(ids({ headline: 'Trade options every hour.', risk: false, dismissed: ['risk'] })).not.toContain('risk');
  });

  it('finds nothing to fix in the examples', () => {
    for (const t of [exampleThread(), examplePosts()])
      t.posts.forEach((p, i) => {
        const fixes = adviseFor(t, p, i, { layout: null }).filter(a => a.level === 'fix' && a.action !== 'upload');
        expect(fixes.map(a => a.text), p.headline).toEqual([]);
      });
  });
});
