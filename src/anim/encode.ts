/* Encoders: a looping animation as an MP4 (WebM where the browser can't make
   MP4) or an animated GIF, plus the small chores around exporting: SVG text to
   an image, saving a file, copying a PNG.

   Every encoder works frame by frame — draw, encode, let go — so memory stays
   flat however long the loop is. The muxers and the GIF encoder load on first
   use, so they stay out of the main bundle. */

/** Something that can draw frame i (0-based) of a loop onto a canvas. */
export interface FrameSource {
  /** pixels (even numbers; video rounds an odd side up) */
  width: number;
  height: number;
  fps: number;
  frames: number;
  /** draw frame i onto ctx (already sized width×height, cleared) */
  draw: (i: number, ctx: CanvasRenderingContext2D) => Promise<void> | void;
}

export interface EncodeOptions {
  onProgress?: (done: number, total: number) => void;
  signal?: AbortSignal;
}

type VideoKind = 'mp4' | 'webm';

const NO_MP4 = "This browser can't make MP4 files, so this is a WebM. Chrome, Edge and Safari make MP4.";
const RECORDED = 'This browser recorded the video in real time, so the timing may be a little uneven.';

/* ---------- Numbers (pure, so they're tested in Node) ---------- */

/** Video needs even sides: 4:2:0 colour is stored once per 2×2 block of pixels. */
export const evenUp = (n: number) => Math.max(2, 2 * Math.ceil(Math.ceil(n) / 2));

/** When frame i starts, in whole microseconds. Rounded from i·10⁶/fps each time, so it never drifts. */
export const frameTime = (i: number, fps: number) => Math.round((i * 1e6) / fps);

/** A keyframe about every two seconds: often enough to seek, rare enough to stay small. */
export const keyInterval = (fps: number) => Math.max(1, Math.round(fps * 2));

/** About 6 Mbps for 1600×900 at 30 fps, in proportion to the pixels and gently to the frame rate
    (more frames means smaller changes between them). Line drawings on flat grounds need little. */
export function defaultBitrate(width: number, height: number, fps: number): number {
  const b = 6e6 * ((width * height) / (1600 * 900)) * Math.sqrt(fps / 30);
  return Math.round(Math.min(25e6, Math.max(5e5, b)) / 1000) * 1000;
}

/** H.264 levels (spec table A-1): level_idc, macroblocks per second, macroblocks per frame, kbps. */
const AVC_LEVELS: readonly (readonly [number, number, number, number])[] = [
  [30, 40500, 1620, 10000],
  [31, 108000, 3600, 14000],
  [32, 216000, 5120, 20000],
  [40, 245760, 8192, 20000],
  [41, 245760, 8192, 50000],
  [42, 522240, 8704, 50000],
  [50, 589824, 22080, 135000],
  [51, 983040, 36864, 240000],
  [52, 2073600, 36864, 240000],
  [60, 4177920, 139264, 240000],
  [61, 8355840, 139264, 480000],
  [62, 16711680, 139264, 800000],
];

/** The lowest H.264 level (level_idc, e.g. 40 for 4.0) that fits this size, rate and bitrate. Players
    check the level before they try, so it should be honest; 3.0 is the floor every device plays. */
export function avcLevel(width: number, height: number, fps: number, bitrate: number, high = true): number | null {
  const mbw = Math.ceil(width / 16);
  const mbh = Math.ceil(height / 16);
  const fs = mbw * mbh;
  const kbps = bitrate / 1000 / (high ? 1.25 : 1);
  for (const [idc, mbps, maxFs, maxBr] of AVC_LEVELS) {
    const side = Math.sqrt(8 * maxFs);
    if (fs <= maxFs && mbw <= side && mbh <= side && fs * fps <= mbps && kbps <= maxBr) return idc;
  }
  return null;
}

/** H.264 codec strings to try, best first: High, Main, then Baseline, each at the lowest level that fits. */
export function avcCodecs(width: number, height: number, fps: number, bitrate: number): string[] {
  const profiles: [string, boolean][] = [['6400', true], ['4d00', false], ['42e0', false], ['4200', false]];
  return profiles.flatMap(([p, high]) => {
    const lv = avcLevel(width, height, fps, bitrate, high);
    return lv === null ? [] : [`avc1.${p}${lv.toString(16).padStart(2, '0')}`];
  });
}

