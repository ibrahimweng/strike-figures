/* The editor's state: the figures, which one is open, what is selected, and
   undo history per figure. Every change goes through `update`, which copies
   the figure, lets the change edit the copy, and keeps the old one for undo.
   Changes made by one drag share a key, so the drag undoes as one step. */
import { create } from 'zustand';
import { blankScene, defaultDots, defaultGradient, defaultTheme, emptyFace, KINDS, type Kind, newObject, uid } from './defaults';
import { PRESETS, presetScene } from './presets';
import { shapeOf } from '../engine/render';
import { libraryScene } from '../library';
import type { DotFill, FaceStyle, Scene, SceneObject } from './types';

const STORAGE = 'strike-figures:v1';
const HISTORY = 120;

export interface Selection {
  objectId: string | null;
  /** a face of the selected object: "top", "bottom", "all", or a side like "s1" */
  face: string | null;
}

export type Tab = 'library' | 'mine' | 'objects';

interface State {
  scenes: Scene[];
  activeId: string;
  /** a library figure being looked at: saved to My figures on its first change */
  preview: Scene | null;
  previewId: string | null;
  /** show every setting, and let drags move objects */
  advanced: boolean;
  tab: Tab;
  selection: Selection;
  past: Record<string, Scene[]>;
  future: Record<string, Scene[]>;
  lastKey: string | null;
  lastAt: number;
  /** a message for the status line */
  notice: string | null;

  scene: () => Scene;
  setActive: (id: string) => void;
  update: (fn: (s: Scene) => void, key?: string) => void;
  updateObject: (id: string, fn: (o: SceneObject) => void, key?: string) => void;
  undo: () => void;
  redo: () => void;
  select: (objectId: string | null, face?: string | null) => void;
  add: (kind: Kind) => void;
  duplicate: () => void;
  remove: () => void;
  repeat: (count: number, offset: [number, number, number], heightStep: number) => void;
  newScene: () => void;
  duplicateScene: (id: string) => void;
  removeScene: (id: string) => void;
  resetPreset: (id: string) => void;
  importScene: (s: Scene) => void;
  notify: (msg: string | null) => void;
  openLibrary: (id: string) => void;
  setAdvanced: (on: boolean) => void;
  setTab: (t: Tab) => void;
}

const clone = <T>(v: T): T => structuredClone(v);

/** Where a new object can stand on the ground without landing inside the others: just to their right on screen. */
function besideEverything(sc: Scene, o: SceneObject): [number, number, number] {
  const vis = sc.objects.filter(x => x.visible);
  if (!vis.length) return [0, 0, 0];
  const reach = (x: SceneObject) => {
    const b = shapeOf(x.shape).bounds;
    return Math.max(Math.hypot(b.minX, b.minY), Math.hypot(b.maxX, b.minY), Math.hypot(b.minX, b.maxY), Math.hypot(b.maxX, b.maxY));
  };
  const yaw = (sc.camera.yaw * Math.PI) / 180;
  const d = { x: Math.cos(yaw), z: -Math.sin(yaw) };
  const along = (x: SceneObject) => x.position[0] * d.x + x.position[2] * d.z;
  const far = Math.max(...vis.map(x => along(x) + reach(x)));
  const cx = vis.reduce((s, x) => s + x.position[0], 0) / vis.length;
  const cz = vis.reduce((s, x) => s + x.position[2], 0) / vis.length;
  const across = { x: -d.z, z: d.x };
  const side = cx * across.x + cz * across.z;
  const t = far + 16 + reach(o);
  return [Math.round(d.x * t + across.x * side), 0, Math.round(d.z * t + across.z * side)];
}

/* Fill in anything a figure saved by an older version lacks. */
function fillObject(o: Partial<SceneObject>): SceneObject {
  const base = newObject(o.shape ?? { kind: 'box', width: 60, depth: 60, radius: 4 }, o.height ?? 60, o.name ?? 'Object');
  const face = (f?: Partial<FaceStyle> | null): FaceStyle => ({ ...emptyFace(), ...(f ?? {}), dots: f?.dots ? fillDots(f.dots) : null });
  return {
    ...base,
    ...o,
    id: o.id ?? uid(),
    style: { ...base.style, ...(o.style ?? {}) },
    faces: {
      top: face(o.faces?.top),
      bottom: face(o.faces?.bottom),
      sides: Object.fromEntries(Object.entries(o.faces?.sides ?? {}).map(([k, f]) => [k, face(f)])),
    },
    shadow: { ...base.shadow, ...(o.shadow ?? {}) },
    /* the sun mark of earlier versions is now the Strike logo */
    decal: o.decal
      ? { ...o.decal, text: o.decal.text ?? '', ...((o.decal.kind as string) === 'sunset' ? { kind: 'strike' as const, source: 'Strike logo', x: 0, y: 0, size: Math.min(o.decal.size, 96) } : {}) }
      : null,
  } as SceneObject;
}

