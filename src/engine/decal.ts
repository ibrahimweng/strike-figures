/* Decals: a mark laid flat on a top face, like the sun on Linear's FIG 0.1
   or the Strike logo. Marks are SVG path data in a 1×1 box centred on 0;
   every curve is turned into cubic Béziers, which an orthographic camera
   maps exactly, so the mark stays crisp at any angle. */
import type { P2 } from './math';

export type Cmd = { k: 'M'; p: P2 } | { k: 'L'; p: P2 } | { k: 'C'; c1: P2; c2: P2; p: P2 } | { k: 'Z' };

/** Arc to cubics (SVG implementation notes, F.6). */
function arcToCubics(p0: P2, rx: number, ry: number, phiDeg: number, large: boolean, sweep: boolean, p: P2): Cmd[] {
  if (rx === 0 || ry === 0) return [{ k: 'L', p }];
  const phi = (phiDeg * Math.PI) / 180;
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const dx = (p0.x - p.x) / 2;
  const dy = (p0.y - p.y) / 2;
  const x1 = cp * dx + sp * dy;
  const y1 = -sp * dx + cp * dy;
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const lam = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const num = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const den = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  let co = Math.sqrt(Math.max(0, num / den));
  if (large === sweep) co = -co;
  const cx1 = (co * rx * y1) / ry;
  const cy1 = (-co * ry * x1) / rx;
  const cx = cp * cx1 - sp * cy1 + (p0.x + p.x) / 2;
  const cy = sp * cx1 + cp * cy1 + (p0.y + p.y) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const t1 = ang(1, 0, (x1 - cx1) / rx, (y1 - cy1) / ry);
  let dt = ang((x1 - cx1) / rx, (y1 - cy1) / ry, (-x1 - cx1) / rx, (-y1 - cy1) / ry);
  if (!sweep && dt > 0) dt -= 2 * Math.PI;
  if (sweep && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2)));
  const step = dt / n;
  const k = (4 / 3) * Math.tan(step / 4);
  const out: Cmd[] = [];
  const at = (t: number) => ({
    x: cx + rx * Math.cos(t) * cp - ry * Math.sin(t) * sp,
    y: cy + rx * Math.cos(t) * sp + ry * Math.sin(t) * cp,
  });
  const d = (t: number) => ({
    x: -rx * Math.sin(t) * cp - ry * Math.cos(t) * sp,
    y: -rx * Math.sin(t) * sp + ry * Math.cos(t) * cp,
  });
  for (let i = 0; i < n; i++) {
    const a = t1 + i * step;
    const b = a + step;
    const pa = at(a);
    const pb = i === n - 1 ? p : at(b);
    const da = d(a);
    const db = d(b);
    out.push({ k: 'C', c1: { x: pa.x + k * da.x, y: pa.y + k * da.y }, c2: { x: pb.x - k * db.x, y: pb.y - k * db.y }, p: pb });
  }
  return out;
}

