/* The left panel: the Library to pick from, your own figures, and (in
   Advanced) the objects in the open figure. */
import { useMemo, useRef, useState } from 'react';
import { CATEGORIES, type Category, LIBRARY } from '../library';
import { useStore } from '../model/store';
import type { Scene } from '../model/types';
import { Seg } from './controls';
import { IconCopy, IconEye, IconLock, IconPlus, IconReset, IconTrash, IconUpload } from './icons';
import { useLibraryThumb, useSceneThumb } from './thumbs';

export function LeftPanel() {
  const tab = useStore(s => s.tab);
  const setTab = useStore(s => s.setTab);
  const advanced = useStore(s => s.advanced);
  const options = [
    { value: 'library' as const, label: 'Library' },
    { value: 'mine' as const, label: 'My figures' },
    ...(advanced ? [{ value: 'objects' as const, label: 'Objects' }] : []),
  ];
  const current = !advanced && tab === 'objects' ? 'library' : tab;
  return (
    <aside className="left card" data-testid="left">
      {current === 'library' && <Library tabs={<Seg value={current} options={options} onChange={setTab} />} />}
      {current === 'mine' && <Mine tabs={<Seg value={current} options={options} onChange={setTab} />} />}
      {current === 'objects' && <Objects tabs={<Seg value={current} options={options} onChange={setTab} />} />}
    </aside>
  );
}

function Library({ tabs }: { tabs: React.ReactNode }) {
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [q, setQ] = useState('');
  const previewId = useStore(s => s.previewId);
  const open = useStore(s => s.openLibrary);
  const activePreset = useStore(s => (s.preview ? null : s.scenes.find(x => x.id === s.activeId)?.preset ?? null));
  const items = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return LIBRARY.filter(it => (cat === 'all' || it.category === cat) && words.every(w => `${it.title} ${it.tags.join(' ')} ${it.category}`.toLowerCase().includes(w)));
  }, [cat, q]);
  return (
    <>
      <div className="panel-top">
        {tabs}
        <input className="search" placeholder={`Search ${LIBRARY.length} illustrations`} value={q} onChange={e => setQ(e.target.value)} aria-label="Search the library" />
        <div className="chips" role="radiogroup" aria-label="Category">
          {[{ id: 'all' as const, label: 'All' }, ...CATEGORIES].map(c => (
            <button key={c.id} className={`chip${cat === c.id ? ' on' : ''}`} onClick={() => setCat(c.id)} role="radio" aria-checked={cat === c.id}>
              {c.label}
            </button>
          ))}
        </div>
      </div>
      {!items.length && <div className="empty">Nothing matches “{q}”.</div>}
      <div className="gallery" data-testid="library">
        {items.map(it => (
          <LibraryCard key={it.id} id={it.id} code={it.code} title={it.title} active={previewId === it.id || activePreset === `lib:${it.id}`} onOpen={() => open(it.id)} />
        ))}
      </div>
    </>
  );
}

function LibraryCard({ id, code, title, active, onOpen }: { id: string; code: string; title: string; active: boolean; onOpen: () => void }) {
  const url = useLibraryThumb(id);
  return (
    <button className={`thumb${active ? ' active' : ''}`} onClick={onOpen} data-testid={`lib-${id}`} title={`Open “${title}”`}>
      <span className="pic">{url && <img src={url} alt="" loading="lazy" draggable={false} />}</span>
      <span className="meta">
        <span className="code">{code}</span>
        <span className="name">{title}</span>
      </span>
    </button>
  );
}

function Mine({ tabs }: { tabs: React.ReactNode }) {
  const scenes = useStore(s => s.scenes);
  const activeId = useStore(s => (s.preview ? null : s.activeId));
  const advanced = useStore(s => s.advanced);
  const { setActive, newScene, importScene, notify } = useStore.getState();
  const file = useRef<HTMLInputElement>(null);
  const openFile = (f: File) =>
    f.text().then(text => {
      try {
        const data = JSON.parse(text) as Partial<Scene> & { figure?: Partial<Scene> };
        importScene((data.figure ?? data) as Scene);
      } catch {
        notify('That file is not a saved figure');
      }
    });
  return (
    <>
      <div className="panel-top">
        {tabs}
        <div className="actions">
          <button className="btn soft small" onClick={() => file.current?.click()} title="Open a figure you saved as a file">
            <IconUpload /> Open file
          </button>
          {advanced && (
            <button className="btn soft small" onClick={newScene} title="Start an empty figure">
              <IconPlus /> Blank figure
            </button>
          )}
          <input ref={file} type="file" accept=".json,application/json" hidden onChange={e => e.target.files?.[0] && openFile(e.target.files[0])} />
        </div>
      </div>
      <div className="gallery" data-testid="mine">
        {scenes.map(sc => (
          <MineCard key={sc.id} sc={sc} active={sc.id === activeId} onOpen={() => setActive(sc.id)} />
        ))}
      </div>
      <div className="empty">Changes save here as you go. Pick something in the Library to start a new one.</div>
    </>
  );
}

function MineCard({ sc, active, onOpen }: { sc: Scene; active: boolean; onOpen: () => void }) {
  const url = useSceneThumb(sc);
  const { duplicateScene, removeScene, resetPreset } = useStore.getState();
  return (
    <div className={`thumb${active ? ' active' : ''}`}>
      <div className="pic" role="button" tabIndex={0} onClick={onOpen} onKeyDown={e => e.key === 'Enter' && onOpen()} style={{ cursor: 'pointer' }} title={`Open “${sc.name}”`}>
        {url && <img src={url} alt="" draggable={false} />}
        <span className="tools-over" onClick={e => e.stopPropagation()}>
          {sc.preset && (
            <button className="btn icon small" title="Undo all changes: back to how it came" onClick={() => resetPreset(sc.id)}>
              <IconReset />
            </button>
          )}
          <button className="btn icon small" title="Make a copy" onClick={() => duplicateScene(sc.id)}>
            <IconCopy />
          </button>
          <button
            className="btn icon small danger"
            title="Delete"
            onClick={() => {
              if (window.confirm(`Delete “${sc.name}”? This can't be undone.`)) removeScene(sc.id);
            }}
          >
            <IconTrash />
          </button>
        </span>
      </div>
      <span className="meta">
        {sc.label && <span className="code">{sc.label}</span>}
        <span className="name">{sc.name}</span>
      </span>
    </div>
  );
}

function Objects({ tabs }: { tabs: React.ReactNode }) {
  const scene = useStore(s => s.scene());
  const selection = useStore(s => s.selection);
  const { select, updateObject } = useStore.getState();
  const objects = scene.objects.slice().reverse();
  return (
    <>
      <div className="panel-top">
        {tabs}
        <span className="note">{scene.objects.length} objects, nearest first. Add shapes from the top bar.</span>
      </div>
      <div className="list" role="listbox" aria-label="Objects">
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
              title={o.locked ? 'Unlock' : 'Lock'}
              onClick={e => {
                e.stopPropagation();
                updateObject(o.id, x => void (x.locked = !x.locked));
              }}
            >
              {o.locked ? (
                <IconLock />
              ) : (
                <span className="mini">
                  <IconLock open />
                </span>
              )}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
