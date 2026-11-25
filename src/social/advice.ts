/* Suggestions while someone makes a post: which illustration fits the
   headline, which size suits the picture, what to highlight, and the brand's
   word and number rules. Each one says what was noticed and offers the next
   step; none is forced, and each can be dismissed. Pure: no canvas, so it is
   tested directly. */
import { LIBRARY } from '../library';
import { LOUD, patternContrast, presetSpec } from '../pattern/spec';
import { chartIssues } from './chart';
import { type CardLayout, type CardSize, splitHero } from './layout';
import { parseHighlight, plainOf } from './text';
import { groundOfPost, type Post, riskOfPost, sizeOfPost, type Thread } from './types';
import { avoidedIn, britishIn, isTitleCase, taglineVariant, TAGLINE, toSentenceCase, toUS } from './voice';

export interface Advice {
  /** stable, so a dismissal sticks: e.g. "figure:always-open" */
  id: string;
  /** a brand rule is broken, or it's a tip that would make it better */
  level: 'fix' | 'tip';
  /** what it is about, for grouping */
  about: 'picture' | 'size' | 'emphasis' | 'words' | 'numbers' | 'legal';
  /** what was noticed, and what to do: one line */
  text: string;
  /** the change, ready to apply */
  apply?: { label: string; patch: Partial<Post> };
  /** a step the editor takes instead of a change (choose a file) */
  action?: 'upload';
}

/* ---------- which illustration fits ---------- */

/* words people write, and the illustrations that say them; on top of each illustration's own tags and title */
const TOPICS: [RegExp, string[]][] = [
  [/\b(hours?|never close[sd]?|always open|around the clock|weekends?|overnight|every hour|168|24\/7|nights?|clock)\b/i, ['always-open', 'always-on', 'time-zones']],
  [/\b(closed|81%|32\.5|of the week|listed options)\b/i, ['ticks-chart', 'always-open']],
  [/\b(custody|self-custod\w*|keys?|funds|vault|withdraw\w*|trust(ed)?|proof|proven|attesters?)\b/i, ['vault', 'blocks']],
  [/\b(margin|collateral|one account|balance|net(ting)?)\b/i, ['unified-margin', 'premium']],
  [/\b(underlyings?|markets?|stocks?|indices|etfs?|crypto|btc|eth|sol|every market|asset classes?)\b/i, ['every-market', 'market-rays', 'globe']],
  [/\b(gpu|compute|h100|h200|b200|a100|rtx)\b/i, ['gpu', 'servers']],
  [/\b(pre-?ipo|openai|anthropic|private companies)\b/i, ['every-market', 'rising-blocks']],
  [/\b(expir\w*|daily|20:00|weekl\w*|monthl\w*|calendar|friday)\b/i, ['expiry', 'theta']],
  [/\b(volatility|iv|implied|skew|smile)\b/i, ['iv-circles', 'vol-smile', 'iv-segments', 'vol-surface']],
  [/\b(hedg\w*|protect\w*|downside)\b/i, ['long-put', 'payoff-slabs']],
  [/\b(payoff|outcomes?|scenarios?|strateg\w*|straddle|spread|condor)\b/i, ['payoff-slabs', 'straddle', 'iron-condor']],
  [/\b(speed|fast|latency|microseconds?|matching|engine)\b/i, ['latency', 'gears']],
  [/\b(settle\w*|cash|usdc|payouts?)\b/i, ['settlement', 'premium']],
  [/\b(fees?|bps|maker|taker)\b/i, ['premium', 'tiles']],
  [/\b(volume|growth|grew|up \d|record|users?|traders?|signups?|waitlist)\b/i, ['rising-blocks', 'bars', 'area']],
  [/\b(share|split|breakdown|by sector|open interest|composition|percent of)\b/i, ['bubbles', 'pie', 'treemap']],
  [/\b(terminal|trade|trading|order book|chain|tickets?)\b/i, ['terminal', 'option-chain', 'depth']],
  [/\b(app|mobile|phone)\b/i, ['phone']],
  [/\b(global|world|everywhere|asia|europe|time zones?)\b/i, ['globe', 'time-zones', 'orbit']],
  [/\b(network|connected|nodes)\b/i, ['network', 'orbit']],
  [/\b(stack|layers?|architecture|api|infrastructure)\b/i, ['layers', 'stacked-frames']],
  [/\b(compare|versus|vs\.?|against|instead of)\b/i, ['versus', 'feature-radar']],
  [/\b(launch|introducing|meet|strike)\b/i, ['drawn-mark', 'circles']],
];

