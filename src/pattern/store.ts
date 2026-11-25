/* The Patterns tab's state: the pattern being made, the artboard it is made
   on, and, when it was opened from a post, which post it goes back to. */
import { create } from 'zustand';
import { DEFAULT_PATTERN, fillPattern, type PatternGround, type PatternSpec, presetSpec } from './spec';

export type PatternSize = 'landscape' | 'square' | 'portrait' | 'story' | 'poster' | 'slide' | 'header';

export const PATTERN_SIZES: Record<PatternSize, { width: number; height: number; label: string; title: string }> = {
  landscape: { width: 1600, height: 900, label: '16:9', title: 'Post, landscape' },
  square: { width: 1200, height: 1200, label: '1:1', title: 'Post, square' },
  portrait: { width: 1200, height: 1500, label: '4:5', title: 'Post, portrait (Instagram)' },
  story: { width: 1080, height: 1920, label: '9:16', title: 'Story' },
  poster: { width: 1414, height: 2000, label: 'Poster', title: 'A-series poster' },
  slide: { width: 1920, height: 1080, label: 'Slide', title: 'Slide' },
  header: { width: 1500, height: 500, label: 'Header', title: 'X header' },
};

export const SIZE_LIST: PatternSize[] = ['landscape', 'square', 'portrait', 'story', 'poster', 'slide', 'header'];

export const PATTERN_GROUNDS: { value: PatternGround; label: string; swatch: string }[] = [
  { value: 'dark', label: 'Black', swatch: '#0C0C0C' },
  { value: 'light', label: 'White', swatch: '#F9F9F9' },
  { value: 'gray', label: 'Gray', swatch: '#E8E8E9' },
  { value: 'green', label: 'Green', swatch: 'linear-gradient(#60E9A1, #10B981, #017857)' },
  { value: 'none', label: 'None', swatch: 'repeating-conic-gradient(#3a3a3a 0 25%, #222 0 50%) 0 0 / 8px 8px' },
];

interface PatternState {
  spec: PatternSpec;
  size: PatternSize;
  ground: PatternGround;
  preset: string | null;
  playing: boolean;
  /** opened from a post: "Use on post" goes back to it */
  forPost: string | null;
  set: (patch: Partial<PatternSpec>) => void;
  setPart: <K extends 'wave' | 'ribbon' | 'discs' | 'rings' | 'solid' | 'motion'>(key: K, patch: Partial<PatternSpec[K]>) => void;
  setSize: (size: PatternSize) => void;
  setGround: (ground: PatternGround) => void;
  applyPreset: (id: string) => void;
  setPlaying: (on: boolean) => void;
  openFor: (postId: string | null, spec: PatternSpec | null, ground?: PatternGround, size?: PatternSize) => void;
  reset: () => void;
}

const KEY = 'strike-figures:pattern';

interface Saved {
  spec: PatternSpec;
  size: PatternSize;
  ground: PatternGround;
  preset: string | null;
}

function load(): Saved {
  const base: Saved = { spec: presetSpec('wave'), size: 'landscape', ground: 'dark', preset: 'wave' };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const s = JSON.parse(raw) as Partial<Saved>;
    return {
      spec: fillPattern(s.spec),
      size: s.size && s.size in PATTERN_SIZES ? s.size : base.size,
      ground: s.ground ?? base.ground,
      preset: s.preset ?? null,
    };
  } catch {
    return base;
  }
}

const saved = load();

export const usePattern = create<PatternState>(set => ({
  ...saved,
  playing: true,
  forPost: null,
  set: patch => set(st => ({ spec: { ...st.spec, ...patch }, preset: patch.kind && patch.kind !== st.spec.kind ? null : st.preset })),
  setPart: (key, patch) => set(st => ({ spec: { ...st.spec, [key]: { ...st.spec[key], ...patch } } })),
  setSize: size => set({ size }),
  setGround: ground => set({ ground }),
  applyPreset: id => set(st => ({ spec: presetSpec(id, st.spec), preset: id })),
  setPlaying: playing => set({ playing }),
  openFor: (forPost, spec, ground, size) => set(st => ({ forPost, spec: spec ? fillPattern(spec) : st.spec, ground: ground ?? st.ground, size: size ?? st.size, preset: spec ? null : st.preset })),
  reset: () => set({ spec: { ...DEFAULT_PATTERN }, preset: null }),
}));

usePattern.subscribe(st => {
  try {
    const out: Saved = { spec: st.spec, size: st.size, ground: st.ground, preset: st.preset };
    localStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    /* storage is a convenience */
  }
});
