/* The Skill page's illustration: one Strike mark, with lines out to every
   tool the skill works in. Drawn with the same engine and house rules as the
   library, and looped calmly: the lines reach out in turn, then rest. */
import { bump } from '../anim/kit';
import { renderScene } from '../engine/render';
import { buildSvg, serialize } from '../engine/svg';
import { C, chevron, dots, figure, label, line, onTop, type V } from '../library/kit';
import type { Scene } from '../model/types';
import { fitCamera } from '../ui/view';

export const HERO_AGENTS = ['Claude', 'ChatGPT', 'Cursor', 'Codex', 'Copilot', 'Gemini', 'Windsurf', 'Perplexity', 'Figma'];

const RX = 560;
const RZ = 170;

/** Where each tool sits: round an ellipse on the ground, clear of the mark. */
function spots(): V[] {
  const n = HERO_AGENTS.length;
  return HERO_AGENTS.map((_, i) => {
    const a = (-168 + (336 * i) / (n - 1)) * (Math.PI / 180);
    return [RX * Math.cos(a), 0, RZ * Math.sin(a)];
  });
}

export function heroScene(): Scene {
  const mark = [0, 1, 2].map(i => {
    const o = chevron(150, 78, 12, [0, i * 24, 0], { tier: i === 2 ? 'subject' : 'support', name: `Chevron ${3 - i}` });
    if (i === 2) onTop(o, dots({ spacing: 3, size: 0.7, stagger: true }));
    return o;
  });
  const at = spots();
  const rays = at.map(p => line([[0, 0, 0], p], { tier: 'ghost', under: true, nodes: 'circle', nodeSize: 7, nodeAt: [1] }));
  const labels = at.map((p, i) => label(HERO_AGENTS[i]!, [p[0], 14, p[2]], { size: 7, color: C.mid }));
  const sc = figure('Strike, in any AI tool', mark, labels, { lines: [...rays], yaw: 0, pitch: 38 });
  sc.artboard = { width: 1200, height: 380 };
  sc.camera = { ...sc.camera, zoom: 1, panX: 0, panY: 0 };
  const cam = fitCamera(sc, renderScene(sc), 0.05);
  if (cam) sc.camera = cam;
  return sc;
}

/** The figure at moment t (0..1): the lines reach out one after another, then rest. */
export function heroAt(base: Scene, t: number): Scene {
  const sc = structuredClone(base);
  const n = sc.lines?.length ?? 0;
  (sc.lines ?? []).forEach((l, i) => {
    const k = 1 - bump(t, (i / n) * 0.5, (i / n) * 0.5 + 0.45);
    const [a, b] = l.points;
    if (a && b) l.points = [a, [a[0] + (b[0] - a[0]) * k, b[1], a[2] + (b[2] - a[2]) * k]];
    l.opacity = 0.35 + 0.65 * k;
  });
  sc.objects.forEach((o, i) => {
    if (i === 0) return;
    o.position = [o.position[0], o.position[1] + 8 * i * bump(t, 0.1 * i, 0.6 + 0.1 * i), o.position[2]];
  });
  sc.labels.forEach((l, i) => (l.opacity = 0.55 + 0.45 * (1 - bump(t, (i / n) * 0.5, (i / n) * 0.5 + 0.45))));
  return sc;
}

export const heroSvg = (sc: Scene) => serialize(buildSvg(renderScene(sc), { background: false, idPrefix: 'hero' }));
