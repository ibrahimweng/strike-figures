import { describe, expect, it } from 'vitest';
import { lottie, parseColour, pathToBeziers } from '../src/anim/lottie';
import { frameCount, frameEl } from '../src/anim/motion';
import { animatedSvg, mergeFrames, xml } from '../src/anim/svgAnim';
import type { El } from '../src/engine/svg';
import { libraryScene } from '../src/library';
import type { Motion } from '../src/model/types';

const svg = (...children: El[]): El => ({
  tag: 'svg',
  attrs: { xmlns: 'http://www.w3.org/2000/svg', width: 100, height: 80, viewBox: '0 0 100 80', fill: 'none' },
  children,
});
const bg: El = { tag: 'rect', attrs: { width: 100, height: 80, fill: '#0C0C0C' } };
const fill = (d: string, color: string): El => ({ tag: 'path', attrs: { d, fill: color } });
const line = (d: string, color: string, extra: El['attrs'] = {}): El => ({
  tag: 'path',
  attrs: { d, stroke: color, 'stroke-width': 0.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none', ...extra },
});
const g = (...children: El[]): El => ({ tag: 'g', attrs: { 'data-object': 'x' }, children });

/** What the animated SVG shows at each frame: its painted elements in order, read back from the file. */
function replay(text: string, n: number): string[][] {
  const style = /<style>([\s\S]*?)<\/style>/.exec(text)?.[1] ?? '';
  const startsHidden = new Set([...style.matchAll(/\.(k\w+)\{animation-name:\w+;visibility:hidden\}/g)].map(m => m[1]!));
  const flips = new Map<string, Map<number, boolean>>();
  for (const m of style.matchAll(/@keyframes (k\w+)\{(.*?)\}\}/g)) {
    const at = new Map<number, boolean>();
    for (const b of m[2]!.split('}')) {
      const k = /^([\d.,%]+)\{visibility:(\w+)/.exec(b);
      for (const p of k?.[1]!.split(',') ?? []) at.set(Math.round((parseFloat(p) / 100) * n), k![2] === 'visible');
    }
    flips.set(m[1]!, at);
  }
  const shown = (cls: string, f: number) => {
    let v = !startsHidden.has(cls);
    for (let k = 1; k <= f; k++) v = flips.get(cls)!.get(k) ?? v;
    return v;
  };
  const body = text.split('\n').filter(l => /^<(?!svg|style|\/|defs)/.test(l));
  return Array.from({ length: n }, (_, f) =>
    body.flatMap(l => {
      const grp = /^<g class="(k\w+)">(.*)<\/g>$/.exec(l);
      if (grp) return shown(grp[1]!, f) ? grp[2]!.match(/<[^>]*\/>/g)! : [];
      const own = / class="(k\w+)"/.exec(l);
      if (own) return shown(own[1]!, f) ? [l.replace(own[0], '')] : [];
      return [l];
    }),
  );
}

/** A frame's painted elements, flattened, as the animated file writes them (filter ids aside). */
function painted(frame: El): string[] {
  const out: string[] = [];
  const walk = (el: El) => {
    for (const c of el.children ?? []) {
      if (c.tag === 'defs') continue;
      if (c.tag === 'g') walk(c);
      else out.push(xml(c));
    }
  };
  walk(frame);
  return out;
}
const noIds = (s: string) => s.replace(/url\(#[^)]+\)/g, 'url(#)');

function libraryFrames(id: string, kind: Motion['kind'], seconds: number, fps = 30): El[] {
  const sc = structuredClone(libraryScene(id)!);
  sc.motion = { kind, duration: seconds };
  const n = frameCount(sc, fps);
  return Array.from({ length: n }, (_, i) => frameEl(sc, i / n, { clipHidden: true, idPrefix: 'f' }));
}

describe('animated SVG', () => {
  const still = line('M10 10L90 10', '#D0D6E0');
  const moving = (k: number) => fill(`M${10 + k} 20L${30 + k} 20L${20 + k} 40Z`, '#10B981');
  const frames = [0, 1, 2, 3].map(k => svg(bg, g(still, moving(k))));

  it('writes what every frame shares once, unanimated, background first', () => {
    const out = animatedSvg(frames, 30);
    expect(out.split(xml(still)).length - 1).toBe(1);
    expect(out.split(xml(bg)).length - 1).toBe(1);
    const body = out.split('\n').filter(l => l.startsWith('<path') || l.startsWith('<rect') || l.startsWith('<g'));
    expect(body[0]).toBe(xml(bg));
    expect(body[1]).toBe(xml(still));
    expect(out).not.toContain('data-object');
    for (let k = 0; k < 4; k++) expect(out.split(`M${10 + k} 20`).length - 1).toBe(1);
  });

  it('shows an element only in its frames, with stepped keyframes over frames/fps seconds', () => {
    const spot = fill('M50 50L60 50L55 60Z', '#34D399');
    const seq = Array.from({ length: 8 }, (_, f) => svg(bg, still, ...(f === 2 || f === 3 ? [spot] : [])));
    const out = animatedSvg(seq, 4);
    expect(out).toContain('animation-duration:2s;animation-timing-function:step-end;animation-iteration-count:infinite');
    const cls = /<path [^>]*M50 50[^>]* class="(k\w+)"\/>/.exec(out)?.[1];
    expect(cls).toBeDefined();
    expect(out).toContain(`.${cls}{animation-name:${cls};visibility:hidden}`);
    expect(out).toContain(`@keyframes ${cls}{25%{visibility:visible}50%{visibility:hidden}}`);
    expect(replay(out, 8).map(f => f.length)).toEqual([2, 2, 3, 3, 2, 2, 2, 2]);
  });

  it('starts visible what frame 0 shows, so a still renderer sees frame 0', () => {
    const early = fill('M0 0L5 0L5 5Z', '#fff');
    const out = animatedSvg([svg(bg, early), svg(bg), svg(bg)], 30);
    const cls = / class="(k\w+)"/.exec(out)![1]!;
    expect(out).toContain(`.${cls}{animation-name:${cls}}`);
    expect(out).toContain(`@keyframes ${cls}{33.333%{visibility:hidden}}`);
  });

  it('keeps every frame in its own paint order when two shapes swap', () => {
    const a = fill('M0 0L50 0L50 50Z', '#111111');
    const b = fill('M10 0L60 0L60 50Z', '#222222');
    const c = line('M0 70L100 70', '#333333');
    const seq = [svg(bg, a, b, c), svg(bg, b, a, c), svg(bg, a, c, b), svg(bg, a, b, c)];
    const out = animatedSvg(seq, 30);
    expect(replay(out, 4)).toEqual(seq.map(painted));
  });

  it('dedupes identical shadow filters, renames them and keeps only those used', () => {
    const filter = (id: string, blur: number): El => ({ tag: 'filter', attrs: { id, x: 0, y: 0 }, children: [{ tag: 'feGaussianBlur', attrs: { in: 'SourceAlpha', stdDeviation: blur } }] });
    const shade = (id: string) => ({ tag: 'path', attrs: { d: 'M0 0L9 0L9 9Z', fill: '#000', filter: `url(#${id})` } });
    const seq = [
      svg({ tag: 'defs', attrs: {}, children: [filter('f-shadow-1', 4), filter('f-shadow-9', 2)] }, bg, shade('f-shadow-1')),
      svg({ tag: 'defs', attrs: {}, children: [filter('f-shadow-3', 4)] }, bg, shade('f-shadow-3')),
      svg({ tag: 'defs', attrs: {}, children: [filter('f-shadow-1', 8)] }, bg, shade('f-shadow-1')),
    ];
    const m = mergeFrames(seq);
    expect(m.defs.map(d => d.children![0]!.attrs.stdDeviation)).toEqual([4, 8]);
    const ids = m.defs.map(d => d.attrs.id);
    expect(new Set(ids).size).toBe(2);
    const refs = m.pieces.filter(p => p.el.attrs.filter).map(p => [p.el.attrs.filter, p.frames]);
    expect(refs).toEqual([
      [`url(#${ids[0]})`, [0, 1]],
      [`url(#${ids[1]})`, [2]],
    ]);
    expect(animatedSvg(seq, 30).match(/<filter /g)!.length).toBe(2);
  });

  it('plays real loops back frame for frame, and smaller than the frames', () => {
    for (const kind of ['drift', 'build', 'turn'] as const) {
      const seq = libraryFrames('bars', kind, 0.4);
      const out = animatedSvg(seq, 30);
      expect(replay(out, seq.length).map(f => f.map(noIds))).toEqual(seq.map(f => painted(f).map(noIds)));
      const naive = seq.reduce((s, f) => s + xml(f).length, 0);
      expect(out.length).toBeLessThan(naive);
    }
  });
});

describe('path to Lottie béziers', () => {
  const at = (b: ReturnType<typeof pathToBeziers>[number], k: number, t: number) => {
    const n = b.v.length;
    const p0 = b.v[k]!;
    const p3 = b.v[(k + 1) % n]!;
    const p1 = [p0[0] + b.o[k]![0], p0[1] + b.o[k]![1]];
    const p2 = [p3[0] + b.i[(k + 1) % n]![0], p3[1] + b.i[(k + 1) % n]![1]];
    const u = 1 - t;
    const f = (j: 0 | 1) => u * u * u * p0[j] + 3 * u * u * t * p1[j]! + 3 * u * t * t * p2[j]! + t * t * t * p3[j];
    return [f(0), f(1)] as const;
  };
  const samples = (b: ReturnType<typeof pathToBeziers>[number]) => {
    const out: (readonly [number, number])[] = [];
    const segs = b.c ? b.v.length : b.v.length - 1;
    for (let k = 0; k < segs; k++) for (let s = 0; s <= 200; s++) out.push(at(b, k, s / 200));
    return out;
  };
  type Pt = readonly [number, number];
  const toSeg = (p: Pt, a: Pt, b: Pt) => {
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  };
  /** the furthest any point of `pts` lies from the polyline `ref` */
  const gap = (pts: Pt[], ref: Pt[]) => {
    let worst = 0;
    for (const p of pts) {
      let best = Infinity;
      for (let k = 1; k < ref.length; k++) best = Math.min(best, toSeg(p, ref[k - 1]!, ref[k]!));
      worst = Math.max(worst, best);
    }
    return worst;
  };

  it('follows an elliptical arc to within 0.05, both ways round', () => {
    const [cx, cy, rx, ry, phi] = [160, 120, 120, 50, (30 * Math.PI) / 180];
    const pt = (t: number) =>
      [cx + rx * Math.cos(t) * Math.cos(phi) - ry * Math.sin(t) * Math.sin(phi), cy + rx * Math.cos(t) * Math.sin(phi) + ry * Math.sin(t) * Math.cos(phi)] as const;
    for (const [t0, t1] of [
      [0.3, 4.4],
      [2, 1.1],
      [-1, 0.2],
    ] as const) {
      const [a, b] = [pt(t0), pt(t1)];
      const large = Math.abs(t1 - t0) > Math.PI ? 1 : 0;
      const sweep = t1 > t0 ? 1 : 0;
      const shapes = pathToBeziers(`M${a[0]} ${a[1]}A${rx} ${ry} 30 ${large} ${sweep} ${b[0]} ${b[1]}`);
      expect(shapes.length).toBe(1);
      const bez = shapes[0]!;
      expect(bez.c).toBe(false);
      expect(bez.v.length - 1).toBe(Math.ceil(Math.abs(t1 - t0) / (Math.PI / 2)));
      const exact = Array.from({ length: 2001 }, (_, k) => pt(t0 + ((t1 - t0) * k) / 2000));
      const got = samples(bez);
      expect(gap(got, exact)).toBeLessThan(0.05);
      expect(gap(exact, got)).toBeLessThan(0.05);
    }
  });

  it('raises quadratics to cubics and splits subpaths', () => {
    const [shape, tri] = pathToBeziers('M0 0Q50 100 100 0M10 10L20 10L20 20Z');
    const quad = Array.from({ length: 101 }, (_, k) => {
      const t = k / 100;
      return [100 * t, 2 * (1 - t) * t * 100] as const;
    });
    expect(gap(samples(shape!), quad)).toBeLessThan(0.02);
    expect(tri).toEqual({ c: true, v: [[10, 10], [20, 10], [20, 20]], i: [[0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0]] });
  });

  it("drops a closed circle's repeated start vertex, keeping its tangent", () => {
    const [dot] = pathToBeziers('M12 10A2 2 0 0 1 8 10A2 2 0 0 1 12 10Z');
    expect(dot!.c).toBe(true);
    expect(dot!.v.length).toBe(4);
    const ring = samples(dot!).map(([x, y]) => Math.hypot(x - 10, y - 10));
    for (const r of ring) expect(Math.abs(r - 2)).toBeLessThan(0.01);
  });
});

describe('Lottie', () => {
  type Item = { ty: string; c?: { k: number[] }; o?: { k: number }; w?: { k: number }; d?: { n: string; v: { k: number } }[]; lc?: number; lj?: number };
  type Layer = { ind: number; ty: number; ip: number; op: number; nm: string; ks: object; shapes: { ty: string; it: Item[] }[] };
  type Anim = { v: string; fr: number; ip: number; op: number; w: number; h: number; nm: string; layers: Layer[] };

  /** The groups on screen at frame f, bottom first (Lottie lists the top first). */
  const onScreen = (a: Anim, f: number) =>
    a.layers
      .filter(l => l.ip <= f && f < l.op)
      .reverse()
      .flatMap(l => l.shapes.slice().reverse());
  const finite = (v: unknown): boolean => (typeof v === 'number' ? Number.isFinite(v) : Array.isArray(v) ? v.every(finite) : v && typeof v === 'object' ? Object.values(v).every(finite) : true);

  function checkStructure(a: Anim, frames: El[]) {
    const n = frames.length;
    expect([a.v, a.ip, a.op]).toEqual(['5.7.4', 0, n]);
    expect(finite(a)).toBe(true);
    expect(new Set(a.layers.map(l => l.ind)).size).toBe(a.layers.length);
    for (const l of a.layers) {
      expect(l.ty).toBe(4);
      expect(l.ks).toBeDefined();
      expect(0 <= l.ip && l.ip < l.op && l.op <= n).toBe(true);
      for (const grp of l.shapes) {
        expect(grp.ty).toBe('gr');
        expect(grp.it[grp.it.length - 1]!.ty).toBe('tr');
        for (const it of grp.it.filter(x => x.ty === 'fl' || x.ty === 'st')) {
          for (const c of it.c!.k) expect(c >= 0 && c <= 1).toBe(true);
          expect(it.o!.k >= 0 && it.o!.k <= 100).toBe(true);
        }
      }
    }
    /* every frame shows exactly its own elements (shadows aside), the background at the bottom */
    frames.forEach((fr, f) => {
      const want = painted(fr).filter(s => !s.includes('filter='));
      expect(onScreen(a, f).length).toBe(want.length);
    });
    const last = a.layers[a.layers.length - 1]!;
    expect([last.nm, last.ip, last.op]).toEqual(['Background', 0, n]);
  }

  it('turns fills, strokes, opacity and dashes into Lottie styles', () => {
    const a = lottie(
      [svg(bg, { tag: 'path', attrs: { d: 'M0 0L10 0L10 10Z', fill: '#D0D6E0', 'fill-opacity': 0.6, opacity: 0.5 } }, line('M0 50L100 50', '#34D399', { 'stroke-dasharray': '1 3', 'stroke-opacity': 0.4, 'stroke-linecap': 'butt' }))],
      30,
      'styles',
    ) as Anim;
    const [top, shape] = onScreen(a, 0).slice(1).reverse();
    const st = top!.it.find(x => x.ty === 'st')!;
    expect([st.w!.k, st.o!.k, st.lc, st.lj]).toEqual([0.5, 40, 1, 2]);
    expect(st.d!.map(x => [x.n, x.v.k])).toEqual([
      ['d', 1],
      ['g', 3],
      ['o', 0],
    ]);
    const fl = shape!.it.find(x => x.ty === 'fl')!;
    expect(fl.o!.k).toBe(30);
    /* lottie-web floors channel × 255: each must land back on the hex value */
    expect(fl.c!.k.slice(0, 3).map(x => Math.floor(x * 255))).toEqual([0xd0, 0xd6, 0xe0]);
    expect(parseColour('rgba(255, 0, 0, 0.5)')).toEqual({ rgb: [1, 0, 0], a: 0.5 });
    expect(parseColour('none')).toBeNull();
  });

  it('keeps paint order frame by frame and splits broken runs into layers', () => {
    const a = fill('M0 0L50 0L50 50Z', '#111111');
    const b = fill('M10 0L60 0L60 50Z', '#222222');
    const c = line('M0 70L100 70', '#333333');
    const seq = [svg(bg, a, b, c), svg(bg, b, a, c), svg(bg, a, c, b), svg(bg, c), svg(bg, a, b, c)];
    const anim = lottie(seq, 24, 'order') as Anim;
    checkStructure(anim, seq);
    const colours = (f: number) => onScreen(anim, f).map(grp => grp.it.find(x => x.ty === 'fl' || x.ty === 'st')!.c!.k.slice(0, 3).map(x => Math.floor(x * 255)).join(','));
    const want = seq.map(fr => painted(fr).map(s => /(?:fill|stroke)="#(\w\w)/.exec(s)![1]!).map(h => `${parseInt(h, 16)},${parseInt(h, 16)},${parseInt(h, 16)}`));
    seq.forEach((_, f) => expect(colours(f)).toEqual(want[f]));
  });

  it('covers every frame of real loops with the right layers', () => {
    for (const kind of ['drift', 'build'] as const) {
      const seq = libraryFrames('bars', kind, 0.4);
      const anim = lottie(seq, 30, `bars ${kind}`) as Anim;
      expect([anim.w, anim.h, anim.fr]).toEqual([Number(seq[0]!.attrs.width), Number(seq[0]!.attrs.height), 30]);
      checkStructure(anim, seq);
    }
  });

  it('leaves shadows out', () => {
    const shade: El = { tag: 'path', attrs: { d: 'M0 0L9 0L9 9Z', fill: '#000', filter: 'url(#s)' } };
    const defs: El = { tag: 'defs', attrs: {}, children: [{ tag: 'filter', attrs: { id: 's' }, children: [] }] };
    const anim = lottie([svg(defs, bg, shade, fill('M1 1L2 1L2 2Z', '#fff'))], 30, 'shadow') as Anim;
    expect(onScreen(anim, 0).length).toBe(2);
  });
});
