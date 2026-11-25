/* What is being made, kept in this browser as you go: single posts, and one
   X thread. Each is a list of posts with its own look. */
import { create } from 'zustand';
import { uid } from '../model/defaults';
import type { Ground } from '../model/ground';
import { fillPattern } from '../pattern/spec';
import { DEFAULT_CHART, fillChart } from './chart';
import { type CardSize, LAYOUTS } from './layout';
import { plainOf, postText } from './text';
import type { Post, Thread } from './types';

const STORAGE = 'strike-figures:thread';
const STORAGE_POSTS = 'strike-figures:posts';
const STORAGE_PREFS = 'strike-figures:post-prefs';

/** The three parts of the tool: the design skill (where everyone lands), the figure editor, and the post and thread maker. */
export type Mode = 'skill' | 'figures' | 'thread' | 'patterns';
const MODES: Mode[] = ['skill', 'figures', 'thread', 'patterns'];

/** Single posts, or one numbered thread. */
export type Category = Thread['kind'];

/** A blank post, with what every post starts from. */
export function newPost(p: Partial<Post> = {}): Post {
  return {
    id: uid(),
    text: '',
    headline: '',
    eyebrow: '',
    sub: '',
    visual: 'panel',
    figure: { kind: 'library', id: 'every-market' },
    image: null,
    chart: { ...DEFAULT_CHART },
    pattern: null,
    patternClear: true,
    layout: 'standard',
    animated: false,
    duration: null,
    side: 'left',
    logo: 'auto',
    risk: null,
    ground: null,
    size: null,
    dismissed: [],
    ...p,
  };
}

/** A first thread in Strike's voice: calm, exact, the fact first. */
export function exampleThread(): Thread {
  return {
    kind: 'thread',
    ground: 'dark',
    size: 'landscape',
    numberText: true,
    numberCards: true,
    posts: [
      newPost({
        headline: 'Options on every market, *every hour.*',
        sub: 'Stocks, indices, pre-IPO companies, GPU compute and crypto, on one exchange.',
        text: 'Options on every market, every hour.\n\nStrike is an options exchange that never closes: stocks, indices, pre-IPO companies, GPU compute and crypto.',
        figure: { kind: 'library', id: 'every-market' },
        animated: true,
        side: 'left',
      }),
      newPost({
        eyebrow: 'Trading hours',
        headline: 'Open 168 hours a week. Not *32.5.*',
        sub: 'Listed options trade about 32.5 hours a week. Strike never closes.',
        text: 'Listed options trade about 32.5 hours a week. Strike is open all 168.\n\nPositions can be hedged when events happen, not when markets reopen.',
        figure: { kind: 'library', id: 'always-open' },
        side: 'right',
      }),
      newPost({
        eyebrow: 'Margin',
        headline: 'About 80 underlyings. *One margin account.*',
        sub: 'Hedge a stock position with a crypto option, from the same balance.',
        text: 'About 80 underlyings, one self-custodial margin account.\n\nOptions involve risk. Closed beta, invite required.',
        figure: { kind: 'library', id: 'unified-margin' },
        side: 'left',
      }),
    ],
  };
}

/** First single posts: one of each kind of picture. */
export function examplePosts(): Thread {
  return {
    kind: 'posts',
    ground: 'dark',
    size: 'landscape',
    numberText: false,
    numberCards: false,
    posts: [
      newPost({
        headline: 'Listed options are closed *81%* of the week.',
        text: 'Listed options are closed 81% of the week. Strike is open 168 hours.\n\nOptions involve risk. Closed beta, invite required.',
        visual: 'corner',
        figure: { kind: 'library', id: 'drawn-mark' },
      }),
      newPost({
        headline: 'Volume, *every hour* of the week.',
        sub: 'Drop or paste your screenshot here.',
        text: '',
        visual: 'screenshot',
        size: 'portrait',
        side: 'right',
      }),
      newPost({
        headline: 'About 80 underlyings. *One margin account.*',
        text: '',
        visual: 'panel',
        figure: { kind: 'library', id: 'unified-margin' },
        size: 'square',
      }),
    ],
  };
}

