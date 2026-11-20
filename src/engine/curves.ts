/* Curves on the artboard: straight lines, and arcs of ellipses written in
   their conjugate form c + u·cos t + w·sin t, which is exactly what a circle
   in 3D becomes under an orthographic camera. They turn into SVG path data
   with real "A" arc commands, so exported files stay small and editable. */
import { type P2, EPS, add2, insideDepth, len2, mul2, sub2 } from './math';

export type Curve =
  | { kind: 'line'; a: P2; b: P2 }
  | { kind: 'arc'; c: P2; u: P2; w: P2; t0: number; t1: number };

export function curveAt(c: Curve, s: number): P2 {
  if (c.kind === 'line') return add2(c.a, mul2(sub2(c.b, c.a), s));
  const t = c.t0 + (c.t1 - c.t0) * s;
  return { x: c.c.x + c.u.x * Math.cos(t) + c.w.x * Math.sin(t), y: c.c.y + c.u.y * Math.cos(t) + c.w.y * Math.sin(t) };
}

export const curveStart = (c: Curve) => curveAt(c, 0);
export const curveEnd = (c: Curve) => curveAt(c, 1);

export function curveSub(c: Curve, s0: number, s1: number): Curve {
  if (c.kind === 'line') return { kind: 'line', a: curveAt(c, s0), b: curveAt(c, s1) };
  return { ...c, t0: c.t0 + (c.t1 - c.t0) * s0, t1: c.t0 + (c.t1 - c.t0) * s1 };
}

export function curveLength(c: Curve): number {
  if (c.kind === 'line') return len2(sub2(c.b, c.a));
  let l = 0;
  let prev = curveAt(c, 0);
  for (let i = 1; i <= 24; i++) {
    const p = curveAt(c, i / 24);
    l += len2(sub2(p, prev));
    prev = p;
  }
  return l;
}

export const reverseCurve = (c: Curve): Curve =>
  c.kind === 'line' ? { kind: 'line', a: c.b, b: c.a } : { ...c, t0: c.t1, t1: c.t0 };

/** An ellipse's radii and tilt (degrees) from two conjugate half-diameters. */
export function ellipseOf(u: P2, w: P2): { rx: number; ry: number; rot: number } {
  const a = u.x * u.x + w.x * w.x;
  const b = u.x * u.y + w.x * w.y;
  const c = u.y * u.y + w.y * w.y;
  const mid = (a + c) / 2;
  const half = Math.sqrt(((a - c) / 2) ** 2 + b * b);
  const l1 = mid + half;
  const l2 = Math.max(0, mid - half);
  const rot = (0.5 * Math.atan2(2 * b, a - c) * 180) / Math.PI;
  return { rx: Math.sqrt(l1), ry: Math.sqrt(l2), rot };
}

export const num = (v: number, places = 3) => {
  const f = 10 ** places;
  const r = Math.round(v * f) / f;
  return (Object.is(r, -0) ? 0 : r).toString();
};
const pt = (p: P2, places: number) => `${num(p.x, places)} ${num(p.y, places)}`;

/** The path commands that continue from a curve's start to its end (without the opening M). */
export function curveCommands(c: Curve, places = 3): string {
  if (c.kind === 'line') return `L${pt(c.b, places)}`;
  const { rx, ry, rot } = ellipseOf(c.u, c.w);
  const span = c.t1 - c.t0;
  if (Math.abs(span) < 1e-12) return '';
  /* an ellipse seen edge-on is a line that doubles back: draw it as one */
  if (rx < EPS || ry < rx * 1e-4) {
    let out = '';
    const n = Math.max(2, Math.ceil(Math.abs(span) / (Math.PI / 8)));
    for (let i = 1; i <= n; i++) out += `L${pt(curveAt(c, i / n), places)}`;
    return out;
  }
  const det = c.u.x * c.w.y - c.u.y * c.w.x;
  const sweep = span > 0 === det > 0 ? 1 : 0;
  const pieces = Math.max(1, Math.ceil(Math.abs(span) / (Math.PI * 0.9)));
  let out = '';
  for (let i = 1; i <= pieces; i++) {
    const p = curveAt(c, i / pieces);
    out += `A${num(rx, places)} ${num(ry, places)} ${num(rot, 2)} 0 ${sweep} ${pt(p, places)}`;
  }
  return out;
}

const close = (a: P2, b: P2) => Math.abs(a.x - b.x) < 1e-6 && Math.abs(a.y - b.y) < 1e-6;

/** Path data for a run of curves; a curve that starts where the last ended carries on the same subpath. */
export function curvesToPath(curves: Curve[], places = 3): string {
  let out = '';
  let at: P2 | null = null;
  for (const c of curves) {
    const s = curveStart(c);
    if (!at || !close(at, s)) out += `M${pt(s, places)}`;
    out += curveCommands(c, places);
    at = curveEnd(c);
  }
  return out;
}

