/* The Skill page, where everyone lands. Up top, the one thing to do: copy the
   link (or the one command) and your AI has the Strike brand, then the tools
   it works in. Below, a card for each part of the brand; each opens its own
   page (#logo, #colour, …). Everything is read from the skill's built files. */
import { type ReactNode, useEffect, useState } from 'react';
import { LOGOS } from './agent-logos';
import { AppMock, BrandPage, HeroFigure, PAGES, type PageId, WebMock } from './brandPages';
import { Markdown } from './markdown';
import { at, COMMAND, CopyBox, GITHUB, IconArrow, IconCheck, IconGitHub, Label, type Manifest, PUBLIC, size, useCopy } from './shared';

export { GITHUB, IconGitHub };

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

/* ---------- which page: #logo, #colour, … (no hash: the overview) ---------- */

const IDS = PAGES.map(p => p.id);
const readPage = (): PageId | null => {
  const h = location.hash.replace('#', '') as PageId;
  return IDS.includes(h) ? h : null;
};

function usePage(): [PageId | null, (p: PageId | null) => void] {
  const [page, setPage] = useState<PageId | null>(readPage);
  useEffect(() => {
    const sync = () => setPage(readPage());
    window.addEventListener('hashchange', sync);
    window.addEventListener('popstate', sync);
    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener('popstate', sync);
    };
  }, []);
  const go = (p: PageId | null) => {
    try {
      history.pushState(null, '', p ? `#${p}` : location.pathname + location.search);
    } catch {
      /* the address bar is a convenience only */
    }
    setPage(p);
    document.querySelector('.sk')?.scrollTo({ top: 0 });
  };
  return [page, go];
}

/* ---------- the card previews ---------- */

const PILLS = ['#2E2E2E', '#B3B3B3', '#F9F9F9', '#10B981', '#3FD4AB', '#EE5E74', '#50EBA0', '#0788F7'];
const CHECKS = ['Dark unless asked', 'Geist only', 'Title in two lines or fewer', 'Green on 5% or less', 'Nothing invented'];

function CardArt({ id, lockup }: { id: PageId; lockup: string }) {
  if (id === 'logo')
    return (
      <div className="sk-art-logo">
        <img src={lockup} alt="" />
      </div>
    );
  if (id === 'colour')
    return (
      <div className="sk-pills">
        {PILLS.map(c => (
          <span key={c} className="sk-pill">
            <i style={{ background: c }} />
          </span>
        ))}
      </div>
    );
  if (id === 'type')
    return (
      <div className="sk-art-type">
        <span className="t-sans">Geist</span>
        <span className="t-mono">Geist Mono</span>
        <span className="t-pixel">24%</span>
        <span className="t-weights">
          <b style={{ fontWeight: 300 }}>Aa</b>
          <b style={{ fontWeight: 400 }}>Aa</b>
          <b style={{ fontWeight: 500 }}>Aa</b>
          <b style={{ fontWeight: 600 }}>Aa</b>
        </span>
      </div>
    );
  if (id === 'illustration') return <HeroFigure />;
  if (id === 'backgrounds')
    return (
      <div className="sk-art-bg">
        <AppMock small />
        <WebMock small />
      </div>
    );
  return (
    <ul className="sk-art-checks">
      {CHECKS.map(c => (
        <li key={c}>
          <IconCheck />
          {c}
        </li>
      ))}
    </ul>
  );
}

/* ---------- the page ---------- */

export function SkillPage() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [core, setCore] = useState('');
  const [agentId, setAgentId] = useState('claude-code');
  const [copied, copy] = useCopy();
  const [page, go] = usePage();

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
  const lockup = at(manifest?.logos.find(l => /lockup-3d-green/.test(l.path))?.path ?? 'portable/logo/strike-lockup-3d-green.svg');
  const fetchText = (path: string) => () => fetch(at(path)).then(r => r.text());

  /* ---- one part of the brand ---- */
  if (page) {
    const i = PAGES.findIndex(p => p.id === page);
    const here = PAGES[i]!;
    const prev = PAGES[i - 1];
    const next = PAGES[i + 1];
    return (
      <main className="sk sk-sub" data-testid={`skill-page-${page}`}>
        <div className="sk-wrap">
          <button className="sk-back" onClick={() => go(null)}>
            <IconArrow back /> Overview
          </button>
          <header className="sk-sub-head">
            <h1>{here.title}</h1>
            <p>{here.line}</p>
          </header>
          <BrandPage id={page} manifest={manifest} core={core} copied={copied} copy={copy} />
          <nav className="sk-pager">
            {prev ? (
              <button onClick={() => go(prev.id)}>
                <span>Previous</span>
                <strong>
                  <IconArrow back /> {prev.title}
                </strong>
              </button>
            ) : (
              <button onClick={() => go(null)}>
                <span>Back to</span>
                <strong>
                  <IconArrow back /> Overview
                </strong>
              </button>
            )}
            {next && (
              <button className="next" onClick={() => go(next.id)}>
                <span>Next</span>
                <strong>
                  {next.title} <IconArrow />
                </strong>
              </button>
            )}
          </nav>
        </div>
      </main>
    );
  }

  /* ---- the overview ---- */
  return (
    <main className="sk" data-testid="skill-page">
      <div className="sk-wrap">
        <section className="sk-hero">
          <div>
            <h1>
              The Strike brand,
              <br />
              in any AI tool.
            </h1>
            <p className="sk-lede">One link gives your AI Strike’s rules, colours, type and logos, so everything it makes is on brand.</p>
          </div>
          <div className="sk-hero-r">
            <Label>Paste into any AI</Label>
            <CopyBox k="link" text={prompt} shown={link} copied={copied} copy={copy} />
            <Label>Or add it to your project</Label>
            <CopyBox k="command" text={COMMAND} prompt="$" copied={copied} copy={copy} mono />
          </div>
        </section>

        {/* ---- the tools ---- */}
        <section className="sk-tools">
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
                <CopyBox k="figma" text={fetchText('figma/guidelines.md')} shown="Strike guidelines for Figma Make" copied={copied} copy={copy} />
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

        {/* ---- the brand, one card per part ---- */}
        <section className="sk-cards" aria-label="The brand">
          {PAGES.map(p => (
            <a
              key={p.id}
              className={`sk-card c-${p.id}`}
              href={`#${p.id}`}
              data-testid={`card-${p.id}`}
              onClick={e => {
                e.preventDefault();
                go(p.id);
              }}
            >
              <div className="sk-card-art">
                <CardArt id={p.id} lockup={lockup} />
              </div>
              <div className="sk-card-text">
                <h3>
                  {p.title} <IconArrow />
                </h3>
                <p>{p.line}</p>
              </div>
            </a>
          ))}
        </section>

        {/* ---- everything else, on request ---- */}
        <footer className="sk-foot">
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
          <p className="sk-note">Logos, fonts, posters and design tokens, in one zip.</p>
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
        </footer>
      </div>
    </main>
  );
}