const norm = (s: string) => s.toLowerCase().replace(/[*_]/g, '');

/** The library illustrations that best fit these words, best first, with their scores. */
export function suggestFigures(words: string, n = 3): { id: string; title: string; score: number }[] {
  const text = norm(words);
  if (!text.trim()) return [];
  const score = new Map<string, number>();
  const add = (id: string, v: number) => score.set(id, (score.get(id) ?? 0) + v);
  for (const [re, ids] of TOPICS) if (re.test(text)) ids.forEach((id, i) => add(id, 3 - Math.min(2, i)));
  for (const it of LIBRARY) {
    for (const tag of it.tags) if (tag.length > 2 && tag !== 'brand' && new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`, 'i').test(text)) add(it.id, 1.5);
    if (new RegExp(`\\b${it.title.toLowerCase().replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}\\b`).test(text)) add(it.id, 2);
  }
  return [...score.entries()]
    .map(([id, s]) => ({ id, s }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map(({ id, s }) => ({ id, title: LIBRARY.find(x => x.id === id)?.title ?? id, score: s }));
}

/* ---------- which size suits ---------- */

/** The size a screenshot of this shape reads largest in. */
export function sizeForAspect(aspect: number): CardSize {
  return aspect >= 1.45 ? 'landscape' : aspect <= 0.9 ? 'portrait' : 'square';
}

const SIZE_NAME: Record<CardSize, string> = { landscape: '16:9', square: '1:1', portrait: '4:5' };

/* ---------- what to highlight ---------- */

const NUMBER = /(?:about\s+)?[~+−-]?\d[\d.,]*(?:\s?(?:%|x|×|bps|ms|μs|h\b|hours?|days?|weeks?|underlyings|markets|ET\b))?/i;

/** A phrase worth highlighting in a headline with none: its number, else its last clause, else its last two words. */
export function highlightFor(headline: string): string | null {
  const plain = plainOf(headline).trim();
  const words = plain.split(/\s+/).filter(Boolean);
  if (words.length < 3) return null;
  const num = NUMBER.exec(plain);
  if (num && num[0].trim().length > 0) return num[0].trim();
  const clauses = plain.split(/(?<=[,.;:])\s+/).filter(Boolean);
  const last = clauses[clauses.length - 1]!.replace(/[.,;:]$/, '');
  if (clauses.length > 1 && last.split(/\s+/).length <= 4) return last;
  return words.slice(-2).join(' ').replace(/[.,;:]$/, '');
}

/** Put *asterisks* round the first `phrase` in `headline`. */
export function withHighlight(headline: string, phrase: string): string {
  const i = headline.indexOf(phrase);
  return i < 0 ? headline : `${headline.slice(0, i)}*${phrase}*${headline.slice(i + phrase.length)}`;
}

/* ---------- numbers ---------- */

/* the brand's own facts: no need to check them */
const KNOWN = /^(?:168|32\.5|135|81%?|80|20:00|1\/\d+|\d\/\d+|1|2|3|0)$/;

/* ---------- all of it ---------- */

export interface AdviceContext {
  /** the card as laid out now */
  layout: CardLayout | null;
  /** the headline's size on the card in each size, for size advice */
  headlineSizes?: Partial<Record<CardSize, { size: number; overflow: boolean }>>;
}

export function adviseFor(thread: Thread, post: Post, index: number, ctx: AdviceContext): Advice[] {
  const out: Advice[] = [];
  const size = sizeOfPost(thread, post);
  const ground = groundOfPost(thread, post);
  const head = post.headline;
  const headPlain = plainOf(head).trim();
  const fields: [keyof Post & ('headline' | 'sub' | 'eyebrow' | 'text'), string][] = [
    ['headline', head],
    ['sub', post.sub],
    ['eyebrow', post.eyebrow],
    ['text', post.text],
  ];
  const label = { headline: 'the headline', sub: 'the line below', eyebrow: 'the small line', text: 'the post text' } as const;

  /* the picture */
  if ((post.visual === 'screenshot' || post.visual === 'photo') && !post.image)
    out.push({ id: `picture:add:${post.visual}`, level: 'fix', about: 'picture', text: post.visual === 'screenshot' ? 'Add your screenshot: it goes in the frame as it is, at true colors.' : 'Add a photo: it fills the card, toned so the words read.', action: 'upload' });
  if (post.visual === 'panel' || post.visual === 'corner') {
    const best = suggestFigures(`${head} ${post.sub} ${post.eyebrow}`, 3);
    const current = post.figure.kind === 'library' ? post.figure.id : null;
    const top = best[0];
    if (top && top.score >= 3 && current !== top.id && !best.slice(0, 2).some(b => b.id === current))
      out.push({ id: `figure:${top.id}`, level: 'tip', about: 'picture', text: `“${top.title}” fits this headline.`, apply: { label: 'Use it', patch: { figure: { kind: 'library', id: top.id } } } });
  }
  if (post.visual === 'screenshot' && post.image) {
    const want = sizeForAspect(post.image.w / post.image.h);
    if (want !== size)
      out.push({
        id: `size:shot:${want}`,
        level: 'tip',
        about: 'size',
        text: `This screenshot is ${want === 'landscape' ? 'wide' : want === 'portrait' ? 'tall' : 'nearly square'}: it reads largest at ${SIZE_NAME[want]}.`,
        apply: { label: `Make it ${SIZE_NAME[want]}`, patch: { size: want } },
      });
    if (!post.sub.trim()) out.push({ id: 'shot:caption', level: 'tip', about: 'numbers', text: 'Say what the screenshot shows in the line below: what, when, where it comes from.' });
  }
  /* the poster layouts need their words in a certain shape */
  if (post.layout === 'hero' && !splitHero(head)) out.push({ id: 'hero:number', level: 'fix', about: 'numbers', text: 'The big-number layout sets the headline’s number huge, but this headline has no number. Add one, or pick another layout.' });
  if (post.layout === 'card' && post.visual !== 'screenshot' && post.visual !== 'photo' && post.visual !== 'chart' && !post.pattern) out.push({ id: 'card:picture', level: 'tip', about: 'picture', text: 'The card layout puts the words on a white card over a picture. Add a screenshot or a photo behind it.', apply: { label: 'Use a screenshot', patch: { visual: 'screenshot' } } });
  if (post.layout === 'cover' && post.visual !== 'photo' && !post.pattern) out.push({ id: 'cover:picture', level: 'tip', about: 'picture', text: 'The cover reads best over a photo, or a quiet dot pattern.', apply: { label: 'Add a pattern', patch: { pattern: presetSpec('soft-wave') } } });

  /* a chart: the brand's data rules */
  if (post.visual === 'chart') chartIssues(post.chart).forEach((text, i) => out.push({ id: `chart:${i}:${text.slice(0, 24)}`, level: 'tip', about: 'numbers', text }));
  /* a card with nothing but a few words can carry a quiet pattern */
  if (post.visual === 'none' && !post.pattern && headPlain && headPlain.split(/\s+/).length <= 10 && !post.sub.trim())
    out.push({ id: 'pattern:empty', level: 'tip', about: 'picture', text: 'The card is mostly empty. A quiet dot pattern can fill it without taking over.', apply: { label: 'Add a pattern', patch: { pattern: presetSpec('wave') } } });
  if (post.pattern && patternContrast(post.pattern, post.visual === 'photo' ? 'green' : ground) > LOUD)
    out.push({ id: 'pattern:loud', level: 'tip', about: 'picture', text: 'The dot pattern is loud enough to compete with the headline. Quiet keeps the words first.', apply: { label: 'Make it quiet', patch: { pattern: { ...post.pattern, color: null, opacity: 1 } } } });

  /* a size where the headline sets clearly larger, when the picture doesn't decide */
  if (ctx.headlineSizes && post.visual !== 'screenshot') {
    const now = ctx.headlineSizes[size];
    let best: CardSize | null = null;
    for (const s of ['landscape', 'square', 'portrait'] as const) {
      const v = ctx.headlineSizes[s];
      if (!v || !now || s === size || v.overflow) continue;
      if (v.size >= now.size * 1.25 && (!best || v.size > ctx.headlineSizes[best]!.size)) best = s;
    }
    if (best && now && headPlain.split(/\s+/).length > 5)
      out.push({ id: `size:words:${best}`, level: 'tip', about: 'size', text: `The headline sets ${Math.round((ctx.headlineSizes[best]!.size / now.size - 1) * 100)}% larger at ${SIZE_NAME[best]}.`, apply: { label: `Make it ${SIZE_NAME[best]}`, patch: { size: best } } });
  }

  /* emphasis */
  const runs = parseHighlight(head);
  const hl = runs.filter(r => r.hl);
  if (headPlain && !hl.length) {
    const phrase = highlightFor(head);
    if (phrase)
      out.push({ id: `hl:${phrase}`, level: 'tip', about: 'emphasis', text: `Highlight “${phrase}”: ${NUMBER.test(phrase) ? 'the number is the news' : 'it says what matters'}.`, apply: { label: 'Highlight it', patch: { headline: withHighlight(head, phrase) } } });
  }
  if (hl.length > 1) out.push({ id: 'hl:one', level: 'tip', about: 'emphasis', text: 'Highlight one phrase only, so it stands out.' });
  if (hl.length === 1 && headPlain && hl[0]!.text.trim().length / headPlain.length > 0.6) out.push({ id: 'hl:less', level: 'tip', about: 'emphasis', text: 'Highlight less: a short phrase stands out more than most of the headline.' });

  /* hierarchy */
  if (ctx.layout?.overflow) out.push({ id: 'fit', level: 'fix', about: 'words', text: 'The words don’t all fit. Shorten the headline or the line below.' });
  const hw = headPlain ? headPlain.split(/\s+/).length : 0;
  if (hw > 12) out.push({ id: 'head:long', level: 'tip', about: 'words', text: `The headline has ${hw} words. 3–8 words set bigger and read faster.` });
  if (post.sub.trim().length > 140) out.push({ id: 'sub:long', level: 'tip', about: 'words', text: 'Keep the line below to one short sentence; the rest can go in the post text.' });
  if (post.sub.trim() && plainOf(post.sub).length > 2.5 * Math.max(1, headPlain.length) && headPlain) out.push({ id: 'sub:louder', level: 'tip', about: 'words', text: 'The line below says more than the headline. Move the news into the headline.' });
  if (post.eyebrow.trim().split(/\s+/).length > 4) out.push({ id: 'eyebrow:long', level: 'tip', about: 'words', text: 'Keep the small line to a word or two.' });

  /* the brand's words */
  if (isTitleCase(headPlain)) out.push({ id: 'case:headline', level: 'fix', about: 'words', text: 'Write the headline in sentence case: a capital for the first word and names only.', apply: { label: 'Fix the case', patch: { headline: toSentenceCase(head) } } });
  for (const [k, v] of fields) {
    if (!v.trim()) continue;
    const tag = taglineVariant(v);
    if (tag) out.push({ id: `tagline:${k}`, level: 'fix', about: 'words', text: `Write the tagline as it is: “${TAGLINE}”`, apply: { label: 'Fix it', patch: { [k]: v.replace(tag, TAGLINE) } } });
    const uk = britishIn(v);
    if (uk.length) out.push({ id: `us:${k}`, level: 'fix', about: 'words', text: `Use US spelling in ${label[k]}: ${uk.map(u => `${u.word} → ${u.us}`).join(', ')}.`, apply: { label: 'Fix spelling', patch: { [k]: toUS(v) } } });
    for (const a of avoidedIn(v)) out.push({ id: `avoid:${k}:${a.word}`, level: 'fix', about: 'words', text: `Avoid “${a.found}” in ${label[k]}: ${a.fix}.` });
    if (k !== 'text' && /!/.test(v)) out.push({ id: `bang:${k}`, level: 'fix', about: 'words', text: `No exclamation marks in ${label[k]}.`, apply: { label: 'Remove it', patch: { [k]: v.replace(/!+/g, '.').replace(/\.\./g, '.') } } });
    if (/\bSTRIKE\b/.test(v) && /[a-z]/.test(v)) out.push({ id: `name:${k}`, level: 'fix', about: 'words', text: `Write “Strike”, not “STRIKE”, in ${label[k]}: capitals are the logo's.`, apply: { label: 'Fix it', patch: { [k]: v.replace(/\bSTRIKE\b/g, 'Strike') } } });
    if (/no key at strike can move your money/i.test(v)) out.push({ id: `custody:${k}`, level: 'fix', about: 'words', text: 'The custody line says “funds”, and comes with what is still trusted.', apply: { label: 'Fix it', patch: { [k]: v.replace(/move your money/i, 'move your funds') } } });
    /* market counts other than the brand's */
    for (const m of v.matchAll(/(~|over\s+|more than\s+|about\s+|around\s+)?(\d[\d,]*)(\+)?\s+(?:[a-z-]+\s+)?(markets|underlyings)\b/gi)) {
      const ok = m[2] === '80' && /^(?:about|around)\s+$/i.test(m[1] ?? '') && !m[3] && m[4]!.toLowerCase() === 'underlyings';
      if (!ok) out.push({ id: `count:${k}`, level: 'fix', about: 'numbers', text: `Strike's count is “about 80 underlyings”, not “${m[0]}”.`, apply: { label: 'Fix it', patch: { [k]: v.replace(m[0], /^\p{Lu}/u.test(m[0]) ? 'About 80 underlyings' : 'about 80 underlyings') } } });
    }
    /* times need their zone */
    for (const m of v.matchAll(/\b([01]?\d|2[0-3]):[0-5]\d\b(?!\s*(?:ET|UTC|GMT|PT|CET|SGT))/g))
      out.push({ id: `tz:${k}:${m[0]}`, level: 'fix', about: 'numbers', text: `Add the time zone: “${m[0]} ET”.`, apply: { label: 'Add ET', patch: { [k]: v.replace(m[0], `${m[0]} ET`) } } });
    if (/\bUSD\b/.test(v) && !/USDC/.test(v)) out.push({ id: `usd:${k}`, level: 'tip', about: 'numbers', text: `Strike settles in USDC. Check “USD” in ${label[k]} means what you want.` });
  }
  /* numbers the brand doesn't already state: worth a check, and a source */
  if (k2(head) || k2(post.sub)) {
    const nums = [...`${headPlain} ${plainOf(post.sub)}`.matchAll(/\d[\d.,]*%?/g)].map(m => m[0].replace(/[.,]$/, '')).filter(n => !KNOWN.test(n));
    if (nums.length) out.push({ id: `check:${nums.join(',')}`, level: 'tip', about: 'numbers', text: `Check ${nums.map(n => `“${n}”`).join(', ')} ${nums.length > 1 ? 'are' : 'is'} current, and say where ${nums.length > 1 ? 'they come' : 'it comes'} from in the post text.` });
  }

  /* the risk line */
  const risky = /\b(options?|trad\w*|hedg\w*|leverage|margin|returns?|profit)\b/i.test(`${head} ${post.sub} ${post.text}`);
  if (!riskOfPost(thread, post, index) && risky && (thread.kind === 'posts' || index === thread.posts.length - 1))
    out.push({ id: 'risk', level: 'tip', about: 'legal', text: 'Ads and the last post of a trading thread carry the risk line.', apply: { label: 'Show it', patch: { risk: true } } });

  const dismissed = new Set(post.dismissed);
  return out.filter(a => !dismissed.has(a.id)).sort((a, b) => (a.level === b.level ? 0 : a.level === 'fix' ? -1 : 1));
}

const k2 = (s: string) => /\d/.test(s);
