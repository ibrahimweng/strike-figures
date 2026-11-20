/* The Motion page and its live pieces: circle loops and the two curves. */
import { useEffect, useRef } from 'react';
import { bezier, type Circle, circlesAt, css, curveAt, CYCLE, EASE, FOCUS_RIGHT, type Move, MS, REST } from './circles';
import { type Copy, Group } from './shared';

const GREY = '#B3B3B3';
const still = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Runs a callback every frame while mounted (or once, when motion is reduced). */
function useFrames(draw: (ms: number) => void, first: number) {
  const ref = useRef(draw);
  ref.current = draw;
  useEffect(() => {
    if (still()) {
      ref.current(first);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      ref.current(now - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [first]);
}

const VIEW = { focus: '-5.6 -4.7 11.2 7', press: '-3.6 -2.6 7.2 5.2' };

/** Five circles running one move on a loop. */
export function CircleLoop({ move, className }: { move: Move; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useFrames(
    ms => {
      const cs = svg.current?.children;
      if (!cs) return;
      circlesAt(move, ms).forEach(([x, y, r], i) => {
        const c = cs[i] as SVGCircleElement | undefined;
        c?.setAttribute('cx', x.toFixed(3));
        c?.setAttribute('cy', y.toFixed(3));
        c?.setAttribute('r', r.toFixed(3));
      });
    },
    move === 'focus' ? MS.rest + MS.gather + MS.release : 0,
  );
  const first: Circle[] = move === 'focus' ? FOCUS_RIGHT : REST;
  return (
    <svg ref={svg} className={className} viewBox={VIEW[move]} aria-hidden>
      {first.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={GREY} />
      ))}
    </svg>
  );
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
          <svg viewBox="-3.4 -2.2 6.8 4.4" aria-hidden>
            {REST.map(([x, y, r], i) => (
              <circle key={i} cx={x} cy={y} r={r} fill={GREY} />
            ))}
          </svg>
          <ul className="sk-dos">
            <li>Centres 2r apart in a row; rows r·√3 apart, the lower two in the gaps.</li>
            <li>One grey. At most one green, for the one thing that matters.</li>
            <li>This cluster is the rest state every move passes through.</li>
          </ul>
        </div>
      </Group>

      <Group title="Moves" line="Built from the two curves. One move at a time.">
        <div className="sk-moves">
          <div className="sk-move">
            <CircleLoop move="focus" />
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
            <CircleLoop move="press" />
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