function fillDots(d: Partial<DotFill>): DotFill {
  const base = defaultDots();
  return { ...base, ...d, gradient: { ...defaultGradient(), ...(d.gradient ?? {}) }, mask: d.mask ?? null };
}

export function fillScene(s: Partial<Scene>): Scene {
  const base = blankScene();
  return {
    ...base,
    ...s,
    id: s.id ?? uid(),
    artboard: { ...base.artboard, ...(s.artboard ?? {}) },
    camera: { ...base.camera, ...(s.camera ?? {}) },
    theme: { ...defaultTheme(), ...(s.theme ?? {}) },
    objects: (s.objects ?? []).map(fillObject),
    labels: (s.labels ?? []).map(l => ({ ...l })),
    preset: s.preset ?? null,
  };
}

function load(): { scenes: Scene[]; activeId: string } {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const data = JSON.parse(raw) as { scenes?: Partial<Scene>[]; activeId?: string };
      const scenes = (data.scenes ?? []).map(fillScene);
      if (scenes.length) return { scenes, activeId: scenes.some(s => s.id === data.activeId) ? data.activeId! : scenes[0]!.id };
    }
  } catch {
    /* private windows and blocked storage start fresh */
  }
  const scenes = PRESETS.map(p => p.make());
  return { scenes, activeId: scenes[0]!.id };
}

const initial = load();

const ADVANCED = 'strike-figures:advanced';
const loadAdvanced = () => {
  try {
    return localStorage.getItem(ADVANCED) === '1';
  } catch {
    return false;
  }
};
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

