// node --test test/lockup.test.mjs
// Checks the lock-up construction by measuring the SVG the generator writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildLockup, readFont, layoutText, PROPORTIONS, VERSIONS } from '../scripts/lockup.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCRIPT = path.join(ROOT, 'scripts', 'lockup.mjs');
const LOGO = path.join(ROOT, 'assets', 'logo');
const M = 126.18;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b} (tol ${tol})`);

// --- tiny SVG path reader: subpaths with exact bounds (M L H V Q Z, absolute and relative)
function subpaths(d) {
  const t = d.match(/[MmLlHhVvQqZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g);
  const out = []; let x = 0, y = 0, sx = 0, sy = 0, cmd = '', cur = null;
  const add = (px, py) => { cur.xMin = Math.min(cur.xMin, px); cur.xMax = Math.max(cur.xMax, px); cur.yMin = Math.min(cur.yMin, py); cur.yMax = Math.max(cur.yMax, py); };
  for (let i = 0; i < t.length;) {
    if (/[A-Za-z]/.test(t[i])) cmd = t[i++];
    if (cmd === 'Z' || cmd === 'z') { x = sx; y = sy; continue; }
    const n = () => +t[i++];
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case 'M': x = (rel ? x : 0) + n(); y = (rel ? y : 0) + n(); sx = x; sy = y;
        cur = { xMin: x, xMax: x, yMin: y, yMax: y }; out.push(cur); cmd = rel ? 'l' : 'L'; break;
      case 'L': x = (rel ? x : 0) + n(); y = (rel ? y : 0) + n(); add(x, y); break;
      case 'H': x = (rel ? x : 0) + n(); add(x, y); break;
      case 'V': y = (rel ? y : 0) + n(); add(x, y); break;
      case 'Q': {
        const x1 = (rel ? x : 0) + n(), y1 = (rel ? y : 0) + n(), x2 = (rel ? x : 0) + n(), y2 = (rel ? y : 0) + n();
        for (const [p0, p1, p2, k] of [[x, x1, x2, 0], [y, y1, y2, 1]]) {
          const den = p0 - 2 * p1 + p2;
          if (den) { const s = (p0 - p1) / den; if (s > 0 && s < 1) { const v = (1 - s) ** 2 * p0 + 2 * (1 - s) * s * p1 + s * s * p2; k ? add(x, v) : add(v, y); } }
        }
        x = x2; y = y2; add(x, y); break;
      }
      default: throw new Error('unexpected command ' + cmd);
    }
  }
  return out;
}
const union = (bs) => bs.reduce((a, b) => ({ xMin: Math.min(a.xMin, b.xMin), xMax: Math.max(a.xMax, b.xMax), yMin: Math.min(a.yMin, b.yMin), yMax: Math.max(a.yMax, b.yMax) }));
const viewBoxOf = (svg) => /viewBox="([^"]+)"/.exec(svg)[1].split(/[\s,]+/).map(Number);

// wordmark cap metrics from the official file: the E is its last subpath
function wordmarkCaps(file) {
  const src = fs.readFileSync(path.join(LOGO, file), 'utf8');
  const E = subpaths(/\sd="([^"]+)"/.exec(src)[1]).at(-1);
  return { capTop: E.yMin, baseline: E.yMax, right: E.xMax, vb: viewBoxOf(src) };
}

// Measure a generated lock-up from its markup.
function measure(svg, version) {
  const V = VERSIONS[version];
  const groups = [...svg.matchAll(/<g transform="matrix\(([^)]+)\)">/g)].map((m) => m[1].split(' ').map(Number));
  assert.equal(groups.length, 2, 'one group for the mark, one for the wordmark');
  const [ms, , , , mx, my] = groups[0];
  const [ws, , , , wx, wy] = groups[1];
  const markVb = viewBoxOf(fs.readFileSync(path.join(LOGO, V.mark), 'utf8'));
  const wc = wordmarkCaps(V.wordmark);
  const mark = { x0: mx, y0: my, x1: mx + markVb[2] * ms, y1: my + markVb[3] * ms };
  const word = { x0: wx, y0: wy, x1: wx + wc.vb[2] * ws, y1: wy + wc.vb[3] * ws, capTop: wy + wc.capTop * ws, baseline: wy + wc.baseline * ws, eRight: wx + wc.right * ws };
  const nameM = /<path fill="([^"]+)" d="([^"]+)"\/>/.exec(svg);
  let name = null;
  if (nameM) {
    const subs = subpaths(nameM[2]);
    name = { fill: nameM[1], all: union(subs), first: subs[0] }; // first subpath: outer contour of the first capital
  }
  return { mark, word, name, vb: viewBoxOf(svg) };
}

const versions = Object.keys(VERSIONS);

test('the plain lock-up reproduces the official strike-lockup-3d-black.svg geometry', () => {
  const { svg } = buildLockup({ layout: 'standard', version: '3d-black' });
  const g = measure(svg, '3d-black');
  near(g.mark.y1 - g.mark.y0, M, 0.01, 'mark height');
  near(g.word.x0, 178.64, 0.01, 'wordmark x (official file: 178.64)');
  near(g.word.y0, 33.29, 0.01, 'wordmark y (official file: 33.29)');
  near(g.vb[2], 547.19, 0.01, 'width');
});

for (const version of versions) {
  test(`horizontal, ${version}`, () => {
    const { svg } = buildLockup({ name: 'Markets', layout: 'horizontal', version });
    const { mark, word, name, vb } = measure(svg, version);
    const Mh = mark.y1 - mark.y0;
    const cap = word.baseline - word.capTop;
    near(Mh, M, 0.01, 'mark height');
    near(cap / Mh, 0.4643, 0.002, 'STRIKE cap height / M');
    near((word.capTop + word.baseline) / 2, (mark.y0 + mark.y1) / 2, 0.02, 'STRIKE centred on the mark');
    near((word.x0 - mark.x1) / Mh, PROPORTIONS.markGap, 0.001, 'mark to STRIKE gap / M');
    const nameCap = name.first.yMax - name.first.yMin;
    near(nameCap / cap, 1.21, 0.002, 'name cap height / STRIKE cap height');
    near(name.first.yMax, word.baseline, 0.02, 'name shares STRIKE baseline');
    near((name.all.xMin - word.eRight) / Mh, 0.5, 0.001, 'STRIKE to name gap (ink) / M');
    assert.equal(name.fill, VERSIONS[version].ink);
    near(vb[0], 0, 1e-9, 'viewBox x'); near(vb[1], 0, 1e-9, 'viewBox y');
    near(vb[2], name.all.xMax, 0.02, 'viewBox ends at the name');
    near(vb[3], Math.max(mark.y1, name.all.yMax), 0.02, 'viewBox height');
  });

  test(`stacked, ${version}`, () => {
    const { svg } = buildLockup({ name: 'Terminal', layout: 'stacked', version });
    const { mark, word, name } = measure(svg, version);
    const m = mark.y1 - mark.y0;
    near((word.baseline - word.capTop) / m, 0.4643, 0.002, 'small lock-up STRIKE cap / m');
    const nameCap = name.first.yMax - name.first.yMin;
    near(nameCap / m, 1.28, 0.002, 'name cap height / m');
    near((name.first.yMin - mark.y1) / m, 0.26, 0.002, 'gap mark bottom to name cap top / m');
    near(name.all.xMin, mark.x0, 0.02, 'left edges aligned');
  });

  test(`powered-by, ${version}`, () => {
    const { svg } = buildLockup({ layout: 'powered-by', version });
    const { mark, word, name } = measure(svg, version);
    const Mh = mark.y1 - mark.y0;
    const cap = word.baseline - word.capTop;
    const pCap = name.first.yMax - name.first.yMin; // the P
    near(pCap / cap, 0.6, 0.002, '"Powered by" cap height / STRIKE cap height');
    near((name.first.yMin + name.first.yMax) / 2, (mark.y0 + mark.y1) / 2, 0.02, 'centred on the mark');
    near((mark.x0 - name.all.xMax) / Mh, 0.59, 0.001, '"Powered by" ends 0.59 M before the mark');
    near(name.all.xMin, 0, 0.02, 'viewBox starts at the text');
  });
}

test('ids are prefixed, unique and resolve', () => {
  const a = buildLockup({ name: 'Markets', layout: 'horizontal', version: '3d-white' }).svg;
  const b = buildLockup({ name: 'Markets', layout: 'stacked', version: '3d-white' }).svg;
  const ids = (s) => [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const s of [a, b]) {
    const list = ids(s);
    assert.ok(list.length > 0);
    assert.equal(new Set(list).size, list.length, 'unique');
    for (const id of list) assert.match(id, /^lk-/);
    for (const m of s.matchAll(/url\(#([^)]+)\)/g)) assert.ok(list.includes(m[1]), `reference ${m[1]} resolves`);
  }
  assert.equal(ids(a).filter((id) => ids(b).includes(id)).length, 0, 'two lock-ups can sit on one page');
});

test('name handling', () => {
  assert.equal(buildLockup({ name: 'markets', version: '3d-black' }).name, 'Markets');
  assert.equal(buildLockup({ name: 'MARKETS', version: '3d-black' }).name, 'Markets');
  assert.equal(buildLockup({ name: 'API', version: '3d-black' }).name, 'API');
  assert.throws(() => buildLockup({ name: 'Strike Markets', version: '3d-black' }), /Strike/);
  assert.throws(() => buildLockup({ name: '', layout: 'horizontal', version: '3d-black' }), /--name/);
  assert.throws(() => buildLockup({ name: 'X', version: 'green' }), /Unknown --version/);
});

test('font reader: Geist Medium metrics, kerning and ligatures', () => {
  const f = readFont(path.join(ROOT, 'assets', 'fonts', 'geist', 'Geist-Medium.ttf'));
  assert.equal(f.unitsPerEm, 1000);
  assert.equal(f.capHeight, 710);
  assert.equal(f.kerning(f.glyphFor(84), f.glyphFor(101)), -80, 'T e');
  assert.equal(layoutText(f, 'Profile').glyphs.length, 6, 'fi ligature');
  assert.equal(layoutText(f, 'Markets').glyphs.length, 7);
});

test('CLI works from any directory and writes a file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lockup-'));
  const out = path.join(dir, 'x.svg');
  const r = spawnSync(process.execPath, [SCRIPT, '--name', 'Protocol', '--layout', 'horizontal', '--version', 'flat-white', '--out', out], { cwd: dir, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(out, 'utf8'), /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="0 0 [\d.]+ [\d.]+"/);
  const bad = spawnSync(process.execPath, [SCRIPT, '--name', 'X', '--layout', 'diagonal'], { cwd: dir, encoding: 'utf8' });
  assert.equal(bad.status, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});
