/* Options trading: payoffs, strikes, expiries, greeks and the 24/7 book. */
import type { SceneObject } from '../model/types';
import { arrowPoints, beam, box, C, chevron, cyl, dots, figure, label, onFront, onTop, poly, sample, shape, wall, type V } from './kit';
import type { Entry } from './index';

const base = (w: number, d: number, at: V = [0, -3, 0], h = 3) => box(w, d, h, at, { tier: 'ghost', round: 2, name: 'Base' });

/** A payoff as a standing wall: profit (above zero) in emerald dots, loss in grey. */
function payoff(name: string, pnl: (x: number) => number, opts: { width?: number; scale?: number; strikes?: number[] } = {}) {
  const W = opts.width ?? 190;
  const k = opts.scale ?? 1;
  const pts = sample(pnl, 48);
  const lo = Math.min(...pts.map(p => p[1]));
  const hi = Math.max(...pts.map(p => p[1]));
  const prof: [number, number][] = [[0, 0], ...pts.map(([x, y]): [number, number] => [x * W, (y - lo) * k + 6]), [W, 0]];
  const zero = ((0 - lo) * k + 6) / ((hi - lo) * k + 6);
  const w = wall(prof, 16, [-W / 2, 0, 0], { name, shadow: 8, round: 0.6 });
  onFront(
    w,
    dots({
      spacing: 3.2,
      size: 0.8,
      inset: 2,
      mask: { mode: 'above', points: [[0, zero], [1, zero]], alt: C.grey, altOpacity: 0.22 },
    }),
  );
  const out: SceneObject[] = [base(W + 24, 44), w];
  for (const s of opts.strikes ?? []) out.push(box(1.6, 26, (0 - lo) * k + 26, [-W / 2 + s * W, 0, -18], { tier: 'ghost', round: 0.3, name: 'Strike' }));
  /* where profit starts */
  let be = -1;
  for (let i = 1; i < pts.length; i++) if ((pts[i - 1]![1] < 0) !== (pts[i]![1] < 0)) be = pts[i]![0];
  const labels = be >= 0 ? [label('BREAKEVEN', [-W / 2 + be * W, ((0 - lo) * k + 6) + 16, 12])] : [];
  return { out, labels };
}

