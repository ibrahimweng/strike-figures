/* The right panel. With nothing selected it edits the figure: artboard,
   camera and colours. With an object selected it edits its shape, place,
   lines, shadow, faces (solid colours and dotted fills) and decal. */
import { useState } from 'react';
import { importSvg } from '../engine/decal';
import { shapeOf } from '../engine/render';
import { segNormal } from '../engine/shapes';
import { defaultDots, defaultGradient, emptyFace, THEMES } from '../model/defaults';
import { faceStyleOf, setFaceStyle, useStore } from '../model/store';
import type { DotFill, Gradient, Scene, SceneObject, ShapeSpec, Theme } from '../model/types';
import { ColorField, NumberField, Row, Section, Seg, Select, TextField, Toggle } from './controls';
import { IconCopy, IconRepeat, IconTrash, IconUpload } from './icons';
import { facesName } from './view';
import { LabelsSection, SimpleObject, SimpleScene, ViewSection } from './SimpleInspector';

/** a key for edits that should merge into one undo step while a control is being dragged */
const live = (what: string, isLive: boolean) => (isLive ? `live:${what}` : undefined);

export function Inspector() {
  const scene = useStore(s => s.scene());
  const selection = useStore(s => s.selection);
  const advanced = useStore(s => s.advanced);
  const obj = scene.objects.find(o => o.id === selection.objectId) ?? null;
  let body;
  if (advanced) body = obj ? <ObjectInspector scene={scene} obj={obj} face={selection.face} /> : <SceneInspector scene={scene} />;
  else body = obj ? <SimpleObject obj={obj} /> : <SimpleScene scene={scene} />;
  return (
    <aside className="right card" data-testid="inspector">
      {body}
    </aside>
  );
}

function SceneInspector({ scene }: { scene: Scene }) {
  const update = useStore(s => s.update);
  const cam = scene.camera;
  const setCam = (k: keyof typeof cam) => (v: number, l: boolean) => update(s => void (s.camera[k] = v), live(`cam-${k}`, l));
  const t = scene.theme;
  const setTheme = <K extends keyof Theme>(k: K) => (v: Theme[K], l = false) => update(s => void (s.theme[k] = v), live(`theme-${k}`, l));
  return (
    <>
      <div className="head">
        <h2>Figure</h2>
        <span className="sub">All settings</span>
      </div>
      <Section title="Artboard">
        <Row label="Name">
          <TextField value={scene.name} onChange={v => update(s => void (s.name = v))} />
        </Row>
        <Row label="Caption">
          <TextField value={scene.label} onChange={v => update(s => void (s.label = v))} />
        </Row>
        <Row label="Artboard">
          <div className="grid2">
            <NumberField label="W" value={scene.artboard.width} min={16} max={4000} places={0} onChange={(v, l) => update(s => void (s.artboard.width = v), live('aw', l))} />
            <NumberField label="H" value={scene.artboard.height} min={16} max={4000} places={0} onChange={(v, l) => update(s => void (s.artboard.height = v), live('ah', l))} />
          </div>
        </Row>
      </Section>
      <ViewSection scene={scene} />
      <Section title="Pan" defaultOpen={false}>
        <Row label="Pan">
          <div className="grid2">
            <NumberField label="X" value={cam.panX} step={1} onChange={setCam('panX')} />
            <NumberField label="Y" value={cam.panY} step={1} onChange={setCam('panY')} />
          </div>
        </Row>
      </Section>
      <Section title="Colours & lines">
        <Row label="Theme">
          <Select
            value={THEMES.some(x => x.name === t.name) ? t.name : 'Custom'}
            options={[...THEMES.map(x => ({ value: x.name, label: x.name })), ...(THEMES.some(x => x.name === t.name) ? [] : [{ value: 'Custom', label: 'Custom' }])]}
            onChange={name => {
              const th = THEMES.find(x => x.name === name);
              if (th) update(s => void (s.theme = { ...th, transparent: s.theme.transparent }));
            }}
          />
        </Row>
        {(
          [
            ['background', 'Background'],
            ['fill', 'Faces'],
            ['outline', 'Outline'],
            ['crease', 'Crease'],
            ['guide', 'Guides'],
            ['dot', 'Dots'],
            ['accent', 'Accent'],
          ] as const
        ).map(([k, label]) => (
          <Row key={k} label={label}>
            <ColorField value={t[k]} onChange={(v, l) => v && update(s => void ((s.theme[k] = v), (s.theme.name = 'Custom')), live(`th-${k}`, l))} />
          </Row>
        ))}
        <Row label="Line width">
          <NumberField value={t.lineWidth} step={0.05} min={0.05} max={8} onChange={(v, l) => setTheme('lineWidth')(v, l)} />
        </Row>
        <Row label="Crease taper">
          <NumberField value={t.creaseTaper} step={0.01} min={0} max={1} onChange={(v, l) => setTheme('creaseTaper')(v, l)} title="Creases on curved sides stop where the side turns away: 0 draws them all, 0.7 matches Linear" />
        </Row>
        <Row label="Crease trim">
          <NumberField value={t.creaseTrim} step={0.5} min={0} max={40} onChange={(v, l) => setTheme('creaseTrim')(v, l)} title="Creases stop this far short of the outline (objects can override)" />
        </Row>
        <Toggle on={t.transparent} onChange={v => setTheme('transparent')(v)}>
          Export without the background
        </Toggle>
      </Section>
      <LabelsSection scene={scene} advanced />
      <div className="section">
        <div className="note">Select an object to edit it, or Alt-click one of its faces to paint that face. Add shapes from the top bar.</div>
      </div>
    </>
  );
}

