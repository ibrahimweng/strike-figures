/* Choosing a post's illustration: the Library, or one of My figures. */
import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, type Category, LIBRARY } from '../library';
import { useStore } from '../model/store';
import type { Scene } from '../model/types';
import { Seg } from '../ui/controls';
import { useLibraryThumb, useSceneThumb } from '../ui/thumbs';
import type { FigureRef } from './types';

export function Picker({ current, onPick, onClose }: { current: FigureRef; onPick: (ref: FigureRef) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'library' | 'mine'>(current.kind === 'mine' ? 'mine' : 'library');
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [q, setQ] = useState('');
  const scenes = useStore(s => s.scenes);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const items = useMemo(() => {
    const ws = q.toLowerCase().split(/\s+/).filter(Boolean);
    return LIBRARY.filter(it => (cat === 'all' || it.category === cat) && ws.every(w => `${it.title} ${it.tags.join(' ')} ${it.category} ${it.code}`.toLowerCase().includes(w)));
  }, [cat, q]);
  const mine = scenes.filter(sc => words.every(w => `${sc.name} ${sc.label}`.toLowerCase().includes(w)));
  return (
    <div className="scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="tp-picker" role="dialog" aria-label="Choose an illustration" data-testid="picker">
        <div className="tp-picker-top">
          <h2>Choose an illustration</h2>
          <button className="btn small soft" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="tp-picker-bar">
          <Seg
            value={tab}
            options={[
              { value: 'library', label: `Library` },
              { value: 'mine', label: 'My figures' },
            ]}
            onChange={setTab}
          />
          <input className="search" placeholder={tab === 'library' ? `Search ${LIBRARY.length} illustrations` : 'Search your figures'} value={q} onChange={e => setQ(e.target.value)} autoFocus aria-label="Search" />
        </div>
        {tab === 'library' && (
          <div className="chips tp-picker-cats" role="radiogroup" aria-label="Category">
            {[{ id: 'all' as const, label: 'All' }, ...CATEGORIES].map(c => (
              <button key={c.id} className={`chip${cat === c.id ? ' on' : ''}`} onClick={() => setCat(c.id)} role="radio" aria-checked={cat === c.id}>
                {c.label}
              </button>
            ))}
          </div>
        )}
        <div className="tp-picker-grid gallery">
          {tab === 'library' &&
            items.map(it => (
              <LibraryPick
                key={it.id}
                id={it.id}
                code={it.code}
                title={it.title}
                active={current.kind === 'library' && current.id === it.id}
                onPick={() => onPick({ kind: 'library', id: it.id })}
              />
            ))}
          {tab === 'mine' &&
            mine.map(sc => (
              <MinePick
                key={sc.id}
                sc={sc}
                active={current.kind === 'mine' && current.id === sc.id}
                onPick={() => onPick({ kind: 'mine', id: sc.id, name: sc.name, snapshot: structuredClone(sc) })}
              />
            ))}
        </div>
        {tab === 'library' && !items.length && <div className="empty">Nothing matches “{q}”.</div>}
        {tab === 'mine' && !mine.length && <div className="empty">{q ? `Nothing matches “${q}”.` : 'Figures you make in Figures show up here.'}</div>}
      </div>
    </div>
  );
}

function LibraryPick({ id, code, title, active, onPick }: { id: string; code: string; title: string; active: boolean; onPick: () => void }) {
  const url = useLibraryThumb(id);
  return (
    <button className={`thumb${active ? ' active' : ''}`} onClick={onPick} title={`Use “${title}”`} data-testid={`pick-${id}`}>
      <span className="pic">{url && <img src={url} alt="" loading="lazy" draggable={false} />}</span>
      <span className="meta">
        <span className="code">{code}</span>
        <span className="name">{title}</span>
      </span>
    </button>
  );
}

function MinePick({ sc, active, onPick }: { sc: Scene; active: boolean; onPick: () => void }) {
  const url = useSceneThumb(sc);
  return (
    <button className={`thumb${active ? ' active' : ''}`} onClick={onPick} title={`Use “${sc.name}”`}>
      <span className="pic">{url && <img src={url} alt="" draggable={false} />}</span>
      <span className="meta">
        {sc.label && <span className="code">{sc.label}</span>}
        <span className="name">{sc.name}</span>
      </span>
    </button>
  );
}
