import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkPaths, checkSource, contrastRatio, loadTokens, paletteFrom } from '../scripts/check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIX = join(ROOT, 'test', 'fixtures');
const CHECK = join(ROOT, 'scripts', 'check.mjs');

const issues = (name) => checkPaths([join(FIX, name)]).issues;
const ids = (list) => list.map((i) => `${i.severity}:${i.rule}`);
const count = (list, id) => ids(list).filter((x) => x === id).length;
const css = (src, file = 'x.css') => checkSource(src, file);

function expectClean(name) {
  const list = issues(name);
  assert.deepEqual(list.map((i) => `${i.line}:${i.rule} ${i.message}`), [], `${name} should pass`);
}

test('tokens load and give the palette and theme variables', () => {
  const p = paletteFrom(loadTokens());
  assert.ok(p.allowed.has('#10B981'));
  assert.ok(p.allowed.has('#D0D6E0'), 'illustration greys');
  assert.ok(p.allowed.has('#34D399'), 'logo gradient stops');
  assert.equal(p.dark.ink, '#F9F9F9');
  assert.equal(p.light.ink, '#0C0C0C');
  assert.equal(p.light.green, '#10B981', 'light inherits untouched colours');
});

test('contrast maths matches the rules (2.4, 7.7, 18.6)', () => {
  const c = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });
  assert.equal(contrastRatio(c('#F9F9F9'), c('#10B981')).toFixed(1), '2.4');
  assert.equal(contrastRatio(c('#0C0C0C'), c('#10B981')).toFixed(1), '7.7');
  assert.equal(contrastRatio(c('#F9F9F9'), c('#0C0C0C')).toFixed(1), '18.6');
});

test('colours: off-palette hex, rgb(), hsl() and named colours warn; pure black and white warn', () => {
  const list = issues('colour-bad.css');
  assert.equal(count(list, 'warn:colour'), 4);
  assert.equal(count(list, 'warn:pure-black-white'), 3);
  assert.ok(list.every((i) => i.severity === 'warn'));
  assert.match(list.find((i) => i.rule === 'pure-black-white').fix, /ground|ink/);
});

test('colours: palette, alpha variants, greys, logo stops, selectors, tokens and light themes pass', () => {
  expectClean('colour-good.css');
});

