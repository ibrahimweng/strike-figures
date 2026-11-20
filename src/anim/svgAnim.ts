/* Animated SVG: a loop of frames as one self-contained file that plays in a
   browser, also inside an <img>, with CSS keyframes and no script.

   Most of a figure stays put while a little of it moves, so the frames are
   merged rather than stacked: each distinct element is written once and is
   shown only during the frames it belongs to. Elements that show in the same
   frames share one class, and an element in every frame needs none. The
   class rule hides what frame 0 doesn't show, so a viewer that ignores CSS
   animation still sees the first frame rather than every frame at once.

   lottie.ts reads the same merge (mergeFrames, gather). */
import { num } from '../engine/curves';
import type { El } from '../engine/svg';

/** One distinct element of the loop and the frames it is painted in (ascending). */
export interface Piece {
  el: El;
  frames: number[];
}

export interface Merged {
  /** the first frame's root attributes (size, viewBox, inherited paint) */
  root: El['attrs'];
  /** referenced definitions (shadow filters), deduped, with fresh ids */
  defs: El[];
  /** every element in one paint order that holds for every frame */
  pieces: Piece[];
}

const esc = (v: string | number) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Compact SVG text for an element: no indentation, so it doubles as the element's identity. */
export function xml(el: El): string {
  let s = `<${el.tag}`;
  for (const [k, v] of Object.entries(el.attrs)) s += ` ${k}="${esc(v)}"`;
  return el.children?.length ? `${s}>${el.children.map(xml).join('')}</${el.tag}>` : `${s}/>`;
}

