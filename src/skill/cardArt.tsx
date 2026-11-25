/* The overview cards' pictures. Every one is a Strike illustration: line art
   in the 2:1 view, drawn by the same engine as the library, mostly in the
   support grey so the card's name leads, with at most one green focus. They
   rest until the card is hovered, then make one move on the motion system's
   curves (gather into the middle of a move, release out of it), and settle
   back when the pointer leaves. Nothing tiny, no logo files, no solid colour. */
import { useEffect, useMemo, useRef } from 'react';
import { inout, mix, FOCUS_RIGHT, REST } from '../anim/system';
import { renderScene, type RenderModel } from '../engine/render';
import { buildSvg, serialize } from '../engine/svg';
import { box, C, chevron, cyl, dots, figure, label, line, ring, type V } from '../library/kit';
import type { Scene, SceneObject } from '../model/types';
import { fitCamera } from '../ui/view';
import { plates, setCircles } from '../library/circleFigure';
import type { PageId } from './brandPages';

const W = 480;
const H = 250;
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
/** element i of n, revealed in turn across p (0..1): its own eased 0..1 */
const turnOf = (p: number, i: number, n: number, span = 0.45) => inout(clamp01((p - (i / Math.max(1, n - 1)) * (1 - span)) / span));

/** Frame a scene for the card: 2:1, its artboard, a calm margin, 1 px lines (non-scaling on the page). */
function framed(sc: Scene, margin = 0.12): Scene {
  sc.artboard = { width: W, height: H };
  const plain = { ...sc, camera: { ...sc.camera, zoom: 1, panX: 0, panY: 0 } };
  sc.camera = fitCamera(plain, renderScene(plain), margin) ?? sc.camera;
  sc.theme = { ...sc.theme, lineWidth: 1 };
  return sc;
}

const green = (o: number) => dots({ spacing: 3.4, size: 0.9, stagger: true, inset: 3, opacity: o });

interface Art {
  /** the still picture, framed to hold every state of its move */
  make: () => Scene;
  /** the picture at hover progress p (0 at rest, 1 fully hovered) */
  at: (sc: Scene, p: number) => void;
  /** ms to play in, and to settle back */
  enter: number;
  leave: number;
}

/* ---- Logo: the Strike mark as three lined plates; on hover they part and the top one takes the green ---- */
const LOGO: Art = {
  make: () => {
    const layers = [0, 1, 2].map(i => chevron(150, 78, 12, [0, i * 26, 0], { tier: i === 2 ? 'subject' : 'support', name: `Layer ${i + 1}`, rot: [0, 45, 0] }));
    /* frame the parted state, then put the layers back */
    layers.forEach((o, i) => (o.position = [0, i * 44, 0]));
    const sc = framed(figure('Mark', layers, [], { margin: 0.12 }));
    sc.objects.forEach((o, i) => (o.position = [0, i * 26, 0]));
    return sc;
  },
  at: (sc, p) => {
    sc.objects.forEach((o, i) => {
      const k = turnOf(p, i, 3, 0.6);
      o.position = [0, i * (26 + 18 * k), 0];
      if (i === 2) o.faces.top.dots = k > 0.03 ? green(k) : null;
    });
  },
  enter: 900,
  leave: 500,
};

/* ---- Colour: a stack of swatch plates; on hover they peel off one by one, each showing its colour as dots ---- */
const SWATCHES = ['#F9F9F9', '#B3B3B3', '#8A8F98', '#10B981', '#3FD4AB', '#EE5E74', '#50EBA0', '#0788F7'];
const PLATE: [number, number] = [70, 112];
const pivotOf = (o: SceneObject): V => [o.position[0] - PLATE[0] / 2 + 10, 0, o.position[2] + PLATE[1] / 2 - 10];
const COLOUR: Art = {
  make: () => {
    const n = SWATCHES.length;
    const plates = SWATCHES.map((_, i) => box(PLATE[0], PLATE[1], 3, [0, i * 5, 0], { tier: i === n - 1 ? 'subject' : 'support', round: 8, name: `Swatch ${i + 1}` }));
    /* frame the fanned-out state */
    const fanned = SWATCHES.map((_, i) => box(PLATE[0], PLATE[1], 3, [0, i * 5, 0], { round: 8 }));
    fanned.forEach((o, i) => orbitY(o, -(n - 1 - i) * 11, pivotOf(o)));
    const sc = framed(figure('Swatches', fanned, [], { margin: 0.1 }));
    sc.objects = plates;
    return sc;
  },
  at: (sc, p) => {
    const n = sc.objects.length;
    sc.objects.forEach((o, i) => {
      const k = turnOf(p, n - 1 - i, n, 0.4);
      o.position = [0, i * 5, 0];
      o.rotation = [0, 0, 0];
      orbitY(o, -(n - 1 - i) * 11 * k, pivotOf({ ...o, position: [0, 0, 0] }));
      o.faces.top.dots = k > 0.03 ? dots({ color: SWATCHES[i], spacing: 3.2, size: 0.95, stagger: true, inset: 4, opacity: k }) : null;
    });
  },
  enter: 1300,
  leave: 600,
};
function orbitY(o: SceneObject, deg: number, c: V) {
  const a = (deg * Math.PI) / 180;
  const dx = o.position[0] - c[0];
  const dz = o.position[2] - c[2];
  o.position = [c[0] + Math.cos(a) * dx + Math.sin(a) * dz, o.position[1], c[2] - Math.sin(a) * dx + Math.cos(a) * dz];
  o.rotation = [o.rotation[0], o.rotation[1] + deg, o.rotation[2]];
}

