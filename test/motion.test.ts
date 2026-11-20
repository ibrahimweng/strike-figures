import { describe, expect, it } from 'vitest';
import { designedLoop, frameSvg, playingKind, sceneAt } from '../src/anim/motion';
import { LIBRARY, libraryScene } from '../src/library';
import { presetScene } from '../src/model/presets';
import type { Motion, Scene } from '../src/model/types';

const withMotion = (sc: Scene, kind: Motion['kind']): Scene => ({ ...structuredClone(sc), motion: { kind, duration: 4 } });

describe('motion', () => {
  it('gives every illustration a loop of its own', () => {
    const missing = LIBRARY.filter(x => !x.loop).map(x => x.id);
    expect(missing).toEqual([]);
    expect(designedLoop(presetScene('strike')!)).not.toBeNull();
  });

  it('starts and ends every loop on the figure as drawn, and moves in between', { timeout: 60000 }, () => {
    for (const item of LIBRARY) {
      const sc = libraryScene(item.id)!;
      const still = frameSvg(sc, 0, { clipHidden: true });
      const asDrawn = frameSvg(withMotion(sc, 'none'), 0, { clipHidden: true });
      expect(still, `${item.id} at t=0`).toBe(asDrawn);
      const frames = [0.3, 0.5, 0.7].map(t => frameSvg(sc, t, { clipHidden: true }));
      expect(frames.some(f => f !== still), `${item.id} moves`).toBe(true);
      for (const f of frames) expect(f, item.id).not.toMatch(/NaN|Infinity/);
      /* the last frame of the loop is a hair away from the first */
      const end = sceneAt(sc, 0.9999);
      expect(JSON.stringify(end.camera), item.id).toBe(JSON.stringify(sc.camera));
    }
  });

  it('turns, builds and drifts any figure, and leaves the original alone', () => {
    const sc = libraryScene('bars')!;
    const before = JSON.stringify(sc);
    expect(sceneAt(withMotion(sc, 'turn'), 0.25).camera.yaw).toBeCloseTo(sc.camera.yaw + 90);
    const built = sceneAt(withMotion(sc, 'build'), 0.2);
    expect(built.objects.some(o => !o.visible || o.height < sc.objects.find(x => x.id === o.id)!.height)).toBe(true);
    expect(frameSvg(withMotion(sc, 'build'), 0)).toBe(frameSvg(withMotion(sc, 'none'), 0));
    const drifted = sceneAt(withMotion(sc, 'drift'), 0.3);
    expect(drifted.objects.some(o => o.faces.top.dots?.sweep)).toBe(true);
    expect(JSON.stringify(sc)).toBe(before);
    expect(playingKind(withMotion(sc, 'designed'))).toBe('designed');
  });
});
