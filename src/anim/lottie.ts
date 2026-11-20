/* Lottie: a loop of frames as a bodymovin animation (format 5.7.4), for
   lottie-web and the LottieFiles players.

   It rides on the animated SVG's merge (svgAnim.ts): every distinct element
   becomes a group, on screen for each unbroken run of frames it shows in, and
   elements on screen for the same run share one shape layer. Lottie lists its
   top layer first, and a layer's top group first, so paint order is reversed.

   Shapes stay exact: path data becomes cubic Béziers, arcs split at 90° or
   less (parsePath in engine/decal.ts) and quadratics raised to cubics. Fills,
   strokes, opacity, caps, joins and dashes map one to one. Shadows don't
   come along: Lottie has no SVG filters and the players disagree on blur, so
   an element painted through a filter is left out. */
import { parsePath } from '../engine/decal';
import type { El } from '../engine/svg';
import { gather, mergeFrames } from './svgAnim';

type Vec = [number, number];

/** A Lottie path: vertices, and in/out tangents relative to their vertex. */
export interface Bezier {
  c: boolean;
  v: Vec[];
  i: Vec[];
  o: Vec[];
}

/* Two decimals keep the file small; at artboard scale that's well under a pixel. */
const r2 = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
};
const still = <T>(k: T) => ({ a: 0, k });

/** Path data (absolute or relative, any command) as one Lottie path per subpath. `ox`, `oy` shift the origin. */
export function pathToBeziers(d: string, ox = 0, oy = 0): Bezier[] {
  type Raw = { c: boolean; v: Vec[]; i: Vec[]; o: Vec[] };
  const subs: Raw[] = [];
  let cur: Raw | null = null;
  let start: Vec = [0, 0];
  const ok = (p: { x: number; y: number }) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const begin = (p: Vec): Raw => {
    const s: Raw = { c: false, v: [p], i: [[0, 0]], o: [[0, 0]] };
    subs.push(s);
    return s;
  };
  for (const cmd of parsePath(d)) {
    if (cmd.k === 'Z') {
      if (cur) cur.c = true;
      cur = null;
      continue;
    }
    if (!ok(cmd.p)) continue;
    const p: Vec = [cmd.p.x - ox, cmd.p.y - oy];
    if (cmd.k === 'M') {
      start = p;
      cur = begin(p);
      continue;
    }
    /* drawing on after a Z starts a new subpath where the last one began */
    const s = cur ?? (cur = begin(start));
    const at = s.v[s.v.length - 1]!;
    if (cmd.k === 'C' && ok(cmd.c1) && ok(cmd.c2)) {
      s.o[s.o.length - 1] = [cmd.c1.x - ox - at[0], cmd.c1.y - oy - at[1]];
      s.i.push([cmd.c2.x - ox - p[0], cmd.c2.y - oy - p[1]]);
    } else s.i.push([0, 0]);
    s.v.push(p);
    s.o.push([0, 0]);
  }
  const out: Bezier[] = [];
  for (const s of subs) {
    /* a closed path that returns to its start: the closing segment is implied, so drop the repeat */
    const n = s.v.length;
    if (s.c && n > 1 && Math.abs(s.v[n - 1]![0] - s.v[0]![0]) < 1e-3 && Math.abs(s.v[n - 1]![1] - s.v[0]![1]) < 1e-3) {
      s.i[0] = s.i[n - 1]!;
      s.v.pop();
      s.i.pop();
      s.o.pop();
    }
    if (s.v.length < 2) continue;
    const round = (list: Vec[]) => list.map(([x, y]): Vec => [r2(x), r2(y)]);
    out.push({ c: s.c, v: round(s.v), i: round(s.i), o: round(s.o) });
  }
  return out;
}