/* ---- Illustration: one simple figure; on hover the block lifts and takes the green ---- */
const ILLUSTRATION: Art = {
  make: () => {
    const block = box(74, 74, 54, [-34, 0, 10], { tier: 'subject', name: 'Block', round: 4 });
    const drum = cyl(30, 30, [58, 0, -8], { tier: 'support', name: 'Drum' });
    const guide = ring([-34, 0, 10], 74, { tier: 'ghost', dash: true });
    const lifted = box(74, 74, 54, [-34, 26, 10]);
    const sc = framed(figure('Illustration', [lifted, drum], [], { lines: [guide], margin: 0.12 }));
    sc.objects = [block, drum];
    return sc;
  },
  at: (sc, p) => {
    const k = inout(p);
    const block = sc.objects[0];
    if (!block) return;
    block.position = [-34, 22 * k, 10];
    block.guides = k > 0.05;
    block.faces.top.dots = k > 0.03 ? green(k) : null;
  },
  enter: 720,
  leave: 500,
};

/* ---- Motion: the five circles at rest; on hover one grows into focus ---- */
const MOTION: Art = {
  make: () => {
    /* frame the rest cluster and the focus it grows into, then start at rest */
    const sc = framed(figure('Circles', plates([...REST, ...FOCUS_RIGHT]), [], { margin: 0.1 }), 0.1);
    sc.objects = plates(REST);
    setCircles(sc, REST);
    return sc;
  },
  at: (sc, p) => setCircles(sc, mix(REST, FOCUS_RIGHT, inout(p))),
  enter: 720,
  leave: 500,
};

/* ---- Backgrounds: an app's modules on its frame; on hover they lift apart, one by one ---- */
const MODULES: [string, number, number, number, number][] = [
  ['Top bar', 0, -60, 194, 14],
  ['Chart', -39, 7, 116, 114],
  ['Book', 41, 7, 38, 114],
  ['Ticket', 80, 7, 34, 114],
];
const BACKGROUNDS: Art = {
  make: () => {
    const frame = box(200, 140, 3, [0, 0, 0], { tier: 'support', round: 6, name: 'Frame' });
    const mods = MODULES.map(([name, x, z, w, d]) => box(w, d, 3, [x, 3, z], { tier: 'support', round: 3, name }));
    const button = box(24, 10, 2, [80, 6, 50], { tier: 'subject', round: 2, name: 'Button' });
    const lifted = [frame, ...MODULES.map(([, x, z, w, d]) => box(w, d, 3, [x, 34, z], { round: 3 }))];
    const sc = framed(figure('App', lifted, [], { margin: 0.1 }));
    sc.objects = [frame, ...mods, button];
    return sc;
  },
  at: (sc, p) => {
    MODULES.forEach(([name, x, z], i) => {
      const k = turnOf(p, i, MODULES.length, 0.5);
      const o = sc.objects.find(q => q.name === name);
      if (o) o.position = [x, 3 + 26 * k, z];
      if (name === 'Ticket') {
        const b = sc.objects.find(q => q.name === 'Button');
        if (b) {
          b.position = [80, 6 + 26 * k, 50];
          b.faces.top.dots = k > 0.03 ? green(k) : null;
        }
      }
    });
  },
  enter: 1100,
  leave: 600,
};