function ObjectInspector({ scene, obj, face }: { scene: Scene; obj: SceneObject; face: string | null }) {
  const updateObject = useStore(s => s.updateObject);
  const duplicate = useStore(s => s.duplicate);
  const remove = useStore(s => s.remove);
  const repeat = useStore(s => s.repeat);
  const select = useStore(s => s.select);
  const up = (fn: (o: SceneObject) => void, key?: string) => updateObject(obj.id, fn, key);
  const t = scene.theme;
  const [rep, setRep] = useState({ count: 4, dx: 0, dy: 0, dz: 12, dh: 0 });
  const geom = shapeOf(obj.shape);

  return (
    <>
      <div className="head">
        <h2>{obj.name}</h2>
        <span className="actions">
          <button className="btn icon small" title="Duplicate (⌘D)" onClick={duplicate}>
            <IconCopy />
          </button>
          <button className="btn icon small danger" title="Delete (⌫)" onClick={remove}>
            <IconTrash />
          </button>
        </span>
      </div>
      <Section title="Shape">
        <Row label="Name">
          <TextField value={obj.name} onChange={v => up(o => void (o.name = v))} />
        </Row>
        <ShapeFields obj={obj} up={up} />
        <Row label="Height">
          <NumberField value={obj.height} min={0.1} step={1} onChange={(v, l) => up(o => void (o.height = v), live('h', l))} />
        </Row>
      </Section>
      <Section title="Place">
        <Row label="Position">
          <div className="grid3">
            {(['X', 'Y', 'Z'] as const).map((a, i) => (
              <NumberField key={a} label={a} value={obj.position[i]!} step={1} onChange={(v, l) => up(o => void (o.position[i] = v), live(`p${i}`, l))} />
            ))}
          </div>
        </Row>
        <Row label="Rotation">
          <div className="grid3">
            {(['X', 'Y', 'Z'] as const).map((a, i) => (
              <NumberField key={a} label={a} value={obj.rotation[i]!} step={1} unit="°" onChange={(v, l) => up(o => void (o.rotation[i] = v), live(`r${i}`, l))} />
            ))}
          </div>
        </Row>
        <Toggle on={obj.guides} onChange={v => up(o => void (o.guides = v))}>
          Dotted guides down to what's below
        </Toggle>
      </Section>
      <Section title="Lines">
        <Row label="Outline">
          <ColorField value={obj.style.outline} inherited={t.outline} allowInherit onChange={(v, l) => up(o => void (o.style.outline = v), live('so', l))} />
        </Row>
        <Row label="Crease">
          <ColorField value={obj.style.crease} inherited={t.crease} allowInherit onChange={(v, l) => up(o => void (o.style.crease = v), live('sc', l))} />
        </Row>
        <Row label="Opacity">
          <div className="grid2">
            <NumberField label="O" value={obj.style.outlineOpacity} step={0.05} min={0} max={1} onChange={(v, l) => up(o => void (o.style.outlineOpacity = v), live('soo', l))} title="Outline opacity" />
            <NumberField label="C" value={obj.style.creaseOpacity} step={0.05} min={0} max={1} onChange={(v, l) => up(o => void (o.style.creaseOpacity = v), live('sco', l))} title="Crease opacity" />
          </div>
        </Row>
        <Row label="Width">
          <NumberField value={obj.style.lineWidth ?? t.lineWidth} step={0.05} min={0.05} max={8} onChange={(v, l) => up(o => void (o.style.lineWidth = v), live('slw', l))} />
        </Row>
        <Row label="Crease trim">
          <NumberField value={obj.style.creaseTrim ?? t.creaseTrim} step={0.5} min={0} max={40} onChange={(v, l) => up(o => void (o.style.creaseTrim = v), live('sct', l))} />
        </Row>
        <Row label="Crease drop">
          <NumberField value={obj.style.creaseDrop} step={0.1} min={0} max={50} onChange={(v, l) => up(o => void (o.style.creaseDrop = v), live('scd', l))} title="Draw the top crease this far down the sides" />
        </Row>
        <Toggle on={obj.style.showCreases} onChange={v => up(o => void (o.style.showCreases = v))}>
          Show creases
        </Toggle>
      </Section>
      <Section title="Faces & dotted fills">
        <Row label="Fill">
          <ColorField value={obj.style.fill} inherited={t.fill} allowInherit onChange={(v, l) => up(o => void (o.style.fill = v), live('sf', l))} />
        </Row>
        <div className="facelist">
          {['top', 'bottom', 'all', ...geom.sideFaces].map(key => (
            <FaceEditor
              key={key}
              obj={obj}
              faceKey={key}
              axis={axisOf(geom, key)}
              theme={t}
              open={face === key}
              onOpen={() => select(obj.id, face === key ? null : key)}
              up={up}
            />
          ))}
        </div>
        <div className="note">Tip: Alt-click a face on the canvas to open it here.</div>
      </Section>
      <Section title="Shadow" defaultOpen={obj.shadow.enabled}>
        <Toggle on={obj.shadow.enabled} onChange={v => up(o => void (o.shadow.enabled = v))}>
          Soft shadow round the object
        </Toggle>
        {obj.shadow.enabled && (
          <>
            <Row label="Blur">
              <NumberField value={obj.shadow.blur} min={0} max={80} step={0.5} onChange={(v, l) => up(o => void (o.shadow.blur = v), live('shb', l))} />
            </Row>
            <Row label="Offset">
              <div className="grid2">
                <NumberField label="X" value={obj.shadow.dx} step={0.5} onChange={(v, l) => up(o => void (o.shadow.dx = v), live('shx', l))} />
                <NumberField label="Y" value={obj.shadow.dy} step={0.5} onChange={(v, l) => up(o => void (o.shadow.dy = v), live('shy', l))} />
              </div>
            </Row>
            <Row label="Strength">
              <NumberField value={obj.shadow.opacity} min={0} max={1} step={0.05} onChange={(v, l) => up(o => void (o.shadow.opacity = v), live('sho', l))} />
            </Row>
          </>
        )}
      </Section>
      <DecalEditor obj={obj} up={up} theme={t} />
      <Section title="Repeat" defaultOpen={false}>
        <div className="note">Make copies in a row, each one stepped on from the last (fins, stacks, stairs).</div>
        <Row label="Copies">
          <NumberField value={rep.count} min={1} max={60} step={1} places={0} onChange={v => setRep({ ...rep, count: v })} />
        </Row>
        <Row label="Step">
          <div className="grid3">
            <NumberField label="X" value={rep.dx} onChange={v => setRep({ ...rep, dx: v })} />
            <NumberField label="Y" value={rep.dy} onChange={v => setRep({ ...rep, dy: v })} />
            <NumberField label="Z" value={rep.dz} onChange={v => setRep({ ...rep, dz: v })} />
          </div>
        </Row>
        <Row label="Height step">
          <NumberField value={rep.dh} onChange={v => setRep({ ...rep, dh: v })} />
        </Row>
        <button className="btn ghost small" onClick={() => repeat(rep.count, [rep.dx, rep.dy, rep.dz], rep.dh)}>
          <IconRepeat /> Make {rep.count} {rep.count === 1 ? 'copy' : 'copies'}
        </button>
      </Section>
      <Section title="Visibility" defaultOpen={false}>
        <Toggle on={obj.visible} onChange={v => up(o => void (o.visible = v))}>
          Visible
        </Toggle>
        <Toggle on={obj.locked} onChange={v => up(o => void (o.locked = v))}>
          Locked (the canvas clicks through it)
        </Toggle>
      </Section>
    </>
  );
}

