#!/usr/bin/env node
// Strike sub-brand lock-up generator.
//
//   node scripts/lockup.mjs --name "Markets" --layout horizontal --version 3d-black --out markets.svg
//
//   --name     the sub-brand name, set in Geist Medium, sentence case (not needed for powered-by)
//   --layout   horizontal | stacked | powered-by
//   --version  3d-green | 3d-black | 3d-white | flat-black | flat-white
//   --out      file to write (default: stdout)
//   --weight   medium (default) | regular   (the brand book's examples are set in Regular)
//
// Strike has no official sub-brands. Build one only when asked. The mark and the STRIKE wordmark
// are the official files in assets/logo; they are placed, never redrawn. The name is outlined from
// assets/fonts/geist/Geist-Medium.ttf with the small TrueType reader below (no dependencies).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOGO_DIR = path.join(ROOT, 'assets', 'logo');
const FONT_DIR = path.join(ROOT, 'assets', 'fonts', 'geist');

// ---------------------------------------------------------------------------------------------
// Construction. M = height of the mark.
// Standard lock-up: measured from strike-lockup-3d-black.svg (M = 126.18 units).
// Sub-brands: measured from the brand book (pages 16 and 18) at 300 dpi.
export const PROPORTIONS = {
  wordmarkCap: 58.58 / 126.18, // STRIKE cap height = 0.464 M, centred on the mark
  markGap: 52.46 / 126.18, //     mark to STRIKE = 0.416 M
  nameGap: 0.5, //                STRIKE to the name, ink to ink = half the mark (the grey half-mark on p.16)
  nameCap: 1.21, //               horizontal: name cap height = 1.21 x STRIKE's cap height, same baseline
  stackGap: 0.26, //              stacked: mark bottom to name cap top = 0.26 m (m = small mark height)
  stackCap: 1.28, //              stacked: name cap height = 1.28 m; name and mark left-aligned
  poweredCap: 0.6, //             powered-by: cap height = 0.6 x STRIKE's cap height, centred on the mark
  poweredGap: 0.59, //            powered-by: "Powered by" ends 0.59 M before the mark
};
const M = 126.18; // output units: the same as the official lock-up files

export const VERSIONS = {
  '3d-green': { mark: 'strike-mark-3d-green.svg', wordmark: 'strike-wordmark-white.svg', ink: '#F9F9F9', use: 'dark grounds' },
  '3d-black': { mark: 'strike-mark-3d-black.svg', wordmark: 'strike-wordmark-black.svg', ink: '#0C0C0C', use: 'light grounds' },
  '3d-white': { mark: 'strike-mark-3d-white.svg', wordmark: 'strike-wordmark-white.svg', ink: '#F9F9F9', use: 'soft photos' },
  'flat-black': { mark: 'strike-mark-flat-black.svg', wordmark: 'strike-wordmark-black.svg', ink: '#0C0C0C', use: 'mint, merch, small sizes' },
  'flat-white': { mark: 'strike-mark-flat-white.svg', wordmark: 'strike-wordmark-white.svg', ink: '#F9F9F9', use: 'busy photos, green posters, merch' },
};
export const LAYOUTS = ['horizontal', 'stacked', 'powered-by'];

