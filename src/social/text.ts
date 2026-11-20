/* The words of a thread, without a canvas: X's character count, the
   *highlight* syntax of card headlines, and line wrapping against any
   measure function, so the layout can be tested with a fake one. */

/* ---------- X's weighted length (twitter-text v3) ---------- */

export const X_LIMIT = 280;
export const X_URL_LENGTH = 23;

/* code points in these ranges weigh 1; everything else (CJK, emoji, …) weighs 2 */
const LIGHT: [number, number][] = [
  [0, 4351],
  [8192, 8205],
  [8208, 8223],
  [8242, 8247],
];
const weightOf = (cp: number) => (LIGHT.some(([a, b]) => cp >= a && cp <= b) ? 1 : 2);

const TLDS =
  'com|net|org|io|co|ai|app|dev|xyz|markets|market|exchange|trade|trading|finance|fi|money|capital|fund|news|blog|info|biz|me|tv|gg|so|to|ly|fm|us|uk|ca|de|fr|eu|ch|sg|hk|jp|in|link|site|online|tech|cloud|page|world|global|network|link|wtf|lol|gov|edu';
/* a link with a scheme, or a bare domain with a common TLD (not an email address or @handle) */
const URL_RE = new RegExp(`https?:\\/\\/[^\\s]+|(?<![@\\w.-])(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:${TLDS})(?![\\w-])(?:[/?#][^\\s]*)?`, 'gi');
/* punctuation after a link belongs to the sentence */
const TRAIL = /[.,:;!?'")\]]+$/;
const EMOJI = /\p{Regional_Indicator}|️|⃣/u;
const PICTO = /\p{Extended_Pictographic}/u;

const segmenter: { segment: (s: string) => Iterable<{ segment: string }> } | null =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

function graphemes(s: string): string[] {
  if (segmenter) return Array.from(segmenter.segment(s), g => g.segment);
  return Array.from(s);
}

function isEmoji(g: string): boolean {
  if (EMOJI.test(g)) return true;
  for (const ch of g) if (PICTO.test(ch) && ch.codePointAt(0)! > 4351) return true;
  return false;
}

function plainLength(s: string): number {
  let n = 0;
  for (const g of graphemes(s)) {
    if (isEmoji(g)) {
      n += 2;
      continue;
    }
    for (const ch of g) n += weightOf(ch.codePointAt(0)!);
  }
  return n;
}

/** The links in a post, as X will shorten them (start and end offsets). */
export function findUrls(text: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  for (const m of text.matchAll(URL_RE)) {
    const raw = m[0].replace(TRAIL, '');
    if (raw.length < 4) continue;
    out.push({ start: m.index!, end: m.index! + raw.length });
  }
  return out;
}

/** A post's length as X counts it: links are 23, most Latin text 1 per character, CJK and emoji 2. */
export function xLength(text: string): number {
  const s = text.normalize('NFC');
  let n = 0;
  let at = 0;
  for (const u of findUrls(s)) {
    n += plainLength(s.slice(at, u.start)) + X_URL_LENGTH;
    at = u.end;
  }
  return n + plainLength(s.slice(at));
}

/** The text that goes into X for post `index` (0-based) of `count`, numbered "1/5" on its own line if asked. */
export function postText(text: string, index: number, count: number, numbered: boolean): string {
  const body = text.trim();
  if (!numbered || count < 2) return body;
  return body ? `${body}\n\n${index + 1}/${count}` : `${index + 1}/${count}`;
}

/* ---------- *highlight* ---------- */

export interface Run {
  text: string;
  hl: boolean;
}

/** Splits "Options on *every market*" into plain and highlighted runs. A lone asterisk stays an asterisk; \* is a literal one. */
export function parseHighlight(src: string): Run[] {
  const marks: number[] = [];
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\\' && src[i + 1] === '*') i++;
    else if (src[i] === '*') marks.push(i);
  }
  if (marks.length % 2) marks.pop();
  const toggles = new Set(marks);
  const runs: Run[] = [];
  let hl = false;
  let buf = '';
  const flush = () => {
    if (!buf) return;
    const last = runs[runs.length - 1];
    if (last && last.hl === hl) last.text += buf;
    else runs.push({ text: buf, hl });
    buf = '';
  };
  for (let i = 0; i < src.length; i++) {
    if (src[i] === '\\' && src[i + 1] === '*') {
      buf += '*';
      i++;
    } else if (toggles.has(i)) {
      flush();
      hl = !hl;
    } else buf += src[i];
  }
  flush();
  return runs;
}

/** The words without the highlight marks, e.g. for a list label. */
export const plainOf = (src: string) => parseHighlight(src).map(r => r.text).join('');

/* ---------- wrapping ---------- */

/** A stretch of one line in one colour, `x` from the line's start. */
export interface Segment {
  text: string;
  hl: boolean;
  x: number;
}

export interface Line {
  text: string;
  width: number;
  segments: Segment[];
  /** which paragraph (between explicit line breaks) it belongs to */
  para: number;
}

type Piece = { text: string; hl: boolean };
type Word = Piece[];

