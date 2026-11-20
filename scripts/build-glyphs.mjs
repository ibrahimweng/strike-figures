/* Turn Geist into path data for labels: node scripts/build-glyphs.mjs
   Labels are drawn as outlines, so exported SVGs, PNGs, videos and Lottie
   files look the same everywhere, with or without the font installed.
   Two weights, as the brand book sets infographic labels: Regular, and
   Medium for a ticker over its value. Arrows and a few symbols Geist lacks
   come from Geist Mono. Both fonts are under the SIL Open Font License. */
import { readFileSync, writeFileSync } from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const opentype = require('opentype.js');
const load = (pkg, file) => {
  const buf = readFileSync(require.resolve(`${pkg}/files/${file}`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const chars = [];
for (let c = 32; c < 127; c++) chars.push(String.fromCharCode(c));
chars.push(...'·×±↑↓€£°…−–—’‘“”²³½'.split(''));
const r = n => Math.round(n);
const weights = {};
let upm = 1000;
let capHeight = 700;
const missing = new Set();
for (const [name, w] of [
  ['regular', 400],
  ['medium', 500],
]) {
  const fonts = [load('@fontsource/geist', `geist-latin-${w}-normal.woff`), load('@fontsource/geist', `geist-latin-ext-${w}-normal.woff`), load('@fontsource/geist-mono', `geist-mono-symbols2-${w}-normal.woff`)];
  const main = fonts[0];
  upm = main.unitsPerEm;
  capHeight = main.tables.os2?.sCapHeight ?? capHeight;
  const glyphs = {};
  const found = {};
  for (const ch of chars) {
    const font = fonts.find(f => {
      const g = f.charToGlyph(ch);
      return g && g.index !== 0;
    });
    if (!font) {
      missing.add(ch);
      continue;
    }
    const g = font.charToGlyph(ch);
    found[ch] = { g, font };
    glyphs[ch] = [ch === ' ' ? '' : g.getPath(0, 0, upm).toPathData(1), r(g.advanceWidth * (upm / font.unitsPerEm))];
  }
  /* kerning between the Latin glyphs, where the font has any */
  const kern = {};
  const latin = Object.entries(found).filter(([, v]) => v.font === main);
  for (const [a, va] of latin)
    for (const [b, vb] of latin) {
      const k = main.getKerningValue(va.g, vb.g);
      if (k) kern[a + b] = r(k);
    }
  weights[name] = { glyphs, kern };
}
const out = { name: 'Geist', upm, capHeight, weights };
writeFileSync(new URL('../src/engine/glyphs.json', import.meta.url), JSON.stringify(out));
console.log(`${Object.keys(weights.regular.glyphs).length} glyphs, ${Object.keys(weights.regular.kern).length} kerning pairs, upm ${upm}, cap ${capHeight}; missing: ${[...missing].join(' ') || 'none'}`);
