/* Pictures people add to posts (analytics screenshots, photos), kept in this
   browser's IndexedDB: they are too big for the thread's saved text. A post
   keeps only the picture's id, its size and how it is cropped. Where
   IndexedDB is blocked (some private windows), pictures live for the tab. */

export interface PostImage {
  id: string;
  /** pixels */
  w: number;
  h: number;
  /** file name, shown in the editor */
  name: string;
  /** 1 shows the whole picture; more zooms in */
  zoom: number;
  /** the point that stays in view when zoomed, 0–1 across and down */
  fx: number;
  fy: number;
}

const DB = 'strike-figures';
const STORE = 'images';
/* the longest side a picture is kept at: sharp on a 1600 px card at 2×, small enough to store */
const MAX_SIDE = 3200;

const memory = new Map<string, Blob>();
let dbp: Promise<IDBDatabase | null> | null = null;

function db(): Promise<IDBDatabase | null> {
  dbp ??= new Promise(res => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => res(req.result);
      req.onerror = () => res(null);
      req.onblocked = () => res(null);
    } catch {
      res(null);
    }
  });
  return dbp;
}

async function put(id: string, blob: Blob) {
  memory.set(id, blob);
  const d = await db();
  if (!d) return;
  await new Promise<void>(res => {
    try {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(blob, id);
      tx.oncomplete = () => res();
      tx.onerror = () => res();
      tx.onabort = () => res();
    } catch {
      res();
    }
  });
}

async function get(id: string): Promise<Blob | null> {
  const hit = memory.get(id);
  if (hit) return hit;
  const d = await db();
  if (!d) return null;
  return new Promise(res => {
    try {
      const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => res((req.result as Blob | undefined) ?? null);
      req.onerror = () => res(null);
    } catch {
      res(null);
    }
  });
}

const uid = () => `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function decode(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  return new Promise((res, rej) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => res(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error("That file isn't a picture this browser can open. Use a PNG or JPG."));
    };
    img.src = url;
  });
}

export const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif';

/** Keep a picture someone chose: scaled down if huge, stored, and described for the post. */
export async function addImage(file: File): Promise<PostImage> {
  if (!/^image\//.test(file.type)) throw new Error("That file isn't a picture. Use a PNG or JPG.");
  const img = await decode(file);
  let blob: Blob = file;
  let w = img.naturalWidth;
  let h = img.naturalHeight;
  if (!w || !h) throw new Error("That picture couldn't be read.");
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  if (k < 1 || file.size > 8 * 1024 * 1024) {
    w = Math.round(w * k);
    h = Math.round(h * k);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')!.drawImage(img, 0, 0, w, h);
    blob = await new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("The picture couldn't be resized."))), file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92));
  }
  const id = uid();
  await put(id, blob);
  loaded.set(id, decode(blob));
  return { id, w, h, name: file.name, zoom: 1, fx: 0.5, fy: 0.5 };
}

const loaded = new Map<string, Promise<HTMLImageElement>>();

/** A post's picture, ready to draw, or null if it is gone (another browser, or cleared storage). */
export function imageOf(id: string): Promise<HTMLImageElement | null> {
  let p = loaded.get(id);
  if (!p) {
    p = get(id).then(b => {
      if (!b) throw new Error('missing');
      return decode(b);
    });
    loaded.set(id, p);
  }
  return p.catch(() => {
    loaded.delete(id);
    return null;
  });
}

/** Where to draw a picture of `w`×`h` px so it covers `box`, zoomed and centered on its focal point. */
export function coverRect(box: { x: number; y: number; w: number; h: number }, im: Pick<PostImage, 'w' | 'h' | 'zoom' | 'fx' | 'fy'>) {
  const k = Math.max(box.w / im.w, box.h / im.h) * Math.max(1, im.zoom);
  const w = im.w * k;
  const h = im.h * k;
  /* the focal point at the box's center, but never past an edge */
  const x = Math.min(box.x, Math.max(box.x + box.w - w, box.x + box.w / 2 - im.fx * w));
  const y = Math.min(box.y, Math.max(box.y + box.h - h, box.y + box.h / 2 - im.fy * h));
  return { x, y, w, h };
}