// ---------------------------------------------------------------------------------------------
// Minimal TrueType reader: cmap (4, 12), hmtx, glyf/loca, OS/2 cap height,
// GSUB 'liga' (type 4) and GPOS 'kern' (pair adjustment, formats 1 and 2).
export function readFont(file) {
  const buf = fs.readFileSync(file);
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = (o) => v.getUint16(o), i16 = (o) => v.getInt16(o), u32 = (o) => v.getUint32(o);
  const tables = {};
  for (let i = 0, n = u16(4); i < n; i++) {
    const r = 12 + i * 16;
    tables[String.fromCharCode(...buf.subarray(r, r + 4))] = u32(r + 8);
  }
  const need = (t) => { if (tables[t] === undefined) throw new Error(`${path.basename(file)}: no ${t} table`); return tables[t]; };
  const head = need('head');
  const unitsPerEm = u16(head + 18);
  const longLoca = i16(head + 50) === 1;
  const numGlyphs = u16(need('maxp') + 4);
  const numHMetrics = u16(need('hhea') + 34);
  const hmtx = need('hmtx');
  const advance = (g) => u16(hmtx + 4 * Math.min(g, numHMetrics - 1));
  const os2 = tables['OS/2'];
  const loca = need('loca'), glyf = need('glyf');
  const glyphOffset = (g) => (longLoca ? [u32(loca + 4 * g), u32(loca + 4 * g + 4)] : [u16(loca + 2 * g) * 2, u16(loca + 2 * g + 2) * 2]);

  // cmap
  const cmap = need('cmap');
  let sub = null;
  for (let i = 0, n = u16(cmap + 2); i < n; i++) {
    const r = cmap + 4 + i * 8, pid = u16(r), eid = u16(r + 2), off = cmap + u32(r + 4), fmt = u16(off);
    if ((fmt === 12 && (pid === 3 || pid === 0)) || (fmt === 4 && !sub && ((pid === 3 && eid === 1) || pid === 0))) sub = off;
  }
  if (sub === null) throw new Error('no usable cmap');
  const glyphFor = (cp) => {
    if (u16(sub) === 12) {
      for (let i = 0, n = u32(sub + 12); i < n; i++) {
        const r = sub + 16 + i * 12, s = u32(r), e = u32(r + 4);
        if (cp >= s && cp <= e) return u32(r + 8) + cp - s;
      }
      return 0;
    }
    const segX2 = u16(sub + 6), ends = sub + 14, starts = ends + segX2 + 2, deltas = starts + segX2, ranges = deltas + segX2;
    for (let s = 0; s < segX2; s += 2) {
      if (cp > u16(ends + s)) continue;
      if (cp < u16(starts + s)) return 0;
      const ro = u16(ranges + s);
      if (!ro) return (cp + i16(deltas + s)) & 0xffff;
      const g = u16(ranges + s + ro + 2 * (cp - u16(starts + s)));
      return g ? (g + i16(deltas + s)) & 0xffff : 0;
    }
    return 0;
  };

  // glyph outlines as contours of {x, y, on}
  const contours = (g, depth = 0) => {
    const [a, b] = glyphOffset(g);
    if (a === b) return [];
    const o = glyf + a, nc = i16(o);
    if (nc < 0) { // composite
      const out = []; let p = o + 10, flags;
      do {
        flags = u16(p); const gi = u16(p + 2); p += 4;
        let dx, dy;
        if (flags & 1) { dx = i16(p); dy = i16(p + 2); p += 4; } else { dx = v.getInt8(p); dy = v.getInt8(p + 1); p += 2; }
        let [xx, xy, yx, yy] = [1, 0, 0, 1];
        const f2 = (q) => i16(q) / 16384;
        if (flags & 8) { xx = yy = f2(p); p += 2; } else if (flags & 0x40) { xx = f2(p); yy = f2(p + 2); p += 4; } else if (flags & 0x80) { xx = f2(p); xy = f2(p + 2); yx = f2(p + 4); yy = f2(p + 6); p += 8; }
        if (!(flags & 2)) throw new Error('point-matched composites are not supported');
        if (depth < 8) for (const c of contours(gi, depth + 1)) out.push(c.map((q) => ({ x: xx * q.x + yx * q.y + dx, y: xy * q.x + yy * q.y + dy, on: q.on })));
      } while (flags & 0x20);
      return out;
    }
    const endPts = []; for (let i = 0; i < nc; i++) endPts.push(u16(o + 10 + 2 * i));
    const nPts = nc ? endPts[nc - 1] + 1 : 0;
    let p = o + 10 + 2 * nc; p += 2 + u16(p);
    const fl = [];
    while (fl.length < nPts) { const f = buf[p++]; fl.push(f); if (f & 8) for (let r = buf[p++]; r > 0; r--) fl.push(f); }
    const coords = (short, same) => {
      const out = []; let val = 0;
      for (const f of fl) {
        if (f & short) { const d = buf[p++]; val += f & same ? d : -d; } else if (!(f & same)) { val += i16(p); p += 2; }
        out.push(val);
      }
      return out;
    };
    const xs = coords(2, 16), ys = coords(4, 32);
    const out = []; let s = 0;
    for (const e of endPts) { const c = []; for (let i = s; i <= e; i++) c.push({ x: xs[i], y: ys[i], on: !!(fl[i] & 1) }); out.push(c); s = e + 1; }
    return out;
  };

  // OpenType layout helpers
  const coverageIndex = (o, g) => {
    if (u16(o) === 1) { for (let i = 0, n = u16(o + 2); i < n; i++) if (u16(o + 4 + 2 * i) === g) return i; return -1; }
    for (let i = 0, n = u16(o + 2); i < n; i++) { const r = o + 4 + 6 * i; if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4) + g - u16(r); }
    return -1;
  };
  const classOf = (o, g) => {
    if (u16(o) === 1) { const s = u16(o + 2), n = u16(o + 4); return g >= s && g < s + n ? u16(o + 6 + 2 * (g - s)) : 0; }
    for (let i = 0, n = u16(o + 2); i < n; i++) { const r = o + 4 + 6 * i; if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4); }
    return 0;
  };
  // lookups (sorted, extension-resolved subtables) of a feature for Latin text
  const featureLookups = (base, tag) => {
    if (base === undefined) return [];
    const scripts = base + u16(base + 4), features = base + u16(base + 6), lookups = base + u16(base + 8);
    let langSys = null;
    for (const want of ['latn', 'DFLT']) {
      for (let i = 0, n = u16(scripts); i < n; i++) {
        const r = scripts + 2 + 6 * i;
        if (String.fromCharCode(...buf.subarray(r, r + 4)) === want && !langSys) { const s = scripts + u16(r + 4); if (u16(s)) langSys = s + u16(s); }
      }
    }
    if (!langSys) return [];
    const idx = new Set();
    for (let i = 0, n = u16(langSys + 4); i < n; i++) {
      const fr = features + 2 + 6 * u16(langSys + 6 + 2 * i);
      if (String.fromCharCode(...buf.subarray(fr, fr + 4)) !== tag) continue;
      const f = features + u16(fr + 4);
      for (let j = 0, m = u16(f + 2); j < m; j++) idx.add(u16(f + 4 + 2 * j));
    }
    return [...idx].sort((a, b) => a - b).map((li) => {
      const L = lookups + u16(lookups + 2 + 2 * li);
      let type = u16(L);
      const subs = [];
      for (let j = 0, n = u16(L + 4); j < n; j++) {
        let st = L + u16(L + 6 + 2 * j);
        if (type === 7 || type === 9) { const t = u16(st + 2); st += u32(st + 4); subs.push({ type: t, st }); } else subs.push({ type, st });
      }
      return subs;
    });
  };
  const ligaLookups = featureLookups(tables.GSUB, 'liga');
  const kernLookups = featureLookups(tables.GPOS, 'kern');

  const ligate = (glyphs) => {
    for (const subs of ligaLookups) {
      const out = [];
      for (let i = 0; i < glyphs.length;) {
        let done = false;
        for (const { type, st } of subs) {
          if (type !== 4) continue;
          const ci = coverageIndex(st + u16(st + 2), glyphs[i]);
          if (ci < 0) continue;
          const set = st + u16(st + 6 + 2 * ci);
          for (let k = 0, n = u16(set); k < n && !done; k++) {
            const lig = set + u16(set + 2 + 2 * k), comps = u16(lig + 2);
            let ok = i + comps <= glyphs.length;
            for (let c = 1; ok && c < comps; c++) ok = glyphs[i + c] === u16(lig + 2 + 2 * c);
            if (ok) { out.push(u16(lig)); i += comps; done = true; }
          }
          if (done) break;
        }
        if (!done) out.push(glyphs[i++]);
      }
      glyphs = out;
    }
    return glyphs;
  };
  const valueSize = (f) => { let n = 0; for (let b = f; b; b >>= 1) n += b & 1; return 2 * n; };
  const xAdvance = (o, f) => { if (!(f & 4)) return 0; let off = 0; if (f & 1) off += 2; if (f & 2) off += 2; return i16(o + off); };
  const kerning = (l, r) => {
    let total = 0;
    for (const subs of kernLookups) { // every lookup applies; within one, the first subtable that applies wins
      for (const { type, st } of subs) {
        if (type !== 2) continue;
        const ci = coverageIndex(st + u16(st + 2), l);
        if (ci < 0) continue;
        const f1 = u16(st + 4), f2 = u16(st + 6), s1 = valueSize(f1), s2 = valueSize(f2);
        if (u16(st) === 1) {
          const set = st + u16(st + 10 + 2 * ci);
          let hit = false;
          for (let k = 0, n = u16(set); k < n; k++) {
            const r0 = set + 2 + k * (2 + s1 + s2);
            if (u16(r0) === r) { total += xAdvance(r0 + 2, f1); hit = true; break; }
          }
          if (hit) break;
        } else {
          const c1 = classOf(st + u16(st + 8), l), c2 = classOf(st + u16(st + 10), r);
          const n1 = u16(st + 12), n2 = u16(st + 14);
          if (c1 < n1 && c2 < n2) total += xAdvance(st + 16 + (c1 * n2 + c2) * (s1 + s2), f1);
          break;
        }
      }
    }
    return total;
  };

  const capHeight = os2 !== undefined && u16(os2) >= 2 ? i16(os2 + 88) : bounds(contours(glyphFor(72))).yMax;
  return { unitsPerEm, numGlyphs, capHeight, glyphFor, advance, contours, ligate, kerning };
}