export const OPTIONS: Entry[] = [
  {
    id: 'long-call',
    title: 'Long call',
    tags: ['payoff', 'call', 'bullish', 'hockey stick'],
    make: () => {
      const { out, labels } = payoff('Long call', x => (x < 0.45 ? -12 : -12 + (x - 0.45) * 160), { strikes: [0.45] });
      return figure('Long call', out, labels);
    },
  },
  {
    id: 'long-put',
    title: 'Long put',
    tags: ['payoff', 'put', 'bearish', 'hedge'],
    make: () => {
      const { out, labels } = payoff('Long put', x => (x > 0.55 ? -12 : -12 + (0.55 - x) * 160), { strikes: [0.55] });
      return figure('Long put', out, labels);
    },
  },
  {
    id: 'straddle',
    title: 'Straddle',
    tags: ['payoff', 'volatility', 'straddle', 'v shape'],
    make: () => {
      const { out } = payoff('Straddle', x => -16 + Math.abs(x - 0.5) * 150, { strikes: [0.5] });
      return figure('Straddle', out, [label('MOVE EITHER WAY', [0, 96, 12])]);
    },
  },
  {
    id: 'iron-condor',
    title: 'Iron condor',
    tags: ['payoff', 'condor', 'range', 'income'],
    make: () => {
      const f = (x: number) => (x < 0.18 ? -22 : x < 0.34 ? -22 + ((x - 0.18) / 0.16) * 38 : x < 0.66 ? 16 : x < 0.82 ? 16 - ((x - 0.66) / 0.16) * 38 : -22);
      const { out } = payoff('Iron condor', f, { width: 210 });
      return figure('Iron condor', out);
    },
  },
  {
    id: 'butterfly',
    title: 'Butterfly',
    tags: ['payoff', 'butterfly', 'pin', 'target'],
    make: () => {
      const f = (x: number) => (x < 0.3 || x > 0.7 ? -10 : -10 + (0.2 - Math.abs(x - 0.5)) * 300);
      const { out } = payoff('Butterfly', f, {});
      return figure('Butterfly', out);
    },
  },
  {
    id: 'strike-ladder',
    title: 'Strike ladder',
    tags: ['strikes', 'ladder', 'select', 'chain'],
    make: () => {
      const out: SceneObject[] = [box(8, 8, 120, [0, 0, -30], { tier: 'ghost', name: 'Spine' })];
      for (let i = 0; i < 9; i++) {
        const pick = i === 4;
        const o = box(96, 34, 3, [0, 6 + i * 12.5, pick ? 22 : 0], { tier: pick ? 'subject' : i === 3 || i === 5 ? 'support' : 'ghost', shadow: pick ? 10 : 3, name: `Strike ${i + 1}` });
        if (pick) onTop(o, dots({ spacing: 3, size: 0.75, inset: 3 }));
        out.push(o);
      }
      return figure('Strike ladder', out, [label('382.5', [62, 62, 30], { align: 'start' })]);
    },
  },
  {
    id: 'option-chain',
    title: 'Option chain',
    tags: ['chain', 'calls', 'puts', 'order book'],
    make: () => {
      const out: SceneObject[] = [box(6, 132, 10, [0, 0, 0], { tier: 'support', name: 'Spine' })];
      for (let j = 0; j < 9; j++) {
        const z = (j - 4) * 14.5;
        const call = 26 + 62 * (j / 8);
        const put = 26 + 62 * (1 - j / 8);
        const atm = j === 4;
        const c = box(call, 9, 10, [-3 - call / 2 - 2, 0, z], { tier: atm ? 'subject' : 'support', round: 1, name: `Call ${j + 1}` });
        const p = box(put, 9, 10, [3 + put / 2 + 2, 0, z], { tier: 'ghost', round: 1, name: `Put ${j + 1}` });
        if (atm) onTop(c, dots({ spacing: 2.4, size: 0.6, inset: 1.2 }));
        out.push(c, p);
      }
      return figure('Option chain', out, [label('CALLS', [-60, 0.2, 80], { plane: 'ground', size: 4.5 }), label('PUTS', [60, 0.2, 80], { plane: 'ground', size: 4.5 })]);
    },
  },
  {
    id: 'expiry',
    title: 'Expiry calendar',
    tags: ['expiry', 'calendar', 'date', 'daily'],
    make: () => {
      const out: SceneObject[] = [];
      for (let c = 0; c < 7; c++)
        for (let r = 0; r < 4; r++) {
          const pick = c === 4 && r === 2;
          const o = box(22, 22, 4, [(c - 3) * 26, pick ? 18 : 0, (r - 1.5) * 26], { tier: pick ? 'subject' : r < 2 || (r === 2 && c < 4) ? 'ghost' : 'support', shadow: pick ? 8 : 0, guides: pick, name: `Day ${r * 7 + c + 1}` });
          if (pick) onTop(o, dots({ spacing: 2.6, size: 0.65, inset: 2 }));
          out.push(o);
        }
      return figure('Expiry calendar', out, [label('20:00 ET', [26, 40, 13])]);
    },
  },
  {
    id: 'always-open',
    title: 'Always open',
    tags: ['24/7', 'clock', 'never closes', 'hours'],
    make: () => {
      const dial = cyl(72, 10, [0, 0, 0], { name: 'Dial' });
      dial.decal = { kind: 'text', text: '24/7', paths: [], source: '24/7', x: 22, y: 22, size: 7, rotation: -45, mode: 'fill', color: C.emerald, width: null, opacity: 1 };
      const out: SceneObject[] = [dial];
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        const major = i % 6 === 0;
        const r0 = major ? 50 : 56;
        out.push(beam([Math.cos(a) * r0, Math.sin(a) * r0], [Math.cos(a) * 64, Math.sin(a) * 64], 10, major ? 2.6 : 1.6, { tier: major ? 'support' : 'ghost', name: `Hour ${i}` }));
      }
      out.push(beam([0, 0], [-24, -30], 10, 4, { name: 'Hour hand' }), beam([0, 0], [40, -16], 10, 2.6, { name: 'Minute hand' }));
      const knob = cyl(5, 6, [0, 10, 0], { name: 'Pin' });
      onTop(knob, dots({ spacing: 1.6, size: 0.45, inset: 0.4 }));
      out.push(knob);
      return figure('Always open', out);
    },
  },
  {
    id: 'theta',
    title: 'Time decay',
    tags: ['theta', 'decay', 'time value'],
    make: () => {
      const out: SceneObject[] = [base(200, 54)];
      for (let i = 0; i < 10; i++) {
        const h = 4 + 84 * Math.exp(-0.34 * i);
        const o = box(14, 40, h, [-81 + i * 18, 0, 0], { tier: i < 3 ? 'subject' : i < 6 ? 'support' : 'ghost', name: `Day ${i + 1}` });
        onTop(o, dots({ spacing: 2.6, size: 0.6, inset: 2, opacity: Math.max(0.12, 1 - i * 0.13) }));
        out.push(o);
      }
      return figure('Time decay', out, [label('THETA', [-81, 100, 0])]);
    },
  },
  {
    id: 'greeks',
    title: 'The greeks',
    tags: ['greeks', 'delta', 'gamma', 'theta', 'vega', 'risk'],
    make: () => {
      const names = ['DELTA', 'GAMMA', 'VEGA', 'THETA'];
      const out = names.map((n, i) => {
        const x = (i % 2) * 58 - 29;
        const z = Math.floor(i / 2) * 58 - 29;
        const o = box(48, 48, i === 0 ? 46 : 30, [x, 0, z], { tier: i === 0 ? 'subject' : 'support', name: n });
        o.decal = { kind: 'text', text: n, paths: [], source: n, x: 0, y: 0, size: 5, rotation: -45, mode: 'fill', color: i === 0 ? C.emerald : C.mid, width: null, opacity: 1 };
        return o;
      });
      return figure('The greeks', [base(140, 140, [0, -3, 0]), ...out]);
    },
  },
  {
    id: 'vertical-spread',
    title: 'Vertical spread',
    tags: ['spread', 'call spread', 'defined risk'],
    make: () => {
      const low = box(30, 34, 30, [-62, 0, 0], { tier: 'support', name: 'Long leg' });
      const high = box(30, 34, 72, [62, 0, 0], { tier: 'support', name: 'Short leg' });
      const ramp = wall(
        [
          [0, 0],
          [94, 0],
          [94, 72],
          [0, 30],
        ],
        34,
        [-47, 0, 0],
        { name: 'Spread', round: 0.6 },
      );
      onFront(ramp, dots({ spacing: 3, size: 0.8, inset: 2.5, gradient: { type: 'linear', angle: 0, start: 0, end: 1 } }));
      return figure('Vertical spread', [base(176, 52), low, ramp, high], [label('MAX GAIN', [62, 90, 0]), label('MAX LOSS', [-62, 48, 0])]);
    },
  },
  {
    id: 'vol-smile',
    title: 'Volatility smile',
    tags: ['smile', 'skew', 'implied volatility'],
    make: () => {
      const f = (x: number) => 22 + 92 * (x - 0.5) ** 2 * 4 * (x < 0.5 ? 1.15 : 0.85);
      const prof: [number, number][] = [[0, 0], ...sample(f, 30).map(([x, y]): [number, number] => [x * 200, y]), [200, 0]];
      const smile = wall(prof, 12, [-100, 0, 0], { name: 'Smile', shadow: 8, round: 0.6 });
      onFront(smile, dots({ spacing: 3, size: 0.85, inset: 2, gradient: { type: 'radial', cx: 0.5, cy: 0, radius: 0.9 } }));
      const out: SceneObject[] = [base(214, 44), smile];
      for (let i = 0; i <= 10; i++) out.push(box(1.4, 18, 8, [-100 + i * 20, 0, -16], { tier: 'ghost', round: 0.3, name: `Strike ${i + 1}` }));
      return figure('Volatility smile', out, [label('ATM', [0, 36, 18])]);
    },
  },
  {
    id: 'premium',
    title: 'Premium',
    tags: ['premium', 'vault', 'coins', 'collateral'],
    make: () => {
      const vault = box(92, 92, 56, [-30, 0, -10], { tier: 'support', name: 'Vault' });
      const lid = box(96, 96, 9, [-30, 74, -10], { name: 'Lid', shadow: 10, guides: true });
      const out: SceneObject[] = [vault, lid];
      for (let i = 0; i < 6; i++) {
        const coin = cyl(14, 3.4, [54, i * 5, 40], { tier: i === 5 ? 'subject' : 'support', name: `Coin ${i + 1}` });
        if (i === 5) onTop(coin, dots({ spacing: 2.2, size: 0.55, inset: 1.4 }));
        out.push(coin);
      }
      return figure('Premium', out);
    },
  },
  {
    id: 'every-market',
    title: 'Every market',
    tags: ['markets', 'stocks', 'crypto', 'compute', 'indices', 'one venue'],
    make: () => {
      const plate = base(236, 74, [0, -4, 0], 4);
      const out: SceneObject[] = [
        plate,
        cyl(20, 40, [-84, 0, 0], { tier: 'support', name: 'Crypto' }),
        box(38, 38, 58, [-30, 0, 0], { tier: 'support', name: 'Stocks' }),
        poly(6, 23, 46, [26, 0, 0], { tier: 'support', name: 'Compute' }),
      ];
      [0, 1, 2].forEach(k => {
        const c = chevron(54, 28, 6, [84, k * 13, 0], { tier: k === 2 ? 'subject' : 'support', shadow: k ? 5 : 0, name: `Index ${k + 1}` });
        if (k === 2) onTop(c, dots({ spacing: 2.4, size: 0.55, inset: 1.6 }));
        out.push(c);
      });
      return figure('Every market', out);
    },
  },
  {
    id: 'settlement',
    title: 'Cash settlement',
    tags: ['settlement', 'cash', 'usdc', 'payout'],
    make: () => {
      const out: SceneObject[] = [];
      for (let i = 0; i < 5; i++) out.push(cyl(22, 4.5, [-84, i * 6, 0], { tier: 'support', name: `Collateral ${i + 1}` }));
      for (let i = 0; i < 3; i++) {
        const c = cyl(22, 4.5, [84, i * 6, 0], { tier: i === 2 ? 'subject' : 'support', name: `Payout ${i + 1}` });
        if (i === 2) c.decal = { kind: 'text', text: 'USDC', paths: [], source: 'USDC', x: 0, y: 0, size: 4.5, rotation: -45, mode: 'fill', color: C.mid, width: null, opacity: 1 };
        out.push(c);
      }
      const arrow = shape(arrowPoints(96, 18, 44, 34), 5, [0, 0, 0], { name: 'Settle', round: 1 });
      onTop(arrow, dots({ spacing: 2.8, size: 0.7, inset: 2.4, gradient: { type: 'linear', angle: 0, start: 0, end: 1 } }));
      out.push(arrow);
      return figure('Cash settlement', out);
    },
  },
  {
    id: 'leverage',
    title: 'Leverage',
    tags: ['leverage', 'lever', 'multiplier', 'exposure'],
    make: () => {
      const tilt = -7;
      const lift = (x: number) => 30 + Math.sin((tilt * Math.PI) / 180) * x;
      const fulcrum = wall(
        [
          [-20, 0],
          [20, 0],
          [0, 26],
        ],
        30,
        [0, 0, 0],
        { tier: 'support', name: 'Fulcrum', round: 0.6 },
      );
      const lever = box(220, 18, 4, [0, 26, 0], { name: 'Lever', rot: [0, 0, tilt] });
      const small = box(16, 16, 16, [-92, lift(-92) + 1, 0], { name: 'Margin', rot: [0, 0, tilt], shadow: 4 });
      onTop(small, dots({ spacing: 2.2, size: 0.55, inset: 1.4 }));
      const big = box(46, 46, 46, [86, lift(86) - 3, 0], { tier: 'support', name: 'Exposure', rot: [0, 0, tilt] });
      return figure('Leverage', [base(240, 50), fulcrum, lever, small, big], [label('18×', [-92, 76, 0], { size: 6, color: C.line })]);
    },
  },
];
