/* The built-in figure: the Strike mark, the logo's chevrons stacked in 3D.
   Everything else comes from the library (src/library). */
import { defaultDots, defaultGradient, defaultTheme, newObject, STRIKE, uid } from './defaults';
import type { Scene, SceneObject } from './types';

/** Figures of earlier versions that are no longer part of the project (they were Linear's artwork). */
export const RETIRED = new Set(['fig01', 'fig02', 'fig03']);

function scene(name: string, label: string, w: number, h: number, panX: number, panY: number, objects: SceneObject[], preset: string): Scene {
  return {
    id: uid(),
    name,
    label,
    artboard: { width: w, height: h },
    camera: { yaw: 45, pitch: 30, zoom: 1, panX, panY },
    theme: defaultTheme(),
    objects,
    labels: [],
    preset,
  };
}

/** The Strike mark: the logo's three chevrons, stacked and floating, the top one lit with a halftone. */
function strikeMark(): Scene {
  const objects = [0, 1, 2].map(i => {
    const o = newObject({ kind: 'chevron', width: 168, depth: 87 }, 14, `Chevron ${3 - i}`, [0, i * 30, 0]);
    o.guides = i > 0;
    o.shadow = { enabled: i > 0, blur: 8, dx: 0, dy: 4, opacity: 0.6 };
    return o;
  });
  const top = objects[2]!;
  const d = defaultDots(STRIKE.emerald500);
  d.spacing = 3.2;
  d.size = 1.1;
  d.sizeMin = 0.1;
  d.inset = 2.5;
  d.gradient = { ...defaultGradient(), type: 'linear', angle: -90, start: 0.05, end: 0.95, affects: 'both' };
  d.opacityMin = 0.25;
  top.faces.top.dots = d;
  const mid = objects[1]!;
  const d2 = defaultDots(STRIKE.emerald700);
  d2.spacing = 3.2;
  d2.size = 0.7;
  d2.inset = 2.5;
  d2.opacity = 0.8;
  mid.faces.top.dots = d2;
  const sc = scene('Strike mark', 'FIG 1.0', 320, 320, 0, 70, objects, 'strike');
  sc.camera = { yaw: 0, pitch: 48, zoom: 1.45, panX: 0, panY: 36 };
  return sc;
}

export const PRESETS: { id: string; make: () => Scene }[] = [
  { id: 'strike', make: strikeMark },
];

/** The built-in figures' own loops: the Strike mark's chevrons settle onto each other in turn. */
export const PRESET_LOOPS: Record<string, (sc: Scene, t: number) => void> = {
  strike: (sc, t) => {
    sc.objects.forEach((o, i) => {
      if (i === 0) return;
      const k = 0.5 - 0.5 * Math.cos(2 * Math.PI * Math.min(1, Math.max(0, (t - 0.1 * i) / 0.75)));
      o.position = [o.position[0], o.position[1] + 10 * i * k, o.position[2]];
    });
  },
};

export const presetScene = (id: string) => PRESETS.find(p => p.id === id)?.make() ?? null;
