/* Scene → drawing. Each convex piece of each object becomes a layer: its
   shadow, its faces' fills, the dots on them, a decal, then its lines.
   Layers are painted back to front, so nearer pieces cover what is behind
   them, as in Linear's own SVGs.

   Lines come in four kinds, styled the way Linear draws them:
   - outline: the silhouette, where a face meets one turned away (bright);
   - crease: where two faces you can see meet, like a top meeting a side (dim);
   - contact: an outline lying on another object's face, like the bottom of
     a slab resting on the one below (dim, as a crease);
   - guide: dotted uprights from a floating object down to what is under it. */
import { drawLine, type LineDraw } from './lines';
import { onGround } from '../model/ground';
import type { DotFill, FaceStyle, Label, Scene, SceneObject, Theme } from '../model/types';
import { textCmds, textWidth } from './text';
import { type Curve, chain, trimFreeEnds } from './curves';
import { cmdsToPath, parsePath, strikeLogoPaths, type Cmd } from './decal';
import { type DotGroup, type FaceFrame, faceDots } from './dots';
import {
  type M3,
  type P2,
  type V3,
  type View,
  TAU,
  apply3,
  applyT3,
  cross2,
  dot3,
  hull as convexHull,
  makeView,
  project,
  rotation,
} from './math';
import { paintOrder, type Solid } from './order';
import {
  type PieceSeg,
  type Seg,
  type ShapeGeom,
  type ShapeSpec,
  buildShape,
  insidePiece,
  sampleSegs,
  segEnd,
  segLength,
  segNormal,
  segPoint,
  segTangent,
} from './shapes';

export type LineKind = 'outline' | 'crease' | 'contact' | 'guide';

export interface LineStyle {
  color: string;
  width: number;
  opacity: number;
  dash: string | null;
  cap: 'round' | 'butt';
}

export interface StrokeGroup {
  kind: LineKind;
  style: LineStyle;
  curves: Curve[];
}

export interface FillGroup {
  color: string;
  /** closed regions, each a loop of curves */
  regions: Curve[][];
}

export interface DecalDraw {
  d: string;
  mode: 'stroke' | 'fill';
  color: string;
  width: number;
  opacity: number;
}

export interface Layer {
  key: string;
  objectId: string;
  piece: number;
  hull: P2[];
  bbox: { minX: number; minY: number; maxX: number; maxY: number };
  /** paints no faces, so hides nothing */
  seeThrough: boolean;
  /** the faces you can see, as screen polygons, for picking */
  faces: { key: string; poly: P2[] }[];
  shadow: { blur: number; dx: number; dy: number; opacity: number } | null;
  fills: FillGroup[];
  dots: DotGroup[];
  decal: DecalDraw | null;
  strokes: StrokeGroup[];
}