// Lay out a string: glyph ids, pen positions (font units), with ligatures and kerning.
export function layoutText(font, text) {
  const glyphs = font.ligate([...text].map((ch) => font.glyphFor(ch.codePointAt(0))));
  const missing = [...text].filter((ch) => !/\s/.test(ch) && !font.glyphFor(ch.codePointAt(0)));
  if (missing.length) throw new Error(`Geist has no glyph for: ${missing.join(' ')}`);
  let x = 0; const out = [];
  glyphs.forEach((g, i) => {
    if (i) x += font.kerning(glyphs[i - 1], g);
    out.push({ g, x });
    x += font.advance(g);
  });
  return { glyphs: out, advance: x };
}

// Quadratic TrueType contours -> absolute path commands in output space (y down).
function outline(font, layout, size, ox, oy) {
  const s = size / font.unitsPerEm;
  const cmds = [];
  for (const { g, x } of layout.glyphs) {
    for (const c of font.contours(g)) {
      if (!c.length) continue;
      const P = (q) => [ox + (x + q.x) * s, oy - q.y * s];
      // start on an on-curve point (or the midpoint of two off-curve points)
      let start = c.findIndex((q) => q.on);
      let pts = c;
      if (start < 0) { pts = [{ x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2, on: true }, ...c.slice(1), c[0]]; start = 0; }
      pts = [...pts.slice(start), ...pts.slice(0, start)];
      cmds.push(['M', ...P(pts[0])]);
      let ctrl = null;
      for (let i = 1; i <= pts.length; i++) {
        const q = pts[i % pts.length];
        if (q.on) { cmds.push(ctrl ? ['Q', ...P(ctrl), ...P(q)] : ['L', ...P(q)]); ctrl = null; } else if (ctrl) {
          const mid = { x: (ctrl.x + q.x) / 2, y: (ctrl.y + q.y) / 2 };
          cmds.push(['Q', ...P(ctrl), ...P(mid)]); ctrl = q;
        } else ctrl = q;
      }
      cmds.push(['Z']);
    }
  }
  return cmds;
}