test('colours: one finding per colour per file, with a count and the nearest token', () => {
  const list = css('.a { color: #017857; } .b { color: #017857; } .c { color: #017857; }');
  assert.equal(list.length, 1);
  assert.match(list[0].message, /\(3 times\)/);
  assert.match(list[0].fix, /nearest is deep #047857/);
});

test('colours: the finished poster artwork in assets/posters/ is exempt', () => {
  const svg = '<svg><rect fill="#017857"/><rect fill="#231F20"/></svg>';
  assert.deepEqual(checkSource(svg, join(ROOT, 'assets/posters/poster-x.svg')), []);
  assert.equal(checkSource(svg, join(ROOT, 'out/posters/poster-x.svg')).length, 2, 'other posters are checked');
});

test('colours: Tailwind default palette classes warn, brand-equal shades pass', () => {
  const list = checkSource('<div class="bg-red-500 text-emerald-500 hover:bg-zinc-900 border-slate-200"></div>', 'x.html');
  assert.deepEqual(ids(list), ['warn:colour', 'warn:colour']);
});

test('colours: ids, entities and issue numbers are not colours', () => {
  assert.deepEqual(checkSource('<a href="#fade">Fees</a> <p>&#8212; see #123</p>', 'x.html'), []);
});

test('fonts: other families are errors, Ciburial only for the wordmark', () => {
  const list = issues('fonts-bad.css');
  assert.equal(count(list, 'error:font'), 5);
  assert.ok(list.some((i) => /Ciburial/.test(i.message)));
  expectClean('fonts-good.css');
});

test('fonts: Google Fonts links and Tailwind arbitrary fonts are checked', () => {
  const gf = checkSource('<link href="https://fonts.googleapis.com/css2?family=Roboto&family=Geist:wght@400">', 'x.html');
  assert.deepEqual(ids(gf), ['error:font']);
  assert.deepEqual(ids(checkSource('<p class="font-[Inter]">x</p>', 'x.html')), ['error:font']);
});

test('contrast: white or ink on green is an error; low contrast warns', () => {
  const list = issues('contrast-bad.css');
  assert.equal(count(list, 'error:white-on-green'), 2);
  assert.equal(count(list, 'warn:contrast'), 1);
  expectClean('contrast-good.css');
});

test('contrast: light theme resolves --strike-ink to ground, so it is fine on green', () => {
  assert.deepEqual(css('[data-theme="light"] .b { background: var(--strike-green); color: var(--strike-ink); }'), []);
  assert.deepEqual(ids(css('.b { background: var(--strike-green); color: var(--strike-ink); }')), ['error:white-on-green']);
});

test('contrast: inline styles, bgcolor and Tailwind classes on one element', () => {
  assert.deepEqual(ids(checkSource('<td bgcolor="#10B981" style="color:#F9F9F9">Go</td>', 'mail.html')), ['error:white-on-green']);
  assert.deepEqual(ids(checkSource('<button class="bg-green text-ink">Go</button>', 'x.html')), ['error:white-on-green']);
  assert.deepEqual(checkSource('<button class="bg-green text-ground">Go</button>', 'x.html'), []);
});

test('headings: titles over 60 characters and "!" in headings warn', () => {
  const list = issues('headings-bad.html');
  assert.equal(count(list, 'warn:heading-length'), 2);
  assert.equal(count(list, 'warn:heading-exclamation'), 2);
  expectClean('headings-good.html');
});

test('headings: Markdown titles are checked, code is not', () => {
  const md = checkSource('# A title that goes on and on and on well past the sixty character limit\n\n```bash\n# Not a heading!\n```\n', 'x.md');
  assert.deepEqual(ids(md), ['warn:heading-length']);
});

test('name: STRIKE in capitals warns, except in the logo, SVG, alt text, labels and file names', () => {
  assert.equal(count(issues('name-bad.html'), 'warn:name'), 2);
  expectClean('name-good.html');
});

test('copy: USD, market counts, banned claims and exclamation marks', () => {
  const list = issues('copy-bad.md');
  assert.equal(count(list, 'warn:usd'), 1);
  assert.equal(count(list, 'warn:market-count'), 2);
  assert.equal(count(list, 'error:banned-claim'), 5);
  assert.equal(count(list, 'warn:exclamation'), 1);
  expectClean('copy-good.md');
});

test('risk line: full pages and emails without it warn', () => {
  assert.deepEqual(ids(issues('page-no-risk.html')), ['warn:risk-line']);
  assert.deepEqual(ids(issues('email-bad.md')), ['warn:risk-line']);
  expectClean('email-good.md');
  assert.deepEqual(checkSource('<section><h2>Fees</h2></section>', 'fragment.html'), [], 'fragments need no risk line');
});

test('radius: only 0, 6, 8, 12, 9999px and 50%', () => {
  assert.equal(count(issues('radius-bad.css'), 'warn:radius'), 4);
  expectClean('radius-good.css');
  assert.deepEqual(ids(checkSource('<div class="rounded-3xl rounded-[12px]"></div>', 'x.html')), ['warn:radius']);
});

test('JSX and TSX: classes, style objects, text and string literals', () => {
  const list = issues('component-bad.tsx');
  for (const id of ['error:banned-claim', 'warn:usd', 'warn:colour', 'warn:radius', 'warn:heading-length', 'error:white-on-green', 'error:font', 'warn:exclamation', 'warn:name']) {
    assert.ok(ids(list).includes(id), `component-bad.tsx: ${id}`);
  }
  expectClean('component-good.tsx');
});

test('Vue: template text and scoped styles', () => {
  const list = issues('component-bad.vue');
  assert.deepEqual(ids(list).sort(), ['error:font', 'warn:colour', 'warn:heading-exclamation', 'warn:radius', 'warn:usd']);
  expectClean('component-good.vue');
});

test('SVG: colours, fonts and copy in posters', () => {
  assert.deepEqual(ids(issues('poster-bad.svg')).sort(), ['error:banned-claim', 'error:font', 'warn:colour', 'warn:exclamation']);
  expectClean('poster-good.svg');
});

test('Markdown code fences are checked as CSS and HTML', () => {
  assert.deepEqual(ids(issues('fence.md')).sort(), ['error:font', 'error:white-on-green', 'warn:pure-black-white', 'warn:radius']);
});

test('ignore comments silence a line or a file', () => {
  assert.deepEqual(css('.a { color: #FF0000; } /* strike-check-ignore: colour */'), []);
  assert.equal(css('.a { color: #FF0000; } /* strike-check-ignore: radius */').length, 1);
  assert.deepEqual(css('/* strike-check-ignore-file */ .a { color: #FF0000; font-family: Inter; }'), []);
});

test('the on-brand sample passes and the off-brand sample is caught', () => {
  expectClean('on-brand.html');
  const list = issues('off-brand.html');
  const rules = new Set(list.map((i) => i.rule));
  for (const r of ['colour', 'pure-black-white', 'font', 'white-on-green', 'contrast', 'heading-length', 'heading-exclamation', 'name', 'usd', 'market-count', 'banned-claim', 'exclamation', 'risk-line', 'radius']) {
    assert.ok(rules.has(r), `off-brand.html: ${r}`);
  }
});

test('the brand files themselves pass: source/, assets/', () => {
  const { files, issues: list } = checkPaths([join(ROOT, 'source'), join(ROOT, 'assets')]);
  assert.ok(files.length > 5);
  assert.deepEqual(list.map((i) => `${i.file}:${i.line} ${i.rule} ${i.message}`), []);
});

test('CLI: exit codes, file:line output and --json', () => {
  const good = spawnSync(process.execPath, [CHECK, join(FIX, 'on-brand.html')], { encoding: 'utf8' });
  assert.equal(good.status, 0);
  assert.match(good.stdout, /no issues/);

  const bad = spawnSync(process.execPath, [CHECK, join(FIX, 'off-brand.html')], { encoding: 'utf8' });
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /off-brand\.html:\d+:\d+\s+error\s+font\s+.*Fix: /);

  const warnOnly = spawnSync(process.execPath, [CHECK, join(FIX, 'radius-bad.css')], { encoding: 'utf8' });
  assert.equal(warnOnly.status, 0, 'warnings alone do not fail');

  const json = spawnSync(process.execPath, [CHECK, FIX, '--json'], { encoding: 'utf8' });
  const out = JSON.parse(json.stdout);
  assert.ok(out.files > 10);
  assert.ok(out.errors > 0 && out.warnings > 0);
  assert.deepEqual(Object.keys(out.issues[0]).sort(), ['col', 'file', 'fix', 'line', 'message', 'rule', 'severity']);

  assert.equal(spawnSync(process.execPath, [CHECK], { encoding: 'utf8' }).status, 2);
  assert.equal(spawnSync(process.execPath, [CHECK, join(FIX, 'nope.html')], { encoding: 'utf8' }).status, 2);
});

test('CLI works from any working directory', () => {
  const r = spawnSync(process.execPath, [CHECK, join(FIX, 'on-brand.html')], { encoding: 'utf8', cwd: '/' });
  assert.equal(r.status, 0, r.stderr);
});
