/* Drawing dots: on a canvas (previews, PNG, video) and as SVG (vector export). */
import { type Dot, type DotOptions, patternDots } from './halftone';
import { GROUND_COLOR, type PatternGround, type PatternSpec } from './spec';

/** ASCII from light to dark, for the character dot shape. */
export const CHARS = ['·', ':', '+', '*', '#'];
const MONO = '"Geist Mono Variable", ui-monospace, "SF Mono", Menlo, monospace';

const charOf = (tone: number) => CHARS[Math.min(CHARS.length - 1, Math.max(0, Math.floor(tone * CHARS.length)))]!;

/* opacity in tenths, so dots draw in a few batches instead of one by one */
const bucket = (a: number) => Math.max(0, Math.min(10, Math.round(a * 10)));

/** Draw dots on ctx (in artboard units) in one colour at one strength. */
export function drawDots(ctx: CanvasRenderingContext2D, dots: Dot[], spec: PatternSpec, ink: { color: string; opacity: number }) {
  if (!dots.length || ink.opacity <= 0) return;
  ctx.save();
  ctx.fillStyle = ink.color;
  const groups = new Map<number, Dot[]>();
  for (const d of dots) {
    const b = bucket(d.a);
    if (!b) continue;
    let g = groups.get(b);
    if (!g) groups.set(b, (g = []));
    g.push(d);
  }
  const turn = (spec.angle * Math.PI) / 180;
  const c = Math.cos(turn);
  const s = Math.sin(turn);
  for (const [b, list] of groups) {
    ctx.globalAlpha = ink.opacity * (b / 10);
    if (spec.shape === 'char') {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      let size = -1;
      for (const d of list) {
        const want = Math.max(4, Math.round(spec.spacing * 1.05));
        if (want !== size) {
          size = want;
          ctx.font = `500 ${size}px ${MONO}`;
        }
        ctx.fillText(charOf(d.tone), d.x, d.y);
      }
      continue;
    }
    ctx.beginPath();
    for (const d of list) {
      if (spec.shape === 'square') {
        const r = d.r * 0.886;
        /* a square of the same area as the dot, turned with the grid */
        const ax = c * r;
        const ay = s * r;
        ctx.moveTo(d.x - ax + ay, d.y - ay - ax);
        ctx.lineTo(d.x + ax + ay, d.y + ay - ax);
        ctx.lineTo(d.x + ax - ay, d.y + ay + ax);
        ctx.lineTo(d.x - ax - ay, d.y - ay + ax);
        ctx.closePath();
      } else if (Math.abs(d.ry - d.r) > 0.05) {
        ctx.moveTo(d.x + d.r * Math.cos(d.rot), d.y + d.r * Math.sin(d.rot));
        ctx.ellipse(d.x, d.y, d.r, d.ry, d.rot, 0, Math.PI * 2);
      } else {
        ctx.moveTo(d.x + d.r, d.y);
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      }
    }
    ctx.fill();
  }
  ctx.restore();
}

const n2 = (v: number) => (Math.round(v * 100) / 100).toString();
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/** The dots as SVG elements, grouped by strength (no <svg> wrapper). */
export function dotsSvg(dots: Dot[], spec: PatternSpec, ink: { color: string; opacity: number }): string {
  const groups = new Map<number, Dot[]>();
  for (const d of dots) {
    const b = bucket(d.a);
    if (!b) continue;
    let g = groups.get(b);
    if (!g) groups.set(b, (g = []));
    g.push(d);
  }
  const parts: string[] = [];
  const turn = spec.angle;
  for (const [b, list] of [...groups].sort((x, y) => x[0] - y[0])) {
    const op = n2(ink.opacity * (b / 10));
    const body: string[] = [];
    for (const d of list) {
      if (spec.shape === 'char') body.push(`<text x="${n2(d.x)}" y="${n2(d.y)}">${esc(charOf(d.tone))}</text>`);
      else if (spec.shape === 'square') {
        const a = n2(d.r * 1.772);
        body.push(`<rect x="${n2(d.x - d.r * 0.886)}" y="${n2(d.y - d.r * 0.886)}" width="${a}" height="${a}"${turn ? ` transform="rotate(${n2(turn)} ${n2(d.x)} ${n2(d.y)})"` : ''}/>`);
      } else if (Math.abs(d.ry - d.r) > 0.05)
        body.push(`<ellipse cx="${n2(d.x)}" cy="${n2(d.y)}" rx="${n2(d.r)}" ry="${n2(d.ry)}" transform="rotate(${n2((d.rot * 180) / Math.PI)} ${n2(d.x)} ${n2(d.y)})"/>`);
      else body.push(`<circle cx="${n2(d.x)}" cy="${n2(d.y)}" r="${n2(d.r)}"/>`);
    }
    const textAttrs = spec.shape === 'char' ? ` font-family='${MONO.replace(/"/g, '')}' font-weight="500" font-size="${Math.round(spec.spacing * 1.05)}" text-anchor="middle" dominant-baseline="central"` : '';
    parts.push(`<g fill="${ink.color}" fill-opacity="${op}"${textAttrs}>${body.join('')}</g>`);
  }
  return parts.join('');
}

/** A whole SVG file: the ground (or none) and the dots. */
export function patternSvgFile(dots: Dot[], spec: PatternSpec, ink: { color: string; opacity: number }, W: number, H: number, ground: { color: string | null; gradient?: string[] | null }): string {
  let bg = '';
  if (ground.gradient) {
    const stops = ground.gradient.map((c, i, a) => `<stop offset="${n2(i / (a.length - 1))}" stop-color="${c}"/>`).join('');
    bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs><rect width="${W}" height="${H}" fill="url(#g)"/>`;
  } else if (ground.color) bg = `<rect width="${W}" height="${H}" fill="${ground.color}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${bg}${dotsSvg(dots, spec, ink)}</svg>`;
}

/** Paint a pattern on ctx (artboard units) at moment t, in the ink for its ground. */
export function paintPattern(
  ctx: CanvasRenderingContext2D,
  spec: PatternSpec,
  W: number,
  H: number,
  t: number,
  ink: { color: string; opacity: number },
  opts: DotOptions = {},
): Dot[] {
  const dots = patternDots(spec, W, H, t, opts);
  drawDots(ctx, dots, spec, ink);
  return dots;
}

/** The brand's poster gradient, top to bottom. */
export const GREEN_GRADIENT = ['#60E9A1', '#10B981', '#017857'];

/** Paint a pattern's ground: flat, the green gradient, or nothing. */
export function paintGround(ctx: CanvasRenderingContext2D, ground: PatternGround, W: number, H: number) {
  if (ground === 'none') return;
  if (ground === 'green') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    GREEN_GRADIENT.forEach((c, i) => g.addColorStop(i / (GREEN_GRADIENT.length - 1), c));
    ctx.fillStyle = g;
  } else ctx.fillStyle = GROUND_COLOR[ground]!;
  ctx.fillRect(0, 0, W, H);
}
