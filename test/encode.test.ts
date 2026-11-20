import { describe, expect, it } from 'vitest';
import { avcCodecs, avcLevel, defaultBitrate, evenUp, fixWebmDuration, frameTime, gifDelays, keyInterval, sizeSvg } from '../src/anim/encode';

describe('video timing', () => {
  it('puts frames at exact microseconds that never drift', () => {
    expect(frameTime(0, 30)).toBe(0);
    expect(frameTime(1, 30)).toBe(33333);
    expect(frameTime(2, 30)).toBe(66667);
    expect(frameTime(30, 30)).toBe(1_000_000);
    expect(frameTime(120, 30)).toBe(4_000_000);
    expect(frameTime(7, 24)).toBe(291667);
    // durations add up to the loop exactly
    let sum = 0;
    for (let i = 0; i < 120; i++) sum += frameTime(i + 1, 30) - frameTime(i, 30);
    expect(sum).toBe(4_000_000);
  });

  it('keys about every two seconds', () => {
    expect(keyInterval(30)).toBe(60);
    expect(keyInterval(24)).toBe(48);
    expect(keyInterval(0.2)).toBe(1);
  });

  it('rounds odd sides up to even', () => {
    expect(evenUp(1600)).toBe(1600);
    expect(evenUp(901)).toBe(902);
    expect(evenUp(899.5)).toBe(900);
    expect(evenUp(1)).toBe(2);
  });
});

describe('bitrate and level', () => {
  it('gives about 6 Mbps at 1600×900, 30 fps, scaled by size', () => {
    expect(defaultBitrate(1600, 900, 30)).toBe(6_000_000);
    expect(defaultBitrate(800, 450, 30)).toBe(1_500_000);
    expect(defaultBitrate(1600, 900, 60)).toBeGreaterThan(6_000_000);
    expect(defaultBitrate(1600, 900, 60)).toBeLessThan(12_000_000);
    expect(defaultBitrate(64, 64, 30)).toBe(500_000);
    expect(defaultBitrate(7680, 4320, 60)).toBe(25_000_000);
  });

  it('picks the lowest H.264 level that fits', () => {
    expect(avcLevel(1600, 900, 30, 6e6)).toBe(40); // 5700 macroblocks: over 3.2's 5120
    expect(avcLevel(1280, 720, 30, 4e6)).toBe(31);
    expect(avcLevel(960, 960, 30, 4e6)).toBe(31);
    expect(avcLevel(1920, 1080, 60, 12e6)).toBe(42); // 4.0 has the room but not the rate
    expect(avcLevel(320, 320, 30, 5e5)).toBe(30); // 3.0 is the floor
    expect(avcLevel(3840, 2160, 30, 20e6)).toBe(51);
    expect(avcLevel(1600, 900, 30, 24e6, false)).toBe(41); // Main: 24 Mbps is over 4.0's 20
    expect(avcLevel(1600, 900, 30, 24e6, true)).toBe(40); // High gets 1.25× the bitrate
    expect(avcLevel(20000, 20000, 30, 1e6)).toBeNull();
  });

  it('writes codec strings High first', () => {
    expect(avcCodecs(1600, 900, 30, 6e6)).toEqual(['avc1.640028', 'avc1.4d0028', 'avc1.42e028', 'avc1.420028']);
    expect(avcCodecs(1280, 720, 30, 4e6)[0]).toBe('avc1.64001f');
    expect(avcCodecs(20000, 20000, 30, 1e6)).toEqual([]);
  });
});

describe('gif delays', () => {
  it('keeps the loop its true length in hundredths', () => {
    const d30 = gifDelays(120, 30);
    expect(d30.slice(0, 6)).toEqual([3, 4, 3, 3, 4, 3]);
    expect(d30.reduce((a, b) => a + b, 0)).toBe(400);
  });

  it('is even when the rate divides 100', () => {
    expect(new Set(gifDelays(80, 20))).toEqual(new Set([5]));
    expect(new Set(gifDelays(100, 25))).toEqual(new Set([4]));
    expect(new Set(gifDelays(200, 50))).toEqual(new Set([2]));
  });

  it('never goes under 2, which browsers would slow to 10', () => {
    expect(Math.min(...gifDelays(60, 60))).toBe(2);
  });
});

describe('sizeSvg', () => {
  it('resizes the root and keeps its viewBox', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320" fill="none"><path stroke-width="2" d=""/></svg>';
    const out = sizeSvg(svg, 960, 960);
    expect(out).toContain('width="960" height="960" viewBox="0 0 320 320"');
    expect(out).toContain('stroke-width="2"');
  });

  it('adds a viewBox from the old size so the drawing scales instead of cropping', () => {
    const out = sizeSvg(`<?xml version="1.0"?>\n<svg width='100px' height="50"><rect/></svg>`, 400, 200);
    expect(out).toBe(`<?xml version="1.0"?>\n<svg viewBox="0 0 100 50" width="400" height="200"><rect/></svg>`);
  });

  it('adds width and height when missing, and leaves non-SVG text alone', () => {
    expect(sizeSvg('<svg viewBox="0 0 10 10"/>', 30, 20)).toBe('<svg height="20" width="30" viewBox="0 0 10 10"/>');
    expect(sizeSvg('<g/>', 30, 20)).toBe('<g/>');
  });
});

describe('fixWebmDuration', () => {
  /** A few bytes of a WebM header with a Duration element saying `ms`. */
  const header = (ms: number) => {
    const b = new Uint8Array(64);
    b.set([0x1a, 0x45, 0xdf, 0xa3], 0);
    b.set([0x44, 0x89, 0x88], 20);
    new DataView(b.buffer).setFloat64(23, ms);
    return b;
  };

  it('moves the end from the last frame start to its finish', () => {
    const b = header(3966);
    expect(fixWebmDuration(b.buffer, 4000)).toBe(true);
    expect(new DataView(b.buffer).getFloat64(23)).toBe(4000);
  });

  it('leaves a value that is not about a frame short alone', () => {
    const b = header(1234);
    expect(fixWebmDuration(b.buffer, 4000)).toBe(false);
    expect(new DataView(b.buffer).getFloat64(23)).toBe(1234);
  });
});
