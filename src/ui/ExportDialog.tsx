/* Export. Pictures: SVG (clean and editable: hidden lines cut away, arcs
   kept as arcs) or PNG at 1×, 2× or 4×. Animations of the figure's loop:
   MP4 video, GIF, animated SVG (plays in browsers) or Lottie (for app and
   web developers). The preview is the file itself, playing when it moves. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { frameCount, frameEl, frameSvg, MOTIONS, motionOf, playingKind } from '../anim/motion';
import { encodeGif, encodeVideo, svgImage } from '../anim/encode';
import { animatedSvg } from '../anim/svgAnim';
import { lottie } from '../anim/lottie';
import { renderScene } from '../engine/render';
import { toSvgString } from '../engine/svg';
import type { Scene } from '../model/types';
import { useStore } from '../model/store';
import { Seg, TextField, Toggle } from './controls';
import { IconDownload } from './icons';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'figure';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export async function svgToPng(svg: string, width: number, height: number, scale: number): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error('PNG failed'))), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function saveFigure(scene: Scene) {
  const data = { app: 'strike-figures', version: 1, figure: scene };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `${slug(scene.name)}.figure.json`);
}

type Format = 'svg' | 'png' | 'mp4' | 'gif' | 'asvg' | 'lottie';
const MOVING: Format[] = ['mp4', 'gif', 'asvg', 'lottie'];

const NOTES: Record<Format, string> = {
  svg: 'Sharp at any size. Opens in Figma, and drops into a website.',
  png: 'A picture, for slides, chats and docs.',
  mp4: 'A video of the loop, for X, LinkedIn, slides and the website. Loop it when you post it.',
  gif: 'Plays everywhere, email included. Bigger file, fewer colors.',
  asvg: 'A small, sharp animation for the website. Browsers play it; Figma shows the first frame.',
  lottie: 'For app and web developers (lottie-web, LottieFiles). Shadows are left out.',
};

const EXT: Record<Format, string> = { svg: 'svg', png: 'png', mp4: 'mp4', gif: 'gif', asvg: 'svg', lottie: 'json' };

export function ExportDialog({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  const [format, setFormat] = useState<Format>('svg');
  const [background, setBackground] = useState(!scene.theme.transparent);
  const [clipHidden, setClipHidden] = useState(true);
  const [shadows, setShadows] = useState(true);
  const [scale, setScale] = useState<'1' | '2' | '4'>('2');
  const [vsize, setVsize] = useState<'540' | '1080' | '1620'>('1080');
  const [gsize, setGsize] = useState<'320' | '480' | '640'>('480');
  const [name, setName] = useState(slug(`${scene.label} ${scene.name}`));
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<{ what: string; done: number; total: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const advanced = useStore(s => s.advanced);
  const moving = MOVING.includes(format);
  const kind = playingKind(scene);
  const motion = motionOf(scene);
  const model = useMemo(() => renderScene(scene), [scene]);
  const prefix = slug(scene.name);
  const svg = useMemo(() => toSvgString(model, { clipHidden, background, shadows, idPrefix: prefix }), [model, clipHidden, background, shadows, prefix]);
  const { width: W, height: H } = scene.artboard;
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  /* the preview plays the loop while a moving format is chosen */
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    if (!moving || kind === 'none') {
      el.innerHTML = svg;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (((now - start) / 1000) % motion.duration) / motion.duration;
      el.innerHTML = frameSvg(scene, t, { clipHidden: false, background, shadows, idPrefix: `${prefix}-p` });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [moving, kind, svg, scene, background, shadows, prefix, motion.duration]);

  const go = async () => {
    setMessage(null);
    if (format === 'svg') return download(new Blob([svg], { type: 'image/svg+xml' }), `${name}.svg`);
    if (format === 'png') return download(await svgToPng(svg, W, H, Number(scale)), `${name}@${scale}x.png`);
    const ctl = new AbortController();
    abort.current = ctl;
    try {
      if (format === 'mp4' || format === 'gif') {
        const fps = format === 'mp4' ? 30 : 20;
        const side = Number(format === 'mp4' ? vsize : gsize);
        const n = frameCount(scene, fps);
        const k = side / Math.max(W, H);
        const w = Math.round(W * k);
        const h = Math.round(H * k);
        const src = {
          width: w,
          height: h,
          fps,
          frames: n,
          draw: async (i: number, ctx: CanvasRenderingContext2D) => {
            const img = await svgImage(frameSvg(scene, i / n, { clipHidden: false, background: true, shadows, idPrefix: `${prefix}-v` }), w, h);
            ctx.drawImage(img, 0, 0, w, h);
          },
        };
        const onProgress = (done: number, total: number) => setBusy({ what: format === 'mp4' ? 'Making the video' : 'Making the GIF', done, total });
        onProgress(0, n);
        if (format === 'mp4') {
          const v = await encodeVideo(src, { onProgress, signal: ctl.signal });
          download(v.blob, `${name}.${v.ext}`);
          setMessage(v.note ?? `Saved a ${(v.blob.size / 1e6).toFixed(1)} MB video.`);
        } else {
          const gif = await encodeGif(src, { onProgress, signal: ctl.signal });
          download(gif, `${name}.gif`);
          setMessage(`Saved a ${(gif.size / 1e6).toFixed(1)} MB GIF.${gif.size > 15e6 ? ' That is over X’s 15 MB limit: choose a smaller size.' : ''}`);
        }
      } else {
        const fps = 24;
        const n = frameCount(scene, fps);
        const frames = [];
        for (let i = 0; i < n; i++) {
          if (ctl.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
          frames.push(frameEl(scene, i / n, { clipHidden, background, shadows: format === 'asvg' && shadows, idPrefix: prefix }));
          if (i % 8 === 0) {
            setBusy({ what: 'Drawing the frames', done: i, total: n });
            await new Promise(r => setTimeout(r));
          }
        }
        setBusy({ what: 'Writing the file', done: n, total: n });
        await new Promise(r => setTimeout(r));
        const text = format === 'asvg' ? animatedSvg(frames, fps) : JSON.stringify(lottie(frames, fps, scene.name));
        const blob = new Blob([text], { type: format === 'asvg' ? 'image/svg+xml' : 'application/json' });
        download(blob, `${name}${format === 'lottie' ? '.lottie' : ''}.${EXT[format]}`);
        setMessage(`Saved ${(blob.size / 1e6).toFixed(2)} MB.${kind === 'turn' ? ' A turning view changes every line in every frame, so this file is big; a video is smaller.' : ''}`);
      }
    } catch (e) {
      setMessage((e as Error).name === 'AbortError' ? 'Cancelled.' : `Couldn’t make it: ${(e as Error).message}`);
    } finally {
      setBusy(null);
      abort.current = null;
    }
  };

  const motionLabel = MOTIONS.find(m => m.value === kind)?.label ?? 'Loop';
  return (
    <div className="scrim" onPointerDown={e => e.target === e.currentTarget && !busy && onClose()} role="dialog" aria-modal aria-label="Export">
      <div className="dialog">
        <div className="preview">
          <div className="chk" ref={previewRef} style={{ aspectRatio: `${W} / ${H}`, width: `min(100%, ${W * 1.4}px)` }} />
        </div>
        <div className="opts">
          <h2>Export</h2>
          <div className="field-label">Picture</div>
          <Seg value={moving ? '' : format} options={[{ value: 'svg', label: 'SVG' }, { value: 'png', label: 'PNG' }]} onChange={v => setFormat(v as Format)} />
          <div className="field-label">Animation</div>
          <Seg
            value={moving ? format : ''}
            options={[
              { value: 'mp4', label: 'MP4' },
              { value: 'gif', label: 'GIF' },
              { value: 'asvg', label: 'SVG', title: 'Animated SVG' },
              { value: 'lottie', label: 'Lottie' },
            ]}
            onChange={v => setFormat(v as Format)}
          />
          <div className="note">{NOTES[format]}</div>
          {moving && (
            <div className="note">
              {kind === 'none' ? 'This figure is set to Still. Choose a motion under Animate first.' : `Plays its ${motionLabel.toLowerCase()} motion, ${motion.duration} s, looping.`}
            </div>
          )}
          {format === 'png' && (
            <>
              <div className="field-label">Size</div>
              <Seg value={scale} options={[{ value: '1', label: `${W}px` }, { value: '2', label: `${W * 2}px` }, { value: '4', label: `${W * 4}px` }]} onChange={setScale} />
            </>
          )}
          {format === 'mp4' && (
            <>
              <div className="field-label">Size</div>
              <Seg value={vsize} options={[{ value: '540', label: '540px' }, { value: '1080', label: '1080px' }, { value: '1620', label: '1620px' }]} onChange={setVsize} />
            </>
          )}
          {format === 'gif' && (
            <>
              <div className="field-label">Size</div>
              <Seg value={gsize} options={[{ value: '320', label: '320px' }, { value: '480', label: '480px' }, { value: '640', label: '640px' }]} onChange={setGsize} />
            </>
          )}
          {format !== 'mp4' && format !== 'gif' && (
            <Toggle on={background} onChange={setBackground}>
              Background
            </Toggle>
          )}
          {advanced && (format === 'svg' || format === 'asvg' || format === 'lottie') && (
            <Toggle on={clipHidden} onChange={setClipHidden}>
              Cut away hidden lines
            </Toggle>
          )}
          {advanced && format !== 'lottie' && (
            <Toggle on={shadows} onChange={setShadows}>
              Shadows
            </Toggle>
          )}
          <div className="field-label">File name</div>
          <TextField value={name} onChange={setName} />
          <div className="meta">
            {format === 'png'
              ? `${W * Number(scale)} × ${H * Number(scale)} px`
              : format === 'svg'
                ? `${W} × ${H} · ${(svg.length / 1024).toFixed(1)} KB`
                : format === 'mp4'
                  ? `${vsize} × ${vsize} px · 30 fps · ${motion.duration} s`
                  : format === 'gif'
                    ? `${gsize} × ${gsize} px · 20 fps · ${motion.duration} s`
                    : `${W} × ${H} · 24 fps · ${motion.duration} s`}
          </div>
          {busy ? (
            <>
              <div className="progress" aria-label={busy.what}>
                <div style={{ width: `${Math.round((100 * busy.done) / Math.max(1, busy.total))}%` }} />
              </div>
              <div className="note">
                {busy.what}… {Math.round((100 * busy.done) / Math.max(1, busy.total))}%
              </div>
              <button className="btn wide" onClick={() => abort.current?.abort()}>
                Cancel
              </button>
            </>
          ) : (
            <button className="btn primary wide" onClick={go} disabled={moving && kind === 'none'} data-testid="export-go">
              <IconDownload /> Download {format === 'asvg' ? 'animated SVG' : format === 'lottie' ? 'Lottie' : format.toUpperCase()}
            </button>
          )}
          {message && <div className="note" data-testid="export-message">{message}</div>}
          {format === 'svg' && !busy && (
            <button
              className="btn soft wide"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(svg);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1600);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? 'Copied' : 'Copy SVG code'}
            </button>
          )}
          <button className="btn wide" onClick={onClose} disabled={!!busy}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
