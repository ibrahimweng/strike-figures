/* Plan shapes. Every object is a plan outline pushed straight up by its
   height (a prism), the way Linear's slabs, cubes and fins are. The outline
   is made of straight lines and circular arcs, so rounded corners are true
   circles in 3D and come out as exact elliptical arcs on screen.

   Plan coordinates: x is the world's X, y is the world's Z. Outlines wind
   counter-clockwise in those coordinates, so the outward normal of a line
   from a to b is (dy, -dx).

   A concave outline (the Strike chevron) is cut into convex pieces along
   "seams". Each piece is drawn as a solid of its own, which keeps hidden
   surfaces simple; the seams themselves are never drawn. */
import { type P2, EPS, TAU, add2, cross2, dot2, len2, mul2, norm2, p2, polygonArea, sub2 } from './math';

export type Seg =
  | { kind: 'line'; a: P2; b: P2; face: string }
  | { kind: 'arc'; c: P2; r: number; a0: number; a1: number; face: string };

export interface PieceSeg {
  seg: Seg;
  /** the outline segment this is, or null for a seam inside the shape */
  outline: number | null;
}

export interface ShapeGeom {
  outline: Seg[];
  pieces: PieceSeg[][];
  /** where each outline segment starts along the perimeter */
  starts: number[];
  perimeter: number;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  /** the faces a side fill can be put on, in outline order */
  sideFaces: string[];
}

export type ShapeSpec =
  /** corners, when set, rounds each corner on its own: back (-X-Z), right (+X-Z), front (+X+Z), left (-X+Z) */
  | { kind: 'box'; width: number; depth: number; radius: number; corners?: [number, number, number, number] | null }
  | { kind: 'cylinder'; radius: number }
  | { kind: 'polygon'; sides: number; radius: number; corner: number }
  | { kind: 'chevron'; width: number; depth: number };

export const segLength = (s: Seg) => (s.kind === 'line' ? len2(sub2(s.b, s.a)) : s.r * (s.a1 - s.a0));

export function segPoint(s: Seg, t: number): P2 {
  if (s.kind === 'line') return add2(s.a, mul2(sub2(s.b, s.a), t));
  const a = s.a0 + (s.a1 - s.a0) * t;
  return { x: s.c.x + s.r * Math.cos(a), y: s.c.y + s.r * Math.sin(a) };
}

export const segStart = (s: Seg) => segPoint(s, 0);
export const segEnd = (s: Seg) => segPoint(s, 1);

/** the outward normal at t */
export function segNormal(s: Seg, t: number): P2 {
  if (s.kind === 'line') {
    const d = norm2(sub2(s.b, s.a));
    return { x: d.y, y: -d.x };
  }
  const a = s.a0 + (s.a1 - s.a0) * t;
  return { x: Math.cos(a), y: Math.sin(a) };
}

/** the direction of travel at t (counter-clockwise) */
export function segTangent(s: Seg, t: number): P2 {
  const n = segNormal(s, t);
  return { x: -n.y, y: n.x };
}

/** Points along an outline, arcs cut into short chords, for hulls, hit tests and depth casts. */
export function sampleSegs(segs: Seg[], perQuarter = 8): P2[] {
  const out: P2[] = [];
  for (const s of segs) {
    if (s.kind === 'line') {
      out.push(s.a);
    } else {
      const n = Math.max(1, Math.ceil(((s.a1 - s.a0) / (Math.PI / 2)) * perQuarter));
      for (let i = 0; i < n; i++) out.push(segPoint(s, i / n));
    }
  }
  return out;
}

/** A convex polygon (counter-clockwise) with its corners rounded (one radius, or one per corner), clamped so neighbouring roundings never overlap. */
export function roundedPolygon(verts: P2[], radius: number | number[]): Seg[] {
  const n = verts.length;
  const out: Seg[] = [];
  const tangents: { t1: P2; t2: P2; arc: Seg | null }[] = [];
  for (let i = 0; i < n; i++) {
    const v = verts[i]!;
    const prev = verts[(i - 1 + n) % n]!;
    const next = verts[(i + 1) % n]!;
    const toPrev = sub2(prev, v);
    const toNext = sub2(next, v);
    const lp = len2(toPrev);
    const ln = len2(toNext);
    const e1 = norm2(toPrev);
    const e2 = norm2(toNext);
    const cosA = Math.max(-1, Math.min(1, dot2(e1, e2)));
    const alpha = Math.acos(cosA);
    const tanHalf = Math.tan(alpha / 2);
    let rr = Math.max(0, Array.isArray(radius) ? (radius[i] ?? 0) : radius);
    if (rr > EPS && tanHalf > EPS) {
      const tMax = Math.min(lp, ln) / 2;
      rr = Math.min(rr, tMax * tanHalf);
    }
    if (rr <= 1e-6 || tanHalf <= EPS || alpha > Math.PI - 1e-6) {
      tangents.push({ t1: v, t2: v, arc: null });
      continue;
    }
    const t = rr / tanHalf;
    const t1 = add2(v, mul2(e1, t));
    const t2 = add2(v, mul2(e2, t));
    const bis = norm2(add2(e1, e2));
    const c = add2(v, mul2(bis, rr / Math.sin(alpha / 2)));
    let a0 = Math.atan2(t1.y - c.y, t1.x - c.x);
    let a1 = Math.atan2(t2.y - c.y, t2.x - c.x);
    while (a1 < a0) a1 += TAU;
    while (a1 - a0 > Math.PI) a1 -= TAU;
    if (a1 < a0) a0 = a1 - (a0 - a1);
    tangents.push({ t1, t2, arc: { kind: 'arc', c, r: rr, a0, a1, face: `c${i}` } });
  }
  for (let i = 0; i < n; i++) {
    const cur = tangents[i]!;
    const nxt = tangents[(i + 1) % n]!;
    if (cur.arc) out.push(cur.arc);
    if (len2(sub2(nxt.t1, cur.t2)) > 1e-9) out.push({ kind: 'line', a: cur.t2, b: nxt.t1, face: `s${i}` });
  }
  return out;
}