/** How long each GIF frame shows, in hundredths of a second. GIF can't say 3⅓, so the delays are
    rounded from the running total (3, 3, 4, 3, 3, 4 … at 30 fps) and the loop keeps its true length;
    a rate that divides 100 (20, 25, 50 fps) gets even delays. Browsers slow anything under 2 to 10,
    so 2 is the floor. */
export function gifDelays(frames: number, fps: number): number[] {
  const at = (i: number) => Math.round((i * 100) / fps);
  return Array.from({ length: frames }, (_, i) => Math.max(2, at(i + 1) - at(i)));
}

/** A plain length in px (or no unit), or null for %, em, cm …. */
const plainLength = (v: string | undefined) => (v && /^\s*[\d.]+(px)?\s*$/i.test(v) ? parseFloat(v) : null);

/** The SVG with its root sized width×height. Some browsers rasterize an SVG image at its own size
    and then scale the bitmap, which blurs; sized up front it's drawn sharp. A root without a
    viewBox gets one from its old size, so the drawing scales instead of being cropped. */
export function sizeSvg(svg: string, width: number, height: number): string {
  const m = /<svg\b[^>]*>/i.exec(svg);
  if (!m) return svg;
  let tag = m[0];
  const find = (name: string) => new RegExp(`(\\s${name}\\s*=\\s*)("[^"]*"|'[^']*')`, 'i');
  const get = (name: string) => find(name).exec(tag)?.[2]?.slice(1, -1);
  const set = (name: string, value: string) => {
    tag = find(name).test(tag) ? tag.replace(find(name), `$1"${value}"`) : tag.replace(/^<svg\b/i, `$& ${name}="${value}"`);
  };
  if (get('viewBox') === undefined) {
    const w0 = plainLength(get('width'));
    const h0 = plainLength(get('height'));
    if (w0 && h0) set('viewBox', `0 0 ${w0} ${h0}`);
  }
  set('width', String(width));
  set('height', String(height));
  return svg.slice(0, m.index) + tag + svg.slice(m.index + m[0].length);
}

/* ---------- Plumbing ---------- */

const abortError = () => new DOMException('The export was cancelled.', 'AbortError');
const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

function checkAbort(signal: AbortSignal | undefined) {
  if (signal?.aborted) throw abortError();
}

/** An encoder (not the drawing) failed, so another codec may still work. */
class EncoderFailure extends Error {
  constructor(cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause), { cause });
    this.name = 'EncoderFailure';
  }
}

function checkSource(src: FrameSource) {
  if (!(src.fps > 0) || !(src.frames >= 1) || !(src.width >= 1) || !(src.height >= 1)) {
    throw new RangeError(`Can't encode ${src.frames} frames of ${src.width}×${src.height} at ${src.fps} fps.`);
  }
}

/** Let the page handle input and paint between frames. Not setTimeout: background tabs
    hold that back to once a second, which would stall a long export. */
function yieldToPage(): Promise<void> {
  const s = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler;
  if (s?.yield) return s.yield();
  return new Promise(res => {
    const ch = new MessageChannel();
    ch.port1.onmessage = () => {
      ch.port1.close();
      res();
    };
    ch.port2.postMessage(null);
  });
}

const sleepUntil = (t: number) => new Promise<void>(res => setTimeout(res, Math.max(0, t - performance.now())));

/** An opaque canvas: video and GIF have no transparency, so anything left clear comes out black. */
function canvas2d(width: number, height: number, settings: CanvasRenderingContext2DSettings = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false, ...settings });
  if (!ctx) throw new Error("This browser couldn't make a canvas to draw on.");
  return ctx;
}

/** Draw frame i on the cleared canvas. If the canvas is wider or taller than the source (video rounds
    odd sides up), the last column and row are repeated into the spare pixels rather than left black. */
