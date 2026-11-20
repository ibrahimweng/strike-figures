/* Thread: an X thread, post by post. Each post is the words that go into X
   and a card (illustration one side, words the other) to attach to it,
   still or moving. Everything here copies or downloads ready to paste. */
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { copyImage, download, videoSupport } from '../anim/encode';
import { libraryScene } from '../library';
import { useStore } from '../model/store';
import type { Scene } from '../model/types';
import { Section, Seg, SliderRow, Toggle } from '../ui/controls';
import { IconCopy, IconDownload, IconPlus, IconTrash } from '../ui/icons';
import { useLibraryThumb, useSceneThumb } from '../ui/thumbs';
import { cardScene, figureName, figureSvg, loopFrames, loopSeconds } from './figure';
import { CARD_SIZES, type CardLayout, PALETTES } from './layout';
import { Picker } from './Picker';
import { cardGif, cardPng, cardVideo, drawBase, drawFigure, ensureFonts, figureRect, GIF_LIMIT, layoutOf, stillImage } from './render';
import { GROUND_OPTIONS, type Mode, SIZE_OPTIONS, threadText, useThread } from './store';
import { plainOf, postText, X_LIMIT, xLength } from './text';
import { type FigureRef, groundOfPost, type Post, sizeOfPost, type Thread } from './types';

/* ---------- the switch in the top bar ---------- */

export function ModeSwitch() {
  const mode = useThread(s => s.mode);
  const setMode = useThread(s => s.setMode);
  return (
    <div className="tp-mode">
      <Seg<Mode>
        value={mode}
        options={[
          { value: 'skill', label: 'Skill', title: 'The Strike design skill for AI tools' },
          { value: 'figures', label: 'Figures', title: 'Make illustrations' },
          { value: 'thread', label: 'Thread', title: 'Make an X thread with your illustrations' },
        ]}
        onChange={setMode}
      />
    </div>
  );
}

/* ---------- small things ---------- */

const Icon = ({ children }: { children: ReactNode }) => (
  <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);
const IconUp = () => (
  <Icon>
    <path d="M4 10l4-4 4 4" />
  </Icon>
);
const IconDown = () => (
  <Icon>
    <path d="M4 6l4 4 4-4" />
  </Icon>
);
const IconImage = () => (
  <Icon>
    <rect x="2.5" y="3" width="11" height="10" rx="1.5" />
    <path d="M2.5 11l3.25-3.25 2.5 2.5 1.75-1.75 3.5 3.5" />
    <circle cx="10.5" cy="6" r="1" />
  </Icon>
);
const IconText = () => (
  <Icon>
    <path d="M3 4h10M3 7h10M3 10h7M3 13h5" />
  </Icon>
);
const IconDup = () => <IconCopy />;

const slug = (s: string) =>
  plainOf(s)
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

const fileName = (thread: Thread, post: Post, index: number) => {
  const n = thread.posts.length;
  const words = slug(post.headline || post.text);
  return `strike-${index + 1}-of-${n}${words ? `-${words}` : ''}`;
};

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    /* older browsers, or no permission: the hidden-textarea way */
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

/** The figure a reference points at, following changes made in Figures. */
function useFigure(ref: FigureRef): Scene | null {
  const mine = useStore(s => (ref.kind === 'mine' ? s.scenes.find(x => x.id === ref.id) ?? null : null));
  return ref.kind === 'library' ? libraryScene(ref.id) : mine ?? ref.snapshot ?? null;
}

function useFonts() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let live = true;
    void ensureFonts().then(() => live && setOk(true));
    return () => {
      live = false;
    };
  }, []);
  return ok;
}

/* ---------- status line ---------- */

interface Status {
  text: string;
  tone: 'info' | 'ok' | 'warn' | 'busy';
  progress?: number;
  cancel?: () => void;
}

/* ---------- the card on screen ---------- */

interface Frames {
  fps: number;
  total: number;
  svgs: string[];
}
const frameStore = new WeakMap<Scene, Frames>();

