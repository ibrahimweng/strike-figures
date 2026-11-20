/* Strike's motion system, drawn with circles (see skill/source/rules/illustration-motion.md).
   Two curves: shapes GATHER into a meeting point with an ease-in, then RELEASE from it
   with an ease-out, then rest. The meeting point of the focus move is the rest cluster:
   five equal circles, three over two, each touching its neighbours. */

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
const gather = bezier(EASE.gather);
const release = bezier(EASE.release);

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
