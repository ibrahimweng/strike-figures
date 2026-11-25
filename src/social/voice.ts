/* Strike's word rules, for suggestions while people write. The lists are the
   brand checker's own (skill/scripts/check.mjs); a test keeps them equal. */

export const TAGLINE = 'Options on every market, every hour.';

/** Words the brand book says to avoid (0.6), with what to say instead. */
export const AVOID: { re: RegExp; word: string; fix: string }[] = [
  { re: /(?<![\w/])24\s*\/\s*7(?![\w/])/g, word: '24/7', fix: 'say "every hour" or "open 168 hours a week"' },
  { re: /\brevolution(?:ary|ize|ise)s?\b/gi, word: 'revolutionary', fix: 'state the fact that makes it new' },
  { re: /\bunforgettable\b/gi, word: 'unforgettable', fix: 'state a fact the reader can check' },
  { re: /\bsafe(?:ly|st)?\b/gi, word: 'safe', fix: 'say what protects the funds, and what is still trusted' },
];

/** British spellings, mapped to the US ones the brand writes. */
export const UK_SPELLING: Record<string, string> = {
  colour: 'color', colours: 'colors', coloured: 'colored', colourful: 'colorful', recolour: 'recolor',
  grey: 'gray', greys: 'grays', centre: 'center', centres: 'centers', centred: 'centered',
  favour: 'favor', favourite: 'favorite', favourites: 'favorites', behaviour: 'behavior', honour: 'honor', humour: 'humor',
  neighbour: 'neighbor', neighbours: 'neighbors', labour: 'labor', flavour: 'flavor',
  organise: 'organize', organised: 'organized', organisation: 'organization', recognise: 'recognize', recognised: 'recognized',
  realise: 'realize', realised: 'realized', prioritise: 'prioritize', summarise: 'summarize', minimise: 'minimize', maximise: 'maximize',
  optimise: 'optimize', optimised: 'optimized', customise: 'customize', customised: 'customized', emphasise: 'emphasize',
  analyse: 'analyze', analysed: 'analyzed', catalogue: 'catalog', programme: 'program', licence: 'license', defence: 'defense',
  metre: 'meter', metres: 'meters', cancelled: 'canceled', labelled: 'labeled', modelling: 'modeling', travelled: 'traveled',
};

/** Names that keep their capital in a sentence-case heading. */
export const PROPER = new Set(
  'strike geist ciburial arial pantone openai anthropic figma claude chatgpt cursor codex copilot gemini perplexity windsurf jules github x ethereum bitcoin solana asia europe america monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december ornn tailwind green deep light'.split(
    ' ',
  ),
);

const UK_RE = new RegExp(`\\b(${Object.keys(UK_SPELLING).join('|')})\\b`, 'gi');

/** Each British spelling in `text`, with the US form in the same case. */
export function britishIn(text: string): { word: string; us: string }[] {
  const out: { word: string; us: string }[] = [];
  for (const m of text.matchAll(UK_RE)) {
    const us = UK_SPELLING[m[0].toLowerCase()]!;
    out.push({ word: m[0], us: m[0][0] === m[0][0]!.toUpperCase() ? us[0]!.toUpperCase() + us.slice(1) : us });
  }
  return out;
}

/** `text` with every British spelling made US. */
export const toUS = (text: string) => text.replace(UK_RE, w => britishIn(w)[0]!.us);

/** Each avoided word in `text`. */
export function avoidedIn(text: string): { word: string; found: string; fix: string }[] {
  const out: { word: string; found: string; fix: string }[] = [];
  for (const a of AVOID) for (const m of text.matchAll(a.re)) out.push({ word: a.word, found: m[0], fix: a.fix });
  return out;
}

const proper = (w: string) => PROPER.has(w.toLowerCase().replace(/['’]s$/, ''));
const SMALL = /^(?:on|of|the|and|or|in|to|for|with|at|by|from|every|a|an|is|are)$/i;
const isCapped = (w: string) => /^\p{Lu}/u.test(w) && /\p{Ll}/u.test(w);

/** True when most words after the first are capitalized: "Our Tone of Voice", "Options On Every Market". */
export function isTitleCase(text: string): boolean {
  const all = text.replace(/[^\p{L}\p{N}\s'’-]/gu, ' ').split(/\s+/).filter(Boolean);
  const named = new Set(all.flatMap((_w, i) => (i > 0 && proper(all[i - 1]!) ? [i] : [])));
  const words = all.slice(1);
  const caps = (w: string, i: number) => isCapped(w) && !proper(w) && !named.has(i + 1);
  if (words.some(w => SMALL.test(w) && /^\p{Lu}/u.test(w))) return words.some(caps);
  const long = words.map((w, i) => ({ w, i })).filter(({ w }) => w.length >= 4 && /^\p{L}/u.test(w) && !/^\p{Lu}+$/u.test(w));
  const capped = long.filter(({ w, i }) => caps(w, i));
  return capped.length >= (words.length <= 2 ? 1 : 2) && capped.length / Math.max(1, long.length) >= 0.6;
}

/** `text` in sentence case: the first word and names keep their capitals; acronyms stay. Keeps *highlight* marks and line breaks. */
export function toSentenceCase(text: string): string {
  let prevProper = false;
  return text.replace(/[\p{L}][\p{L}'’-]*/gu, (w, at: number) => {
    /* a sentence starts the text, or follows . ! ? or : */
    const start = /^[\s*]*$/.test(text.slice(0, at)) || /[.!?:]\s*\**\s*$/.test(text.slice(0, at));
    const keep = start || proper(w) || (prevProper && !SMALL.test(w)) || /^\p{Lu}+$/u.test(w) || /\p{Ll}\p{Lu}/u.test(w);
    prevProper = proper(w);
    return keep ? w : w[0]!.toLowerCase() + w.slice(1);
  });
}

/** The tagline, written some other way ("Options On Every Market, Every Hour"), or null. */
export function taglineVariant(text: string): string | null {
  const m = /options\s+on\s+every\s+market,?\s+every\s+hour\.?/i.exec(text);
  if (!m) return null;
  const said = m[0].replace(/\s+/g, ' ');
  return said === TAGLINE || said === TAGLINE.slice(0, -1) || said.toLowerCase() === said ? null : m[0];
}
