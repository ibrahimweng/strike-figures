/* The Skill page: where everyone lands. One link that any AI tool can read,
   install steps for each tool, and the brand's files and basics at a glance.
   Everything here is read from the skill's built files in /skill/ (made by
   `npm run skill:build`), so the page never drifts from the skill itself. */
import { useEffect, useMemo, useState } from 'react';
import { Seg } from '../ui/controls';
import { Markdown } from './markdown';

interface FileRef {
  path: string;
  label: string;
  bytes?: number;
  kind?: string;
}
interface Target {
  id: string;
  name: string;
  summary: string;
  steps: string[];
  files: FileRef[];
}
interface Manifest {
  version: string;
  updated: string;
  universal: string;
  targets: Target[];
  downloads: FileRef[];
  logos: { path: string; label: string; use: string; ground: string }[];
  colours: { token: string; hex: string; use: string }[];
  fonts: { family: string; use: string; files: string[] }[];
}

/** Where the skill's files are served from: /skill/ next to the tool, on any domain. */
const SKILL = new URL('skill/', document.baseURI).href;
const at = (path: string) => new URL(path, SKILL).href;
/** The link to share: always the public site, even when this page runs on someone's own computer. */
const PUBLIC = __STRIKE_SITE__ ? `${__STRIKE_SITE__}/skill/` : SKILL;
const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/.test(location.hostname);

