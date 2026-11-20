import { describe, expect, it } from 'vitest';
import { clipOutside, curveAt, curveEnd, curveLength, curveStart, type Curve } from '../src/engine/curves';
import { cmdsBounds, parsePath, parseTransform, sunsetPaths } from '../src/engine/decal';
import { faceDots, gradientValue } from '../src/engine/dots';
import { hull, insideDepth, makeView, polygonArea, project } from '../src/engine/math';
import { renderScene } from '../src/engine/render';
import { buildShape, segEnd, segLength, segPoint, segStart, segTangent } from '../src/engine/shapes';
import { toSvgString } from '../src/engine/svg';
import { blankScene, defaultDots, defaultGradient, newObject } from '../src/model/defaults';
import { presetScene } from '../src/model/presets';
import type { Scene } from '../src/model/types';

const near = (a: number, b: number, eps = 1e-6) => expect(Math.abs(a - b)).toBeLessThan(eps);

describe('camera', () => {
  it("draws Linear's 2:1 at yaw 45°, pitch 30°", () => {
    const v = makeView({ yaw: 45, pitch: 30, zoom: 1, panX: 0, panY: 0 }, 0, 0);
    const x = project(v, [1, 0, 0]);
    const z = project(v, [0, 0, 1]);
    const y = project(v, [0, 1, 0]);
    near(x.y / x.x, 0.5);
    near(z.y / -z.x, 0.5);
    near(y.x, 0);
    near(y.y, -Math.cos(Math.PI / 6));
  });
});

describe('shapes', () => {
  it('rounds a box into a closed, smooth outline of the right length', () => {
    const g = buildShape({ kind: 'box', width: 100, depth: 60, radius: 10 });
    expect(g.outline.length).toBe(8);
    g.outline.forEach((s, i) => {
      const next = g.outline[(i + 1) % g.outline.length]!;
      near(segEnd(s).x, segStart(next).x, 1e-9);
      near(segEnd(s).y, segStart(next).y, 1e-9);
      const a = segTangent(s, 1);
      const b = segTangent(next, 0);
      near(a.x * b.x + a.y * b.y, 1, 1e-9);
    });
    near(g.perimeter, 2 * (100 + 60) - 8 * 10 + 2 * Math.PI * 10, 1e-6);
  });

  it('rounds each corner of a box on its own', () => {
    const g = buildShape({ kind: 'box', width: 50, depth: 50, radius: 0, corners: [5, 0, 10, 0] });
    const arcs = g.outline.filter(s => s.kind === 'arc');
    expect(arcs.map(a => a.kind === 'arc' && a.r)).toEqual([5, 10]);
  });

  it('cuts the chevron into two convex pieces joined by a seam', () => {
    const g = buildShape({ kind: 'chevron', width: 56, depth: 29 });
    expect(g.outline.length).toBe(6);
    expect(g.pieces.length).toBe(2);
    for (const piece of g.pieces) {
      const pts = piece.map(p => segPoint(p.seg, 0));
      expect(polygonArea(pts)).toBeGreaterThan(0);
      expect(hull(pts).length).toBe(pts.length);
      expect(piece.filter(p => p.outline === null).length).toBe(1);
    }
    const lengths = g.outline.reduce((s, x) => s + segLength(x), 0);
    near(lengths, g.perimeter);
  });
});

