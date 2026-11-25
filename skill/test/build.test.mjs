import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, sep } from 'node:path';
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync, statSync, cpSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import zlib from 'node:zlib';
import { checkPaths } from '../scripts/check.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(ROOT, 'scripts', 'build.mjs');
const TARGETS = ['claude', 'chatgpt', 'cursor', 'agents', 'copilot', 'gemini', 'perplexity', 'figma', 'portable'];
const RULES = readdirSync(join(ROOT, 'source', 'rules')).filter((f) => f.endsWith('.md')).map((f) => f.slice(0, -3));
const CORE = readFileSync(join(ROOT, 'source', 'core.md'), 'utf8').trim();

let tmp;
let out;
let run;

const read = (rel) => readFileSync(join(out, rel), 'utf8');
const files = (dir) => {
  const list = [];
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) walk(p);
      else list.push(relative(dir, p).split(sep).join('/'));
    }
  };
  walk(dir);
  return list.sort();
};

// A small zip reader: returns { name: Buffer } and checks every CRC.
function unzip(buf) {
  const end = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(end >= 0, 'zip end record');
  const count = buf.readUInt16LE(end + 10);
  let p = buf.readUInt32LE(end + 16);
  const entries = {};
  for (let i = 0; i < count; i++) {
    assert.equal(buf.readUInt32LE(p), 0x02014b50, 'central header');
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const elen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const body = buf.subarray(start, start + csize);
    const data = method === 8 ? zlib.inflateRawSync(body) : Buffer.from(body);
    assert.equal(zlib.crc32(data) >>> 0, crc, `crc of ${name}`);
    if (!name.endsWith('/')) entries[name] = data;
    p += 46 + nlen + elen + clen;
  }
  return entries;
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n/);
  assert.ok(m, 'frontmatter');
  const o = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    const v = line.slice(i + 1).trim();
    o[line.slice(0, i)] = v.startsWith('"') ? JSON.parse(v) : v;
  }
  return o;
}

before(() => {
  tmp = mkdtempSync(join(tmpdir(), 'strike-build-test-'));
  out = join(tmp, 'out');
  // Run from another folder: paths must come from the script, not the cwd.
  run = spawnSync(process.execPath, [BUILD, '--out', out], { encoding: 'utf8', cwd: tmp, env: { ...process.env, STRIKE_UPDATED: '2026-11-20' } });
});

after(() => rmSync(tmp, { recursive: true, force: true }));

