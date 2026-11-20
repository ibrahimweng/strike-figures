#!/usr/bin/env node
// Strike brand checker. Zero dependencies, Node 22+.
//
//   node scripts/check.mjs <files or dirs> [--json] [--tokens <tokens.json>]
//
// Checks .html .css .svg .jsx .tsx .vue .md files for off-brand colours, fonts,
// contrast, headings, the name, copy, the risk line and corner radii.
// Prints file:line:col, severity, rule, the problem and a one-line fix.
// Exit code: 1 when there are errors, 2 on bad usage, 0 otherwise.
//
// The brand's finished poster artwork (assets/posters/) is exempt from the
// colour rules: it is reference art, not output to check.
//
// To silence a finding you have checked, put `strike-check-ignore` (optionally
// followed by `: rule, rule`) in a comment on that line or the line above.
// `strike-check-ignore-file` anywhere skips the file.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, dirname, resolve, relative, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const EMBEDDED_TOKENS = {"$description":"Strike design tokens (W3C Design Tokens format). The single source for CSS, Tailwind and Figma. Dark is the default theme.","color":{"$type":"color","ground":{"$value":"#0C0C0C","$description":"The dark background: posters, social cards, illustrations, app modules"},"web":{"ground":{"$value":"#090B0A","$description":"Website and marketing page background (about 80%)"},"section":{"$value":"#0F1110","$description":"Website alternate sections and cards (about 20%), for depth and separation"}},"ink":{"$value":"#F9F9F9","$description":"Text on ground; ground of light layouts"},"ink-2":{"$value":"#B3B3B3","$description":"Secondary text on dark (9.3:1)"},"ink-3":{"$value":"#8A8F98","$description":"Muted text and icons on dark (6.0:1)"},"green":{"$value":"#10B981","$description":"Primary action, focus, one highlight"},"deep":{"$value":"#047857","$description":"Green text or lines on light grounds (5.2:1)"},"mark-light":{"$value":"#6EE7B7","$description":"Logo gradient only"},"profit":{"$value":"#3FD4AB","$description":"Gains, buys, bids"},"loss":{"$value":"#EE5E74","$description":"Losses, sells, asks. Red means loss and nothing else"},"mint":{"$value":"#50EBA0","$description":"Poster grounds only"},"data":{"yellow":{"$value":"#FFEF3C","$description":"Charts with several series only"},"sky":{"$value":"#0788F7","$description":"Charts with several series only"},"purple":{"$value":"#976FE6","$description":"Charts with several series only"}},"dark":{"frame":{"$value":"#2E2E2E","$description":"App frame: the lighter background that shows only in the thin gaps between modules"},"surface-1":{"$value":"#161616","$description":"Raised controls on a module: inputs, tabs, secondary buttons"},"surface-2":{"$value":"#202020","$description":"Hover and selected"},"surface-3":{"$value":"#2A2A2A","$description":"Pressed; the strongest raise"},"line":{"$value":"#FFFFFF1A","$description":"Hairlines (10%)"},"line-strong":{"$value":"#FFFFFF2E","$description":"Input borders and dividers (18%)"}},"light":{"ground":{"$value":"#F9F9F9"},"surface-1":{"$value":"#FFFFFF"},"surface-2":{"$value":"#F1F1F1"},"surface-3":{"$value":"#E8E8E9"},"ink":{"$value":"#0C0C0C"},"ink-2":{"$value":"#4A4D52","$description":"8.1:1 on light ground"},"ink-3":{"$value":"#6B6F76","$description":"4.8:1 on light ground"},"line":{"$value":"#0C0C0C14"},"line-strong":{"$value":"#0C0C0C24"}}},"font":{"family":{"$type":"fontFamily","sans":{"$value":["Geist","Arial","sans-serif"]},"mono":{"$value":["Geist Mono","ui-monospace","monospace"],"$description":"Code, wallet addresses, order books only"},"display-pixel":{"$value":["Geist Pixel Circle","Geist","sans-serif"],"$description":"Big display numbers on posters only"},"wordmark":{"$value":["Ciburial"],"$description":"The STRIKE wordmark only; use the logo files"}},"weight":{"$type":"fontWeight","light":{"$value":300},"regular":{"$value":400},"medium":{"$value":500},"semibold":{"$value":600}}},"typography":{"$type":"typography","display":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":500,"fontSize":"72px","lineHeight":0.95,"letterSpacing":"-0.03em"}},"h1":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":500,"fontSize":"48px","lineHeight":1,"letterSpacing":"-0.03em"}},"h2":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":500,"fontSize":"32px","lineHeight":1.1,"letterSpacing":"-0.02em"}},"h3":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":500,"fontSize":"24px","lineHeight":1.2,"letterSpacing":"-0.015em"}},"body-l":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":400,"fontSize":"18px","lineHeight":1.5,"letterSpacing":"0"}},"body":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":400,"fontSize":"16px","lineHeight":1.5,"letterSpacing":"0"}},"small":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":400,"fontSize":"14px","lineHeight":1.45,"letterSpacing":"0"}},"label":{"$value":{"fontFamily":"{font.family.sans}","fontWeight":500,"fontSize":"12px","lineHeight":1.4,"letterSpacing":"0.02em"}}},"space":{"1":{"$value":"4px"},"2":{"$value":"8px"},"3":{"$value":"12px"},"4":{"$value":"16px"},"5":{"$value":"24px"},"6":{"$value":"32px"},"7":{"$value":"48px"},"8":{"$value":"64px"},"9":{"$value":"96px"},"10":{"$value":"128px"},"$type":"dimension","grid":{"$value":"50px","$description":"Posters, cards, illustrations"}},"radius":{"$type":"dimension","sm":{"$value":"6px","$description":"Small controls"},"md":{"$value":"8px","$description":"Buttons, inputs"},"lg":{"$value":"12px","$description":"Cards"},"pill":{"$value":"9999px"}},"size":{"$type":"dimension","control":{"$value":"40px"},"control-sm":{"$value":"32px"},"logo-mark-min":{"$value":"16px"},"logo-lockup-min-height":{"$value":"20px"}},"motion":{"duration":{"$type":"duration","fast":{"$value":"120ms"},"base":{"$value":"200ms"},"slow":{"$value":"320ms"}},"ease":{"$type":"cubicBezier","standard":{"$value":[0.2,0,0,1]}}}}; // generated from source/tokens.json

const HERE = dirname(fileURLToPath(import.meta.url));
export const EXTENSIONS = ['.html', '.htm', '.css', '.svg', '.jsx', '.tsx', '.vue', '.md', '.mdx', '.mdc'];
const SKIP_DIRS = new Set(['node_modules', '.git', '.next', '.nuxt', '.cache', '.turbo']);