/** Any SVG colour the engine writes (hex, rgb(), rgba(), black, white) as 0..1 RGB plus alpha; null for none. */
export function parseColour(v: string | number | undefined): { rgb: [number, number, number]; a: number } | null {
  const s = String(v ?? 'none').trim().toLowerCase();
  if (s === 'black') return { rgb: [0, 0, 0], a: 1 };
  if (s === 'white') return { rgb: [1, 1, 1], a: 1 };
  const hex = /^#([0-9a-f]{3,8})$/.exec(s)?.[1];
  if (hex && hex.length !== 5 && hex.length !== 7) {
    const h = hex.length < 6 ? [...hex].map(c => c + c).join('') : hex;
    const at = (k: number) => parseInt(h.slice(k, k + 2), 16) / 255;
    return { rgb: [at(0), at(2), at(4)], a: h.length === 8 ? at(6) : 1 };
  }
  const fn = /^rgba?\(([^)]*)\)$/.exec(s)?.[1];
  if (fn) {
    const part = fn.split(/[\s,/]+/).filter(Boolean);
    const ch = (k: number) => {
      const t = part[k] ?? '0';
      return Math.min(1, Math.max(0, t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t) / 255));
    };
    const a = part[3] ?? '1';
    return { rgb: [ch(0), ch(1), ch(2)], a: Math.min(1, Math.max(0, a.endsWith('%') ? parseFloat(a) / 100 : parseFloat(a))) };
  }
  return null;
}

/* The shape an element draws, as path data. Rects drop rounded corners (the engine draws none). */
function pathData(el: El): string {
  const a = (k: string) => Number(el.attrs[k] ?? 0);
  switch (el.tag) {
    case 'path':
      return String(el.attrs.d ?? '');
    case 'rect':
      return `M${a('x')} ${a('y')}h${a('width')}v${a('height')}h${-a('width')}Z`;
    case 'circle':
    case 'ellipse': {
      const [rx, ry] = el.tag === 'circle' ? [a('r'), a('r')] : [a('rx'), a('ry')];
      const arc = (x: number) => `A${rx} ${ry} 0 1 0 ${x} ${a('cy')}`;
      return `M${a('cx') - rx} ${a('cy')}${arc(a('cx') + rx)}${arc(a('cx') - rx)}Z`;
    }
    case 'line':
      return `M${a('x1')} ${a('y1')}L${a('x2')} ${a('y2')}`;
    case 'polyline':
    case 'polygon':
      return `M${el.attrs.points ?? ''}${el.tag === 'polygon' ? 'Z' : ''}`;
    default:
      return '';
  }
}

const INHERITED = ['fill', 'fill-opacity', 'fill-rule', 'stroke', 'stroke-opacity', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'stroke-dasharray', 'stroke-dashoffset'];
const CAPS: Record<string, number> = { butt: 1, round: 2, square: 3 };
const JOINS: Record<string, number> = { miter: 1, round: 2, bevel: 3 };

const groupTransform = () => ({
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0),
});

/* An element as Lottie groups, top first. `alpha` carries a group's opacity down to its
   shapes, which is exact while they don't overlap (the engine's groups are unwrapped before this). */
