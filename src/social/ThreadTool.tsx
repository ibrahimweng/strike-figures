/* Posts and threads for X and Instagram. Each post is the words that go into
   X and a card to attach to it: a headline, a picture (an illustration, a
   screenshot, a photo, or none) and the logo, laid out by the brand's rules
   in 16:9, 1:1 or 4:5. Suggestions point out what could be better, and can
   be applied, dismissed or turned off. Everything copies or downloads ready
   to post. */
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { copyImage, download, videoSupport } from '../anim/encode';
import { libraryScene } from '../library';
import { useStore } from '../model/store';
import type { Scene } from '../model/types';
import { Section, Seg, SliderRow, Toggle } from '../ui/controls';
import { IconCopy, IconDownload, IconPlus, IconTrash, IconUpload } from '../ui/icons';
import { useLibraryThumb, useSceneThumb } from '../ui/thumbs';
import { type Advice, adviseFor, sizeForAspect, suggestFigures } from './advice';
import { cardScene, facesOf, figureName, figureSvg, hasFigure, loopFrames, loopSeconds } from './figure';
import { ACCEPT, addImage, coverRect } from './images';
import { CARD_SIZES, type CardLayout, type CardSize, layoutCard, PALETTES, type Visual } from './layout';
import { Picker } from './Picker';
import { cardGif, cardPng, cardVideo, ensureFonts, figureRect, GIF_LIMIT, layoutOf, measure, paintCard, specOf } from './render';
import { type Category, GROUND_OPTIONS, type Mode, SIZE_OPTIONS, threadText, useThread } from './store';
import { plainOf, postText, X_LIMIT, xLength } from './text';
import { type FigureRef, groundOfPost, isSingle, type Post, riskOfPost, sizeOfPost, type Thread } from './types';

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
          { value: 'thread', label: 'Thread', title: 'Make posts and X threads' },
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
const IconClose = () => (
  <Icon>
    <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
  </Icon>
);
const IconHelp = () => (
  <Icon>
    <circle cx="8" cy="8" r="5.75" />
    <path d="M6.6 6.4a1.5 1.5 0 1 1 2.1 1.4c-.45.2-.7.55-.7 1v.4M8 10.9v.1" />
  </Icon>
);
const IconDup = () => <IconCopy />;

/* the kinds of picture, drawn as tiny cards */
const VisualIcon = ({ v }: { v: Visual }) => (
  <svg width={34} height={22} viewBox="0 0 34 22" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden>
    <rect x="0.5" y="0.5" width="33" height="21" rx="2" opacity={0.5} />
    <path d="M3 4h9M3 6.5h7" strokeWidth={1.4} />
    <path d="M3 18.5h5" opacity={0.7} />
    {v === 'panel' && <rect x="18" y="3" width="13" height="16" rx="0.5" />}
    {v === 'panel' && <path d="M21 13l3.5-3 3.5 3M21 15.5l3.5-3 3.5 3" />}
    {v === 'corner' && <path d="M20 21l7-6 7 6M17 21l10-8.5 7 6M23 9l11 9" opacity={0.85} />}
    {v === 'screenshot' && <rect x="17" y="5" width="14" height="10" rx="1.5" />}
    {v === 'screenshot' && <path d="M19 12.5l3-2.5 2 1.5 3-3 2.5 2" />}
    {v === 'photo' && <path d="M0.5 14l8-6 7 5 6-4 12 8" opacity={0.6} />}
  </svg>
);

