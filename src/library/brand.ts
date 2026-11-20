/* The brand book's illustrations (Visual Language: Dimensions, Infographics,
   Posters), redrawn in the house look: lines, with shapes hiding what's
   behind them, dots for tone, construction lines dashed.

   Most are flat diagrams, drawn on the ground and seen from straight above
   (the brand's "simplest expression"). Each is a real 3D scene of thin
   plates, so turning it to the 2:1 view gives its isometric version with
   the same look. Infographics may use the brand's data colours, each for
   one meaning (see DATA_COLOURS in kit.ts). */
import { allDots, bump, ease, envelope, inout, named, one, swing } from '../anim/kit';
import type { Label, Line, Scene, SceneObject } from '../model/types';
import {
  band,
  box,
  C,
  chevron,
  cyl,
  DATA_COLOURS,
  dashed,
  dots,
  figure,
  greyDots,
  label,
  line,
  onSides,
  onTop,
  ring,
  seeThrough,
  shape,
  ticker,
  wall,
  type V,
} from './kit';
import { circleScene, circlesLoop } from './circleFigure';
import type { Entry } from './index';

/** a point on a circle in plan, angle in degrees from +X towards +Z (screen: from the right, clockwise) */
const polar = (r: number, deg: number, y = 0): V => [r * Math.cos((deg * Math.PI) / 180), y, r * Math.sin((deg * Math.PI) / 180)];
const flatPts = (pts: V[]): [number, number][] => pts.map(p => [p[0], p[2]]);
const lines = (sc: Scene) => sc.lines ?? [];
const lineNamed = (sc: Scene, i: number): Line | null => lines(sc)[i] ?? null;

/** Radar points: n axes from the top, clockwise. */
const radarPts = (radii: number[], y: number): V[] => radii.map((r, i) => polar(r, -90 + (360 * i) / radii.length, y));