function groups(el: El, paint: El['attrs'], alpha: number, ox: number, oy: number): object[] {
  if (el.attrs.filter !== undefined) return []; // a shadow: see the note at the top
  const at: El['attrs'] = { ...paint };
  for (const k of INHERITED) if (el.attrs[k] !== undefined) at[k] = el.attrs[k];
  const op = alpha * Number(el.attrs.opacity ?? 1);
  if (el.tag === 'g') return (el.children ?? []).slice().reverse().flatMap(c => groups(c, at, op, ox, oy));
  const shapes = pathToBeziers(pathData(el), ox, oy);
  if (!shapes.length) return [];
  const it: object[] = shapes.map(ks => ({ ty: 'sh', ks: still(ks) }));
  const pct = (c: { a: number }, k: string) => still(r2(100 * op * c.a * Number(at[k] ?? 1)));
  /* lottie-web floors each channel ×255, so round up: the channel survives a player that floors or rounds */
  const rgba = (c: { rgb: number[] }) => still([...c.rgb.map(x => Math.min(1, Math.ceil(x * 1000) / 1000)), 1]);
  const stroke = parseColour(at.stroke);
  const width = Number(at['stroke-width'] ?? 1);
  if (stroke && width > 0) {
    const st: Record<string, unknown> = {
      ty: 'st',
      c: rgba(stroke),
      o: pct(stroke, 'stroke-opacity'),
      w: still(r2(width)),
      lc: CAPS[String(at['stroke-linecap'])] ?? 1,
      lj: JOINS[String(at['stroke-linejoin'])] ?? 1,
      ml: Number(at['stroke-miterlimit'] ?? 4),
    };
    const dash = String(at['stroke-dasharray'] ?? 'none').split(/[\s,]+/).filter(Boolean).map(Number);
    if (dash.length && dash.every(x => x >= 0) && dash.some(x => x > 0)) {
      const even = dash.length % 2 ? [...dash, ...dash] : dash;
      st.d = [
        ...even.map((x, k) => (k % 2 ? { n: 'g', nm: 'gap', v: still(r2(x)) } : { n: 'd', nm: 'dash', v: still(r2(x)) })),
        { n: 'o', nm: 'offset', v: still(r2(Number(at['stroke-dashoffset'] ?? 0))) },
      ];
    }
    it.push(st);
  }
  const fill = parseColour(at.fill ?? 'black');
  if (fill) it.push({ ty: 'fl', c: rgba(fill), o: pct(fill, 'fill-opacity'), r: at['fill-rule'] === 'evenodd' ? 2 : 1 });
  if (it.length === shapes.length) return [];
  it.push(groupTransform());
  return [{ ty: 'gr', it }];
}

/**
 * The frames of a loop as a Lottie animation object (JSON.stringify it to save).
 * Layer k is on for frames ip ≤ f < op; the background is a layer of its own, at the bottom.
 * Frames must share a size; frame 0's root attributes are kept.
 */
export function lottie(frames: El[], fps: number, name: string): object {
  const n = frames.length;
  const { root, pieces } = mergeFrames(frames);
  const box = String(root.viewBox ?? '').trim().split(/[\s,]+/).map(Number);
  const [ox, oy, w, h] = box.length === 4 && box.every(Number.isFinite) ? box : [0, 0, Number(root.width), Number(root.height)];
  const paint: El['attrs'] = {};
  for (const k of INHERITED) if (root[k] !== undefined) paint[k] = root[k];

  /* one unit per unbroken run of frames */
  const units: { el: El; ip: number; op: number; bg: boolean }[] = [];
  pieces.forEach((p, k) => {
    const bg = k === 0 && p.el.tag === 'rect' && p.frames.length === n;
    p.frames.forEach((f, j) => {
      if (j === 0 || f !== p.frames[j - 1]! + 1) units.push({ el: p.el, ip: f, op: f + 1, bg });
      else units[units.length - 1]!.op = f + 1;
    });
  });
  const runs = gather(
    units,
    u => (u.bg ? 'bg' : `${u.ip}-${u.op}`),
    (a, b) => a.ip < b.op && b.ip < a.op,
  );
  const layers = runs
    .map(run => {
      const { ip, op, bg } = run[0]!;
      const shapes = run
        .slice()
        .reverse()
        .flatMap(u => groups(u.el, paint, 1, ox!, oy!));
      return { ip, op, nm: bg ? 'Background' : ip === 0 && op === n ? 'Still' : `Frames ${ip}-${op - 1}`, shapes };
    })
    .filter(l => l.shapes.length)
    .reverse()
    .map((l, k) => ({
      ddd: 0,
      ind: k + 1,
      ty: 4,
      nm: l.nm,
      sr: 1,
      ks: { o: still(100), r: still(0), p: still([0, 0, 0]), a: still([0, 0, 0]), s: still([100, 100, 100]) },
      ao: 0,
      shapes: l.shapes,
      ip: l.ip,
      op: l.op,
      st: 0,
      bm: 0,
    }));
  return { v: '5.7.4', fr: fps, ip: 0, op: n, w: r2(w!), h: r2(h!), nm: name, ddd: 0, assets: [], layers, markers: [] };
}
