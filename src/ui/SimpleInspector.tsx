/* The everyday inspector: a few clear choices, in plain words. With nothing
   selected it turns the view, picks the colours and edits the labels. With a
   shape selected it sets how bright its lines are, its dots and its height.
   Everything else is behind Advanced. */
import { THEMES, defaultDots, defaultGradient, TONE, STRIKE, uid } from '../model/defaults';
import { useStore } from '../model/store';
import type { DotFill, FaceStyle, Label, Scene, SceneObject } from '../model/types';
import { renderScene } from '../engine/render';
import { Chips, Section, Seg, SliderRow, TextField, Toggle } from './controls';
import { Gizmo } from './Gizmo';
import { IconCopy, IconPlus, IconTrash } from './icons';
import { fitCamera, VIEWS } from './view';
import { MOTIONS, motionOf, playingKind } from '../anim/motion';
import { GROUNDS } from '../model/ground';

const live = (what: string, isLive: boolean) => (isLive ? `live:${what}` : undefined);

/** Turn, tilt and zoom: the gizmo, three slider rows and the standard views. */
export function ViewSection({ scene }: { scene: Scene }) {
  const update = useStore(s => s.update);
  const cam = scene.camera;
  const turn = (yaw: number, pitch: number, l: boolean) =>
    update(s => {
      s.camera.yaw = yaw;
      s.camera.pitch = pitch;
    }, live('turn', l));
  const view = VIEWS.find(v => Math.abs(v.yaw - cam.yaw) < 0.01 && Math.abs(v.pitch - cam.pitch) < 0.01)?.id ?? '';
  return (
    <Section title="Turn the view">
      <div className="gizmo">
        <Gizmo camera={cam} onTurn={turn} onReset={() => turn(45, 30, false)} />
        <div className="note">Drag the ball to turn the figure. Double-click it to go back to the standard angle.</div>
      </div>
      <SliderRow label="Turn" value={cam.yaw} min={-180} max={180} unit="°" onChange={(v, l) => turn(v, cam.pitch, l)} />
      <SliderRow label="Tilt" value={cam.pitch} min={-90} max={90} unit="°" onChange={(v, l) => turn(cam.yaw, v, l)} />
      <SliderRow label="Zoom" value={cam.zoom} min={0.2} max={4} step={0.01} places={2} unit="×" onChange={(v, l) => update(s => void (s.camera.zoom = v), live('zoom', l))} />
      <Seg
        value={view}
        options={VIEWS.filter(v => v.id !== 'side').map(v => ({ value: v.id, label: v.id === 'linear' ? 'Standard' : v.label.charAt(0) + v.label.slice(1).toLowerCase(), title: `${v.label} view (${v.key})` }))}
        onChange={id => {
          const v = VIEWS.find(x => x.id === id)!;
          turn(v.yaw, v.pitch, false);
        }}
      />
      <button
        className="btn soft small"
        onClick={() => {
          const cam2 = fitCamera(scene, renderScene(scene));
          if (cam2) update(s => void (s.camera = cam2));
        }}
      >
        Fit to frame
      </button>
    </Section>
  );
}

/** How the figure moves: its own loop or a shared motion, how long a loop takes, and play. */
export function MotionSection({ scene }: { scene: Scene }) {
  const update = useStore(s => s.update);
  const playing = useStore(s => s.playing);
  const setPlaying = useStore(s => s.setPlaying);
  const m = motionOf(scene);
  const kind = playingKind(scene);
  return (
    <Section title="Animate">
      <Seg
        value={m.kind}
        options={MOTIONS.map(x => ({ value: x.value, label: x.label, title: x.hint }))}
        onChange={v => {
          update(s => void (s.motion = { ...motionOf(s), kind: v }));
          if (v !== 'none') setPlaying(true);
        }}
      />
      {m.kind === 'designed' && kind !== 'designed' && <div className="note">This figure has no loop of its own, so its dots drift.</div>}
      <SliderRow
        label="Length"
        value={m.duration}
        min={2}
        max={10}
        step={1}
        places={0}
        unit=" s"
        onChange={(v, l) => update(s => void (s.motion = { ...motionOf(s), duration: v }), live('length', l))}
      />
      <button className="btn soft small" onClick={() => setPlaying(!playing)} disabled={m.kind === 'none'} data-testid="play">
        {playing ? 'Pause' : 'Play'}
      </button>
      <div className="note">Export it as a video, a GIF, an animated SVG or a Lottie file.</div>
    </Section>
  );
}

