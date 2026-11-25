/* The Patterns tab: halftone dot patterns for posts, posters, slides and
   headers that look a little empty. Start from a look, or from an image or a
   figure; set the dots, the colour and the motion; download a PNG, an SVG, a
   video or a GIF, or put it behind a post. */
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { canvasPng, download, encodeGif, encodeVideo, type FrameSource, videoSupport } from '../anim/encode';
import { useLibraryThumb } from '../ui/thumbs';
import { Section, Seg, SliderRow, Toggle } from '../ui/controls';
import { IconDownload, IconUpload } from '../ui/icons';
import { figureName } from '../social/figure';
import { ACCEPT, addImage } from '../social/images';
import { Picker } from '../social/Picker';
import { useThread } from '../social/store';
import type { ToneMap } from './field';
import { drawDots, paintGround, patternSvgFile, GREEN_GRADIENT } from './draw';
import { patternDots } from './halftone';
import { patternMoves, type DiscLayout, type DotShape, inkOf, KINDS, LOUD, type PatternGround, type PatternKind, patternContrast, type PatternSpec, PRESETS, presetSpec, type Screen, type ShapeKind } from './spec';
import { PATTERN_GROUNDS, PATTERN_SIZES, type PatternSize, SIZE_LIST, usePattern } from './store';
import { toneFor, toneKey } from './sources';

