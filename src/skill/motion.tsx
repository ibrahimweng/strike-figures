/* The Motion page and its live pieces: circle loops and the two curves. */
import { useEffect, useMemo, useRef } from 'react';
import { bezier, circlesAt, css, curveAt, CYCLE, EASE, type Move, MS } from '../anim/system';
import { renderScene } from '../engine/render';
import { buildSvg, serialize } from '../engine/svg';
import { type CircleView, circleScene, setCircles } from '../library/circleFigure';
import { type Copy, Group } from './shared';

const GREY = '#B3B3B3';
const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Runs a callback every frame while mounted (or once, when motion is reduced). */
function useFrames(draw: (ms: number) => void, first: number, fps = 60) {
  const ref = useRef(draw);
  ref.current = draw;
  useEffect(() => {
    if (still()) {
      ref.current(first);
      return;
    }
    let raf = 0;
    let last = -1e9;
    const start = performance.now();
    const tick = (now: number) => {
      if (now - last >= 1000 / fps - 1) {
        last = now;
        ref.current(now - start);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [first, fps]);
}

let ids = 0;
const SIZE = { focus: [560, 360], press: [480, 300], still: [420, 260] } as const;

/** The five circles, drawn by the illustration engine (flat or 2:1), running one move or still. */
export function CircleFigure({ move, view, guides, className }: { move: Move | 'still'; view: CircleView; guides?: boolean; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const prefix = useMemo(() => `circ${ids++}`, []);
  const base = useMemo(() => {
    const [width, height] = SIZE[move];
    return circleScene(view, move, { width, height, guides, small: true });
  }, [move, view, guides]);
  const draw = (ms: number) => {
    const el = host.current;
    if (!el) return;
    const sc = structuredClone(base);
    if (move !== 'still') setCircles(sc, circlesAt(move, ms));
    el.innerHTML = serialize(buildSvg(renderScene(sc), { background: false, idPrefix: prefix }));
  };
  useFrames(draw, move === 'focus' ? MS.rest + MS.gather + MS.release : 0, move === 'still' ? 0.001 : 30);
  return <div className={`sk-circles ${className ?? ''}`} ref={host} aria-hidden />;
}

/** One curve, drawn on a square, with a dot running along it. */
function Curve({ which }: { which: 'gather' | 'release' }) {
  const dot = useRef<SVGCircleElement>(null);
  const e = EASE[which];
  const f = bezier(e);
  const S = 100;
  const path = `M0 ${S} C ${e[0] * S} ${S - e[1] * S} ${e[2] * S} ${S - e[3] * S} ${S} 0`;
  useFrames(ms => {
    const t = curveAt(which, ms);
    dot.current?.setAttribute('cx', String(t * S));
    dot.current?.setAttribute('cy', String(S - f(t) * S));
  }, MS[which]);
  return (
    <svg className="sk-curve" viewBox="-6 -6 112 112" aria-hidden>
      <rect x="0" y="0" width={S} height={S} fill="none" stroke="var(--line)" />
      <path d={`M0 ${S} L${S} 0`} stroke="var(--line)" strokeDasharray="2 3" fill="none" />
      <path d={path} stroke={GREY} strokeWidth="1.5" fill="none" />
      <circle ref={dot} r="3.2" fill="var(--accent)" />
    </svg>
  );
}

const CURVES = [
  { id: 'gather' as const, name: 'Gather', kind: 'Ease in', line: 'Into the meeting point: shapes speed up as they come together.' },
  { id: 'release' as const, name: 'Release', kind: 'Ease out', line: 'Out of it: fast away, then a long, quiet settle.' },
];

function Timing({ parts }: { parts: [string, number][] }) {
  const total = parts.reduce((a, [, ms]) => a + ms, 0);
  return (
    <div className="sk-timing">
      {parts.map(([name, ms]) => (
        <span key={name} style={{ flex: ms / total }} className={`t-${name.toLowerCase().split(' ')[0]}`}>
          <b>{name}</b> {ms} ms
        </span>
      ))}
    </div>
  );
}

export function MotionPage({ copied, copy }: { copied: string | null; copy: Copy }) {
  return (
    <>
      <Group title="Two curves" line="Every move has a meeting point. Speed up into it, slow down out of it.">
        <div className="sk-curves">
          {CURVES.map(c => (
            <div key={c.id} className="sk-curve-cell">
              <Curve which={c.id} />
              <div>
                <h4>
                  {c.name} <span>· {c.kind}</span>
                </h4>
                <button className="sk-code" onClick={() => copy(`ease-${c.id}`, css(EASE[c.id]))} title="Copy">
                  {copied === `ease-${c.id}` ? 'Copied' : css(EASE[c.id])}
                </button>
                <p>
                  {MS[c.id]} ms. {c.line}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="sk-note">
          Plain UI (hover, colour, panels) uses{' '}
          <button className="sk-code" onClick={() => copy('ease-standard', css(EASE.standard))}>
            {copied === 'ease-standard' ? 'Copied' : css(EASE.standard)}
          </button>{' '}
          at 120–200 ms.
        </p>
      </Group>

      <Group title="Composition" line="Five equal circles, three over two, each touching its neighbours.">
        <div className="sk-compose">
          <CircleFigure move="still" view="flat" guides />
          <ul className="sk-dos">
            <li>Centres 2r apart in a row; rows r·√3 apart (dashed), the lower two in the gaps.</li>
            <li>Drawn like every illustration: grey lines, faces in the ground colour, one green focus in dots.</li>
            <li>Flat explains the composition; the 2:1 view gives the same plates depth.</li>
            <li>This cluster is the rest state every move passes through.</li>
          </ul>
        </div>
      </Group>

      <Group title="Moves" line="Built from the two curves. One move at a time.">
        <div className="sk-moves">
          <div className="sk-move">
            <CircleFigure move="focus" view="iso" />
            <h4>Focus</h4>
            <p>One circle grows up to 2× while the others shrink to 0.5×. Hover, highlight, “this one”.</p>
            <Timing
              parts={[
                ['Rest', MS.rest],
                ['Gather', MS.gather],
                ['Release', MS.release],
              ]}
            />
          </div>
          <div className="sk-move">
            <CircleFigure move="press" view="flat" />
            <h4>Press</h4>
            <p>The circles squeeze to the centre and back. A click, a confirm.</p>
            <Timing
              parts={[
                ['Rest', CYCLE.press - MS.pressIn - MS.pressOut],
                ['Gather', MS.pressIn],
                ['Release', MS.pressOut],
              ]}
            />
          </div>
        </div>
      </Group>

      <Group title="Rules" line="Calm and exact.">
        <ul className="sk-dos">
          <li>One move at a time, and everything comes back to rest.</li>
          <li>A loop is rest, gather, release: 1 second.</li>
          <li>In a row of circles, the hovered one grows by a third and its neighbours give up the same width.</li>
          <li>No bounce, no flashing. With reduced motion, show the still.</li>
        </ul>
      </Group>
    </>
  );
}
