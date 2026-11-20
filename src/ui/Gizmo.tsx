/* The turn gizmo: a wireframe sphere with the figure's three axes, drawn
   from the camera's own angle. Drag it to turn the view; double-click it to
   go back to Linear's 2:1 angle. */
import { useRef } from 'react';
import { makeView, type V3 } from '../engine/math';
import type { Camera } from '../model/types';

const SIZE = 128;
const R = 50;

function ring(cam: Camera, axis: 'x' | 'y' | 'z') {
  const v = makeView({ ...cam, zoom: R, panX: 0, panY: 0 }, SIZE, SIZE);
  const front: string[] = [];
  const back: string[] = [];
  let run: { pts: string[]; front: boolean } | null = null;
  const flush = () => {
    if (run && run.pts.length > 1) (run.front ? front : back).push(`M${run.pts.join('L')}`);
  };
  for (let i = 0; i <= 72; i++) {
    const t = (i / 72) * Math.PI * 2;
    const p: V3 = axis === 'y' ? [Math.cos(t), 0, Math.sin(t)] : axis === 'x' ? [0, Math.cos(t), Math.sin(t)] : [Math.cos(t), Math.sin(t), 0];
    const sx = v.ox + v.zoom * (v.r0[0] * p[0] + v.r0[1] * p[1] + v.r0[2] * p[2]);
    const sy = v.oy + v.zoom * (v.r1[0] * p[0] + v.r1[1] * p[1] + v.r1[2] * p[2]);
    const d = v.v[0] * p[0] + v.v[1] * p[1] + v.v[2] * p[2];
    const isFront = d >= 0;
    const pt = `${sx.toFixed(1)} ${sy.toFixed(1)}`;
    if (!run || run.front !== isFront) {
      if (run) run.pts.push(pt);
      flush();
      run = { pts: [pt], front: isFront };
    } else run.pts.push(pt);
  }
  flush();
  return { front: front.join(''), back: back.join('') };
}

export function Gizmo({ camera, onTurn, onReset }: { camera: Camera; onTurn: (yaw: number, pitch: number, live: boolean) => void; onReset: () => void }) {
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const v = makeView({ ...camera, zoom: R, panX: 0, panY: 0 }, SIZE, SIZE);
  const axis = (p: V3) => ({
    x: v.ox + v.zoom * (v.r0[0] * p[0] + v.r0[1] * p[1] + v.r0[2] * p[2]),
    y: v.oy + v.zoom * (v.r1[0] * p[0] + v.r1[1] * p[1] + v.r1[2] * p[2]),
    front: v.v[0] * p[0] + v.v[1] * p[1] + v.v[2] * p[2] >= -0.05,
  });
  const axes = [
    { n: 'X', p: axis([0.82, 0, 0]), c: '#8A8F98' },
    { n: 'Y', p: axis([0, 0.82, 0]), c: '#34D399' },
    { n: 'Z', p: axis([0, 0, 0.82]), c: '#8A8F98' },
  ];
  const rings = (['y', 'x', 'z'] as const).map(a => ({ a, ...ring(camera, a) }));
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="slider"
      aria-label="Turn the view: drag. Double-click to reset."
      aria-valuetext={`Turn ${Math.round(camera.yaw)}°, tilt ${Math.round(camera.pitch)}°`}
      tabIndex={0}
      onPointerDown={e => {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        drag.current = { x: e.clientX, y: e.clientY, yaw: camera.yaw, pitch: camera.pitch };
      }}
      onPointerMove={e => {
        const d = drag.current;
        if (!d) return;
        let yaw = d.yaw - (e.clientX - d.x) * 0.7;
        const pitch = Math.max(-90, Math.min(90, d.pitch + (e.clientY - d.y) * 0.6));
        yaw = ((yaw % 360) + 540) % 360 - 180;
        onTurn(yaw, pitch, true);
      }}
      onPointerUp={() => (drag.current = null)}
      onDoubleClick={onReset}
      onKeyDown={e => {
        const step = e.shiftKey ? 15 : 5;
        if (e.key === 'ArrowLeft') onTurn(camera.yaw + step, camera.pitch, false);
        else if (e.key === 'ArrowRight') onTurn(camera.yaw - step, camera.pitch, false);
        else if (e.key === 'ArrowUp') onTurn(camera.yaw, Math.min(90, camera.pitch + step), false);
        else if (e.key === 'ArrowDown') onTurn(camera.yaw, Math.max(-90, camera.pitch - step), false);
        else return;
        e.preventDefault();
      }}
    >
      <circle cx={SIZE / 2} cy={SIZE / 2} r={R + 8} fill="#151618" />
      {rings.map(r => (
        <g key={r.a} fill="none">
          <path d={r.back} stroke="#3E3E44" strokeWidth={1} strokeDasharray="2 3" />
          <path d={r.front} stroke={r.a === 'y' ? '#10B981' : '#62666D'} strokeWidth={1.2} />
        </g>
      ))}
      {axes.map(a => (
        <g key={a.n} opacity={a.p.front ? 1 : 0.35}>
          <line x1={SIZE / 2} y1={SIZE / 2} x2={a.p.x} y2={a.p.y} stroke={a.c} strokeWidth={1.4} strokeLinecap="round" />
          <circle cx={a.p.x} cy={a.p.y} r={7} fill="#0F1011" stroke={a.c} strokeWidth={1} />
          <text x={a.p.x} y={a.p.y + 3} textAnchor="middle" fontSize={8} fontFamily="Geist Mono Variable, monospace" fill={a.c}>
            {a.n}
          </text>
        </g>
      ))}
      <circle cx={SIZE / 2} cy={SIZE / 2} r={2.5} fill="#EDEEF0" />
    </svg>
  );
}
