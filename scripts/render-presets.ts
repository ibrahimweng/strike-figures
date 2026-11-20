/* Render every library illustration and the built-in figure to SVG files: npm run render -- <out-dir> [--clip] */
import { mkdirSync, writeFileSync } from 'fs';
import { renderScene } from '../src/engine/render';
import { toSvgString } from '../src/engine/svg';
import { LIBRARY } from '../src/library';
import { PRESETS } from '../src/model/presets';

const args = process.argv.slice(2);
const out = args.find(a => !a.startsWith('--')) ?? 'out';
const clipHidden = args.includes('--clip');
mkdirSync(out, { recursive: true });
for (const p of [...PRESETS, ...LIBRARY.map(x => ({ id: `${x.code.replace('·', '')}-${x.id}`, make: x.make }))]) {
  const t0 = performance.now();
  const model = renderScene(p.make());
  const svg = toSvgString(model, { clipHidden });
  writeFileSync(`${out}/${p.id}.svg`, svg);
  console.log(`${p.id}: ${model.layers.length} layers, ${(svg.length / 1024).toFixed(1)} KB, ${(performance.now() - t0).toFixed(1)} ms`);
}