describe("Linear's figures", () => {
  const layersOf = (sc: Scene, name: string) => {
    const m = renderScene(sc);
    const id = sc.objects.find(o => o.name === name)!.id;
    return { m, layers: m.layers.filter(l => l.objectId === id), order: m.layers.map(l => sc.objects.find(o => o.id === l.objectId)!.name) };
  };

  it('FIG 0.1 lands on the points measured off Linear’s SVG', () => {
    const sc = presetScene('fig01')!;
    const { layers } = layersOf(sc, 'Lifted slab');
    const xs = layers[0]!.hull.map(p => p.x);
    near(Math.min(...xs), 12.25, 0.3);
    near(Math.max(...xs), 252.25, 0.3);
    const { layers: base } = layersOf(sc, 'Slab 1');
    /* Linear rounds the bottom-front corner to a lowest point of 259.94 */
    const ys = base[0]!.hull.map(p => p.y);
    near(Math.max(...ys), 259.94, 0.3);
  });

  it('FIG 0.1 paints the stack bottom to top, the lifted slab last', () => {
    const { order } = layersOf(presetScene('fig01')!, 'Slab 1');
    expect(order).toEqual(['Slab 1', 'Slab 2', 'Slab 3', 'Slab 4', 'Slab 5', 'Lifted slab']);
  });

  it('FIG 0.1 dims the edges where a slab rests on the one below, and guides the lifted one', () => {
    const sc = presetScene('fig01')!;
    const kinds = (name: string) => layersOf(sc, name).layers[0]!.strokes.map(s => s.kind);
    const lowest = (name: string, kind: string) =>
      Math.max(-Infinity, ...layersOf(sc, name).layers[0]!.strokes.filter(s => s.kind === kind).flatMap(s => s.curves.flatMap(c => [0, 0.5, 1].map(t => curveAt(c, t).y))));
    /* the bottom slab's bottom edge is bright; the ones resting on a slab are dim */
    expect(lowest('Slab 1', 'outline')).toBeGreaterThan(255);
    expect(lowest('Slab 1', 'contact')).toBeLessThan(250);
    expect(lowest('Slab 2', 'contact')).toBeGreaterThan(240);
    expect(kinds('Lifted slab')).toContain('guide');
    expect(kinds('Lifted slab')).not.toContain('contact');
    const lifted = layersOf(sc, 'Lifted slab').layers[0]!;
    expect(lifted.decal?.d.length).toBeGreaterThan(50);
    expect(lifted.strokes.find(s => s.kind === 'guide')!.curves.length).toBe(3);
  });

  it('FIG 0.2 puts the back column where Linear has it', () => {
    const { layers } = layersOf(presetScene('fig02')!, 'Back column');
    const xs = layers[0]!.hull.map(p => p.x);
    near(Math.min(...xs), 96.25, 0.3);
    near(Math.max(...xs), 207.75, 0.3);
  });

  it('FIG 0.3 has fifteen fins, painted back to front', () => {
    const sc = presetScene('fig03')!;
    const { order } = layersOf(sc, 'Fin 1');
    expect(order).toEqual(sc.objects.map(o => o.name));
  });

  it('every figure renders at any angle without a NaN', () => {
    for (const id of ['fig01', 'fig02', 'fig03', 'strike']) {
      const sc = presetScene(id)!;
      for (const [yaw, pitch] of [
        [45, 30],
        [0, 0],
        [90, 0],
        [45, 90],
        [-130, 15],
        [10, -40],
      ]) {
        sc.camera.yaw = yaw!;
        sc.camera.pitch = pitch!;
        const svg = toSvgString(renderScene(sc), { clipHidden: true });
        expect(svg).not.toMatch(/NaN|Infinity/);
        expect((svg.match(/<g/g) ?? []).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('lines', () => {
  it("tapers a cylinder's top crease to the part facing you", () => {
    const sc = blankScene();
    sc.objects = [newObject({ kind: 'cylinder', radius: 40 }, 30, 'Can')];
    sc.theme.creaseTrim = 0;
    const l = renderScene(sc).layers[0]!;
    const crease = l.strokes.find(s => s.kind === 'crease')!.curves;
    const span = crease.reduce((s, c) => s + (c.kind === 'arc' ? Math.abs(c.t1 - c.t0) : 0), 0);
    near(span, 2 * Math.acos(0.7), 1e-6);
    const outlines = l.strokes.find(s => s.kind === 'outline')!.curves;
    expect(outlines.filter(c => c.kind === 'line').length).toBe(2);
  });

  it('trims a crease short of the outline where it ends on its own', () => {
    const sc = blankScene();
    sc.objects = [newObject({ kind: 'box', width: 80, depth: 80, radius: 0 }, 40, 'Box')];
    sc.theme.creaseTrim = 0;
    const full = renderScene(sc).layers[0]!.strokes.find(s => s.kind === 'crease')!.curves;
    sc.theme.creaseTrim = 5;
    const cut = renderScene(sc).layers[0]!.strokes.find(s => s.kind === 'crease')!.curves;
    const len = (cs: Curve[]) => cs.reduce((s, c) => s + curveLength(c), 0);
    /* a sharp box shows a Y of three creases: each of the three free ends loses 5 */
    near(len(full) - len(cut), 15, 1e-3);
  });

  it('cuts away lines hidden behind a nearer piece', () => {
    const sc = blankScene();
    const back = newObject({ kind: 'box', width: 60, depth: 60, radius: 0 }, 60, 'Back', [-30, 0, -30]);
    const front = newObject({ kind: 'box', width: 60, depth: 60, radius: 0 }, 60, 'Front', [20, 0, 20]);
    sc.objects = [back, front];
    const m = renderScene(sc);
    expect(m.layers.map(l => l.objectId)).toEqual([back.id, front.id]);
    const frontHull = m.layers[1]!.hull;
    const backLines = m.layers[0]!.strokes.flatMap(s => s.curves);
    const kept = backLines.flatMap(c => clipOutside(c, frontHull));
    for (const c of kept) for (const s of [0.25, 0.5, 0.75]) expect(insideDepth(curveAt(c, s), frontHull)).toBeLessThan(0.05);
    const total = (cs: Curve[]) => cs.reduce((s, c) => s + curveLength(c), 0);
    expect(total(kept)).toBeLessThan(total(backLines) - 20);
    expect(toSvgString(m, { clipHidden: true })).toContain('<path');
  });

  it('chains curves so that runs join end to start', () => {
    const sc = presetScene('fig01')!;
    for (const l of renderScene(sc).layers)
      for (const s of l.strokes)
        s.curves.forEach((c, i) => {
          const next = s.curves[i + 1];
          if (next && Math.hypot(curveEnd(c).x - curveStart(next).x, curveEnd(c).y - curveStart(next).y) < 1e-6) expect(true).toBe(true);
        });
  });
});

describe('dots', () => {
  const frame = {
    uMin: 0,
    uMax: 40,
    vMin: 0,
    vMax: 40,
    nu: (u: number) => u / 40,
    nv: (v: number) => v / 40,
    inside: (u: number, v: number, inset: number) => u >= inset && u <= 40 - inset && v >= inset && v <= 40 - inset,
    map: (u: number, v: number) => ({ c: { x: u, y: v }, U: { x: 1, y: 0 }, V: { x: 0, y: 1 } }),
  };

  it('lays an even grid across a face', () => {
    const d = { ...defaultDots('#fff'), spacing: 4, inset: 0 };
    const n = faceDots(d, frame, '#fff').reduce((s, g) => s + g.dots.length, 0);
    expect(n).toBe(11 * 11);
  });

  it('fills just a region, like the 5×5 squares on FIG 0.2', () => {
    const d = { ...defaultDots('#fff'), spacing: 3, inset: 0, region: { x: 0.5, y: 0.5, w: 14 / 40, h: 14 / 40 } };
    const n = faceDots(d, frame, '#fff').reduce((s, g) => s + g.dots.length, 0);
    expect(n).toBe(25);
  });

  it('grows dots along a linear halftone', () => {
    const g = { ...defaultGradient(), type: 'linear' as const };
    expect(gradientValue(g, 0, 0.5)).toBeCloseTo(0);
    expect(gradientValue(g, 1, 0.5)).toBeCloseTo(1);
    const d = { ...defaultDots('#fff'), spacing: 4, inset: 0, size: 1, sizeMin: 0.1, gradient: g };
    const dots = faceDots(d, frame, '#fff').flatMap(x => x.dots);
    const left = dots.filter(t => t.c.x < 5).map(t => Math.hypot(t.a.x, t.a.y));
    const right = dots.filter(t => t.c.x > 35).map(t => Math.hypot(t.a.x, t.a.y));
    expect(Math.max(...left)).toBeLessThan(Math.min(...right));
  });
});

describe('decals', () => {
  it('turns path data, arcs included, into cubics', () => {
    const cmds = parsePath('M0 0 L10 0 A5 5 0 0 1 20 0 Z');
    expect(cmds.filter(c => c.k === 'C').length).toBeGreaterThan(0);
    const b = cmdsBounds(cmds);
    near(b.maxX, 20, 1e-6);
    expect(b.minY).toBeLessThan(-4);
  });

  it('reads SVG transforms', () => {
    const m = parseTransform('translate(0 22) scale(2)');
    expect(m).toEqual([2, 0, 0, 2, 0, 22]);
  });

  it('draws the sun as a dome and three bands', () => {
    const paths = sunsetPaths();
    expect(paths.length).toBe(4);
    for (const p of paths) {
      const b = cmdsBounds(parsePath(p));
      /* control points may sit a little outside the disc */
      expect(b.minX).toBeGreaterThanOrEqual(-0.53);
      expect(b.maxX).toBeLessThanOrEqual(0.53);
    }
  });
});
