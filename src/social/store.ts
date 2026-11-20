/* The thread being written, kept in this browser as you go. */
import { create } from 'zustand';
import { uid } from '../model/defaults';
import type { Ground } from '../model/ground';
import type { CardSize } from './layout';
import { postText } from './text';
import type { Post, Thread } from './types';

const STORAGE = 'strike-figures:thread';

/** The three parts of the tool: the design skill (where everyone lands), the figure editor, and the thread maker. */
export type Mode = 'skill' | 'figures' | 'thread';
const MODES: Mode[] = ['skill', 'figures', 'thread'];

/** A first thread in Strike's voice: calm, exact, the fact first. */
export function exampleThread(): Thread {
  const post = (p: Partial<Post> & Pick<Post, 'text' | 'headline'>): Post => ({
    id: uid(),
    eyebrow: '',
    sub: '',
    figure: { kind: 'library', id: 'every-market' },
    animated: false,
    duration: null,
    side: 'left',
    ground: null,
    size: null,
    ...p,
  });
  return {
    ground: 'dark',
    size: 'landscape',
    numberText: true,
    numberCards: true,
    posts: [
      post({
        eyebrow: 'Options',
        headline: 'Options on every market, *every hour.*',
        sub: 'Stocks, indices, crypto and compute, on one exchange.',
        text: 'Options on every market, every hour.\n\nStrike lists options on stocks, indices, crypto and compute, and they trade around the clock.',
        figure: { kind: 'library', id: 'every-market' },
        animated: true,
        side: 'left',
      }),
      post({
        eyebrow: 'Trading hours',
        headline: '168 hours a week. Not *32.5.*',
        sub: 'Listed options trade 6.5 hours a day, five days a week. Strike never closes.',
        text: 'Listed options trade 32.5 hours a week. Strike trades all 168.\n\nNews breaks on weekends and overnight. Your options should be open when it does.',
        figure: { kind: 'library', id: 'always-open' },
        side: 'right',
      }),
      post({
        eyebrow: 'Margin',
        headline: '~80 underlyings. *One margin account.*',
        sub: 'Hedge a stock position with a crypto option, from the same balance.',
        text: 'About 80 underlyings, one margin account.\n\nMake markets as continuous as the news.',
        figure: { kind: 'library', id: 'vault' },
        side: 'left',
      }),
    ],
  };
}

/* fill in anything a thread saved by an earlier version lacks */
function fillThread(t: Partial<Thread>): Thread | null {
  if (!Array.isArray(t.posts) || !t.posts.length) return null;
  const base = exampleThread();
  return {
    ground: t.ground ?? base.ground,
    size: t.size ?? base.size,
    numberText: t.numberText ?? base.numberText,
    numberCards: t.numberCards ?? base.numberCards,
    posts: t.posts.map(p => ({
      ...base.posts[0]!,
      ...{ animated: false, eyebrow: '', sub: '' },
      ...p,
      id: p.id ?? uid(),
    })),
  };
}

function load(): Thread {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const t = fillThread(JSON.parse(raw) as Partial<Thread>);
      if (t) return t;
    }
  } catch {
    /* private windows and blocked storage start with the example */
  }
  return exampleThread();
}

function loadMode(): Mode {
  /* Everyone lands on the Skill page; #figures and #thread open the other parts directly. */
  try {
    const h = location.hash.replace('#', '') as Mode;
    return MODES.includes(h) ? h : 'skill';
  } catch {
    return 'skill';
  }
}

interface ThreadState {
  mode: Mode;
  thread: Thread;
  selectedId: string;
  setMode: (m: Mode) => void;
  select: (id: string) => void;
  updatePost: (id: string, patch: Partial<Post>) => void;
  setDefaults: (patch: Partial<Pick<Thread, 'ground' | 'size' | 'numberText' | 'numberCards'>>) => void;
  addPost: () => void;
  duplicatePost: (id: string) => void;
  removePost: (id: string) => void;
  movePost: (id: string, by: -1 | 1) => void;
  reset: () => void;
}

const initial = load();

