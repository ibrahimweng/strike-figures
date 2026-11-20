import { describe, expect, it } from 'vitest';
import { faceDots } from '../src/engine/dots';
import { polygonArea } from '../src/engine/math';
import { renderScene } from '../src/engine/render';
import { buildShape, convexPieces, segPoint } from '../src/engine/shapes';
import { toSvgString } from '../src/engine/svg';
import { textCmds, textWidth } from '../src/engine/text';
import { LIBRARY, libraryScene } from '../src/library';
import { C, DATA_COLOURS, gearPoints } from '../src/library/kit';
import { defaultDots } from '../src/model/defaults';

describe('free-form outlines', () => {
  it('cuts a concave outline into convex pieces that cover it', () => {
    const L: [number, number][] = [
      [0, 0],
      [60, 0],
      [60, 20],
      [20, 20],
      [20, 60],
      [0, 60],
    ];
    const g = buildShape({ kind: 'outline', points: L, radius: 0 });
    expect(g.pieces.length).toBeGreaterThanOrEqual(2);
    const area = g.pieces.reduce((s, pc) => s + polygonArea(pc.map(p => segPoint(p.seg, 0))), 0);
    expect(area).toBeCloseTo(60 * 20 + 20 * 40, 6);
    for (const pc of g.pieces) {
      const pts = pc.map(p => segPoint(p.seg, 0));
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        const c = pts[(i + 2) % pts.length]!;
        expect((b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x)).toBeGreaterThanOrEqual(-1e-9);
      }
    }
  });

  it('rounds only the outward corners of a gear', () => {
    const g = buildShape({ kind: 'outline', points: gearPoints(10, 50, 40), radius: 1 });
    expect(g.outline.filter(s => s.kind === 'arc').length).toBe(20);
    expect(g.pieces.length).toBeGreaterThan(1);
  });

  it('keeps big pie slices convex by cutting them in two', () => {
    expect(buildShape({ kind: 'sector', radius: 40, start: 0, sweep: 90 }).pieces.length).toBe(1);
    expect(buildShape({ kind: 'sector', radius: 40, start: 0, sweep: 270 }).pieces.length).toBe(2);
    expect(convexPieces([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }]).length).toBe(1);
  });
});

describe('dot masks', () => {
  const frame = {
    uMin: 0,
    uMax: 40,
    vMin: 0,
    vMax: 40,
    nu: (u: number) => u / 40,
    nv: (v: number) => v / 40,
    inside: () => true,
    map: (u: number, v: number) => ({ c: { x: u, y: v }, U: { x: 1, y: 0 }, V: { x: 0, y: 1 } }),
  };

  it('keeps dots below a curve and greys out the rest', () => {
    const d = { ...defaultDots('#10B981'), spacing: 4, inset: 0, mask: { mode: 'below' as const, points: [[0, 0.5], [1, 0.5]] as [number, number][], altColor: '#E4E5E9', altOpacity: 0.2 } };
    const groups = faceDots(d, frame, '#10B981');
    const green = groups.filter(g => g.color === '#10B981').flatMap(g => g.dots);
    const grey = groups.filter(g => g.color === '#E4E5E9').flatMap(g => g.dots);
    expect(green.every(t => t.c.y <= 20)).toBe(true);
    expect(grey.every(t => t.c.y > 20)).toBe(true);
    expect(green.length + grey.length).toBe(121);
  });
});

describe('labels', () => {
  it('sets text in Geist outlines, centred when asked, spaced by each letter and kerned', () => {
    const cmds = textCmds('382.5', 'middle');
    const xs = cmds.flatMap(c => (c.k === 'Z' ? [] : [c.p.x]));
    expect(Math.min(...xs)).toBeLessThan(-0.5);
    expect(Math.max(...xs)).toBeGreaterThan(0.5);
    /* proportional: an i is narrower than an M */
    expect(textWidth('i')).toBeLessThan(textWidth('M') * 0.6);
    /* kerned: AV sits closer than A and V apart */
    expect(textWidth('AV')).toBeLessThan(textWidth('A') + textWidth('V'));
    /* Medium is a touch wider than Regular */
    expect(textWidth('AMZN', 0, 'medium')).toBeGreaterThan(textWidth('AMZN'));
  });
});

describe('the library', () => {
  it('has sixty-five illustrations: 17 data, 17 options, 16 tech, 15 from the brand book', () => {
    expect(LIBRARY.length).toBe(65);
    const count = (c: string) => LIBRARY.filter(x => x.category === c).length;
    expect([count('data'), count('options'), count('tech'), count('brand')]).toEqual([17, 17, 16, 15]);
    expect(new Set(LIBRARY.map(x => x.id)).size).toBe(65);
  });

  it('draws every illustration by the house rules', () => {
    const allowed = new Set([C.line, C.mid, C.dim, C.faint, C.grey, C.emerald, C.bright, C.pale, C.deep, '#0C0C0C', '#000']);
    const data = new Set(Object.values(DATA_COLOURS).map(c => c.toUpperCase()));
    for (const item of LIBRARY) {
      const sc = libraryScene(item.id)!;
      const infographic = item.tags.includes('infographic');
      /* the 2:1 view, or flat (straight down); the globe looks a little lower */
      const view = `${sc.camera.yaw}/${sc.camera.pitch}`;
      expect(['45/30', '0/90', '45/18'], item.id).toContain(view);
      expect(sc.artboard, item.id).toEqual({ width: 320, height: 320 });
      /* labels: three at most, except infographics, which name every series (a ticker is two lines) */
      if (!infographic) expect(sc.labels.filter(l => l.weight === 'medium' || !l.offset).length, item.id).toBeLessThanOrEqual(3);
      const svg = toSvgString(renderScene(sc), { clipHidden: true });
      expect(svg, item.id).not.toMatch(/NaN|Infinity/);
      const colours = [...svg.matchAll(/(?:fill|stroke)="(#[0-9A-Fa-f]{3,6})"/g)].map(m => m[1]!.toUpperCase());
      for (const c of colours) expect(allowed.has(c) || allowed.has(c.toLowerCase()) || (infographic && data.has(c)), `${item.id} uses ${c}`).toBe(true);
    }
  });

  it('keeps every illustration inside its frame', () => {
    for (const item of LIBRARY) {
      const m = renderScene(libraryScene(item.id)!);
      const pts = m.layers.flatMap(l => l.hull);
      expect(Math.min(...pts.map(p => p.x)), item.id).toBeGreaterThan(0);
      expect(Math.max(...pts.map(p => p.x)), item.id).toBeLessThan(320);
      expect(Math.min(...pts.map(p => p.y)), item.id).toBeGreaterThan(0);
      expect(Math.max(...pts.map(p => p.y)), item.id).toBeLessThan(320);
    }
  });
});
