/* Turn Geist Mono into path data for labels: node scripts/build-glyphs.mjs
   Labels are drawn as outlines, so exported SVGs and PNGs look the same
   everywhere, with or without the font installed. Geist Mono is under the
   SIL Open Font License. */
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const opentype = require('opentype.js');
const load = subset => {
  const buf = readFileSync(require.resolve(`@fontsource/geist-mono/files/geist-mono-${subset}-400-normal.woff`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
/* the Latin file first; arrows and shapes come from the symbols file */
const fonts = ['latin', 'latin-ext', 'symbols2'].map(load);
const font = fonts[0];
const upm = font.unitsPerEm;
const chars = [];
for (let c = 32; c < 127; c++) chars.push(String.fromCharCode(c));
chars.push(...'·×±→←↑↓€£°…−–—▲▼●○■□✓ΔΓΘνσ'.split(''));
const glyphs = {};
const missing = [];
let advance = 0;
for (const ch of chars) {
  const g = fonts.map(f => f.charToGlyph(ch)).find(x => x && x.index !== 0);
  if (!g) {
    missing.push(ch);
    continue;
  }
  advance = Math.max(advance, g.advanceWidth);
  glyphs[ch] = g.getPath(0, 0, upm).toPathData(1);
}
const out = { name: font.names.fullName?.en ?? 'Geist Mono', upm, ascender: font.ascender, descender: font.descender, capHeight: font.tables.os2?.sCapHeight ?? 700, advance, glyphs };
writeFileSync(new URL('../src/engine/glyphs.json', import.meta.url), JSON.stringify(out));
console.log(`${Object.keys(glyphs).length} glyphs, upm ${upm}, advance ${advance}, cap ${out.capHeight}; missing: ${missing.join(' ') || 'none'}`);