async function paint(src: FrameSource, i: number, ctx: CanvasRenderingContext2D) {
  const { width: W, height: H } = ctx.canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  try {
    await src.draw(i, ctx);
  } finally {
    ctx.restore();
  }
  const w = Math.ceil(src.width);
  const h = Math.ceil(src.height);
  if (W > w) ctx.drawImage(ctx.canvas, w - 1, 0, 1, H, w, 0, W - w, H);
  if (H > h) ctx.drawImage(ctx.canvas, 0, h - 1, W, 1, 0, h, W, H - h);
}

/* ---------- Video ---------- */

interface VideoPlan {
  kind: VideoKind;
  config: VideoEncoderConfig;
}

/** Frames go to the encoder as pixels marked BT.709, limited range. Handed the canvas itself, Chrome
    writes full-range video with the sRGB curve: valid, but players and upload transcoders that ignore
    the range flag show it with the wrong contrast. This makes the yuv420p every player expects. */
const BT709: VideoColorSpaceInit = { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709', fullRange: false };

/** Every WebCodecs setup this browser says it can do, best first: H.264 for MP4, then VP9 and VP8 for WebM. */
async function videoPlans(width: number, height: number, fps: number, bitrate: number): Promise<VideoPlan[]> {
  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') return [];
  const base = { width, height, bitrate, framerate: fps, latencyMode: 'quality' } as const;
  const plans: VideoPlan[] = [
    ...avcCodecs(width, height, fps, bitrate).map((codec): VideoPlan => ({ kind: 'mp4', config: { ...base, codec, avc: { format: 'avc' } } })),
    ...['vp09.00.10.08', 'vp8'].map((codec): VideoPlan => ({ kind: 'webm', config: { ...base, codec } })),
  ];
  const ok = await Promise.all(
    plans.map(p =>
      VideoEncoder.isConfigSupported(p.config).then(
        r => r.supported === true,
        () => false,
      ),
    ),
  );
  return plans.filter((_, i) => ok[i]);
}

/** What MediaRecorder can record a canvas as, MP4 first; null when it can't. */
function recorderType(): string | null {
  if (typeof MediaRecorder === 'undefined' || typeof HTMLCanvasElement === 'undefined') return null;
  if (!('captureStream' in HTMLCanvasElement.prototype)) return null;
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find(t => MediaRecorder.isTypeSupported(t)) ?? null;
}

const supportCache = new Map<string, Promise<VideoKind | null>>();

/** Can this browser make an MP4? ('mp4' | 'webm' | null) — cached per size. */
export function videoSupport(width = 1600, height = 900): Promise<VideoKind | null> {
  const w = evenUp(width);
  const h = evenUp(height);
  const key = `${w}x${h}`;
  let hit = supportCache.get(key);
  if (!hit) {
    hit = videoPlans(w, h, 30, defaultBitrate(w, h, 30)).then(plans => {
      const kind = plans[0]?.kind;
      if (kind) return kind;
      const rec = recorderType();
      return rec ? (rec.startsWith('video/mp4') ? 'mp4' : 'webm') : null;
    });
    supportCache.set(key, hit);
  }
  return hit;
}

/** Where encoded chunks go: an MP4 or WebM file kept in memory until the end. */
interface Mux {
  add: (chunk: EncodedVideoChunk, meta?: EncodedVideoChunkMetadata) => void;
  finish: () => Blob;
}

async function openMux(kind: VideoKind, codec: string, width: number, height: number, fps: number): Promise<Mux> {
  // An integer rate becomes the file's timescale, so every frame lasts exactly one tick.
  const frameRate = Number.isInteger(fps) ? fps : undefined;
  if (kind === 'mp4') {
    const { Muxer, ArrayBufferTarget } = await import('mp4-muxer');
    const muxer = new Muxer({ target: new ArrayBufferTarget(), fastStart: 'in-memory', video: { codec: 'avc', width, height, frameRate } });
    return {
      add: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      finish: () => {
        muxer.finalize();
        return new Blob([muxer.target.buffer], { type: 'video/mp4' });
      },
    };
  }
  const { Muxer, ArrayBufferTarget } = await import('webm-muxer');
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: codec === 'vp8' ? 'V_VP8' : 'V_VP9', width, height, frameRate } });
  let end = 0;
  return {
    add: (chunk, meta) => {
      end = Math.max(end, chunk.timestamp + (chunk.duration ?? 0));
      muxer.addVideoChunk(chunk, meta);
    },
    finish: () => {
      muxer.finalize();
      fixWebmDuration(muxer.target.buffer, end / 1000);
      return new Blob([muxer.target.buffer], { type: 'video/webm' });
    },
  };
}