/** Parse SVG path data into absolute moves, lines, cubics and closes. */
export function parsePath(d: string): Cmd[] {
  const out: Cmd[] = [];
  const tokens = d.match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? [];
  let i = 0;
  let cur: P2 = { x: 0, y: 0 };
  let start: P2 = { x: 0, y: 0 };
  let lastC2: P2 | null = null;
  let lastQ: P2 | null = null;
  let cmd = '';
  const n = () => Number(tokens[i++]);
  const isNum = () => i < tokens.length && !/^[a-zA-Z]$/.test(tokens[i]!);
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i]!)) cmd = tokens[i++]!;
    else if (!cmd) {
      i++;
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    const ox = rel ? cur.x : 0;
    const oy = rel ? cur.y : 0;
    if (C === 'Z') {
      out.push({ k: 'Z' });
      cur = start;
      lastC2 = lastQ = null;
      continue;
    }
    if (!isNum()) {
      i++;
      continue;
    }
    switch (C) {
      case 'M': {
        cur = { x: ox + n(), y: oy + n() };
        start = cur;
        out.push({ k: 'M', p: cur });
        cmd = rel ? 'l' : 'L';
        lastC2 = lastQ = null;
        break;
      }
      case 'L':
        cur = { x: ox + n(), y: oy + n() };
        out.push({ k: 'L', p: cur });
        lastC2 = lastQ = null;
        break;
      case 'H':
        cur = { x: ox + n(), y: cur.y };
        out.push({ k: 'L', p: cur });
        lastC2 = lastQ = null;
        break;
      case 'V':
        cur = { x: cur.x, y: oy + n() };
        out.push({ k: 'L', p: cur });
        lastC2 = lastQ = null;
        break;
      case 'C': {
        const c1 = { x: ox + n(), y: oy + n() };
        const c2 = { x: ox + n(), y: oy + n() };
        const p = { x: ox + n(), y: oy + n() };
        out.push({ k: 'C', c1, c2, p });
        cur = p;
        lastC2 = c2;
        lastQ = null;
        break;
      }
      case 'S': {
        const c1 = lastC2 ? { x: 2 * cur.x - lastC2.x, y: 2 * cur.y - lastC2.y } : cur;
        const c2 = { x: ox + n(), y: oy + n() };
        const p = { x: ox + n(), y: oy + n() };
        out.push({ k: 'C', c1, c2, p });
        cur = p;
        lastC2 = c2;
        lastQ = null;
        break;
      }
      case 'Q':
      case 'T': {
        const q: P2 = C === 'Q' ? { x: ox + n(), y: oy + n() } : lastQ ? { x: 2 * cur.x - lastQ.x, y: 2 * cur.y - lastQ.y } : cur;
        const p = { x: ox + n(), y: oy + n() };
        out.push({
          k: 'C',
          c1: { x: cur.x + (2 / 3) * (q.x - cur.x), y: cur.y + (2 / 3) * (q.y - cur.y) },
          c2: { x: p.x + (2 / 3) * (q.x - p.x), y: p.y + (2 / 3) * (q.y - p.y) },
          p,
        });
        cur = p;
        lastQ = q;
        lastC2 = null;
        break;
      }
      case 'A': {
        const rx = n();
        const ry = n();
        const rot = n();
        const large = n() !== 0;
        const sweep = n() !== 0;
        const p = { x: ox + n(), y: oy + n() };
        out.push(...arcToCubics(cur, rx, ry, rot, large, sweep, p));
        cur = p;
        lastC2 = lastQ = null;
        break;
      }
      default:
        i++;
    }
  }
  return out;
}

export function cmdsToPath(cmds: Cmd[], f: (p: P2) => P2, places = 3): string {
  const r = (v: number) => {
    const k = 10 ** places;
    const x = Math.round(v * k) / k;
    return (Object.is(x, -0) ? 0 : x).toString();
  };
  const pt = (p: P2) => {
    const q = f(p);
    return `${r(q.x)} ${r(q.y)}`;
  };
  let out = '';
  for (const c of cmds) {
    if (c.k === 'M') out += `M${pt(c.p)}`;
    else if (c.k === 'L') out += `L${pt(c.p)}`;
    else if (c.k === 'C') out += `C${pt(c.c1)} ${pt(c.c2)} ${pt(c.p)}`;
    else out += 'Z';
  }
  return out;
}

export function cmdsBounds(cmds: Cmd[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const see = (p: P2) => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  };
  for (const c of cmds) {
    if (c.k === 'M' || c.k === 'L') see(c.p);
    else if (c.k === 'C') {
      see(c.c1);
      see(c.c2);
      see(c.p);
    }
  }
  return { minX, minY, maxX, maxY };
}

/** The sun of FIG 0.1: a disc whose top half is whole and whose lower half is cut into bands, 1 across. */
export function sunsetPaths(): string[] {
  const R = 0.5;
  const at = (y: number) => Math.sqrt(Math.max(0, 1 - y * y)) * R;
  const f = (v: number) => Number(v.toFixed(5));
  const horizon = 0.058;
  const xh = at(horizon);
  const dome = `M${f(-xh)} ${f(horizon * R)}A${R} ${R} 0 1 1 ${f(xh)} ${f(horizon * R)}Z`;
  const band = (y0: number, y1: number) => {
    const x0 = at(y0);
    const x1 = at(y1);
    return `M${f(-x0)} ${f(y0 * R)}L${f(x0)} ${f(y0 * R)}A${R} ${R} 0 0 1 ${f(x1)} ${f(y1 * R)}L${f(-x1)} ${f(y1 * R)}A${R} ${R} 0 0 1 ${f(-x0)} ${f(y0 * R)}Z`;
  };
  const x2 = at(0.819);
  const cap = `M${f(-x2)} ${f(0.819 * R)}L${f(x2)} ${f(0.819 * R)}A${R} ${R} 0 0 1 ${f(-x2)} ${f(0.819 * R)}Z`;
  return [dome, band(0.249, 0.374), band(0.522, 0.67), cap];
}