export const useStore = create<State>((set, get) => {
  const commit = (next: Scene, key?: string) => {
    const st = get();
    const cur = st.scene();
    const now = Date.now();
    const coalesce = !!key && key === st.lastKey && now - st.lastAt < 1200;
    const past = coalesce ? st.past[cur.id] ?? [] : [...(st.past[cur.id] ?? []), cur].slice(-HISTORY);
    set({
      scenes: st.scenes.map(s => (s.id === cur.id ? next : s)),
      past: { ...st.past, [cur.id]: past },
      future: { ...st.future, [cur.id]: [] },
      lastKey: key ?? null,
      lastAt: now,
    });
  };
  return {
    ...initial,
    preview: null,
    previewId: null,
    advanced: loadAdvanced(),
    tab: 'library',
    selection: { objectId: null, face: null },
    past: {},
    future: {},
    lastKey: null,
    lastAt: 0,
    notice: null,

    scene: () => {
      const st = get();
      return st.preview ?? st.scenes.find(s => s.id === st.activeId) ?? st.scenes[0]!;
    },
    setActive: id => set({ activeId: id, preview: null, previewId: null, selection: { objectId: null, face: null }, lastKey: null }),
    openLibrary: id => {
      const sc = libraryScene(id);
      if (!sc) return;
      const copy = clone(sc);
      copy.id = uid();
      copy.objects.forEach(o => (o.id = uid()));
      set({ preview: copy, previewId: id, selection: { objectId: null, face: null }, lastKey: null });
    },
    setAdvanced: on => {
      try {
        localStorage.setItem(ADVANCED, on ? '1' : '0');
      } catch {
        /* a preference only */
      }
      set({ advanced: on });
    },
    setTab: t => set({ tab: t }),
    update: (fn, key) => {
      const st = get();
      if (st.preview) {
        /* the first change to a library figure keeps it, as yours */
        const kept = clone(st.preview);
        set({ scenes: [...st.scenes, kept], activeId: kept.id, preview: null, previewId: null });
        get().notify(`Saved “${kept.name}” to My figures`);
      }
      const next = clone(get().scene());
      fn(next);
      commit(next, key);
    },
    updateObject: (id, fn, key) =>
      get().update(s => {
        const o = s.objects.find(x => x.id === id);
        if (o) fn(o);
      }, key),
    undo: () => {
      const st = get();
      const cur = st.scene();
      const past = st.past[cur.id] ?? [];
      if (!past.length) return;
      const prev = past[past.length - 1]!;
      set({
        scenes: st.scenes.map(s => (s.id === cur.id ? prev : s)),
        past: { ...st.past, [cur.id]: past.slice(0, -1) },
        future: { ...st.future, [cur.id]: [...(st.future[cur.id] ?? []), cur] },
        lastKey: null,
        selection: prev.objects.some(o => o.id === st.selection.objectId) ? st.selection : { objectId: null, face: null },
      });
    },
    redo: () => {
      const st = get();
      const cur = st.scene();
      const fut = st.future[cur.id] ?? [];
      if (!fut.length) return;
      const next = fut[fut.length - 1]!;
      set({
        scenes: st.scenes.map(s => (s.id === cur.id ? next : s)),
        past: { ...st.past, [cur.id]: [...(st.past[cur.id] ?? []), cur] },
        future: { ...st.future, [cur.id]: fut.slice(0, -1) },
        lastKey: null,
      });
    },
    select: (objectId, face = null) => set({ selection: { objectId, face } }),
    add: kind => {
      const o = KINDS[kind].make();
      const sc = get().scene();
      const n = sc.objects.filter(x => x.name.startsWith(o.name)).length;
      if (n) o.name = `${o.name} ${n + 1}`;
      o.position = besideEverything(sc, o);
      o.faces.top.dots = null;
      get().update(s => {
        s.objects.push(o);
      });
      set({ selection: { objectId: o.id, face: null } });
    },
    duplicate: () => {
      const { selection } = get();
      const src = get().scene().objects.find(o => o.id === selection.objectId);
      if (!src) return;
      const copy = clone(src);
      copy.id = uid();
      copy.name = `${src.name} copy`;
      copy.position = [src.position[0] + 12, src.position[1], src.position[2] + 12];
      get().update(s => {
        s.objects.splice(s.objects.findIndex(o => o.id === src.id) + 1, 0, copy);
      });
      set({ selection: { objectId: copy.id, face: null } });
    },
    remove: () => {
      const id = get().selection.objectId;
      if (!id) return;
      get().update(s => {
        s.objects = s.objects.filter(o => o.id !== id);
      });
      set({ selection: { objectId: null, face: null } });
    },
    repeat: (count, offset, heightStep) => {
      const id = get().selection.objectId;
      const src = get().scene().objects.find(o => o.id === id);
      if (!src || count < 1) return;
      get().update(s => {
        const at = s.objects.findIndex(o => o.id === src.id);
        const copies: SceneObject[] = [];
        for (let i = 1; i <= count; i++) {
          const c = clone(src);
          c.id = uid();
          c.name = `${src.name} ${i + 1}`;
          c.position = [src.position[0] + offset[0] * i, src.position[1] + offset[1] * i, src.position[2] + offset[2] * i];
          c.height = Math.max(0.5, src.height + heightStep * i);
          copies.push(c);
        }
        s.objects.splice(at + 1, 0, ...copies);
      });
    },
    newScene: () => {
      const sc = blankScene(`Figure ${get().scenes.length + 1}`);
      const box = KINDS.box.make();
      box.faces.top.dots = null;
      sc.objects.push(box);
      set(st => ({ scenes: [...st.scenes, sc], activeId: sc.id, selection: { objectId: null, face: null } }));
    },
    duplicateScene: id => {
      const src = get().scenes.find(s => s.id === id);
      if (!src) return;
      const copy = clone(src);
      copy.id = uid();
      copy.name = `${src.name} copy`;
      copy.preset = null;
      copy.objects.forEach(o => (o.id = uid()));
      set(st => {
        const i = st.scenes.findIndex(s => s.id === id);
        const scenes = st.scenes.slice();
        scenes.splice(i + 1, 0, copy);
        return { scenes, activeId: copy.id, selection: { objectId: null, face: null } };
      });
    },
    removeScene: id => {
      set(st => {
        let scenes = st.scenes.filter(s => s.id !== id);
        if (!scenes.length) scenes = [blankScene()];
        const activeId = st.activeId === id ? scenes[0]!.id : st.activeId;
        return { scenes, activeId, selection: { objectId: null, face: null } };
      });
    },
    resetPreset: id => {
      const src = get().scenes.find(s => s.id === id);
      const fromLib = src?.preset?.startsWith('lib:') ? libraryScene(src.preset.slice(4)) : null;
      const fresh = fromLib ? clone(fromLib) : src?.preset ? presetScene(src.preset) : null;
      if (!src || !fresh) return;
      fresh.id = src.id;
      get().update(s => {
        Object.assign(s, fresh);
      });
      set({ selection: { objectId: null, face: null } });
    },
    importScene: s => {
      const sc = fillScene(s);
      sc.id = uid();
      set(st => ({ scenes: [...st.scenes, sc], activeId: sc.id, selection: { objectId: null, face: null } }));
    },
    notify: msg => {
      if (noticeTimer) clearTimeout(noticeTimer);
      set({ notice: msg });
      if (msg) noticeTimer = setTimeout(() => set({ notice: null }), 2600);
    },
  };
});

/* Save as you go: a per-browser convenience, never the only copy (Save figure writes a file). */
let timer: ReturnType<typeof setTimeout> | null = null;
useStore.subscribe(st => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ scenes: st.scenes, activeId: st.activeId }));
    } catch {
      /* storage full or blocked: the figures still live in this tab */
    }
  }, 400);
});

export const faceStyleOf = (o: SceneObject, face: string): FaceStyle =>
  face === 'top' ? o.faces.top : face === 'bottom' ? o.faces.bottom : o.faces.sides[face] ?? emptyFace();

export function setFaceStyle(o: SceneObject, face: string, fn: (f: FaceStyle) => void) {
  if (face === 'top') fn(o.faces.top);
  else if (face === 'bottom') fn(o.faces.bottom);
  else {
    const f = o.faces.sides[face] ?? emptyFace();
    fn(f);
    o.faces.sides[face] = f;
  }
}
