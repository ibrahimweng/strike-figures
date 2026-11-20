/* The library: fifty illustrations, all drawn by the kit's rules (see kit.ts). */
import type { Scene } from '../model/types';
import { DATA } from './data';
import { OPTIONS } from './options';
import { TECH } from './tech';

export type Category = 'data' | 'options' | 'tech';

export interface Entry {
  id: string;
  title: string;
  tags: string[];
  make: () => Scene;
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
];

const tag = (list: Entry[], category: Category, prefix: string): LibraryItem[] =>
  list.map((e, i) => ({ ...e, category, code: `${prefix}·${String(i + 1).padStart(2, '0')}` }));

export const LIBRARY: LibraryItem[] = [...tag(DATA, 'data', 'D'), ...tag(OPTIONS, 'options', 'O'), ...tag(TECH, 'tech', 'T')];

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
