/* Posts: what goes into X (the text) and the card that goes with it (words,
   picture, look). Single posts and threads are both lists of posts; a
   thread numbers them and signs off with the risk line on its last card. */
import type { Ground } from '../model/ground';
import type { Scene } from '../model/types';
import type { PostImage } from './images';
import type { CardSize, LogoChoice, Side, Visual } from './layout';

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
  /** the kind of picture: an illustration (in a panel or from a corner), a screenshot, a photo, or none */
  visual: Visual;
  figure: FigureRef;
  /** the screenshot or photo, when the picture is one */
  image: PostImage | null;
  animated: boolean;
  /** seconds per loop; null keeps the figure's own */
  duration: number | null;
  side: Side;
  /** the full lockup when it fits (auto), or always the lockup, or the mark alone */
  logo: LogoChoice;
  /** the risk line; null: on for single posts and a thread's last card */
  risk: boolean | null;
  /** null follows the list */
  ground: Ground | null;
  size: CardSize | null;
  /** suggestions this post has been told to ignore */
  dismissed: string[];
}

export interface Thread {
  /** 'posts': separate single posts; 'thread': one X thread, numbered */
  kind: 'posts' | 'thread';
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
/** single posts stand alone: no numbers, and each carries the risk line */
export const isSingle = (t: Thread) => t.kind === 'posts' || t.posts.length < 2;
export const riskOfPost = (t: Thread, p: Post, index: number): boolean => p.risk ?? (isSingle(t) || index === t.posts.length - 1);