/* data-* attributes only tag layers for the editor; they'd stop identical shapes matching. */
function strip(el: El, ids: Map<string, string>): El {
  const attrs: El['attrs'] = {};
  for (const [k, v] of Object.entries(el.attrs)) {
    if (k.startsWith('data-')) continue;
    let w = v;
    if (typeof v === 'string') {
      w = v.replace(/url\(#([^)]+)\)/g, (m, id: string) => (ids.has(id) ? `url(#${ids.get(id)})` : m));
      if ((k === 'href' || k === 'xlink:href') && v.startsWith('#')) w = `#${ids.get(v.slice(1)) ?? v.slice(1)}`;
    }
    attrs[k] = w;
  }
  return el.children ? { tag: el.tag, attrs, children: el.children.map(c => strip(c, ids)) } : { tag: el.tag, attrs };
}

const plainGroup = (el: El) => el.tag === 'g' && Object.keys(el.attrs).every(k => k.startsWith('data-'));

/* A frame's painted elements in order, groups unwrapped; its defs go to `defs`. */
function leaves(el: El, defs: El[], out: El[] = []): El[] {
  for (const c of el.children ?? []) {
    if (c.tag === 'defs') defs.push(...(c.children ?? []));
    else if (plainGroup(c)) leaves(c, defs, out);
    else out.push(c);
  }
  return out;
}

/** Max over a prefix of positions, for the weighted alignment below (a Fenwick tree). */
class PrefixMax {
  private val: Float64Array;
  private who: Int32Array;
  constructor(n: number) {
    this.val = new Float64Array(n + 1);
    this.who = new Int32Array(n + 1).fill(-1);
  }
  set(pos: number, v: number, id: number) {
    for (let k = pos + 1; k < this.val.length; k += k & -k) if (v > this.val[k]!) [this.val[k], this.who[k]] = [v, id];
  }
  /** the best value at positions < pos, and who holds it */
  below(pos: number): [number, number] {
    let best = 0;
    let id = -1;
    for (let k = pos; k > 0; k -= k & -k) if (this.val[k]! > best) [best, id] = [this.val[k]!, this.who[k]!];
    return [best, id];
  }
}

/**
 * Merge frames into one paint order. Frames are taken one at a time and lined
 * up against the order so far: the alignment keeps the most bytes of elements
 * already written (a weighted longest common subsequence), and whatever
 * doesn't line up is written as a new piece just before its next matched
 * neighbour. Every frame stays a subsequence of the result, so its picture is
 * exact; an element whose place changes between frames (one shape passing
 * another) simply becomes two pieces, so the order can never form a cycle.
 */
export function mergeFrames(frames: El[]): Merged {
  if (!frames.length) throw new Error('mergeFrames: no frames');
  const defKeys = new Map<string, string>();
  const defs: El[] = [];
  const used = new Set<string>();
  let order: { key: string; piece: Piece }[] = [];
  frames.forEach((frame, f) => {
    /* identical filters share one id; the same old id in two frames may mean two different filters */
    const own: El[] = [];
    const els = leaves(frame, own);
    const ids = new Map<string, string>();
    for (const d of own) {
      const id = d.attrs.id;
      if (id === undefined) continue;
      const { id: _drop, ...rest } = d.attrs;
      const k = xml({ ...d, attrs: rest });
      let fresh = defKeys.get(k);
      if (!fresh) {
        fresh = `s${defKeys.size.toString(36)}`;
        defKeys.set(k, fresh);
        defs.push({ ...d, attrs: { id: fresh, ...rest } });
      }
      ids.set(String(id), fresh);
    }
    const seen = new Map<string, number>();
    const items = els.map(e => {
      const el = strip(e, ids);
      const text = xml(el);
      for (const m of text.matchAll(/url\(#([^)]+)\)/g)) used.add(m[1]!);
      const n = seen.get(text) ?? 0;
      seen.set(text, n + 1);
      return { key: n ? `${text}\u0000${n}` : text, el };
    });

    /* weighted alignment of this frame (i) against the order so far (j), increasing in both */
    const at = new Map<string, number[]>();
    order.forEach((o, j) => {
      const list = at.get(o.key);
      if (list) list.push(j);
      else at.set(o.key, [j]);
    });
    const tree = new PrefixMax(order.length);
    const pairs: { i: number; j: number; prev: number }[] = [];
    items.forEach((it, i) => {
      const js = at.get(it.key);
      if (!js) return;
      /* query every candidate before setting any, so one item can't match twice */
      const found = js.map(j => [j, ...tree.below(j)] as const);
      for (const [j, best, prev] of found) {
        pairs.push({ i, j, prev });
        tree.set(j, best + it.key.length, pairs.length - 1);
      }
    });
    const matchAt = new Int32Array(order.length).fill(-1);
    for (let p = tree.below(order.length)[1]; p >= 0; p = pairs[p]!.prev) matchAt[pairs[p]!.j] = pairs[p]!.i;

    const next: typeof order = [];
    let i = 0;
    const fresh = () => {
      const it = items[i++]!;
      next.push({ key: it.key, piece: { el: it.el, frames: [f] } });
    };
    order.forEach((o, j) => {
      const m = matchAt[j]!;
      if (m >= 0) {
        while (i < m) fresh();
        o.piece.frames.push(f);
        i = m + 1;
      }
      next.push(o);
    });
    while (i < items.length) fresh();
    order = next;
  });
  return { root: frames[0]!.attrs, defs: defs.filter(d => used.has(String(d.attrs.id))), pieces: order.map(o => o.piece) };
}

/**
 * Gather items into runs that share a signature, keeping paint order wherever
 * it matters: an item joins an earlier run only by moving back past runs it is
 * never on screen with.
 */
export function gather<T>(items: T[], sig: (t: T) => string, meets: (a: T, b: T) => boolean, reach = 64): T[][] {
  const runs: T[][] = [];
  const sigs: string[] = [];
  for (const it of items) {
    const s = sig(it);
    let home = -1;
    for (let r = runs.length - 1; r >= Math.max(0, runs.length - reach); r--) {
      if (sigs[r] === s) {
        home = r;
        break;
      }
      if (meets(runs[r]![0]!, it)) break;
    }
    if (home >= 0) runs[home]!.push(it);
    else {
      runs.push([it]);
      sigs.push(s);
    }
  }
  return runs;
}

/* Do two ascending frame lists have a frame in common? */
function share(a: number[], b: number[]): boolean {
  if (!a.length || !b.length || a[a.length - 1]! < b[0]! || b[b.length - 1]! < a[0]!) return false;
  for (let i = 0, j = 0; i < a.length && j < b.length; ) {
    if (a[i] === b[j]) return true;
    if (a[i]! < b[j]!) i++;
    else j++;
  }
  return false;
}

/* The moments a frame set switches on and off, as keyframe offsets; it starts as frame 0 has it. */
function keyframes(name: string, frames: number[], n: number): string {
  const has = new Uint8Array(n);
  for (const f of frames) has[f] = 1;
  const on: string[] = [];
  const off: string[] = [];
  for (let f = 1; f < n; f++) if (has[f] !== has[f - 1]) (has[f] ? on : off).push(`${num((100 * f) / n, 3)}%`);
  const block = (list: string[], v: string) => (list.length ? `${list.join(',')}{visibility:${v}}` : '');
  return `@keyframes ${name}{${block(on, 'visible')}${block(off, 'hidden')}}`;
}

/**
 * The frames of a loop as one animated SVG. Each element is written once; one
 * that comes and goes gets a class whose keyframes switch its visibility
 * (stepped, so frames cut rather than fade). One loop lasts frames/fps seconds
 * and repeats forever. Frames must share a size; frame 0's root attributes are kept.
 */
export function animatedSvg(frames: El[], fps: number): string {
  const n = frames.length;
  const { root, defs, pieces } = mergeFrames(frames);
  const runs = gather(
    pieces,
    p => (p.frames.length === n ? '*' : p.frames.join(',')),
    (a, b) => share(a.frames, b.frames),
  );
  const classes = new Map<string, string>();
  const css: string[] = [];
  const body: string[] = [];
  for (const run of runs) {
    const set = run[0]!.frames;
    if (set.length === n) {
      body.push(...run.map(p => xml(p.el)));
      continue;
    }
    const sig = set.join(',');
    let cls = classes.get(sig);
    if (!cls) {
      cls = `k${classes.size.toString(36)}`;
      classes.set(sig, cls);
      css.push(`.${cls}{animation-name:${cls}${set[0] === 0 ? '' : ';visibility:hidden'}}`, keyframes(cls, set, n));
    }
    const only = run.length === 1 ? run[0]!.el : null;
    body.push(only ? xml({ ...only, attrs: { ...only.attrs, class: cls } }) : xml({ tag: 'g', attrs: { class: cls }, children: run.map(p => p.el) }));
  }
  const seconds = n / fps;
  const time = Number.isInteger(seconds * 1000) ? `${num(seconds, 3)}s` : `${num(seconds * 1000, 3)}ms`;
  const head = css.length ? [`<style>*{animation-duration:${time};animation-timing-function:step-end;animation-iteration-count:infinite}`, ...css, '</style>'] : [];
  if (defs.length) head.push(xml({ tag: 'defs', attrs: {}, children: defs }));
  const open = xml({ tag: 'svg', attrs: root }).slice(0, -2);
  return `${open}>\n${[...head, ...body].join('\n')}\n</svg>\n`;
}
