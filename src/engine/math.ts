/* Small vector and camera maths for the line-art engine.

   World space: Y is up, the ground is the XZ plane. The camera is
   orthographic and is set by two angles: yaw turns it round the Y axis and
   pitch lifts it above the ground. Linear's figures are drawn at yaw 45° and
   pitch 30°, where both ground axes leave the screen at a 2:1 slope (the
   "2:1 isometric" of pixel art); true isometric is pitch 35.264°. */

export type P2 = { x: number; y: number };
export type V3 = [number, number, number];
/** a 3×3 matrix, row-major */
export type M3 = [number, number, number, number, number, number, number, number, number];

export const DEG = Math.PI / 180;
export const TAU = Math.PI * 2;
export const EPS = 1e-9;

export const p2 = (x: number, y: number): P2 => ({ x, y });
export const add2 = (a: P2, b: P2): P2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub2 = (a: P2, b: P2): P2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul2 = (a: P2, k: number): P2 => ({ x: a.x * k, y: a.y * k });
export const dot2 = (a: P2, b: P2) => a.x * b.x + a.y * b.y;
export const cross2 = (a: P2, b: P2) => a.x * b.y - a.y * b.x;
export const len2 = (a: P2) => Math.hypot(a.x, a.y);
export const norm2 = (a: P2): P2 => {
  const l = len2(a);
  return l < EPS ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);

export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const mulM3 = (a: M3, b: M3): M3 => [
  a[0] * b[0] + a[1] * b[3] + a[2] * b[6], a[0] * b[1] + a[1] * b[4] + a[2] * b[7], a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
  a[3] * b[0] + a[4] * b[3] + a[5] * b[6], a[3] * b[1] + a[4] * b[4] + a[5] * b[7], a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
  a[6] * b[0] + a[7] * b[3] + a[8] * b[6], a[6] * b[1] + a[7] * b[4] + a[8] * b[7], a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
];
export const apply3 = (m: M3, v: V3): V3 => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
/** the transpose, which for a rotation is its inverse */
export const applyT3 = (m: M3, v: V3): V3 => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
];

/** An object's rotation from its Euler angles in degrees: R = Ry · Rx · Rz (roll, then tilt, then turn). */
export function rotation(rx: number, ry: number, rz: number): M3 {
  const [cx, sx] = [Math.cos(rx * DEG), Math.sin(rx * DEG)];
  const [cy, sy] = [Math.cos(ry * DEG), Math.sin(ry * DEG)];
  const [cz, sz] = [Math.cos(rz * DEG), Math.sin(rz * DEG)];
  const Rx: M3 = [1, 0, 0, 0, cx, -sx, 0, sx, cx];
  const Ry: M3 = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
  const Rz: M3 = [cz, -sz, 0, sz, cz, 0, 0, 0, 1];
  return mulM3(Ry, mulM3(Rx, Rz));
}

export interface Camera {
  /** degrees round the Y axis; 45 looks at a box's corner */
  yaw: number;
  /** degrees above the ground; 30 is Linear's 2:1, 35.264 true isometric */
  pitch: number;
  /** artboard units per world unit */
  zoom: number;
  /** where the world's origin sits, in artboard units from the artboard's centre */
  panX: number;
  panY: number;
}

/** The camera, worked out for one artboard: screen = O + zoom·(r0·p, r1·p); depth = v·p (larger is nearer). */
export interface View {
  r0: V3;
  r1: V3;
  /** the direction from the scene towards the camera */
  v: V3;
  zoom: number;
  ox: number;
  oy: number;
}

export function makeView(cam: Camera, width: number, height: number): View {
  const ps = Math.sin(cam.yaw * DEG);
  const pc = Math.cos(cam.yaw * DEG);
  const ts = Math.sin(cam.pitch * DEG);
  const tc = Math.cos(cam.pitch * DEG);
  return {
    r0: [pc, 0, -ps],
    r1: [ps * ts, -tc, pc * ts],
    v: [ps * tc, ts, pc * tc],
    zoom: cam.zoom,
    ox: width / 2 + cam.panX,
    oy: height / 2 + cam.panY,
  };
}

export const project = (view: View, p: V3): P2 => ({
  x: view.ox + view.zoom * dot3(view.r0, p),
  y: view.oy + view.zoom * dot3(view.r1, p),
});
export const depth = (view: View, p: V3) => dot3(view.v, p);

/** The point on the depth-0 plane under an artboard point, for casting rays back into the scene. */
export function unproject(view: View, q: P2): V3 {
  const sx = (q.x - view.ox) / view.zoom;
  const sy = (q.y - view.oy) / view.zoom;
  return [sx * view.r0[0] + sy * view.r1[0], sx * view.r0[1] + sy * view.r1[1], sx * view.r0[2] + sy * view.r1[2]];
}

/** Convex hull (monotone chain), counter-clockwise in screen terms (y down reads clockwise on screen). */
export function hull(points: P2[]): P2[] {
  const pts = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  if (pts.length < 3) return pts;
  const cross = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: P2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 1e-12) lower.pop();
    lower.push(p);
  }
  const upper: P2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i]!;
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 1e-12) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

export function polygonArea(poly: P2[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function centroid(poly: P2[]): P2 {
  const a = polygonArea(poly);
  if (Math.abs(a) < 1e-9) {
    const s = poly.reduce((acc, p) => add2(acc, p), p2(0, 0));
    return mul2(s, 1 / Math.max(1, poly.length));
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const f = p.x * q.y - q.x * p.y;
    cx += (p.x + q.x) * f;
    cy += (p.y + q.y) * f;
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

/** Clip a polygon by a convex polygon (Sutherland–Hodgman). Both may wind either way. */
export function clipConvex(subject: P2[], clip: P2[]): P2[] {
  if (subject.length < 3 || clip.length < 3) return [];
  const sign = polygonArea(clip) >= 0 ? 1 : -1;
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i]!;
    const b = clip[(i + 1) % clip.length]!;
    const inside = (p: P2) => sign * cross2(sub2(b, a), sub2(p, a)) >= -1e-9;
    const input = out;
    out = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j]!;
      const q = input[(j + 1) % input.length]!;
      const pin = inside(p);
      const qin = inside(q);
      if (pin) out.push(p);
      if (pin !== qin) {
        const d = sub2(q, p);
        const e = sub2(b, a);
        const den = cross2(e, d);
        if (Math.abs(den) > 1e-12) {
          const t = cross2(sub2(a, p), e) / -den;
          out.push(add2(p, mul2(d, t)));
        }
      }
    }
  }
  return out;
}

export function pointInPolygon(p: P2, poly: P2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/** Signed distance from a point to a convex polygon's inside (positive inside), either winding. */
export function insideDepth(p: P2, poly: P2[]): number {
  const sign = polygonArea(poly) >= 0 ? 1 : -1;
  let d = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]!;
    const b = poly[(i + 1) % poly.length]!;
    const e = sub2(b, a);
    const l = len2(e);
    if (l < EPS) continue;
    d = Math.min(d, (sign * cross2(e, sub2(p, a))) / l);
  }
  return d;
}
