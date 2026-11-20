/* Pieces the Skill pages share: where the skill's files live, the link to
   share, copying, and the small parts (copy box, hover detail, icons). */
import { type ReactNode, useState } from 'react';

export const REPO = 'ibrahimweng/strike-figures';
export const GITHUB = `https://github.com/${REPO}`;
export const COMMAND = `npx skills add ${REPO}`;

export interface FileRef {
  path: string;
  label: string;
  bytes?: number;
}
export interface Colour {
  token: string;
  hex: string;
  use: string;
}
export interface Manifest {
  version: string;
  updated: string;
  universal: string;
  targets: { id: string; name: string; summary: string; steps: string[]; files: FileRef[] }[];
  downloads: FileRef[];
  logos: { path: string; label: string; use: string; ground: string }[];
  colours: Colour[];
  fonts: { family: string; use: string; files: string[] }[];
}

/** The skill's files, as this copy of the tool serves them. */
const SKILL = new URL('skill/', document.baseURI).href;
export const at = (path: string) => new URL(path, SKILL).href;

/* The link people share must work for anyone, anywhere: the live Vercel site
   when this was built there, else the files on GitHub. Never this computer. */
const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname) || location.protocol === 'file:';
const RAW = `https://raw.githubusercontent.com/${REPO}/main/public/skill/`;
export const PUBLIC = __STRIKE_SITE__ ? `${__STRIKE_SITE__}/skill/` : LOCAL ? RAW : SKILL;

export const size = (b?: number) => (b === undefined ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);

export type Copy = (key: string, text: string | (() => Promise<string>)) => void;

export function useCopy(): [string | null, Copy] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy: Copy = (key, text) => {
    const value = typeof text === 'string' ? Promise.resolve(text) : text();
    const write =
      typeof ClipboardItem !== 'undefined' && typeof text !== 'string'
        ? navigator.clipboard.write([new ClipboardItem({ 'text/plain': value.then(t => new Blob([t], { type: 'text/plain' })) })])
        : value.then(t => navigator.clipboard.writeText(t));
    write.then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied(c => (c === key ? null : c)), 1600);
      },
      () => setCopied(null),
    );
  };
  return [copied, copy];
}

export const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.5" />
  </svg>
);
export const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8.5l3 3 7-7" />
  </svg>
);
export const IconArrow = ({ back }: { back?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden style={back ? { transform: 'scaleX(-1)' } : undefined}>
    <path d="M6 3.5L10.5 8 6 12.5" />
  </svg>
);
export const IconGitHub = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

export function CopyBox({ text, shown, prompt, k, copied, copy, mono }: { text: string | (() => Promise<string>); shown?: ReactNode; prompt?: string; k: string; copied: string | null; copy: Copy; mono?: boolean }) {
  return (
    <button className={`sk-box${mono ? ' mono' : ''}`} onClick={() => copy(k, text)} title="Copy" data-testid={`copy-${k}`}>
      {prompt && <span className="sk-prompt">{prompt}</span>}
      <span className="sk-box-text">{shown ?? (typeof text === 'string' ? text : '')}</span>
      <span className="sk-box-icon">{copied === k ? <IconCheck /> : <IconCopy />}</span>
    </button>
  );
}

export function Label({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="sk-label">
      <span>{children}</span>
      {right}
    </div>
  );
}

/** Detail on hover or keyboard focus: the next layer down, kept out of the way. */
export function Tip({ children, tip, wide }: { children: ReactNode; tip: ReactNode; wide?: boolean }) {
  return (
    <div className="sk-tipped" tabIndex={0}>
      {children}
      <div className={`sk-tip${wide ? ' wide' : ''}`} role="tooltip">
        {tip}
      </div>
    </div>
  );
}

/** A heading column with one line, then its content: how every group on the brand pages is laid out. */
export function Group({ title, line, children }: { title: string; line: string; children: ReactNode }) {
  return (
    <div className="sk-group">
      <div className="sk-group-head">
        <h3>{title}</h3>
        <p>{line}</p>
      </div>
      <div className="sk-group-body">{children}</div>
    </div>
  );
}

function lum(hex: string) {
  const h = hex.replace('#', '').slice(0, 6);
  const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
export const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};
