/* Thumbnails, made one at a time in the background so the page stays quick. */
import { useEffect, useState } from 'react';
import { renderScene } from '../engine/render';
import { toSvgString } from '../engine/svg';
import { libraryScene } from '../library';
import type { Scene } from '../model/types';

const byLibrary = new Map<string, string>();
const byScene = new WeakMap<Scene, string>();
const queue: (() => void)[] = [];
let busy = false;

function pump() {
  if (busy) return;
  const job = queue.shift();
  if (!job) return;
  busy = true;
  setTimeout(() => {
    try {
      job();
    } finally {
      busy = false;
      pump();
    }
  }, 0);
}

/* drawn small, so with lines heavier than the real thing to stay legible */
const toUrl = (sc: Scene, id: string) => {
  const heavy: Scene = { ...sc, theme: { ...sc.theme, lineWidth: sc.theme.lineWidth * 2.4 } };
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(toSvgString(renderScene(heavy), { background: true, idPrefix: `th-${id}` }))}`;
};

/** A library figure's thumbnail, once it has been drawn. */
export function useLibraryThumb(id: string): string | null {
  const [url, setUrl] = useState(() => byLibrary.get(id) ?? null);
  useEffect(() => {
    if (url) return;
    let live = true;
    queue.push(() => {
      let u = byLibrary.get(id);
      if (!u) {
        const sc = libraryScene(id);
        if (!sc) return;
        u = toUrl(sc, id);
        byLibrary.set(id, u);
      }
      if (live) setUrl(u);
    });
    pump();
    return () => {
      live = false;
    };
  }, [id, url]);
  return url;
}

/** A thumbnail of one of your figures, redrawn a moment after it changes. */
export function useSceneThumb(sc: Scene): string | null {
  const [url, setUrl] = useState(() => byScene.get(sc) ?? null);
  useEffect(() => {
    const have = byScene.get(sc);
    if (have) {
      setUrl(have);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      queue.push(() => {
        const u = toUrl(sc, sc.id);
        byScene.set(sc, u);
        if (live) setUrl(u);
      });
      pump();
    }, 250);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [sc]);
  return url;
}