/** The tone map a pattern reads, loaded when its picture changes. */
export function useToneMap(spec: PatternSpec): ToneMap | null {
  const key = toneKey(spec);
  const [st, setSt] = useState<{ key: string; map: ToneMap | null }>({ key: '', map: null });
  useEffect(() => {
    if (!key) return;
    let live = true;
    void toneFor(spec).then(map => live && setSt({ key, map }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return st.key === key ? st.map : null;
}

/** A stronger ink for thumbnails of quiet patterns, so their shape shows at a small size. */
const previewInk = (ground: PatternGround) => (ground === 'dark' || ground === 'none' ? { color: '#4A4D52', opacity: 1 } : ground === 'green' ? { color: '#FFFFFF', opacity: 0.45 } : { color: '#B3B3B3', opacity: 1 });

/** A pattern drawn on its ground, playing when asked. */
export function PatternCanvas({ spec, ground, W, H, width, playing = false, map, className, preview = false }: { spec: PatternSpec; ground: PatternGround; W: number; H: number; width: number; playing?: boolean; map: ToneMap | null; className?: string; /** draw a quiet pattern stronger, so a thumbnail shows its shape */ preview?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round((width * H) / W);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
    const ctx = c.getContext('2d')!;
    const k = (width * dpr) / W;
    const ink = preview && spec.color === null ? previewInk(ground) : inkOf(spec, ground);
    const paint = (t: number) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      paintGround(ctx, ground, W, H);
      drawDots(ctx, patternDots(spec, W, H, t, { map }), spec, ink);
    };
    if (!playing || !patternMoves(spec)) {
      paint(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      paint((((now - t0) / 1000 / Math.max(1, spec.motion.seconds)) % 1 + 1) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spec, ground, W, H, width, height, playing, map, preview]);
  return <canvas ref={ref} className={className} style={{ width, height }} />;
}

/** A preset, drawn small on the current ground and artboard. */
function PresetThumb({ id, ground, size }: { id: string; ground: PatternGround; size: PatternSize }) {
  const spec = useMemo(() => ({ ...presetSpec(id), motion: { drift: 0, glitch: 0, seconds: 8 } }), [id]);
  const { width: W, height: H } = PATTERN_SIZES[size];
  /* the same look at thumbnail size: draw the full artboard, scaled down */
  return <PatternCanvas spec={spec} ground={ground} W={W} H={H} width={116} map={null} preview />;
}

const SCREENS: { value: Screen; label: string; title: string }[] = [
  { value: 'grid', label: 'Grid', title: 'A square grid of dots' },
  { value: 'stagger', label: 'Stagger', title: 'Every other row shifted half a dot' },
  { value: 'rings', label: 'Rings', title: 'Concentric rings around the center' },
];
const SHAPES: { value: DotShape; label: string; title: string }[] = [
  { value: 'circle', label: 'Dots', title: 'Round dots' },
  { value: 'square', label: 'Squares', title: 'Square dots' },
  { value: 'char', label: 'ASCII', title: 'Characters, · : + * #, in Geist Mono' },
];
const SOLIDS: { value: ShapeKind; label: string }[] = [
  { value: 'cube', label: 'Cube' },
  { value: 'stack', label: 'Stack' },
  { value: 'steps', label: 'Steps' },
  { value: 'cylinder', label: 'Cylinder' },
  { value: 'sphere', label: 'Sphere' },
];
const LAYOUTS: { value: DiscLayout; label: string }[] = [
  { value: 'petals', label: 'Round' },
  { value: 'pair', label: 'Pair' },
  { value: 'row', label: 'Row' },
  { value: 'scatter', label: 'Scatter' },
];

/** Dot colours to pick from: the quiet one for the ground, then the brand's. */
const SWATCHES: { value: string; label: string }[] = [
  { value: '#0C0C0C', label: 'Ground black' },
  { value: '#2A2A2A', label: 'Dark gray' },
  { value: '#4A4D52', label: 'Gray' },
  { value: '#8A8F98', label: 'Mid gray' },
  { value: '#B3B3B3', label: 'Light gray' },
  { value: '#E8E8E9', label: 'Very light gray' },
  { value: '#FFFFFF', label: 'White' },
  { value: '#10B981', label: 'Strike Green' },
  { value: '#50EBA0', label: 'Mint' },
  { value: '#047857', label: 'Mark Deep' },
];

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

/** Everything about the pattern, set by hand. Shared by the Patterns tab. */
function Controls({ spec, ground, onUpload, onFigure }: { spec: PatternSpec; ground: PatternGround; onUpload: () => void; onFigure: () => void }) {
  const { set, setPart } = usePattern.getState();
  const loud = patternContrast(spec, ground) > LOUD;
  return (
    <>
      <Section title="Pattern">
        <div className="pt-kinds" role="radiogroup" aria-label="Kind">
          {KINDS.map(k => (
            <button key={k.value} className={`chip${spec.kind === k.value ? ' on' : ''}`} role="radio" aria-checked={spec.kind === k.value} title={k.title} onClick={() => set({ kind: k.value as PatternKind, screen: k.value === 'rings' ? 'rings' : spec.screen === 'rings' && k.value !== 'shape' ? 'grid' : spec.screen })} data-testid={`pkind-${k.value}`}>
              {k.label}
            </button>
          ))}
        </div>
        {spec.kind === 'wave' && (
          <>
            <SliderRow label="Height" value={spec.wave.amplitude} min={0} max={0.4} step={0.01} places={2} onChange={v => setPart('wave', { amplitude: v })} title="How far the band swings" />
            <SliderRow label="Length" value={spec.wave.length} min={0.3} max={3} step={0.05} places={2} onChange={v => setPart('wave', { length: v })} title="The length of one swing" />
            <SliderRow label="Thickness" value={spec.wave.thickness} min={0.02} max={0.4} step={0.01} places={2} onChange={v => setPart('wave', { thickness: v })} />
            <SliderRow label="Haze" value={spec.wave.spread} min={0} max={1} step={0.05} places={2} onChange={v => setPart('wave', { spread: v })} title="Small dots spreading from one side of the band" />
            <SliderRow label="Fade ends" value={spec.wave.fade} min={0} max={0.5} step={0.01} places={2} onChange={v => setPart('wave', { fade: v })} />
            <SliderRow label="Bands" value={spec.wave.bands} min={1} max={4} step={1} onChange={v => setPart('wave', { bands: v })} />
          </>
        )}
        {spec.kind === 'ribbon' && (
          <>
            <SliderRow label="Width" value={spec.ribbon.width} min={0.05} max={0.8} step={0.01} places={2} onChange={v => setPart('ribbon', { width: v })} />
            <SliderRow label="Twists" value={spec.ribbon.twists} min={0} max={5} step={0.1} places={1} onChange={v => setPart('ribbon', { twists: v })} title="Half turns along its length" />
            <SliderRow label="Swing" value={spec.ribbon.amplitude} min={0} max={0.5} step={0.01} places={2} onChange={v => setPart('ribbon', { amplitude: v })} />
            <SliderRow label="Length" value={spec.ribbon.length} min={0.4} max={3} step={0.05} places={2} onChange={v => setPart('ribbon', { length: v })} />
          </>
        )}
        {spec.kind === 'discs' && (
          <>
            <Group label="Layout">
              <Seg value={spec.discs.layout} options={LAYOUTS} onChange={layout => setPart('discs', { layout })} />
            </Group>
            {spec.discs.layout !== 'pair' && <SliderRow label="Discs" value={spec.discs.count} min={1} max={8} step={1} onChange={v => setPart('discs', { count: v })} />}
            <SliderRow label="Size" value={spec.discs.radius} min={0.08} max={0.6} step={0.01} places={2} onChange={v => setPart('discs', { radius: v })} />
          </>
        )}
        {spec.kind === 'rings' && (
          <>
            <SliderRow label="Blobs" value={spec.rings.blobs} min={1} max={5} step={1} onChange={v => setPart('rings', { blobs: v })} />
            <SliderRow label="Blob size" value={spec.rings.size} min={0.05} max={0.7} step={0.01} places={2} onChange={v => setPart('rings', { size: v })} />
            <SliderRow label="Reach" value={spec.rings.reach} min={0.2} max={1.6} step={0.05} places={2} onChange={v => setPart('rings', { reach: v })} title="How far out the rings go before they fade" />
          </>
        )}
        {spec.kind === 'shape' && (
          <>
            <Group label="Shape">
              <Seg value={spec.solid.kind} options={SOLIDS} onChange={kind => setPart('solid', { kind })} />
            </Group>
            <Group label="Light">
              <Seg
                value={spec.solid.light}
                options={[
                  { value: 'left', label: 'From left' },
                  { value: 'right', label: 'From right' },
                ]}
                onChange={light => setPart('solid', { light })}
              />
            </Group>
            <SliderRow label="Depth" value={spec.solid.depth} min={0} max={1} step={0.05} places={2} onChange={v => setPart('solid', { depth: v })} title="Shading across each face" />
          </>
        )}
        {spec.kind === 'image' && (
          <>
            <button className="tp-upload" onClick={onUpload} data-testid="pattern-upload">
              <IconUpload />
              <span>
                <strong>{spec.image ? 'Replace the image' : 'Choose an image'}</strong>
                <span className="tp-faint">{spec.image ? spec.image.name : 'A photo, a logo or a drawing. Or drop it on the artboard.'}</span>
              </span>
            </button>
            <Toggle on={spec.invert} onChange={invert => set({ invert })}>
              Dots for the light parts
            </Toggle>
          </>
        )}
        {spec.kind === 'figure' && (
          <>
            <FigureButton spec={spec} onClick={onFigure} />
            <Toggle on={spec.invert} onChange={invert => set({ invert })}>
              Dots for the light parts
            </Toggle>
          </>
        )}
      </Section>

      <Section title="Dots">
        <Group label="Screen">
          <Seg value={spec.screen} options={SCREENS} onChange={screen => set({ screen })} />
        </Group>
        <Group label="Shape">
          <Seg value={spec.shape} options={SHAPES} onChange={shape => set({ shape })} />
        </Group>
        <SliderRow label="Spacing" value={spec.spacing} min={6} max={60} step={1} unit=" px" onChange={v => set({ spacing: v })} title="Distance between dots on the artboard" />
        <SliderRow label="Dot size" value={spec.dot} min={0.2} max={1.3} step={0.05} places={2} onChange={v => set({ dot: v })} title="The largest dot against the spacing; 1 touches" />
        {spec.screen !== 'rings' && spec.kind !== 'ribbon' && <SliderRow label="Grid angle" value={spec.angle} min={-90} max={90} step={1} unit="°" onChange={v => set({ angle: v })} />}
        <SliderRow label="Smallest" value={spec.floor} min={0} max={0.8} step={0.05} places={2} onChange={v => set({ floor: v })} title="Keep a small dot everywhere the pattern reaches" />
        <SliderRow label="Contrast" value={spec.contrast} min={-0.5} max={1} step={0.05} places={2} onChange={v => set({ contrast: v })} />
        <SliderRow label="Density" value={spec.density} min={-1} max={1} step={0.05} places={2} onChange={v => set({ density: v })} title="Smaller or larger dots throughout" />
      </Section>

      <Section title="Place">
        <SliderRow label="Across" value={spec.x} min={-0.2} max={1.2} step={0.01} places={2} onChange={v => set({ x: v })} />
        <SliderRow label="Down" value={spec.y} min={-0.2} max={1.2} step={0.01} places={2} onChange={v => set({ y: v })} />
        <SliderRow label="Scale" value={spec.scale} min={0.2} max={3} step={0.05} places={2} onChange={v => set({ scale: v })} />
        {spec.kind !== 'image' && spec.kind !== 'figure' && <SliderRow label="Turn" value={spec.rotate} min={-180} max={180} step={1} unit="°" onChange={v => set({ rotate: v })} />}
        {(spec.kind === 'wave' || spec.kind === 'ribbon' || spec.kind === 'rings' || (spec.kind === 'discs' && spec.discs.layout === 'scatter')) && (
          <button className="tp-link" onClick={() => set({ seed: (spec.seed % 97) + 1 })}>
            Shuffle
          </button>
        )}
      </Section>

      <Section title="Color">
        <div className="pt-swatches" role="radiogroup" aria-label="Dot color">
          <button className={`pt-sw auto${spec.color === null ? ' on' : ''}`} role="radio" aria-checked={spec.color === null} title="Quiet: a dark gray on black, a very light gray on white" onClick={() => set({ color: null, opacity: 1 })} data-testid="pcolor-auto">
            Quiet
          </button>
          {SWATCHES.map(s => (
            <button key={s.value} className={`pt-sw${spec.color === s.value ? ' on' : ''}`} role="radio" aria-checked={spec.color === s.value} title={s.label} style={{ background: s.value }} onClick={() => set({ color: s.value })} />
          ))}
          <label className="pt-sw custom" title="Any color">
            <input type="color" value={spec.color ?? '#2a2a2a'} onChange={e => set({ color: e.target.value.toUpperCase() })} aria-label="Any color" />
          </label>
        </div>
        <SliderRow label="Strength" value={spec.opacity} min={0.05} max={1} step={0.05} places={2} onChange={v => set({ opacity: v })} title="How strongly the dots show" />
        {loud && <div className="tp-warn">These dots stand out strongly. Behind words, keep them quiet so the headline stays first: lower the strength or use Quiet.</div>}
      </Section>

      <Section title="Motion">
        <SliderRow label="Drift" value={spec.motion.drift} min={0} max={1} step={0.05} places={2} onChange={v => setPart('motion', { drift: v })} title="The pattern flows slowly, and comes back round" />
        <SliderRow label="Glitch" value={spec.motion.glitch} min={0} max={1} step={0.05} places={2} onChange={v => setPart('motion', { glitch: v })} title="Single dots flicker" />
        <SliderRow label="Loop" value={spec.motion.seconds} min={3} max={20} step={1} unit="s" onChange={v => setPart('motion', { seconds: v })} />
      </Section>
    </>
  );
}

function FigureButton({ spec, onClick }: { spec: PatternSpec; onClick: () => void }) {
  const ref = spec.figure;
  const url = useLibraryThumb(ref?.kind === 'library' ? ref.id : '');
  return (
    <button className="tp-figpick" onClick={onClick} data-testid="pattern-figure">
      <span className="pic">{url ? <img src={url} alt="" draggable={false} /> : null}</span>
      <span className="tp-figpick-text">
        <span className="tp-figpick-name">{ref ? figureName(ref) : 'Choose a figure'}</span>
        <span className="tp-faint">Any illustration, drawn in dots · Change</span>
      </span>
    </button>
  );
}

interface Status {
  text: string;
  tone: 'info' | 'ok' | 'warn' | 'busy';
  progress?: number;
  cancel?: () => void;
}

const FPS = 30;

/** The pattern, moving or still, as frames for the encoders. */
function patternFrames(spec: PatternSpec, ground: PatternGround, W: number, H: number, map: ToneMap | null, scale: number, fps: number): FrameSource {
  const ink = inkOf(spec, ground);
  const frames = patternMoves(spec) ? Math.max(1, Math.round(spec.motion.seconds * fps)) : 1;
  return {
    width: Math.round(W * scale),
    height: Math.round(H * scale),
    fps,
    frames,
    draw: (i, ctx) => {
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      /* video has no transparency: a missing ground is black */
      paintGround(ctx, ground === 'none' ? 'dark' : ground, W, H);
      drawDots(ctx, patternDots(spec, W, H, i / frames, { map }), spec, ink);
    },
  };
}

export function PatternTool() {
  const spec = usePattern(s => s.spec);
  const size = usePattern(s => s.size);
  const ground = usePattern(s => s.ground);
  const preset = usePattern(s => s.preset);
  const playing = usePattern(s => s.playing);
  const { applyPreset, setSize, setGround, setPlaying, set } = usePattern.getState();
  const { width: W, height: H } = PATTERN_SIZES[size];
  const map = useToneMap(spec);
  const stage = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState({ w: 800, h: 500 });
  const [status, setStatus] = useState<Status | null>(null);
  const [picking, setPicking] = useState(false);
  const [over, setOver] = useState(false);
  const [video, setVideo] = useState<'mp4' | 'webm' | null | undefined>(undefined);
  const file = useRef<HTMLInputElement>(null);
  const busy = status?.tone === 'busy';
  const moves = patternMoves(spec);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAvail({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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

  const k = Math.min((avail.w - 40) / W, (avail.h - 40) / H, 1);
  const width = Math.max(120, Math.floor(W * k));

  const takeFile = async (f: File) => {
    try {
      const image = await addImage(f);
      /* on dark grounds the dots are light, so they draw the light parts */
      set({ kind: 'image', image, invert: ground === 'dark' || ground === 'green' || ground === 'none', x: 0.5, y: 0.5, scale: 1, rotate: 0, screen: spec.screen === 'rings' ? 'grid' : spec.screen });
      setStatus({ text: `Made dots from ${f.name || 'the image'}.`, tone: 'ok' });
    } catch (e) {
      setStatus({ text: e instanceof Error ? e.message : String(e), tone: 'warn' });
    }
  };

  const name = `strike-pattern-${spec.kind}-${PATTERN_SIZES[size].label.toLowerCase().replace(/[^a-z0-9]+/g, 'x')}`;
  const run = async (label: string, job: (signal: AbortSignal, progress: (d: number, t: number) => void) => Promise<Status>) => {
    const ac = new AbortController();
    setStatus({ text: label, tone: 'busy', progress: 0, cancel: () => ac.abort() });
    try {
      setStatus(await job(ac.signal, (d, t) => setStatus({ text: label, tone: 'busy', progress: d / t, cancel: () => ac.abort() })));
    } catch (e) {
      if (ac.signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) setStatus({ text: 'Cancelled.', tone: 'info' });
      else setStatus({ text: `That didn't work: ${e instanceof Error ? e.message : String(e)}`, tone: 'warn' });
    }
  };
  const savePng = () =>
    run('Making the PNG…', async () => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const ctx = c.getContext('2d')!;
      paintGround(ctx, ground, W, H);
      drawDots(ctx, patternDots(spec, W, H, 0, { map }), spec, inkOf(spec, ground));
      download(await canvasPng(c), `${name}.png`);
      return { text: `Downloaded ${name}.png (${W}×${H}).`, tone: 'ok' };
    });
  const saveSvg = () =>
    run('Making the SVG…', async () => {
      const dots = patternDots(spec, W, H, 0, { map });
      const svg = patternSvgFile(dots, spec, inkOf(spec, ground), W, H, ground === 'green' ? { color: null, gradient: GREEN_GRADIENT } : { color: ground === 'none' ? null : ({ dark: '#0C0C0C', light: '#F9F9F9', gray: '#E8E8E9' } as Record<string, string>)[ground] ?? null });
      download(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`);
      return { text: `Downloaded ${name}.svg: ${dots.length.toLocaleString('en-US')} dots, editable in Figma or Illustrator.`, tone: 'ok' };
    });
  const saveVideo = () =>
    run('Making the video…', async (signal, onProgress) => {
      const { blob, ext, note } = await encodeVideo(patternFrames(spec, ground, W, H, map, 1, FPS), { signal, onProgress, bitrate: 10_000_000 });
      download(blob, `${name}.${ext}`);
      return { text: `Downloaded ${name}.${ext}.${note ? ` ${note}` : ''}`, tone: note ? 'warn' : 'ok' };
    });
  const saveGif = () =>
    run('Making the GIF…', async (signal, onProgress) => {
      const blob = await encodeGif(patternFrames(spec, ground, W, H, map, 0.5, 15), { signal, onProgress });
      download(blob, `${name}.gif`);
      return { text: `Downloaded ${name}.gif at half size.`, tone: 'ok' };
    });

  return (
    <div className="tp pt" data-testid="pattern-tool">
      <aside className="tp-posts card">
        <div className="panel-top tp-posts-top">
          <div className="tp-row">
            <span className="tp-title">Start from</span>
          </div>
        </div>
        <div className="pt-presets">
          {PRESETS.map(p => (
            <button key={p.id} className={`pt-preset${preset === p.id ? ' on' : ''}`} onClick={() => applyPreset(p.id)} data-testid={`preset-${p.id}`} title={p.label}>
              <PresetThumb id={p.id} ground={ground} size={size} />
              <span>{p.label}</span>
            </button>
          ))}
          <button className={`pt-preset src${spec.kind === 'image' ? ' on' : ''}`} onClick={() => file.current?.click()} data-testid="preset-image">
            <span className="pt-src-icon">
              <IconUpload />
            </span>
            <span>From an image</span>
          </button>
          <button className={`pt-preset src${spec.kind === 'figure' ? ' on' : ''}`} onClick={() => setPicking(true)} data-testid="preset-figure">
            <span className="pt-src-icon">◇</span>
            <span>From a figure</span>
          </button>
        </div>
        <div className="tp-hint pt-note">Patterns fill posts and posters that look empty. Keep them quiet behind words: the headline stays first.</div>
      </aside>

      <main className="tp-stage">
        <div
          className={`tp-canvas${over ? ' drop' : ''}`}
          ref={stage}
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
            if (f) void takeFile(f);
          }}
        >
          <div className={`tp-shadow${ground === 'none' ? ' pt-checker' : ''}`} data-testid="pattern-canvas">
            <PatternCanvas spec={spec} ground={ground} W={W} H={H} width={width} playing={playing} map={map} />
          </div>
          {(spec.kind === 'image' && !spec.image) || (spec.kind === 'figure' && !spec.figure) ? <div className="pt-empty">{spec.kind === 'image' ? 'Choose an image, or drop one here' : 'Choose a figure'}</div> : null}
          {over && <div className="tp-drop">Drop the image to turn it into dots</div>}
        </div>
        <div className="tp-bar">
          <div className="tp-bar-actions" role="toolbar" aria-label="Download the pattern">
            {moves && (
              <button className="btn soft" onClick={() => setPlaying(!playing)} data-testid="pattern-play">
                {playing ? 'Pause' : 'Play'}
              </button>
            )}
            <span className="tp-sep" />
            <button className="btn soft" onClick={savePng} disabled={busy} data-testid="pattern-png">
              <IconDownload /> PNG
            </button>
            <button className="btn soft" onClick={saveSvg} disabled={busy} data-testid="pattern-svg">
              <IconDownload /> SVG
            </button>
            <button className="btn soft" onClick={saveVideo} disabled={busy || !moves || video === null} title={moves ? 'A video of one loop' : 'Turn up Drift or Glitch to make a video'} data-testid="pattern-mp4">
              <IconDownload /> {video === 'webm' ? 'WebM' : 'MP4'}
            </button>
            <button className="btn soft" onClick={saveGif} disabled={busy || !moves} title={moves ? 'A looping GIF at half size' : 'Turn up Drift or Glitch to make a GIF'} data-testid="pattern-gif">
              <IconDownload /> GIF
            </button>
          </div>
          <div className={`tp-status ${status?.tone ?? ''}`} role="status" aria-live="polite">
            {status?.tone === 'busy' && (
              <span className="tp-progress">
                <span style={{ width: `${Math.round((status.progress ?? 0) * 100)}%` }} />
              </span>
            )}
            <span className="tp-status-text">{status ? `${status.text}${status.tone === 'busy' && status.progress ? ` ${Math.round(status.progress * 100)}%` : ''}` : `${W}×${H}. SVG keeps every dot editable.`}</span>
            {status?.cancel && (
              <button className="btn small soft" onClick={status.cancel}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </main>

      <aside className="tp-side card" data-testid="pattern-side">
        <Section title="Artboard">
          <Group label="Size">
            <select className="select" value={size} onChange={e => setSize(e.target.value as PatternSize)} data-testid="pattern-size">
              {SIZE_LIST.map(s => (
                <option key={s} value={s}>
                  {PATTERN_SIZES[s].label} · {PATTERN_SIZES[s].title}
                </option>
              ))}
            </select>
          </Group>
          <Group label="Ground">
            <div className="chips" role="radiogroup" aria-label="Ground">
              {PATTERN_GROUNDS.map(g => (
                <button key={g.value} className={`chip${ground === g.value ? ' on' : ''}`} onClick={() => setGround(g.value)} role="radio" aria-checked={ground === g.value} data-testid={`pground-${g.value}`}>
                  <span className="sw" style={{ background: g.swatch }} />
                  {g.label}
                </button>
              ))}
            </div>
          </Group>
        </Section>
        <Controls spec={spec} ground={ground} onUpload={() => file.current?.click()} onFigure={() => setPicking(true)} />
      </aside>

      <input
        ref={file}
        type="file"
        accept={ACCEPT}
        hidden
        data-testid="pattern-file"
        onChange={e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) void takeFile(f);
        }}
      />
      {picking && (
        <Picker
          current={spec.figure ?? { kind: 'library', id: 'blocks' }}
          onClose={() => setPicking(false)}
          onPick={figure => {
            set({ kind: 'figure', figure, invert: false, x: 0.5, y: 0.5, scale: 0.9, rotate: 0, screen: spec.screen === 'rings' ? 'grid' : spec.screen });
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}

/** The top bar's action: put the pattern behind a post. */
export function PatternActions() {
  const forPost = usePattern(s => s.forPost);
  const spec = usePattern(s => s.spec);
  return (
    <div className="tp-actions-top">
      <button
        className="btn primary"
        onClick={() => {
          const th = useThread.getState();
          const id = forPost && th.thread.posts.some(p => p.id === forPost) ? forPost : th.selectedId;
          th.updatePost(id, { pattern: { ...spec } });
          usePattern.setState({ forPost: null });
          th.setMode('thread');
        }}
        data-testid="pattern-use"
        title="Put this pattern behind the post you're working on"
      >
        {forPost ? 'Use on the post' : 'Use on a post'}
      </button>
    </div>
  );
}