/* runs → paragraphs (split at line breaks) → words (split at spaces), each word a list of coloured pieces */
function paragraphs(runs: Run[]): Word[][] {
  const paras: Word[][] = [[]];
  let word: Word = [];
  const endWord = () => {
    if (word.length) paras[paras.length - 1]!.push(word);
    word = [];
  };
  for (const r of runs) {
    for (const ch of r.text) {
      if (ch === '\n') {
        endWord();
        paras.push([]);
      } else if (/\s/.test(ch)) endWord();
      else {
        const last = word[word.length - 1];
        if (last && last.hl === r.hl) last.text += ch;
        else word.push({ text: ch, hl: r.hl });
      }
    }
  }
  endWord();
  return paras;
}

const wordText = (w: Word) => w.map(p => p.text).join('');

function makeLine(words: Word[], para: number, measure: (s: string) => number): Line {
  const pieces: Piece[] = [];
  words.forEach((w, i) => {
    const space = i > 0 ? [{ text: ' ', hl: !!(pieces[pieces.length - 1]?.hl && w[0]?.hl) }] : [];
    for (const p of [...space, ...w]) {
      const last = pieces[pieces.length - 1];
      if (last && last.hl === p.hl) last.text += p.text;
      else pieces.push({ ...p });
    }
  });
  const text = pieces.map(p => p.text).join('');
  let prefix = '';
  const segments = pieces.map(p => {
    const seg = { text: p.text, hl: p.hl, x: prefix ? measure(prefix) : 0 };
    prefix += p.text;
    return seg;
  });
  return { text, width: text ? measure(text) : 0, segments, para };
}

/** Greedy wrapping: as many words on each line as fit in `maxWidth`. A word too long for a line gets a line of its own. Empty paragraphs (blank lines) are kept. */
export function wrap(runs: Run[], maxWidth: number, measure: (s: string) => number): Line[] {
  const lines: Line[] = [];
  paragraphs(runs).forEach((words, para) => {
    let cur: Word[] = [];
    for (const w of words) {
      if (cur.length && measure([...cur, w].map(wordText).join(' ')) > maxWidth) {
        lines.push(makeLine(cur, para, measure));
        cur = [];
      }
      cur.push(w);
    }
    lines.push(makeLine(cur, para, measure));
  });
  /* trailing blank lines carry nothing */
  while (lines.length > 1 && !lines[lines.length - 1]!.text) lines.pop();
  return lines;
}

/** Wrapping with an even rag: the narrowest width that still takes no more lines than greedy wrapping, so no lone word is left on the last line. */
export function wrapBalanced(runs: Run[], maxWidth: number, measure: (s: string) => number): Line[] {
  const greedy = wrap(runs, maxWidth, measure);
  if (greedy.length < 2) return greedy;
  const widest = Math.max(...greedy.map(l => l.width));
  let lo = 0;
  let hi = Math.min(maxWidth, widest);
  for (let k = 0; k < 14 && hi - lo > 0.5; k++) {
    const mid = (lo + hi) / 2;
    if (wrap(runs, mid, measure).length <= greedy.length) hi = mid;
    else lo = mid;
  }
  return wrap(runs, hi, measure);
}

/** Wrapping for sentences: as full as greedy wrapping, narrowed only as far as it takes to bring a stranded last word some company. */
export function wrapPretty(runs: Run[], maxWidth: number, measure: (s: string) => number): Line[] {
  const greedy = wrap(runs, maxWidth, measure);
  if (!strandedOf(greedy)) return greedy;
  for (let w = maxWidth * 0.98; w >= maxWidth * 0.6; w -= maxWidth * 0.02) {
    const lines = wrap(runs, w, measure);
    if (lines.length === greedy.length && !strandedOf(lines)) return lines;
  }
  return wrapBalanced(runs, maxWidth, measure);
}

/** How even the rag is: the shortest line over the longest, within each paragraph that wraps (1 is perfectly even; a lone short word on a line scores low). */
export function ragOf(lines: Line[]): number {
  let worst = 1;
  const paras = new Map<number, Line[]>();
  for (const l of lines) paras.set(l.para, [...(paras.get(l.para) ?? []), l]);
  for (const ls of paras.values()) {
    if (ls.length < 2) continue;
    const max = Math.max(...ls.map(l => l.width));
    if (max > 0) worst = Math.min(worst, Math.min(...ls.map(l => l.width)) / max);
  }
  return worst;
}

/** Lines left holding one word where a reader would expect more: any but the last line of a paragraph, or a last line shorter than half the longest. A lone word that is the whole paragraph is fine. */
export function strandedOf(lines: Line[]): number {
  let n = 0;
  const paras = new Map<number, Line[]>();
  for (const l of lines) paras.set(l.para, [...(paras.get(l.para) ?? []), l]);
  for (const ls of paras.values()) {
    if (ls.length < 2) continue;
    const max = Math.max(...ls.map(l => l.width));
    ls.forEach((l, i) => {
      const single = l.text.trim() !== '' && !/\s/.test(l.text.trim());
      if (single && (i < ls.length - 1 || l.width < 0.5 * max)) n++;
    });
  }
  return n;
}

/** The widest line. */
export const widthOf = (lines: Line[]) => lines.reduce((m, l) => Math.max(m, l.width), 0);