/** webm-muxer records the file's length as the last frame's start, so a looping player skips that
    frame. Its Duration (element 0x4489, an 8-byte float in ms near the top) is set to the real end,
    but only if what's there is within a frame or two of it, so nothing else can be hit by mistake. */
export function fixWebmDuration(buf: ArrayBuffer, ms: number): boolean {
  const b = new Uint8Array(buf);
  const view = new DataView(buf);
  for (let i = 0; i + 11 <= Math.min(b.length, 4096); i++) {
    if (b[i] !== 0x44 || b[i + 1] !== 0x89 || b[i + 2] !== 0x88) continue;
    const old = view.getFloat64(i + 3);
    if (!(old <= ms && old >= ms - 200)) continue;
    view.setFloat64(i + 3, ms);
    return true;
  }
  return false;
}

/** Wait while the encoder has more than `max` frames queued, so frames don't pile up in memory. */
async function drain(encoder: VideoEncoder, max: number, signal: AbortSignal | undefined) {
  while (encoder.state === 'configured' && encoder.encodeQueueSize > max) {
    await new Promise<void>(res => {
      const done = () => {
        encoder.removeEventListener('dequeue', done);
        clearTimeout(timer);
        res();
      };
      encoder.addEventListener('dequeue', done);
      const timer = setTimeout(done, 50); // older browsers have no dequeue event
    });
    checkAbort(signal);
  }
}

async function encodeWith(plan: VideoPlan, src: FrameSource, opts: EncodeOptions): Promise<Blob> {
  const { signal, onProgress } = opts;
  const { width, height, codec } = plan.config;
  const { fps, frames } = src;
  const mux = await openMux(plan.kind, codec, width, height, fps);
  let failure: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      try {
        mux.add(chunk, meta);
      } catch (e) {
        failure ??= e;
      }
    },
    error: e => {
      failure ??= e;
    },
  });
  /** Run an encoder call, marking anything it throws as the encoder's fault. */
  const enc = <T>(f: () => T): T => {
    try {
      return f();
    } catch (e) {
      throw new EncoderFailure(e);
    }
  };
  const ctx = canvas2d(width, height, { willReadFrequently: true });
  const key = keyInterval(fps);
  try {
    enc(() => encoder.configure(plan.config));
    for (let i = 0; i < frames; i++) {
      checkAbort(signal);
      if (failure) throw new EncoderFailure(failure);
      await paint(src, i, ctx);
      checkAbort(signal);
      const timestamp = frameTime(i, fps);
      const pixels = ctx.getImageData(0, 0, width, height).data;
      const frame = new VideoFrame(pixels, {
        format: 'RGBX',
        codedWidth: width,
        codedHeight: height,
        timestamp,
        duration: frameTime(i + 1, fps) - timestamp,
        colorSpace: BT709,
      });
      try {
        enc(() => encoder.encode(frame, { keyFrame: i % key === 0 }));
      } finally {
        frame.close(); // the encoder keeps its own reference
      }
      onProgress?.(i + 1, frames);
      await drain(encoder, 3, signal);
    }
    await encoder.flush().catch((e: unknown) => {
      throw new EncoderFailure(failure ?? e);
    });
    if (failure) throw new EncoderFailure(failure);
    return mux.finish();
  } finally {
    if (encoder.state !== 'closed') encoder.close();
  }
}

/** The last resort, for browsers without WebCodecs: play the frames onto a canvas in real time and
    let MediaRecorder film it. Each frame is drawn off-screen first, then shown on its beat. */
