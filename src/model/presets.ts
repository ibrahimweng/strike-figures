/* The built-in figures. FIG 0.1–0.3 rebuild the three figures on Linear's
   homepage as real 3D scenes: every size and position below was measured off
   Linear's own SVGs, and each artboard is the size of Linear's, so at the
   default camera the two line up point for point. Rotate them and they stay
   solid. The Strike mark stacks the logo's chevron in the same style. */
import { defaultDots, defaultGradient, defaultTheme, LINEAR, newObject, STRIKE, uid } from './defaults';
import type { Scene, SceneObject } from './types';

/** screen units → world units, for heights at Linear's 30° pitch */
const UP = 1 / Math.cos(Math.PI / 6);

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

/** FIG 0.1, "Purpose-built": a stack of five slabs and a sixth lifted off it, with the Strike logo on top. */
function fig01(): Scene {
  const side = 120 * Math.SQRT2;
  const thick = 20.54 * UP;
  const step = 16.302 * UP;
  const slab = (y: number, name: string) => {
    const o = newObject({ kind: 'box', width: side, depth: side, radius: 4, corners: [3.43, 0.5, 5.15, 0.5] }, thick, name, [0, y, 0]);
    o.style.crease = LINEAR.dim;
    o.style.creaseTrim = 7.67;
    o.style.creaseDrop = 0.857 * UP;
    return o;
  };
  const objects = [0, 1, 2, 3, 4].map(i => slab(step * i, `Slab ${i + 1}`));
  const top = slab((201.155 - 67.4405) * UP - thick, 'Lifted slab');
  top.shadow = { enabled: true, blur: 6, dx: 0, dy: 4, opacity: 0.6 };
  top.guides = true;
  top.decal = { kind: 'strike', text: '', paths: [], source: 'Strike logo', x: 0, y: 0, size: 96, rotation: -45, mode: 'stroke', color: LINEAR.dim, width: null, opacity: 1 };
  objects.push(top);
  return scene('Purpose-built', 'FIG 0.1', 265, 262, -0.25, 201.155 - 131, objects, 'fig01');
}

/** FIG 0.2, "Agents": four columns on a 2×2 grid, two of them split into a block and a smaller one with a gap. */
function fig02(): Scene {
  const side = 55.75 * Math.SQRT2;
  const s = 64 * Math.SQRT2 / 2;
  const box = (name: string, x: number, z: number, y: number, hs: number, outline: string, dots?: [number, number]) => {
    const o = newObject({ kind: 'box', width: side, depth: side, radius: 4, corners: [3.9, 0.5, 3.9, 0.5] }, hs * UP, name, [x, y * UP, z]);
    o.style.outline = outline;
    o.style.crease = LINEAR.faint;
    o.style.creaseTrim = 6.43;
    o.shadow = { enabled: true, blur: 16, dx: 0, dy: 0, opacity: 1 };
    if (dots) {
      const d = defaultDots(LINEAR.dot);
      d.spacing = 3;
      d.size = 0.85;
      d.opacity = 0.21;
      d.inset = 0;
      d.region = { x: dots[0], y: dots[1], w: 14 / side, h: 14 / side };
      o.faces.top.dots = d;
    }
    return o;
  };
  const back = box('Back column', -s, -s, 0, 129.69, LINEAR.line, [0.1, 0.5]);
  back.shadow.enabled = false;
  const objects = [
    back,
    box('Left base', -s, s, 0, 23.69, LINEAR.dim),
    box('Left block', -s, s, 32, 77.69, LINEAR.line, [0.05, 0.26]),
    box('Right column', s, -s, 0, 65.69, LINEAR.line),
    box('Right cap', s, -s, 75, 23.69, LINEAR.dim),
    box('Front column', s, s, 0, 49.69, LINEAR.line, [0.46, 0.855]),
  ];
  return scene('Agents', 'FIG 0.2', 304, 281, 0, 188.9 - 140.5, objects, 'fig02');
}

/** FIG 0.3, "Momentum": fifteen fins whose heights rise to a peak and fall away. */
function fig03(): Scene {
  const heights = [20.529, 34.049, 54.331, 81.373, 128.697, 81.373, 54.331, 34.049, 20.529, 13.768, 10.387, 8.698, 7.852, 7.853, 7.853];
  const length = 118.06 * Math.SQRT2;
  const thick = 3.0995 * Math.SQRT2;
  const objects = heights.map((v, i) => {
    const o = newObject({ kind: 'box', width: length, depth: thick, radius: 0.7, corners: [0.72, 0.15, 0.72, 0.15] }, (v + 2.825) * UP, `Fin ${i + 1}`, [0, 0, 8.45 * Math.SQRT2 * (i - 7)]);
    o.style.outline = LINEAR.mid;
    o.style.crease = LINEAR.faint;
    o.style.creaseTrim = 3.47;
    return o;
  });
  return scene('Momentum', 'FIG 0.3', 272, 267, 0.018, 190.564 - 133.5, objects, 'fig03');
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
  { id: 'fig01', make: fig01 },
  { id: 'fig02', make: fig02 },
  { id: 'fig03', make: fig03 },
  { id: 'strike', make: strikeMark },
];

export const presetScene = (id: string) => PRESETS.find(p => p.id === id)?.make() ?? null;