/* fill in anything a list saved by an earlier version lacks */
export function fillList(t: Partial<Thread>, kind: Category): Thread | null {
  if (!Array.isArray(t.posts) || !t.posts.length) return null;
  const base = kind === 'thread' ? exampleThread() : examplePosts();
  return {
    kind,
    ground: t.ground ?? base.ground,
    size: t.size ?? base.size,
    numberText: kind === 'thread' ? t.numberText ?? true : false,
    numberCards: kind === 'thread' ? t.numberCards ?? true : false,
    posts: t.posts.map(p => {
      const post = newPost({ ...(p as Partial<Post>), id: p.id ?? uid() });
      if (!Array.isArray(post.dismissed)) post.dismissed = [];
      if (!['panel', 'corner', 'screenshot', 'photo', 'chart', 'none'].includes(post.visual)) post.visual = 'panel';
      post.chart = fillChart(post.chart);
      post.pattern = post.pattern ? fillPattern(post.pattern) : null;
      if (!LAYOUTS.includes(post.layout)) post.layout = 'standard';
      if (!['auto', 'lockup', 'mark'].includes(post.logo)) post.logo = 'auto';
      return post;
    }),
  };
}

function loadList(key: string, kind: Category): Thread {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const t = fillList(JSON.parse(raw) as Partial<Thread>, kind);
      if (t) return t;
    }
  } catch {
    /* private windows and blocked storage start with the examples */
  }
  return kind === 'thread' ? exampleThread() : examplePosts();
}

interface Prefs {
  /** show suggestions while editing */
  tips: boolean;
  /** the first-time guide has been seen */
  guideSeen: boolean;
  category: Category;
}