export interface TextDraw {
  id: string;
  d: string;
  color: string;
  opacity: number;
  /** where the label is anchored on the artboard, for picking */
  at: P2;
  /** the box its letters fill, for fitting the view */
  ink: { minX: number; minY: number; maxX: number; maxY: number };
  box: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface RenderModel {
  width: number;
  height: number;
  theme: Theme;
  view: View;
  layers: Layer[];
  /** labels lying on the ground, drawn under everything */
  groundLabels: TextDraw[];
  /** upright and wall labels, drawn over everything */
  labels: TextDraw[];
  /** construction lines under the shapes, and over them */
  linesUnder: LineDraw[];
  linesOver: LineDraw[];
}

const FACE_EPS = 1e-7;

const shapeCache = new Map<string, ShapeGeom>();
export function shapeOf(spec: ShapeSpec): ShapeGeom {
  const k = JSON.stringify(spec);
  let g = shapeCache.get(k);
  if (!g) {
    if (shapeCache.size > 400) shapeCache.clear();
    shapeCache.set(k, (g = buildShape(spec)));
  }
  return g;
}

const pathCache = new Map<string, Cmd[]>();
function cmdsOf(d: string): Cmd[] {
  let c = pathCache.get(d);
  if (!c) {
    if (pathCache.size > 400) pathCache.clear();
    pathCache.set(d, (c = parsePath(d)));
  }
  return c;
}
const STRIKE_LOGO = strikeLogoPaths();

/** Angle ranges inside [a0, a1] within hw of centre (round the circle). */
function within(a0: number, a1: number, centre: number, hw: number): [number, number][] {
  if (hw <= 0) return [];
  if (hw >= Math.PI - 1e-12) return [[a0, a1]];
  const out: [number, number][] = [];
  for (let k = -3; k <= 3; k++) {
    const lo = Math.max(a0, centre - hw + TAU * k);
    const hi = Math.min(a1, centre + hw + TAU * k);
    if (hi - lo > 1e-9) out.push([lo, hi]);
  }
  return out.sort((x, y) => x[0] - y[0]);
}

function minus(a0: number, a1: number, ranges: [number, number][]): [number, number][] {
  const out: [number, number][] = [];
  let at = a0;
  for (const [lo, hi] of ranges) {
    if (lo - at > 1e-9) out.push([at, lo]);
    at = Math.max(at, hi);
  }
  if (a1 - at > 1e-9) out.push([at, a1]);
  return out;
}

/** An object placed in the view: everything needed to project its plan shape. */
interface Placed {
  obj: SceneObject;
  index: number;
  geom: ShapeGeom;
  R: M3;
  p: V3;
  h: number;
  /** the view direction in the object's own axes */
  vl: V3;
  S0: V3;
  S1: V3;
  base: P2;
  /** which piece owns each outline segment */
  owner: number[];
  tilted: boolean;
}

const proj = (o: Placed, x: number, y: number, z: number): P2 => ({
  x: o.base.x + o.S0[0] * x + o.S0[1] * y + o.S0[2] * z,
  y: o.base.y + o.S1[0] * x + o.S1[1] * y + o.S1[2] * z,
});
const projVec = (o: Placed, x: number, y: number, z: number): P2 => ({
  x: o.S0[0] * x + o.S0[1] * y + o.S0[2] * z,
  y: o.S1[0] * x + o.S1[1] * y + o.S1[2] * z,
});

/** The facing of a side whose plan normal is n: positive when it turns towards you. */
const facing = (o: Placed, n: P2) => o.vl[0] * n.x + o.vl[2] * n.y;

function capCurve(o: Placed, s: Seg, y: number, t0?: number, t1?: number): Curve {
  if (s.kind === 'line') return { kind: 'line', a: proj(o, s.a.x, y, s.a.y), b: proj(o, s.b.x, y, s.b.y) };
  return { kind: 'arc', c: proj(o, s.c.x, y, s.c.y), u: projVec(o, s.r, 0, 0), w: projVec(o, 0, 0, s.r), t0: t0 ?? s.a0, t1: t1 ?? s.a1 };
}

const upright = (o: Placed, q: P2, y0: number, y1: number): Curve => ({ kind: 'line', a: proj(o, q.x, y0, q.y), b: proj(o, q.x, y1, q.y) });

const arcPoint = (s: Extract<Seg, { kind: 'arc' }>, a: number): P2 => ({ x: s.c.x + s.r * Math.cos(a), y: s.c.y + s.r * Math.sin(a) });

function sampleCurves(curves: Curve[]): P2[] {
  const out: P2[] = [];
  for (const c of curves) {
    if (c.kind === 'line') out.push(c.a);
    else {
      const n = Math.max(2, Math.ceil(Math.abs(c.t1 - c.t0) / (Math.PI / 12)));
      for (let i = 0; i < n; i++) {
        const t = c.t0 + ((c.t1 - c.t0) * i) / n;
        out.push({ x: c.c.x + c.u.x * Math.cos(t) + c.w.x * Math.sin(t), y: c.c.y + c.u.y * Math.cos(t) + c.w.y * Math.sin(t) });
      }
    }
  }
  return out;
}

function sideStyle(obj: SceneObject, key: string): { style: FaceStyle | null; global: boolean } {
  const own = obj.faces.sides[key];
  if (own && (own.fill || own.dots?.enabled)) return { style: own, global: false };
  const all = obj.faces.sides.all;
  if (all && (all.fill || all.dots?.enabled)) return { style: all, global: true };
  return { style: null, global: false };
}

/** Planes of every piece's caps, to find objects resting on each other. */
interface CapInfo {
  obj: number;
  R: M3;
  p: V3;
  h: number;
  segs: Seg[];
  top: { n: V3; d: number };
  bottom: { n: V3; d: number };
}

function capInfo(o: Placed, piece: PieceSeg[]): CapInfo {
  const up = apply3(o.R, [0, 1, 0]);
  const topPoint = apply3(o.R, [0, o.h, 0]);
  const tp: V3 = [topPoint[0] + o.p[0], topPoint[1] + o.p[1], topPoint[2] + o.p[2]];
  const down: V3 = [-up[0], -up[1], -up[2]];
  return {
    obj: o.index,
    R: o.R,
    p: o.p,
    h: o.h,
    segs: piece.map(s => s.seg),
    top: { n: up, d: dot3(up, tp) },
    bottom: { n: down, d: dot3(down, o.p) },
  };
}

function toWorld(o: Placed, q: P2, y: number): V3 {
  const w = apply3(o.R, [q.x, y, q.y]);
  return [w[0] + o.p[0], w[1] + o.p[1], w[2] + o.p[2]];
}

/** Does this point of a cap's edge rest on, or sink into, another object (a slab on the one below)? */
function touches(caps: CapInfo[], self: number, w: V3): boolean {
  const tol = 0.05;
  for (const c of caps) {
    if (c.obj === self) continue;
    const l = applyT3(c.R, [w[0] - c.p[0], w[1] - c.p[1], w[2] - c.p[2]]);
    if (l[1] < -tol || l[1] > c.h + tol) continue;
    if (insidePiece({ x: l[0], y: l[2] }, c.segs, -tol)) return true;
  }
  return false;
}

function placeObject(obj: SceneObject, index: number, view: View): Placed {
  const geom = shapeOf(obj.shape);
  const R = rotation(obj.rotation[0], obj.rotation[1], obj.rotation[2]);
  const p = obj.position;
  const z = view.zoom;
  const r0 = applyT3(R, view.r0);
  const r1 = applyT3(R, view.r1);
  const owner: number[] = new Array(geom.outline.length).fill(0);
  geom.pieces.forEach((piece, pi) => piece.forEach(s => s.outline !== null && (owner[s.outline] = pi)));
  return {
    obj,
    index,
    geom,
    R,
    p,
    h: Math.max(1e-3, obj.height),
    vl: applyT3(R, view.v),
    S0: [r0[0] * z, r0[1] * z, r0[2] * z],
    S1: [r1[0] * z, r1[1] * z, r1[2] * z],
    base: { x: view.ox + z * dot3(view.r0, p), y: view.oy + z * dot3(view.r1, p) },
    owner,
    tilted: Math.abs(obj.rotation[0]) > 1e-9 || Math.abs(obj.rotation[2]) > 1e-9,
  };
}

interface Built {
  layers: Layer[];
  solids: Solid[];
}

function buildObject(o: Placed, view: View, theme: Theme, caps: CapInfo[], all: Placed[]): Built {
  const { obj, geom, h } = o;
  const topVis = o.vl[1] > FACE_EPS;
  const botVis = o.vl[1] < -FACE_EPS;
  const A = o.vl[0];
  const B = o.vl[2];
  const M = Math.hypot(A, B);
  const phiV = Math.atan2(B, A);
  const taper = theme.creaseTaper;
  const width = obj.style.lineWidth ?? theme.lineWidth;
  const dash = obj.style.dash ? `${obj.style.dash} ${Math.round(obj.style.dash * 80) / 100}` : null;
  const cap = dash ? 'butt' : 'round';
  const outlineStyle: LineStyle = { color: obj.style.outline ?? theme.outline, width, opacity: obj.style.outlineOpacity, dash, cap };
  const creaseStyle: LineStyle = { color: obj.style.crease ?? theme.crease, width, opacity: obj.style.creaseOpacity, dash, cap };
  /* a see-through shape paints no faces, so it hides nothing behind it */
  const seeThrough = obj.style.fill === 'none';
  const guideStyle: LineStyle = { color: theme.guide, width: width * 2, opacity: 1, dash: `${width * 2} ${width * 6}`, cap: 'round' };
  const baseFill = obj.style.fill ?? theme.fill;
  const lines: Record<LineKind, Curve[]>[] = geom.pieces.map(() => ({ outline: [], crease: [], contact: [], guide: [] }));

  /* lines along the caps' edges */
  geom.outline.forEach((s, oi) => {
    const pi = o.owner[oi]!;
    const L = lines[pi]!;
    for (const which of ['top', 'bottom'] as const) {
      const y = which === 'top' ? h : 0;
      /* creases along a cap may sit a little down the sides (Linear's FIG 0.1) */
      const drop = Math.min(h / 2, Math.max(0, obj.style.creaseDrop));
      const yc = which === 'top' ? h - drop : drop;
      const capVis = which === 'top' ? topVis : botVis;
      const put = (kind: 'outline' | 'crease', c: Curve, mid: P2) => {
        if (kind === 'crease') {
          if (obj.style.showCreases) L.crease.push(c);
          return;
        }
        if (touches(caps, o.index, toWorld(o, mid, y))) L.contact.push(c);
        else L.outline.push(c);
      };
      if (s.kind === 'line') {
        const f = facing(o, segNormal(s, 0));
        const mid = segPoint(s, 0.5);
        if (capVis) put(f > FACE_EPS ? 'crease' : 'outline', capCurve(o, s, f > FACE_EPS ? yc : y), mid);
        else if (f > FACE_EPS) put('outline', capCurve(o, s, y), mid);
      } else {
        if (M < 1e-9) {
          if (capVis) put('outline', capCurve(o, s, y), segPoint(s, 0.5));
          continue;
        }
        const front = within(s.a0, s.a1, phiV, Math.PI / 2);
        const back = minus(s.a0, s.a1, front);
        if (capVis) {
          const creases = taper > 0 ? within(s.a0, s.a1, phiV, Math.acos(Math.min(1, taper))) : front;
          for (const [t0, t1] of creases) put('crease', capCurve(o, s, yc, t0, t1), arcPoint(s, (t0 + t1) / 2));
          for (const [t0, t1] of back) put('outline', capCurve(o, s, y, t0, t1), arcPoint(s, (t0 + t1) / 2));
        } else {
          for (const [t0, t1] of front) put('outline', capCurve(o, s, y, t0, t1), arcPoint(s, (t0 + t1) / 2));
        }
      }
    }
    /* the upright silhouettes of a curved side */
    if (s.kind === 'arc' && M > 1e-9) {
      for (const sil of [phiV - Math.PI / 2, phiV + Math.PI / 2]) {
        for (let k = -2; k <= 2; k++) {
          const a = sil + TAU * k;
          if (a >= s.a0 - 1e-9 && a <= s.a1 + 1e-9) L.outline.push(upright(o, arcPoint(s, a), 0, h));
        }
      }
    }
  });

  /* upright edges at sharp corners */
  const n = geom.outline.length;
  for (let i = 0; i < n; i++) {
    const s1 = geom.outline[i]!;
    const s2 = geom.outline[(i + 1) % n]!;
    const t1 = segTangent(s1, 1);
    const t2 = segTangent(s2, 0);
    const turn = cross2(t1, t2);
    if (Math.abs(turn) < 1e-6 && t1.x * t2.x + t1.y * t2.y > 0) continue;
    const f1 = facing(o, segNormal(s1, 1));
    const f2 = facing(o, segNormal(s2, 0));
    if (f1 <= FACE_EPS && f2 <= FACE_EPS) continue;
    const at = segEnd(s1);
    const ownerPiece = f1 >= f2 ? o.owner[i]! : o.owner[(i + 1) % n]!;
    const L = lines[ownerPiece]!;
    const edge = upright(o, at, 0, h);
    if (f1 > FACE_EPS && f2 > FACE_EPS) {
      if (obj.style.showCreases) L.crease.push(edge);
    } else if (turn > 0) L.outline.push(edge);
    else if (obj.style.showCreases) L.crease.push(edge);
  }

  /* dotted guides down to whatever is under a floating object */
  if (obj.guides && !o.tilted) {
    const pts = sampleSegs(geom.outline, 24);
    const scr = pts.map(q => ({ q, s: proj(o, q.x, 0, q.y), d: dot3(view.v, toWorld(o, q, 0)) }));
    const pick = [
      scr.reduce((m, x) => (x.s.x < m.s.x ? x : m)),
      scr.reduce((m, x) => (x.s.x > m.s.x ? x : m)),
      scr.reduce((m, x) => (x.d > m.d ? x : m)),
    ];
    const seen: P2[] = [];
    for (const g of pick) {
      if (seen.some(s => Math.hypot(s.x - g.s.x, s.y - g.s.y) < 1)) continue;
      seen.push(g.s);
      const w = toWorld(o, g.q, 0);
      let under = -Infinity;
      for (const other of all) {
        if (other === o || other.tilted) continue;
        const top = other.p[1] + other.h;
        if (top > w[1] + 1e-6 || top <= under) continue;
        const l = applyT3(other.R, [w[0] - other.p[0], 0, w[2] - other.p[2]]);
        if (other.geom.pieces.some(pc => insidePiece({ x: l[0], y: l[2] }, pc.map(x => x.seg), -0.5))) under = top;
      }
      if (under > -Infinity && w[1] - under > 1e-6) {
        lines[0]!.guide.push({ kind: 'line', a: g.s, b: proj(o, g.q.x, under - o.p[1], g.q.y) });
      }
    }
  }

  /* creases stop short of the outline where they end on their own */
  const allCreases = lines.flatMap(L => L.crease);
  const trim = obj.style.creaseTrim ?? theme.creaseTrim;

  /* each piece: faces, fills, dots, its share of the decal, and its solid for ordering */
  const layers: Layer[] = [];
  const solids: Solid[] = [];
  const bounds = geom.bounds;
  const capFrame = (piece: PieceSeg[], y: number): FaceFrame => {
    const O = proj(o, 0, y, 0);
    const U = projVec(o, 1, 0, 0);
    const V = projVec(o, 0, 0, 1);
    const segs = piece.map(s => s.seg);
    const seams = piece.map(s => s.outline === null);
    return {
      uMin: bounds.minX,
      uMax: bounds.maxX,
      vMin: bounds.minY,
      vMax: bounds.maxY,
      nu: u => (u - bounds.minX) / Math.max(1e-9, bounds.maxX - bounds.minX),
      nv: v => (v - bounds.minY) / Math.max(1e-9, bounds.maxY - bounds.minY),
      inside: (u, v, inset) => {
        const q = { x: u, y: v };
        for (let k = 0; k < segs.length; k++) {
          const s = segs[k]!;
          if (s.kind !== 'line') continue;
          const ex = s.b.x - s.a.x;
          const ey = s.b.y - s.a.y;
          const l = Math.hypot(ex, ey);
          if (l < 1e-12) continue;
          const d = (ex * (q.y - s.a.y) - ey * (q.x - s.a.x)) / l;
          if (d < (seams[k] ? 0 : inset)) return false;
        }
        return insidePiece(q, segs.filter(s => s.kind === 'arc'), inset);
      },
      map: (u, v) => ({ c: { x: O.x + U.x * u + V.x * v, y: O.y + U.y * u + V.y * v }, U, V }),
    };
  };

  geom.pieces.forEach((piece, pi) => {
    const fills: { key: string; regions: Curve[][] }[] = [];
    const faces: { key: string; poly: P2[] }[] = [];
    const dots: DotGroup[] = [];
    const addFace = (key: string, region: Curve[]) => {
      fills.push({ key, regions: [region] });
      faces.push({ key, poly: sampleCurves(region) });
    };
    /* the cap you can see */
    const capY = topVis ? h : botVis ? 0 : null;
    if (capY !== null) {
      const region = piece.map(ps => capCurve(o, ps.seg, capY));
      const key = topVis ? 'top' : 'bottom';
      addFace(key, region);
      const fs = topVis ? obj.faces.top : obj.faces.bottom;
      if (fs.dots?.enabled) dots.push(...faceDots(fs.dots, capFrame(piece, capY), fs.dots.color || theme.dot));
    }
    /* the sides you can see */
    piece.forEach(ps => {
      if (ps.outline === null) return;
      const s = ps.seg;
      const { style: fstyle, global } = sideStyle(obj, s.face);
      const start = geom.starts[ps.outline]!;
      const len = segLength(s);
      if (s.kind === 'line') {
        const nrm = segNormal(s, 0);
        if (facing(o, nrm) <= FACE_EPS) return;
        addFace(s.face, [
          capCurve(o, s, 0),
          upright(o, s.b, 0, h),
          { kind: 'line', a: proj(o, s.b.x, h, s.b.y), b: proj(o, s.a.x, h, s.a.y) },
          upright(o, s.a, h, 0),
        ]);
        if (fstyle?.dots?.enabled) {
          const t = segTangent(s, 0);
          const U = projVec(o, t.x, 0, t.y);
          const V = projVec(o, 0, 1, 0);
          dots.push(...faceDots(fstyle.dots, sideFrame(global, start, len, geom.perimeter, h, (u, v) => {
            const q = segPoint(s, (u - (global ? start : 0)) / len);
            return { c: proj(o, q.x, v, q.y), U, V };
          }), fstyle.dots.color || theme.dot));
        }
      } else {
        if (M < 1e-9) return;
        for (const [t0, t1] of within(s.a0, s.a1, phiV, Math.PI / 2)) {
          const pa = arcPoint(s, t0);
          const pb = arcPoint(s, t1);
          addFace(s.face, [capCurve(o, s, 0, t0, t1), upright(o, pb, 0, h), capCurve(o, s, h, t1, t0), upright(o, pa, h, 0)]);
        }
        if (fstyle?.dots?.enabled) {
          const V = projVec(o, 0, 1, 0);
          dots.push(...faceDots(fstyle.dots, sideFrame(global, start, len, geom.perimeter, h, (u, v) => {
            const a = s.a0 + (u - (global ? start : 0)) / s.r;
            const nrm = { x: Math.cos(a), y: Math.sin(a) };
            if (facing(o, nrm) < 0.04 * M) return null;
            const q = arcPoint(s, a);
            return { c: proj(o, q.x, v, q.y), U: projVec(o, -nrm.y, 0, nrm.x), V };
          }), fstyle.dots.color || theme.dot));
        }
      }
    });

    /* fills: one path in the object's colour, then faces painted their own */
    const groups = new Map<string, Curve[][]>();
    for (const f of fills) {
      let color = baseFill;
      if (f.key === 'top' && obj.faces.top.fill) color = obj.faces.top.fill;
      else if (f.key === 'bottom' && obj.faces.bottom.fill) color = obj.faces.bottom.fill;
      else if (f.key !== 'top' && f.key !== 'bottom') color = sideStyle(obj, f.key).style?.fill ?? baseFill;
      const list = groups.get(color) ?? [];
      list.push(...f.regions);
      groups.set(color, list);
    }
    const baseRegions = fills.flatMap(f => f.regions);
    const fillGroups: FillGroup[] = seeThrough ? [] : [{ color: baseFill, regions: baseRegions }];
    if (!seeThrough) for (const [color, regions] of groups) if (color !== baseFill) fillGroups.push({ color, regions });

    /* the decal, on the piece its centre sits on */
    let decal: DecalDraw | null = null;
    if (obj.decal && topVis) {
      const dc = obj.decal;
      const centre = { x: dc.x, y: dc.y };
      const home = geom.pieces.findIndex(pc => insidePiece(centre, pc.map(x => x.seg), -1e-6));
      if ((home < 0 ? 0 : home) === pi) {
        const ca = Math.cos((dc.rotation * Math.PI) / 180);
        const sa = Math.sin((dc.rotation * Math.PI) / 180);
        const f = (q: P2) => {
          const x = dc.x + (q.x * ca - q.y * sa) * dc.size;
          const z = dc.y + (q.x * sa + q.y * ca) * dc.size;
          return proj(o, x, h, z);
        };
        const d =
          dc.kind === 'text'
            ? cmdsToPath(textCmds(dc.text, 'middle'), f)
            : (dc.kind === 'strike' ? STRIKE_LOGO : dc.paths).map(p => cmdsToPath(cmdsOf(p), f)).join('');
        decal = {
          d,
          mode: dc.mode,
          color: dc.color ?? (dc.mode === 'stroke' ? obj.style.crease ?? theme.crease : theme.accent),
          width: dc.width ?? width,
          opacity: dc.opacity,
        };
      }
    }

    /* the piece's silhouette and its solid, for ordering, picking and clipping */
    const segs = piece.map(x => x.seg);
    const planPts = sampleSegs(segs, 12);
    const scr = [...planPts.map(q => proj(o, q.x, 0, q.y)), ...planPts.map(q => proj(o, q.x, h, q.y))];
    const hullPts = convexHull(scr);
    const xs = hullPts.map(q => q.x);
    const ys = hullPts.map(q => q.y);
    const bbox = { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
    const centreW = toWorld(o, { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 }, h / 2);
    solids.push({ hull: hullPts, bbox, R: o.R, p: o.p, h, plan: planPts, mean: dot3(view.v, centreW) });

    const L = lines[pi]!;
    const strokes: StrokeGroup[] = [];
    if (L.guide.length) strokes.push({ kind: 'guide', style: guideStyle, curves: L.guide });
    if (L.crease.length) strokes.push({ kind: 'crease', style: creaseStyle, curves: trimFreeEnds(chain(L.crease), allCreases, trim) });
    if (L.contact.length) strokes.push({ kind: 'contact', style: creaseStyle, curves: chain(L.contact) });
    if (L.outline.length) strokes.push({ kind: 'outline', style: outlineStyle, curves: chain(L.outline) });

    layers.push({
      key: `${obj.id}:${pi}`,
      objectId: obj.id,
      piece: pi,
      hull: hullPts,
      bbox,
      faces,
      seeThrough,
      shadow: obj.shadow.enabled && !seeThrough ? { blur: obj.shadow.blur, dx: obj.shadow.dx, dy: obj.shadow.dy, opacity: obj.shadow.opacity } : null,
      fills: fillGroups,
      dots,
      decal,
      strokes,
    });
  });
  return { layers, solids };
}

function sideFrame(
  global: boolean,
  start: number,
  len: number,
  perimeter: number,
  h: number,
  map: FaceFrame['map'],
): FaceFrame {
  const u0 = global ? start : 0;
  const u1 = u0 + len;
  return {
    uMin: 0,
    uMax: global ? perimeter : len,
    vMin: 0,
    vMax: h,
    /* a side is read from outside, where its counter-clockwise run goes right to left: so 0 is its left edge */
    nu: u => 1 - u / Math.max(1e-9, global ? perimeter : len),
    nv: v => v / Math.max(1e-9, h),
    inside: (u, v, inset) => {
      if (v < inset || v > h - inset) return false;
      if (global) return u >= u0 && u < u1;
      return u >= inset && u <= len - inset;
    },
    map,
  };
}

export interface RenderOptions {
  /** leave out objects by id (the editor hides nothing; export can) */
  skip?: Set<string>;
}

export function renderScene(drawn: Scene, opts: RenderOptions = {}): RenderModel {
  const scene = drawn.ground && drawn.ground !== 'dark' ? onGround(drawn, drawn.ground) : drawn;
  const { width, height } = scene.artboard;
  const view = makeView(scene.camera, width, height);
  const visible = scene.objects.filter(o => o.visible && !opts.skip?.has(o.id));
  const placed = visible.map((o, i) => placeObject(o, i, view));
  const caps: CapInfo[] = placed.flatMap(o => o.geom.pieces.map(pc => capInfo(o, pc)));
  const layers: Layer[] = [];
  const solids: Solid[] = [];
  for (const o of placed) {
    const b = buildObject(o, view, scene.theme, caps, placed);
    layers.push(...b.layers);
    solids.push(...b.solids);
  }
  const order = paintOrder(solids, view);
  const texts = (scene.labels ?? []).filter(l => l.text.trim()).map(l => drawLabel(l, view, scene.theme));
  const lines = (scene.lines ?? []).map(l => drawLine(l, view, scene.theme));
  return {
    width,
    height,
    theme: scene.theme,
    view,
    layers: order.map(i => layers[i]!),
    groundLabels: texts.filter(t => t.ground).map(t => t.draw),
    labels: texts.filter(t => !t.ground).map(t => t.draw),
    linesUnder: lines.filter(l => l.layer === 'under'),
    linesOver: lines.filter(l => l.layer === 'over'),
  };
}

/** A label: its words as outlines, laid in its plane and seen through the camera. */
function drawLabel(l: Label, view: View, theme: Theme): { ground: boolean; draw: TextDraw } {
  const cmds = textCmds(l.text, l.align, 0, l.weight ?? 'regular');
  const at = project(view, l.position);
  const ca = Math.cos((l.rotation * Math.PI) / 180);
  const sa = Math.sin((l.rotation * Math.PI) / 180);
  /* the text's own axes: x along the line, y down the letters */
  let f: (q: P2) => P2;
  if (l.plane === 'screen') {
    const k = l.size * view.zoom;
    f = q => ({ x: at.x + (q.x * ca - q.y * sa) * k, y: at.y + (q.x * sa + q.y * ca) * k });
  } else {
    const axes: Record<'ground' | 'xy' | 'zy', [V3, V3]> = {
      ground: [
        [ca, 0, -sa],
        [sa, 0, ca],
      ],
      xy: [
        [ca, sa, 0],
        [sa, -ca, 0],
      ],
      zy: [
        [0, sa, -ca],
        [0, -ca, -sa],
      ],
    };
    const [ax, ay] = axes[l.plane];
    f = q => {
      const s = l.size;
      return project(view, [
        l.position[0] + (ax[0] * q.x + ay[0] * q.y) * s,
        l.position[1] + (ax[1] * q.x + ay[1] * q.y) * s,
        l.position[2] + (ax[2] * q.x + ay[2] * q.y) * s,
      ]);
    };
  }
  const half = (textWidth(l.text, 0, l.weight ?? 'regular') / 2) * l.size * view.zoom;
  const tall = l.size * view.zoom;
  /* a second line (a value under its ticker) sits `offset` lines down, in the label's own plane */
  const placed = f;
  const off = (l.offset ?? 0) * 1.75;
  const ink = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const g = (q: P2) => {
    const p = placed({ x: q.x, y: q.y + off });
    ink.minX = Math.min(ink.minX, p.x);
    ink.minY = Math.min(ink.minY, p.y);
    ink.maxX = Math.max(ink.maxX, p.x);
    ink.maxY = Math.max(ink.maxY, p.y);
    return p;
  };
  const d = cmdsToPath(cmds, g, 2);
  return {
    ground: l.plane === 'ground',
    draw: {
      id: l.id,
      ink,
      d,
      color: l.color ?? theme.label,
      opacity: l.opacity,
      at,
      box: { minX: at.x - half * 2.2, minY: at.y - tall * 1.6, maxX: at.x + half * 2.2, maxY: at.y + tall * 1.6 },
    },
  };
}

/** Is a dot fill switched on anywhere on this object? (Used by the inspector.) */
export const hasDots = (d: DotFill | null | undefined) => !!d?.enabled;
