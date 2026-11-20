/* Drawing → SVG. The same element tree feeds the editor's canvas and the
   exported file, so what you see is what you export.

   With `clipHidden`, lines and dots hidden behind nearer pieces are cut away
   rather than just painted over, so the file holds only what is visible;
   the fills stay, layered back to front, as in Linear's own files. */
import { type Curve, clipOutside, curvesToPath, ellipseOf, num, regionToPath } from './curves';
import type { Dot } from './dots';
import { insideDepth } from './math';
import type { Layer, RenderModel } from './render';

export interface El {
  tag: string;
  attrs: Record<string, string | number>;
  children?: El[];
}

export interface SvgOptions {
  /** cut away hidden lines and dots */
  clipHidden?: boolean;
  /** paint the theme's background (default: unless the theme is transparent) */
  background?: boolean;
  shadows?: boolean;
  /** an id prefix, so two drawings on one page don't share filter ids */
  idPrefix?: string;
  /** tag each layer with its object, for the editor */
  tagLayers?: boolean;
}

function dotPath(dots: Dot[], shape: 'circle' | 'square'): string {
  let d = '';
  for (const t of dots) {
    if (shape === 'square') {
      const p = (sa: number, sb: number) => `${num(t.c.x + sa * t.a.x + sb * t.b.x, 2)} ${num(t.c.y + sa * t.a.y + sb * t.b.y, 2)}`;
      d += `M${p(1, 1)}L${p(-1, 1)}L${p(-1, -1)}L${p(1, -1)}Z`;
      continue;
    }
    const { rx, ry, rot } = ellipseOf(t.a, t.b);
    if (rx < 0.005) continue;
    const det = t.a.x * t.b.y - t.a.y * t.b.x;
    const sweep = det > 0 ? 1 : 0;
    const s = `${num(t.c.x + t.a.x, 2)} ${num(t.c.y + t.a.y, 2)}`;
    const e = `${num(t.c.x - t.a.x, 2)} ${num(t.c.y - t.a.y, 2)}`;
    const arc = `A${num(rx, 2)} ${num(Math.max(ry, 0.005), 2)} ${num(rot, 1)} 0 ${sweep} `;
    d += `M${s}${arc}${e}${arc}${s}Z`;
  }
  return d;
}

function occluders(layers: Layer[], i: number) {
  const me = layers[i]!.bbox;
  const out: Layer['hull'][] = [];
  for (let j = i + 1; j < layers.length; j++) {
    const b = layers[j]!.bbox;
    if (b.minX < me.maxX && me.minX < b.maxX && b.minY < me.maxY && me.minY < b.maxY) out.push(layers[j]!.hull);
  }
  return out;
}

function clipCurves(curves: Curve[], polys: Layer['hull'][]): Curve[] {
  let cur = curves;
  for (const poly of polys) cur = cur.flatMap(c => clipOutside(c, poly));
  return cur;
}

export function buildSvg(model: RenderModel, opts: SvgOptions = {}): El {
  const { width, height, theme } = model;
  const prefix = opts.idPrefix ?? 'f';
  const defs: El[] = [];
  const body: El[] = [];
  const background = opts.background ?? !theme.transparent;
  if (background) body.push({ tag: 'rect', attrs: { width, height, fill: theme.background } });
  model.layers.forEach((layer, i) => {
    const g: El[] = [];
    const hide = opts.clipHidden ? occluders(model.layers, i) : [];
    if (layer.shadow && opts.shadows !== false) {
      const s = layer.shadow;
      const id = `${prefix}-shadow-${i}`;
      const pad = s.blur * 3 + Math.max(Math.abs(s.dx), Math.abs(s.dy));
      const bb = layer.bbox;
      defs.push({
        tag: 'filter',
        attrs: {
          id,
          x: num(bb.minX - pad, 2),
          y: num(bb.minY - pad, 2),
          width: num(bb.maxX - bb.minX + pad * 2, 2),
          height: num(bb.maxY - bb.minY + pad * 2, 2),
          filterUnits: 'userSpaceOnUse',
          'color-interpolation-filters': 'sRGB',
        },
        children: [
          { tag: 'feGaussianBlur', attrs: { in: 'SourceAlpha', stdDeviation: s.blur } },
          { tag: 'feOffset', attrs: { dx: s.dx, dy: s.dy, result: 'blur' } },
          { tag: 'feFlood', attrs: { 'flood-color': theme.background, 'flood-opacity': s.opacity } },
          { tag: 'feComposite', attrs: { in2: 'blur', operator: 'in' } },
        ],
      });
      const d = layer.fills[0]?.regions.map(r => regionToPath(r)).join('') ?? '';
      if (d) g.push({ tag: 'path', attrs: { d, fill: '#000', filter: `url(#${id})` } });
    }
    for (const f of layer.fills) {
      const d = f.regions.map(r => regionToPath(r)).join('');
      if (d) g.push({ tag: 'path', attrs: { d, fill: f.color } });
    }
    for (const grp of layer.dots) {
      const dots = hide.length ? grp.dots.filter(t => !hide.some(poly => insideDepth(t.c, poly) > 0.05)) : grp.dots;
      const d = dotPath(dots, grp.shape);
      if (!d) continue;
      const attrs: El['attrs'] = { d, fill: grp.color };
      if (grp.opacity < 1) attrs['fill-opacity'] = num(grp.opacity, 2);
      g.push({ tag: 'path', attrs });
    }
    if (layer.decal && layer.decal.d) {
      const dc = layer.decal;
      const attrs: El['attrs'] =
        dc.mode === 'stroke'
          ? { d: dc.d, stroke: dc.color, 'stroke-width': dc.width, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', fill: 'none' }
          : { d: dc.d, fill: dc.color };
      if (dc.opacity < 1) attrs.opacity = num(dc.opacity, 2);
      g.push({ tag: 'path', attrs });
    }
    for (const s of layer.strokes) {
      const curves = hide.length ? clipCurves(s.curves, hide) : s.curves;
      const d = curvesToPath(curves);
      if (!d) continue;
      const attrs: El['attrs'] = {
        d,
        stroke: s.style.color,
        'stroke-width': s.style.width,
        'stroke-linecap': s.style.cap,
        'stroke-linejoin': 'round',
        fill: 'none',
      };
      if (s.style.opacity < 1) attrs['stroke-opacity'] = num(s.style.opacity, 2);
      if (s.style.dash) attrs['stroke-dasharray'] = s.style.dash;
      g.push({ tag: 'path', attrs });
    }
    if (g.length) body.push({ tag: 'g', attrs: opts.tagLayers ? { 'data-object': layer.objectId, 'data-piece': layer.piece } : {}, children: g });
  });
  const children: El[] = [];
  if (defs.length) children.push({ tag: 'defs', attrs: {}, children: defs });
  children.push(...body);
  return {
    tag: 'svg',
    attrs: { xmlns: 'http://www.w3.org/2000/svg', width, height, viewBox: `0 0 ${width} ${height}`, fill: 'none' },
    children,
  };
}

const esc = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function serialize(el: El, indent = ''): string {
  const attrs = Object.entries(el.attrs)
    .map(([k, v]) => ` ${k}="${esc(v)}"`)
    .join('');
  if (!el.children?.length) return `${indent}<${el.tag}${attrs}/>`;
  const inner = el.children.map(c => serialize(c, `${indent}  `)).join('\n');
  return `${indent}<${el.tag}${attrs}>\n${inner}\n${indent}</${el.tag}>`;
}

export function toSvgString(model: RenderModel, opts: SvgOptions = {}): string {
  return `${serialize(buildSvg(model, opts))}\n`;
}
