/* Strike's motion system (skill/source/rules/illustration-motion.md): every
   animation in the tool runs on it.
   Two curves: shapes GATHER into a meeting point with an ease-in, then RELEASE
   from it with an ease-out, then rest: 400 + 320 + 280 ms, a one-second beat.
   A move between two still states gathers into its midpoint and releases out
   of it (inout); a move out and back does that twice (pulse). The meeting point
   of the circles' focus move is the rest cluster: five equal circles, three
   over two, each touching its neighbours. */

/** [x, y, r] in units of the rest radius. */
export type Circle = [number, number, number];

export const EASE = {
  gather: [0.55, 0, 0.85, 0] as const,
  release: [0.15, 1, 0.6, 1] as const,
  standard: [0.2, 0, 0, 1] as const,
};
export const MS = { gather: 400, release: 320, rest: 280, pressIn: 240, pressOut: 200 };
export const css = (e: readonly number[]) => `cubic-bezier(${e.join(', ')})`;

/** A cubic-bezier easing as a function of t (0..1). */
export function bezier([x1, y1, x2, y2]: readonly number[]): (t: number) => number {
  const at = (a: number, b: number, s: number) => 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  return t => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 30; i++) {
      const s = (lo + hi) / 2;
      if (at(x1!, x2!, s) < t) lo = s;
      else hi = s;
    }
    return at(y1!, y2!, (lo + hi) / 2);
  };
}
export const gather = bezier(EASE.gather);
export const release = bezier(EASE.release);

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
/** Share of a move spent gathering (400 of 720 ms). */
const G = MS.gather / (MS.gather + MS.release);
/** Share of a beat spent resting (280 of 1000 ms). */
export const REST_SHARE = MS.rest / (MS.rest + MS.gather + MS.release);

/** A move between two still states: gather into the midpoint, release out of it. 0..1 → 0..1. */
export function inout(x: number): number {
  const u = clamp01(x);
  return u < G ? 0.5 * gather(u / G) : 0.5 + 0.5 * release((u - G) / (1 - G));
}

/** Out and back within [a, b]: 0 outside, 1 at the middle, each half an inout move. */
export function pulse(t: number, a: number, b: number): number {
  if (t <= a || t >= b) return 0;
  const u = (t - a) / (b - a);
  return u < 0.5 ? inout(u * 2) : 1 - inout((u - 0.5) * 2);
}

/** n beats over 0..1, each a rest then a move: a value stepping 0 → 1 in n eased steps. */
export function steps(t: number, n: number): number {
  const u = ((t % 1) + 1) % 1;
  const k = Math.min(n - 1, Math.floor(u * n));
  const f = u * n - k;
  return (k + (f < REST_SHARE ? 0 : inout((f - REST_SHARE) / (1 - REST_SHARE)))) / n;
}

/** A swing between +1 and −1, one eased move per quarter: 0 at the start and end. */
export function tri(t: number): number {
  const u = ((t % 1) + 1) % 1;
  const q = Math.floor(u * 4);
  const f = inout(u * 4 - q);
  return q === 0 ? f : q === 1 ? 1 - f : q === 2 ? -f : -1 + f;
}

const H = Math.sqrt(3) / 2;
/** Order: top left, top middle, top right, bottom left, bottom right. */
export const REST: Circle[] = [
  [-2, -H, 1],
  [0, -H, 1],
  [2, -H, 1],
  [-1, H, 1],
  [1, H, 1],
];
/* Focus on the top right circle: measured from the reference and still packed (every
   neighbour touching). The left focus is its mirror. */
export const FOCUS_RIGHT: Circle[] = [
  [-0.85, -0.04, 0.5],
  [0.47, -0.85, 1],
  [3.19, -2.34, 2],
  [0.04, 0.89, 0.72],
  [2.09, 0.77, 1.23],
];
const MIRROR = [2, 1, 0, 4, 3];
export const FOCUS_LEFT: Circle[] = MIRROR.map(i => {
  const [x, y, r] = FOCUS_RIGHT[i]!;
  return [-x, y, r];
});
export const PRESSED: Circle[] = REST.map(([x, y, r]) => [x * 0.45, y * 0.45, r]);

const mix = (a: Circle[], b: Circle[], k: number): Circle[] => a.map((c, i) => c.map((v, j) => v + (b[i]![j]! - v) * k) as Circle);

export type Move = 'focus' | 'press';

/** Length of one full cycle, in ms. */
export const CYCLE: Record<Move, number> = {
  /* focus left: rest, gather to the cluster, release to focus right; then back */
  focus: 2 * (MS.rest + MS.gather + MS.release),
  /* rest, squeeze in, back out */
  press: 1000,
};

/** The circles at time ms into the loop. */
export function circlesAt(move: Move, ms: number): Circle[] {
  const t = ((ms % CYCLE[move]) + CYCLE[move]) % CYCLE[move];
  if (move === 'press') {
    const rest = CYCLE.press - MS.pressIn - MS.pressOut;
    if (t < rest) return REST;
    if (t < rest + MS.pressIn) return mix(REST, PRESSED, gather((t - rest) / MS.pressIn));
    return mix(PRESSED, REST, release((t - rest - MS.pressIn) / MS.pressOut));
  }
  const half = MS.rest + MS.gather + MS.release;
  const [from, to] = t < half ? [FOCUS_LEFT, FOCUS_RIGHT] : [FOCUS_RIGHT, FOCUS_LEFT];
  const u = t % half;
  if (u < MS.rest) return from;
  if (u < MS.rest + MS.gather) return mix(from, REST, gather((u - MS.rest) / MS.gather));
  return mix(REST, to, release((u - MS.rest - MS.gather) / MS.release));
}

/** Where a curve is at time ms of a gather-then-release loop, for the curve diagrams. */
export function curveAt(which: 'gather' | 'release', ms: number) {
  const d = MS[which];
  const t = (ms % (d + 600)) / d;
  return Math.min(1, t);
}