export function LabelsSection({ scene, advanced = false }: { scene: Scene; advanced?: boolean }) {
  const update = useStore(s => s.update);
  const setLabel = (id: string, fn: (l: Label) => void, key?: string) =>
    update(s => {
      const l = s.labels.find(x => x.id === id);
      if (l) fn(l);
    }, key);
  return (
    <Section title="Labels" defaultOpen={scene.labels.length > 0 || advanced}>
      {!scene.labels.length && <div className="note">No labels. Add a short one, like a price or a name.</div>}
      <div className="labels">
        {scene.labels.map(l => (
          <div key={l.id} className="labels">
            <div className="lrow">
              <TextField value={l.text} onChange={v => setLabel(l.id, x => void (x.text = v.toUpperCase() === v ? v : v))} placeholder="Label text" />
              <button className="btn icon small danger" title="Remove this label" onClick={() => update(s => void (s.labels = s.labels.filter(x => x.id !== l.id)))}>
                <IconTrash />
              </button>
            </div>
            {advanced && (
              <>
                <Seg
                  value={l.plane}
                  options={[
                    { value: 'screen', label: 'Upright' },
                    { value: 'ground', label: 'Floor' },
                    { value: 'xy', label: 'Wall Z' },
                    { value: 'zy', label: 'Wall X' },
                  ]}
                  onChange={v => setLabel(l.id, x => void (x.plane = v))}
                />
                <SliderRow label="Size" value={l.size} min={1} max={20} step={0.1} places={1} onChange={(v, k) => setLabel(l.id, x => void (x.size = v), live(`ls-${l.id}`, k))} />
                {(['X', 'Y', 'Z'] as const).map((a, i) => (
                  <SliderRow key={a} label={`Place ${a}`} value={l.position[i]!} min={-200} max={200} step={1} onChange={(v, k) => setLabel(l.id, x => void (x.position[i] = v), live(`lp${i}-${l.id}`, k))} />
                ))}
              </>
            )}
          </div>
        ))}
      </div>
      <button
        className="btn soft small"
        onClick={() =>
          update(s =>
            s.labels.push({ id: uid(), text: 'LABEL', position: [0, 40, 0], plane: 'screen', size: 4.5, color: null, opacity: 1, align: 'middle', rotation: 0 }),
          )
        }
      >
        <IconPlus /> Add a label
      </button>
    </Section>
  );
}

export function SimpleScene({ scene }: { scene: Scene }) {
  const update = useStore(s => s.update);
  const t = scene.theme;
  return (
    <>
      <div className="head">
        <h2>{scene.name}</h2>
        <span className="sub">{scene.label}</span>
      </div>
      <ViewSection scene={scene} />
      <MotionSection scene={scene} />
      <Section title="Ground">
        <Seg
          value={scene.ground ?? 'dark'}
          options={GROUNDS.map(g => ({ value: g.value, label: g.label, title: `Sits on Strike ${g.label.toLowerCase()} (${g.color})` }))}
          onChange={v => update(s => void (s.ground = v))}
        />
      </Section>
      <Section title="Colours">
        <Chips
          value={THEMES.find(x => x.name === t.name)?.name ?? null}
          options={THEMES.map(x => ({ value: x.name, label: x.name, swatch: x.name === 'Green lines' ? x.outline : x.dot }))}
          onChange={name => {
            const th = THEMES.find(x => x.name === name)!;
            update(s => void (s.theme = { ...th, transparent: s.theme.transparent }));
          }}
        />
        <Toggle on={t.transparent} onChange={v => update(s => void (s.theme.transparent = v))}>
          See-through background when exported
        </Toggle>
      </Section>
      <LabelsSection scene={scene} />
      <div className="section">
        <div className="note">Click a shape in the figure to change its dots and lines.</div>
      </div>
    </>
  );
}

/* ---- a selected shape ---- */

const TIERS = [
  { value: 'bright', label: 'Bright', outline: TONE.line, crease: TONE.dim },
  { value: 'soft', label: 'Soft', outline: TONE.mid, crease: TONE.dim },
  { value: 'faint', label: 'Faint', outline: TONE.dim, crease: TONE.faint },
] as const;

const DOT_COLOURS = [
  { value: STRIKE.emerald500, label: 'Emerald' },
  { value: STRIKE.emerald300, label: 'Mint' },
  { value: TONE.dot, label: 'Grey' },
] as const;

type Look = 'off' | 'even' | 'fade' | 'wave' | 'glow';

const lookOf = (d: DotFill | null): Look => {
  if (!d?.enabled) return 'off';
  switch (d.gradient.type) {
    case 'none':
      return 'even';
    case 'linear':
      return 'fade';
    case 'wave':
      return 'wave';
    default:
      return 'glow';
  }
};