const ccw = (verts: P2[]) => (polygonArea(verts) < 0 ? verts.slice().reverse() : verts);

function single(outline: Seg[]): ShapeGeom {
  return finish(outline, [outline.map((seg, i) => ({ seg, outline: i }))]);
}

function finish(outline: Seg[], pieces: PieceSeg[][]): ShapeGeom {
  const starts: number[] = [];
  let acc = 0;
  for (const s of outline) {
    starts.push(acc);
    acc += segLength(s);
  }
  const pts = sampleSegs(outline, 16);
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  const sideFaces: string[] = [];
  for (const s of outline) if (!sideFaces.includes(s.face)) sideFaces.push(s.face);
  return {
    outline,
    pieces,
    starts,
    perimeter: acc,
    bounds: { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) },
    sideFaces,
  };
}

/** The Strike mark's chevron, from the logo's own points (a 64-unit box). */
const CHEVRON = [p2(32, 4), p2(60, 26), p2(51, 33), p2(32, 18), p2(13, 33), p2(4, 26)];

function chevron(width: number, depth: number): ShapeGeom {
  const sx = width / 56;
  const sz = depth / 29;
  /* the logo's y runs down the page, which is away from the viewer in plan */
  let pts = CHEVRON.map(p => p2((p.x - 32) * sx, (p.y - 18.5) * sz));
  let idx = [0, 1, 2, 3, 4, 5];
  if (polygonArea(pts) < 0) {
    pts = pts.slice().reverse();
    idx = idx.slice().reverse();
  }
  const n = pts.length;
  const outline: Seg[] = pts.map((a, i) => ({ kind: 'line', a, b: pts[(i + 1) % n]!, face: `s${i}` }));
  const pieceFor = (origVerts: number[]): PieceSeg[] => {
    let ids = origVerts.map(o => idx.indexOf(o));
    if (polygonArea(ids.map(i => pts[i]!)) < 0) ids = ids.reverse();
    return ids.map((ia, k) => {
      const ib = ids[(k + 1) % ids.length]!;
      const isOutline = ib === (ia + 1) % n;
      const seg: Seg = { kind: 'line', a: pts[ia]!, b: pts[ib]!, face: isOutline ? `s${ia}` : 'seam' };
      return { seg, outline: isOutline ? ia : null };
    });
  };
  /* right arm: apex, right tip, right foot, notch; left arm: apex, notch, left foot, left tip */
  return finish(outline, [pieceFor([0, 1, 2, 3]), pieceFor([0, 3, 4, 5])]);
}

export function buildShape(spec: ShapeSpec): ShapeGeom {
  switch (spec.kind) {
    case 'box': {
      const w = Math.max(0.01, spec.width) / 2;
      const d = Math.max(0.01, spec.depth) / 2;
      return single(roundedPolygon([p2(-w, -d), p2(w, -d), p2(w, d), p2(-w, d)], spec.corners ?? Math.max(0, spec.radius)));
    }
    case 'cylinder':
      return single([{ kind: 'arc', c: p2(0, 0), r: Math.max(0.01, spec.radius), a0: 0, a1: TAU, face: 's0' }]);
    case 'polygon': {
      const n = Math.max(3, Math.min(24, Math.round(spec.sides)));
      const verts: P2[] = [];
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (TAU * k) / n + Math.PI / n;
        verts.push(p2(spec.radius * Math.cos(a), spec.radius * Math.sin(a)));
      }
      return single(roundedPolygon(ccw(verts), Math.max(0, spec.corner)));
    }
    case 'chevron':
      return chevron(Math.max(0.01, spec.width), Math.max(0.01, spec.depth));
  }
}

/** Is a plan point inside a convex piece, by at least margin (negative margin lets it sit just outside)? */
export function insidePiece(p: P2, segs: Seg[], margin = 0): boolean {
  for (const s of segs) {
    if (s.kind === 'line') {
      const d = sub2(s.b, s.a);
      const l = len2(d);
      if (l < EPS) continue;
      /* inside is to the left of a counter-clockwise edge */
      if (cross2(d, sub2(p, s.a)) / l < margin) return false;
    }
  }
  /* arcs bulge outward between their tangent points: test against each circle's reach */
  for (const s of segs) {
    if (s.kind !== 'arc') continue;
    const v = sub2(p, s.c);
    let a = Math.atan2(v.y, v.x);
    while (a < s.a0) a += TAU;
    if (a <= s.a1 + 1e-12 && len2(v) > s.r - margin) return false;
  }
  return true;
}