/* ---- Rules: a stack of pages, text as dashed lines; on hover the top page slides out and is ticked ---- */
const RULES: Art = {
  make: () => {
    const pages = [0, 1, 2].map(i => box(110, 140, 2, [i * 8, i * 4, -i * 8], { tier: i === 2 ? 'subject' : 'support', round: 4, name: `Page ${i + 1}` }));
    const slid = [0, 1, 2].map(i => box(110, 140, 2, [i * 8 + (i === 2 ? 44 : 0), i * 4, -i * 8], { round: 4 }));
    const sc = framed(figure('Rules', slid, [], { margin: 0.1 }));
    sc.objects = pages;
    sc.lines = textLines(0);
    return sc;
  },
  at: (sc, p) => {
    const k = inout(p);
    const top = sc.objects[2];
    if (top) top.position = [16 + 44 * k, 8, -16];
    sc.lines = textLines(44 * k, k);
  },
  enter: 720,
  leave: 500,
};
function textLines(dx: number, tick = 0) {
  const y = 8 + 2.2;
  const x0 = 16 + dx - 38;
  const rows = [-46, -28, -10, 8, 26].map((z, i) => line([[x0, y, z - 16] as V, [x0 + (i === 4 ? 40 : 70), y, z - 16] as V], { tier: 'ghost', dash: true }));
  if (tick <= 0.02) return rows;
  /* a tick that reads on screen in 2:1: a short stroke down-right (+x), a long one up-right (−z) */
  const t: V[] = [
    [x0 + 44, y, 44],
    [x0 + 54, y, 44],
    [x0 + 54, y, 22],
  ];
  return [...rows, line(t, { color: C.emerald, opacity: tick, width: 2 })];
}

const ARTS: Partial<Record<PageId, Art>> = { logo: LOGO, colour: COLOUR, illustration: ILLUSTRATION, motion: MOTION, backgrounds: BACKGROUNDS, rules: RULES };

/* ---- drawing ---- */

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Hover progress p, eased by each picture itself: 0 → 1 while hovered, back to 0 after. */
function useHover(active: boolean, draw: (p: number) => void, enter: number, leave: number) {
  const p = useRef(0);
  const ref = useRef(draw);
  ref.current = draw;
  useEffect(() => ref.current(p.current), []);
  useEffect(() => {
    if (reduced()) {
      p.current = active ? 1 : 0;
      ref.current(p.current);
      return;
    }
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      p.current = active ? Math.min(1, p.current + dt / enter) : Math.max(0, p.current - dt / leave);
      ref.current(p.current);
      if (p.current !== (active ? 1 : 0)) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, enter, leave]);
}

let ids = 0;

export function CardArt({ id, active }: { id: PageId; active: boolean }) {
  if (id === 'type') return <TypeArt active={active} />;
  const art = ARTS[id];
  return art ? <EngineArt art={art} active={active} /> : null;
}

function EngineArt({ art, active }: { art: Art; active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const prefix = useMemo(() => `card${ids++}`, []);
  const base = useMemo(() => art.make(), [art]);
  useHover(
    active,
    p => {
      const el = host.current;
      if (!el) return;
      const sc = structuredClone(base);
      art.at(sc, p);
      el.innerHTML = serialize(buildSvg(renderScene(sc), { background: false, idPrefix: prefix }));
    },
    art.enter,
    art.leave,
  );
  return <div className="sk-art" ref={host} aria-hidden />;
}

/* ---- Type: "Aa" in Geist, standing in 2:1 as a lined plate; on hover its face fills with the dot halftone ---- */
function typeModel(): RenderModel {
  const at = (z: number): Scene['labels'][number] => label('Aa', [0, 0, z], { plane: 'xy', size: 62, align: 'middle', weight: 'medium' });
  const sc = figure('Type', [], [at(-9), at(0)], { margin: 0.14 });
  sc.artboard = { width: W, height: H };
  const plain = { ...sc, camera: { ...sc.camera, zoom: 1, panX: 0, panY: 0 } };
  sc.camera = fitCamera(plain, renderScene(plain), 0.16) ?? sc.camera;
  return renderScene(sc);
}

function TypeArt({ active }: { active: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const prefix = useMemo(() => `type${ids++}`, []);
  const model = useMemo(typeModel, []);
  useHover(
    active,
    p => {
      const el = host.current;
      const [back, front] = model.labels;
      if (!el || !back || !front) return;
      const k = inout(p);
      el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs><pattern id="${prefix}-dots" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.35" fill="${C.emerald}"/></pattern></defs>
<path d="${back.d}" fill="none" stroke="${C.dim}" stroke-width="1.1" stroke-linejoin="round"/>
<path d="${front.d}" fill="#0C0C0C" stroke="none"/>
<path d="${front.d}" fill="url(#${prefix}-dots)" fill-opacity="${k.toFixed(3)}" stroke="${k > 0.5 ? C.line : C.mid}" stroke-width="1.1" stroke-linejoin="round"/>
</svg>`;
    },
    720,
    500,
  );
  return <div className="sk-art" ref={host} aria-hidden />;
}