export const useThread = create<ThreadState>((set, get) => ({
  mode: loadMode(),
  thread: initial,
  selectedId: initial.posts[0]!.id,
  setMode: mode => {
    try {
      if (mode !== get().mode) history.pushState(null, '', mode === 'skill' ? location.pathname + location.search : `#${mode}`);
    } catch {
      /* the address bar is a convenience only */
    }
    set({ mode });
  },
  select: id => set({ selectedId: id }),
  updatePost: (id, patch) => set(st => ({ thread: { ...st.thread, posts: st.thread.posts.map(p => (p.id === id ? { ...p, ...patch } : p)) } })),
  setDefaults: patch => set(st => ({ thread: { ...st.thread, ...patch } })),
  addPost: () => {
    const { thread, selectedId } = get();
    const i = thread.posts.findIndex(p => p.id === selectedId);
    const prev = thread.posts[i] ?? thread.posts[thread.posts.length - 1];
    const post: Post = {
      id: uid(),
      text: '',
      headline: '',
      eyebrow: '',
      sub: '',
      figure: prev?.figure ?? { kind: 'library', id: 'every-market' },
      animated: prev?.animated ?? false,
      duration: null,
      /* alternate sides down the thread */
      side: prev?.side === 'left' ? 'right' : 'left',
      ground: null,
      size: null,
    };
    const posts = thread.posts.slice();
    posts.splice(i < 0 ? posts.length : i + 1, 0, post);
    set({ thread: { ...thread, posts }, selectedId: post.id });
  },
  duplicatePost: id => {
    const { thread } = get();
    const i = thread.posts.findIndex(p => p.id === id);
    if (i < 0) return;
    const copy: Post = { ...structuredClone(thread.posts[i]!), id: uid() };
    const posts = thread.posts.slice();
    posts.splice(i + 1, 0, copy);
    set({ thread: { ...thread, posts }, selectedId: copy.id });
  },
  removePost: id => {
    const { thread, selectedId } = get();
    if (thread.posts.length < 2) return;
    const i = thread.posts.findIndex(p => p.id === id);
    const posts = thread.posts.filter(p => p.id !== id);
    set({ thread: { ...thread, posts }, selectedId: selectedId === id ? posts[Math.min(i, posts.length - 1)]!.id : selectedId });
  },
  movePost: (id, by) => {
    const { thread } = get();
    const i = thread.posts.findIndex(p => p.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= thread.posts.length) return;
    const posts = thread.posts.slice();
    [posts[i], posts[j]] = [posts[j]!, posts[i]!];
    set({ thread: { ...thread, posts } });
  },
  reset: () => {
    const thread = exampleThread();
    set({ thread, selectedId: thread.posts[0]!.id });
  },
}));

/** The thread's text, ready to paste: posts in order, separated by blank lines, numbered if asked. */
export function threadText(thread: Thread): string {
  const n = thread.posts.length;
  return thread.posts.map((p, i) => postText(p.text, i, n, thread.numberText)).join('\n\n\n');
}

export const GROUND_OPTIONS: { value: Ground; label: string; swatch: string }[] = [
  { value: 'dark', label: 'Black', swatch: '#0C0C0C' },
  { value: 'light', label: 'White', swatch: '#F9F9F9' },
  { value: 'green', label: 'Green', swatch: '#10B981' },
];

export const SIZE_OPTIONS: { value: CardSize; label: string }[] = [
  { value: 'landscape', label: 'Landscape 16:9' },
  { value: 'square', label: 'Square 1:1' },
];

/* Save as you go. */
let timer: ReturnType<typeof setTimeout> | null = null;
useThread.subscribe((st, prev) => {
  if (st.thread === prev.thread) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(st.thread));
    } catch {
      /* storage full or blocked: the thread still lives in this tab */
    }
  }, 300);
});

/* Back and forward move between the tool's parts too. */
if (typeof window !== 'undefined')
  for (const ev of ['hashchange', 'popstate'])
    window.addEventListener(ev, () => {
      const m = loadMode();
      if (m !== useThread.getState().mode) useThread.setState({ mode: m });
    });