type Affine = [number, number, number, number, number, number];
const IDENT: Affine = [1, 0, 0, 1, 0, 0];
const compose = (m: Affine, n: Affine): Affine => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];

/** An SVG transform attribute as one affine matrix. */
export function parseTransform(t: string | null): Affine {
  let m: Affine = IDENT;
  if (!t) return m;
  for (const [, fn, args] of t.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = (args ?? '').trim().split(/[\s,]+/).filter(Boolean).map(Number);
    let n: Affine = IDENT;
    if (fn === 'translate') n = [1, 0, 0, 1, a[0] ?? 0, a[1] ?? 0];
    else if (fn === 'scale') n = [a[0] ?? 1, 0, 0, a[1] ?? a[0] ?? 1, 0, 0];
    else if (fn === 'matrix' && a.length === 6) n = a as Affine;
    else if (fn === 'rotate') {
      const r = ((a[0] ?? 0) * Math.PI) / 180;
      const [c, s] = [Math.cos(r), Math.sin(r)];
      const [cx, cy] = [a[1] ?? 0, a[2] ?? 0];
      n = compose(compose([1, 0, 0, 1, cx, cy], [c, s, -s, c, 0, 0]), [1, 0, 0, 1, -cx, -cy]);
    }
    m = compose(m, n);
  }
  return m;
}

const applyAffine = (m: Affine, p: P2): P2 => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });

function mapCmds(cmds: Cmd[], m: Affine): Cmd[] {
  return cmds.map(c =>
    c.k === 'Z' ? c : c.k === 'C' ? { k: 'C', c1: applyAffine(m, c.c1), c2: applyAffine(m, c.c2), p: applyAffine(m, c.p) } : { ...c, p: applyAffine(m, c.p) },
  );
}

/**
 * Read an SVG file's shapes into path data normalised to a 1×1 box centred on 0.
 * Paths, rects, circles, ellipses, lines, polylines and polygons are read, with their transforms and their groups'.
 */
export function importSvg(text: string): string[] {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const ds: string[] = [];
  const mats: Affine[] = [];
  const attr = (el: Element, a: string) => Number(el.getAttribute(a) ?? 0);
  doc.querySelectorAll('path, rect, circle, ellipse, line, polyline, polygon').forEach(el => {
    if (el.closest('defs, clipPath, mask')) return;
    let m: Affine = IDENT;
    for (let e: Element | null = el; e && e.tagName.toLowerCase() !== 'svg'; e = e.parentElement) m = compose(parseTransform(e.getAttribute('transform')), m);
    const before = ds.length;
    const tag = el.tagName.toLowerCase();
    if (tag === 'path') ds.push(el.getAttribute('d') ?? '');
    else if (tag === 'rect') {
      const [x, y, w, h] = [attr(el, 'x'), attr(el, 'y'), attr(el, 'width'), attr(el, 'height')];
      ds.push(`M${x} ${y}H${x + w}V${y + h}H${x}Z`);
    } else if (tag === 'circle' || tag === 'ellipse') {
      const cx = attr(el, 'cx');
      const cy = attr(el, 'cy');
      const rx = tag === 'circle' ? attr(el, 'r') : attr(el, 'rx');
      const ry = tag === 'circle' ? attr(el, 'r') : attr(el, 'ry');
      ds.push(`M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`);
    } else if (tag === 'line') {
      ds.push(`M${attr(el, 'x1')} ${attr(el, 'y1')}L${attr(el, 'x2')} ${attr(el, 'y2')}`);
    } else {
      const pts = (el.getAttribute('points') ?? '').trim().split(/[\s,]+/).map(Number);
      if (pts.length < 4) return;
      let d = `M${pts[0]} ${pts[1]}`;
      for (let i = 2; i + 1 < pts.length; i += 2) d += `L${pts[i]} ${pts[i + 1]}`;
      ds.push(tag === 'polygon' ? `${d}Z` : d);
    }
    if (ds.length > before) mats.push(m);
  });
  const parsed = ds.map((d, i) => mapCmds(parsePath(d), mats[i] ?? IDENT)).filter(c => c.length);
  const all = parsed.flat();
  if (!all.length) return [];
  const b = cmdsBounds(all);
  const size = Math.max(b.maxX - b.minX, b.maxY - b.minY) || 1;
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return parsed.map(cmds => cmdsToPath(cmds, p => ({ x: (p.x - cx) / size, y: (p.y - cy) / size }), 5));
}