// Colours allowed besides tokens.json: the illustration line greys (dark and
// light tiers) and the logo's gradient stops.
export const EXTRA_COLOURS = {
  '#D0D6E0': 'illustration subject line',
  '#62666D': 'illustration support line',
  '#3E3E44': 'illustration background line',
  '#2E2E32': 'illustration line on light',
  '#E4E5E9': 'illustration line on light',
  '#34D399': 'logo gradient',
  '#059669': 'logo gradient',
  '#065F46': 'logo gradient',
  '#064E3B': 'logo gradient',
  '#6EE7B7': 'logo gradient',
};

const ALLOWED_FONTS = new Set(['geist', 'geist variable', 'geist mono', 'geist pixel circle', 'arial', 'system-ui', 'sans-serif', 'monospace', 'ui-monospace']);
const FONT_KEYWORDS = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);
const RADII_PX = new Set([0, 6, 8, 12, 9999]);
const STRIKE_GREEN = '#10B981';
const RISK_LINE = 'Options involve risk. Closed beta, invite required.';

// Tailwind's default palette. A few shades equal Strike colours exactly.
const TW_FAMILIES = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const TW_COLOUR_PREFIX = 'bg|text|border(?:-[trblxyse])?|ring|ring-offset|fill|stroke|from|via|to|outline|decoration|divide|accent|caret|placeholder|shadow';
const TW_DEFAULT_RE = new RegExp(`^(?:${TW_COLOUR_PREFIX})-(${TW_FAMILIES})-(50|100|200|300|400|500|600|700|800|900|950)(?:\\/\\d+)?$`);
const TW_SAME_AS_STRIKE = {
  'emerald-300': '#6EE7B7', 'emerald-400': '#34D399', 'emerald-500': '#10B981', 'emerald-600': '#059669',
  'emerald-700': '#047857', 'emerald-800': '#065F46', 'emerald-900': '#064E3B', 'zinc-900': '#18181B',
};

const NAMED_COLOURS = new Set(('aliceblue antiquewhite aqua aquamarine azure beige bisque blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat whitesmoke yellow yellowgreen').split(' '));
const COLOUR_PROPS = /^(color|background|background-color|border(-(top|right|bottom|left|block|inline))?(-color)?|outline(-color)?|fill|stroke|text-decoration(-color)?|caret-color|accent-color|column-rule(-color)?|box-shadow|text-shadow|stop-color|flood-color)$/;

// ---------------------------------------------------------------- tokens

export function loadTokens(explicit) {
  const candidates = explicit
    ? [resolve(explicit)]
    : ['../source/tokens.json', '../references/tokens.json', '../tokens/tokens.json', '../tokens.json', 'tokens.json'].map((p) => resolve(HERE, p));
  for (const p of candidates) if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));
  if (EMBEDDED_TOKENS) return EMBEDDED_TOKENS;
  throw new Error('tokens.json not found next to the checker. Pass --tokens <path>.');
}

// Colour tokens as CSS variable names (same naming as the build's tokens.css):
// color.ink -> ink, color.data.sky -> data-sky, color.dark.surface-1 -> surface-1.
export function paletteFrom(tokens) {
  const allowed = new Map();
  const dark = {};
  const light = {};
  const walk = (node, path) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$') || !v || typeof v !== 'object') continue;
      if ('$value' in v) {
        if (typeof v.$value !== 'string' || !/^#[0-9a-f]{3,8}$/i.test(v.$value)) continue;
        const parts = [...path, k];
        const name = parts.filter((p) => p !== 'dark' && p !== 'light').join('-');
        const hex = normHex(v.$value);
        (parts[0] === 'light' ? light : dark)[name] = hex;
        if (!allowed.has(hex.slice(0, 7))) allowed.set(hex.slice(0, 7), name);
      } else walk(v, [...path, k]);
    }
  };
  walk(tokens.color ?? {}, []);
  for (const [hex, why] of Object.entries(EXTRA_COLOURS)) if (!allowed.has(hex)) allowed.set(hex, why);
  return { allowed, dark, light: { ...dark, ...light } };
}

// ---------------------------------------------------------------- colour maths

function normHex(h) {
  h = h.trim().replace('#', '').toUpperCase();
  if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
  return '#' + h;
}