async function record(src: FrameSource, type: string, bitrate: number, opts: EncodeOptions) {
  const { signal, onProgress } = opts;
  const width = evenUp(src.width);
  const height = evenUp(src.height);
  const screen = canvas2d(width, height);
  const buffer = canvas2d(width, height);
  const stream = screen.canvas.captureStream(0);
  const track = stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
  if (!track) throw new Error("This browser can't make videos. Chrome, Edge and Safari can.");
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: bitrate });
  const parts: Blob[] = [];
  rec.ondataavailable = e => {
    if (e.data.size) parts.push(e.data);
  };
  const stopped = new Promise<void>((res, rej) => {
    rec.onstop = () => res();
    rec.onerror = e => rej(new Error(`The recording failed: ${String((e as ErrorEvent).error ?? e.type)}`));
  });
  const beat = 1000 / src.fps;
  let t0 = 0;
  try {
    for (let i = 0; i < src.frames; i++) {
      checkAbort(signal);
      await paint(src, i, buffer);
      if (i === 0) {
        rec.start();
        t0 = performance.now();
      } else await sleepUntil(t0 + i * beat);
      checkAbort(signal);
      screen.drawImage(buffer.canvas, 0, 0);
      track.requestFrame();
      onProgress?.(i + 1, src.frames);
    }
    await sleepUntil(t0 + src.frames * beat); // hold the last frame for its full time
    rec.stop();
    await stopped;
  } finally {
    if (rec.state !== 'inactive') rec.stop();
    stream.getTracks().forEach(t => t.stop());
  }
  return new Blob(parts, { type: rec.mimeType || type });
}

/** MP4 (H.264) when the browser can encode it, else WebM (VP9/VP8); says which. */
export async function encodeVideo(
  src: FrameSource,
  opts: EncodeOptions & { bitrate?: number } = {},
): Promise<{ blob: Blob; ext: VideoKind; note?: string }> {
  checkSource(src);
  checkAbort(opts.signal);
  const width = evenUp(src.width);
  const height = evenUp(src.height);
  const bitrate = Math.round(opts.bitrate ?? defaultBitrate(width, height, src.fps));
  const plans = await videoPlans(width, height, src.fps, bitrate);
  let lastError: unknown = null;
  for (const plan of plans) {
    try {
      const blob = await encodeWith(plan, src, opts);
      return plan.kind === 'mp4' ? { blob, ext: 'mp4' } : { blob, ext: 'webm', note: NO_MP4 };
    } catch (e) {
      if (isAbort(e) || opts.signal?.aborted) throw abortError();
      if (!(e instanceof EncoderFailure)) throw e;
      lastError = e.cause; // this encoder broke: start again with the next one
    }
  }
  if (lastError) throw lastError;
  const type = recorderType();
  if (!type) throw new Error("This browser can't make videos. Chrome, Edge and Safari can.");
  try {
    const blob = await record(src, type, bitrate, opts);
    return type.startsWith('video/mp4') ? { blob, ext: 'mp4', note: RECORDED } : { blob, ext: 'webm', note: `${NO_MP4} ${RECORDED}` };
  } catch (e) {
    if (isAbort(e) || opts.signal?.aborted) throw abortError();
    throw e;
  }
}

/* ---------- GIF ---------- */

type GifFormat = 'rgb565' | 'rgb444' | 'rgba4444';
type Palette = number[][];
interface GifStream {
  writeFrame: (index: Uint8Array, width: number, height: number, opts?: { palette?: Palette; delay?: number; repeat?: number; colorDepth?: number }) => void;
  finish: () => void;
  bytesView: () => Uint8Array<ArrayBuffer>;
}
/** The parts of gifenc we use (it ships no types). */
interface Gifenc {
  GIFEncoder: (opts?: { initialCapacity?: number }) => GifStream;
  quantize: (rgba: Uint8Array | Uint8ClampedArray, maxColors: number, opts?: { format?: GifFormat }) => Palette;
  applyPalette: (rgba: Uint8Array | Uint8ClampedArray, palette: Palette, format?: GifFormat) => Uint8Array;
}