/** A closed region: its boundary curves in order, joined end to start. */
export function regionToPath(curves: Curve[], places = 3): string {
  if (!curves.length) return '';
  return `${curvesToPath(curves, places)}Z`;
}

/** Chain loose curves into as few runs as possible, so a path draws without seams at its joins. */
export function chain(curves: Curve[]): Curve[] {
  const left = curves.slice();
  const out: Curve[] = [];
  while (left.length) {
    let run: Curve[] = [left.shift()!];
    let grew = true;
    while (grew) {
      grew = false;
      const head = curveStart(run[0]!);
      const tail = curveEnd(run[run.length - 1]!);
      for (let i = 0; i < left.length; i++) {
        const c = left[i]!;
        if (close(curveStart(c), tail)) run.push(c);
        else if (close(curveEnd(c), tail)) run.push(reverseCurve(c));
        else if (close(curveEnd(c), head)) run = [c, ...run];
        else if (close(curveStart(c), head)) run = [reverseCurve(c), ...run];
        else continue;
        left.splice(i, 1);
        grew = true;
        break;
      }
    }
    out.push(...run);
  }
  return out;
}

/** The parts of a curve outside a convex polygon. `shrink` keeps curves that only touch its edge. */
export function clipOutside(c: Curve, poly: P2[], shrink = 0.02): Curve[] {
  const inside = (s: number) => insideDepth(curveAt(c, s), poly) > shrink;
  const marks: number[] = [0];
  let prev = inside(0);
  const flags: boolean[] = [prev];
  const steps = c.kind === 'line' ? 32 : 48;
  for (let i = 1; i <= steps; i++) {
    const s = i / steps;
    const now = inside(s);
    if (now !== prev) {
      let lo = (i - 1) / steps;
      let hi = s;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        if (inside(mid) === prev) lo = mid;
        else hi = mid;
      }
      marks.push((lo + hi) / 2);
      flags.push(now);
      prev = now;
    }
  }
  marks.push(1);
  const out: Curve[] = [];
  for (let i = 0; i < flags.length; i++) {
    if (flags[i]) continue;
    const s0 = marks[i]!;
    const s1 = marks[i + 1]!;
    if (s1 - s0 > 1e-6) out.push(curveSub(c, s0, s1));
  }
  return out;
}

/** Split a chained list back into runs that join end to start. */
export function runs(curves: Curve[]): Curve[][] {
  const out: Curve[][] = [];
  for (const c of curves) {
    const last = out[out.length - 1];
    if (last && close(curveEnd(last[last.length - 1]!), curveStart(c))) last.push(c);
    else out.push([c]);
  }
  return out;
}

/** The parameter at which a curve has run a given length from its start. */
function atLength(c: Curve, want: number): number {
  if (c.kind === 'line') {
    const l = curveLength(c);
    return l < 1e-12 ? 0 : Math.min(1, want / l);
  }
  const n = 64;
  let acc = 0;
  let prev = curveAt(c, 0);
  for (let i = 1; i <= n; i++) {
    const p = curveAt(c, i / n);
    const step = len2(sub2(p, prev));
    if (acc + step >= want) return (i - 1 + (step < 1e-12 ? 0 : (want - acc) / step)) / n;
    acc += step;
    prev = p;
  }
  return 1;
}

/** Shorten a run by `a` at its start and `b` at its end (never by more than a third of it each). */
export function trimRun(run: Curve[], a: number, b: number): Curve[] {
  const total = run.reduce((s, c) => s + curveLength(c), 0);
  a = Math.min(a, total / 3);
  b = Math.min(b, total / 3);
  if (a <= 0 && b <= 0) return run;
  const out: Curve[] = [];
  let pos = 0;
  for (const c of run) {
    const l = curveLength(c);
    const s0 = Math.max(0, a - pos);
    const s1 = Math.min(l, total - b - pos);
    if (s1 - s0 > 1e-9) out.push(s0 <= 0 && s1 >= l ? c : curveSub(c, atLength(c, s0), atLength(c, s1)));
    pos += l;
  }
  return out;
}

/** Trim the free ends of runs: ends that meet no other curve of `all`. */
export function trimFreeEnds(chained: Curve[], all: Curve[], by: number): Curve[] {
  if (by <= 0) return chained;
  const ends = all.flatMap(c => [curveStart(c), curveEnd(c)]);
  const free = (p: P2) => ends.filter(q => close(p, q)).length <= 1;
  return runs(chained).flatMap(run => {
    const a = free(curveStart(run[0]!)) ? by : 0;
    const b = free(curveEnd(run[run.length - 1]!)) ? by : 0;
    return trimRun(run, a, b);
  });
}
