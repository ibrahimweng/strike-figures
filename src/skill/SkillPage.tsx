/* The Skill page, where everyone lands. The one thing to do is up top: copy
   the link (or the one command) and your AI has the Strike brand. Below the
   illustration: the tools it works in, then the brand itself, grouped and
   explained in one line each, with the detail on hover or behind a click.
   Everything is read from the skill's built files in /skill/. */
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { LOGOS } from './agent-logos';
import { heroAt, heroScene, heroSvg } from './heroFigure';
import { Markdown } from './markdown';

export const REPO = 'ibrahimweng/strike-figures';
export const GITHUB = `https://github.com/${REPO}`;
const COMMAND = `npx skills add ${REPO}`;

interface FileRef {
  path: string;
  label: string;
  bytes?: number;
}
interface Manifest {
  version: string;
  updated: string;
  universal: string;
  targets: { id: string; name: string; summary: string; steps: string[]; files: FileRef[] }[];
  downloads: FileRef[];
  logos: { path: string; label: string; use: string; ground: string }[];
  colours: { token: string; hex: string; use: string }[];
  fonts: { family: string; use: string; files: string[] }[];
}

const SKILL = new URL('skill/', document.baseURI).href;
const at = (path: string) => new URL(path, SKILL).href;
/** The link to share: always the public site, even from a copy running on someone's computer. */
const PUBLIC = __STRIKE_SITE__ ? `${__STRIKE_SITE__}/skill/` : SKILL;
const LOCAL = /^(localhost|127\.|0\.0\.0\.0|\[::1\]|192\.168\.|10\.)/.test(location.hostname);