// Exact bounds of absolute M/L/Q/Z commands (quadratic extrema included).
export function bounds(cmdsOrContours) {
  const b = { xMin: Infinity, yMin: Infinity, xMax: -Infinity, yMax: -Infinity };
  const add = (x, y) => { b.xMin = Math.min(b.xMin, x); b.xMax = Math.max(b.xMax, x); b.yMin = Math.min(b.yMin, y); b.yMax = Math.max(b.yMax, y); };
  if (Array.isArray(cmdsOrContours[0]) && typeof cmdsOrContours[0][0] === 'object') { // contours
    for (const c of cmdsOrContours) for (const q of c) add(q.x, q.y);
    return b;
  }
  let cx = 0, cy = 0;
  for (const c of cmdsOrContours) {
    if (c[0] === 'M' || c[0] === 'L') { [cx, cy] = [c[1], c[2]]; add(cx, cy); } else if (c[0] === 'Q') {
      const [x1, y1, x2, y2] = c.slice(1);
      for (const [p0, p1, p2, k] of [[cx, x1, x2, 0], [cy, y1, y2, 1]]) {
        const d = p0 - 2 * p1 + p2;
        if (d) { const t = (p0 - p1) / d; if (t > 0 && t < 1) { const val = (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t * t * p2; k ? add(cx, val) : add(val, cy); } }
      }
      [cx, cy] = [x2, y2]; add(cx, cy);
    }
  }
  return b;
}

// ---------------------------------------------------------------------------------------------
// SVG helpers
const r2 = (n) => { const s = (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s; };
function pathData(cmds, dx, dy) {
  let d = '', px = 0, py = 0;
  const R = (n) => Math.round(n * 100);
  const num = (arr) => arr.map((n, i) => { const s = r2(n / 100); return i && !s.startsWith('-') ? ' ' + s : s; }).join('');
  let sx = 0, sy = 0;
  for (const c of cmds) {
    if (c[0] === 'Z') { d += 'z'; px = sx; py = sy; continue; }
    const abs = []; for (let i = 1; i < c.length; i += 2) abs.push(R(c[i] + dx), R(c[i + 1] + dy));
    const rel = abs.map((n, i) => n - (i % 2 ? py : px));
    d += c[0].toLowerCase() + num(rel);
    [px, py] = abs.slice(-2);
    if (c[0] === 'M') { sx = px; sy = py; }
  }
  return d;
}

// Parse one of our logo files: viewBox and inner markup with ids re-prefixed.
function readLogo(file, prefix) {
  const src = fs.readFileSync(path.join(LOGO_DIR, file), 'utf8');
  const vb = /viewBox="([^"]+)"/.exec(src)[1].split(/[\s,]+/).map(Number);
  let inner = src.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const ids = [...inner.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  ids.forEach((id, i) => {
    const nid = `${prefix}${i}`;
    inner = inner.split(`id="${id}"`).join(`id="${nid}"`).split(`url(#${id})`).join(`url(#${nid})`).split(`href="#${id}"`).join(`href="#${nid}"`);
  });
  return { vb, inner, src };
}

// Ink box of the wordmark's flat capitals: the last subpath is the E (lines only).
function wordmarkMetrics(src) {
  const d = /<path[^>]*\sd="([^"]+)"/.exec(src)[1];
  const tokens = d.match(/[MmLlHhVvZzCcSsQqTtAa]|-?\d*\.?\d+(?:e-?\d+)?/g);
  let x = 0, y = 0, cmd = '', box = null, sub = null;
  const pts = [];
  for (let i = 0; i < tokens.length;) {
    if (/[A-Za-z]/.test(tokens[i])) { cmd = tokens[i++]; if (/[Zz]/.test(cmd)) continue; }
    const n = () => +tokens[i++];
    switch (cmd) {
      case 'M': x = n(); y = n(); sub = []; pts.push(sub); cmd = 'L'; break;
      case 'm': x += n(); y += n(); sub = []; pts.push(sub); cmd = 'l'; break;
      case 'L': x = n(); y = n(); break;
      case 'l': x += n(); y += n(); break;
      case 'H': x = n(); break;
      case 'h': x += n(); break;
      case 'V': y = n(); break;
      case 'v': y += n(); break;
      case 'C': i += 4; x = n(); y = n(); break;
      case 'c': i += 4; x += n(); y += n(); break;
      case 'S': case 'Q': i += 2; x = n(); y = n(); break;
      case 's': case 'q': i += 2; x += n(); y += n(); break;
      default: throw new Error('unexpected path command ' + cmd);
    }
    sub.push([x, y]);
  }
  const E = pts[pts.length - 1];
  box = { xMax: Math.max(...E.map((p) => p[0])), capTop: Math.min(...E.map((p) => p[1])), baseline: Math.max(...E.map((p) => p[1])) };
  return box;
}