/** Frames the palette is built from, and how many pixels from them at most: enough to catch
    every colour of a few-colour figure, few enough to quantize in a blink. */
const PALETTE_FRAMES = 8;
const PALETTE_PIXELS = 1 << 21;

/** An animated GIF that loops forever. */
export async function encodeGif(src: FrameSource, opts: EncodeOptions & { maxColors?: number } = {}): Promise<Blob> {
  checkSource(src);
  const { signal, onProgress } = opts;
  checkAbort(signal);
  // @ts-expect-error gifenc ships no types; Gifenc above describes what we use.
  const { GIFEncoder, quantize, applyPalette } = (await import('gifenc')) as Gifenc;
  const width = Math.ceil(src.width);
  const height = Math.ceil(src.height);
  const { frames } = src;
  const ctx = canvas2d(width, height, { willReadFrequently: true });
  const read = () => ctx.getImageData(0, 0, width, height).data;

  // One palette for the whole loop, from a few frames spread across it.
  const picks = [...new Set(Array.from({ length: Math.min(frames, PALETTE_FRAMES) }, (_, k) => Math.floor((k * frames) / Math.min(frames, PALETTE_FRAMES))))];
  const stride = Math.max(1, Math.ceil((picks.length * width * height) / PALETTE_PIXELS));
  const perFrame = Math.ceil((width * height) / stride);
  const sample = new Uint8Array(perFrame * picks.length * 4);
  for (const [k, i] of picks.entries()) {
    checkAbort(signal);
    await paint(src, i, ctx);
    const data = read();
    for (let p = 0, o = k * perFrame * 4; p < width * height; p += stride, o += 4) sample.set(data.subarray(p * 4, p * 4 + 4), o);
    await yieldToPage();
  }
  const palette = quantize(sample, Math.round(Math.min(256, Math.max(2, opts.maxColors ?? 256))), { format: 'rgb565' });

  const gif = GIFEncoder({ initialCapacity: width * height });
  const delays = gifDelays(frames, src.fps);
  for (let i = 0; i < frames; i++) {
    checkAbort(signal);
    await paint(src, i, ctx);
    const index = applyPalette(read(), palette, 'rgb565');
    // The palette goes in once, as the global table; repeat 0 means loop forever.
    gif.writeFrame(index, width, height, { palette: i === 0 ? palette : undefined, delay: (delays[i] ?? 2) * 10, repeat: 0 });
    onProgress?.(i + 1, frames);
    await yieldToPage();
  }
  checkAbort(signal);
  gif.finish();
  return new Blob([gif.bytesView()], { type: 'image/gif' });
}

/* ---------- Images, files, clipboard ---------- */

/** Load SVG text as an image ready for ctx.drawImage, at width×height. */
export async function svgImage(svg: string, width: number, height: number): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([sizeSvg(svg, width, height)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image(width, height);
    img.decoding = 'async';
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("The SVG couldn't be loaded as an image."));
      img.src = url;
    });
    // Loaded isn't always decoded; this makes the first drawImage instant. Some browsers refuse
    // decode() for SVG, which is harmless once it has loaded.
    await img.decode().catch(() => undefined);
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Save a blob as a file. */
export function download(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // The download starts after click() returns; a big file in a slow browser needs the URL a while.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Put a PNG on the clipboard; false if the browser won't. Call it straight from a click: browsers
    only allow it during a user gesture. Safari also drops the gesture across an await, so there
    pass the promise (copyImage(canvasPng(c))) rather than awaiting the PNG first. */
export async function copyImage(png: Blob | Promise<Blob>): Promise<boolean> {
  try {
    if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) return false;
    const supports = (ClipboardItem as { supports?: (type: string) => boolean }).supports;
    if (supports && !supports.call(ClipboardItem, 'image/png')) return false;
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]);
    return true;
  } catch {
    return false;
  }
}

/** A canvas → PNG blob. */
export function canvasPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((res, rej) => canvas.toBlob(b => (b ? res(b) : rej(new Error("The canvas couldn't be saved as a PNG."))), 'image/png'));
}
