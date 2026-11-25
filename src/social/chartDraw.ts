/* Drawing a chart into its panel on a card (card pixels). `t` is the moment
   in the loop when the post moves: the marks grow in over the first quarter,
   hold, and fall away at the very end so the loop starts clean. Still cards
   draw t = null: everything in place. */
import { type ChartSpec, formatValue, highlightOf } from './chart';
import type { Palette, Rect } from './layout';

const SANS = '"Geist Variable", ui-sans-serif, system-ui, sans-serif';
const PIXEL = '"Geist Pixel Circle", "Geist Variable", ui-sans-serif, sans-serif';
const TAU = Math.PI * 2;

/** How far in the marks are at moment t: grow (0–25%), hold, fall away (92–100%). */
export function growth(t: number | null): number {
  if (t === null) return 1;
  const ease = (x: number) => 1 - (1 - x) ** 3;
  if (t < 0.25) return ease(t / 0.25);
  if (t < 0.92) return 1;
  return 1 - ease((t - 0.92) / 0.08);
}

/** The colours a chart draws in, for its panel. */
export interface ChartInk {
  text: string;
  muted: string;
  mark: string;
  hl: string;
  /** the highlight colour for words (deep on light grounds) */
  hlText: string;
  axis: string;
  panel: string;
}

export function chartInk(pal: Palette, greenPanel: boolean): ChartInk {
  if (greenPanel || pal.gradient)
    return { text: '#FFFFFF', muted: 'rgba(255,255,255,0.78)', mark: 'rgba(255,255,255,0.34)', hl: '#FFFFFF', hlText: '#FFFFFF', axis: 'rgba(255,255,255,0.4)', panel: '#10B981' };
  if (pal.text === '#0C0C0C') return { text: '#0C0C0C', muted: '#6B6F76', mark: '#C9CBD0', hl: '#10B981', hlText: '#047857', axis: 'rgba(12,12,12,0.22)', panel: pal.panel };
  return { text: '#F9F9F9', muted: '#8A8F98', mark: '#3B3E44', hl: '#10B981', hlText: '#10B981', axis: 'rgba(255,255,255,0.2)', panel: pal.panel };
}

