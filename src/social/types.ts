/* A thread: posts in order, each with what goes into X (its text) and the
   card that goes with it (words, illustration, look). */
import type { Ground } from '../model/ground';
import type { Scene } from '../model/types';
import type { CardSize, Side } from './layout';

export type FigureRef =
  | { kind: 'library'; id: string }
  /** one of My figures; the copy is kept in case the figure is later deleted */
  | { kind: 'mine'; id: string; name: string; snapshot: Scene };

export interface Post {
  id: string;
  /** what goes into X */
  text: string;
  /** the card's words: *asterisks* highlight */
  headline: string;
  eyebrow: string;
  sub: string;
  figure: FigureRef;
  animated: boolean;
  /** seconds per loop; null keeps the figure's own */
  duration: number | null;
  side: Side;
  /** null follows the thread */
  ground: Ground | null;
  size: CardSize | null;
}

export interface Thread {
  posts: Post[];
  ground: Ground;
  size: CardSize;
  /** add "1/5" to each post's text */
  numberText: boolean;
  /** show "1/5" on each card */
  numberCards: boolean;
}

export const groundOfPost = (t: Thread, p: Post): Ground => p.ground ?? t.ground;
export const sizeOfPost = (t: Thread, p: Post): CardSize => p.size ?? t.size;
