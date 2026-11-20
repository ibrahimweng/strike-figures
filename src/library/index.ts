/* The library: sixty-five illustrations, all drawn by the kit's rules (see kit.ts):
   17 data, 17 options, 16 tech, and 15 from Strike's brand book. */
import type { Loop } from '../anim/motion';
import type { Scene } from '../model/types';
import { BRAND } from './brand';
import { DATA } from './data';
import { LOOPS } from './loops';
import { OPTIONS } from './options';
import { TECH } from './tech';

export type Category = 'data' | 'options' | 'tech' | 'brand';

export interface Entry {
  id: string;
  title: string;
  tags: string[];
  make: () => Scene;
  /** its own animation loop (see src/anim) */
  loop?: Loop;
}

export interface LibraryItem extends Entry {
  category: Category;
  /** e.g. "D·01" */
  code: string;
}

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'data', label: 'Data' },
  { id: 'options', label: 'Options' },
  { id: 'tech', label: 'Tech' },
  { id: 'brand', label: 'Brand' },
];

const tag = (list: Entry[], category: Category, prefix: string): LibraryItem[] =>
  list.map((e, i) => ({ ...e, loop: e.loop ?? LOOPS[e.id], category, code: `${prefix}·${String(i + 1).padStart(2, '0')}` }));

export const LIBRARY: LibraryItem[] = [...tag(DATA, 'data', 'D'), ...tag(OPTIONS, 'options', 'O'), ...tag(TECH, 'tech', 'T'), ...tag(BRAND, 'brand', 'B')];

const made = new Map<string, Scene>();

/** A library figure, made once and shared (copy it before editing). */
export function libraryScene(id: string): Scene | null {
  const item = LIBRARY.find(x => x.id === id);
  if (!item) return null;
  let sc = made.get(id);
  if (!sc) {
    sc = item.make();
    sc.label = item.code;
    sc.preset = `lib:${id}`;
    made.set(id, sc);
  }
  return sc;
}