function axisOf(geom: ReturnType<typeof shapeOf>, key: string): string {
  if (key === 'top' || key === 'bottom' || key === 'all') return '';
  const seg = geom.outline.find(s => s.face === key);
  if (!seg) return '';
  if (seg.kind === 'arc' && seg.a1 - seg.a0 > 6) return 'round';
  const n = segNormal(seg, 0.5);
  const a = (Math.atan2(n.y, n.x) * 180) / Math.PI;
  const named: [number, string][] = [
    [0, '+X'],
    [90, '+Z'],
    [180, '−X'],
    [-180, '−X'],
    [-90, '−Z'],
  ];
  const hit = named.find(([d]) => Math.abs(d - a) < 1);
  return hit ? hit[1] : `${Math.round(a)}°`;
}

function ShapeFields({ obj, up }: { obj: SceneObject; up: (fn: (o: SceneObject) => void, key?: string) => void }) {
  const s = obj.shape;
  const set = (fn: (sh: ShapeSpec) => void, k: string, l: boolean) => up(o => fn(o.shape), live(k, l));
  const kinds: { value: ShapeSpec['kind']; label: string }[] = [
    { value: 'box', label: 'Box' },
    { value: 'cylinder', label: 'Cylinder' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'chevron', label: 'Chevron' },
  ];
  const change = (kind: ShapeSpec['kind']) =>
    up(o => {
      const size = 60;
      o.shape =
        kind === 'box'
          ? { kind, width: size, depth: size, radius: 4 }
          : kind === 'cylinder'
            ? { kind, radius: size / 2 }
            : kind === 'polygon'
              ? { kind, sides: 6, radius: size / 2, corner: 2 }
              : kind === 'sector'
                ? { kind, radius: size / 2, start: -90, sweep: 120 }
                : kind === 'outline'
                  ? { kind, points: [[-30, -30], [30, -30], [30, 0], [0, 0], [0, 30], [-30, 30]], radius: 2 }
                  : { kind: 'chevron', width: size * 2, depth: size };
      o.faces.sides = {};
    });
  return (
    <>
      <Row label="Kind">
        <Select value={s.kind} options={kinds} onChange={change} />
      </Row>
      {s.kind === 'box' && (
        <>
          <Row label="Size">
            <div className="grid2">
              <NumberField label="W" value={s.width} min={0.5} onChange={(v, l) => set(x => x.kind === 'box' && (x.width = v), 'bw', l)} title="Width along X" />
              <NumberField label="D" value={s.depth} min={0.5} onChange={(v, l) => set(x => x.kind === 'box' && (x.depth = v), 'bd', l)} title="Depth along Z" />
            </div>
          </Row>
          {!s.corners ? (
            <Row label="Corners">
              <div className="grid2">
                <NumberField label="R" value={s.radius} min={0} step={0.5} onChange={(v, l) => set(x => x.kind === 'box' && (x.radius = v), 'br', l)} title="Corner radius" />
                <button className="btn ghost small" onClick={() => set(x => x.kind === 'box' && (x.corners = [x.radius, x.radius, x.radius, x.radius]), 'bc', false)}>
                  Each corner
                </button>
              </div>
            </Row>
          ) : (
            <Row label="Corners">
              <div className="grid4">
                {(['B', 'R', 'F', 'L'] as const).map((n, i) => (
                  <NumberField
                    key={n}
                    label={n}
                    value={s.corners![i]!}
                    min={0}
                    step={0.5}
                    title={['Back corner (−X −Z)', 'Right corner (+X −Z)', 'Front corner (+X +Z)', 'Left corner (−X +Z)'][i]}
                    onChange={(v, l) => set(x => x.kind === 'box' && x.corners && (x.corners[i] = v), `bc${i}`, l)}
                  />
                ))}
              </div>
            </Row>
          )}
          {s.corners && (
            <button className="btn ghost small" onClick={() => set(x => x.kind === 'box' && ((x.radius = x.corners?.[0] ?? x.radius), (x.corners = null)), 'bc', false)}>
              One radius for all corners
            </button>
          )}
        </>
      )}
      {s.kind === 'cylinder' && (
        <Row label="Radius">
          <NumberField value={s.radius} min={0.5} onChange={(v, l) => set(x => x.kind === 'cylinder' && (x.radius = v), 'cr', l)} />
        </Row>
      )}
      {s.kind === 'polygon' && (
        <>
          <Row label="Sides">
            <NumberField value={s.sides} min={3} max={24} places={0} onChange={(v, l) => set(x => x.kind === 'polygon' && (x.sides = Math.round(v)), 'ps', l)} />
          </Row>
          <Row label="Radius">
            <div className="grid2">
              <NumberField label="R" value={s.radius} min={0.5} onChange={(v, l) => set(x => x.kind === 'polygon' && (x.radius = v), 'pr', l)} />
              <NumberField label="C" value={s.corner} min={0} step={0.5} onChange={(v, l) => set(x => x.kind === 'polygon' && (x.corner = v), 'pc', l)} title="Corner rounding" />
            </div>
          </Row>
        </>
      )}
      {s.kind === 'chevron' && (
        <Row label="Size">
          <div className="grid2">
            <NumberField label="W" value={s.width} min={1} onChange={(v, l) => set(x => x.kind === 'chevron' && (x.width = v), 'vw', l)} />
            <NumberField label="D" value={s.depth} min={1} onChange={(v, l) => set(x => x.kind === 'chevron' && (x.depth = v), 'vd', l)} />
          </div>
        </Row>
      )}
    </>
  );
}