test('the build succeeds and prints a table of targets with sizes', () => {
  assert.equal(run.status, 0, run.stderr + run.stdout);
  for (const t of [...TARGETS, 'tokens']) assert.match(run.stdout, new RegExp(`^${t}\\s+\\d+\\s+[\\d.]+ (B|KB|MB)`, 'm'));
  assert.match(run.stdout, /^Total\s+[\d.]+ MB/m);
  assert.doesNotMatch(run.stdout + run.stderr, /don't resolve/);
});

test('character limits hold', () => {
  assert.ok(read('chatgpt/instructions.md').length <= 8000);
  assert.ok(read('perplexity/space-instructions.md').length <= 1500);
  const fm = frontmatter(read('claude/strike-design/SKILL.md'));
  assert.equal(fm.name, 'strike-design');
  assert.ok(fm.description.length <= 1024 && fm.description.length > 100);
  assert.match(fm.description, /Strike/);
  for (const w of ['UI', 'posters', 'slides', 'emails', 'logo']) assert.match(fm.description, new RegExp(w));
});

test('the build fails when a limit is broken', () => {
  const src = join(tmp, 'source-long');
  cpSync(join(ROOT, 'source'), src, { recursive: true });
  writeFileSync(join(src, 'core.md'), CORE + '\n\n' + 'Keep it calm. '.repeat(250));
  writeFileSync(join(src, 'mini.md'), 'Short rules. '.repeat(130));
  const r = spawnSync(process.execPath, [BUILD, '--out', join(tmp, 'out-long'), '--source', src, '--no-png'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /chatgpt\/instructions\.md is [\d,]+ characters; the limit is 8,000/);
  assert.match(r.stderr, /perplexity\/space-instructions\.md is [\d,]+ characters; the limit is 1,500/);
});

test('every target has its files and a 5-line README', () => {
  const expected = [
    'STRIKE-DESIGN.md', 'core.md', 'llms.txt', 'manifest.json',
    'tokens/tokens.css', 'tokens/tailwind.preset.cjs', 'tokens/theme.css', 'tokens/tokens.json',
    'claude/strike-design/SKILL.md', 'claude/strike-design.zip', 'claude/strike-design/references/tokens.css', 'claude/strike-design/scripts/check.mjs',
    'chatgpt/instructions.md', 'chatgpt/SETUP.md', 'chatgpt/knowledge/STRIKE-DESIGN.md', 'chatgpt/knowledge/tokens.css', 'chatgpt/knowledge/tokens.json', 'chatgpt/knowledge/strike-logos.zip', 'chatgpt/strike-design-chatgpt.zip',
    'cursor/rules/strike-design.mdc', 'cursor/strike-design-cursor.zip',
    'agents/AGENTS.md', 'agents/strike-design/tokens/tokens.css', 'agents/strike-design/scripts/check.mjs', 'agents/strike-design-agents.zip',
    'copilot/copilot-instructions.md', 'copilot/strike-design-copilot.zip',
    'gemini/gem-instructions.md', 'gemini/knowledge/STRIKE-DESIGN.md', 'gemini/strike-design-gemini.zip',
    'perplexity/space-instructions.md', 'perplexity/knowledge/STRIKE-DESIGN.md', 'perplexity/strike-design-perplexity.zip',
    'figma/tokens.json', 'figma/guidelines.md', 'figma/SETUP.md', 'figma/strike-design-figma.zip',
    'portable/STRIKE-DESIGN.md', 'portable/strike-design-kit.zip', 'portable/tokens/tokens.css',
  ];
  for (const f of expected) assert.ok(existsSync(join(out, f)), f);
  for (const r of RULES) {
    assert.ok(existsSync(join(out, 'claude/strike-design/references', `${r}.md`)), `skill reference ${r}`);
    assert.ok(existsSync(join(out, 'agents/strike-design/rules', `${r}.md`)), `agents rule ${r}`);
    assert.ok(existsSync(join(out, 'cursor/rules', `strike-${r}.mdc`)), `cursor rule ${r}`);
  }
  for (const t of [...TARGETS, 'tokens']) {
    const lines = read(`${t}/README.md`).trimEnd().split('\n');
    assert.equal(lines.length, 5, `${t}/README.md`);
    assert.match(lines[0], /^# /);
  }
});

test('core rules appear in every instruction file', () => {
  for (const f of ['claude/strike-design/SKILL.md', 'chatgpt/instructions.md', 'cursor/rules/strike-design.mdc', 'agents/AGENTS.md', 'copilot/copilot-instructions.md', 'gemini/gem-instructions.md', 'figma/guidelines.md', 'STRIKE-DESIGN.md', 'core.md']) {
    assert.ok(read(f).includes(CORE.split('\n').slice(2, 4).join('\n')), f);
  }
  assert.equal(read('perplexity/space-instructions.md').trim(), readFileSync(join(ROOT, 'source', 'mini.md'), 'utf8').trim());
});

test('SKILL.md: core, then a Files section whose paths exist in the skill', () => {
  const skill = read('claude/strike-design/SKILL.md');
  assert.ok(skill.indexOf('## Files') > skill.indexOf('## Before you hand it over'));
  const zipped = Object.keys(unzip(readFileSync(join(out, 'claude/strike-design.zip'))));
  const paths = [...skill.slice(skill.indexOf('## Files')).matchAll(/`((?:references|assets|scripts)\/[^`\s]*)`/g)].map((m) => m[1]);
  assert.ok(paths.length >= RULES.length + 3);
  for (const p of paths) assert.ok(zipped.some((n) => n === `strike-design/${p}` || n.startsWith(`strike-design/${p}`)), p);
});

test('STRIKE-DESIGN.md: core, every rule, then tokens; links resolve from where it is served', () => {
  for (const f of ['STRIKE-DESIGN.md', 'portable/STRIKE-DESIGN.md', 'chatgpt/knowledge/STRIKE-DESIGN.md']) {
    const doc = read(f);
    const core = doc.indexOf('## Before you hand it over');
    const detail = doc.indexOf('# Detailed rules');
    const tokens = doc.indexOf('# Token values');
    assert.ok(core > 0 && detail > core && tokens > detail, f);
    for (const r of RULES) {
      const title = readFileSync(join(ROOT, 'source', 'rules', `${r}.md`), 'utf8').match(/^# (.+)$/m)[1];
      assert.ok(doc.includes(`\n## ${title}\n`), `${f}: ${title}`);
    }
    assert.match(doc, /\| ground \| `--strike-ground` \| #0C0C0C \| #F9F9F9 \|/);
    assert.doesNotMatch(doc, /source\/tokens\.json|\(see assets\//, f);
  }
  const root = read('STRIKE-DESIGN.md');
  for (const m of root.matchAll(/\bportable\/[\w./-]+/g)) assert.ok(existsSync(join(out, m[0].replace(/\.$/, ''))), m[0]);
});

test('Cursor rules: frontmatter, one per rule file, core always applies', () => {
  const core = frontmatter(read('cursor/rules/strike-design.mdc'));
  assert.equal(core.alwaysApply, 'true');
  assert.ok('globs' in core && core.description.length > 20);
  for (const r of RULES) {
    const fm = frontmatter(read(`cursor/rules/strike-${r}.mdc`));
    assert.equal(fm.alwaysApply, 'false');
    assert.ok('globs' in fm);
    assert.ok(fm.description.length > 40, `${r} description`);
  }
});

test('zips are valid and match the loose files', () => {
  const skill = unzip(readFileSync(join(out, 'claude/strike-design.zip')));
  assert.ok(skill['strike-design/SKILL.md']);
  // The loose folder is the skill's text files; the zip is the whole skill.
  for (const f of files(join(out, 'claude/strike-design'))) assert.deepEqual(skill[`strike-design/${f}`], readFileSync(join(out, 'claude/strike-design', f)), f);
  if (existsSync(join(ROOT, 'assets/fonts'))) assert.ok(Object.keys(skill).some((n) => /\.woff2$/.test(n)) && Object.keys(skill).some((n) => /\.ttf$/.test(n)), 'skill fonts');
  if (existsSync(join(ROOT, 'scripts/lockup.mjs'))) {
    assert.ok(skill['strike-design/scripts/lockup.mjs']);
    for (const n of readFileSync(join(ROOT, 'scripts/lockup.mjs'), 'utf8').match(/[\w-]+\.ttf/g) ?? []) {
      assert.ok(Object.keys(unzip(readFileSync(join(out, 'agents/strike-design-agents.zip')))).some((k) => k.endsWith(`/${n}`)), `kit keeps ${n} for the lockup script`);
    }
  }

  const cursor = unzip(readFileSync(join(out, 'cursor/strike-design-cursor.zip')));
  assert.ok(cursor['.cursor/rules/strike-design.mdc'] && cursor['strike-design/tokens/tokens.css'] && cursor['strike-design/scripts/check.mjs']);
  const copilot = unzip(readFileSync(join(out, 'copilot/strike-design-copilot.zip')));
  assert.ok(copilot['.github/copilot-instructions.md'] && copilot['strike-design/rules/color.md']);
  const agents = unzip(readFileSync(join(out, 'agents/strike-design-agents.zip')));
  assert.ok(agents['AGENTS.md'] && agents['strike-design/assets/logo/strike-mark-tile.svg']);
  const gpt = unzip(readFileSync(join(out, 'chatgpt/strike-design-chatgpt.zip')));
  assert.deepEqual(Object.keys(gpt).sort(), ['SETUP.md', 'instructions.md', 'knowledge/STRIKE-DESIGN.md', 'knowledge/strike-logos.zip', 'knowledge/tokens.css', 'knowledge/tokens.json']);
  const logos = unzip(gpt['knowledge/strike-logos.zip']);
  assert.ok(Object.keys(logos).some((n) => n.endsWith('.svg')));
  const kit = unzip(readFileSync(join(out, 'portable/strike-design-kit.zip')));
  assert.ok(kit['STRIKE-DESIGN.md'] && kit['tokens/tokens.css'] && kit['logo/strike-mark-tile.svg']);
  if (existsSync(join(ROOT, 'assets/fonts/fonts.css'))) assert.ok(kit['fonts/fonts.css']);
});

test('the copied checker works inside the skill and the project kit', () => {
  for (const dir of ['claude/strike-design', 'agents/strike-design']) {
    const r = spawnSync(process.execPath, [join(out, dir, 'scripts/check.mjs'), join(ROOT, 'test/fixtures/off-brand.html')], { encoding: 'utf8', cwd: tmp });
    assert.equal(r.status, 1, dir);
    assert.match(r.stdout, /white-on-green/);
  }
});

test('font and image files are loose only in portable/', () => {
  const binaries = files(out).filter((f) => /\.(woff2?|ttf|otf|png)$/.test(f));
  assert.ok(binaries.every((f) => f.startsWith('portable/')), binaries.filter((f) => !f.startsWith('portable/')).join(', '));
});

test('the output stays under the size budget', () => {
  const total = files(out).reduce((n, f) => n + statSync(join(out, f)).size, 0);
  assert.ok(total <= 15 * 1024 * 1024, `${(total / 1048576).toFixed(2)} MB`);
});

test('output is plain static files: no dot names, relative links only', () => {
  const all = files(out);
  assert.ok(all.every((f) => !f.split('/').some((p) => p.startsWith('.'))), 'no dotfiles');
  for (const f of all.filter((f) => /\.(md|mdc|txt|json|css)$/.test(f))) {
    const text = read(f);
    assert.doesNotMatch(text, /\]\(\/|href="\/|src="\/|"path": "\//, `${f} has a root-relative link`);
  }
});

test('manifest.json describes the targets, downloads, logos, colours and fonts', () => {
  const m = JSON.parse(read('manifest.json'));
  assert.equal(m.universal, 'STRIKE-DESIGN.md');
  assert.match(m.updated, /^\d{4}-\d{2}-\d{2}/);
  assert.match(m.version, /^\d+\.\d+\.\d+$/);
  assert.deepEqual(m.targets.map((t) => t.id), TARGETS);
  for (const t of m.targets) {
    assert.ok(t.name && t.summary, t.id);
    assert.ok(t.steps.length >= 2 && t.steps.length <= 4, `${t.id} steps`);
    assert.ok(t.files.length >= 1);
    for (const f of t.files) assert.equal(statSync(join(out, f.path)).size, f.bytes, f.path);
  }
  for (const d of m.downloads) {
    assert.equal(statSync(join(out, d.path)).size, d.bytes, d.path);
    assert.ok(['zip', 'markdown', 'css', 'js', 'json'].includes(d.kind));
  }
  assert.ok(m.downloads.some((d) => d.path === 'STRIKE-DESIGN.md'));
  assert.ok(m.logos.length >= 5);
  for (const l of m.logos) {
    assert.ok(existsSync(join(out, l.path)), l.path);
    assert.ok(['dark', 'light', 'mint', 'photo'].includes(l.ground), `${l.path} ground`);
    assert.ok(l.label && l.use);
  }
  const readme = join(ROOT, 'assets/README.md');
  if (existsSync(readme)) {
    const listed = [...readFileSync(readme, 'utf8').matchAll(/^\|\s*`(strike-[\w-]+\.(?:svg|png))`/gm)].map((x) => x[1]);
    assert.deepEqual(m.logos.map((l) => l.path.split('/').pop()), listed.filter((n) => existsSync(join(ROOT, 'assets/logo', n))));
    const by = Object.fromEntries(m.logos.map((l) => [l.path.split('/').pop(), l.ground]));
    if (by['strike-lockup-3d-green.svg']) assert.equal(by['strike-lockup-3d-green.svg'], 'dark');
    if (by['strike-lockup-3d-black.svg']) assert.equal(by['strike-lockup-3d-black.svg'], 'light');
    if (by['strike-lockup-flat-black.svg']) assert.equal(by['strike-lockup-flat-black.svg'], 'mint');
    if (by['strike-lockup-3d-white.svg']) assert.equal(by['strike-lockup-3d-white.svg'], 'photo');
  }
  assert.ok(m.colours.some((c) => c.token === 'green' && c.hex === '#10B981'));
  assert.ok(m.fonts.some((f) => f.family === 'Geist'));
  for (const f of m.fonts) for (const p of f.files) assert.ok(existsSync(join(out, p)), p);
});

test('llms.txt indexes every file with a description', () => {
  const txt = read('llms.txt');
  assert.match(txt, /^# Strike design\n\n> /);
  const linked = new Set([...txt.matchAll(/^- \[([^\]]+)\]\(([^)]+)\): \S/gm)].map((m) => m[2]));
  for (const f of files(out).filter((f) => f !== 'llms.txt')) assert.ok(linked.has(f), `llms.txt misses ${f}`);
});

test('tokens: CSS, Tailwind v3 and v4 carry the same values', () => {
  const cssText = read('tokens/tokens.css');
  assert.match(cssText, /:root \{[\s\S]*--strike-ground: #0C0C0C;/);
  assert.match(cssText, /\[data-theme="light"\] \{[\s\S]*--strike-ground: #F9F9F9;/);
  assert.match(cssText, /\.strike-h1 \{[\s\S]*font-size: var\(--strike-text-h1-size\);/);
  assert.match(cssText, /--strike-text-h1-size: 48px;/);
  const req = (p) => {
    const mod = { exports: {} };
    new Function('module', 'exports', readFileSync(p, 'utf8'))(mod, mod.exports);
    return mod.exports;
  };
  const preset = req(join(out, 'tokens/tailwind.preset.cjs'));
  assert.equal(preset.theme.colors.green, '#10B981');
  assert.match(preset.theme.colors.ground, /^rgb\(var\(--strike-ground-rgb, 12 12 12\) \/ <alpha-value>\)$/);
  assert.deepEqual(preset.theme.fontFamily.sans, ['Geist', 'Arial', 'sans-serif']);
  assert.deepEqual(preset.theme.fontSize.h1, ['48px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '500' }]);
  assert.equal(preset.theme.borderRadius.md, '8px');
  assert.equal(preset.theme.spacing[4], '16px');
  assert.equal(preset.theme.spacing[6], '24px');
  assert.equal(preset.theme.spacing[5], undefined, '20px is off the scale');
  const v4 = read('tokens/theme.css');
  assert.match(v4, /@theme \{[\s\S]*--color-green: #10B981;[\s\S]*--text-h1: 48px;[\s\S]*--radius-lg: 12px;/);
  assert.deepEqual(JSON.parse(read('tokens/tokens.json')), JSON.parse(readFileSync(join(ROOT, 'source/tokens.json'), 'utf8')));
});

test('the brand checker passes the whole output clean', () => {
  const { files: checked, issues } = checkPaths([out]);
  assert.ok(checked.length > 50);
  assert.deepEqual(issues.map((i) => `${relative(out, i.file)}:${i.line} ${i.rule} ${i.message}`), []);
});

test('the build refuses to empty a folder it did not make', () => {
  const foreign = join(tmp, 'foreign');
  mkdirSync(foreign);
  writeFileSync(join(foreign, 'keep.txt'), 'mine');
  const r = spawnSync(process.execPath, [BUILD, '--out', foreign, '--no-png'], { encoding: 'utf8' });
  assert.equal(r.status, 1);
  assert.ok(existsSync(join(foreign, 'keep.txt')));
});
