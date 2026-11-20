/* Each library illustration's own loop (see src/anim). One idea moves at a
   time, calmly, and the loop comes back to the figure as drawn. Loops find
   things by name and change them relatively, so they keep working on a
   figure someone has edited (missing things are skipped). */
import type { Loop } from '../anim/motion';
import { allDots, bump, dotsOf, envelope, fade, grow, inout, move, named, nums, one, orbit, spin, sweep, swing, turn } from '../anim/kit';
import type { SceneObject } from '../model/types';

/** Things rise one after another and settle back. */
const ripple = (list: SceneObject[], t: number, lift: number, spread = 0.5, width = 0.42) =>
  list.forEach((o, i) => move(o, [0, lift, 0], bump(t, (i / Math.max(1, list.length)) * spread + 0.04, (i / Math.max(1, list.length)) * spread + 0.04 + width)));

/** Heights dip one after another and recover. */
const breathe = (list: SceneObject[], t: number, depth: number, spread = 0.5, width = 0.42) =>
  list.forEach((o, i) => grow(o, 1 - depth * bump(t, (i / Math.max(1, list.length)) * spread + 0.04, (i / Math.max(1, list.length)) * spread + 0.04 + width)));

/** Light passes across every dotted face. */
const shine = (sc: Parameters<Loop>[0], t: number, amount = 0.65) => allDots(sc, d => (d.sweep = { phase: inout(t), amount: amount * envelope(t) }));

/** Light passes across each object's dots in turn. */
const shineEach = (list: SceneObject[], t: number, amount = 0.7) => list.forEach((o, i) => sweep(o, t, amount, i / Math.max(1, list.length)));

