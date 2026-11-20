/* Construction lines: paths and circles that sit over or under the shapes
   without hiding anything, as in Strike's brand book (dashed circles and
   spokes, orbits, rays out to labels). Circles are drawn as cubic béziers:
   a circle seen through an orthographic camera is an affine image of the
   circle, and an affine image of a bézier is the bézier of the images, so
   the projected curve is exact. Nodes (small squares or circles marking
   exact points) lie in the line's own plane: square on a flat view,
   diamond-shaped in the 2:1 view, like the nodes on the brand's grids. */
import type { Line, Theme } from '../model/types';
import { num } from './curves';
import { apply3, type P2, project, rotation, type V3, type View } from './math';

export interface LineDraw {
  id: string;
  /** the line itself, stroked */
  d: string;
  color: string;
  width: number;
  opacity: number;
  dash: string | null;
  /** the nodes, filled (and outlined when hollow) */
  nodes: string;
  nodeFill: string;
  nodeStroke: string | null;
  layer: 'under' | 'over';
  /** points along it, for fitting the view */
  pts: P2[];
}

const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const pt = (p: P2) => `${num(p.x, 2)} ${num(p.y, 2)}`;

/** A circle (or part of one) through 3D, as cubic béziers in 3D: [start, c1, c2, end] per piece. */
function arc3(c: V3, ax: V3, az: V3, r: number, a0: number, a1: number): [V3, V3, V3, V3][] {
  const out: [V3, V3, V3, V3][] = [];
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / (Math.PI / 2) - 1e-9));
  const step = (a1 - a0) / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const at = (a: number): V3 => add(add(c, ax, r * Math.cos(a)), az, r * Math.sin(a));
  const tan = (a: number): V3 => add(add([0, 0, 0], ax, -r * Math.sin(a)), az, r * Math.cos(a));
  for (let i = 0; i < n; i++) {
    const s = a0 + step * i;
    const e = s + step;
    const p0 = at(s);
    const p3 = at(e);
    out.push([p0, add(p0, tan(s), k), add(p3, tan(e), -k), p3]);
  }
  return out;
}

function bezPath(view: View, segs: [V3, V3, V3, V3][], close: boolean): string {
  if (!segs.length) return '';
  let d = `M${pt(project(view, segs[0]![0]))}`;
  for (const [, c1, c2, e] of segs) d += `C${pt(project(view, c1))} ${pt(project(view, c2))} ${pt(project(view, e))}`;
  return close ? `${d}Z` : d;
}

/** A node at p: a square or circle of width s in the plane spanned by ax, az. */
function node(view: View, p: V3, ax: V3, az: V3, s: number, shape: 'square' | 'circle'): string {
  const h = s / 2;
  if (shape === 'circle') return bezPath(view, arc3(p, ax, az, h, 0, 2 * Math.PI), true);
  const q = (i: number, j: number) => pt(project(view, add(add(p, ax, h * i), az, h * j)));
  return `M${q(1, 1)}L${q(-1, 1)}L${q(-1, -1)}L${q(1, -1)}Z`;
}

/** An open arrowhead at `tip`, pointing along `dir` (screen space). */
function arrowhead(tip: P2, dir: P2, size: number): string {
  const l = Math.hypot(dir.x, dir.y) || 1;
  const ux = dir.x / l;
  const uy = dir.y / l;
  const side = (s: number) => ({ x: tip.x - size * (ux * Math.cos(0.5) - s * uy * Math.sin(0.5)), y: tip.y - size * (uy * Math.cos(0.5) + s * ux * Math.sin(0.5)) });
  return `M${pt(side(1))}L${pt(tip)}L${pt(side(-1))}`;
}

export function drawLine(line: Line, view: View, theme: Theme): LineDraw {
  const width = line.width ?? theme.lineWidth;
  const color = line.color ?? theme.guide;
  let d = '';
  let nodes = '';
  let end: { tip: P2; dir: P2 } | null = null;
  const pts: P2[] = [];
  if (line.kind === 'circle') {
    const R = rotation(...line.rotation);
    const ax = apply3(R, [1, 0, 0]);
    const az = apply3(R, [0, 0, 1]);
    const whole = Math.abs(line.to - line.from) >= 1 - 1e-9;
    const a0 = 2 * Math.PI * line.from;
    const a1 = 2 * Math.PI * line.to;
    const segs = arc3(line.center, ax, az, line.radius, a0, a1);
    for (let k = 0; k <= 24; k++) {
      const a = a0 + ((a1 - a0) * k) / 24;
      pts.push(project(view, add(add(line.center, ax, line.radius * Math.cos(a)), az, line.radius * Math.sin(a))));
    }
    d = bezPath(view, segs, whole);
    const last = segs[segs.length - 1];
    if (last && !whole) {
      const tip = project(view, last[3]);
      const c2 = project(view, last[2]);
      end = { tip, dir: { x: tip.x - c2.x, y: tip.y - c2.y } };
    }
    if (line.nodes !== 'none')
      for (const f of line.nodeAt) {
        const a = 2 * Math.PI * f;
        const p = add(add(line.center, ax, line.radius * Math.cos(a)), az, line.radius * Math.sin(a));
        nodes += node(view, p, ax, az, line.nodeSize, line.nodes);
      }
  } else {
    const scr = line.points.map(p => project(view, p));
    pts.push(...scr);
    if (scr.length) d = `M${scr.map(pt).join('L')}${line.closed ? 'Z' : ''}`;
    if (scr.length > 1 && !line.closed) {
      const tip = scr[scr.length - 1]!;
      const prev = scr[scr.length - 2]!;
      end = { tip, dir: { x: tip.x - prev.x, y: tip.y - prev.y } };
    }
    if (line.nodes !== 'none') {
      const which = line.nodeAt.length ? line.nodeAt : line.points.map((_, i) => i);
      for (const i of which) {
        const p = line.points[Math.round(i)];
        if (p) nodes += node(view, p, [1, 0, 0], [0, 0, 1], line.nodeSize, line.nodes);
      }
    }
  }
  if (line.arrow && end) d += arrowhead(end.tip, end.dir, Math.max(3, width * 7));
  /* width 0: nodes only */
  if (line.width === 0) d = '';
  return {
    id: line.id,
    d,
    color,
    width,
    opacity: line.opacity,
    dash: line.dash ? `${num(line.dash, 2)} ${num(line.dash * 0.8, 2)}` : null,
    nodes,
    nodeFill: line.nodeFill === 'solid' ? color : theme.background,
    nodeStroke: line.nodeFill === 'solid' ? null : color,
    layer: line.layer,
    pts,
  };
}
