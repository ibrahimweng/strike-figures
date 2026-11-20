/* The left panel: the figures you have, and the objects in the open one. */
import { useRef } from 'react';
import { useStore } from '../model/store';
import type { Scene } from '../model/types';
import { IconCopy, IconEye, IconLock, IconPlus, IconReset, IconTrash, IconUpload } from './icons';

export function LeftPanel() {
  const scenes = useStore(s => s.scenes);
  const activeId = useStore(s => s.activeId);
  const setActive = useStore(s => s.setActive);
  const newScene = useStore(s => s.newScene);
  const duplicateScene = useStore(s => s.duplicateScene);
  const removeScene = useStore(s => s.removeScene);
  const resetPreset = useStore(s => s.resetPreset);
  const importScene = useStore(s => s.importScene);
  const notify = useStore(s => s.notify);
  const file = useRef<HTMLInputElement>(null);

  const open = (f: File) =>
    f.text().then(text => {
      try {
        const data = JSON.parse(text) as Partial<Scene> & { figure?: Partial<Scene> };
        importScene((data.figure ?? data) as Scene);
      } catch {
        notify('That file is not a saved figure');
        setTimeout(() => notify(null), 2400);
      }
    });

  return (
    <aside className="left" data-testid="left">
      <div className="panel-head">
        Figures
        <span className="actions">
          <button className="btn icon small" title="Open a saved figure (.json)" onClick={() => file.current?.click()}>
            <IconUpload />
          </button>
          <button className="btn icon small" title="New figure" onClick={newScene}>
            <IconPlus />
          </button>
        </span>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={e => e.target.files?.[0] && open(e.target.files[0])} />
      </div>
      <div className="list" role="listbox" aria-label="Figures">
        {scenes.map(sc => (
          <div key={sc.id} className={`item${sc.id === activeId ? ' active' : ''}`} role="option" aria-selected={sc.id === activeId} onClick={() => setActive(sc.id)} data-testid={`figure-${sc.preset ?? sc.id}`}>
            <span className="tag">{sc.label}</span>
            <span className="name">{sc.name}</span>
            <span className="mini" onClick={e => e.stopPropagation()}>
              {sc.preset && (
                <button className="btn icon small" title="Reset to how it shipped" onClick={() => resetPreset(sc.id)}>
                  <IconReset />
                </button>
              )}
              <button className="btn icon small" title="Duplicate figure" onClick={() => duplicateScene(sc.id)}>
                <IconCopy />
              </button>
              <button
                className="btn icon small danger"
                title="Delete figure"
                onClick={() => {
                  if (window.confirm(`Delete “${sc.name}”? This can't be undone.`)) removeScene(sc.id);
                }}
              >
                <IconTrash />
              </button>
            </span>
          </div>
        ))}
      </div>
      <Layers />
    </aside>
  );
}

function Layers() {
  const scene = useStore(s => s.scenes.find(x => x.id === s.activeId) ?? s.scenes[0]!);
  const selection = useStore(s => s.selection);
  const select = useStore(s => s.select);
  const updateObject = useStore(s => s.updateObject);
  const objects = scene.objects.slice().reverse();
  return (
    <div className="layers">
      <div className="panel-head">
        Objects <span style={{ color: 'var(--faint)' }}>{scene.objects.length}</span>
      </div>
      <div className="list" role="listbox" aria-label="Objects">
        {!objects.length && <div className="empty">No objects yet. Add a box, slab, fin or chevron from the top bar.</div>}
        {objects.map(o => (
          <div key={o.id} className={`item${o.id === selection.objectId ? ' active' : ''}`} role="option" aria-selected={o.id === selection.objectId} onClick={() => select(o.id)}>
            <button
              className="btn icon small"
              title={o.visible ? 'Hide' : 'Show'}
              onClick={e => {
                e.stopPropagation();
                updateObject(o.id, x => void (x.visible = !x.visible));
              }}
            >
              <IconEye off={!o.visible} />
            </button>
            <span className={`name${o.visible ? '' : ' muted'}`}>{o.name}</span>
            <button
              className="btn icon small"
              style={{ opacity: o.locked ? 1 : undefined }}
              title={o.locked ? 'Unlock' : 'Lock'}
              onClick={e => {
                e.stopPropagation();
                updateObject(o.id, x => void (x.locked = !x.locked));
              }}
            >
              {o.locked ? <IconLock /> : <span className="mini">
                  <IconLock open />
                </span>}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