function loadPrefs(): Prefs {
  const base: Prefs = { tips: true, guideSeen: false, category: 'posts' };
  try {
    const raw = localStorage.getItem(STORAGE_PREFS);
    if (raw) return { ...base, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* defaults */
  }
  return base;
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
  category: Category;
  /** the list being edited: single posts or the thread */
  thread: Thread;
  /** the other list, kept while the first is edited */
  lists: Record<Category, Thread>;
  selectedId: string;
  selected: Record<Category, string>;
  tips: boolean;
  guideSeen: boolean;
  setMode: (m: Mode) => void;
  setCategory: (c: Category) => void;
  setTips: (on: boolean) => void;
  setGuideSeen: (seen: boolean) => void;
  select: (id: string) => void;
  updatePost: (id: string, patch: Partial<Post>) => void;
  setDefaults: (patch: Partial<Pick<Thread, 'ground' | 'size' | 'numberText' | 'numberCards'>>) => void;
  addPost: () => void;
  /** a new post after the selected one, from a template */
  addFrom: (patch: Partial<Post>) => void;
  duplicatePost: (id: string) => void;
  removePost: (id: string) => void;
  movePost: (id: string, by: -1 | 1) => void;
  reset: () => void;
}

const prefs = loadPrefs();
const initialLists: Record<Category, Thread> = { posts: loadList(STORAGE_POSTS, 'posts'), thread: loadList(STORAGE, 'thread') };
const initialSelected: Record<Category, string> = { posts: initialLists.posts.posts[0]!.id, thread: initialLists.thread.posts[0]!.id };

export const useThread = create<ThreadState>((set, get) => {
  /* every change to the list being edited goes through here, so the kept copy stays in step */
  const setList = (thread: Thread, selectedId?: string) =>
    set(st => {
      const id = selectedId ?? st.selectedId;
      return { thread, lists: { ...st.lists, [st.category]: thread }, selectedId: id, selected: { ...st.selected, [st.category]: id } };
    });
  return {
    mode: loadMode(),
    category: prefs.category,
    thread: initialLists[prefs.category],
    lists: initialLists,
    selectedId: initialSelected[prefs.category],
    selected: initialSelected,
    tips: prefs.tips,
    guideSeen: prefs.guideSeen,
    setMode: mode => {
      try {
        if (mode !== get().mode) history.pushState(null, '', mode === 'skill' ? location.pathname + location.search : `#${mode}`);
      } catch {
        /* the address bar is a convenience only */
      }
      set({ mode });
    },
    setCategory: category =>
      set(st => (st.category === category ? {} : { category, thread: st.lists[category], selectedId: st.selected[category] })),
    setTips: tips => set({ tips }),
    setGuideSeen: guideSeen => set({ guideSeen }),
    select: id => set(st => ({ selectedId: id, selected: { ...st.selected, [st.category]: id } })),
    updatePost: (id, patch) => setList({ ...get().thread, posts: get().thread.posts.map(p => (p.id === id ? { ...p, ...patch } : p)) }),
    setDefaults: patch => setList({ ...get().thread, ...patch }),
    addFrom: patch => {
      const { thread, selectedId } = get();
      const i = thread.posts.findIndex(p => p.id === selectedId);
      const post = newPost({ ...JSON.parse(JSON.stringify(patch)) as Partial<Post>, text: plainOf(patch.headline ?? '') + (patch.sub ? ` ${plainOf(patch.sub)}` : '') });
      const posts = thread.posts.slice();
      posts.splice(i < 0 ? posts.length : i + 1, 0, post);
      setList({ ...thread, posts }, post.id);
    },
    addPost: () => {
      const { thread, selectedId } = get();
      const i = thread.posts.findIndex(p => p.id === selectedId);
      const prev = thread.posts[i] ?? thread.posts[thread.posts.length - 1];
      const post = newPost({
        visual: prev?.visual === 'screenshot' || prev?.visual === 'photo' ? 'panel' : prev?.visual ?? 'panel',
        figure: prev?.figure ?? { kind: 'library', id: 'every-market' },
        animated: prev?.animated ?? false,
        /* alternate sides down a thread */
        side: thread.kind === 'thread' && prev?.side === 'left' ? 'right' : 'left',
      });
      const posts = thread.posts.slice();
      posts.splice(i < 0 ? posts.length : i + 1, 0, post);
      setList({ ...thread, posts }, post.id);
    },
    duplicatePost: id => {
      const { thread } = get();
      const i = thread.posts.findIndex(p => p.id === id);
      if (i < 0) return;
      const copy: Post = { ...structuredClone(thread.posts[i]!), id: uid() };
      const posts = thread.posts.slice();
      posts.splice(i + 1, 0, copy);
      setList({ ...thread, posts }, copy.id);
    },
    removePost: id => {
      const { thread, selectedId } = get();
      if (thread.posts.length < 2) return;
      const i = thread.posts.findIndex(p => p.id === id);
      const posts = thread.posts.filter(p => p.id !== id);
      setList({ ...thread, posts }, selectedId === id ? posts[Math.min(i, posts.length - 1)]!.id : selectedId);
    },
    movePost: (id, by) => {
      const { thread } = get();
      const i = thread.posts.findIndex(p => p.id === id);
      const j = i + by;
      if (i < 0 || j < 0 || j >= thread.posts.length) return;
      const posts = thread.posts.slice();
      [posts[i], posts[j]] = [posts[j]!, posts[i]!];
      setList({ ...thread, posts });
    },
    reset: () => {
      const thread = get().category === 'thread' ? exampleThread() : examplePosts();
      setList(thread, thread.posts[0]!.id);
    },
  };
});

/** The thread's text, ready to paste: posts in order, separated by blank lines, numbered if asked. */
export function threadText(thread: Thread): string {
  const n = thread.posts.length;
  return thread.posts.map((p, i) => postText(p.text, i, n, thread.kind === 'thread' && thread.numberText)).join('\n\n\n');
}

export const GROUND_OPTIONS: { value: Ground; label: string; swatch: string }[] = [
  { value: 'dark', label: 'Black', swatch: '#0C0C0C' },
  { value: 'light', label: 'White', swatch: '#F9F9F9' },
  { value: 'green', label: 'Green', swatch: 'linear-gradient(#60E9A1, #10B981 55%, #017857)' },
];

export const SIZE_OPTIONS: { value: CardSize; label: string; short: string }[] = [
  { value: 'landscape', label: 'Landscape 16:9', short: '16:9' },
  { value: 'square', label: 'Square 1:1', short: '1:1' },
  { value: 'portrait', label: 'Portrait 4:5', short: '4:5' },
];

/* Save as you go. */
let timer: ReturnType<typeof setTimeout> | null = null;
useThread.subscribe((st, prev) => {
  if (st.lists === prev.lists && st.tips === prev.tips && st.guideSeen === prev.guideSeen && st.category === prev.category) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(st.lists.thread));
      localStorage.setItem(STORAGE_POSTS, JSON.stringify(st.lists.posts));
      localStorage.setItem(STORAGE_PREFS, JSON.stringify({ tips: st.tips, guideSeen: st.guideSeen, category: st.category } satisfies Prefs));
    } catch {
      /* storage full or blocked: the work still lives in this tab */
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