const size = (b?: number) => (b === undefined ? '' : b < 1048576 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`);

/* ---------- copying ---------- */

function useCopy(): [string | null, (key: string, text: string | (() => Promise<string>)) => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string | (() => Promise<string>)) => {
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

const IconCopy = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
    <path d="M10.5 3.5v-.5A1.5 1.5 0 0 0 9 1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h.5" />
  </svg>
);
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 8.5l3 3 7-7" />
  </svg>
);
export const IconGitHub = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
  </svg>
);

function CopyBox({ text, shown, prompt, k, copied, copy, mono }: { text: string; shown?: ReactNode; prompt?: string; k: string; copied: string | null; copy: (k: string, t: string) => void; mono?: boolean }) {
  return (
    <button className={`sk-box${mono ? ' mono' : ''}`} onClick={() => copy(k, text)} title="Copy" data-testid={`copy-${k}`}>
      {prompt && <span className="sk-prompt">{prompt}</span>}
      <span className="sk-box-text">{shown ?? text}</span>
      <span className="sk-box-icon">{copied === k ? <IconCheck /> : <IconCopy />}</span>
    </button>
  );
}

/* ---------- the tools ---------- */

type How = { kind: 'command'; agent: string } | { kind: 'prompt'; keep: string } | { kind: 'guidelines' };
interface Agent {
  id: string;
  name: string;
  logo: ReactNode;
  how: How;
  /** the manifest target with the longer steps and files */
  target: string;
}

const Glyph = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d={d} />
  </svg>
);
const Line = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {children}
  </svg>
);

const AGENTS: Agent[] = [
  { id: 'claude-code', name: 'Claude Code', logo: <Glyph d={LOGOS.claude!} />, how: { kind: 'command', agent: 'claude-code' }, target: 'claude' },
  {
    id: 'codex',
    name: 'Codex',
    logo: (
      <Line>
        <rect x="3" y="4.5" width="18" height="15" rx="3" />
        <path d="M7.5 10l2.5 2-2.5 2M12.5 15h4" />
      </Line>
    ),
    how: { kind: 'command', agent: 'codex' },
    target: 'agents',
  },
  { id: 'cursor', name: 'Cursor', logo: <Glyph d={LOGOS.cursor!} />, how: { kind: 'command', agent: 'cursor' }, target: 'cursor' },
  { id: 'copilot', name: 'GitHub Copilot', logo: <Glyph d={LOGOS.copilot!} />, how: { kind: 'command', agent: 'github-copilot' }, target: 'copilot' },
  { id: 'windsurf', name: 'Windsurf', logo: <Glyph d={LOGOS.windsurf!} />, how: { kind: 'command', agent: 'windsurf' }, target: 'agents' },
  { id: 'claude', name: 'Claude', logo: <Glyph d={LOGOS.claude!} />, how: { kind: 'prompt', keep: 'a Project' }, target: 'claude' },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    logo: (
      <Line>
        <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12Z" />
      </Line>
    ),
    how: { kind: 'prompt', keep: 'a Project or a GPT' },
    target: 'chatgpt',
  },
  { id: 'gemini', name: 'Gemini', logo: <Glyph d={LOGOS.gemini!} />, how: { kind: 'prompt', keep: 'a Gem' }, target: 'gemini' },
  { id: 'perplexity', name: 'Perplexity', logo: <Glyph d={LOGOS.perplexity!} />, how: { kind: 'prompt', keep: 'a Space' }, target: 'perplexity' },
  { id: 'figma', name: 'Figma', logo: <Glyph d={LOGOS.figma!} />, how: { kind: 'guidelines' }, target: 'figma' },
];

/* ---------- the brand, grouped ---------- */

const LOGO_GROUPS: { title: string; line: string; test: (file: string) => boolean }[] = [
  { title: 'Lockup', line: 'The mark and the name. Use it where there is room for both.', test: f => f.startsWith('strike-lockup-') },
  { title: 'Mark', line: 'The icon alone, where the name does not fit.', test: f => /^strike-mark-(3d|flat)-/.test(f) },
  { title: 'Wordmark', line: 'The name alone, only where the mark is already nearby.', test: f => f.startsWith('strike-wordmark-') },
  { title: 'Profile image', line: 'The mark on its own ground, for avatars, app icons and favicons.', test: f => /^strike-mark-(tile|disc)/.test(f) },
  { title: 'Link preview', line: 'Shown when a Strike link is shared.', test: f => f.endsWith('.png') },
];

const GROUND_BG: Record<string, string> = {
  dark: '#0C0C0C',
  light: '#F1F1F1',
  mint: '#50EBA0',
  photo: 'linear-gradient(140deg, #2b3631, #5d6e66 55%, #9aa99f)',
};

const COLOUR_GROUPS: { title: string; line: string; tokens: string[]; folded?: boolean }[] = [
  { title: 'Primary', line: 'Black and white carry the system; green marks the one thing that matters.', tokens: ['ground', 'ink', 'green'] },
  { title: 'Supporting greys', line: 'Secondary text and icons.', tokens: ['ink-2', 'ink-3'] },
  { title: 'Markets', line: 'Profit and loss only. Red means a loss and nothing else.', tokens: ['profit', 'loss'] },
  { title: 'Logo and print', line: 'The mark’s gradient, green on light grounds, and poster grounds.', tokens: ['mark-light', 'deep', 'mint'] },
  { title: 'Data', line: 'Only when a chart needs more series than greys and green.', tokens: ['data.yellow', 'data.sky', 'data.purple'] },
  { title: 'Interface', line: 'Surfaces and lines for product UI, dark and light.', tokens: [], folded: true },
];

const NAMES: Record<string, string> = {
  ground: 'Ground',
  ink: 'Ink',
  green: 'Strike Green',
  'ink-2': 'Ink, secondary',
  'ink-3': 'Ink, muted',
  profit: 'Profit',
  loss: 'Loss',
  'mark-light': 'Mark, light',
  deep: 'Mark, deep',
  mint: 'Mint',
  'data.yellow': 'Yellow',
  'data.sky': 'Sky',
  'data.purple': 'Purple',
};

function lum(hex: string) {
  const h = hex.replace('#', '').slice(0, 6);
  const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

/* ---------- small pieces ---------- */

function Label({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="sk-label">
      <span>{children}</span>
      {right}
    </div>
  );
}

/** Detail on hover or keyboard focus: the next layer down, kept out of the way. */
function Tip({ children, tip, wide }: { children: ReactNode; tip: ReactNode; wide?: boolean }) {
  return (
    <div className="sk-tipped" tabIndex={0}>
      {children}
      <div className={`sk-tip${wide ? ' wide' : ''}`} role="tooltip">
        {tip}
      </div>
    </div>
  );
}

function HeroFigure() {
  const host = useRef<HTMLDivElement>(null);
  const base = useMemo(() => heroScene(), []);
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.innerHTML = heroSvg(heroAt(base, 0));
    if (still) return;
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      if (now - last > 1000 / 30) {
        last = now;
        el.innerHTML = heroSvg(heroAt(base, (((now - start) / 1000) % 7) / 7));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [base]);
  return (
    <div className="sk-figure-wrap" aria-hidden>
      <div className="sk-figure" ref={host} />
    </div>
  );
}

/* ---------- the page ---------- */

export function SkillPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [core, setCore] = useState('');
  const [agentId, setAgentId] = useState('claude-code');
  const [copied, copy] = useCopy();

  useEffect(() => {
    fetch(at('manifest.json'))
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((m: Manifest) => {
        setManifest(m);
        const pixel = m.fonts.find(f => /pixel/i.test(f.family))?.files.find(f => f.endsWith('.woff2'));
        if (pixel && 'FontFace' in window)
          new FontFace('Geist Pixel Circle', `url(${at(pixel)})`)
            .load()
            .then(f => document.fonts.add(f))
            .catch(() => undefined);
      })
      .catch(() => setManifest(null));
    fetch(at('core.md'))
      .then(r => (r.ok ? r.text() : ''))
      .then(setCore)
      .catch(() => setCore(''));
  }, []);

  const link = new URL(manifest?.universal ?? 'STRIKE-DESIGN.md', PUBLIC).href;
  const prompt = `Read ${link} and follow it for everything you make for Strike.`;
  const agent = AGENTS.find(a => a.id === agentId) ?? AGENTS[0]!;
  const target = manifest?.targets.find(t => t.id === agent.target);
  const kit = manifest?.downloads.find(d => d.path.endsWith('strike-design-kit.zip'));
  const colours = new Map(manifest?.colours.map(c => [c.token, c]) ?? []);
  const rules = useMemo(
    () =>
      core
        .replace(/^# .*\n/, '')
        .split(/\n(?=## )/)
        .map(s => s.trim())
        .filter(s => s.startsWith('## '))
        .map(s => ({ title: s.slice(3, s.indexOf('\n')), body: s.slice(s.indexOf('\n') + 1) })),
    [core],
  );
  const fetchText = (path: string) => () => fetch(at(path)).then(r => r.text());

  return (
    <main className="sk" data-testid="skill-page">
      {/* ---- hero: the one thing to do ---- */}
      <section className="sk-hero">
        <h1>
          The Strike brand,
          <br />
          in any AI tool.
        </h1>
        <div className="sk-hero-r">
          <p className="sk-lede">One link gives your AI Strike’s rules, colours, type and logos, so everything it makes is on brand.</p>
          <Label>Paste into any AI</Label>
          <CopyBox k="link" text={prompt} shown={link} copied={copied} copy={copy} />
          <Label>Or add it to your project</Label>
          <CopyBox k="command" text={COMMAND} prompt="$" copied={copied} copy={copy} mono />
          {LOCAL && !__STRIKE_SITE__ && (
            <p className="sk-warn" data-testid="local-note">
              This copy runs on your computer, so the link only works here. Share it from your Vercel site.
            </p>
          )}
        </div>
      </section>

      <HeroFigure />

      {/* ---- the tools ---- */}
      <section className="sk-section">
        <Label>Works in</Label>
        <div className="sk-agents" role="tablist">
          {AGENTS.map(a => (
            <button key={a.id} role="tab" aria-selected={a.id === agent.id} className={`sk-agent${a.id === agent.id ? ' on' : ''}`} onClick={() => setAgentId(a.id)} title={a.name}>
              <span className="sk-agent-logo">{a.logo}</span>
              <span className="sk-agent-name">{a.name}</span>
            </button>
          ))}
        </div>
        <div className="sk-how">
          <h3>Use it in {agent.name}</h3>
          {agent.how.kind === 'command' && (
            <>
              <p className="sk-one">Run this in your project, then ask for Strike work as usual.</p>
              <CopyBox k={`cmd-${agent.id}`} text={`${COMMAND} -a ${agent.how.agent}`} prompt="$" copied={copied} copy={copy} mono />
            </>
          )}
          {agent.how.kind === 'prompt' && (
            <>
              <p className="sk-one">Paste this into the chat. To keep it, put it in {agent.how.keep}’s instructions.</p>
              <CopyBox k={`prompt-${agent.id}`} text={prompt} copied={copied} copy={copy} />
            </>
          )}
          {agent.how.kind === 'guidelines' && (
            <>
              <p className="sk-one">Paste these guidelines into Figma Make’s Guidelines.md.</p>
              <button className="sk-box" onClick={() => copy('figma', fetchText('figma/guidelines.md'))} data-testid="copy-figma">
                <span className="sk-box-text">Strike guidelines for Figma Make</span>
                <span className="sk-box-icon">{copied === 'figma' ? <IconCheck /> : <IconCopy />}</span>
              </button>
            </>
          )}
          {target && (
            <details className="sk-more">
              <summary>Other ways</summary>
              <ol className="sk-steps">
                {target.steps.map((s, i) => (
                  <li key={i}>
                    <Markdown text={s} />
                  </li>
                ))}
              </ol>
              <ul className="sk-files">
                {target.files.map(f => (
                  <li key={f.path}>
                    <span>{f.label}</span>
                    <span className="sk-size">{size(f.bytes)}</span>
                    <a href={at(f.path)} download>
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>

      {manifest && (
        <>
          {/* ---- logo ---- */}
          <section className="sk-section">
            <Label>Logo</Label>
            <p className="sk-intro">3D by default. Flat on bright grounds, merch and small sizes. White on photos.</p>
            {LOGO_GROUPS.map(g => {
              const items = manifest.logos.filter(l => g.test(l.path.split('/').pop()!));
              if (!items.length) return null;
              return (
                <div className="sk-group" key={g.title}>
                  <div className="sk-group-head">
                    <h3>{g.title}</h3>
                    <p>{g.line}</p>
                  </div>
                  <div className={`sk-logos${g.title === 'Lockup' || g.title === 'Wordmark' || g.title === 'Link preview' ? ' wide' : ''}`}>
                    {items.map(l => (
                      <Tip
                        key={l.path}
                        tip={
                          <>
                            <strong>{l.label}</strong>
                            <span>{l.use}.</span>
                            <span className="sk-tip-sub">At least {g.title === 'Mark' || g.title === 'Profile image' ? '16 px' : '20 px tall'}. Clear space: one layer of the mark.</span>
                            <a href={at(l.path)} download>
                              Download {l.path.endsWith('.png') ? 'PNG' : 'SVG'}
                            </a>
                          </>
                        }
                      >
                        <div className="sk-logo" style={{ background: GROUND_BG[l.ground] ?? GROUND_BG.dark }}>
                          <img src={at(l.path)} alt={l.label} loading="lazy" />
                        </div>
                      </Tip>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          {/* ---- colour ---- */}
          <section className="sk-section">
            <Label>Colour</Label>
            <p className="sk-intro">A near-black ground and one green. Click a colour to copy it.</p>
            {COLOUR_GROUPS.map(g => {
              const list = g.folded ? manifest.colours.filter(c => /^(dark|light)\./.test(c.token)) : g.tokens.map(t => colours.get(t)).filter((c): c is NonNullable<typeof c> => !!c);
              if (!list.length) return null;
              const swatches = (
                <div className={`sk-swatches${g.folded ? ' small' : ''}`}>
                  {list.map(c => {
                    const onGround = ratio(c.hex, '#0C0C0C');
                    const onInk = ratio(c.hex, '#F9F9F9');
                    return (
                      <Tip
                        key={c.token}
                        tip={
                          <>
                            <strong>{NAMES[c.token] ?? c.token}</strong>
                            <span>{c.use || '—'}</span>
                            <span className="sk-tip-sub">
                              {onGround.toFixed(1)}:1 on Ground · {onInk.toFixed(1)}:1 on Ink
                            </span>
                          </>
                        }
                      >
                        <button className="sk-swatch" onClick={() => copy(c.token, c.hex)}>
                          <span className="sk-chip" style={{ background: c.hex }} />
                          <span className="sk-swatch-name">{NAMES[c.token] ?? c.token}</span>
                          <span className="sk-hex">{copied === c.token ? 'Copied' : c.hex}</span>
                        </button>
                      </Tip>
                    );
                  })}
                </div>
              );
              return g.folded ? (
                <details className="sk-group sk-fold" key={g.title}>
                  <summary className="sk-group-head">
                    <h3>{g.title}</h3>
                    <p>{g.line}</p>
                  </summary>
                  {swatches}
                </details>
              ) : (
                <div className="sk-group" key={g.title}>
                  <div className="sk-group-head">
                    <h3>{g.title}</h3>
                    <p>{g.line}</p>
                  </div>
                  {swatches}
                </div>
              );
            })}
          </section>

          {/* ---- type ---- */}
          <section className="sk-section">
            <Label>Type</Label>
            <p className="sk-intro">Geist for everything. Titles stay within two lines.</p>
            <div className="sk-type">
              <Tip tip={<span>Geist Medium · 48–120 px · line height 0.9–1.0 · tracking −3%. Shorten the words before shrinking the type.</span>} wide>
                <div className="sk-type-cell">
                  <h3>Headlines</h3>
                  <div className="sk-spec-title">
                    Options on every
                    <br />
                    market, every hour.
                  </div>
                </div>
              </Tip>
              <Tip tip={<span>Geist Regular · 16 px · line height 1.5 · 45–75 characters a line.</span>} wide>
                <div className="sk-type-cell">
                  <h3>Body</h3>
                  <p className="sk-spec-body">Strike is an options exchange that never closes. Trade calls and puts from one margin account.</p>
                </div>
              </Tip>
              <Tip tip={<span>Geist Mono · code, wallet addresses and order books only.</span>}>
                <div className="sk-type-cell">
                  <h3>Code and addresses</h3>
                  <div className="sk-spec-mono">0x05a1…c996</div>
                </div>
              </Tip>
              <Tip tip={<span>Geist Pixel Circle · big numbers on posters only.</span>}>
                <div className="sk-type-cell">
                  <h3>Display numbers</h3>
                  <div className="sk-spec-pixel">24%</div>
                </div>
              </Tip>
            </div>
          </section>
        </>
      )}

      {/* ---- the rules, folded ---- */}
      {rules.length > 0 && (
        <section className="sk-section">
          <Label>The rules</Label>
          <div className="sk-rules">
            {rules.map(r => (
              <details key={r.title} className="sk-fold">
                <summary>
                  <h3>{r.title}</h3>
                </summary>
                <div className="sk-rule-body">
                  <Markdown text={r.body} />
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ---- everything else, on request ---- */}
      <section className="sk-section sk-end">
        <Label>Files</Label>
        <div className="sk-end-row">
          {kit && (
            <a className="btn primary" href={at(kit.path)} download>
              Download the brand kit <span className="sk-size">{size(kit.bytes)}</span>
            </a>
          )}
          <a className="btn soft" href={GITHUB} target="_blank" rel="noreferrer">
            <IconGitHub /> View on GitHub
          </a>
        </div>
        <p className="sk-intro">Logos, fonts, posters and design tokens.</p>
        {manifest && (
          <details className="sk-more">
            <summary>Developer files</summary>
            <ul className="sk-files">
              {manifest.downloads
                .filter(d => /^(tokens\/|STRIKE-DESIGN|core\.md)/.test(d.path))
                .map(f => (
                  <li key={f.path}>
                    <span>{f.label}</span>
                    <span className="sk-size">{size(f.bytes)}</span>
                    <a href={at(f.path)} download>
                      Download
                    </a>
                  </li>
                ))}
            </ul>
          </details>
        )}
        {manifest && (
          <p className="sk-meta">
            Version {manifest.version} · updated {new Date(manifest.updated).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        )}
      </section>
    </main>
  );
}
