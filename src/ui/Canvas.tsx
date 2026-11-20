/* The stage: the open figure on its artboard. Drag empty space to turn the
   camera, drag an object to slide it along the ground (Shift lifts it),
   Alt-click a face to paint it, right-drag or Space-drag to pan, and scroll
   to zoom. Clicking empty space clears the selection. */
import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { renderScene } from '../engine/render';
import { motionOf, sceneAt } from '../anim/motion';
import { buildSvg } from '../engine/svg';
import { DEG, type P2 } from '../engine/math';
import { useStore } from '../model/store';
import type { Camera } from '../model/types';
import { fitCamera, pick, toReact, VIEWS } from './view';
import { IconFit } from './icons';

type Drag =
  | { mode: 'orbit' | 'pan'; x0: number; y0: number; cam: Camera; moved: boolean; key: string }
  | { mode: 'move' | 'lift'; x0: number; y0: number; cam: Camera; moved: boolean; key: string; id: string; pos: [number, number, number] };

let drags = 0;

export function Canvas() {
  const scene = useStore(s => s.scene());
  const advanced = useStore(s => s.advanced);
  const selection = useStore(s => s.selection);
  const notice = useStore(s => s.notice);
  const update = useStore(s => s.update);
  const select = useStore(s => s.select);
  const wrap = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [box, setBox] = useState({ w: 900, h: 640 });
  const [hover, setHover] = useState<{ id: string; face: string | null; alt: boolean } | null>(null);
  const drag = useRef<Drag | null>(null);
  const clicked = useRef<string | null>(null);
  const space = useRef(false);

  const playing = useStore(s => s.playing);
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!playing) {
      setT(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const secs = motionOf(useStore.getState().scene()).duration;
      setT((((now - start) / 1000) % secs) / secs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const model = useMemo(() => renderScene(playing ? sceneAt(scene, t) : scene), [scene, playing, t]);
  const art = useMemo(() => (buildSvg(model, { tagLayers: true, idPrefix: 'stage', background: true }).children ?? []).map((c, i) => toReact(c, i)), [model]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement)) space.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') space.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const { width: W, height: H } = scene.artboard;
  const scale = Math.max(0.05, Math.min((box.w - 96) / W, (box.h - 120) / H, 6));
  const left = (box.w - W * scale) / 2;
  const top = (box.h - H * scale) / 2 - 10;

  const toArt = (e: { clientX: number; clientY: number }): P2 => {
    const r = wrap.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left - left) / scale, y: (e.clientY - r.top - top) / scale };
  };
  const locked = (id: string) => !!scene.objects.find(o => o.id === id)?.locked;

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const cam = { ...scene.camera };
    const key = `drag-${++drags}`;
    if (e.button === 1 || e.button === 2 || space.current) {
      drag.current = { mode: 'pan', x0: e.clientX, y0: e.clientY, cam, moved: false, key };
      return;
    }
    const hit = pick(model, toArt(e), locked);
    if (hit && advanced) {
      if (e.altKey) {
        select(hit.objectId, hit.face);
        drag.current = null;
        return;
      }
      if (selection.objectId !== hit.objectId || selection.face) select(hit.objectId, null);
      const o = scene.objects.find(x => x.id === hit.objectId)!;
      drag.current = { mode: e.shiftKey ? 'lift' : 'move', x0: e.clientX, y0: e.clientY, cam, moved: false, key, id: o.id, pos: [...o.position] };
      return;
    }
    /* in the simple mode every drag turns the view; a click picks the shape under it */
    clicked.current = hit?.objectId ?? null;
    drag.current = { mode: 'orbit', x0: e.clientX, y0: e.clientY, cam, moved: false, key };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) {
      const hit = pick(model, toArt(e), locked);
      setHover(hit ? { id: hit.objectId, face: hit.face, alt: e.altKey } : null);
      return;
    }
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.hypot(dx, dy) < 3) return;
    d.moved = true;
    if (d.mode === 'orbit') {
      let yaw = d.cam.yaw - dx * 0.4;
      let pitch = Math.max(-90, Math.min(90, d.cam.pitch + dy * 0.3));
      if (e.shiftKey) {
        yaw = Math.round(yaw / 15) * 15;
        pitch = Math.round(pitch / 15) * 15;
      }
      yaw = ((yaw % 360) + 540) % 360 - 180;
      update(s => {
        s.camera.yaw = yaw;
        s.camera.pitch = pitch;
      }, d.key);
    } else if (d.mode === 'pan') {
      update(s => {
        s.camera.panX = d.cam.panX + dx / scale;
        s.camera.panY = d.cam.panY + dy / scale;
      }, d.key);
    } else if (d.mode === 'move') {
      const ax = dx / scale;
      const ay = dy / scale;
      const ps = Math.sin(d.cam.yaw * DEG);
      const pc = Math.cos(d.cam.yaw * DEG);
      const ts = Math.sin(d.cam.pitch * DEG);
      const z = d.cam.zoom;
      let wx: number;
      let wz: number;
      if (Math.abs(ts) < 0.08) {
        wx = (ax / z) * pc;
        wz = (-ax / z) * ps;
      } else {
        wx = (pc * ts * ax + ps * ay) / (z * ts);
        wz = (-ps * ts * ax + pc * ay) / (z * ts);
      }
      const snap = (v: number) => (e.altKey ? Math.round(v * 10) / 10 : Math.round(v));
      update(s => {
        const o = s.objects.find(x => x.id === d.id);
        if (o) o.position = [snap(d.pos[0] + wx), d.pos[1], snap(d.pos[2] + wz)];
      }, d.key);
    } else if (d.mode === 'lift') {
      const tc = Math.cos(d.cam.pitch * DEG);
      if (Math.abs(tc) < 0.05) return;
      const wy = -dy / scale / (d.cam.zoom * tc);
      update(s => {
        const o = s.objects.find(x => x.id === d.id);
        if (o) o.position = [d.pos[0], e.altKey ? Math.round((d.pos[1] + wy) * 10) / 10 : Math.round(d.pos[1] + wy), d.pos[2]];
      }, d.key);
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (d && d.mode === 'orbit' && !d.moved) select(clicked.current);
    clicked.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const p = toArt(e);
    const cam = scene.camera;
    const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015));
    const zoom = Math.max(0.02, Math.min(80, cam.zoom * k));
    const kk = zoom / cam.zoom;
    const o = { x: W / 2 + cam.panX, y: H / 2 + cam.panY };
    update(s => {
      s.camera.zoom = zoom;
      s.camera.panX = p.x - (p.x - o.x) * kk - W / 2;
      s.camera.panY = p.y - (p.y - o.y) * kk - H / 2;
    }, 'wheel');
  };

  /* selection and hover outlines, drawn over the art and never exported */
  const overlay = useMemo(() => {
    const out: ReactElement[] = [];
    const sel = selection.objectId;
    for (const l of model.layers) {
      const isSel = l.objectId === sel;
      const isHover = hover && l.objectId === hover.id && !isSel;
      if (isSel || isHover) {
        out.push(
          <polygon
            key={`h-${l.key}`}
            points={l.hull.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#10B981"
            strokeOpacity={isSel ? 0.9 : 0.4}
            strokeWidth={1}
            strokeDasharray={isSel ? '4 3' : undefined}
            vectorEffect="non-scaling-stroke"
          />,
        );
      }
      const faceKey = isSel && selection.face ? selection.face : hover && hover.alt && l.objectId === hover.id ? hover.face : null;
      if (faceKey) {
        for (const f of l.faces) {
          const match = f.key === faceKey || (faceKey === 'all' && f.key !== 'top' && f.key !== 'bottom');
          if (!match) continue;
          out.push(
            <polygon
              key={`f-${l.key}-${f.key}`}
              points={f.poly.map(p => `${p.x},${p.y}`).join(' ')}
              fill="#10B981"
              fillOpacity={0.16}
              stroke="#34D399"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />,
          );
        }
      }
    }
    return out;
  }, [model, selection, hover]);

  const view = VIEWS.find(v => Math.abs(v.yaw - scene.camera.yaw) < 0.01 && Math.abs(v.pitch - scene.camera.pitch) < 0.01);
  const setView = (yaw: number, pitch: number) =>
    update(s => {
      s.camera.yaw = yaw;
      s.camera.pitch = pitch;
    });
  const fit = () => {
    const cam = fitCamera(scene, model);
    if (cam) update(s => void (s.camera = cam));
  };

  return (
    <div
      className="stage card"
      ref={wrap}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={() => !drag.current && setHover(null)}
      onWheel={onWheel}
      onContextMenu={e => e.preventDefault()}
      style={{ cursor: advanced && hover ? 'move' : hover ? 'pointer' : 'grab' }}
      data-testid="stage"
    >
      <div className="caption" style={{ left, top: top - 22 }}>
        {scene.label} <span style={{ opacity: 0.6 }}>· {scene.name}</span>
      </div>
      <div className="frame" style={{ left, top, width: W * scale, height: H * scale }} />
      <svg ref={svgRef} className="art" style={{ left, top, width: W * scale, height: H * scale }} viewBox={`0 0 ${W} ${H}`} data-testid="art">
        {art}
        <g>{overlay}</g>
      </svg>
      {notice && <div className="notice">{notice}</div>}
      <div className="hud">
        <div className="seg" onPointerDown={e => e.stopPropagation()}>
          {VIEWS.filter(v => advanced || v.id !== 'side').map(v => (
            <button key={v.id} className={view?.id === v.id ? 'on' : ''} onClick={() => setView(v.yaw, v.pitch)} title={`${v.label} view (${v.key})`}>
              {v.id === 'linear' ? 'Standard' : v.label.charAt(0) + v.label.slice(1).toLowerCase()}
            </button>
          ))}
          <button onClick={fit} title="Fit the figure to its frame (F)">
            <IconFit /> Fit
          </button>
        </div>
        <div className="seg" onPointerDown={e => e.stopPropagation()}>
          <button className={playing ? 'on' : ''} onClick={() => useStore.getState().setPlaying(!playing)} title="Play the figure's animation (P)" data-testid="hud-play">
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
        <span className="hint">
          {advanced
            ? 'Drag empty space to turn · Drag a shape to move it (Shift lifts) · Alt-click a face to paint it · Right-drag pans · Scroll zooms'
            : 'Drag to turn · Scroll to zoom · Click a shape to change it'}
        </span>
      </div>
    </div>
  );
}