/** The faces a person thinks about: a wall's front, or a shape's top and sides. */
function targetsOf(o: SceneObject): { key: string; label: string; get: (o: SceneObject) => FaceStyle; ensure: (o: SceneObject) => FaceStyle }[] {
  const tilted = Math.abs(o.rotation[0]) > 45 || Math.abs(o.rotation[2]) > 45;
  const sideKey = Object.keys(o.faces.sides).find(k => o.faces.sides[k]?.dots?.enabled) ?? 'all';
  const sides = {
    key: 'sides',
    label: 'Sides',
    get: (x: SceneObject) => x.faces.sides[sideKey] ?? { fill: null, dots: null },
    ensure: (x: SceneObject) => (x.faces.sides[sideKey] ??= { fill: null, dots: null }),
  };
  if (tilted) return [{ key: 'front', label: 'Front', get: x => x.faces.bottom, ensure: x => x.faces.bottom }, sides];
  return [{ key: 'top', label: 'Top', get: x => x.faces.top, ensure: x => x.faces.top }, sides];
}

export function SimpleObject({ obj }: { obj: SceneObject }) {
  const { updateObject, select, duplicate, remove } = useStore.getState();
  const up = (fn: (o: SceneObject) => void, key?: string) => updateObject(obj.id, fn, key);
  const tier = TIERS.find(t => t.outline === obj.style.outline)?.value ?? (obj.style.outline === null ? 'bright' : null);
  const targets = targetsOf(obj);
  return (
    <>
      <div className="head">
        <h2>{obj.name}</h2>
        <button className="btn small soft" onClick={() => select(null)}>
          Done
        </button>
      </div>
      <Section title="Lines">
        <Seg
          value={tier ?? ''}
          options={TIERS.map(t => ({ value: t.value as string, label: t.label }))}
          onChange={v => {
            const t = TIERS.find(x => x.value === v)!;
            up(o => {
              o.style.outline = t.outline;
              o.style.crease = t.crease;
            });
          }}
        />
      </Section>
      {targets.map(tg => {
        const face = tg.get(obj);
        const d = face.dots;
        const look = lookOf(d);
        const setDots = (fn: (x: DotFill) => void, key?: string) =>
          up(o => {
            const f = tg.ensure(o);
            if (!f.dots) f.dots = { ...defaultDots(STRIKE.emerald500), spacing: 3.2, size: 0.8, inset: 2 };
            fn(f.dots);
          }, key);
        return (
          <Section key={tg.key} title={`Dots on the ${tg.label.toLowerCase()}`}>
            <Seg
              accent
              value={look}
              options={[
                { value: 'off', label: 'Off' },
                { value: 'even', label: 'Even' },
                { value: 'fade', label: 'Fade' },
                { value: 'wave', label: 'Wave' },
                { value: 'glow', label: 'Glow' },
              ]}
              onChange={v =>
                setDots(x => {
                  x.enabled = v !== 'off';
                  const g = { ...defaultGradient(), affects: 'both' as const };
                  if (v === 'even') x.gradient = { ...g, type: 'none' };
                  if (v === 'fade') x.gradient = { ...g, type: 'linear', angle: 90 };
                  if (v === 'wave') x.gradient = { ...g, type: 'wave', frequency: 2 };
                  if (v === 'glow') x.gradient = { ...g, type: 'radial', cx: 0.5, cy: 0.5, radius: 0.75 };
                })
              }
            />
            {d?.enabled && (
              <>
                <Chips
                  value={DOT_COLOURS.find(c => c.value === (d.color || STRIKE.emerald500))?.value ?? null}
                  options={DOT_COLOURS.map(c => ({ value: c.value as string, label: c.label, swatch: c.value }))}
                  onChange={c => setDots(x => void (x.color = c))}
                />
                <SliderRow label="Spacing" value={d.spacing} min={1.6} max={9} step={0.1} places={1} onChange={(v, l) => setDots(x => void (x.spacing = v), live(`sp-${tg.key}`, l))} />
                <SliderRow label="Dot size" value={d.size} min={0.2} max={2} step={0.05} places={2} onChange={(v, l) => setDots(x => void (x.size = v), live(`sz-${tg.key}`, l))} />
                <SliderRow label="Strength" value={d.opacity} min={0.05} max={1} step={0.05} places={2} onChange={(v, l) => setDots(x => void (x.opacity = v), live(`op-${tg.key}`, l))} />
              </>
            )}
          </Section>
        );
      })}
      <Section title="Size">
        <SliderRow label="Height" value={obj.height} min={1} max={240} step={1} onChange={(v, l) => up(o => void (o.height = v), live('h', l))} />
      </Section>
      <div className="section">
        <div className="actions">
          <button className="btn soft small" onClick={duplicate}>
            <IconCopy /> Duplicate
          </button>
          <button className="btn soft small danger" onClick={remove}>
            <IconTrash /> Delete
          </button>
        </div>
        <div className="note">To move, turn or reshape it, switch on Advanced at the top.</div>
      </div>
    </>
  );
}
