/* Grounds: the colour a figure sits on. Figures are drawn for Strike's dark
   ground (#0C0C0C); on White (#F9F9F9) or Strike Green the same figure is
   redrawn with its greys swapped tier for tier, so the subject stays the
   strongest line, support the middle one, background the faintest. */
import { STRIKE, TONE } from './defaults';
import type { Scene } from './types';

export type Ground = 'dark' | 'light' | 'green';

export const GROUNDS: { value: Ground; label: string; color: string }[] = [
  { value: 'dark', label: 'Black', color: TONE.ink },
  { value: 'light', label: 'White', color: '#F9F9F9' },
  { value: 'green', label: 'Green', color: STRIKE.emerald500 },
];

const SWAP: Record<Exclude<Ground, 'dark'>, Record<string, string>> = {
  light: {
    [TONE.ink]: '#F9F9F9',
    [TONE.line]: '#16171A',
    [TONE.mid]: '#8A8F98',
    [TONE.dim]: '#C4C6CC',
    [TONE.faint]: '#DCDDE1',
    [TONE.dot]: '#3A3B40',
    [STRIKE.emerald300]: STRIKE.emerald600,
    [STRIKE.emerald400]: STRIKE.emerald500,
  },
  green: {
    [TONE.ink]: STRIKE.emerald500,
    [TONE.line]: '#FFFFFF',
    [TONE.mid]: '#C9F2E2',
    [TONE.dim]: '#7CDDBA',
    [TONE.faint]: '#4FCB9E',
    [TONE.dot]: '#FFFFFF',
    [STRIKE.emerald300]: '#FFFFFF',
    [STRIKE.emerald400]: '#FFFFFF',
    [STRIKE.emerald500]: '#FFFFFF',
    [STRIKE.emerald600]: '#E6FBF3',
    [STRIKE.emerald700]: '#E6FBF3',
  },
};

/** The ground a figure is drawn on, read off its background. */
export function groundOf(sc: Scene): Ground {
  const bg = sc.theme.background.toUpperCase();
  return bg === '#F9F9F9' ? 'light' : bg === STRIKE.emerald500.toUpperCase() ? 'green' : 'dark';
}

/** A copy of a dark-ground figure, redrawn for another ground. */
export function onGround(scene: Scene, ground: Ground): Scene {
  if (ground === 'dark') return scene;
  /* already redrawn for this ground: leave it */
  if (groundOf(scene) === ground) return scene;
  const map = new Map(Object.entries(SWAP[ground]).map(([k, v]) => [k.toUpperCase(), v]));
  const swap = (c: string | null) => (c ? map.get(c.toUpperCase()) ?? c : c);
  const json = JSON.stringify(scene, (_key, value) => (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? swap(value) : value));
  return JSON.parse(json) as Scene;
}
