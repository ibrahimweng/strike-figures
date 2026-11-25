import { describe, expect, it } from 'vitest';
import { patternSvgFile } from '../src/pattern/draw';
import { fieldOf } from '../src/pattern/field';
import { glitchAlpha, MAX_DOTS, patternDots } from '../src/pattern/halftone';
import { DEFAULT_PATTERN, fillPattern, inkOf, LOUD, patternContrast, type PatternSpec, PRESETS, presetSpec } from '../src/pattern/spec';

const W = 1200;
const H = 1500;
const still = (s: PatternSpec): PatternSpec => ({ ...s, motion: { ...s.motion, drift: 0, glitch: 0 } });

describe('patterns', () => {
  it('every preset makes dots on the artboard', () => {
    for (const p of PRESETS) {
      const dots = patternDots(presetSpec(p.id), W, H, 0);
      expect(dots.length, p.id).toBeGreaterThan(200);
      expect(dots.length, p.id).toBeLessThan(MAX_DOTS);
      const on = dots.filter(d => d.x >= 0 && d.x <= W && d.y >= 0 && d.y <= H);
      expect(on.length / dots.length, p.id).toBeGreaterThan(0.8);
      for (const d of dots) {
        expect(d.r, p.id).toBeGreaterThan(0);
        expect(d.r, p.id).toBeLessThanOrEqual((presetSpec(p.id).spacing * presetSpec(p.id).dot) / 2 + 1e-6);
      }
    }
  });

  it('loops: the last moment comes back to the first, and it moves in between', () => {
    for (const p of PRESETS) {
      const spec = { ...presetSpec(p.id), motion: { drift: 0.6, glitch: 0.3, seconds: 6 } };
      const a = patternDots(spec, W, H, 0);
      const b = patternDots(spec, W, H, 1);
      expect(b.length, p.id).toBe(a.length);
      for (let i = 0; i < a.length; i += 37) {
        expect(b[i]!.x, p.id).toBeCloseTo(a[i]!.x, 4);
        expect(b[i]!.r, p.id).toBeCloseTo(a[i]!.r, 4);
        expect(b[i]!.a, p.id).toBeCloseTo(a[i]!.a, 6);
      }
      const mid = patternDots(spec, W, H, 0.37);
      const same = mid.length === a.length && mid.every((d, i) => Math.abs(d.r - a[i]!.r) < 1e-6 && Math.abs(d.a - a[i]!.a) < 1e-6 && Math.abs(d.x - a[i]!.x) < 1e-6);
      expect(same, p.id).toBe(false);
    }
  });

  it('holds still with no drift and no glitch', () => {
    for (const p of PRESETS) {
      const spec = still(presetSpec(p.id));
      const a = patternDots(spec, W, H, 0);
      const b = patternDots(spec, W, H, 0.5);
      expect(b.map(d => [d.x, d.r, d.a])).toEqual(a.map(d => [d.x, d.r, d.a]));
    }
  });

  it('glitch flickers a few dots, not all', () => {
    const spec = { ...DEFAULT_PATTERN, motion: { drift: 0, glitch: 1, seconds: 8 } };
    let flicker = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) if (glitchAlpha(spec, i, 3, 0.25) < 1) flicker++;
    expect(flicker / n).toBeGreaterThan(0.2);
    expect(flicker / n).toBeLessThan(0.4);
    const none = { ...spec, motion: { ...spec.motion, glitch: 0 } };
    expect(glitchAlpha(none, 1, 2, 0.3)).toBe(1);
  });

  it('keeps words clear', () => {
    const spec = still(presetSpec('rings'));
    const rect = { x: 100, y: 100, w: 600, h: 300 };
    const dots = patternDots(spec, W, H, 0, { clear: { rects: [rect], amount: 1, pad: 60 } });
    const inside = dots.filter(d => d.x > rect.x && d.x < rect.x + rect.w && d.y > rect.y && d.y < rect.y + rect.h);
    expect(inside.length).toBe(0);
    const full = patternDots(spec, W, H, 0);
    expect(full.filter(d => d.x > rect.x && d.x < rect.x + rect.w && d.y > rect.y && d.y < rect.y + rect.h).length).toBeGreaterThan(50);
  });

  it('draws a cube with a light top and darker sides, and nothing round it', () => {
    const spec = still(presetSpec('cube'));
    const f = fieldOf(spec, W, H, 0);
    const cx = spec.x * W;
    const cy = spec.y * H;
    const u = spec.scale * Math.min(W, H);
    expect(f(cx, cy - 0.35 * u)).toBeLessThan(0.35);
    const left = f(cx - 0.25 * u, cy + 0.15 * u);
    const right = f(cx + 0.25 * u, cy + 0.15 * u);
    expect(left).toBeGreaterThan(0.35);
    expect(right).toBeGreaterThan(left);
    expect(f(5, 5)).toBe(-1);
  });

  it('is quiet by default and says when a colour is loud', () => {
    for (const g of ['dark', 'light', 'gray', 'green'] as const) expect(patternContrast(DEFAULT_PATTERN, g), g).toBeLessThan(LOUD);
    expect(patternContrast({ ...DEFAULT_PATTERN, color: '#10B981', opacity: 1 }, 'dark')).toBeGreaterThan(LOUD);
    expect(inkOf(DEFAULT_PATTERN, 'dark').color).toBe('#2A2A2A');
    expect(inkOf({ ...DEFAULT_PATTERN, color: '#FF0000', opacity: 0.5 }, 'light')).toEqual({ color: '#FF0000', opacity: 0.5 });
  });

  it('fills an old save from the defaults', () => {
    const p = fillPattern({ kind: 'rings', wave: { amplitude: 0.3 } as PatternSpec['wave'] });
    expect(p.kind).toBe('rings');
    expect(p.wave.amplitude).toBe(0.3);
    expect(p.wave.thickness).toBe(DEFAULT_PATTERN.wave.thickness);
    expect(p.motion).toEqual(DEFAULT_PATTERN.motion);
  });

  it('writes SVG', () => {
    const spec = still(presetSpec('ribbon'));
    const dots = patternDots(spec, 400, 300, 0);
    const svg = patternSvgFile(dots, spec, { color: '#2A2A2A', opacity: 1 }, 400, 300, { color: '#0C0C0C' });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('<ellipse');
    expect(svg).toContain('fill="#0C0C0C"');
    const chars = patternSvgFile(dots, { ...spec, shape: 'char' }, { color: '#000000', opacity: 1 }, 400, 300, { color: null });
    expect(chars).toContain('<text');
  });
});