/* Making frames of a heavy figure takes the page's attention; it waits while someone is typing. */
let lastKey = 0;
if (typeof window !== 'undefined') window.addEventListener('keydown', () => (lastKey = performance.now()), true);

/** The frames of a moving figure, made a few at a time so the page stays responsive; plays once they're all there. */
function useFrames(sc: Scene | null) {
  const [st, setSt] = useState<{ sc: Scene | null; frames: Frames | null; ready: number }>({ sc: null, frames: null, ready: 0 });
  useEffect(() => {
    if (!sc) return;
    let f = frameStore.get(sc);
    if (!f) {
      const t0 = performance.now();
      const first = figureSvg(sc, 0, 'tp-live');
      const dt = performance.now() - t0;
      /* heavy figures preview at fewer frames a second; exports always use the full rate */
      const fps = dt < 12 ? 30 : dt < 50 ? 15 : 10;
      f = { fps, total: loopFrames(sc, fps), svgs: [first] };
      frameStore.set(sc, f);
    }
    const frames = f;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let live = true;
    const step = () => {
      if (!live) return;
      const start = performance.now();
      if (start - lastKey < 700) {
        timer = setTimeout(step, 250);
        return;
      }
      while (frames.svgs.length < frames.total && performance.now() - start < 12) frames.svgs.push(figureSvg(sc, frames.svgs.length / frames.total, 'tp-live'));
      setSt({ sc, frames, ready: frames.svgs.length / frames.total });
      if (frames.svgs.length < frames.total) timer = setTimeout(step, 16);
    };
    step();
    return () => {
      live = false;
      if (timer) clearTimeout(timer);
    };
  }, [sc]);
  return st.sc === sc ? st : { frames: null, ready: 0 };
}

/** A card drawn from the same layout as the exports. `live` plays the figure's motion over it. */
function CardView({
  thread,
  post,
  index,
  width,
  live = false,
  fluid = false,
  onLayout,
}: {
  thread: Thread;
  post: Post;
  index: number;
  /** css px it is drawn for */
  width: number;
  live?: boolean;
  /** stretch to its container's width (still cards only) */
  fluid?: boolean;
  onLayout?: (L: CardLayout) => void;
}) {
  const fonts = useFonts();
  const canvas = useRef<HTMLCanvasElement>(null);
  const src = useFigure(post.figure);
  const ground = groundOfPost(thread, post);
  const size = sizeOfPost(thread, post);
  const { width: W, height: H } = CARD_SIZES[size];
  const scale = width / W;
  const height = Math.round(H * scale);
  const L = useMemo(() => (fonts ? layoutOf(thread, post, index) : null), [fonts, thread, post, index]);
  /* src is a dependency too: a figure from My figures can change under the post */
  const rect = useMemo(() => (L && src ? figureRect(L, post) : null), [L, post, src]);
  const moving = live && post.animated;
  const scene = useMemo(() => (moving && src ? cardScene(src, ground, { animated: true, duration: post.duration }) : null), [moving, src, ground, post.duration]);
  const { frames, ready } = useFrames(scene);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (L) onLayout?.(L);
  }, [L, onLayout]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !L) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext('2d')!;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    drawBase(ctx, L);
    if (moving || !src || !rect) return;
    let live = true;
    void stillImage(src, ground, rect.w * scale * dpr, rect.h * scale * dpr).then(img => {
      if (!live) return;
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
      drawFigure(ctx, L, img, rect);
    });
    return () => {
      live = false;
    };
  }, [L, width, height, scale, moving, src, rect, ground]);

  /* play: swap the frame's SVG in on each tick */
  useEffect(() => {
    const el = box.current;
    if (!el || !frames) return;
    let raf = 0;
    let shown = -1;
    const t0 = performance.now();
    const tick = (now: number) => {
      const all = frames.svgs.length >= frames.total;
      const i = all ? Math.floor(((now - t0) / 1000) * frames.fps) % frames.total : 0;
      if (i !== shown) {
        el.innerHTML = frames.svgs[i] ?? '';
        shown = i;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frames]);

  const panel = L?.panel;
  return (
    <div className="tp-cardview" style={fluid ? undefined : { width, height }}>
      <canvas ref={canvas} style={fluid ? { width: '100%', height: 'auto', aspectRatio: `${W} / ${H}` } : { width, height }} />
      {moving && panel && rect && (
        <div className="tp-clip" style={{ left: panel.x * scale, top: panel.y * scale, width: panel.w * scale, height: panel.h * scale }}>
          <div ref={box} className="tp-fig" style={{ left: (rect.x - panel.x) * scale, top: (rect.y - panel.y) * scale, width: rect.w * scale, height: rect.h * scale }} />
        </div>
      )}
      {moving && ready < 1 && (
        <span className="tp-prep">
          Preparing motion · {Math.round(ready * 100)}%
        </span>
      )}
    </div>
  );
}

/** The selected card, as large as the stage allows. */
function Stage({ thread, post, index, onLayout }: { thread: Thread; post: Post; index: number; onLayout: (L: CardLayout) => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 800, h: 450 });
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { width: W, height: H } = CARD_SIZES[sizeOfPost(thread, post)];
  const k = Math.min((avail.w - 40) / W, (avail.h - 40) / H, 1);
  const width = Math.max(120, Math.floor(W * k));
  return (
    <div className="tp-canvas" ref={wrap} data-testid="thread-card">
      <div className="tp-shadow">
        <CardView thread={thread} post={post} index={index} width={width} live onLayout={onLayout} />
      </div>
    </div>
  );
}

