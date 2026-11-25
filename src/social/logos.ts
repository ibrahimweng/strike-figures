/* The official logo files from the brand kit (skill/assets/logo), drawn
   onto cards as they are: never retyped or redrawn. 3D green on the dark
   ground, 3D black on white, flat white on the green gradient and on
   photos. */
import { svgImage } from '../anim/encode';
import lockupBlack from '../../skill/assets/logo/strike-lockup-3d-black.svg?raw';
import lockupGreen from '../../skill/assets/logo/strike-lockup-3d-green.svg?raw';
import lockupWhite from '../../skill/assets/logo/strike-lockup-flat-white.svg?raw';
import markBlack from '../../skill/assets/logo/strike-mark-3d-black.svg?raw';
import markGreen from '../../skill/assets/logo/strike-mark-3d-green.svg?raw';
import markWhite from '../../skill/assets/logo/strike-mark-flat-white.svg?raw';
import type { Palette } from './layout';

const FILES: Record<Palette['logo'], { lockup: string; mark: string }> = {
  green: { lockup: lockupGreen, mark: markGreen },
  black: { lockup: lockupBlack, mark: markBlack },
  white: { lockup: lockupWhite, mark: markWhite },
};

/** The SVG of the logo file for this palette and kind. */
export const logoSvg = (color: Palette['logo'], kind: 'lockup' | 'mark') => FILES[color][kind];

const cache = new Map<string, Promise<HTMLImageElement>>();

/** The logo as an image w×h px (kept: cards redraw often). */
export function logoImage(color: Palette['logo'], kind: 'lockup' | 'mark', w: number, h: number): Promise<HTMLImageElement> {
  const W = Math.max(1, Math.round(w));
  const H = Math.max(1, Math.round(h));
  const key = `${color}|${kind}|${W}x${H}`;
  let p = cache.get(key);
  if (!p) {
    if (cache.size > 40) cache.delete(cache.keys().next().value!);
    p = svgImage(logoSvg(color, kind), W, H);
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return p;
}