function parseColour(str) {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  if (s.startsWith('#')) {
    if (!/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(s)) return null;
    const h = normHex(s);
    const n = (i) => parseInt(h.slice(i, i + 2), 16);
    return { r: n(1), g: n(3), b: n(5), a: h.length === 9 ? n(7) / 255 : 1, hex: h.slice(0, 7) };
  }
  if (s === 'white') return { r: 255, g: 255, b: 255, a: 1, hex: '#FFFFFF' };
  if (s === 'black') return { r: 0, g: 0, b: 0, a: 1, hex: '#000000' };
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0, hex: '#000000' };
  let m = s.match(/^rgba?\((.*)\)$/);
  if (m) {
    if (m[1].includes('var(')) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const ch = (p) => (p.endsWith('%') ? (parseFloat(p) * 255) / 100 : parseFloat(p));
    const [r, g, b] = parts.slice(0, 3).map(ch).map((x) => Math.round(Math.max(0, Math.min(255, x))));
    if ([r, g, b].some(Number.isNaN)) return null;
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r, g, b, a, hex: toHex(r, g, b) };
  }
  m = s.match(/^hsla?\((.*)\)$/);
  if (m) {
    if (m[1].includes('var(')) return null;
    const parts = m[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    let h = parseFloat(parts[0]);
    if (parts[0].endsWith('turn')) h *= 360;
    else if (parts[0].endsWith('rad')) h = (h * 180) / Math.PI;
    const sat = parseFloat(parts[1]) / 100;
    const l = parseFloat(parts[2]) / 100;
    if ([h, sat, l].some(Number.isNaN)) return null;
    const k = (n) => (n + h / 30) % 12;
    const a2 = sat * Math.min(l, 1 - l);
    const f = (n) => Math.round(255 * (l - a2 * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
    const [r, g, b] = [f(0), f(8), f(4)];
    const a = parts[3] === undefined ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r, g, b, a, hex: toHex(r, g, b) };
  }
  return null;
}

const toHex = (r, g, b) => '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();

function luminance({ r, g, b }) {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function nearestColour(col, palette) {
  let best = null;
  for (const [hex, name] of palette.allowed) {
    const p = parseColour(hex);
    const d = (p.r - col.r) ** 2 + (p.g - col.g) ** 2 + (p.b - col.b) ** 2;
    if (!best || d < best.d) best = { d, hex, name };
  }
  return best;
}

export function contrastRatio(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// ---------------------------------------------------------------- small helpers

function lineIndex(src) {
  const starts = [0];
  for (let i = 0; i < src.length; i++) if (src[i] === '\n') starts.push(i + 1);
  return (offset) => {
    let lo = 0;
    let hi = starts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (starts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return { line: lo + 1, col: offset - starts[lo] + 1 };
  };
}

const blank = (s) => s.replace(/[^\n]/g, ' ');

function blankRegex(src, re) {
  return src.replace(re, (m) => blank(m));
}

const blankJsComments = (src) => src.replace(/\/\*[\s\S]*?\*\/|(^|[^:"'`\w\\])(\/\/[^\n]*)/gm, (m, a, b) => (b === undefined ? blank(m) : a + blank(b)));

function skipBraces(src, i) {
  // src[i] === '{'; returns the index after the matching '}'
  let depth = 0;
  let q = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (q) {
      if (c === '\\') j++;
      else if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') q = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return j + 1;
  }
  return src.length;
}

function stringLiterals(code) {
  const out = [];
  const re = /(["'`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(code))) out.push({ text: m[2], index: m.index + 1 });
  return out;
}

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&(m|n)dash;/g, '-')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)));

// ---------------------------------------------------------------- CSS

// Returns rules [{selector, context, decls:[{prop, value, offset, end}]}] with
// offsets relative to `base`. Top-level declarations (style attributes) land in
// a root rule whose selector is `rootSelector`.
export function parseCss(css, base = 0, rootSelector = '') {
  const s = blankRegex(css, /\/\*[\s\S]*?\*\//g);
  const root = { selector: rootSelector, context: rootSelector, decls: [], start: base, end: base + s.length };
  const rules = [root];
  const stack = [root];
  let buf = '';
  let bufStart = 0;
  let q = null;
  let paren = 0;
  const flush = (endIdx) => {
    const lead = buf.length - buf.trimStart().length;
    const text = buf.trim();
    if (text) {
      const colon = text.indexOf(':');
      if (colon > 0) {
        const prop = text.slice(0, colon).trim().toLowerCase();
        const value = text.slice(colon + 1).replace(/!important\s*$/i, '').trim();
        if (/^(--)?[a-z-]+[\w*-]*$/i.test(prop)) {
          stack.at(-1).decls.push({ prop, value, offset: base + bufStart + lead, end: base + endIdx, valueOffset: base + bufStart + lead + buf.trimStart().indexOf(':') + 1 });
        }
      }
    }
    buf = '';
  };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!buf) bufStart = i;
    if (q) {
      buf += c;
      if (c === '\\') buf += s[++i] ?? '';
      else if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'") {
      q = c;
      buf += c;
      continue;
    }
    if (c === '(') paren++;
    if (c === ')') paren = Math.max(0, paren - 1);
    if (paren === 0 && c === '{') {
      const selector = buf.trim().replace(/\s+/g, ' ');
      const parent = stack.at(-1);
      const rule = { selector, context: (parent.context ? parent.context + ' > ' : '') + selector, decls: [], start: base + bufStart, end: base + s.length };
      rules.push(rule);
      stack.push(rule);
      buf = '';
      continue;
    }
    if (paren === 0 && (c === ';' || c === '}')) {
      flush(i);
      if (c === '}' && stack.length > 1) stack.pop().end = base + i + 1;
      continue;
    }
    buf += c;
  }
  flush(s.length);
  return rules;
}

function fontFamilies(prop, value) {
  if (/var\(/.test(value) && !/,/.test(value.replace(/var\([^)]*\)/g, ''))) return [];
  let v = value.replace(/var\([^)]*\)/g, '');
  if (prop === 'font') {
    if (/^(caption|icon|menu|message-box|small-caption|status-bar|inherit|initial|unset)$/i.test(v.trim())) return [];
    const m = v.match(/(?:^|\s)(?:\d*\.?\d+(?:px|rem|em|pt|%|vw|vh|ch)|xx?-small|x?-?small|medium|x*-?large|larger|smaller)(?:\s*\/\s*\S+)?\s+(.+)$/i);
    if (!m) return [];
    v = m[1];
  }
  return v
    .split(',')
    .map((f) => f.trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}

function radiusProblem(value) {
  const v = value.trim().toLowerCase();
  if (!v || /^(inherit|initial|unset|revert|revert-layer)$/.test(v) || v.includes('var(') || v.includes('calc(') || v.includes('theme(')) return null;
  for (const part of v.split(/[\s/]+/).filter(Boolean)) {
    if (part === '50%') continue;
    const m = part.match(/^(-?\d*\.?\d+)(px|rem|em|%)?$/);
    if (!m) return part;
    let px = parseFloat(m[1]);
    const unit = m[2] ?? (px === 0 ? 'px' : '');
    if (unit === 'rem') px *= 16;
    else if (unit !== 'px') return part;
    if (!RADII_PX.has(Math.round(px * 100) / 100)) return part;
  }
  return null;
}

// ---------------------------------------------------------------- markup

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const CODE_TAGS = new Set(['code', 'pre', 'kbd', 'samp']);
const LOGO_RE = /logo|wordmark|lock-?up|brand-?mark/i;
const HEADING_CLASS_RE = /(?:^|\s|:)(?:strike-(?:display|h1|h2)|text-(?:display|h1|h2))(?=\s|$)/;
const COPY_ATTRS = new Set(['alt', 'title', 'placeholder', 'aria-label', 'content']);

export function parseMarkup(src, { jsx = false } = {}) {
  const elements = [];
  const texts = [];
  const styles = [];
  const scripts = [];
  const stack = [];
  const n = src.length;
  let i = 0;
  let textStart = 0;

  const flushText = (start, end) => {
    if (end <= start) return;
    let raw = src.slice(start, end);
    if (jsx) {
      if (!stack.length) return; // code outside JSX
      raw = raw.replace(/\{[^{}]*\}/g, (m) => blank(m));
      raw = raw.replace(/^[^{]*\}/, (m) => blank(m)).replace(/\{[^}]*$/, (m) => blank(m));
    } else {
      raw = raw.replace(/\{\{[\s\S]*?\}\}/g, (m) => blank(m)); // Vue mustaches
    }
    if (!raw.trim()) return;
    const parent = stack.at(-1) ?? null;
    const heading = stack.findLast((e) => e.isHeading);
    const t = { text: raw, offset: start, parent, heading: heading ?? null, inSvg: !!parent?.inSvg, inLogo: !!parent?.inLogo, inCode: !!parent?.inCode, hidden: !!parent?.hidden };
    texts.push(t);
    for (const e of stack) e.textParts.push(t);
  };

  const close = (tag) => {
    for (let k = stack.length - 1; k >= 0; k--) {
      if (stack[k].tagLower === tag) {
        stack.length = k;
        return;
      }
    }
  };

  while (i < n) {
    if (src[i] !== '<') {
      i++;
      continue;
    }
    if (src.startsWith('<!--', i)) {
      flushText(textStart, i);
      const e = src.indexOf('-->', i + 4);
      i = e < 0 ? n : e + 3;
      textStart = i;
      continue;
    }
    if (src[i + 1] === '!' || src[i + 1] === '?') {
      flushText(textStart, i);
      const e = src.indexOf('>', i);
      i = e < 0 ? n : e + 1;
      textStart = i;
      continue;
    }
    if (src[i + 1] === '/') {
      const m = /^<\/([A-Za-z][\w.:-]*)?\s*>/.exec(src.slice(i, i + 200));
      if (m) {
        flushText(textStart, i);
        close((m[1] ?? '').toLowerCase());
        i += m[0].length;
        textStart = i;
        continue;
      }
      i++;
      continue;
    }
    if (jsx && src[i + 1] === '>') {
      flushText(textStart, i);
      const el = { tag: '', tagLower: '', attrs: {}, offset: i, textParts: [], inSvg: false, inLogo: !!stack.at(-1)?.inLogo, inCode: !!stack.at(-1)?.inCode };
      stack.push(el);
      i += 2;
      textStart = i;
      continue;
    }
    const m = /^<([A-Za-z][\w.:-]*)/.exec(src.slice(i, i + 100));
    if (!m) {
      i++;
      continue;
    }
    if (jsx && !stack.length) {
      // Outside JSX a `<` after an identifier is a generic or a comparison.
      const before = src.slice(Math.max(0, i - 20), i);
      if (/[\w$\])]\s*$/.test(before) && !/\breturn\s*$/.test(before)) {
        i++;
        continue;
      }
    }
    flushText(textStart, i);
    const tag = m[1];
    const tagLower = tag.toLowerCase();
    let j = i + m[0].length;
    const attrs = {};
    let selfClose = false;
    while (j < n) {
      while (j < n && /\s/.test(src[j])) j++;
      if (src[j] === '>') {
        j++;
        break;
      }
      if (src.startsWith('/>', j)) {
        selfClose = true;
        j += 2;
        break;
      }
      if (src[j] === '{') {
        j = skipBraces(src, j);
        continue;
      }
      const am = /^[^\s=>/"'{]+/.exec(src.slice(j, j + 200));
      if (!am) {
        j++;
        continue;
      }
      const name = am[0];
      j += name.length;
      while (j < n && /\s/.test(src[j])) j++;
      let value = '';
      let vOffset = j;
      let raw = null;
      if (src[j] === '=') {
        j++;
        while (j < n && /\s/.test(src[j])) j++;
        if (src[j] === '"' || src[j] === "'") {
          const qc = src[j];
          const e = src.indexOf(qc, j + 1);
          value = src.slice(j + 1, e < 0 ? n : e);
          vOffset = j + 1;
          j = e < 0 ? n : e + 1;
        } else if (src[j] === '{') {
          const e = skipBraces(src, j);
          raw = src.slice(j + 1, e - 1);
          vOffset = j + 1;
          value = stringLiterals(raw).map((s) => s.text).join(' ');
          j = e;
        } else {
          const vm = /^[^\s>]+/.exec(src.slice(j, j + 500));
          value = vm ? vm[0] : '';
          vOffset = j;
          j += value.length;
        }
      }
      attrs[name.toLowerCase()] = { value, offset: vOffset, raw };
    }
    const parent = stack.at(-1) ?? null;
    const cls = (attrs.class?.value ?? '') + ' ' + (attrs.classname?.value ?? '') + ' ' + (attrs[':class']?.value ?? '');
    const ident = [cls, attrs.id?.value, attrs['aria-label']?.value, attrs.role?.value, attrs['data-logo'] ? 'logo' : ''].join(' ');
    const el = {
      tag,
      tagLower,
      attrs,
      cls: cls.trim(),
      offset: i,
      parent,
      textParts: [],
      inSvg: tagLower === 'svg' || !!parent?.inSvg,
      inLogo: LOGO_RE.test(ident) || !!parent?.inLogo,
      inCode: CODE_TAGS.has(tagLower) || !!parent?.inCode,
      hidden: attrs.hidden !== undefined || attrs['aria-hidden']?.value === 'true' || !!parent?.hidden,
      level: /^h[1-6]$/.test(tagLower) ? +tagLower[1] : HEADING_CLASS_RE.test(cls) ? (/(display|h1)/.test(cls.match(HEADING_CLASS_RE)[0]) ? 1 : 2) : 0,
    };
    el.isHeading = el.level > 0;
    elements.push(el);
    if (!jsx && (tagLower === 'script' || tagLower === 'style') && !selfClose) {
      const end = src.toLowerCase().indexOf(`</${tagLower}`, j);
      const stop = end < 0 ? n : end;
      (tagLower === 'style' ? styles : scripts).push({ text: src.slice(j, stop), offset: j, el });
      const ce = src.indexOf('>', stop);
      i = ce < 0 ? n : ce + 1;
      textStart = i;
      continue;
    }
    if (!selfClose && !VOID.has(tagLower)) stack.push(el);
    i = j;
    textStart = i;
  }
  flushText(textStart, n);
  return { elements, texts, styles, scripts };
}

function parseStyleObject(raw, base) {
  // JSX style={{ color: '#fff', borderRadius: 4 }}
  const decls = [];
  const re = /([A-Za-z][\w-]*|"[^"]+"|'[^']+')\s*:\s*("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|-?\d*\.?\d+)/g;
  let m;
  while ((m = re.exec(raw))) {
    const key = m[1].replace(/^["']|["']$/g, '');
    const prop = key.startsWith('--') ? key : key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
    let value = m[2];
    const isNum = /^-?\d*\.?\d+$/.test(value);
    value = isNum ? (/radius/.test(prop) && value !== '0' ? value + 'px' : value) : value.slice(1, -1);
    decls.push({ prop, value, offset: base + m.index, end: base + m.index + m[0].length, valueOffset: base + m.index + m[0].indexOf(m[2]) });
  }
  return decls;
}

// ---------------------------------------------------------------- markdown

function parseMarkdown(src) {
  const segments = [];
  const blocks = [];
  const lines = src.split('\n');
  let offset = 0;
  let fence = null;
  let inComment = false;
  let inFront = lines[0]?.trim() === '---';
  lines.forEach((line, idx) => {
    const lineOffset = offset;
    offset += line.length + 1;
    if (inFront) {
      if (idx > 0 && line.trim() === '---') inFront = false;
      else if (idx > 0) segments.push({ kind: 'text', text: line, offset: lineOffset });
      return;
    }
    const fm = /^\s*(`{3,}|~{3,})\s*([\w+-]*)/.exec(line);
    if (fence) {
      if (fm && fm[1][0] === fence.marker[0] && fm[1].length >= fence.marker.length && !fm[2]) {
        blocks.push(fence);
        fence = null;
      } else {
        fence.text += line + '\n';
      }
      return;
    }
    if (fm) {
      fence = { marker: fm[1], lang: fm[2].toLowerCase(), text: '', offset: offset };
      return;
    }
    let t = line;
    if (inComment) {
      const e = t.indexOf('-->');
      if (e < 0) return;
      t = blank(t.slice(0, e + 3)) + t.slice(e + 3);
      inComment = false;
    }
    t = t.replace(/<!--[\s\S]*?-->/g, (m) => blank(m));
    const open = t.indexOf('<!--');
    if (open >= 0) {
      t = t.slice(0, open) + blank(t.slice(open));
      inComment = true;
    }
    t = t
      .replace(/`[^`]*`/g, (m) => blank(m))
      .replace(/!\[[^\]]*\]\([^)]*\)/g, (m) => blank(m))
      .replace(/(\[[^\]]*\])(\([^)]*\))/g, (_, a, b) => a + blank(b))
      .replace(/<https?:[^>]+>/g, (m) => blank(m))
      .replace(/https?:\/\/\S+/g, (m) => blank(m))
      .replace(/<\/?[A-Za-z][^>]*>/g, (m) => blank(m));
    const hm = /^(\s{0,3})(#{1,6})\s+(.*?)\s*#*\s*$/.exec(t);
    if (hm) {
      const lead = hm[1].length + hm[2].length;
      segments.push({ kind: 'heading', level: hm[2].length, text: t, raw: line, offset: lineOffset, clean: cleanMd(hm[3]), headingStart: lead });
    } else if (t.trim()) {
      segments.push({ kind: 'text', text: t, raw: line, offset: lineOffset });
    }
  });
  if (fence) blocks.push(fence);
  return { segments, blocks };
}

const cleanMd = (s) =>
  s
    .replace(/\[([^\]]*)\]\s*/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

// ---------------------------------------------------------------- copy rules

const NEGATION = /\b(no|not|never|nothing|none|without|avoid|nor|don['’]t|doesn['’]t|isn['’]t|aren['’]t|won['’]t|banned?)\b/i;
const BANNED = [
  { re: /\bguaranteed\b/gi, word: 'guaranteed' },
  { re: /\brisk[\s-]?free\b/gi, word: 'risk-free' },
  { re: /\bsafe\s+returns?\b/gi, word: 'safe returns' },
  { re: /\b(?:can['’]?t|cannot)\s+lose\b/gi, word: "can't lose" },
  { re: /\bto\s+the\s+moon\b/gi, word: 'to the moon' },
];

function quoted(text, idx, len) {
  const before = text.slice(0, idx);
  const after = text.slice(idx + len);
  if ((before.match(/"/g) ?? []).length % 2 === 1 && after.includes('"')) return true;
  const lo = before.lastIndexOf('“');
  if (lo >= 0 && before.lastIndexOf('”') < lo && after.includes('”')) return true;
  const ls = before.lastIndexOf('‘');
  if (ls >= 0 && before.lastIndexOf('’') < ls && /’/.test(after)) return true;
  if (/'\s*$/.test(before) && /^\s*'/.test(after)) return true;
  return false;
}

function copyChecks(seg, add, { name = true, exclaim = true, banned = true, usd = true, markets = true } = {}) {
  const text = seg.text;
  const at = (idx) => seg.offset + idx;
  let m;
  if (banned) {
    for (const b of BANNED) {
      b.re.lastIndex = 0;
      while ((m = b.re.exec(text))) {
        if (quoted(text, m.index, m[0].length)) continue;
        if (NEGATION.test(text.slice(Math.max(0, m.index - 30), m.index))) continue;
        add('error', 'banned-claim', at(m.index), `"${m[0]}" is a banned claim`, 'state facts and risks; never promise returns');
      }
    }
  }
  if (usd) {
    const re = /\bUSD\b/g;
    while ((m = re.exec(text))) {
      const around = text.slice(Math.max(0, m.index - 12), m.index + 16);
      if (/USD\s*(?:or|vs\.?|versus|and|\/)\s*USDC|USDC\s*(?:or|vs\.?|versus|and|\/)\s*USD\b/.test(around)) continue;
      if (quoted(text, m.index, 3)) continue;
      add('warn', 'usd', at(m.index), '"USD"', 'USDC by default; confirm USD vs USDC');
    }
  }
  if (markets) {
    const re = /(?<![\w/.,:+-])\d+(?:[.,]\d+)*\+?\s+(?:[A-Za-z-]+\s+)?(?:markets|underlyings)\b/gi;
    while ((m = re.exec(text))) {
      if (quoted(text, m.index, m[0].length)) continue;
      add('warn', 'market-count', at(m.index), `"${m[0]}" states a market count`, "don't state how many markets Strike lists");
    }
  }
  if (name && !seg.inSvg && !seg.inLogo) {
    const re = /(?<![\w/.-])STRIKE(?![\w/-]|\.\w)/g; // not file names like STRIKE-DESIGN.md
    while ((m = re.exec(text))) {
      if (!/[a-z]/.test(text)) break; // an all-caps label, e.g. an options chain header
      if (quoted(text, m.index, 6)) continue;
      const near = (seg.raw ?? text).slice(Math.max(0, m.index - 60), m.index + 66); // raw: context words may sit in inline code
      if (/wordmark|logo|lock-?up|\bmark\b|capitals|ciburial|baseline|cap height/i.test(near)) continue;
      if (/^['’]?s?\s+prices?\b/i.test(text.slice(m.index + 6))) continue;
      add('warn', 'name', at(m.index), '"STRIKE" in capitals', 'write Strike; capitals are for the logo only');
    }
  }
  if (exclaim && seg.kind !== 'heading') {
    const re = /[A-Za-z0-9)\]'"’”]!+(?=[\s"'”’)\]]|$)/g;
    while ((m = re.exec(text))) {
      add('warn', 'exclamation', at(m.index + 1), '"!" in body copy', 'use a full stop; no exclamation marks in brand copy');
    }
  }
}

function headingChecks(text, offset, level, add) {
  const clean = decode(text).replace(/\s+/g, ' ').trim();
  if (!clean) return;
  if (level <= 2 && clean.length > 60) {
    add('warn', 'heading-length', offset, `title is ${clean.length} characters`, 'title must fit 2 lines: cut it to about 8 words');
  }
  if (/!/.test(clean)) add('warn', 'heading-exclamation', offset, '"!" in a heading', 'remove it; headings never shout');
}

// ---------------------------------------------------------------- the checker

export function checkSource(src, file = 'input.html', opts = {}) {
  const tokens = opts.tokens ?? loadTokens(opts.tokensPath);
  const palette = opts.palette ?? paletteFrom(tokens);
  const ext = extname(file).toLowerCase();
  const issues = [];
  if (/strike-check-ignore-file/.test(src)) return issues;
  const pos = lineIndex(src);
  const seen = new Set();
  const add = (severity, rule, offset, message, fix) => {
    const key = `${rule}:${offset}:${message}`;
    if (seen.has(key)) return;
    seen.add(key);
    const { line, col } = pos(offset);
    const issue = { file, line, col, severity, rule, message, fix };
    issues.push(issue);
    return issue;
  };

  // Logo artwork (one-ink marks use pure black and white on purpose).
  const relPath = relative(process.cwd(), resolve(file)).replace(/\\/g, '/');
  const isLogoFile = ext === '.svg' && /logo|lock-?up|wordmark|(^|[-_/])mark([-_.]|$)/i.test(relPath);
  // Finished poster artwork is reference art: its colours are not checked.
  const isArtwork = ext === '.svg' && /(^|\/)assets\/posters\//.test(resolve(file).replace(/\\/g, '/'));
  const cssRegions = []; // {text, offset, rootSelector}
  const extraDecls = []; // JSX style objects, with context
  const elementStyle = []; // {el, decls}
  const proseRanges = []; // markdown prose (pure white/black allowed as documentation)
  let segments = [];
  let fullPage = false;
  let visibleText = '';
  let codeForStrings = [];

  if (ext === '.css') {
    cssRegions.push({ text: src, offset: 0, rootSelector: '' });
  } else if (['.md', '.mdx', '.mdc'].includes(ext)) {
    const { segments: segs, blocks } = parseMarkdown(src);
    segments = segs.map((s) => ({ ...s, inSvg: false, inLogo: false }));
    for (const s of segs) proseRanges.push([s.offset, s.offset + s.text.length]);
    for (const b of blocks) {
      if (['css', 'scss', 'less'].includes(b.lang)) cssRegions.push({ text: b.text, offset: b.offset, rootSelector: '' });
      else if (['html', 'vue', 'svg', 'xml', 'jsx', 'tsx'].includes(b.lang)) {
        const sub = checkSource(b.text, `block.${b.lang === 'xml' ? 'svg' : b.lang}`, { ...opts, palette, tokens, embedded: true });
        for (const is of sub) {
          if (is.rule === 'risk-line') continue;
          const lineOff = pos(b.offset).line - 1;
          issues.push({ ...is, file, line: is.line + lineOff });
        }
      }
    }
    visibleText = segs.map((s) => s.text).join('\n');
    fullPage = /^\s*(subject|subject line)\s*:/im.test(src);
  } else {
    const jsx = ext === '.jsx' || ext === '.tsx';
    const code = jsx ? blankJsComments(src) : src;
    const doc = parseMarkup(code, { jsx });
    for (const st of doc.styles) cssRegions.push({ text: st.text, offset: st.offset, rootSelector: '' });
    if (jsx) codeForStrings.push({ text: code, offset: 0 });
    for (const sc of doc.scripts) codeForStrings.push({ text: sc.text, offset: sc.offset });
    for (const el of doc.elements) {
      const decls = [];
      const ctx = (el.cls + ' ' + (el.attrs.id?.value ?? '')).trim();
      const st = el.attrs.style;
      if (st) {
        if (st.raw !== null && st.raw !== undefined) decls.push(...parseStyleObject(st.raw, st.offset));
        else decls.push(...parseCss(st.value, st.offset, ctx)[0].decls);
      }
      for (const a of ['fill', 'stroke', 'color', 'bgcolor', 'font-family', 'stop-color']) {
        if (el.attrs[a]) decls.push({ prop: a === 'bgcolor' ? 'background-color' : a, value: el.attrs[a].value, offset: el.attrs[a].offset, end: el.attrs[a].offset + el.attrs[a].value.length, valueOffset: el.attrs[a].offset, attr: true });
      }
      elementStyle.push({ el, decls, ctx });
      for (const [name, a] of Object.entries(el.attrs)) {
        if (COPY_ATTRS.has(name) && a.value && !(name === 'content' && el.tagLower !== 'meta')) {
          segments.push({ kind: 'attr', text: a.value, offset: a.offset, inSvg: el.inSvg, inLogo: el.inLogo });
        }
      }
      if (el.isHeading) {
        const parts = el.textParts.filter((t) => !t.inCode);
        if (parts.length) headingChecks(parts.map((t) => t.text).join(' '), parts[0].offset + (parts[0].text.length - parts[0].text.trimStart().length), el.level, add);
      }
    }
    for (const t of doc.texts) {
      proseRanges.push([t.offset, t.offset + t.text.length]); // visible text: a hex here is documentation
      if (t.inCode) continue;
      segments.push({ kind: t.heading ? 'heading' : 'text', text: t.text, offset: t.offset, inSvg: t.inSvg, inLogo: t.inLogo });
    }
    visibleText = doc.texts.filter((t) => !t.inSvg).map((t) => decode(t.text)).join(' ');
    fullPage = (ext === '.html' || ext === '.htm') && !opts.embedded && /<html[\s>]|<body[\s>]/i.test(src);
  }

  // CSS: fonts, radius, contrast; collect declarations for the colour scan.
  const allDecls = [];
  for (const region of cssRegions) {
    for (const rule of parseCss(region.text, region.offset, region.rootSelector)) {
      for (const d of rule.decls) allDecls.push({ ...d, context: rule.context, atFontFace: /@font-face/i.test(rule.selector) });
      checkRule(rule.decls, rule.context, /@font-face/i.test(rule.selector));
    }
  }
  for (const { el, decls, ctx } of elementStyle) {
    const ancestry = [];
    for (let p = el; p; p = p.parent) ancestry.push(p.cls, p.attrs.id?.value ?? '', p.attrs['aria-label']?.value ?? '');
    const context = ancestry.join(' ') + (el.inLogo || el.inSvg ? ' logo' : '');
    for (const d of decls) allDecls.push({ ...d, context });
    checkRule(decls, context, false, el);
    checkClasses(el);
  }

  function themeOf(context) {
    return /light/i.test(context ?? '') ? 'light' : 'dark';
  }

  function resolveColour(value, theme) {
    if (!value) return null;
    const v = value.trim();
    if (/gradient|url\(/i.test(v)) return null;
    const vm = v.match(/var\(\s*--(?:strike-|color-)?([\w-]+)\s*(?:,\s*([^)]+))?\)/i);
    if (vm) {
      const hex = palette[theme][vm[1]];
      if (hex) return parseColour(hex);
      return vm[2] ? resolveColour(vm[2], theme) : null;
    }
    const cm = v.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)|\b(white|black)\b/i);
    return cm ? parseColour(cm[0]) : null;
  }

  function contrastFor(fg, bg, offset) {
    if (!fg || !bg || bg.a < 1 || fg.a < 1) return;
    const ratio = contrastRatio(fg, bg);
    if (bg.hex === STRIKE_GREEN && luminance(fg) > 0.6) {
      add('error', 'white-on-green', offset, `light text on Strike Green (${ratio.toFixed(1)}:1)`, 'use ground #0C0C0C text on green');
    } else if (ratio < 4.5) {
      add('warn', 'contrast', offset, `contrast ${ratio.toFixed(1)}:1 (${fg.hex} on ${bg.hex})`, 'body text needs 4.5:1, titles 7:1');
    }
  }

  function checkRule(decls, context, fontFace, el) {
    const theme = themeOf(context);
    let fg = null;
    let bg = null;
    for (const d of decls) {
      // Fonts
      if (d.prop === 'font-family' || d.prop === 'font' || (d.prop.startsWith('--') && /font/.test(d.prop) && !/weight|size|feature|variation/.test(d.prop))) {
        for (const fam of fontFamilies(d.prop === 'font' ? 'font' : 'font-family', d.value)) {
          const f = fam.toLowerCase();
          if (ALLOWED_FONTS.has(f) || FONT_KEYWORDS.has(f)) continue;
          if (f === 'ciburial') {
            if (fontFace || LOGO_RE.test(context + ' ' + d.prop) || isLogoFile) continue;
            add('error', 'font', d.offset, 'Ciburial outside the logo', 'Ciburial is only the wordmark: use the logo files, and Geist for text');
            continue;
          }
          add('error', 'font', d.offset, `"${fam}" is not a Strike font`, 'use Geist (Arial as fallback); Geist Mono for code and addresses');
        }
      }
      // Radius
      if (/^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/.test(d.prop)) {
        const bad = radiusProblem(d.value);
        if (bad) add('warn', 'radius', d.offset, `border-radius ${bad} is off the scale`, 'use 6px (small controls), 8px (buttons, inputs), 12px (cards), 9999px or 50%');
      }
      if (d.prop === 'color') fg = { colour: resolveColour(d.value, theme), offset: d.offset };
      if (d.prop === 'background-color' || d.prop === 'background') {
        const c = resolveColour(d.value, theme);
        if (c || d.prop === 'background') bg = { colour: c, offset: d.offset };
      }
    }
    if (fg?.colour && bg?.colour) contrastFor(fg.colour, bg.colour, fg.offset);
    if (el) el._style = { fg: fg?.colour, bg: bg?.colour };
  }

  function twColour(name, theme) {
    if (name === 'white' || name === 'black') return parseColour(name);
    if (TW_SAME_AS_STRIKE[name]) return parseColour(TW_SAME_AS_STRIKE[name]);
    const hex = palette[theme][name];
    return hex ? parseColour(hex) : null;
  }

  function checkClasses(el) {
    const raw = el.attrs.class ?? el.attrs.classname ?? el.attrs[':class'];
    if (!raw || !raw.value) return;
    const theme = themeOf(el.cls);
    let fg = el._style?.fg ?? null;
    let bg = el._style?.bg ?? null;
    let fromClass = false;
    const fontStack = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(raw.value))) {
      const full = m[0];
      const off = raw.offset + m.index;
      const variants = full.match(/^(?:!?(?:\[[^\]]*\]|[\w-]+):)*/)[0];
      const c = full.slice(variants.length).replace(/^!/, '');
      const base = !variants;
      const tw = TW_DEFAULT_RE.exec(c);
      if (tw) {
        const key = `${tw[1]}-${tw[2]}`;
        if (!TW_SAME_AS_STRIKE[key]) {
          add('warn', 'colour', off, `${c} is a Tailwind default colour`, 'use the Strike preset colours (bg-ground, text-ink, text-ink-2, bg-green)');
          continue;
        }
      }
      const bw = /^(bg|text|border|fill|stroke|from|to|via|ring|outline|decoration|divide)-(white|black)(\/\d+)?$/.exec(c);
      if (bw && !el.inLogo) add('warn', 'pure-black-white', off, `${c} is pure ${bw[2]}`, bw[2] === 'white' ? 'use ink #F9F9F9 (text-ink)' : 'use ground #0C0C0C (bg-ground)');
      const fontArb = /^font-\[(.+)\]$/.exec(c);
      if (fontArb) fontStack.push({ v: fontArb[1].replace(/_/g, ' '), off });
      if (c === 'font-serif') add('error', 'font', off, 'font-serif is not a Strike font', 'use font-sans (Geist)');
      const rad = /^rounded(?:-(?:[trbl]|[trbl][lr]|s|e|ss|se|es|ee))?-(2xl|3xl|4xl|\[[^\]]+\])$/.exec(c);
      if (rad) {
        const v = rad[1].startsWith('[') ? rad[1].slice(1, -1) : rad[1];
        if (!/^\[/.test(rad[1]) || radiusProblem(v)) add('warn', 'radius', off, `${c} is off the radius scale`, 'use rounded-sm (6px), rounded-md (8px), rounded-lg (12px) or rounded-full');
      }
      if (!base) continue;
      const tc = /^text-(\[#[0-9a-fA-F]{3,8}\]|[\w-]+?)(?:\/\d+)?$/.exec(c);
      if (tc) {
        const col = tc[1].startsWith('[') ? parseColour(tc[1].slice(1, -1)) : twColour(tc[1], theme);
        if (col) {
          fg = col;
          fromClass = true;
        }
      }
      const bc = /^bg-(\[#[0-9a-fA-F]{3,8}\]|[\w-]+?)(?:\/(\d+))?$/.exec(c);
      if (bc) {
        const col = bc[1].startsWith('[') ? parseColour(bc[1].slice(1, -1)) : twColour(bc[1], theme);
        if (col) {
          bg = bc[2] ? { ...col, a: +bc[2] / 100 } : col;
          fromClass = true;
        }
      }
    }
    for (const f of fontStack) {
      for (const fam of fontFamilies('font-family', f.v)) {
        const fl = fam.toLowerCase();
        if (!ALLOWED_FONTS.has(fl) && !(fl === 'ciburial' && el.inLogo)) add('error', 'font', f.off, `"${fam}" is not a Strike font`, 'use Geist (Arial as fallback)');
      }
    }
    if (fg && bg && fromClass) contrastFor(fg, bg, el.offset);
  }

  // Google Fonts links
  const gf = /fonts\.googleapis\.com\/css2?\?([^"'\s)>]+)/g;
  let g;
  while ((g = gf.exec(src))) {
    for (const fm of g[1].matchAll(/family=([^&:]+)/g)) {
      const fam = decodeURIComponent(fm[1].replace(/\+/g, ' ')).trim();
      if (!ALLOWED_FONTS.has(fam.toLowerCase())) add('error', 'font', g.index, `"${fam}" is not a Strike font`, 'load Geist (assets/fonts/fonts.css) instead');
    }
  }

  // Colours: every hex, rgb() and hsl() in the file.
  const scan = ['.jsx', '.tsx'].includes(ext)
    ? blankJsComments(src)
    : ext === '.css'
      ? blankRegex(src, /\/\*[\s\S]*?\*\//g)
      : blankRegex(blankRegex(src, /<!--[\s\S]*?-->/g), /\/\*[\s\S]*?\*\//g);
  const cssOnly = ext === '.css';
  const colourRe = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])|\b(?:rgba?|hsla?)\([^)]*\)/g;
  const offPalette = new Map(); // one finding per colour per file, with a count
  let c;
  while (!isArtwork && (c = colourRe.exec(scan))) {
    const idx = c.index;
    const tok = c[0];
    const before = scan.slice(Math.max(0, idx - 40), idx);
    if (tok[0] === '#') {
      if (/&$/.test(before)) continue;
      if (/url\(\s*["']?$/.test(before)) continue;
      const am = before.match(/([\w:-]+)\s*=\s*["'{]?\s*$/);
      if (am && /^(href|src|to|id|for|xlink:href|action|name|aria-\w+|data-[\w-]+|key)$/i.test(am[1])) continue;
      if (/[\w#]$/.test(before)) continue;
    }
    const inDecl = allDecls.find((d) => idx >= d.offset && idx < d.end);
    if (cssOnly || cssRegions.some((r) => idx >= r.offset && idx < r.offset + r.text.length)) {
      if (!inDecl) continue; // a selector, e.g. #fade
    }
    const inProse = proseRanges.some(([a, b]) => idx >= a && idx < b);
    if (inProse && tok[0] === '#' && /^#\d{3,4}$/.test(tok)) continue; // "#123" is an issue number
    const col = parseColour(tok);
    if (!col) continue;
    const pure = col.hex === '#FFFFFF' || col.hex === '#000000';
    if (pure) {
      const exempt = isLogoFile || inProse || (inDecl && (inDecl.prop.startsWith('--') || /light|logo|wordmark|lock-?up/i.test(inDecl.context ?? '')));
      if (!exempt && col.a > 0) {
        add('warn', 'pure-black-white', idx, `${tok} is pure ${col.hex === '#FFFFFF' ? 'white' : 'black'}`, col.hex === '#FFFFFF' ? 'use ink #F9F9F9 for text, or the light surface token' : 'use ground #0C0C0C');
      }
      continue;
    }
    if (palette.allowed.has(col.hex)) continue;
    const seen = offPalette.get(col.hex);
    if (seen) {
      seen.count++;
      continue;
    }
    const near = nearestColour(col, palette);
    const issue = add('warn', 'colour', idx, `${tok} is not a Strike colour`, `use a token from tokens.css; the nearest is ${near.name} ${near.hex}`);
    if (issue) offPalette.set(col.hex, { issue, tok, count: 1 });
  }
  for (const { issue, tok, count } of offPalette.values()) if (count > 1) issue.message = `${tok} is not a Strike colour (${count} times)`;

  // Named colours in CSS colour properties.
  for (const d of isArtwork ? [] : allDecls) {
    if (!COLOUR_PROPS.test(d.prop) || d.attr) continue;
    for (const w of d.value.toLowerCase().matchAll(/(?<![\w#-])([a-z]+)(?![\w(-])/g)) {
      const word = w[1];
      const off = d.offset;
      if (word === 'white' || word === 'black') {
        if (d.prop.startsWith('--') || /light|logo/i.test(d.context ?? '')) continue;
        add('warn', 'pure-black-white', off, `${word} is pure ${word}`, word === 'white' ? 'use ink #F9F9F9' : 'use ground #0C0C0C');
      } else if (NAMED_COLOURS.has(word)) {
        add('warn', 'colour', off, `"${word}" is not a Strike colour`, word === 'red' ? 'red is loss #EE5E74, for losses only' : 'use a token from tokens.css');
      }
    }
  }

  // Copy
  for (const seg of segments) {
    copyChecks(seg, add, { exclaim: seg.kind !== 'attr', name: seg.kind !== 'attr' });
    if (seg.kind === 'heading' && seg.level) headingChecks(seg.clean, seg.offset + (seg.headingStart ?? 0), seg.level, add);
  }
  for (const code of codeForStrings) {
    for (const s of stringLiterals(code.text)) {
      if (s.text.length > 400 || /[<>{}]/.test(s.text)) continue;
      copyChecks({ text: s.text, offset: code.offset + s.index, kind: 'attr' }, add, { name: false, exclaim: false });
    }
  }

  // Risk line on full pages and emails.
  if (fullPage && !/options involve risk/i.test(visibleText.replace(/\s+/g, ' '))) {
    add('warn', 'risk-line', 0, 'no risk line', `add "${RISK_LINE}" to the footer, with a link to strikelabs.app/risk`);
  }

  // strike-check-ignore directives
  const ignores = new Map();
  src.split('\n').forEach((line, i) => {
    const m = /strike-check-ignore(?!-file)(?::\s*([\w\s,-]+))?/.exec(line);
    if (!m) return;
    const rules = m[1] ? m[1].split(/[\s,]+/).filter(Boolean) : null;
    ignores.set(i + 1, rules);
    ignores.set(i + 2, rules);
  });
  return issues
    .filter((is) => {
      if (!ignores.has(is.line)) return true;
      const rules = ignores.get(is.line);
      return rules && !rules.includes(is.rule);
    })
    .sort((a, b) => a.line - b.line || a.col - b.col);
}

export function collectFiles(paths) {
  const out = [];
  const walk = (p) => {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const name of readdirSync(p).sort()) {
        if (SKIP_DIRS.has(name)) continue;
        walk(join(p, name));
      }
    } else if (EXTENSIONS.includes(extname(p).toLowerCase())) out.push(p);
  };
  for (const p of paths) walk(p);
  return out;
}

export function checkPaths(paths, opts = {}) {
  const tokens = opts.tokens ?? loadTokens(opts.tokensPath);
  const palette = paletteFrom(tokens);
  const files = collectFiles(paths);
  const issues = [];
  for (const f of files) issues.push(...checkSource(readFileSync(f, 'utf8'), f, { tokens, palette }));
  return { files, issues };
}

export function formatText({ files, issues }) {
  const lines = [];
  for (const is of issues) {
    lines.push(`${is.file}:${is.line}:${is.col}  ${is.severity === 'error' ? 'error' : 'warn '}  ${is.rule.padEnd(19)} ${is.message}. Fix: ${is.fix}.`);
  }
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warns = issues.length - errors;
  const withIssues = new Set(issues.map((i) => i.file)).size;
  lines.push(
    issues.length
      ? `${files.length} file${files.length === 1 ? '' : 's'} checked: ${errors} error${errors === 1 ? '' : 's'}, ${warns} warning${warns === 1 ? '' : 's'} in ${withIssues} file${withIssues === 1 ? '' : 's'}.`
      : `${files.length} file${files.length === 1 ? '' : 's'} checked: no issues.`,
  );
  return lines.join('\n');
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  let tokensPath;
  const paths = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') continue;
    if (args[i] === '--tokens') tokensPath = args[++i];
    else if (args[i] === '-h' || args[i] === '--help') {
      console.log('Usage: node check.mjs <files or dirs> [--json] [--tokens <tokens.json>]\nChecks .html .css .svg .jsx .tsx .vue .md files against the Strike brand rules.');
      return 0;
    } else paths.push(args[i]);
  }
  if (!paths.length) {
    console.error('Usage: node check.mjs <files or dirs> [--json] [--tokens <tokens.json>]');
    return 2;
  }
  for (const p of paths) {
    if (!existsSync(p)) {
      console.error(`Not found: ${p}`);
      return 2;
    }
  }
  const result = checkPaths(paths, { tokensPath });
  const errors = result.issues.filter((i) => i.severity === 'error').length;
  if (json) {
    console.log(JSON.stringify({ files: result.files.length, errors, warnings: result.issues.length - errors, issues: result.issues }, null, 2));
  } else {
    console.log(formatText(result));
  }
  return errors ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv);
}
