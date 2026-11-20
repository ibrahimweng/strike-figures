/* Which piece is drawn over which. Every piece is a convex solid, so for two
   pieces that overlap on screen, whichever is nearer at one point of the
   overlap is nearer at all of them: cast one ray through the overlap and
   compare. The answers make a graph that is sorted back to front. */
import { type M3, type P2, type V3, type View, applyT3, centroid, clipConvex, polygonArea, unproject } from './math';

export interface Solid {
  hull: P2[];
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  R: M3;
  p: V3;
  h: number;
  /** the plan outline as a convex polygon, counter-clockwise */
  plan: P2[];
  mean: number;
}

/** How near the camera the front of a solid is along the ray through a depth-0 point; null if the ray misses. */
export function frontDepth(s: Solid, view: View, w0: V3): number | null {
  const l0 = applyT3(s.R, [w0[0] - s.p[0], w0[1] - s.p[1], w0[2] - s.p[2]]);
  const d = applyT3(s.R, view.v);
  let lo = -Infinity;
  let hi = Infinity;
  /* each constraint is a + b·t ≥ 0 */
  const keep = (a: number, b: number) => {
    if (Math.abs(b) < 1e-12) {
      if (a < -1e-9) {
        lo = Infinity;
        hi = -Infinity;
      }
      return;
    }
    const t = -a / b;
    if (b > 0) lo = Math.max(lo, t);
    else hi = Math.min(hi, t);
  };
  keep(l0[1], d[1]);
  keep(s.h - l0[1], -d[1]);
  const n = s.plan.length;
  for (let i = 0; i < n; i++) {
    const a = s.plan[i]!;
    const b = s.plan[(i + 1) % n]!;
    const ex = b.x - a.x;
    const ez = b.y - a.y;
    /* inside is to the left: cross(e, P - a) ≥ 0, with P = (x, z) */
    keep(ex * (l0[2] - a.y) - ez * (l0[0] - a.x), ex * d[2] - ez * d[0]);
  }
  return lo <= hi + 1e-9 ? hi : null;
}

const overlaps = (a: Solid['bbox'], b: Solid['bbox']) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;

/** Indices from back to front. */
export function paintOrder(solids: Solid[], view: View): number[] {
  const n = solids.length;
  const after: number[][] = solids.map(() => []);
  const indeg = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = solids[i]!;
      const b = solids[j]!;
      if (!overlaps(a.bbox, b.bbox)) continue;
      const both = clipConvex(a.hull, b.hull);
      if (both.length < 3 || Math.abs(polygonArea(both)) < 0.05) continue;
      const tries = [centroid(both), ...both.map(p => ({ x: (p.x * 3 + centroid(both).x) / 4, y: (p.y * 3 + centroid(both).y) / 4 }))];
      for (const q of tries) {
        const w0 = unproject(view, q);
        const da = frontDepth(a, view, w0);
        const db = frontDepth(b, view, w0);
        if (da === null || db === null || Math.abs(da - db) < 1e-7) continue;
        /* the farther one is drawn first */
        const [back, front] = da < db ? [i, j] : [j, i];
        after[back]!.push(front);
        indeg[front]!++;
        break;
      }
    }
  }
  const order: number[] = [];
  const done = new Array<boolean>(n).fill(false);
  const byDepth = solids.map((_, i) => i).sort((x, y) => solids[x]!.mean - solids[y]!.mean);
  while (order.length < n) {
    let pick = byDepth.find(i => !done[i] && indeg[i] === 0);
    /* a cycle (three bars over each other in a ring): break it at the farthest piece */
    if (pick === undefined) pick = byDepth.find(i => !done[i])!;
    done[pick] = true;
    order.push(pick);
    for (const k of after[pick]!) indeg[k]!--;
  }
  return order;
}