function FaceEditor({
  obj,
  faceKey,
  axis,
  theme,
  open,
  onOpen,
  up,
}: {
  obj: SceneObject;
  faceKey: string;
  axis: string;
  theme: Theme;
  open: boolean;
  onOpen: () => void;
  up: (fn: (o: SceneObject) => void, key?: string) => void;
}) {
  const fs = faceStyleOf(obj, faceKey);
  const dots = fs.dots;
  const lit = !!dots?.enabled || !!fs.fill;
  const setFace = (fn: (f: typeof fs) => void, key?: string) => up(o => setFaceStyle(o, faceKey, fn), key);
  const setDots = (fn: (d: DotFill) => void, k: string, l = false) =>
    setFace(f => {
      if (!f.dots) f.dots = defaultDots();
      fn(f.dots);
    }, live(`${faceKey}-${k}`, l));
  const setGrad = (fn: (g: Gradient) => void, k: string, l = false) => setDots(d => fn(d.gradient), `g-${k}`, l);
  const summary = [dots?.enabled ? (dots.gradient.type === 'none' ? 'dots' : `halftone · ${dots.gradient.type}`) : '', fs.fill ? 'colour' : ''].filter(Boolean).join(' + ');
  return (
    <div className={`face${open ? ' open' : ''}`} data-face={faceKey}>
      <button className="fhead" onClick={onOpen} aria-expanded={open}>
        <span className={`dot${lit ? ' lit' : ''}`} />
        {facesName(faceKey)}
        {axis && <span style={{ color: 'var(--faint)', fontFamily: 'var(--mono)', fontSize: 11 }}>{axis}</span>}
        <span className="what">{summary || '—'}</span>
      </button>
      {open && (
        <div className="fbody">
          {faceKey === 'all' && <div className="note">Fills every side as one sheet, flowing round the corners. A side with its own fill takes priority.</div>}
          <Row label="Colour">
            <ColorField value={fs.fill} inherited={obj.style.fill ?? theme.fill} allowInherit onChange={(v, l) => setFace(f => void (f.fill = v), live(`${faceKey}-fill`, l))} />
          </Row>
          <Toggle
            on={!!dots?.enabled}
            onChange={v =>
              setFace(f => {
                if (!f.dots) f.dots = defaultDots();
                f.dots.enabled = v;
              })
            }
          >
            Dotted fill
          </Toggle>
          {dots?.enabled && (
            <>
              <Row label="Pattern">
                <Seg value={dots.pattern} options={[{ value: 'grid', label: 'Grid' }, { value: 'stagger', label: 'Stagger' }]} onChange={v => setDots(d => void (d.pattern = v), 'pat')} />
              </Row>
              <Row label="Dot">
                <Seg value={dots.shape} options={[{ value: 'circle', label: 'Round' }, { value: 'square', label: 'Square' }]} onChange={v => setDots(d => void (d.shape = v), 'shape')} />
              </Row>
              <Row label="Spacing">
                <NumberField value={dots.spacing} min={0.5} step={0.25} onChange={(v, l) => setDots(d => void (d.spacing = v), 'sp', l)} />
              </Row>
              <Row label="Size">
                <div className="grid2">
                  <NumberField label="MAX" value={dots.size} min={0.02} step={0.05} onChange={(v, l) => setDots(d => void (d.size = v), 'sz', l)} title="Dot radius at full strength" />
                  <NumberField label="MIN" value={dots.sizeMin} min={0} step={0.05} onChange={(v, l) => setDots(d => void (d.sizeMin = v), 'szm', l)} title="Dot radius at none (halftones)" />
                </div>
              </Row>
              <Row label="Colour">
                <ColorField value={dots.color || null} inherited={theme.dot} allowInherit onChange={(v, l) => setDots(d => void (d.color = v ?? ''), 'col', l)} />
              </Row>
              <Row label="Opacity">
                <div className="grid2">
                  <NumberField label="MAX" value={dots.opacity} min={0} max={1} step={0.05} onChange={(v, l) => setDots(d => void (d.opacity = v), 'op', l)} />
                  <NumberField label="MIN" value={dots.opacityMin} min={0} max={1} step={0.05} onChange={(v, l) => setDots(d => void (d.opacityMin = v), 'opm', l)} />
                </div>
              </Row>
              <Row label="Inset">
                <div className="grid2">
                  <NumberField label="IN" value={dots.inset} min={0} step={0.5} onChange={(v, l) => setDots(d => void (d.inset = v), 'in', l)} title="Keep dots this far from the edges" />
                  <NumberField label="∠" value={dots.angle} step={1} unit="°" onChange={(v, l) => setDots(d => void (d.angle = v), 'ang', l)} title="Turn the grid" />
                </div>
              </Row>
              <div className="sub">Halftone</div>
              <Row label="Gradient">
                <Select
                  value={dots.gradient.type}
                  options={[
                    { value: 'none', label: 'None (even dots)' },
                    { value: 'linear', label: 'Linear' },
                    { value: 'radial', label: 'Radial' },
                    { value: 'wave', label: 'Wave' },
                    { value: 'noise', label: 'Noise' },
                  ]}
                  onChange={v => setGrad(g => void (g.type = v), 'type')}
                />
              </Row>
              {dots.gradient.type !== 'none' && (
                <>
                  <Row label="Drives">
                    <Seg
                      value={dots.gradient.affects}
                      options={[
                        { value: 'size', label: 'Size' },
                        { value: 'opacity', label: 'Fade' },
                        { value: 'both', label: 'Both' },
                      ]}
                      onChange={v => setGrad(g => void (g.affects = v), 'aff')}
                    />
                  </Row>
                  {(dots.gradient.type === 'linear' || dots.gradient.type === 'wave') && (
                    <Row label="Angle">
                      <NumberField value={dots.gradient.angle} step={5} unit="°" onChange={(v, l) => setGrad(g => void (g.angle = v), 'ang', l)} />
                    </Row>
                  )}
                  {dots.gradient.type === 'linear' && (
                    <Row label="Ramp">
                      <div className="grid2">
                        <NumberField label="FROM" value={dots.gradient.start} step={0.05} onChange={(v, l) => setGrad(g => void (g.start = v), 'st', l)} />
                        <NumberField label="TO" value={dots.gradient.end} step={0.05} onChange={(v, l) => setGrad(g => void (g.end = v), 'en', l)} />
                      </div>
                    </Row>
                  )}
                  {dots.gradient.type === 'radial' && (
                    <>
                      <Row label="Centre">
                        <div className="grid2">
                          <NumberField label="X" value={dots.gradient.cx} step={0.05} onChange={(v, l) => setGrad(g => void (g.cx = v), 'cx', l)} />
                          <NumberField label="Y" value={dots.gradient.cy} step={0.05} onChange={(v, l) => setGrad(g => void (g.cy = v), 'cy', l)} />
                        </div>
                      </Row>
                      <Row label="Reach">
                        <NumberField value={dots.gradient.radius} min={0.01} step={0.05} onChange={(v, l) => setGrad(g => void (g.radius = v), 'rad', l)} />
                      </Row>
                    </>
                  )}
                  {(dots.gradient.type === 'wave' || dots.gradient.type === 'noise') && (
                    <Row label="Scale">
                      <div className="grid2">
                        <NumberField label="F" value={dots.gradient.frequency} min={0.1} step={0.1} onChange={(v, l) => setGrad(g => void (g.frequency = v), 'fr', l)} title="Bands or blobs across the face" />
                        {dots.gradient.type === 'wave' ? (
                          <NumberField label="φ" value={dots.gradient.phase} step={0.05} onChange={(v, l) => setGrad(g => void (g.phase = v), 'ph', l)} title="Shift the wave" />
                        ) : (
                          <NumberField label="SEED" value={dots.gradient.seed} step={1} places={0} onChange={(v, l) => setGrad(g => void (g.seed = Math.round(v)), 'sd', l)} />
                        )}
                      </div>
                    </Row>
                  )}
                  <Toggle on={dots.gradient.invert} onChange={v => setGrad(g => void (g.invert = v), 'inv')}>
                    Invert
                  </Toggle>
                </>
              )}
              <div className="sub">Area</div>
              <Toggle
                on={!!dots.region}
                onChange={v => setDots(d => void (d.region = v ? { x: 0.5, y: 0.5, w: 0.3, h: 0.3 } : null), 'reg')}
              >
                Fill only part of the face
              </Toggle>
              {dots.region && (
                <>
                  <Row label="Centre">
                    <div className="grid2">
                      <NumberField label="X" value={dots.region.x} step={0.02} onChange={(v, l) => setDots(d => void (d.region!.x = v), 'rx', l)} />
                      <NumberField label="Y" value={dots.region.y} step={0.02} onChange={(v, l) => setDots(d => void (d.region!.y = v), 'ry', l)} />
                    </div>
                  </Row>
                  <Row label="Size">
                    <div className="grid2">
                      <NumberField label="W" value={dots.region.w} min={0.01} step={0.02} onChange={(v, l) => setDots(d => void (d.region!.w = v), 'rw', l)} />
                      <NumberField label="H" value={dots.region.h} min={0.01} step={0.02} onChange={(v, l) => setDots(d => void (d.region!.h = v), 'rh', l)} />
                    </div>
                  </Row>
                </>
              )}
              <button
                className="btn ghost small"
                onClick={() =>
                  setFace(f => {
                    f.dots = { ...defaultDots(), gradient: { ...defaultGradient() } };
                  })
                }
              >
                Reset this fill
              </button>
            </>
          )}
          {(fs.fill || dots) && (
            <button className="btn small danger" onClick={() => setFace(f => Object.assign(f, emptyFace()))}>
              Clear this face
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function DecalEditor({ obj, up, theme }: { obj: SceneObject; up: (fn: (o: SceneObject) => void, key?: string) => void; theme: Theme }) {
  const notify = useStore(s => s.notify);
  const dc = obj.decal;
  const set = (fn: (d: NonNullable<SceneObject['decal']>) => void, k: string, l = false) => up(o => o.decal && fn(o.decal), live(`dc-${k}`, l));
  const size = (() => {
    const b = shapeOf(obj.shape).bounds;
    return Math.round(Math.min(b.maxX - b.minX, b.maxY - b.minY) * 0.6);
  })();
  const loadSvg = (file: File) => {
    file.text().then(text => {
      const paths = importSvg(text);
      if (!paths.length) {
        notify('No shapes found in that SVG');
        setTimeout(() => notify(null), 2400);
        return;
      }
      up(o => {
        o.decal = { kind: 'svg', text: '', paths, source: file.name, x: 0, y: 0, size, rotation: -45, mode: 'fill', color: null, width: null, opacity: 1 };
      });
    });
  };
  return (
    <Section title="Top decal" defaultOpen={!!dc}>
      <div className="note">A mark laid flat on the top face: the Strike logo, a mark from an SVG file, or a few words.</div>
      <div className="actions">
        <button
          className={`btn small soft${dc?.kind === 'strike' ? ' on' : ''}`}
          onClick={() => up(o => void (o.decal = { kind: 'strike', text: '', paths: [], source: 'Strike logo', x: 0, y: 0, size, rotation: -45, mode: 'stroke', color: null, width: null, opacity: 1 }))}
        >
          Strike logo
        </button>
        <label className="btn small ghost">
          <IconUpload /> SVG…
          <input type="file" accept=".svg,image/svg+xml" hidden onChange={e => e.target.files?.[0] && loadSvg(e.target.files[0])} />
        </label>
        {dc && (
          <button className="btn small danger" onClick={() => up(o => void (o.decal = null))}>
            Remove
          </button>
        )}
      </div>
      {dc && (
        <>
          <Row label="Mark">
            <span className="note">{dc.kind === 'strike' ? 'Strike logo' : dc.source}</span>
          </Row>
          <Row label="Centre">
            <div className="grid2">
              <NumberField label="X" value={dc.x} onChange={(v, l) => set(d => void (d.x = v), 'x', l)} />
              <NumberField label="Z" value={dc.y} onChange={(v, l) => set(d => void (d.y = v), 'y', l)} />
            </div>
          </Row>
          <Row label="Size">
            <div className="grid2">
              <NumberField label="S" value={dc.size} min={0.5} onChange={(v, l) => set(d => void (d.size = v), 's', l)} />
              <NumberField label="∠" value={dc.rotation} step={5} unit="°" onChange={(v, l) => set(d => void (d.rotation = v), 'r', l)} />
            </div>
          </Row>
          <Row label="Draw as">
            <Seg value={dc.mode} options={[{ value: 'stroke', label: 'Lines' }, { value: 'fill', label: 'Solid' }]} onChange={v => set(d => void (d.mode = v), 'm')} />
          </Row>
          <Row label="Colour">
            <ColorField value={dc.color} inherited={dc.mode === 'stroke' ? obj.style.crease ?? theme.crease : theme.accent} allowInherit onChange={(v, l) => set(d => void (d.color = v), 'c', l)} />
          </Row>
          <Row label="Opacity">
            <NumberField value={dc.opacity} min={0} max={1} step={0.05} onChange={(v, l) => set(d => void (d.opacity = v), 'o', l)} />
          </Row>
        </>
      )}
    </Section>
  );
}