/* ---------- the posts, down the left ---------- */

function PostList({ thread, selectedId }: { thread: Thread; selectedId: string }) {
  const { select, addPost, duplicatePost, removePost, movePost } = useThread.getState();
  const n = thread.posts.length;
  return (
    <aside className="tp-posts card" data-testid="thread-posts">
      <div className="panel-top tp-posts-top">
        <div className="tp-row">
          <span className="tp-title">
            Thread <span className="tp-faint">· {n} posts</span>
          </span>
          <button className="btn soft small" onClick={addPost} title="Add a post after this one" data-testid="add-post">
            <IconPlus /> Add post
          </button>
        </div>
      </div>
      <ol className="tp-list">
        {thread.posts.map((p, i) => {
          const active = p.id === selectedId;
          const len = xLength(postText(p.text, i, n, thread.numberText));
          return (
            <li key={p.id} className={`tp-item${active ? ' active' : ''}`} onClick={() => select(p.id)} data-testid={`post-${i}`}>
              <div className="tp-item-head">
                <span className="tp-n">
                  {i + 1}/{n}
                </span>
                <span className={`tp-len${len > X_LIMIT ? ' over' : ''}`} title="Characters, as X counts them">{len > X_LIMIT ? `${len - X_LIMIT} over` : `${len}/${X_LIMIT}`}</span>
                <span className="tp-item-tools" onClick={e => e.stopPropagation()}>
                  <button className="btn icon small" title="Move up" disabled={i === 0} onClick={() => movePost(p.id, -1)}>
                    <IconUp />
                  </button>
                  <button className="btn icon small" title="Move down" disabled={i === n - 1} onClick={() => movePost(p.id, 1)}>
                    <IconDown />
                  </button>
                  <button className="btn icon small" title="Duplicate" onClick={() => duplicatePost(p.id)}>
                    <IconDup />
                  </button>
                  <button
                    className="btn icon small danger"
                    title="Delete"
                    disabled={n < 2}
                    onClick={() => {
                      if (!p.text.trim() && !p.headline.trim()) removePost(p.id);
                      else if (window.confirm(`Delete post ${i + 1}? This can't be undone.`)) removePost(p.id);
                    }}
                  >
                    <IconTrash />
                  </button>
                </span>
              </div>
              <CardView thread={thread} post={p} index={i} width={240} fluid />
              <p className="tp-snippet">{p.text.trim().replace(/\s+/g, ' ') || <span className="tp-faint">No post text yet</span>}</p>
            </li>
          );
        })}
      </ol>
      <div className="tp-list-foot">
        <button className="btn soft wide" onClick={addPost}>
          <IconPlus /> Add a post
        </button>
      </div>
    </aside>
  );
}

