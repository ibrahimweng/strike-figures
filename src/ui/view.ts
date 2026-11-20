import { createElement, type ReactElement } from 'react';
import type { El } from '../engine/svg';
import type { RenderModel } from '../engine/render';
import { type P2, pointInPolygon } from '../engine/math';
import type { Camera, Scene } from '../model/types';

export const VIEWS: { id: string; label: string; yaw: number; pitch: number; key: string }[] = [
  { id: 'linear', label: '2:1', yaw: 45, pitch: 30, key: '1' },
  { id: 'iso', label: 'ISO', yaw: 45, pitch: 35.264, key: '2' },
  { id: 'front', label: 'FRONT', yaw: 0, pitch: 0, key: '3' },
  { id: 'side', label: 'SIDE', yaw: 90, pitch: 0, key: '4' },
  { id: 'top', label: 'TOP', yaw: 45, pitch: 90, key: '5' },
];

/** The camera that fits everything in the artboard with a margin. */
export function fitCamera(scene: Scene, model: RenderModel, margin = 0.1): Camera | null {
  const pts = model.layers.flatMap(l => l.hull);
  if (!pts.length) return null;
  const xs = pts.map(p => p.x);
  const ys = pts.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const { width: W, height: H } = scene.artboard;
  const bw = Math.max(1e-6, maxX - minX);
  const bh = Math.max(1e-6, maxY - minY);
  const k = Math.min((W * (1 - margin * 2)) / bw, (H * (1 - margin * 2)) / bh);
  const o = { x: W / 2 + scene.camera.panX, y: H / 2 + scene.camera.panY };
  const c = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  return { ...scene.camera, zoom: scene.camera.zoom * k, panX: -(c.x - o.x) * k, panY: -(c.y - o.y) * k };
}

export interface Hit {
  objectId: string;
  face: string | null;
}

/** What's under an artboard point: the nearest piece's object, and which of its faces. */
export function pick(model: RenderModel, p: P2, skip: (id: string) => boolean = () => false): Hit | null {
  for (let i = model.layers.length - 1; i >= 0; i--) {
    const l = model.layers[i]!;
    if (skip(l.objectId)) continue;
    if (p.x < l.bbox.minX || p.x > l.bbox.maxX || p.y < l.bbox.minY || p.y > l.bbox.maxY) continue;
    if (!pointInPolygon(p, l.hull)) continue;
    const face = l.faces.find(f => pointInPolygon(p, f.poly));
    return { objectId: l.objectId, face: face?.key ?? null };
  }
  return null;
}

const camel = (k: string) => (k.startsWith('data-') || k.startsWith('aria-') ? k : k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

/** An element tree as React elements. */
export function toReact(el: El, key?: string | number): ReactElement {
  const props: Record<string, unknown> = { key };
  for (const [k, v] of Object.entries(el.attrs)) props[camel(k)] = v;
  return createElement(el.tag, props, ...(el.children ?? []).map((c, i) => toReact(c, i)));
}

export const facesName = (key: string) => {
  if (key === 'top') return 'Top';
  if (key === 'bottom') return 'Bottom';
  if (key === 'all') return 'All sides';
  const n = Number(key.slice(1));
  return key.startsWith('c') ? `Corner ${n + 1}` : `Side ${n + 1}`;
};