export const LOOPS: Record<string, Loop> = {
  /* ---- data ---- */
  bars: (sc, t) => breathe(named(sc, 'Bar'), t, 0.35),
  'stacked-bars': (sc, t) => ripple(named(sc, 'Column').filter(o => nums(o.name)[1] === 3), t, 7),
  candles: (sc, t) => {
    const wave = (o: SceneObject, i: number) => move(o, [0, 5, 0], bump(t, (i / 11) * 0.55 + 0.03, (i / 11) * 0.55 + 0.43));
    named(sc, 'Candle').forEach(wave);
    named(sc, 'Wick').forEach(wave);
  },
  'heat-grid': (sc, t) => named(sc, 'Cell').forEach(o => {
    const [r = 0, c = 0] = nums(o.name);
    sweep(o, t, 0.75, (r + c) / 14);
  }),
  'vol-surface': (sc, t) => named(sc, 'Strike').forEach(o => {
    const [i = 0, j = 0] = nums(o.name);
    grow(o, 1 + 0.14 * swing(t, (i + j) / 16));
  }),
  depth: (sc, t) => {
    grow(one(sc, 'Bids'), 1 - 0.22 * bump(t, 0.05, 0.55));
    grow(one(sc, 'Asks'), 1 - 0.22 * bump(t, 0.45, 0.95));
    shine(sc, t, 0.5);
  },
  area: (sc, t) => sweep(one(sc, 'This period'), t, 0.7),
  'line-ribbon': (sc, t) => {
    sweep(one(sc, 'Backdrop'), t, 0.6);
    move(one(sc, 'Last price'), [0, 6, 0], bump(t, 0.1, 0.9));
  },
  pie: (sc, t) => {
    const s = one(sc, 'Slice 1');
    if (s?.shape.kind !== 'sector') return;
    const m = ((s.shape.start + s.shape.sweep / 2) * Math.PI) / 180;
    const r = (s.rotation[1] * Math.PI) / 180;
    const [x, z] = [Math.cos(m), Math.sin(m)];
    move(s, [Math.cos(r) * x + Math.sin(r) * z, 0, -Math.sin(r) * x + Math.cos(r) * z], 9 * bump(t, 0.05, 0.95));
  },
  histogram: (sc, t) => {
    const bins = named(sc, 'Bin');
    const mid = (bins.length - 1) / 2;
    bins.forEach((o, i) => grow(o, 1 - 0.3 * bump(t, 0.05 + (Math.abs(i - mid) / bins.length) * 0.8, 0.5 + (Math.abs(i - mid) / bins.length) * 0.8)));
  },
  scatter: (sc, t) => ripple(named(sc, 'Point'), t, 6, 0.55, 0.4),
  waterfall: (sc, t) => {
    ripple(named(sc, 'Step'), t, 5, 0.4, 0.4);
    grow(one(sc, 'Net'), 1 - 0.25 * bump(t, 0.45, 0.95));
  },
  'payoff-panel': (sc, t) => sweep(one(sc, 'Panel'), t, 0.7),
  gauge: (sc, t) => named(sc, 'Step').forEach((o, i) => {
    const k = 1 - 0.75 * bump(t, i * 0.07, i * 0.07 + 0.36);
    for (const d of dotsOf(o)) d.opacity *= k;
  }),
  tiles: (sc, t) => ripple(named(sc, 'Tile'), t, 6, 0.5, 0.45),
  versus: (sc, t) => {
    grow(one(sc, 'A'), 1 + 0.16 * bump(t, 0.02, 0.5));
    grow(one(sc, 'B'), 1 + 0.16 * bump(t, 0.5, 0.98));
  },
  treemap: (sc, t) => ripple(named(sc, 'Block'), t, 5, 0.55, 0.4),

  /* ---- options ---- */
  'long-call': (sc, t) => {
    sweep(one(sc, 'Long call'), t, 0.7);
    move(one(sc, 'Strike'), [0, 4, 0], bump(t, 0.1, 0.9));
  },
  'long-put': (sc, t) => {
    sweep(one(sc, 'Long put'), t, 0.7);
    move(one(sc, 'Strike'), [0, 4, 0], bump(t, 0.1, 0.9));
  },
  straddle: (sc, t) => {
    sweep(one(sc, 'Straddle'), t, 0.7);
    move(one(sc, 'Strike'), [0, 4, 0], bump(t, 0.1, 0.9));
  },
  'iron-condor': (sc, t) => sweep(one(sc, 'Iron condor'), t, 0.7),
  butterfly: (sc, t) => sweep(one(sc, 'Butterfly'), t, 0.7),
  'strike-ladder': (sc, t) => ripple(named(sc, 'Strike'), t, 5, 0.55, 0.4),
  'option-chain': (sc, t) => {
    ripple(named(sc, 'Call'), t, 4, 0.55, 0.4);
    ripple(named(sc, 'Put'), t, 4, 0.5, 0.45);
  },
  expiry: (sc, t) => ripple(named(sc, 'Day'), t, 4, 0.6, 0.3),
  'always-open': (sc, t) => {
    const pin = one(sc, 'Pin');
    orbit(one(sc, 'Minute hand'), -turn(t, 360), pin ? [pin.position[0], 0, pin.position[2]] : [0, 0, 0]);
  },
  theta: (sc, t) => breathe(named(sc, 'Day'), t, 0.3, 0.55, 0.4),
  greeks: (sc, t) => ripple(['DELTA', 'GAMMA', 'VEGA', 'THETA'].map(n => one(sc, n)).filter((o): o is SceneObject => !!o), t, 6, 0.5, 0.42),
  'vertical-spread': (sc, t) => {
    sweep(one(sc, 'Spread'), t, 0.7);
    move(one(sc, 'Long leg'), [0, 4, 0], bump(t, 0.05, 0.5));
    move(one(sc, 'Short leg'), [0, 4, 0], bump(t, 0.5, 0.95));
  },
  'vol-smile': (sc, t) => {
    sweep(one(sc, 'Smile'), t, 0.7);
    ripple(named(sc, 'Strike'), t, 3, 0.55, 0.4);
  },
  premium: (sc, t) => ripple(named(sc, 'Coin'), t, 5, 0.5, 0.4),
  'every-market': (sc, t) => ripple(['Crypto', 'Stocks', 'Compute', 'Index 1', 'Index 2', 'Index 3'].map(n => one(sc, n)).filter((o): o is SceneObject => !!o), t, 6, 0.55, 0.4),
  settlement: (sc, t) => {
    ripple(named(sc, 'Payout'), t, 6, 0.4, 0.45);
    sweep(one(sc, 'Settle'), t, 0.6);
  },
  leverage: (sc, t) => {
    move(one(sc, 'Exposure'), [0, 10, 0], bump(t, 0.05, 0.95));
    move(one(sc, 'Margin'), [0, -2, 0], bump(t, 0.05, 0.95));
  },

  /* ---- tech ---- */
  servers: (sc, t) => shineEach(named(sc, 'Unit'), t),
  gpu: (sc, t) => sweep(one(sc, 'Die'), t, 0.75),
  network: (sc, t) => {
    breathe(named(sc, 'Node'), t, 0.25, 0.55, 0.4);
    sweep(one(sc, 'Engine'), t, 0.6);
  },
  database: (sc, t) => named(sc, 'Shard').forEach((o, i) => move(o, [0, 6 * i, 0], bump(t, 0.05, 0.95))),
  layers: (sc, t) => ['LEDGER', 'ENGINE', 'API'].forEach((n, i) => move(one(sc, n), [0, 7 * i, 0], bump(t, 0.05, 0.95))),
  vault: (sc, t) => {
    for (const d of dotsOf(one(sc, 'Dial') ?? ({ faces: { top: {}, bottom: {}, sides: {} } } as unknown as SceneObject))) d.angle += 90 * t;
    sweep(one(sc, 'Vault'), t, 0.5);
  },
  blocks: (sc, t) => ripple(named(sc, 'Block'), t, 5, 0.5, 0.42),
  wallet: (sc, t) => {
    move(one(sc, 'Card'), [0, 7, 0], bump(t, 0.05, 0.95));
    move(one(sc, 'Chip'), [0, 7, 0], bump(t, 0.05, 0.95));
  },
  terminal: (sc, t) => sweep(one(sc, 'Screen'), t, 0.7),
  phone: (sc, t) => {
    sweep(one(sc, 'Phone'), t, 0.6);
    move(one(sc, 'Phone'), [0, 4, 0], bump(t, 0.05, 0.95));
  },
  gears: (sc, t) => {
    const g = one(sc, 'Gear');
    const teeth = g?.shape.kind === 'outline' ? Math.max(1, Math.round(g.shape.points.length / 4)) : 12;
    spin(g, turn(t, 360 / teeth));
    sweep(one(sc, 'Engine'), t, 0.5);
  },
  latency: (sc, t) => {
    named(sc, 'Trail').forEach((o, i) => fade(o, 1 - 0.8 * bump(t, i * 0.09, i * 0.09 + 0.45)));
    move(one(sc, 'Arrow'), [0, 5, 0], bump(t, 0.1, 0.9));
  },
  pipeline: (sc, t) => shineEach(named(sc, 'Stage'), t),
  modules: (sc, t) => shine(sc, t, 0.6),
  'time-zones': (sc, t) => {
    const pins = sc.objects.filter(o => o.name === 'Pin');
    sc.objects.filter(o => o.name === 'Minute hand').forEach((h, i) => {
      const p = pins[i];
      orbit(h, -turn(t, 360), p ? [p.position[0], 0, p.position[2]] : [0, 0, 0]);
    });
  },
  cubes: (sc, t) => named(sc, 'Node').forEach(o => {
    const s = String(nums(o.name)[0] ?? 0).split('').reduce((a, ch) => a + Number(ch), 0);
    move(o, [0, 4, 0], bump(t, 0.04 + s * 0.06, 0.44 + s * 0.06));
  }),
};