/* ---------- the fields, down the right ---------- */

function Field({ label, hint, children, extra }: { label: string; hint?: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <label className="tp-field">
      <span className="tp-label">
        <span>{label}</span>
        {extra}
      </span>
      {children}
      {hint && <span className="tp-hint">{hint}</span>}
    </label>
  );
}

function FigureChoice({ refx, onChange }: { refx: FigureRef; onChange: (r: FigureRef) => void }) {
  const [open, setOpen] = useState(false);
  const src = useFigure(refx);
  return (
    <>
      <button className="tp-figpick" onClick={() => setOpen(true)} data-testid="change-figure" title="Choose another illustration">
        <span className="pic">{refx.kind === 'library' ? <LibThumb id={refx.id} /> : src ? <SceneThumb sc={src} /> : null}</span>
        <span className="tp-figpick-text">
          <span className="tp-figpick-name">{figureName(refx)}</span>
          <span className="tp-faint">{refx.kind === 'library' ? 'From the Library' : 'From My figures'} · Change</span>
        </span>
      </button>
      {open && (
        <Picker
          current={refx}
          onClose={() => setOpen(false)}
          onPick={r => {
            onChange(r);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}

function LibThumb({ id }: { id: string }) {
  const url = useLibraryThumb(id);
  return url ? <img src={url} alt="" draggable={false} /> : null;
}
function SceneThumb({ sc }: { sc: Scene }) {
  const url = useSceneThumb(sc);
  return url ? <img src={url} alt="" draggable={false} /> : null;
}

function Inspector({ thread, post, index, layout, setStatus, busy }: { thread: Thread; post: Post; index: number; layout: CardLayout | null; setStatus: (s: Status | null) => void; busy: boolean }) {
  const { updatePost, setDefaults, reset } = useThread.getState();
  const set = (patch: Partial<Post>) => updatePost(post.id, patch);
  const n = thread.posts.length;
  const full = postText(post.text, index, n, thread.numberText);
  const len = xLength(full);
  const src = useFigure(post.figure);
  const ground = groundOfPost(thread, post);
  const size = sizeOfPost(thread, post);
  const own = src ? loopSeconds(src) : 4;
  const hlName = ground === 'green' ? 'black' : 'Strike Green';
  return (
    <aside className="tp-side card" data-testid="thread-fields">
      <div className="head">
        <h2>
          Post {index + 1} <span className="tp-faint">of {n}</span>
        </h2>
        <span className="sub">{CARD_SIZES[size].short} card</span>
      </div>

      <Section title="Post text · goes into X">
        <textarea
          className="tp-area"
          rows={5}
          value={post.text}
          placeholder="What the post says on X"
          onChange={e => set({ text: e.target.value })}
          data-testid="post-text"
          aria-label="Post text"
        />
        <div className="tp-count">
          <span className={`tp-meter${len > X_LIMIT ? ' over' : len > X_LIMIT - 20 ? ' near' : ''}`}>
            <span style={{ width: `${Math.min(100, (len / X_LIMIT) * 100)}%` }} />
          </span>
          <span className={len > X_LIMIT ? 'tp-over' : 'tp-faint'} data-testid="post-count">
            {len} / {X_LIMIT}
          </span>
        </div>
        {len > X_LIMIT && <div className="tp-warn">X allows {X_LIMIT}. Take out {len - X_LIMIT} characters, or split it into two posts.</div>}
        {thread.numberText && n > 1 && (
          <div className="tp-hint">
            “{index + 1}/{n}” is added at the end. Links count as 23.
          </div>
        )}
      </Section>

      <Section title="Card words">
        <Field label="Small line above" hint="Optional. A word or two, e.g. OPTIONS.">
          <input className="text" value={post.eyebrow} onChange={e => set({ eyebrow: e.target.value })} placeholder="e.g. Options" data-testid="eyebrow" />
        </Field>
        <Field label="Headline" hint={<>Put *asterisks* around words to show them in {hlName}. Press Enter for a new line.</>}>
          <textarea className="tp-area" rows={3} value={post.headline} onChange={e => set({ headline: e.target.value })} placeholder="The big words" data-testid="headline" />
        </Field>
        <Field label="Line below" hint="Optional. One sentence.">
          <textarea className="tp-area" rows={2} value={post.sub} onChange={e => set({ sub: e.target.value })} placeholder="A sentence under the headline" data-testid="sub" />
        </Field>
        {layout?.overflow && <div className="tp-warn">The words don’t all fit on the card. Shorten the headline or the line below.</div>}
      </Section>

      <Section title="Illustration">
        <FigureChoice refx={post.figure} onChange={figure => set({ figure })} />
        <Seg
          value={post.animated ? 'on' : 'off'}
          options={[
            { value: 'off', label: 'Still' },
            { value: 'on', label: 'Animated' },
          ]}
          onChange={v => set({ animated: v === 'on' })}
          accent
        />
        {post.animated && (
          <>
            <SliderRow label="Loop" value={post.duration ?? own} min={2} max={10} step={0.5} places={1} unit="s" onChange={v => set({ duration: v })} title="How long one loop lasts" />
            <div className="tp-hint">Animated posts download as MP4 or GIF. Copy image copies the still picture.</div>
          </>
        )}
      </Section>

      <Section title="Layout">
        <div className="row">
          <span className="label">Picture</span>
          <Seg
            value={post.side}
            options={
              size === 'square'
                ? [
                    { value: 'left', label: 'Top' },
                    { value: 'right', label: 'Bottom' },
                  ]
                : [
                    { value: 'left', label: 'Left' },
                    { value: 'right', label: 'Right' },
                  ]
            }
            onChange={side => set({ side })}
          />
        </div>
        <div className="row">
          <span className="label">Ground</span>
          <div className="chips" role="radiogroup" aria-label="Ground">
            {GROUND_OPTIONS.map(g => (
              <button key={g.value} className={`chip${ground === g.value ? ' on' : ''}`} onClick={() => set({ ground: g.value === thread.ground ? null : g.value })} role="radio" aria-checked={ground === g.value} data-testid={`ground-${g.value}`}>
                <span className="sw" style={{ background: g.swatch }} />
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="label">Size</span>
          <Seg value={size} options={SIZE_OPTIONS.map(o => ({ value: o.value, label: o.value === 'landscape' ? '16:9' : '1:1', title: o.label }))} onChange={v => set({ size: v === thread.size ? null : v })} />
        </div>
        {(post.ground || post.size) && (
          <button className="tp-link" onClick={() => set({ ground: null, size: null })}>
            This post differs from the thread · use the thread’s look
          </button>
        )}
      </Section>

      <Section title="Whole thread">
        <div className="tp-hint" style={{ marginTop: -4 }}>
          Set the look once: every post follows it unless you change that post.
        </div>
        <div className="row">
          <span className="label">Ground</span>
          <div className="chips" role="radiogroup" aria-label="Thread ground">
            {GROUND_OPTIONS.map(g => (
              <button key={g.value} className={`chip${thread.ground === g.value ? ' on' : ''}`} onClick={() => setDefaults({ ground: g.value })} role="radio" aria-checked={thread.ground === g.value} data-testid={`thread-ground-${g.value}`}>
                <span className="sw" style={{ background: g.swatch }} />
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div className="row">
          <span className="label">Size</span>
          <Seg value={thread.size} options={SIZE_OPTIONS.map(o => ({ value: o.value, label: o.label }))} onChange={v => setDefaults({ size: v })} />
        </div>
        <Toggle on={thread.numberText} onChange={v => setDefaults({ numberText: v })}>
          Add “1/{n}” to each post’s text
        </Toggle>
        <Toggle on={thread.numberCards} onChange={v => setDefaults({ numberCards: v })}>
          Show “1/{n}” on the cards
        </Toggle>
        <button
          className="tp-link"
          disabled={busy}
          onClick={() => {
            if (window.confirm('Start again from the example thread? Your posts here will be replaced.')) {
              reset();
              setStatus({ text: 'Started again from the example thread.', tone: 'info' });
            }
          }}
        >
          Start again from the example
        </button>
      </Section>
    </aside>
  );
}

/* ---------- the whole tool ---------- */

/** Thread-wide actions for the top bar. */
export function ThreadActions() {
  const thread = useThread(s => s.thread);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 3200);
    return () => clearTimeout(t);
  }, [note]);
  return (
    <div className="tp-actions-top">
      {note && <span className="tp-top-note">{note}</span>}
      <button
        className="btn soft"
        onClick={async () => setNote((await copyText(threadText(thread))) ? `Copied all ${thread.posts.length} posts. Paste them into X one by one.` : "Your browser wouldn't copy. Select the text and copy it instead.")}
        title="Every post's text, separated by blank lines"
        data-testid="copy-all"
      >
        <IconText /> Copy all text
      </button>
      <button
        className="btn primary"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            const n = thread.posts.length;
            for (let i = 0; i < n; i++) {
              const p = thread.posts[i]!;
              setNote(`Saving image ${i + 1} of ${n}…`);
              download(await cardPng(thread, p, i), `${fileName(thread, p, i)}.png`);
              await new Promise(r => setTimeout(r, 350));
            }
            setNote(thread.posts.some(p => p.animated) ? `Saved ${n} still images. For moving posts, download each MP4 from its post.` : `Saved ${n} images, numbered in thread order.`);
          } catch (e) {
            setNote(`Couldn't save the images: ${e instanceof Error ? e.message : String(e)}`);
          } finally {
            setSaving(false);
          }
        }}
        title="A PNG of every card"
        data-testid="download-all"
      >
        <IconDownload /> Download all images
      </button>
    </div>
  );
}

export function ThreadTool() {
  const thread = useThread(s => s.thread);
  const selectedId = useThread(s => s.selectedId);
  const index = Math.max(0, thread.posts.findIndex(p => p.id === selectedId));
  const post = thread.posts[index]!;
  const [layout, setLayout] = useState<CardLayout | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [video, setVideo] = useState<'mp4' | 'webm' | null | undefined>(undefined);
  const busy = status?.tone === 'busy';

  useEffect(() => {
    let live = true;
    void videoSupport(1600, 900).then(v => live && setVideo(v));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    if (!status || status.tone === 'busy') return;
    const t = setTimeout(() => setStatus(null), status.tone === 'warn' ? 9000 : 5000);
    return () => clearTimeout(t);
  }, [status]);

  const onLayout = useCallback((L: CardLayout) => setLayout(L), []);
  const n = thread.posts.length;
  const name = fileName(thread, post, index);

  const run = async (label: string, job: (signal: AbortSignal, progress: (d: number, t: number) => void) => Promise<Status>) => {
    const ac = new AbortController();
    setStatus({ text: label, tone: 'busy', progress: 0, cancel: () => ac.abort() });
    try {
      const done = await job(ac.signal, (d, t) => setStatus({ text: label, tone: 'busy', progress: d / t, cancel: () => ac.abort() }));
      setStatus(done);
    } catch (e) {
      if (ac.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) setStatus({ text: 'Cancelled.', tone: 'info' });
      else setStatus({ text: `That didn't work: ${e instanceof Error ? e.message : String(e)}`, tone: 'warn' });
    }
  };

  const copyPostText = async () => {
    const ok = await copyText(postText(post.text, index, n, thread.numberText));
    setStatus(ok ? { text: 'Copied. Paste it into your post on X.', tone: 'ok' } : { text: "Your browser wouldn't copy. Select the text and copy it instead.", tone: 'warn' });
  };

  const copyPostImage = async () => {
    /* straight from the click, so the browser lets us at the clipboard */
    const ok = await copyImage(cardPng(thread, post, index));
    setStatus(
      ok
        ? { text: post.animated ? 'Copied the still picture. Paste it into your post on X. For motion, download the MP4.' : 'Copied the image. Paste it into your post on X.', tone: 'ok' }
        : { text: "Your browser won't copy images. Use Download PNG, then attach the file on X.", tone: 'warn' },
    );
  };

  const savePng = () =>
    run('Making the PNG…', async () => {
      const blob = await cardPng(thread, post, index);
      download(blob, `${name}.png`);
      return { text: `Downloaded ${name}.png. Attach it to your post on X.`, tone: 'ok' };
    });

  const saveVideo = () =>
    run('Making the video…', async (signal, onProgress) => {
      const { blob, ext, note } = await cardVideo(thread, post, index, { signal, onProgress });
      download(blob, `${name}.${ext}`);
      if (ext === 'webm') return { text: `Downloaded ${name}.webm (${mb(blob.size)}). X doesn't take WebM: use the GIF, or make the MP4 in Chrome, Edge or Safari.`, tone: 'warn' };
      return { text: `Downloaded ${name}.mp4 (${mb(blob.size)}). Attach it to your post on X.${note ? ` ${note}` : ''}`, tone: note ? 'warn' : 'ok' };
    });

  const saveGif = () =>
    run('Making the GIF…', async (signal, onProgress) => {
      const blob = await cardGif(thread, post, index, { signal, onProgress });
      download(blob, `${name}.gif`);
      if (blob.size > GIF_LIMIT) return { text: `Downloaded ${name}.gif, but it's ${mb(blob.size)}: over X's 15 MB limit for GIFs. Use the MP4, or a shorter loop.`, tone: 'warn' };
      return { text: `Downloaded ${name}.gif (${mb(blob.size)}). Attach it to your post on X.`, tone: 'ok' };
    });

  const pal = PALETTES[groundOfPost(thread, post)];
  return (
    <div className="tp" data-testid="thread-tool">
      <PostList thread={thread} selectedId={post.id} />
      <main className="tp-stage" style={{ ['--tp-ground' as string]: pal.ground }}>
        <Stage thread={thread} post={post} index={index} onLayout={onLayout} />
        <div className="tp-bar">
          <div className="tp-bar-actions" role="toolbar" aria-label="Copy or download this post">
            <button className="btn soft" onClick={copyPostText} disabled={busy} data-testid="copy-text" title="Copy this post's text">
              <IconText /> Copy text
            </button>
            <button className="btn soft" onClick={copyPostImage} disabled={busy} data-testid="copy-image" title="Copy the card as a picture">
              <IconImage /> Copy image
            </button>
            <span className="tp-sep" />
            <button className="btn soft" onClick={savePng} disabled={busy} data-testid="download-png" title={`${CARD_SIZES[sizeOfPost(thread, post)].width}×${CARD_SIZES[sizeOfPost(thread, post)].height} PNG`}>
              <IconDownload /> PNG
            </button>
            <button
              className="btn soft"
              onClick={saveVideo}
              disabled={busy || !post.animated || video === null}
              data-testid="download-mp4"
              title={!post.animated ? 'Turn on Animated to make a video' : video === null ? "This browser can't make videos" : 'A video of the card, looping once'}
            >
              <IconDownload /> {video === 'webm' ? 'WebM' : 'MP4'}
            </button>
            <button className="btn soft" onClick={saveGif} disabled={busy || !post.animated} data-testid="download-gif" title={post.animated ? 'A looping GIF at half size, to stay under X’s 15 MB' : 'Turn on Animated to make a GIF'}>
              <IconDownload /> GIF
            </button>
          </div>
          <div className={`tp-status ${status?.tone ?? ''}`} role="status" aria-live="polite" data-testid="status">
            {status?.tone === 'busy' && (
              <span className="tp-progress">
                <span style={{ width: `${Math.round((status.progress ?? 0) * 100)}%` }} />
              </span>
            )}
            <span className="tp-status-text">{status ? `${status.text}${status.tone === 'busy' && status.progress ? ` ${Math.round(status.progress * 100)}%` : ''}` : post.animated ? 'Moving cards download as MP4 (best on X) or GIF.' : 'Copy the text and the image, then paste both into a post on X.'}</span>
            {status?.cancel && (
              <button className="btn small soft" onClick={status.cancel} data-testid="cancel">
                Cancel
              </button>
            )}
          </div>
        </div>
      </main>
      <Inspector thread={thread} post={post} index={index} layout={layout} setStatus={setStatus} busy={busy} />
    </div>
  );
}