const size = (b?: number) => (b === undefined ? '' : b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const isText = (p: string) => /\.(md|mdc|txt|css|json|cjs|js)$/i.test(p);
const GROUNDS: Record<string, string> = { dark: '#0C0C0C', light: '#F1F1F1', mint: '#50EBA0', photo: 'linear-gradient(135deg, #2f3a35, #6b7c74 55%, #a9b7ad)', green: '#10B981' };

function useCopy(): [string | null, (key: string, text: string | (() => Promise<string>)) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string | (() => Promise<string>)) => {
    const value = typeof text === 'string' ? Promise.resolve(text) : text();
    /* write a promise so Safari keeps the click's permission across the fetch */
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

export function SkillPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [core, setCore] = useState('');
  const [failed, setFailed] = useState(false);
  const [target, setTarget] = useState('claude');
  const [allRules, setAllRules] = useState(false);
  const [copied, copy] = useCopy();

  useEffect(() => {
    fetch(at('manifest.json'))
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: Manifest) => {
        setManifest(m);
        /* the pixel face is only needed for its specimen: load it from the skill's own fonts */
        const pixel = m.fonts.find(f => /pixel/i.test(f.family))?.files.find(f => f.endsWith('.woff2'));
        if (pixel && 'FontFace' in window)
          new FontFace('Geist Pixel Circle', `url(${at(pixel)})`)
            .load()
            .then(f => document.fonts.add(f))
            .catch(() => undefined);
      })
      .catch(() => setFailed(true));
    fetch(at('core.md'))
      .then(r => (r.ok ? r.text() : ''))
      .then(setCore)
      .catch(() => setCore(''));
  }, []);

  const link = new URL(manifest?.universal ?? 'STRIKE-DESIGN.md', PUBLIC).href;
  const unshareable = LOCAL && !__STRIKE_SITE__;
  const prompt = `Read ${link} and follow it for everything you make for Strike in this chat.`;
  const current = useMemo(() => manifest?.targets.find(t => t.id === target) ?? manifest?.targets[0], [manifest, target]);
  const fetchText = (path: string) => () => fetch(at(path)).then(r => r.text());
  /* restraint: the brand palette only (the interface greys live in the CSS), and no repeats of the install files */
  const palette = manifest?.colours.filter(c => !/^(dark|light)\./.test(c.token)) ?? [];
  const installed = new Set(manifest?.targets.flatMap(t => t.files.map(f => f.path)) ?? []);
  const downloads = manifest?.downloads.filter(d => !installed.has(d.path)) ?? [];

  return (
    <main className="sk" data-testid="skill-page">
      <section className="sk-hero">
        <div className="sk-eyebrow">Strike design skill</div>
        <h1>The Strike brand, in any AI tool.</h1>
        <p className="sk-lede">Give your AI this link. It reads the rules, colours, type and logos, and keeps everything it makes on brand.</p>
        <div className="sk-link">
          <code title={link}>{link}</code>
          <button className="btn primary" onClick={() => copy('link', link)} data-testid="copy-link">
            {copied === 'link' ? 'Copied' : 'Copy link'}
          </button>
          <button className="btn soft" onClick={() => copy('prompt', prompt)}>
            {copied === 'prompt' ? 'Copied' : 'Copy prompt'}
          </button>
        </div>
        <p className="sk-note">
          Works in any chat that can read a web page. For tools that can't, install it below.
          {manifest && (
            <span className="sk-meta">
              {' '}
              Version {manifest.version} · updated {new Date(manifest.updated).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          )}
        </p>
        {unshareable && (
          <p className="sk-warn" data-testid="local-note">
            This is a copy running on your computer, so this link only works here. Open the tool on your Vercel site to get the link to share.
          </p>
        )}
        {failed && <p className="sk-warn">The skill's files aren't built yet. Run `npm run skill:build`, then reload.</p>}
      </section>

      {manifest && current && (
        <section className="sk-section">
          <h2>Install it</h2>
          <div className="sk-tabs">
            <Seg value={current.id} options={manifest.targets.map(t => ({ value: t.id, label: t.name }))} onChange={setTarget} />
          </div>
          <div className="sk-panel">
            <p className="sk-summary">{current.summary}</p>
            <ol className="sk-steps">
              {current.steps.map((s, i) => (
                <li key={i}>
                  <Markdown text={s} />
                </li>
              ))}
            </ol>
            {current.files.length > 0 && (
              <ul className="sk-files">
                {current.files.map(f => (
                  <li key={f.path}>
                    <span className="sk-file">
                      {f.label}
                      <span className="sk-size">{size(f.bytes)}</span>
                    </span>
                    {isText(f.path) && (
                      <button className="btn small soft" onClick={() => copy(f.path, fetchText(f.path))}>
                        {copied === f.path ? 'Copied' : 'Copy'}
                      </button>
                    )}
                    <a className="btn small" href={at(f.path)} download>
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {downloads.length > 0 && (
        <section className="sk-section">
          <h2>Downloads</h2>
          <ul className="sk-files sk-downloads">
            {downloads.map(f => (
              <li key={f.path}>
                <span className="sk-file">
                  {f.label}
                  <span className="sk-size">{size(f.bytes)}</span>
                </span>
                <a className="btn small" href={at(f.path)} download>
                  Download
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {manifest && manifest.logos.length > 0 && (
        <section className="sk-section">
          <h2>Logo</h2>
          <p className="sk-sub">3D by default. Flat on bright grounds, merch and small sizes. White on photos.</p>
          <div className="sk-logos">
            {manifest.logos.map(l => (
              <figure key={l.path}>
                <div className="sk-logo-ground" style={{ background: GROUNDS[l.ground] ?? GROUNDS.dark }}>
                  <img src={at(l.path)} alt={l.label} loading="lazy" />
                </div>
                <figcaption>
                  <span>{l.label}</span>
                  <span className="sk-use">{l.use}</span>
                  <a href={at(l.path)} download>
                    SVG
                  </a>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {palette.length > 0 && (
        <section className="sk-section">
          <h2>Colour</h2>
          <p className="sk-sub">A near-black ground and one green. Click a colour to copy it.</p>
          <div className="sk-colours">
            {palette.map(c => (
              <button key={c.token} className="sk-swatch" onClick={() => copy(c.token, c.hex)} title={`Copy ${c.hex}`}>
                <span className="sk-chip" style={{ background: c.hex }} />
                <span className="sk-token">{c.token}</span>
                <span className="sk-hex">{copied === c.token ? 'Copied' : c.hex}</span>
                <span className="sk-use">{c.use}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {manifest && (
        <section className="sk-section">
          <h2>Type</h2>
          <div className="sk-type">
            <div>
              <div className="sk-spec-title">Options on every market, every hour.</div>
              <span className="sk-use">Geist Medium · titles, at most 2 lines, tracked −3%</span>
            </div>
            <div>
              <p className="sk-spec-body">Strike is an options exchange that never closes. Trade calls and puts from one margin account.</p>
              <span className="sk-use">Geist Regular · body, 16 px, line height 1.5</span>
            </div>
            <div className="sk-type-row">
              <div>
                <div className="sk-spec-mono">0x05a1…c996</div>
                <span className="sk-use">Geist Mono · code, addresses, order books</span>
              </div>
              <div>
                <div className="sk-spec-pixel">24%</div>
                <span className="sk-use">Geist Pixel Circle · big numbers on posters</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {core && (
        <section className="sk-section">
          <h2>The rules</h2>
          <div className={`sk-rules${allRules ? '' : ' folded'}`}>
            <Markdown text={core.replace(/^# .*\n/, '')} />
          </div>
          <button className="btn soft" onClick={() => setAllRules(!allRules)}>
            {allRules ? 'Show less' : 'Show all the rules'}
          </button>
        </section>
      )}

      <section className="sk-section">
        <h2>Check your work</h2>
        <p className="sk-sub">The checker flags off-brand colours, fonts, contrast, long titles and copy.</p>
        <div className="sk-link">
          <code>npm run skill:check -- path/to/files</code>
          <button className="btn soft" onClick={() => copy('check', 'npm run skill:check -- ')}>
            {copied === 'check' ? 'Copied' : 'Copy'}
          </button>
        </div>
      </section>
    </main>
  );
}