const VISUALS: { value: Visual; label: string; title: string }[] = [
  { value: 'panel', label: 'Illustration', title: 'An illustration in its own panel beside the words' },
  { value: 'corner', label: 'Corner', title: 'An illustration drawn large from a corner, behind nothing' },
  { value: 'screenshot', label: 'Screenshot', title: 'Your analytics or product screenshot, framed as it is' },
  { value: 'photo', label: 'Photo', title: 'A photo filling the card, toned so the words read' },
  { value: 'none', label: 'Text only', title: 'The words and the logo alone' },
];

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
  return thread.kind === 'posts' ? `strike-post${words ? `-${words}` : `-${index + 1}`}` : `strike-${index + 1}-of-${n}${words ? `-${words}` : ''}`;
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
  const moving = live && post.animated && hasFigure(post);
  const scene = useMemo(() => (moving && src ? cardScene(src, ground, { animated: true, duration: post.duration }, facesOf(post)) : null), [moving, src, ground, post]);
  const { frames, ready } = useFrames(scene);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (L) onLayout?.(L);
  }, [L, onLayout]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !L) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let live = true;
    /* everything loads first, then the card is drawn in one go, so it never flickers */
    const off = document.createElement('canvas');
    off.width = Math.round(width * dpr);
    off.height = Math.round(height * dpr);
    const ctx = off.getContext('2d')!;
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    void paintCard(ctx, L, post, ground, scale * dpr, { figure: !moving, isLive: () => live }).then(() => {
      if (!live) return;
      c.width = off.width;
      c.height = off.height;
      c.getContext('2d')!.drawImage(off, 0, 0);
    });
    return () => {
      live = false;
    };
  }, [L, width, height, scale, moving, src, rect, ground, post]);

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

  const clip = L?.figureClip;
  return (
    <div className="tp-cardview" style={fluid ? undefined : { width, height }}>
      <canvas ref={canvas} style={fluid ? { width: '100%', height: 'auto', aspectRatio: `${W} / ${H}` } : { width, height }} />
      {moving && clip && rect && (
        <div className="tp-clip" style={{ left: clip.x * scale, top: clip.y * scale, width: clip.w * scale, height: clip.h * scale, opacity: L?.figureOpacity ?? 1 }}>
          <div ref={box} className="tp-fig" style={{ left: (rect.x - clip.x) * scale, top: (rect.y - clip.y) * scale, width: rect.w * scale, height: rect.h * scale }} />
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

/** The selected card, as large as the stage allows; drag a screenshot or photo on it to choose what shows. */
function Stage({ thread, post, index, layout, onLayout, onFile, children }: { thread: Thread; post: Post; index: number; layout: CardLayout | null; onLayout: (L: CardLayout) => void; onFile: (f: File) => void; children?: ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 800, h: 450 });
  const [over, setOver] = useState(false);
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
  const scale = width / W;

  /* the picture's box on the card, when there is one to move */
  const im = post.image;
  const pic = layout && im ? (layout.visual === 'screenshot' ? layout.frame : layout.visual === 'photo' ? { x: 0, y: 0, w: layout.width, h: layout.height } : null) : null;
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (!im) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, fx: im.fx, fy: im.fy };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || !im || !pic) return;
    const r = coverRect(pic, im);
    const clamp = (v: number) => Math.min(1, Math.max(0, v));
    useThread.getState().updatePost(post.id, { image: { ...im, fx: clamp(d.fx - (e.clientX - d.x) / scale / r.w), fy: clamp(d.fy - (e.clientY - d.y) / scale / r.h) } });
  };
  const onUp = () => (drag.current = null);

  return (
    <div
      className={`tp-canvas${over ? ' drop' : ''}`}
      ref={wrap}
      data-testid="thread-card"
      onDragOver={e => {
        if ([...e.dataTransfer.items].some(i => i.kind === 'file')) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={e => {
        e.preventDefault();
        setOver(false);
        const f = [...e.dataTransfer.files].find(x => x.type.startsWith('image/'));
        if (f) onFile(f);
      }}
    >
      <div className="tp-shadow">
        <CardView thread={thread} post={post} index={index} width={width} live onLayout={onLayout} />
        {pic && (
          <div
            className="tp-drag"
            title="Drag to choose what shows"
            style={{ left: pic.x * scale, top: pic.y * scale, width: pic.w * scale, height: pic.h * scale }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <span>Drag to move</span>
          </div>
        )}
      </div>
      {over && <div className="tp-drop">Drop the picture to add it</div>}
      {children}
    </div>
  );
}

/* ---------- the first-time guide ---------- */

function Guide({ onDone }: { onDone: () => void }) {
  return (
    <div className="tp-guide" role="dialog" aria-label="How it works" data-testid="guide">
      <h3>Make a post in three steps</h3>
      <ol>
        <li>
          <strong>Write the headline.</strong> Short is strong: 3–8 words. Put *asterisks* round the phrase to show in green.
        </li>
        <li>
          <strong>Pick a picture.</strong> An illustration, your analytics screenshot (drop or paste it in), a photo, or none. The layout, the logo and the type adjust themselves.
        </li>
        <li>
          <strong>Check the suggestions, then download.</strong> They point out what would read better and stay on brand. Apply them, dismiss them, or turn them off.
        </li>
      </ol>
      <div className="tp-guide-foot">
        <span className="tp-faint">16:9 for X, 4:5 for Instagram, 1:1 for both.</span>
        <button className="btn primary" onClick={onDone} data-testid="guide-done">
          Start
        </button>
      </div>
    </div>
  );
}

/* ---------- the posts, down the left ---------- */

function PostList({ thread, selectedId, category }: { thread: Thread; selectedId: string; category: Category }) {
  const { select, addPost, duplicatePost, removePost, movePost, setCategory } = useThread.getState();
  const n = thread.posts.length;
  const single = thread.kind === 'posts';
  return (
    <aside className="tp-posts card" data-testid="thread-posts">
      <div className="panel-top tp-posts-top">
        <Seg<Category>
          value={category}
          options={[
            { value: 'posts', label: 'Posts', title: 'Single posts, each on its own' },
            { value: 'thread', label: 'Thread', title: 'One X thread, numbered' },
          ]}
          onChange={setCategory}
        />
        <div className="tp-row">
          <span className="tp-title">
            {single ? 'Posts' : 'Thread'} <span className="tp-faint">· {n}</span>
          </span>
          <button className="btn soft small" onClick={addPost} title="Add a post after this one" data-testid="add-post">
            <IconPlus /> Add
          </button>
        </div>
      </div>
      <ol className="tp-list">
        {thread.posts.map((p, i) => {
          const active = p.id === selectedId;
          const len = xLength(postText(p.text, i, n, !single && thread.numberText));
          return (
            <li key={p.id} className={`tp-item${active ? ' active' : ''}`} onClick={() => select(p.id)} data-testid={`post-${i}`}>
              <div className="tp-item-head">
                <span className="tp-n">{single ? CARD_SIZES[sizeOfPost(thread, p)].short : `${i + 1}/${n}`}</span>
                {p.text.trim() && (
                  <span className={`tp-len${len > X_LIMIT ? ' over' : ''}`} title="Characters, as X counts them">
                    {len > X_LIMIT ? `${len - X_LIMIT} over` : `${len}/${X_LIMIT}`}
                  </span>
                )}
                <span className="tp-item-tools" onClick={e => e.stopPropagation()}>
                  {!single && (
                    <>
                      <button className="btn icon small" title="Move up" disabled={i === 0} onClick={() => movePost(p.id, -1)}>
                        <IconUp />
                      </button>
                      <button className="btn icon small" title="Move down" disabled={i === n - 1} onClick={() => movePost(p.id, 1)}>
                        <IconDown />
                      </button>
                    </>
                  )}
                  <button className="btn icon small" title="Duplicate" onClick={() => duplicatePost(p.id)}>
                    <IconDup />
                  </button>
                  <button
                    className="btn icon small danger"
                    title="Delete"
                    disabled={n < 2}
                    onClick={() => {
                      if (!p.text.trim() && !p.headline.trim()) removePost(p.id);
                      else if (window.confirm(`Delete this post? This can't be undone.`)) removePost(p.id);
                    }}
                  >
                    <IconTrash />
                  </button>
                </span>
              </div>
              <CardView thread={thread} post={p} index={i} width={240} fluid />
              <p className="tp-snippet">{plainOf(p.headline).trim() || p.text.trim().replace(/\s+/g, ' ') || <span className="tp-faint">No headline yet</span>}</p>
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

/** What the suggestions found for this post, each with its next step. */
function Suggestions({ post, list, onUpload }: { post: Post; list: Advice[]; onUpload: () => void }) {
  const tips = useThread(s => s.tips);
  const { setTips, updatePost } = useThread.getState();
  if (!tips)
    return (
      <div className="tp-tips-off">
        <span className="tp-faint">Suggestions are off.</span>
        <button className="tp-link" onClick={() => setTips(true)} data-testid="tips-on">
          Turn them on
        </button>
      </div>
    );
  return (
    <Section
      title="Suggestions"
      extra={
        <span className={`tp-badge${list.some(a => a.level === 'fix') ? ' fix' : ''}`} data-testid="tips-count">
          {list.length || '✓'}
        </span>
      }
    >
      {list.length === 0 ? (
        <div className="tp-hint">Nothing to change: it reads well and it's on brand.</div>
      ) : (
        <ul className="tp-tips" data-testid="tips">
          {list.map(a => (
            <li key={a.id} className={`tp-tip ${a.level}`}>
              <span className="tp-tip-dot" aria-label={a.level === 'fix' ? 'Brand rule' : 'Tip'} />
              <span className="tp-tip-text">{a.text}</span>
              <span className="tp-tip-acts">
                {a.apply && (
                  <button className="btn small soft" onClick={() => updatePost(post.id, a.apply!.patch)}>
                    {a.apply.label}
                  </button>
                )}
                {a.action === 'upload' && (
                  <button className="btn small soft" onClick={onUpload}>
                    Choose a file
                  </button>
                )}
                <button className="btn icon small" title="Dismiss" aria-label="Dismiss" onClick={() => updatePost(post.id, { dismissed: [...post.dismissed, a.id] })}>
                  <IconClose />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="tp-tips-foot">
        {post.dismissed.length > 0 && (
          <button className="tp-link" onClick={() => updatePost(post.id, { dismissed: [] })}>
            Show {post.dismissed.length} dismissed
          </button>
        )}
        <button className="tp-link" onClick={() => setTips(false)} data-testid="tips-off">
          Turn suggestions off
        </button>
      </div>
    </Section>
  );
}

function Inspector({
  thread,
  post,
  index,
  layout,
  setStatus,
  busy,
  onUpload,
  onGuide,
}: {
  thread: Thread;
  post: Post;
  index: number;
  layout: CardLayout | null;
  setStatus: (s: Status | null) => void;
  busy: boolean;
  onUpload: () => void;
  onGuide: () => void;
}) {
  const { updatePost, setDefaults, reset } = useThread.getState();
  const set = (patch: Partial<Post>) => updatePost(post.id, patch);
  const n = thread.posts.length;
  const single = isSingle(thread);
  const numbered = thread.kind === 'thread' && thread.numberText;
  const full = postText(post.text, index, n, numbered);
  const len = xLength(full);
  const src = useFigure(post.figure);
  const ground = groundOfPost(thread, post);
  const size = sizeOfPost(thread, post);
  const own = src ? loopSeconds(src) : 4;
  const hlName = ground === 'green' && post.visual !== 'photo' ? 'black' : ground === 'light' && post.visual !== 'photo' ? 'deep green' : 'Strike Green';
  const fonts = useFonts();

  /* how big the headline sets in each size, for the size suggestion */
  const headlineSizes = useMemo(() => {
    if (!fonts) return undefined;
    const out: Partial<Record<CardSize, { size: number; overflow: boolean }>> = {};
    for (const s of ['landscape', 'square', 'portrait'] as const) {
      const L = layoutCard({ ...specOf(thread, post, index), size: s }, measure);
      out[s] = { size: L.headline?.font.size ?? 0, overflow: L.overflow };
    }
    return out;
  }, [fonts, thread, post, index]);
  const advice = useMemo(() => adviseFor(thread, post, index, { layout, headlineSizes }), [thread, post, index, layout, headlineSizes]);
  const suggested = useMemo(() => (hasFigure(post) ? suggestFigures(`${post.headline} ${post.sub} ${post.eyebrow}`, 4).filter(s => s.score >= 3) : []), [post]);
  const bestSize = post.visual === 'screenshot' && post.image ? sizeForAspect(post.image.w / post.image.h) : null;
  const riskOn = riskOfPost(thread, post, index);

  return (
    <aside className="tp-side card" data-testid="thread-fields">
      <div className="head">
        <h2>
          {single ? 'Post' : `Post ${index + 1}`} {!single && <span className="tp-faint">of {n}</span>}
        </h2>
        <span className="sub">
          {CARD_SIZES[size].short}
          <button className="btn icon small" title="How it works" aria-label="How it works" onClick={onGuide} data-testid="guide-open">
            <IconHelp />
          </button>
        </span>
      </div>

      <Suggestions post={post} list={advice} onUpload={onUpload} />

      <Section title="Words on the card">
        <Field label="Headline" hint={<>3–8 words read best. Put *asterisks* round a phrase to show it in {hlName}. Enter starts a new line.</>}>
          <textarea className="tp-area" rows={3} value={post.headline} onChange={e => set({ headline: e.target.value })} placeholder="The big words" data-testid="headline" />
        </Field>
        <Field label="Line below" hint="Optional. One sentence: what it means, or where a number comes from.">
          <textarea className="tp-area" rows={2} value={post.sub} onChange={e => set({ sub: e.target.value })} placeholder="A sentence under the headline" data-testid="sub" />
        </Field>
        <Field label="Small line above" hint="Optional. A word or two, e.g. Trading hours.">
          <input className="text" value={post.eyebrow} onChange={e => set({ eyebrow: e.target.value })} placeholder="e.g. Trading hours" data-testid="eyebrow" />
        </Field>
      </Section>

      <Section title="Picture">
        <div className="tp-visuals" role="radiogroup" aria-label="Picture">
          {VISUALS.map(v => (
            <button key={v.value} className={`tp-visual${post.visual === v.value ? ' on' : ''}`} role="radio" aria-checked={post.visual === v.value} title={v.title} onClick={() => set({ visual: v.value })} data-testid={`visual-${v.value}`}>
              <VisualIcon v={v.value} />
              <span>{v.label}</span>
            </button>
          ))}
        </div>
        {hasFigure(post) && (
          <>
            <FigureChoice refx={post.figure} onChange={figure => set({ figure })} />
            {suggested.length > 0 && (
              <div className="tp-suggest">
                <span className="tp-hint">Fits the headline</span>
                <div className="tp-suggest-row">
                  {suggested.map(s => (
                    <button
                      key={s.id}
                      className={`tp-suggest-pic${post.figure.kind === 'library' && post.figure.id === s.id ? ' on' : ''}`}
                      title={s.title}
                      onClick={() => set({ figure: { kind: 'library', id: s.id } })}
                      data-testid={`suggest-${s.id}`}
                    >
                      <LibThumb id={s.id} />
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                <SliderRow label="Loop" value={post.duration ?? own} min={2} max={10} step={1} places={0} unit="s" onChange={v => set({ duration: v })} title="How long one loop lasts" />
                <div className="tp-hint">Animated posts download as MP4 or GIF. Copy image copies the still picture.</div>
              </>
            )}
          </>
        )}
        {(post.visual === 'screenshot' || post.visual === 'photo') && (
          <>
            <button className="tp-upload" onClick={onUpload} data-testid="upload">
              <IconUpload />
              <span>
                <strong>{post.image ? 'Replace' : post.visual === 'screenshot' ? 'Add a screenshot' : 'Add a photo'}</strong>
                <span className="tp-faint">{post.image ? post.image.name : 'Choose a file, drop it on the card, or paste it'}</span>
              </span>
            </button>
            {post.image && (
              <>
                <SliderRow label="Zoom" value={post.image.zoom} min={1} max={3} step={0.05} places={2} unit="×" onChange={v => set({ image: { ...post.image!, zoom: v } })} title="Zoom in on the part that matters" />
                <div className="tp-hint">{post.visual === 'screenshot' ? 'The screenshot keeps its colors in a frame that fits it. Zoom in, then drag it on the card to show the part that matters.' : 'The photo fills the card, toned so the words read. Drag it on the card to choose what shows.'}</div>
                <button className="tp-link" onClick={() => set({ image: null })}>
                  Remove the picture
                </button>
              </>
            )}
          </>
        )}
      </Section>

      <Section title="Layout">
        <div className="row">
          <span className="label">Size</span>
          <Seg value={size} options={SIZE_OPTIONS.map(o => ({ value: o.value, label: `${o.short}${bestSize === o.value ? ' ·' : ''}`, title: `${o.label}${bestSize === o.value ? ', best for this screenshot' : ''}` }))} onChange={v => set({ size: v === thread.size ? null : v })} />
        </div>
        {(post.visual === 'none' || post.visual === 'photo') && (
          <div className="row">
            <span className="label">Words</span>
            <Seg
              value={post.side}
              options={[
                { value: 'left', label: 'Top' },
                { value: 'right', label: 'Bottom' },
              ]}
              onChange={side => set({ side })}
            />
          </div>
        )}
        {post.visual !== 'none' && post.visual !== 'photo' && (
          <div className="row">
            <span className="label">Picture</span>
            <Seg
              value={post.side}
              options={
                size === 'landscape'
                  ? [
                      { value: 'left', label: 'Left' },
                      { value: 'right', label: 'Right' },
                    ]
                  : [
                      { value: 'left', label: 'Top' },
                      { value: 'right', label: 'Bottom' },
                    ]
              }
              onChange={side => set({ side })}
            />
          </div>
        )}
        {post.visual !== 'photo' && (
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
        )}
        <div className="row">
          <span className="label">Logo</span>
          <Seg
            value={post.logo}
            options={[
              { value: 'auto', label: 'Auto', title: 'The full logo when it fits, else the mark' },
              { value: 'lockup', label: 'Full', title: 'The mark and STRIKE' },
              { value: 'mark', label: 'Mark', title: 'The mark alone' },
            ]}
            onChange={logo => set({ logo })}
          />
        </div>
        {layout?.logoFellBack && <div className="tp-hint">Only the mark fits beside the number here; it keeps its clear space.</div>}
        <Toggle on={riskOn} onChange={v => set({ risk: v })}>
          Risk line on the card
        </Toggle>
        {(post.ground || post.size || post.risk !== null) && (
          <button className="tp-link" onClick={() => set({ ground: null, size: null, risk: null })}>
            This post differs from the {single ? 'others' : 'thread'} · use the usual look
          </button>
        )}
      </Section>

      <Section title={`Post text · goes into X`}>
        <textarea className="tp-area" rows={4} value={post.text} placeholder="What the post says on X" onChange={e => set({ text: e.target.value })} data-testid="post-text" aria-label="Post text" />
        <div className="tp-count">
          <span className={`tp-meter${len > X_LIMIT ? ' over' : len > X_LIMIT - 20 ? ' near' : ''}`}>
            <span style={{ width: `${Math.min(100, (len / X_LIMIT) * 100)}%` }} />
          </span>
          <span className={len > X_LIMIT ? 'tp-over' : 'tp-faint'} data-testid="post-count">
            {len} / {X_LIMIT}
          </span>
        </div>
        {len > X_LIMIT && <div className="tp-warn">X allows {X_LIMIT}. Take out {len - X_LIMIT} characters, or split it into two posts.</div>}
        {numbered && n > 1 && (
          <div className="tp-hint">
            “{index + 1}/{n}” is added at the end. Links count as 23.
          </div>
        )}
      </Section>

      <Section title={single ? 'All posts' : 'Whole thread'} defaultOpen={false}>
        <div className="tp-hint" style={{ marginTop: -4 }}>
          Set the usual look once: every post follows it unless you change that post.
        </div>
        <div className="row">
          <span className="label">Ground</span>
          <div className="chips" role="radiogroup" aria-label="Usual ground">
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
          <Seg value={thread.size} options={SIZE_OPTIONS.map(o => ({ value: o.value, label: o.short, title: o.label }))} onChange={v => setDefaults({ size: v })} />
        </div>
        {thread.kind === 'thread' && (
          <>
            <Toggle on={thread.numberText} onChange={v => setDefaults({ numberText: v })}>
              Add “1/{n}” to each post’s text
            </Toggle>
            <Toggle on={thread.numberCards} onChange={v => setDefaults({ numberCards: v })}>
              Show “1/{n}” on the cards
            </Toggle>
          </>
        )}
        <button
          className="tp-link"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Start again from the examples? Your ${single ? 'posts' : 'thread'} here will be replaced.`)) {
              reset();
              setStatus({ text: 'Started again from the examples.', tone: 'info' });
            }
          }}
        >
          Start again from the examples
        </button>
      </Section>
    </aside>
  );
}

/* ---------- the whole tool ---------- */

/** Actions for the top bar. */
export function ThreadActions() {
  const thread = useThread(s => s.thread);
  const [note, setNote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 3200);
    return () => clearTimeout(t);
  }, [note]);
  const posts = thread.kind === 'posts';
  return (
    <div className="tp-actions-top">
      {note && <span className="tp-top-note">{note}</span>}
      {!posts && (
        <button
          className="btn soft"
          onClick={async () => setNote((await copyText(threadText(thread))) ? `Copied all ${thread.posts.length} posts. Paste them into X one by one.` : "Your browser wouldn't copy. Select the text and copy it instead.")}
          title="Every post's text, separated by blank lines"
          data-testid="copy-all"
        >
          <IconText /> Copy all text
        </button>
      )}
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
            setNote(thread.posts.some(p => p.animated && hasFigure(p)) ? `Saved ${n} still images. For moving posts, download each MP4 from its post.` : posts ? `Saved ${n} images.` : `Saved ${n} images, numbered in thread order.`);
          } catch (e) {
            setNote(`Couldn't save the images: ${e instanceof Error ? e.message : String(e)}`);
          } finally {
            setSaving(false);
          }
        }}
        title="A PNG of every card"
        data-testid="download-all"
      >
        <IconDownload /> Download all
      </button>
    </div>
  );
}

export function ThreadTool() {
  const thread = useThread(s => s.thread);
  const selectedId = useThread(s => s.selectedId);
  const category = useThread(s => s.category);
  const guideSeen = useThread(s => s.guideSeen);
  const index = Math.max(0, thread.posts.findIndex(p => p.id === selectedId));
  const post = thread.posts[index]!;
  const [layout, setLayout] = useState<CardLayout | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [video, setVideo] = useState<'mp4' | 'webm' | null | undefined>(undefined);
  const busy = status?.tone === 'busy';
  const fileInput = useRef<HTMLInputElement>(null);

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
  const moving = post.animated && hasFigure(post);

  /* a picture from a file, a drop or the clipboard: a screenshot unless the post asked for a photo */
  const takeFile = useCallback(
    async (f: File) => {
      const p = useThread.getState().thread.posts.find(x => x.id === post.id);
      if (!p) return;
      try {
        const image = await addImage(f);
        useThread.getState().updatePost(p.id, { image, visual: p.visual === 'photo' ? 'photo' : 'screenshot' });
        setStatus({ text: `Added ${f.name || 'the picture'}. Drag it on the card to choose what shows.`, tone: 'ok' });
      } catch (e) {
        setStatus({ text: e instanceof Error ? e.message : String(e), tone: 'warn' });
      }
    },
    [post.id],
  );

  /* paste a screenshot straight in, unless someone is pasting into a field */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return;
      const f = [...(e.clipboardData?.files ?? [])].find(x => x.type.startsWith('image/'));
      if (!f) return;
      e.preventDefault();
      void takeFile(f);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [takeFile]);

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
    const ok = await copyText(postText(post.text, index, n, thread.kind === 'thread' && thread.numberText));
    setStatus(ok ? { text: 'Copied. Paste it into your post on X.', tone: 'ok' } : { text: "Your browser wouldn't copy. Select the text and copy it instead.", tone: 'warn' });
  };

  const copyPostImage = async () => {
    /* straight from the click, so the browser lets us at the clipboard */
    const ok = await copyImage(cardPng(thread, post, index));
    setStatus(
      ok
        ? { text: moving ? 'Copied the still picture. Paste it into your post. For motion, download the MP4.' : 'Copied the image. Paste it into your post.', tone: 'ok' }
        : { text: "Your browser won't copy images. Use Download PNG, then attach the file.", tone: 'warn' },
    );
  };

  const savePng = () =>
    run('Making the PNG…', async () => {
      const blob = await cardPng(thread, post, index);
      download(blob, `${name}.png`);
      return { text: `Downloaded ${name}.png. Attach it to your post.`, tone: 'ok' };
    });

  const saveVideo = () =>
    run('Making the video…', async (signal, onProgress) => {
      const { blob, ext, note } = await cardVideo(thread, post, index, { signal, onProgress });
      download(blob, `${name}.${ext}`);
      if (ext === 'webm') return { text: `Downloaded ${name}.webm (${mb(blob.size)}). X doesn't take WebM: use the GIF, or make the MP4 in Chrome, Edge or Safari.`, tone: 'warn' };
      return { text: `Downloaded ${name}.mp4 (${mb(blob.size)}). Attach it to your post.${note ? ` ${note}` : ''}`, tone: note ? 'warn' : 'ok' };
    });

  const saveGif = () =>
    run('Making the GIF…', async (signal, onProgress) => {
      const blob = await cardGif(thread, post, index, { signal, onProgress });
      download(blob, `${name}.gif`);
      if (blob.size > GIF_LIMIT) return { text: `Downloaded ${name}.gif, but it's ${mb(blob.size)}: over X's 15 MB limit for GIFs. Use the MP4, or a shorter loop.`, tone: 'warn' };
      return { text: `Downloaded ${name}.gif (${mb(blob.size)}). Attach it to your post.`, tone: 'ok' };
    });

  const pal = PALETTES[groundOfPost(thread, post)];
  const { setGuideSeen } = useThread.getState();
  return (
    <div className="tp" data-testid="thread-tool">
      <PostList thread={thread} selectedId={post.id} category={category} />
      <main className="tp-stage" style={{ ['--tp-ground' as string]: pal.ground }}>
        <Stage thread={thread} post={post} index={index} layout={layout} onLayout={onLayout} onFile={f => void takeFile(f)}>
          {!guideSeen && <Guide onDone={() => setGuideSeen(true)} />}
        </Stage>
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
              disabled={busy || !moving || video === null}
              data-testid="download-mp4"
              title={!moving ? 'Pick an illustration and turn on Animated to make a video' : video === null ? "This browser can't make videos" : 'A video of the card, looping once'}
            >
              <IconDownload /> {video === 'webm' ? 'WebM' : 'MP4'}
            </button>
            <button className="btn soft" onClick={saveGif} disabled={busy || !moving} data-testid="download-gif" title={moving ? 'A looping GIF at half size, to stay under X’s 15 MB' : 'Pick an illustration and turn on Animated to make a GIF'}>
              <IconDownload /> GIF
            </button>
          </div>
          <div className={`tp-status ${status?.tone ?? ''}`} role="status" aria-live="polite" data-testid="status">
            {status?.tone === 'busy' && (
              <span className="tp-progress">
                <span style={{ width: `${Math.round((status.progress ?? 0) * 100)}%` }} />
              </span>
            )}
            <span className="tp-status-text">{status ? `${status.text}${status.tone === 'busy' && status.progress ? ` ${Math.round(status.progress * 100)}%` : ''}` : moving ? 'Moving cards download as MP4 (best on X) or GIF.' : 'Copy the text and the image, then paste both into a post.'}</span>
            {status?.cancel && (
              <button className="btn small soft" onClick={status.cancel} data-testid="cancel">
                Cancel
              </button>
            )}
          </div>
        </div>
      </main>
      <Inspector thread={thread} post={post} index={index} layout={layout} setStatus={setStatus} busy={busy} onUpload={() => fileInput.current?.click()} onGuide={() => setGuideSeen(false)} />
      <input
        ref={fileInput}
        type="file"
        accept={ACCEPT}
        hidden
        data-testid="file"
        onChange={e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void takeFile(f);
        }}
      />
    </div>
  );
}
