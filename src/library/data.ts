/* Data visualisation: seventeen charts built as solid line art. */
import type { SceneObject } from '../model/types';
import { bell, box, C, cyl, dots, figure, greyDots, label, onFront, onSides, onTop, rng, sample, sector, topCurve, wall, type V } from './kit';
import type { Entry } from './index';

const base = (w: number, d: number, at: V = [0, -3, 0], h = 3) => box(w, d, h, at, { tier: 'ghost', round: 2, name: 'Base' });

export const DATA: Entry[] = [
  {
    id: 'bars',
    title: 'Bar chart',
    tags: ['bars', 'growth', 'columns'],
    make: () => {
      const hs = [22, 34, 28, 50, 46, 70, 98];
      const bars = hs.map((h, i) => {
        const last = i === hs.length - 1;
        const o = box(18, 18, h, [-78 + i * 26, 0, 0], { tier: last ? 'subject' : 'support', name: `Bar ${i + 1}` });
        if (last) onTop(o, dots({ spacing: 3, size: 0.8 }));
        return o;
      });
      return figure('Bar chart', [base(196, 42), ...bars], [label('+18.4%', [78, 112, 0])]);
    },
  },
  {
    id: 'stacked-bars',
    title: 'Stacked bars',
    tags: ['bars', 'stacked', 'composition'],
    make: () => {
      const cols = [
        [18, 14, 10],
        [24, 18, 16],
        [20, 26, 20],
        [30, 22, 28],
        [34, 30, 40],
      ];
      const out: SceneObject[] = [base(170, 46)];
      cols.forEach((segs, i) => {
        let y = 0;
        segs.forEach((h, k) => {
          const top = k === segs.length - 1;
          const o = box(22, 22, h, [-64 + i * 32, y, 0], {
            tier: top ? 'subject' : k === 0 ? 'ghost' : 'support',
            shadow: k > 0 ? 6 : 0,
            name: `Column ${i + 1} · ${k + 1}`,
          });
          if (top && i === cols.length - 1) onTop(o, dots({ spacing: 3, size: 0.75 }));
          out.push(o);
          y += h + 5;
        });
      });
      return figure('Stacked bars', out);
    },
  },
  {
    id: 'candles',
    title: 'Candlesticks',
    tags: ['candles', 'price', 'ohlc', 'chart'],
    make: () => {
      const r = rng(11);
      const out: SceneObject[] = [base(200, 44, [0, -3, 0])];
      let price = 34;
      for (let i = 0; i < 11; i++) {
        const open = price;
        price = Math.max(16, price + (r() - 0.36) * 30);
        const close = price;
        const lo = (Math.min(open, close) - 5 - r() * 9) * 1.9;
        const hi = (Math.max(open, close) + 5 + r() * 9) * 1.9;
        const x = -85 + i * 17;
        const up = close >= open;
        out.push(box(2.4, 2.4, hi - lo, [x, lo, 0], { tier: 'ghost', round: 0.4, name: `Wick ${i + 1}` }));
        const body = box(12, 12, Math.max(4, Math.abs(close - open) * 1.9), [x, Math.min(open, close) * 1.9, 0], {
          tier: up ? 'subject' : 'support',
          round: 1.2,
          shadow: 4,
          name: `Candle ${i + 1}`,
        });
        if (up) onSides(body, dots({ spacing: 2.4, size: 0.55, inset: 1.2 }));
        out.push(body);
      }
      return figure('Candlesticks', out);
    },
  },
  {
    id: 'heat-grid',
    title: 'Heat grid',
    tags: ['heatmap', 'matrix', 'columns', 'grid'],
    make: () => {
      const out: SceneObject[] = [];
      const n = 7;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const v = bell(i / (n - 1), 0.62, 0.28) * bell(j / (n - 1), 0.4, 0.3);
          const hot = v > 0.75;
          const o = box(15, 15, 6 + v * 54, [(i - 3) * 19, 0, (j - 3) * 19], { tier: hot ? 'subject' : v > 0.35 ? 'support' : 'ghost', name: `Cell ${i},${j}` });
          onTop(o, hot ? dots({ spacing: 2.6, size: 0.6, inset: 1.5 }) : greyDots({ spacing: 2.6, size: 0.55, inset: 1.5, opacity: 0.12 + v * 0.3 }));
          out.push(o);
        }
      return figure('Heat grid', out);
    },
  },
  {
    id: 'vol-surface',
    title: 'Volatility surface',
    tags: ['surface', 'implied volatility', 'smile', 'term structure'],
    make: () => {
      const out: SceneObject[] = [];
      const nx = 11;
      const nz = 6;
      for (let i = 0; i < nx; i++)
        for (let j = 0; j < nz; j++) {
          const k = (i - (nx - 1) / 2) / ((nx - 1) / 2);
          const v = 14 + 46 * k * k * (1 - j * 0.11) + 10 * (1 - j / (nz - 1));
          const atm = i === (nx - 1) / 2;
          const o = box(9, 9, v, [(i - (nx - 1) / 2) * 13, 0, (j - (nz - 1) / 2) * 13], { tier: atm ? 'subject' : 'support', round: 1, name: `Strike ${i} · ${j}` });
          if (atm) onTop(o, dots({ spacing: 2.2, size: 0.55, inset: 1.2 }));
          out.push(o);
        }
      return figure('Volatility surface', out);
    },
  },
  {
    id: 'depth',
    title: 'Order book depth',
    tags: ['depth', 'order book', 'bids', 'asks', 'liquidity'],
    make: () => {
      /* cumulative size, stepping up away from the middle */
      const steps = (dir: 1 | -1): [number, number][] => {
        const out: [number, number][] = [[0, 0]];
        let y = 8;
        for (let i = 0; i < 6; i++) {
          out.push([dir * i * 16, y]);
          out.push([dir * (i + 1) * 16, y]);
          y += 7 + i * 6;
        }
        out.push([dir * 6 * 16, 0]);
        return out;
      };
      const bids = wall(steps(-1), 22, [-5, 0, 0], { name: 'Bids', round: 0.6 });
      const asks = wall(steps(1), 22, [5, 0, 0], { name: 'Asks', tier: 'support', round: 0.6 });
      onFront(bids, dots({ spacing: 3, size: 0.75, inset: 2 }));
      onFront(asks, greyDots({ spacing: 3, size: 0.7, inset: 2 }));
      return figure('Order book depth', [base(220, 40), bids, asks], [label('SPREAD', [0, 40, 12])]);
    },
  },
  {
    id: 'area',
    title: 'Area chart',
    tags: ['area', 'trend', 'line'],
    make: () => {
      const f = (x: number) => 18 + 50 * x + 16 * Math.sin(x * 9) * (1 - x * 0.4);
      const prof: [number, number][] = [[0, 0], ...sample(x => f(x), 30).map(([x, y]): [number, number] => [x * 200, y]), [200, 0]];
      const ghostProf: [number, number][] = [[0, 0], ...sample(x => f(x) * 0.62 + 12, 30).map(([x, y]): [number, number] => [x * 200, y]), [200, 0]];
      const back = wall(ghostProf, 4, [-100, 0, -24], { tier: 'ghost', name: 'Last period' });
      const now = wall(prof, 8, [-100, 0, 0], { name: 'This period', shadow: 8 });
      onFront(now, dots({ spacing: 3, size: 0.85, min: 0.1, gradient: { type: 'linear', angle: 90, start: 0, end: 1, affects: 'both' }, inset: 2 }));
      return figure('Area chart', [base(214, 60, [0, -3, -10]), back, now]);
    },
  },
  {
    id: 'line-ribbon',
    title: 'Line chart',
    tags: ['line', 'price', 'ribbon', 'trend'],
    make: () => {
      const r = rng(4);
      const pts: [number, number][] = [];
      let y = 26;
      for (let i = 0; i <= 14; i++) {
        pts.push([i * 13.5, y]);
        y = Math.max(12, Math.min(104, y + (r() - 0.34) * 26));
      }
      const t = 3.2;
      const ribbon: [number, number][] = [...pts.map(([x, v]): [number, number] => [x, v + t / 2]), ...pts.slice().reverse().map(([x, v]): [number, number] => [x, v - t / 2])];
      const line = wall(ribbon, 8, [-94.5, 0, 6], { name: 'Line', shadow: 6, round: 0.4 });
      const board = wall(
        [
          [0, 0],
          [206, 0],
          [206, 118],
          [0, 118],
        ],
        3,
        [-103, 0, -10],
        { tier: 'ghost', name: 'Backdrop', round: 2 },
      );
      onFront(board, greyDots({ spacing: 7, size: 0.55, inset: 5, opacity: 0.22 }));
      const last = pts[pts.length - 1]!;
      const dot = cyl(4.5, 9, [-94.5 + last[0], last[1] - 4.5, 2], { name: 'Last price', rot: [90, 0, 0] });
      onTop(dot, dots({ spacing: 1.6, size: 0.45, inset: 0.5 }));
      return figure('Line chart', [base(216, 40), board, line, dot], [label('LAST', [-94.5 + last[0] + 14, last[1] + 12, 10], { align: 'start' })]);
    },
  },
  {
    id: 'pie',
    title: 'Pie chart',
    tags: ['pie', 'share', 'allocation'],
    make: () => {
      const shares = [0.34, 0.22, 0.18, 0.15, 0.11];
      let a = -90;
      const out: SceneObject[] = shares.map((s, i) => {
        const sweep = s * 360 - 2;
        const mid = ((a + sweep / 2) * Math.PI) / 180;
        const lift = i === 0 ? 16 : 0;
        const push = i === 0 ? 6 : 1.5;
        const o = sector(70, a, sweep, 14 - i * 1.5, [Math.cos(mid) * push, lift, Math.sin(mid) * push], {
          tier: i === 0 ? 'subject' : 'support',
          shadow: i === 0 ? 10 : 0,
          guides: i === 0,
          name: `Slice ${i + 1}`,
        });
        if (i === 0) onTop(o, dots({ spacing: 3, size: 0.8, inset: 3 }));
        a += s * 360;
        return o;
      });
      return figure('Pie chart', out, [label('34%', [30, 52, -40])]);
    },
  },
  {
    id: 'histogram',
    title: 'Distribution',
    tags: ['histogram', 'distribution', 'bell', 'returns'],
    make: () => {
      const n = 13;
      const out: SceneObject[] = [base(210, 34)];
      for (let i = 0; i < n; i++) {
        const v = bell(i / (n - 1), 0.5, 0.2);
        const mid = i === (n - 1) / 2;
        const o = box(12, 22, 6 + v * 92, [(i - (n - 1) / 2) * 15.5, 0, 0], { tier: mid ? 'subject' : v > 0.3 ? 'support' : 'ghost', name: `Bin ${i + 1}` });
        if (mid) onSides(o, dots({ spacing: 2.6, size: 0.6, inset: 1.5, gradient: { type: 'linear', angle: -90, start: 0, end: 1 } }), 's2');
        out.push(o);
      }
      return figure('Distribution', out, [label('MEAN', [0, 114, 0])]);
    },
  },
  {
    id: 'scatter',
    title: 'Scatter',
    tags: ['scatter', 'correlation', 'regression'],
    make: () => {
      const r = rng(23);
      const plate = base(150, 150, [0, 0, 0], 4);
      onTop(plate, greyDots({ spacing: 7, size: 0.5, inset: 5 }));
      const out: SceneObject[] = [plate];
      for (let i = 0; i < 15; i++) {
        const t = i / 14;
        const x = -56 + t * 112 + (r() - 0.5) * 26;
        const z = 56 - t * 112 + (r() - 0.5) * 26;
        const h = 10 + t * 62 + (r() - 0.5) * 16;
        const hot = t > 0.78;
        const o = cyl(5, h, [x, 4, z], { tier: hot ? 'subject' : 'support', name: `Point ${i + 1}` });
        if (hot) onTop(o, dots({ spacing: 1.8, size: 0.5, inset: 0.6 }));
        out.push(o);
      }
      return figure('Scatter', out, [label('R² 0.82', [70, 96, -60])]);
    },
  },
  {
    id: 'waterfall',
    title: 'Waterfall',
    tags: ['waterfall', 'bridge', 'profit and loss'],
    make: () => {
      const deltas = [40, 22, -16, 30, -12];
      const out: SceneObject[] = [base(196, 40)];
      let total = 0;
      deltas.forEach((d, i) => {
        const lo = d > 0 ? total : total + d;
        const o = box(20, 20, Math.abs(d), [-80 + i * 32, lo, 0], { tier: d > 0 ? 'support' : 'ghost', shadow: lo > 0 ? 6 : 0, guides: lo > 0, name: `Step ${i + 1}` });
        out.push(o);
        total += d;
      });
      const net = box(20, 20, total, [80, 0, 0], { name: 'Net' });
      onSides(net, dots({ spacing: 2.6, size: 0.65, inset: 1.6 }), 's2');
      onTop(net, dots({ spacing: 2.6, size: 0.65, inset: 1.6 }));
      out.push(net);
      return figure('Waterfall', out, [label('NET', [80, total + 16, 0])]);
    },
  },
  {
    id: 'payoff-panel',
    title: 'Dot-matrix chart',
    tags: ['dots', 'chart', 'panel', 'payoff', 'what if'],
    make: () => {
      const panel = box(170, 8, 104, [0, 0, 0], { name: 'Panel', round: 2 });
      const curve = sample(x => (x < 0.3 ? 0.12 : 0.12 + ((x - 0.3) / 0.7) ** 1.5 * 0.74), 30);
      onSides(
        panel,
        dots({ spacing: 3.4, size: 0.85, inset: 6, mask: { mode: 'below', points: curve, alt: C.grey, altOpacity: 0.12 } }),
        's2',
      );
      const stand = box(40, 30, 6, [0, -6, 0], { tier: 'support', name: 'Stand' });
      return figure('Dot-matrix chart', [stand, panel], [label('+$105.05', [58, 118, 4])]);
    },
  },
  {
    id: 'gauge',
    title: 'Gauge',
    tags: ['gauge', 'dial', 'meter', 'level'],
    make: () => {
      const out: SceneObject[] = [];
      const n = 9;
      for (let i = 0; i < n; i++) {
        const start = 135 + i * 30;
        const on = i < 6;
        const o = sector(72, start + 1, 28, 6 + i * 2.2, [0, 0, 0], { tier: on ? 'support' : 'ghost', name: `Step ${i + 1}` });
        if (on) onTop(o, dots({ spacing: 3, size: 0.7 * (0.5 + i / 12), inset: 3, opacity: 0.4 + i * 0.1 }));
        out.push(o);
      }
      const knob = cyl(18, 34, [0, 0, 0], { name: 'Knob', shadow: 8 });
      out.push(knob);
      return figure('Gauge', out, [label('72', [0, 52, 0], { size: 7, color: C.line })]);
    },
  },
  {
    id: 'tiles',
    title: 'Dashboard tiles',
    tags: ['dashboard', 'cards', 'sparkline', 'kpi'],
    make: () => {
      const curves = [
        (x: number) => 0.25 + 0.55 * x + 0.12 * Math.sin(x * 12),
        (x: number) => 0.55 + 0.25 * Math.sin(x * 7 + 1),
        (x: number) => 0.7 - 0.4 * x + 0.1 * Math.sin(x * 15),
      ];
      const out = curves.map((f, i) => {
        const top = i === 0;
        const o = box(110, 70, 5, [0, (2 - i) * 26, 0], { tier: top ? 'subject' : i === 1 ? 'support' : 'ghost', shadow: 10, guides: i < 2, name: `Tile ${i + 1}` });
        onTop(o, (top ? dots : greyDots)({ spacing: 3.2, size: 0.7, inset: 6, mask: topCurve(sample(f, 24)) }));
        return o;
      });
      return figure('Dashboard tiles', out);
    },
  },
  {
    id: 'versus',
    title: 'A versus B',
    tags: ['compare', 'versus', 'columns'],
    make: () => {
      const a = box(44, 44, 120, [-30, 0, 30], { name: 'A' });
      const b = box(44, 44, 78, [30, 0, -30], { tier: 'support', name: 'B' });
      onSides(a, dots({ spacing: 3, size: 0.8, inset: 3, gradient: { type: 'linear', angle: -90, start: 0, end: 1 } }));
      onSides(b, greyDots({ spacing: 3, size: 0.7, inset: 3 }));
      return figure('A versus B', [base(160, 160, [0, -3, 0]), a, b], [
        label('A', [-30, 0.2, 66], { plane: 'ground', size: 6, align: 'middle' }),
        label('B', [30, 0.2, 6], { plane: 'ground', size: 6, align: 'middle' }),
      ]);
    },
  },
  {
    id: 'treemap',
    title: 'Treemap',
    tags: ['treemap', 'allocation', 'blocks', 'share'],
    make: () => {
      const g = 3;
      const cells: [number, number, number, number, number][] = [
        [0, 0, 96, 70, 40],
        [96, 0, 64, 40, 26],
        [96, 40, 64, 30, 18],
        [0, 70, 56, 50, 22],
        [56, 70, 52, 50, 15],
        [108, 70, 52, 26, 10],
        [108, 96, 52, 24, 7],
      ];
      const out = cells.map(([x, z, w, d, h], i) => {
        const o = box(w - g, d - g, h, [x + w / 2 - 80, 0, z + d / 2 - 60], { tier: i === 0 ? 'subject' : i < 3 ? 'support' : 'ghost', name: `Block ${i + 1}` });
        if (i === 0) onTop(o, dots({ spacing: 3, size: 0.8, gradient: { type: 'radial', cx: 0.35, cy: 0.4, radius: 0.8 } }));
        return o;
      });
      return figure('Treemap', out);
    },
  },
];

