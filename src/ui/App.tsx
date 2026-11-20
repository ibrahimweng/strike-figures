import { type ReactElement, useEffect, useState } from 'react';
import { renderScene } from '../engine/render';
import { KINDS, type Kind } from '../model/defaults';
import { useStore } from '../model/store';
import { useThread } from '../social/store';
import { ModeSwitch, ThreadActions, ThreadTool } from '../social/ThreadTool';
import { SkillPage } from '../skill/SkillPage';
import { Canvas } from './Canvas';
import { ExportDialog, saveFigure } from './ExportDialog';
import { IconBox, IconChevron, IconCylinder, IconDownload, IconFin, IconHex, IconRedo, IconSlab, IconUndo, StrikeMark } from './icons';
import { Inspector } from './Inspector';
import { LeftPanel } from './Panels';
import { fitCamera, VIEWS } from './view';

const ADD: { kind: Kind; icon: () => ReactElement }[] = [
  { kind: 'box', icon: IconBox },
  { kind: 'slab', icon: IconSlab },
  { kind: 'fin', icon: IconFin },
  { kind: 'cylinder', icon: IconCylinder },
  { kind: 'hexagon', icon: IconHex },
  { kind: 'chevron', icon: IconChevron },
];

export function App() {
  const scene = useStore(s => s.scene());
  const previewing = useStore(s => !!s.preview);
  const advanced = useStore(s => s.advanced);
  const canUndo = useStore(s => !s.preview && (s.past[s.activeId]?.length ?? 0) > 0);
  const canRedo = useStore(s => !s.preview && (s.future[s.activeId]?.length ?? 0) > 0);
  const { add, undo, redo, setAdvanced, update } = useStore.getState();
  const [exporting, setExporting] = useState(false);
  const mode = useThread(s => s.mode);
  const threadMode = mode === 'thread';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, select, textarea, [contenteditable]')) return;
      if (exporting || useThread.getState().mode !== 'figures') return;
      const st = useStore.getState();
      const mod = e.metaKey || e.ctrlKey;
      const sel = st.selection.objectId;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        st.redo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        st.duplicate();
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveFigure(st.scene());
      } else if (mod && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setExporting(true);
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
        e.preventDefault();
        st.remove();
      } else if (e.key === 'Escape') {
        st.select(null);
      } else if (e.key.startsWith('Arrow') && sel && st.advanced) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
        const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        const [dx, dz] = d[e.key]!;
        st.updateObject(sel, o => void (o.position = [o.position[0] + dx, o.position[1], o.position[2] + dz]), 'nudge');
      } else if ((e.key === 'PageUp' || e.key === 'PageDown') && sel && st.advanced) {
        e.preventDefault();
        const step = (e.shiftKey ? 10 : 1) * (e.key === 'PageUp' ? 1 : -1);
        st.updateObject(sel, o => void (o.position = [o.position[0], o.position[1] + step, o.position[2]]), 'nudge');
      } else if (e.key === '[' || e.key === ']') {
        st.update(s => void (s.camera.yaw = ((s.camera.yaw + (e.key === ']' ? 15 : -15) + 540) % 360) - 180), 'turn');
      } else if (!mod && e.key.toLowerCase() === 'f') {
        const sc = st.scene();
        const cam = fitCamera(sc, renderScene(sc));
        if (cam) st.update(s => void (s.camera = cam));
      } else if (!mod && e.key.toLowerCase() === 'p') {
        st.setPlaying(!st.playing);
      } else if (!mod) {
        const v = VIEWS.find(x => x.key === e.key);
        if (v)
          st.update(s => {
            s.camera.yaw = v.yaw;
            s.camera.pitch = v.pitch;
          });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exporting]);

  /* Skill: the Strike design skill, where everyone lands */
  if (mode === 'skill')
    return (
      <div className="app app-page">
        <header className="top">
          <div className="brand">
            <StrikeMark size={20} />
            <span className="word">STRIKE</span>
          </div>
          <ModeSwitch />
          <span className="spacer" />
        </header>
        <SkillPage />
      </div>
    );

  /* Thread mode: the X thread maker (src/social) in place of the editor */
  if (threadMode)
    return (
      <div className="app">
        <header className="top">
          <div className="brand">
            <StrikeMark size={20} />
            <span className="word">STRIKE</span>
          </div>
          <ModeSwitch />
          <span className="spacer" />
          <ThreadActions />
        </header>
        <ThreadTool />
      </div>
    );

  return (
    <div className="app">
      <header className="top">
        <div className="brand">
          <StrikeMark size={20} />
          <span className="word">STRIKE</span>
        </div>
        <ModeSwitch />
        <input
          key={scene.id}
          className="title-field"
          defaultValue={scene.name}
          aria-label="Figure name"
          onBlur={e => e.target.value.trim() && e.target.value !== scene.name && update(s => void (s.name = e.target.value.trim()))}
          onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />
        {previewing && <span className="preview-pill">From the Library · your changes save to My figures</span>}
        <span className="spacer" />
        {advanced && (
          <div className="tools" role="toolbar" aria-label="Add a shape">
            {ADD.map(({ kind, icon: Icon }) => (
              <button key={kind} className="btn small" onClick={() => add(kind)} title={`Add a ${KINDS[kind].label.toLowerCase()}`} data-testid={`add-${kind}`}>
                <Icon /> <span>{KINDS[kind].label}</span>
              </button>
            ))}
          </div>
        )}
        <button className="btn icon" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)" aria-label="Undo">
          <IconUndo />
        </button>
        <button className="btn icon" onClick={redo} disabled={!canRedo} title="Redo (⇧⌘Z)" aria-label="Redo">
          <IconRedo />
        </button>
        <button className={`adv${advanced ? ' on' : ''}`} onClick={() => setAdvanced(!advanced)} role="switch" aria-checked={advanced} title="Show every setting">
          Advanced <span className={`switch${advanced ? ' on' : ''}`} />
        </button>
        {advanced && (
          <button className="btn soft" onClick={() => saveFigure(scene)} title="Save this figure as a file (⌘S)">
            Save file
          </button>
        )}
        <button className="btn primary" onClick={() => setExporting(true)} data-testid="export" title="Download as SVG or PNG (⌘E)">
          <IconDownload /> Export
        </button>
      </header>
      <LeftPanel />
      <Canvas />
      <Inspector />
      {exporting && <ExportDialog scene={scene} onClose={() => setExporting(false)} />}
    </div>
  );
}