export const BRAND: Entry[] = [
  {
    id: 'radar',
    title: 'Radar',
    tags: ['radar', 'spider', 'profile', 'brand'],
    make: () => {
      const radii = [66, 30, 44, 28, 58];
      const outer = onTop(cyl(72, 2, [0, 0, 0], { tier: 'support', name: 'Outer' }), greyDots({ spacing: 3.2, size: 0.5, opacity: 0.2 }));
      const inner = dashed(cyl(34, 2, [0, 2, 0], { tier: 'ghost', name: 'Inner' }));
      const poly = onTop(shape(flatPts(radarPts(radii, 0)), 1.5, [0, 4, 0], { tier: 'subject', round: 1, name: 'Profile' }), dots({ spacing: 2.6, size: 0.5, stagger: true, opacity: 0.85 }));
      poly.style.showCreases = false;
      const spokes = radarPts([80, 80, 80, 80, 80], 5.5).map(p => line([[0, 5.5, 0], p], { tier: 'ghost', dash: true }));
      const nodes = line(radarPts(radii, 5.5), { tier: 'subject', width: 0, nodes: 'circle', nodeSize: 4.2 });
      const centre = line([[0, 5.5, 0]], { tier: 'subject', width: 0, nodes: 'square', nodeSize: 3.6 });
      return figure('Radar', [outer, inner, poly], [], { flat: true, lines: [...spokes, nodes, centre] });
    },
    loop: (sc, t) => {
      const base = [66, 30, 44, 28, 58];
      const radii = base.map((r, i) => r * (1 + 0.16 * swing(t, i / 5)));
      const poly = one(sc, 'Profile');
      if (poly && poly.shape.kind === 'outline') poly.shape.points = flatPts(radarPts(radii, 0));
      const nodes = lineNamed(sc, 5);
      if (nodes) nodes.points = radarPts(radii, 5.5);
    },
  },
  {
    id: 'unified-margin',
    title: 'Unified margin',
    tags: ['margin', 'collateral', 'account', 'brand'],
    make: () => {
      const pool = onTop(cyl(70, 2, [-30, 0, 0], { tier: 'support', name: 'Margin pool' }), greyDots({ spacing: 3.2, size: 0.5, opacity: 0.2 }));
      const position = onTop(cyl(34, 3, [42, 0, 0], { tier: 'subject', name: 'Position' }), dots({ spacing: 2.8, size: 0.55, stagger: true }));
      const used = ring([-30, 2, 0], 34, { tier: 'ghost', dash: true });
      const reach = ring([42, 3, 0], 70, { tier: 'support', dash: true });
      const axis = line(
        [
          [-64, 3, 0],
          [76, 3, 0],
        ],
        { tier: 'ghost', dash: true },
      );
      const node = line([[8, 3, 0]], { tier: 'subject', width: 0, nodes: 'square', nodeSize: 4.5 });
      return figure('Unified margin', [pool, position], [], { flat: true, lines: [used, reach, axis, node] });
    },
    loop: (sc, t) => {
      const k = -18 * bump(t, 0.05, 0.95);
      const pos = one(sc, 'Position');
      if (pos) pos.position = [pos.position[0] + k, pos.position[1], pos.position[2]];
      const reach = lineNamed(sc, 1);
      if (reach) reach.center = [reach.center[0] + k, reach.center[1], reach.center[2]];
      const node = lineNamed(sc, 3);
      if (node && node.points[0]) node.points = [[node.points[0][0] + k, node.points[0][1], node.points[0][2]]];
    },
  },
  {
    id: 'iv-segments',
    title: 'Volatility segments',
    tags: ['radial', 'implied volatility', 'iv', 'segments', 'infographic', 'brand'],
    make: () => {
      const outer = [92, 60, 50, 40, 54, 46, 56, 86];
      const marks: { colour?: string; t?: [string, string] }[] = [
        { colour: DATA_COLOURS.yellow, t: ['AAPL', '20.5%'] },
        { t: ['AMZN', 'IV 30.0%'] },
        { t: ['MSFT', 'IV 32%'] },
        {},
        { colour: C.emerald, t: ['LITE', 'IV 138.0%'] },
        { t: ['AAPL', '20.5%'] },
        { colour: DATA_COLOURS.loss },
        { t: ['AMD', 'IV 106.2%'] },
      ];
      const objects: SceneObject[] = [];
      const labels: Label[] = [];
      outer.forEach((r, i) => {
        const start = -90 + i * 45 + 2.5;
        const m = marks[i]!;
        const seg = band(22, r, start, 40, 2, [0, 0, 0], { tier: m.colour ? 'subject' : 'support', name: `Segment ${i + 1}` });
        onTop(seg, m.colour ? dots({ color: m.colour, spacing: 2.4, size: 0.62, stagger: true, inset: 2 }) : greyDots({ spacing: 2.4, size: 0.45, stagger: true, opacity: 0.22, inset: 2 }));
        objects.push(seg);
        if (m.t) {
          const mid = start + 20;
          /* names sit on the dark segments; a coloured one is named just outside it, where the dots don't fight the letters */
          const at = m.colour ? polar(r + 8, mid, 2) : polar(22 + (r - 22) * (r > 70 ? 0.42 : 0.5), mid, 2);
          const outside = m.colour && Math.cos((mid * Math.PI) / 180) < 0;
          labels.push(...ticker(m.t[0], m.t[1], [at[0] + (m.colour ? (outside ? -2 : 2) : -7), 2, at[2] - 2], { size: 3.6, align: outside ? 'end' : 'start' }));
        }
      });
      const hub = ring([0, 2, 0], 18, { tier: 'ghost' });
      return figure('Volatility segments', objects, labels, { flat: true, lines: [hub] });
    },
    loop: (sc, t) => {
      named(sc, 'Segment').forEach((o, i) => {
        if (o.shape.kind !== 'band') return;
        o.shape.outer = 22 + (o.shape.outer - 22) * (1 + 0.14 * bump(t, (i / 8) * 0.6, (i / 8) * 0.6 + 0.4));
      });
    },
  },
  {
    id: 'stacked-frames',
    title: 'Stacked frames',
    tags: ['layers', 'stack', 'history', 'versions', 'brand'],
    make: () => {
      const n = 9;
      const profile: [number, number][] = [
        [-30, 0],
        [30, 0],
        [30, 96],
        [-30, 96],
      ];
      const frames = Array.from({ length: n }, (_, i) => {
        const k = n - 1 - i;
        const o = wall(profile, 1.2, [k * 6, k * 7, -k * 6], { tier: i === n - 1 ? 'subject' : i > n - 4 ? 'support' : 'ghost', round: 7, name: `Frame ${i + 1}` });
        o.style.showCreases = false;
        return o;
      });
      return figure('Stacked frames', frames);
    },
    loop: (sc, t) => {
      named(sc, 'Frame').forEach((o, i, all) => {
        const k = bump(t, 0.05 + (i / all.length) * 0.45, 0.45 + (i / all.length) * 0.45);
        o.position = [o.position[0], o.position[1] + 7 * k, o.position[2]];
      });
    },
  },
  {
    id: 'orbit',
    title: 'Orbit',
    tags: ['orbit', 'network', 'connected', 'global', 'brand'],
    make: () => {
      const rings = [0, 60, 120].map(yaw => ring([0, 0, 0], 72, { tier: 'support', rot: [58, yaw, 0], nodes: 'square', nodeSize: 4.6, nodeAt: [0, 0.5] }));
      const spokes = [0, 60, 120].map(yaw => {
        const a = (yaw * Math.PI) / 180;
        return line(
          [
            [-72 * Math.cos(a), 0, 72 * Math.sin(a)],
            [72 * Math.cos(a), 0, -72 * Math.sin(a)],
          ],
          { tier: 'ghost' },
        );
      });
      const core = onTop(cyl(7, 3, [0, -1.5, 0], { tier: 'subject', name: 'Core' }), dots({ spacing: 1.8, size: 0.5 }));
      return figure('Orbit', [core], [], { flat: true, lines: [...spokes, ...rings] });
    },
    loop: (sc, t) => {
      const turn = 60 * t;
      lines(sc).forEach(l => {
        if (l.kind === 'circle') l.rotation = [l.rotation[0], l.rotation[1] + turn, l.rotation[2]];
        else {
          const a = (turn * Math.PI) / 180;
          l.points = l.points.map(([x, y, z]) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)]);
        }
      });
    },
  },
  {
    id: 'rising-blocks',
    title: 'Rising blocks',
    tags: ['growth', 'blocks', 'steps', 'bars', 'brand'],
    make: () => {
      const hs = [38, 66, 104];
      const objects: SceneObject[] = [];
      hs.forEach((h, i) => {
        const z = 44 - i * 44;
        objects.push(box(34, 34, h, [0, 0, z], { tier: 'support', round: 2, name: `Block ${i + 1}` }));
        const cap = box(34, 34, 9, [0, h + 9, z], { tier: 'subject', round: 2, shadow: 6, guides: true, name: `Cap ${i + 1}` });
        if (i === hs.length - 1) onTop(cap, dots({ spacing: 2.8, size: 0.6 }));
        objects.push(cap);
      });
      return figure('Rising blocks', objects);
    },
    loop: (sc, t) => {
      named(sc, 'Cap').forEach((o, i) => {
        const k = bump(t, 0.08 + i * 0.2, 0.5 + i * 0.2);
        o.position = [o.position[0], o.position[1] + 10 * k, o.position[2]];
      });
    },
  },
  {
    id: 'always-on',
    title: 'Always on',
    tags: ['24/7', 'clock', 'time', 'hours', 'always', 'brand'],
    make: () => {
      const ticks: Line[] = [];
      for (let i = 0; i < 60; i++) {
        const deg = -90 + i * 6;
        const long = i % 5 === 0;
        const lit = i >= 15 && i < 50;
        ticks.push(line([polar(long ? 56 : 59, deg, 0), polar(66, deg, 0)], { tier: lit ? 'support' : 'ghost', opacity: lit ? 1 : 0.8 }));
      }
      const rim = ring([0, 0, 0], 72, { tier: 'ghost' });
      const beads = ring([0, 0, 0], 82, { tier: 'ghost', width: 0, nodes: 'circle', nodeSize: 3.4, nodeAt: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875] });
      const face = onTop(
        cyl(46, 3, [0, 0, 0], { tier: 'subject', name: 'Face' }),
        dots({ spacing: 2.7, size: 0.6, min: 0.12, stagger: true, gradient: { type: 'radial', cx: 0.5, cy: 0.5, radius: 0.72, invert: true } }),
      );
      const inner = ring([0, 3, 0], 40, { tier: 'support' });
      const arrows = [0, 0.5].map(f => ring([0, 3, 0], 34, { tier: 'subject', from: f + 0.04, to: f + 0.42, arrow: true }));
      return figure('Always on', [face], [], { flat: true, lines: [rim, ...ticks, beads, inner, ...arrows] });
    },
    loop: (sc, t) => {
      for (const l of lines(sc).slice(-2)) {
        l.from += 0.5 * t;
        l.to += 0.5 * t;
      }
    },
  },
  {
    id: 'payoff-slabs',
    title: 'Payoff outcomes',
    tags: ['payoff', 'outcomes', 'scenarios', 'options', 'brand'],
    make: () => {
      const actual = onTop(box(96, 60, 12, [26, 0, 18], { tier: 'subject', round: 2, name: 'Outcome' }), dots({ spacing: 2.8, size: 0.6 }));
      const below = seeThrough(dashed(box(96, 60, 12, [-34, 0, 34], { tier: 'support', round: 2, name: 'Possible below' })));
      const above = seeThrough(dashed(box(96, 60, 12, [-14, 34, -30], { tier: 'support', round: 2, name: 'Possible above' })));
      return figure('Payoff outcomes', [below, actual, above]);
    },
    loop: (sc, t) => {
      const k = bump(t, 0.05, 0.95);
      const above = one(sc, 'Possible above');
      if (above) above.position = [above.position[0] + 10 * k, above.position[1] - 10 * k, above.position[2] + 12 * k];
      const below = one(sc, 'Possible below');
      if (below) below.position = [below.position[0] + 10 * ease(k), below.position[1], below.position[2] - 6 * k];
    },
  },
  {
    id: 'iv-circles',
    title: 'Volatility circles',
    tags: ['volatility', 'iv', 'circles', 'range', 'infographic', 'brand'],
    make: () => {
      const radii = [24, 48, 72, 96];
      const core = onTop(cyl(radii[0]!, 2, [radii[0]! - 96, 0, 0], { tier: 'subject', name: 'Core' }), dots({ spacing: 2.4, size: 0.55, stagger: true }));
      const rings = radii.slice(1).map((r, i) => ring([r - 96, 0, 0], r, { tier: i === 2 ? 'ghost' : 'support' }));
      const arrow = line(
        [
          [-96, 2, 0],
          [104, 2, 0],
        ],
        { tier: 'support', arrow: true },
      );
      const labels = [
        ...ticker('NVDA', 'IV 64.8%', [-38, 2, -9], { size: 3.6 }),
        ...ticker('AMD', 'IV 106.2%', [8, 2, -9], { size: 3.6 }),
        ...ticker('LITE', 'IV 138.0%', [56, 2, -9], { size: 3.6 }),
      ];
      return figure('Volatility circles', [core], labels, { flat: true, lines: [...rings, arrow] });
    },
    loop: (sc, t) => {
      lines(sc)
        .filter(l => l.kind === 'circle')
        .forEach((l, i) => {
          const k = 1 + 0.07 * bump(t, 0.05 + i * 0.15, 0.55 + i * 0.15);
          const r = l.radius * k;
          l.center = [r - 96, l.center[1], l.center[2]];
          l.radius = r;
        });
    },
  },
  {
    id: 'bubbles',
    title: 'Share bubbles',
    tags: ['bubbles', 'share', 'composition', 'percent', 'infographic', 'brand'],
    make: () => {
      const spec: { r: number; at: [number, number]; text: string; colour?: string; tier?: 'subject' | 'support' | 'ghost' }[] = [
        { r: 46, at: [-34, 30], text: '40%', tier: 'subject' },
        { r: 34, at: [34, -36], text: '18%', tier: 'ghost' },
        { r: 30, at: [96, 8], text: '15%', tier: 'ghost' },
        { r: 30, at: [62, 58], text: '15%', colour: DATA_COLOURS.sky },
        { r: 22, at: [-100, 74], text: '12%', tier: 'ghost' },
        { r: 20, at: [28, 30], text: '10%', colour: C.emerald },
        { r: 7, at: [-4, -46], text: '2%', colour: DATA_COLOURS.yellow },
        { r: 7, at: [50, 14], text: '2%', colour: DATA_COLOURS.sky },
      ];
      const objects = spec.map((b, i) => {
        const o = cyl(b.r, 2, [b.at[0], i * 0.6, b.at[1]], { tier: b.tier ?? 'subject', name: `Bubble ${i + 1}` });
        if (b.colour) onTop(o, dots({ color: b.colour, spacing: 2.2, size: 0.55, stagger: true, inset: 1.2, opacity: 0.55 }));
        else if (b.tier === 'subject') onTop(o, greyDots({ spacing: 2.4, size: 0.5, opacity: 0.35, stagger: true }));
        return o;
      });
      const labels = spec.filter(b => b.r > 12).map((b, i) => label(b.text, [b.at[0], 6, b.at[1] + 1.6], { size: b.r > 40 ? 5.2 : 4, color: i === 0 || b.colour ? C.line : C.mid }));
      return figure('Share bubbles', objects, labels, { flat: true });
    },
    loop: (sc, t) => {
      named(sc, 'Bubble').forEach((o, i) => {
        if (o.shape.kind !== 'cylinder') return;
        o.shape.radius *= 1 + 0.06 * swing(t, i / 8);
      });
    },
  },
  {
    id: 'feature-radar',
    title: 'Feature radar',
    tags: ['radar', 'compare', 'features', 'hexagon', 'infographic', 'brand'],
    make: () => {
      const axes = ['Hours', 'Markets', 'Margin', 'Custody', 'Speed', 'Fees'];
      const grid = [24, 48, 72, 96].map((r, i) => line(radarPts([r, r, r, r, r, r], 0), { tier: i === 3 ? 'support' : 'ghost', closed: true }));
      const spokes = radarPts([96, 96, 96, 96, 96, 96], 0).map(p => line([[0, 0, 0], p], { tier: 'ghost' }));
      const strike = [92, 84, 70, 88, 64, 58];
      const others = [30, 44, 52, 26, 50, 40];
      const flow = onTop(shape(flatPts(radarPts(strike, 0)), 1.2, [0, 0, 0], { tier: 'subject', round: 1, name: 'Strike' }), dots({ spacing: 2.6, size: 0.5, opacity: 0.6, stagger: true }));
      flow.style.showCreases = false;
      const other = line(radarPts(others, 1.2), { tier: 'support', closed: true, dash: true, nodes: 'circle', nodeSize: 3 });
      const nodes = line(radarPts(strike, 1.2), { tier: 'subject', width: 0, nodes: 'circle', nodeSize: 3.6 });
      const labels = radarPts([112, 112, 112, 112, 112, 112], 0).map((p, i) => label(axes[i]!, [p[0], 0, p[2] + 1.5], { plane: 'ground', size: 3.4, color: C.mid }));
      return figure('Feature radar', [flow], labels, { flat: true, lines: [...grid, ...spokes, other, nodes] });
    },
    loop: (sc, t) => {
      const base = [92, 84, 70, 88, 64, 58];
      const radii = base.map((r, i) => r * (1 - 0.1 * bump(t, 0.05 + i * 0.08, 0.5 + i * 0.08)));
      const flow = one(sc, 'Strike');
      if (flow && flow.shape.kind === 'outline') flow.shape.points = flatPts(radarPts(radii, 0));
      const nodes = lines(sc)[lines(sc).length - 1];
      if (nodes) nodes.points = radarPts(radii, 1.2);
    },
  },
  {
    id: 'drawn-mark',
    title: 'Strike mark, drawn',
    tags: ['logo', 'mark', 'chevron', 'poster', 'brand'],
    make: () => {
      const objects = [0, 1, 2].map(i => {
        const o = dashed(chevron(168, 87, 16, [0, i * 26, 0], { tier: i === 2 ? 'subject' : 'support', name: `Chevron ${3 - i}`, rot: [0, 45, 0] }), 2.4);
        onSides(o, greyDots({ spacing: 2.2, size: 0.42, opacity: 0.3 }));
        onTop(o, i === 2 ? dots({ spacing: 2.6, size: 0.55, stagger: true }) : greyDots({ spacing: 2.6, size: 0.45, opacity: 0.22, stagger: true }));
        return o;
      });
      const labels = [...ticker('AAPL', '20.5%', [70, 0, 70], { size: 3.6 }), ...ticker('AMZN', 'IV 30.0%', [70, 0, 70], { size: 3.6, line: 2.6 })];
      return figure('Strike mark, drawn', objects, labels);
    },
    loop: (sc, t) => {
      named(sc, 'Chevron').forEach(o => {
        const level = Math.round(o.position[1] / 26);
        if (level > 0) o.position = [o.position[0], o.position[1] + 8 * level * bump(t, 0.05 + level * 0.08, 0.75 + level * 0.08), o.position[2]];
      });
      allDots(sc, (d, o) => {
        if (o.name === 'Chevron 1') d.sweep = { phase: inout(t), amount: 0.6 * envelope(t) };
      });
    },
  },
  {
    id: 'ticks-chart',
    title: 'Week in lines',
    tags: ['chart', 'lines', 'week', 'closed', 'percent', 'poster', 'infographic', 'brand'],
    make: () => {
      const n = 46;
      const h = (i: number) => 14 + 70 * Math.pow(i / (n - 1), 1.6) + 6 * Math.sin(i * 1.3);
      const bars = Array.from({ length: n }, (_, i) => line([[-92 + i * 4, 0, 40], [-92 + i * 4, 0, 40 - h(i)]], { tier: i > n - 8 ? 'subject' : 'support', opacity: 0.55 + (0.45 * i) / n }));
      const peaks = [14, 27, 38].map(i => line([[-92 + i * 4, 0, 40 - h(i) - 6]], { tier: 'subject', width: 0, nodes: 'circle', nodeSize: 3.6, color: C.emerald }));
      const base = line(
        [
          [-96, 0, 40],
          [94, 0, 40],
        ],
        { tier: 'ghost' },
      );
      const months = ['Mar', 'Apr', 'May', 'Jun'].map((m, i) => label(m, [-70 + i * 52, 0, 48], { plane: 'ground', size: 3, color: C.mid }));
      return figure('Week in lines', [], months, { flat: true, lines: [base, ...bars, ...peaks] });
    },
    loop: (sc, t) => {
      const all = lines(sc);
      all.slice(1, -3).forEach((l, i, list) => {
        const k = 1 - 0.55 * bump(t, (i / list.length) * 0.5, (i / list.length) * 0.5 + 0.5);
        const [a, b] = l.points;
        if (a && b) l.points = [a, [b[0], b[1], a[2] + (b[2] - a[2]) * k]];
      });
    },
  },
  {
    id: 'market-rays',
    title: 'Market rays',
    tags: ['markets', 'rays', 'reach', 'tickers', 'poster', 'infographic', 'brand'],
    make: () => {
      const origin: V = [0, 2, 92];
      const targets: { at: V; t: [string, string] }[] = [
        { at: [-104, 0, -6], t: ['LITE', 'IV 138.0%'] },
        { at: [-70, 0, -92], t: ['AAPL', '20.5%'] },
        { at: [8, 0, -112], t: ['AMD', 'IV 106.2%'] },
        { at: [64, 0, -40], t: ['AMZN', 'IV 30.0%'] },
        { at: [102, 0, 8], t: ['DELL', 'IV 140.8%'] },
        { at: [84, 0, 56], t: ['MSFT', 'IV 32%'] },
      ];
      const rays = targets.map(x => line([origin, [x.at[0], 2, x.at[2]]], { tier: 'support', nodes: 'circle', nodeSize: 3.4, nodeAt: [1] }));
      const plate = box(34, 34, 2, [origin[0], 0, origin[2]], { tier: 'subject', round: 3, name: 'Strike' });
      plate.decal = { kind: 'strike', text: '', paths: [], source: 'Strike logo', x: 0, y: 0, size: 22, rotation: 0, mode: 'fill', color: C.emerald, width: null, opacity: 1 };
      const labels = targets.flatMap(x => ticker(x.t[0], x.t[1], [x.at[0] + 5, 2, x.at[2] - 3], { size: 4.2 }));
      return figure('Every market', [plate], labels, { flat: true, lines: rays });
    },
    loop: (sc, t) => {
      lines(sc).forEach((l, i, all) => {
        const k = 1 - 0.85 * bump(t, (i / all.length) * 0.45, (i / all.length) * 0.45 + 0.5);
        const [a, b] = l.points;
        if (a && b) l.points = [a, [a[0] + (b[0] - a[0]) * k, b[1], a[2] + (b[2] - a[2]) * k]];
      });
    },
  },
  {
    id: 'globe',
    title: 'Globe',
    tags: ['globe', 'world', 'global', '24/7', 'everywhere', 'brand'],
    make: () => {
      const R = 76;
      const meridians = [0, 45, 90, 135].map(yaw => ring([0, 0, 0], R, { tier: 'support', rot: [90, yaw, 0] }));
      const latitudes = [-0.5, 0.5].map(s => ring([0, R * s, 0], R * Math.sqrt(1 - s * s), { tier: 'ghost' }));
      const equator = ring([0, 0, 0], R, { tier: 'subject', nodes: 'circle', nodeSize: 5, nodeAt: [0.5, 0], color: C.line });
      return figure('Globe', [], [], { lines: [...latitudes, ...meridians, equator], pitch: 18 });
    },
    loop: (sc, t) => {
      lines(sc).forEach(l => {
        if (Math.abs(l.rotation[0] - 90) < 1e-6) l.rotation = [l.rotation[0], l.rotation[1] + 45 * inout(t), l.rotation[2]];
        if (l.nodes !== 'none') l.nodeAt = l.nodeAt.map(f => f + 0.125 * inout(t));
      });
    },
  },
  {
    id: 'circles',
    title: 'Circles',
    tags: ['circles', 'motion', 'focus', 'composition', 'cluster', 'brand'],
    /* the motion system's composition: five touching circles; one grows into focus */
    make: () => circleScene('flat', 'focus'),
    loop: circlesLoop,
  },
];
