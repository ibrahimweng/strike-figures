/* The motion system's circles, drawn the way every Strike illustration is
   (kit.ts): thin plates, faces in the ground colour so a circle in front
   hides the one behind, grey outlines in tiers, and one green focus carried
   by dots. Flat (straight down) shows the composition plainly; the 2:1 view
   gives the same plates depth. Used by the Motion page and the library. */
import { type Circle, circlesAt, CYCLE, FOCUS_LEFT, FOCUS_RIGHT, type Move, PRESSED, REST } from '../anim/system';
import { renderScene } from '../engine/render';
import type { Scene, SceneObject } from '../model/types';
import { fitCamera } from '../ui/view';
import { C, cyl, dots, figure, line, type V } from './kit';

/** One rest radius, in scene units. */
const U = 22;
const PLATE = 3;

export type CircleView = 'flat' | 'iso';

const plate = (i: number, [x, y, r]: Circle): SceneObject => cyl(r * U, PLATE, [x * U, 0, y * U], { tier: 'support', name: `Circle ${i + 1}` });

/** Put the circles in state `cs`: size, place, and the green focus on whichever has grown. */
export function setCircles(sc: Scene, cs: Circle[]) {
  sc.objects.forEach((o, i) => {
    const c = cs[i];
    if (!c || o.shape.kind !== 'cylinder') return;
    const [x, y, r] = c;
    o.shape.radius = r * U;
    /* a bigger circle sits a hair higher, so it is the one in front */
    o.position = [x * U, (r - 1) * 1.5, y * U];
    const focus = Math.max(0, Math.min(1, (r - 1.25) / 0.6));
    /* the subject's line at rest size and up; circles giving way drop to the support line */
    o.style.outline = r >= 0.95 ? C.line : C.mid;
    o.faces.top.dots = focus > 0.04 ? dots({ spacing: 2.6, size: 0.62, stagger: true, inset: 1.6, opacity: focus }) : null;
  });
}

/** Construction lines for the composition: the two row centres, dashed (not real, just how it's built). */
function rows(): ReturnType<typeof line>[] {
  const h = (Math.sqrt(3) / 2) * U;
  const along = (z: number): V[] => [
    [-3.4 * U, 0.2, z],
    [3.4 * U, 0.2, z],
  ];
  return [line(along(-h), { tier: 'ghost', dash: true }), line(along(h), { tier: 'ghost', dash: true })];
}

/** A scene of the five circles for one move and view, framed to hold every state of the move. */
export function circleScene(view: CircleView, move: Move | 'still', o: { width?: number; height?: number; guides?: boolean; small?: boolean } = {}): Scene {
  const reach = move === 'focus' ? [...FOCUS_LEFT, ...FOCUS_RIGHT, ...REST] : move === 'press' ? [...REST, ...PRESSED] : REST;
  /* frame every state the move passes through, on the artboard asked for */
  const sc = figure('Circles', reach.map((c, i) => plate(i, c)), [], { flat: view === 'flat', margin: 0.08 });
  sc.artboard = { width: o.width ?? 320, height: o.height ?? 320 };
  const plain = { ...sc, camera: { ...sc.camera, zoom: 1, panX: 0, panY: 0 } };
  sc.camera = fitCamera(plain, renderScene(plain), 0.08) ?? sc.camera;
  /* shown small (on a page, not exported): the heavier line the rules give small illustrations */
  if (o.small) sc.theme = { ...sc.theme, lineWidth: sc.theme.lineWidth * 2 };
  /* then the five plates, as they start */
  const start = move === 'focus' ? circlesAt('focus', 0) : REST;
  sc.objects = start.map((c, i) => plate(i, c));
  sc.lines = o.guides ? rows() : [];
  setCircles(sc, start);
  return sc;
}

/** The library's loop for the figure: the focus move, in whole two-second cycles across the loop. */
export function circlesLoop(sc: Scene, t: number) {
  const secs = sc.motion?.duration ?? 4;
  const cycles = Math.max(1, Math.round((secs * 1000) / CYCLE.focus));
  setCircles(sc, circlesAt('focus', t * cycles * CYCLE.focus));
}