function font(ctx: CanvasRenderingContext2D, weight: number, size: number, family = SANS, tracking = size >= 80 ? -0.03 : size >= 45 ? -0.02 : size >= 25 ? -0.01 : 0) {
  ctx.font = `${weight} ${size}px ${family}`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${(tracking * size).toFixed(2)}px`;
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, align: CanvasTextAlign = 'left', base: CanvasTextBaseline = 'alphabetic') {
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillText(s, x, y);
}

/** A ticker over its value: Medium over Regular. */
function tag(ctx: CanvasRenderingContext2D, ink: ChartInk, label: string, value: string, x: number, y: number, align: CanvasTextAlign, size: number, on: boolean) {
  font(ctx, 500, size);
  ctx.fillStyle = on ? ink.hlText : ink.text;
  text(ctx, label, x, y, align);
  font(ctx, 400, Math.round(size * 0.92));
  ctx.fillStyle = on ? ink.hlText : ink.muted;
  text(ctx, value, x, y + size * 1.15, align);
}

/** Dots filling a rectangle, for dotted marks. */
function dotRect(ctx: CanvasRenderingContext2D, r: Rect, step: number) {
  const rad = step * 0.34;
  ctx.beginPath();
  for (let y = r.y + r.h - step / 2; y >= r.y - 0.01; y -= step)
    for (let x = r.x + step / 2; x <= r.x + r.w + 0.01; x += step) {
      ctx.moveTo(x + rad, y);
      ctx.arc(x, y, rad, 0, TAU);
    }
  ctx.fill();
}

/** The big number's parts, so it can count up: "$4.2M" → "$", 4.2, "M". */
export function splitNumber(s: string): { pre: string; num: number; post: string; places: number } | null {
  const m = /^(\D*?)(-?\d[\d,]*\.?\d*)(.*)$/.exec(s.trim());
  if (!m) return null;
  const raw = m[2]!.replace(/,/g, '');
  return { pre: m[1]!, num: Number(raw), post: m[3]!, places: (raw.split('.')[1] ?? '').length };
}

/** The number partway through counting up to `big`. */
export function countUp(big: string, k: number): string {
  if (k >= 1) return big;
  const p = splitNumber(big);
  if (!p || !Number.isFinite(p.num)) return big;
  const v = p.num * k;
  return `${p.pre}${v.toLocaleString('en-US', { minimumFractionDigits: p.places, maximumFractionDigits: p.places })}${p.post}`;
}

/** Fit a big number to a box: the largest size at which it fits. */
function fitSize(ctx: CanvasRenderingContext2D, s: string, family: string, weight: number, maxW: number, maxH: number): number {
  let size = Math.floor(maxH);
  for (; size > 40; size -= 4) {
    font(ctx, weight, size, family);
    if (ctx.measureText(s).width <= maxW) break;
  }
  return size;
}

export interface ChartOptions {
  /** set back behind words: drawn faint, bars as hairlines, no values */
  ghost?: boolean;
  /** rays meet here (the logo sits on it) instead of at the foot of the area */
  hub?: { x: number; y: number } | null;
  /** no panel: no padding, and labels may run past the area */
  bare?: boolean;
  /** rays stop this far short of the hub, clear of the logo on it */
  hubGap?: number;
}

/** Draw `c` into panel `P`. */
export function drawChart(ctx: CanvasRenderingContext2D, c: ChartSpec, P: Rect, pal: Palette, t: number | null, greenPanel = false, opts: ChartOptions = {}) {
  if (opts.ghost) {
    /* drawn whole on a layer of its own, then laid down faint */
    const m = ctx.getTransform();
    const layer = document.createElement('canvas');
    layer.width = ctx.canvas.width;
    layer.height = ctx.canvas.height;
    const lc = layer.getContext('2d')!;
    lc.setTransform(m);
    drawChart(lc, c, P, pal, t, greenPanel, { ...opts, ghost: false, thin: true } as ChartOptions);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 0.5;
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
    return;
  }
  const thin = !!(opts as { thin?: boolean }).thin;
  const ink = chartInk(pal, greenPanel);
  const k = growth(t);
  const pad = opts.bare ? 0 : Math.round(Math.max(36, Math.min(P.w, P.h) * 0.075));
  const hasSource = !!c.source.trim() && c.kind !== 'number';
  const srcSize = 24;
  const inner: Rect = { x: P.x + pad, y: P.y + pad, w: P.w - 2 * pad, h: P.h - 2 * pad - (hasSource ? srcSize * 1.9 : 0) };
  ctx.save();
  if (!opts.bare) {
    ctx.beginPath();
    ctx.rect(P.x, P.y, P.w, P.h);
    ctx.clip();
  }
  const hl = highlightOf(c);
  const label = Math.round(Math.max(24, Math.min(32, P.w / 26)));

  switch (c.kind) {
    case 'number': {
      const fam = c.pixel ? PIXEL : SANS;
      const weight = c.pixel ? 400 : 500;
      const capH = c.caption.trim() ? label * 1.4 + 24 : 0;
      const size = fitSize(ctx, c.big || '0', fam, weight, inner.w, Math.min(inner.h - capH, inner.w * 0.6) / 0.78);
      font(ctx, weight, size, fam);
      ctx.fillStyle = c.highlight === 0 ? ink.hlText : ink.text;
      ctx.globalAlpha = t === null ? 1 : Math.min(1, k * 1.5);
      const base = inner.y + inner.h - capH;
      text(ctx, countUp(c.big, k), inner.x - size * 0.04, base);
      if (c.caption.trim()) {
        font(ctx, 400, Math.round(label * 1.25));
        ctx.fillStyle = ink.muted;
        text(ctx, c.caption, inner.x, base + label * 1.25 + 18);
      }
      break;
    }

    case 'bars':
    case 'histogram': {
      const n = c.rows.length;
      if (!n) break;
      const max = Math.max(1e-9, ...c.rows.map(r => r.value));
      const top = label * 2.6;
      const bottom = label * 1.8;
      const plot: Rect = { x: inner.x, y: inner.y + top, w: inner.w, h: inner.h - top - bottom };
      const hist = c.kind === 'histogram';
      const slot = plot.w / n;
      const gap = thin ? slot - Math.max(3, slot * 0.1) : hist ? 3 : slot * 0.32;
      const bw = slot - gap;
      /* the baseline */
      ctx.fillStyle = ink.axis;
      ctx.fillRect(plot.x, plot.y + plot.h, plot.w, 1.5);
      c.rows.forEach((r, i) => {
        const grow = Math.max(0, Math.min(1, k * 1.4 - (i / n) * 0.4));
        const h = Math.max(0, (Math.max(0, r.value) / max) * plot.h * grow);
        const bar: Rect = { x: plot.x + i * slot + gap / 2, y: plot.y + plot.h - h, w: bw, h };
        ctx.fillStyle = i === hl ? ink.hl : ink.mark;
        if (c.dots) dotRect(ctx, bar, Math.max(8, Math.min(18, bw / 2.2)));
        else ctx.fillRect(bar.x, bar.y, bar.w, bar.h);
        /* labels: every one when they fit, else every other */
        const every = n > 10 ? 2 : 1;
        if (i % every === 0 || i === hl) {
          font(ctx, 400, Math.round(label * 0.85));
          ctx.fillStyle = i === hl ? ink.hlText : ink.muted;
          text(ctx, r.label, bar.x + bw / 2, plot.y + plot.h + label * 1.25, 'center');
        }
        if (i === hl && grow > 0.6 && !thin) {
          font(ctx, 500, label);
          ctx.fillStyle = ink.text;
          text(ctx, formatValue(c, r.value), Math.min(plot.x + plot.w - 4, Math.max(plot.x + 4, bar.x + bw / 2)), bar.y - 16, bar.x + bw / 2 < plot.x + 60 ? 'left' : bar.x + bw / 2 > plot.x + plot.w - 60 ? 'right' : 'center');
        }
      });
      break;
    }

    case 'line':
    case 'area': {
      const n = c.rows.length;
      if (n < 2) break;
      const vals = c.rows.map(r => r.value);
      const lo = Math.min(0, ...vals);
      const hi = Math.max(...vals);
      const span = Math.max(1e-9, hi - lo);
      const top = label * 2.8;
      const bottom = label * 1.8;
      const plot: Rect = { x: inner.x, y: inner.y + top, w: inner.w - label * 0.5, h: inner.h - top - bottom };
      const px = (i: number) => plot.x + (plot.w * i) / (n - 1);
      const py = (v: number) => plot.y + plot.h - ((v - lo) / span) * plot.h;
      ctx.fillStyle = ink.axis;
      ctx.fillRect(plot.x, plot.y + plot.h, plot.w, 1.5);
      /* draw left to right as it grows */
      ctx.save();
      ctx.beginPath();
      ctx.rect(plot.x - 20, plot.y - top, (plot.w + 40) * k, plot.h + top + 4);
      ctx.clip();
      if (c.kind === 'area') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(px(0), plot.y + plot.h);
        vals.forEach((v, i) => ctx.lineTo(px(i), py(v)));
        ctx.lineTo(px(n - 1), plot.y + plot.h);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = ink.hl;
        if (c.dots) {
          ctx.globalAlpha = 0.9;
          dotRect(ctx, { x: plot.x, y: plot.y, w: plot.w, h: plot.h }, 14);
        } else {
          ctx.globalAlpha = 0.2;
          ctx.fillRect(plot.x, plot.y, plot.w, plot.h);
        }
        ctx.restore();
      }
      ctx.strokeStyle = ink.hl;
      ctx.lineWidth = 4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      vals.forEach((v, i) => (i ? ctx.lineTo(px(i), py(v)) : ctx.moveTo(px(i), py(v))));
      ctx.stroke();
      ctx.fillStyle = ink.hl;
      vals.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(px(i), py(v), i === hl ? 9 : 5, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
      c.rows.forEach((r, i) => {
        font(ctx, 400, Math.round(label * 0.85));
        ctx.fillStyle = i === hl ? ink.hlText : ink.muted;
        text(ctx, r.label, px(i), plot.y + plot.h + label * 1.25, i === 0 ? 'left' : i === n - 1 ? 'right' : 'center');
      });
      if (hl >= 0 && k > 0.95) {
        font(ctx, 500, label);
        ctx.fillStyle = ink.text;
        const x = px(hl);
        text(ctx, formatValue(c, vals[hl]!), x, py(vals[hl]!) - 22, x > plot.x + plot.w - 80 ? 'right' : x < plot.x + 80 ? 'left' : 'center');
      }
      break;
    }

    case 'ring': {
      const n = Math.min(5, c.rows.length);
      if (!n) break;
      const R = Math.min(inner.h, inner.w * 0.58) / 2;
      const cx = inner.x + R;
      const cy = inner.y + inner.h / 2;
      const stroke = Math.max(10, Math.min(30, (R * 0.42) / n));
      const gap = stroke * 0.7;
      const total = c.total > 0 ? c.total : c.rows.reduce((a, r) => a + r.value, 0) || 1;
      for (let i = 0; i < n; i++) {
        const r = R - stroke / 2 - i * (stroke + gap);
        if (r <= stroke) break;
        ctx.lineWidth = stroke;
        ctx.lineCap = 'round';
        ctx.strokeStyle = ink.axis;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
        const share = Math.max(0, Math.min(1, c.rows[i]!.value / total)) * k;
        if (share > 0.001) {
          ctx.strokeStyle = i === hl ? ink.hl : ink.mark === '#3B3E44' ? '#62666D' : ink.mark;
          ctx.beginPath();
          ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * share);
          ctx.stroke();
        }
      }
      /* the share that matters in the middle, the rows to the right */
      if (hl >= 0) {
        const s = formatValue(c, c.rows[hl]!.value);
        const size = Math.min(R * 0.5, fitSize(ctx, s, SANS, 500, R * 1.1, R * 0.6));
        font(ctx, 500, size);
        ctx.fillStyle = ink.text;
        ctx.globalAlpha = t === null ? 1 : Math.min(1, k * 1.5);
        text(ctx, s, cx, cy + size * 0.36, 'center');
        ctx.globalAlpha = 1;
      }
      const lx = cx + R + Math.max(40, inner.w * 0.06);
      c.rows.slice(0, n).forEach((r, i) => {
        tag(ctx, ink, r.label, formatValue(c, r.value), lx, cy - ((n - 1) * label * 2.8) / 2 + i * label * 2.8, 'left', label, i === hl);
      });
      break;
    }

    case 'wheel': {
      const n = c.rows.length;
      if (!n) break;
      const R = Math.min(inner.w, inner.h) / 2;
      const cx = inner.x + inner.w / 2;
      const cy = inner.y + inner.h / 2;
      const r0 = R * 0.24;
      const max = Math.max(1e-9, ...c.rows.map(r => r.value));
      const gapA = Math.min(0.08, 0.6 / n);
      const step = TAU / n;
      const corner = Math.max(6, R * 0.04);
      c.rows.forEach((row, i) => {
        const a0 = -Math.PI / 2 + i * step + gapA / 2;
        const a1 = a0 + step - gapA;
        const grow = Math.max(0, Math.min(1, k * 1.3 - (i / n) * 0.3));
        /* area-true: the radius grows with the square root of the value */
        const r1 = r0 + 6 + (R - r0 - 6) * Math.sqrt(Math.max(0, row.value) / max) * grow;
        if (r1 <= r0 + 2) return;
        ctx.beginPath();
        ctx.arc(cx, cy, r1 - corner, a0, a1);
        ctx.arc(cx, cy, r0 + 4, a1, a0, true);
        ctx.closePath();
        ctx.lineJoin = 'round';
        ctx.lineWidth = corner * 2;
        const fill = i === hl ? ink.hl : ink.mark;
        ctx.strokeStyle = fill;
        ctx.fillStyle = fill;
        if (c.dots && i !== hl) {
          ctx.save();
          ctx.globalAlpha = 0.55;
          ctx.stroke();
          ctx.fill();
          ctx.restore();
        } else {
          ctx.stroke();
          ctx.fill();
        }
        if (grow > 0.7) {
          const am = (a0 + a1) / 2;
          const rl = Math.max(r0 + label * 2.2, r1 - label * 2.6);
          const x = cx + Math.cos(am) * rl;
          const y = cy + Math.sin(am) * rl - label * 0.5;
          const on = i === hl;
          const col = on ? (ink.hl === '#FFFFFF' ? '#0C0C0C' : '#0C0C0C') : ink.text;
          font(ctx, 500, label);
          ctx.fillStyle = col;
          text(ctx, row.label, x, y, 'center');
          font(ctx, 400, Math.round(label * 0.9));
          ctx.fillStyle = on ? col : ink.muted;
          text(ctx, formatValue(c, row.value), x, y + label * 1.12, 'center');
        }
      });
      break;
    }

    case 'rays': {
      const n = c.rows.length;
      if (!n) break;
      const hub = opts.hub ?? { x: inner.x + inner.w / 2, y: inner.y + inner.h - 10 };
      /* an elliptical fan: as wide as the area, as tall as it allows, so the labels spread out */
      const Rx = inner.w * 0.46;
      const Ry = Math.max(label * 4, (opts.hub ? hub.y - inner.y : inner.h) - label * 2.8);
      const max = Math.max(1e-9, ...c.rows.map(r => r.value));
      c.rows.forEach((row, i) => {
        const a = Math.PI + (Math.PI * (i + 0.5)) / n;
        const dn = 0.45 + 0.55 * Math.sqrt(Math.max(0, row.value) / max);
        const p = { x: hub.x + Math.cos(a) * dn * Rx, y: hub.y + Math.sin(a) * dn * Ry };
        const grow = Math.max(0, Math.min(1, k * 1.3 - (i / n) * 0.3));
        const q = { x: hub.x + (p.x - hub.x) * grow, y: hub.y + (p.y - hub.y) * grow };
        const on = i === hl;
        ctx.strokeStyle = on ? ink.hl : ink.text;
        ctx.globalAlpha = on ? 1 : 0.75;
        ctx.lineWidth = on ? 2.5 : 1.5;
        const len = Math.hypot(q.x - hub.x, q.y - hub.y);
        const g = opts.hubGap ?? 0;
        if (len > g) {
          ctx.beginPath();
          ctx.moveTo(hub.x + ((q.x - hub.x) * g) / len, hub.y + ((q.y - hub.y) * g) / len);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = on ? ink.hl : ink.text;
        ctx.beginPath();
        ctx.arc(q.x, q.y, on ? 9 : 6, 0, TAU);
        ctx.fill();
        if (grow > 0.95) {
          const right = p.x >= hub.x;
          tag(ctx, ink, row.label, formatValue(c, row.value), p.x + (right ? -4 : 4), p.y - label * 1.9, right ? 'right' : 'left', label, on);
        }
      });
      if (!opts.hub) {
        ctx.fillStyle = ink.text;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 7, 0, TAU);
        ctx.fill();
      }
      break;
    }
  }

  if (hasSource) {
    font(ctx, 400, srcSize, SANS, 0);
    ctx.fillStyle = ink.muted;
    text(ctx, c.source.trim(), P.x + pad, P.y + P.h - pad + 4, 'left');
  }
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();
}
