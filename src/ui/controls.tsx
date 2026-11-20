/* Controls, in Strike's style. The everyday ones are a slider row (label,
   slider, value you can type), chips and switches. A drag on a slider is one
   undo step. The advanced ones are number fields you can type or scrub,
   colour fields and selects. */
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { IconChev } from './icons';

export function Section({ title, children, defaultOpen = true, extra }: { title: string; children: ReactNode; defaultOpen?: boolean; extra?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`section${open ? '' : ' closed'}`}>
      <button className="title" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{title}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {extra}
          <span className="chev">
            <IconChev />
          </span>
        </span>
      </button>
      <div className="body">{children}</div>
    </div>
  );
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="row">
      <span className="label" title={label}>
        {label}
      </span>
      {children}
    </div>
  );
}

const fmt = (v: number, places: number) => {
  const k = 10 ** places;
  return String(Math.round(v * k) / k);
};

/** A label, a slider and a value box you can type into. */
export function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  places = 0,
  unit = '',
  onChange,
  title,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  places?: number;
  unit?: string;
  onChange: (v: number, live: boolean) => void;
  title?: string;
}) {
  const [text, setText] = useState(fmt(value, places) + unit);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(fmt(value, places) + unit);
  }, [value, places, unit, editing]);
  const fill = `${(Math.max(0, Math.min(1, (value - min) / (max - min))) * 100).toFixed(1)}%`;
  return (
    <div className="srow" title={title}>
      <span className="label">{label}</span>
      <input
        className="slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.max(min, Math.min(max, value))}
        style={{ ['--fill' as string]: fill }}
        onChange={e => onChange(Number(e.target.value), true)}
        aria-label={label}
      />
      <input
        className="vbox"
        value={text}
        inputMode="decimal"
        onFocus={e => {
          setEditing(true);
          setText(fmt(value, places));
          e.target.select();
        }}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          setEditing(false);
          const v = Number(text.replace(unit, ''));
          if (Number.isFinite(v)) onChange(Math.max(min, Math.min(max, v)), false);
        }}
        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label={`${label} value`}
      />
    </div>
  );
}

export function NumberField({
  value,
  onChange,
  label,
  step = 1,
  min = -Infinity,
  max = Infinity,
  places = 2,
  unit,
  title,
}: {
  value: number;
  onChange: (v: number, live: boolean) => void;
  label?: string;
  step?: number;
  min?: number;
  max?: number;
  places?: number;
  unit?: string;
  title?: string;
}) {
  const [text, setText] = useState(fmt(value, places));
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    if (!editing) setText(fmt(value, places));
  }, [value, places, editing]);
  const clampv = (v: number) => Math.min(max, Math.max(min, v));
  const commit = () => {
    setEditing(false);
    const v = Number(text);
    if (Number.isFinite(v)) onChange(clampv(v), false);
    else setText(fmt(value, places));
  };
  const start = useRef<{ x: number; v: number } | null>(null);
  return (
    <label className="num" title={title}>
      {label && (
        <span
          className="scrub"
          onPointerDown={e => {
            e.preventDefault();
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            start.current = { x: e.clientX, v: value };
          }}
          onPointerMove={e => {
            if (!start.current) return;
            const dx = e.clientX - start.current.x;
            const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
            onChange(clampv(Number(fmt(start.current.v + Math.round(dx / 2) * step * mult, places))), true);
          }}
          onPointerUp={() => (start.current = null)}
        >
          {label}
        </span>
      )}
      <input
        value={text}
        inputMode="decimal"
        onFocus={e => {
          setEditing(true);
          e.target.select();
        }}
        onChange={e => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const v = clampv(value + (e.key === 'ArrowUp' ? 1 : -1) * step * (e.shiftKey ? 10 : 1));
            onChange(Number(fmt(v, places)), false);
            setText(fmt(v, places));
          }
        }}
        style={label ? undefined : { paddingLeft: 10 }}
      />
      {unit && <span className="unit">{unit}</span>}
    </label>
  );
}

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
const normHex = (v: string) => {
  let h = v.replace('#', '');
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  return `#${h.toUpperCase()}`;
};

export function ColorField({
  value,
  inherited,
  onChange,
  allowInherit = false,
}: {
  value: string | null;
  inherited?: string;
  onChange: (v: string | null, live: boolean) => void;
  allowInherit?: boolean;
}) {
  const shown = value ?? inherited ?? '#000000';
  const [text, setText] = useState(shown);
  useEffect(() => setText(shown), [shown]);
  return (
    <div className="color">
      <span className="swatch" style={{ background: shown, opacity: value === null ? 0.55 : 1 }}>
        <input type="color" value={normHex(HEX.test(shown) ? shown : '#000000').toLowerCase()} onChange={e => onChange(normHex(e.target.value), true)} aria-label="Pick a colour" />
      </span>
      <input
        className="hex"
        value={value === null ? '' : text}
        placeholder={value === null ? `${(inherited ?? '').toUpperCase()}` : ''}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          if (HEX.test(text)) onChange(normHex(text), false);
          else if (allowInherit && text.trim() === '') onChange(null, false);
          else setText(shown);
        }}
        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label="Hex colour"
      />
      {allowInherit && value !== null && (
        <button className="inherit" onClick={() => onChange(null, false)} title="Use the theme's colour">
          THEME
        </button>
      )}
      {allowInherit && value === null && <span className="inherit">THEME</span>}
    </div>
  );
}

export function Select<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <select className="select" value={value} onChange={e => onChange(e.target.value as T)}>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Seg<T extends string>({
  value,
  options,
  onChange,
  accent,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  accent?: boolean;
}) {
  return (
    <div className={`seg${accent ? ' accent' : ''}`} role="radiogroup">
      {options.map(o => (
        <button key={o.value} className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)} role="radio" aria-checked={o.value === value} title={o.title}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ value, options, onChange }: { value: T | null; options: { value: T; label: ReactNode; swatch?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="chips" role="radiogroup">
      {options.map(o => (
        <button key={o.value} className={`chip${o.value === value ? ' on' : ''}`} onClick={() => onChange(o.value)} role="radio" aria-checked={o.value === value}>
          {o.swatch && <span className="sw" style={{ background: o.swatch }} />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button className={`toggle${on ? ' on' : ''}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span>{children}</span>
      <span className="switch" />
    </button>
  );
}

export function TextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <input
      className="text"
      value={text}
      placeholder={placeholder}
      onChange={e => setText(e.target.value)}
      onBlur={() => text !== value && onChange(text)}
      onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
    />
  );
}