// ---------------------------------------------------------------------------------------------
export function sentenceCase(name) {
  let n = name.trim().replace(/\s+/g, ' ');
  const notes = [];
  if (/\bstrike\b/i.test(n)) throw new Error('Leave "Strike" out of --name: the lock-up already carries STRIKE.');
  if (n.length > 4 && n === n.toUpperCase() && /[A-Z]/.test(n)) { n = n.charAt(0) + n.slice(1).toLowerCase(); notes.push('Names are set in sentence case; STRIKE in capitals belongs to the logo only.'); }
  n = n.charAt(0).toUpperCase() + n.slice(1);
  return { name: n, notes };
}

/**
 * Build a lock-up. Returns { svg, name, notes, geometry }.
 * layout: 'horizontal' | 'stacked' | 'powered-by' (and 'standard': the plain lock-up, no name)
 */
export function buildLockup({ name = '', layout = 'horizontal', version = '3d-black', weight = 'medium', prefix } = {}) {
  const V = VERSIONS[version];
  if (!V) throw new Error(`Unknown --version "${version}". Use one of: ${Object.keys(VERSIONS).join(', ')}`);
  if (![...LAYOUTS, 'standard'].includes(layout)) throw new Error(`Unknown --layout "${layout}". Use one of: ${LAYOUTS.join(', ')}`);
  const notes = [];
  let text = '';
  if (layout === 'powered-by') {
    text = 'Powered by';
    if (name) notes.push('powered-by ignores --name.');
  } else if (layout !== 'standard') {
    if (!name.trim()) throw new Error('--name is required for this layout');
    const sc = sentenceCase(name); text = sc.name; notes.push(...sc.notes);
  }
  const slug = (text || 'strike').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'x';
  const pre = prefix || `lk-${slug}-${version.replace('-', '')}-${layout.slice(0, 1)}-`;
  const mark = readLogo(V.mark, pre + 'm');
  const word = readLogo(V.wordmark, pre + 'w');
  const wm = wordmarkMetrics(word.src);
  const P = PROPORTIONS;

  // standard lock-up at mark height h, origin (x0, y0) = top-left of the mark
  const lockupParts = (h, x0, y0) => {
    const ms = h / mark.vb[3];
    const capH = P.wordmarkCap * h;
    const ws = capH / (wm.baseline - wm.capTop);
    const markW = mark.vb[2] * ms;
    const wx = x0 + markW + P.markGap * h - word.vb[0] * ws;
    const capTop = y0 + h / 2 - capH / 2;
    const wy = capTop - wm.capTop * ws;
    return {
      parts: [
        { kind: 'logo', logo: mark, s: ms, x: x0 - mark.vb[0] * ms, y: y0 - mark.vb[1] * ms, box: [x0, y0, x0 + markW, y0 + h] },
        { kind: 'logo', logo: word, s: ws, x: wx, y: wy, box: [wx + word.vb[0] * ws, wy + word.vb[1] * ws, wx + (word.vb[0] + word.vb[2]) * ws, wy + (word.vb[1] + word.vb[3]) * ws] },
      ],
      capH, capTop, baseline: capTop + capH, eRight: wx + wm.xMax * ws, markW,
    };
  };

  const parts = [];
  const geometry = { M };
  let font = null;
  if (text) font = readFont(path.join(FONT_DIR, weight === 'regular' ? 'Geist-Regular.ttf' : 'Geist-Medium.ttf'));
  const textPart = (capHeight, placeInk) => {
    const lay = layoutText(font, text);
    const size = (capHeight / font.capHeight) * font.unitsPerEm;
    const raw = outline(font, lay, size, 0, 0);
    const b = bounds(raw);
    const [ox, oy] = placeInk(b, size);
    const cmds = raw.map((c) => (c[0] === 'Z' ? c : [c[0], ...c.slice(1).map((n, i) => n + (i % 2 ? oy : ox))]));
    return { kind: 'path', cmds, fill: V.ink, box: [b.xMin + ox, b.yMin + oy, b.xMax + ox, b.yMax + oy], size };
  };

  if (layout === 'standard' || layout === 'horizontal') {
    const L = lockupParts(M, 0, 0);
    parts.push(...L.parts);
    Object.assign(geometry, { capH: L.capH, capTop: L.capTop, baseline: L.baseline, eRight: L.eRight });
    if (layout === 'horizontal') {
      const t = textPart(P.nameCap * L.capH, (b) => [L.eRight + P.nameGap * M - b.xMin, L.baseline]);
      parts.push(t);
      Object.assign(geometry, { nameCap: P.nameCap * L.capH, nameInkLeft: t.box[0], nameBaseline: L.baseline, nameSize: t.size });
    }
  } else if (layout === 'stacked') {
    const m = M;
    const L = lockupParts(m, 0, 0);
    parts.push(...L.parts);
    const capH = P.stackCap * m;
    const capTop = m + P.stackGap * m;
    const t = textPart(capH, (b) => [0 - b.xMin, capTop + capH]);
    parts.push(t);
    Object.assign(geometry, { m, capH: L.capH, capTop: L.capTop, baseline: L.baseline, nameCap: capH, nameCapTop: capTop, nameBaseline: capTop + capH, nameInkLeft: t.box[0], nameSize: t.size });
  } else if (layout === 'powered-by') {
    const L = lockupParts(M, 0, 0);
    parts.push(...L.parts);
    const capH = P.poweredCap * L.capH;
    const t = textPart(capH, (b) => [0 - P.poweredGap * M - b.xMax, M / 2 + capH / 2]);
    parts.push(t);
    Object.assign(geometry, { capH: L.capH, capTop: L.capTop, baseline: L.baseline, poweredCap: capH, poweredInkRight: t.box[2], poweredBaseline: M / 2 + capH / 2, nameSize: t.size });
  }

  // tight viewBox, origin at 0,0
  const box = parts.reduce((a, p) => [Math.min(a[0], p.box[0]), Math.min(a[1], p.box[1]), Math.max(a[2], p.box[2]), Math.max(a[3], p.box[3])], [Infinity, Infinity, -Infinity, -Infinity]);
  const dx = -box[0], dy = -box[1];
  const W = box[2] - box[0], H = box[3] - box[1];
  const body = parts.map((p) => {
    if (p.kind === 'logo') {
      return `<g transform="matrix(${rn(p.s, 6)} 0 0 ${rn(p.s, 6)} ${rn(p.x + dx, 4)} ${rn(p.y + dy, 4)})">${p.logo.inner}</g>`;
    }
    return `<path fill="${p.fill}" d="${pathData(p.cmds, dx, dy)}"/>`;
  }).join('');
  const label = layout === 'powered-by' ? 'Powered by STRIKE' : text ? `STRIKE ${text}` : 'STRIKE';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r2(W)} ${r2(H)}" width="${r2(W)}" height="${r2(H)}" role="img" aria-label="${label}">${body}</svg>\n`;
  geometry.offset = [dx, dy];
  geometry.viewBox = [0, 0, W, H];
  geometry.parts = parts.map((p) => ({ kind: p.kind, box: p.box.map((n, i) => n + (i % 2 ? dy : dx)) }));
  return { svg, name: text, notes, geometry };
}
function rn(n, d) { const s = n.toFixed(d).replace(/\.?0+$/, ''); return s === '-0' ? '0' : s; }

// ---------------------------------------------------------------------------------------------
function parseArgs(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') o.help = true;
    else if (a.startsWith('--')) {
      const [k, v] = a.includes('=') ? [a.slice(2, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a.slice(2), argv[++i]];
      o[k] = v;
    }
  }
  return o;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const o = parseArgs(process.argv.slice(2));
  if (o.help || (!o.name && o.layout !== 'powered-by')) {
    process.stdout.write(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).map((l) => l.replace(/^\/\/ ?/, '')).join('\n') + '\n');
    process.exit(o.help ? 0 : 1);
  }
  try {
    const { svg, notes } = buildLockup({ name: o.name || '', layout: o.layout || 'horizontal', version: o.version || '3d-black', weight: o.weight || 'medium' });
    for (const n of notes) process.stderr.write(n + '\n');
    if (o.out) { fs.writeFileSync(o.out, svg); process.stderr.write(`Wrote ${o.out}\n`); } else process.stdout.write(svg);
  } catch (e) {
    process.stderr.write(`lockup: ${e.message}\n`);
    process.exit(1);
  }
}
