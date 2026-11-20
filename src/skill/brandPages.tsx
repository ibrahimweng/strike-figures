/* The brand, one page per part: Logo, Colour, Type, Illustration,
   Backgrounds and Rules. Each page is grouped by category with one line per
   group; the deeper detail waits on hover. */
import { useEffect, useMemo, useState } from 'react';
import { LIBRARY } from '../library';
import { useStore } from '../model/store';
import { useThread } from '../social/store';
import { useLibraryThumb } from '../ui/thumbs';
import { Markdown } from './markdown';
import { MotionPage } from './motion';
import { at, type Colour, type Copy, Group, type Manifest, ratio, Tip } from './shared';

export type PageId = 'logo' | 'colour' | 'type' | 'illustration' | 'motion' | 'backgrounds' | 'rules';

export const PAGES: { id: PageId; title: string; line: string }[] = [
  { id: 'logo', title: 'Logo', line: 'The lockup, the mark and the wordmark, in every version.' },
  { id: 'colour', title: 'Colour', line: 'A dark ground and one green, grouped by use.' },
  { id: 'type', title: 'Type', line: 'Geist for everything. Short titles, tight tracking.' },
  { id: 'illustration', title: 'Illustration', line: 'Line art in greys with one green focus.' },
  { id: 'motion', title: 'Motion', line: 'Two curves: shapes gather into a point, then release from it.' },
  { id: 'backgrounds', title: 'Backgrounds', line: 'Two darks for each medium. About 80% is the darkest.' },
  { id: 'rules', title: 'Rules', line: 'The full set your AI follows, and the check before handing over.' },
];

/* ---------- Logo ---------- */

const LOGO_GROUPS: { title: string; line: string; test: (file: string) => boolean; wide?: boolean }[] = [
  { title: 'Lockup', line: 'The mark and the name. Use it where there is room for both.', test: f => f.startsWith('strike-lockup-'), wide: true },
  { title: 'Mark', line: 'The icon alone, where the name does not fit.', test: f => /^strike-mark-(3d|flat)-/.test(f) },
  { title: 'Wordmark', line: 'The name alone, only where the mark is already nearby.', test: f => f.startsWith('strike-wordmark-'), wide: true },
  { title: 'Profile image', line: 'The mark on its own ground, for avatars, app icons and favicons.', test: f => /^strike-mark-(tile|disc)/.test(f) },
  { title: 'Link preview', line: 'Shown when a Strike link is shared.', test: f => f.endsWith('.png'), wide: true },
];

/* Only Strike's own grounds. White logos are for photos; shown here on the dark ground. */
const LOGO_GROUND: Record<string, string> = { dark: '#0C0C0C', photo: '#0C0C0C', light: '#F1F1F1', mint: '#50EBA0' };

function LogoPage({ manifest }: { manifest: Manifest }) {
  return (
    <>
      {LOGO_GROUPS.map(g => {
        const items = manifest.logos.filter(l => g.test(l.path.split('/').pop()!));
        if (!items.length) return null;
        return (
          <Group key={g.title} title={g.title} line={g.line}>
            <div className={`sk-logos${g.wide ? ' wide' : ''}`}>
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
                  <div className="sk-logo" style={{ background: LOGO_GROUND[l.ground] ?? LOGO_GROUND.dark }}>
                    <img src={at(l.path)} alt={l.label} loading="lazy" />
                  </div>
                </Tip>
              ))}
            </div>
          </Group>
        );
      })}
    </>
  );
}

/* ---------- Colour ---------- */

export const NAMES: Record<string, string> = {
  'web.ground': 'Web page',
  'web.section': 'Web section',
  ground: 'Ground',
  'dark.frame': 'App frame',
  ink: 'Ink',
  green: 'Strike Green',
  'ink-2': 'Ink, secondary',
  'ink-3': 'Ink, muted',
  'dark.surface-1': 'Raised',
  'dark.surface-2': 'Hover',
  'dark.surface-3': 'Pressed',
  profit: 'Profit',
  loss: 'Loss',
  'mark-light': 'Mark, light',
  deep: 'Mark, deep',
  mint: 'Mint',
  'data.yellow': 'Yellow',
  'data.sky': 'Sky',
  'data.purple': 'Purple',
};

const COLOUR_GROUPS: { title: string; line: string; tokens: string[] }[] = [
  { title: 'Backgrounds', line: 'Only these. About 80% of a screen is the darkest one.', tokens: ['web.ground', 'web.section', 'ground', 'dark.frame'] },
  { title: 'Primary', line: 'White text, and one green for the thing that matters.', tokens: ['ink', 'green'] },
  { title: 'Supporting greys', line: 'Secondary text and icons.', tokens: ['ink-2', 'ink-3'] },
  { title: 'Raised', line: 'Controls inside app modules: resting, hover, pressed.', tokens: ['dark.surface-1', 'dark.surface-2', 'dark.surface-3'] },
  { title: 'Markets', line: 'Profit and loss only. Red means a loss and nothing else.', tokens: ['profit', 'loss'] },
  { title: 'Logo and print', line: 'The mark’s gradient, green on light grounds, and poster grounds.', tokens: ['mark-light', 'deep', 'mint'] },
  { title: 'Data', line: 'Only when a chart needs more series than greys and green.', tokens: ['data.yellow', 'data.sky', 'data.purple'] },
];

export function Swatch({ c, copied, copy }: { c: Colour; copied: string | null; copy: Copy }) {
  const name = NAMES[c.token] ?? c.token.replace(/^light\./, '');
  return (
    <Tip
      tip={
        <>
          <strong>{name}</strong>
          <span>{c.use || '—'}</span>
          <span className="sk-tip-sub">
            {ratio(c.hex, '#0C0C0C').toFixed(1)}:1 on Ground · {ratio(c.hex, '#F9F9F9').toFixed(1)}:1 on Ink
          </span>
        </>
      }
    >
      <button className="sk-swatch" onClick={() => copy(c.token, c.hex)}>
        <span className="sk-chip" style={{ background: c.hex }} />
        <span className="sk-swatch-name">{name}</span>
        <span className="sk-hex">{copied === c.token ? 'Copied' : c.hex}</span>
      </button>
    </Tip>
  );
}

function ColourPage({ manifest, copied, copy }: { manifest: Manifest; copied: string | null; copy: Copy }) {
  const byToken = new Map(manifest.colours.map(c => [c.token, c]));
  const light = manifest.colours.filter(c => c.token.startsWith('light.') && c.hex.length === 7);
  return (
    <>
      {COLOUR_GROUPS.map(g => {
        const list = g.tokens.map(t => byToken.get(t)).filter((c): c is Colour => !!c);
        if (!list.length) return null;
        return (
          <Group key={g.title} title={g.title} line={g.line}>
            <div className="sk-swatches">
              {list.map(c => (
                <Swatch key={c.token} c={c} copied={copied} copy={copy} />
              ))}
            </div>
          </Group>
        );
      })}
      {light.length > 0 && (
        <details className="sk-group sk-fold">
          <summary className="sk-group-head">
            <h3>Light mode</h3>
            <p>Only when someone asks for light, or for print.</p>
          </summary>
          <div className="sk-swatches small">
            {light.map(c => (
              <Swatch key={c.token} c={c} copied={copied} copy={copy} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}

/* ---------- Type ---------- */

interface TypeToken {
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
}
const SCALE_NAMES: Record<string, string> = { display: 'Display', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', 'body-l': 'Body large', body: 'Body', small: 'Small', label: 'Label' };

function TypePage() {
  const [scale, setScale] = useState<[string, TypeToken][]>([]);
  useEffect(() => {
    fetch(at('tokens/tokens.json'))
      .then(r => (r.ok ? r.json() : null))
      .then(t => {
        const ty = t?.typography ?? {};
        setScale(
          Object.entries(ty)
            .filter(([k]) => !k.startsWith('$'))
            .map(([k, v]) => [k, (v as { $value: TypeToken }).$value]),
        );
      })
      .catch(() => setScale([]));
  }, []);
  return (
    <>
      <Group title="Families" line="Geist does the work. The others each have one job.">
        <div className="sk-type">
          <Tip tip={<span>Geist Medium · 48–120 px · line height 0.9–1.0 · tracking −3%. Shorten the words before shrinking the type.</span>} wide>
            <div className="sk-type-cell">
              <h4>Geist · headlines</h4>
              <div className="sk-spec-title">
                Options on every
                <br />
                market, every hour.
              </div>
            </div>
          </Tip>
          <Tip tip={<span>Geist Regular · 16 px · line height 1.5 · 45–75 characters a line.</span>} wide>
            <div className="sk-type-cell">
              <h4>Geist · body</h4>
              <p className="sk-spec-body">Strike is an options exchange that never closes. Trade calls and puts from one margin account.</p>
            </div>
          </Tip>
          <Tip tip={<span>Geist Mono · code, wallet addresses and order books only.</span>}>
            <div className="sk-type-cell">
              <h4>Geist Mono · code and addresses</h4>
              <div className="sk-spec-mono">0x05a1…c996</div>
            </div>
          </Tip>
          <Tip tip={<span>Geist Pixel Circle · big numbers on posters only.</span>}>
            <div className="sk-type-cell">
              <h4>Geist Pixel · poster numbers</h4>
              <div className="sk-spec-pixel">24%</div>
            </div>
          </Tip>
        </div>
      </Group>
      {scale.length > 0 && (
        <Group title="Scale" line="Eight sizes. Titles stay within two lines.">
          <div className="sk-scale">
            {scale.map(([k, v]) => (
              <div className="sk-scale-row" key={k}>
                <span className="sk-scale-name">{SCALE_NAMES[k] ?? k}</span>
                <span
                  className="sk-scale-sample"
                  style={{ fontSize: `min(${v.fontSize}, 9vw)`, fontWeight: v.fontWeight, lineHeight: v.lineHeight, letterSpacing: v.letterSpacing === '0' ? undefined : v.letterSpacing }}
                >
                  {k === 'label' ? 'Open interest' : k.startsWith('body') || k === 'small' ? 'Trade calls and puts from one account.' : k === 'display' || k === 'h1' ? 'Every market' : 'Every market, every hour'}
                </span>
                <span className="sk-scale-spec">
                  {v.fontSize} · {v.fontWeight === 500 ? 'Medium' : v.fontWeight === 400 ? 'Regular' : v.fontWeight} · {v.lineHeight}
                  {v.letterSpacing !== '0' ? ` · ${(parseFloat(v.letterSpacing) * 100).toFixed(1).replace(/\.0$/, '').replace('-', '−')}%` : ''}
                </span>
              </div>
            ))}
          </div>
        </Group>
      )}
      <Group title="Writing it" line="Sentence case, no full stop on one-line titles.">
        <ul className="sk-dos">
          <li>Write “Strike” in text. STRIKE in capitals is the logo only.</li>
          <li>Never typeset the wordmark: use the logo files.</li>
          <li>Numbers in tables and prices use tabular figures.</li>
        </ul>
      </Group>
    </>
  );
}

/* ---------- Illustration ---------- */

const GALLERY = ['every-market', 'always-open', 'vault', 'market-rays', 'globe', 'unified-margin', 'vol-surface', 'straddle', 'candles', 'servers', 'layers', 'radar'];

function Thumb({ id }: { id: string }) {
  const url = useLibraryThumb(id);
  const item = LIBRARY.find(x => x.id === id);
  if (!item) return null;
  const open = () => {
    useStore.getState().openLibrary(id);
    useThread.getState().setMode('figures');
  };
  return (
    <button className="sk-thumb" onClick={open} title={`Open “${item.title}” in Figures`}>
      <span className="sk-thumb-art">{url && <img src={url} alt="" />}</span>
      <span className="sk-thumb-name">{item.title}</span>
    </button>
  );
}

function IllustrationPage() {
  return (
    <>
      <Group title="Style" line="How every Strike figure is drawn.">
        <ul className="sk-dos">
          <li>Line art in greys with one green focus, on the dark ground.</li>
          <li>The 2:1 isometric angle, or flat (straight down).</li>
          <li>Faces hide what is behind them. Dashed lines mean “not real yet”. Dots carry tone.</li>
          <li>Labels in Geist: a ticker in Medium over its value in Regular.</li>
        </ul>
      </Group>
      <Group title="Motion" line="Calm: one thing moves at a time, then rests.">
        <ul className="sk-dos">
          <li>Eased, never bouncing or flashing.</li>
          <li>Every loop returns to where it started.</li>
        </ul>
      </Group>
      <Group title="Library" line="Ready-made figures. Click one to edit it in Figures.">
        <div className="sk-gallery">
          {GALLERY.map(id => (
            <Thumb key={id} id={id} />
          ))}
        </div>
      </Group>
    </>
  );
}

/* ---------- Backgrounds ---------- */

export function AppMock({ small }: { small?: boolean }) {
  return (
    <div className={`sk-mock-app${small ? ' small' : ''}`} aria-hidden>
      <div className="m-top" />
      <div className="m-chart" />
      <div className="m-book" />
      <div className="m-ticket">
        <i />
        <i />
        <i className="g" />
      </div>
      <div className="m-foot" />
    </div>
  );
}
export function WebMock({ small }: { small?: boolean }) {
  return (
    <div className={`sk-mock-web${small ? ' small' : ''}`} aria-hidden>
      <div className="w-sec">
        <i className="h" />
        <i />
      </div>
      <div className="w-sec alt">
        <i className="h" />
        <i />
      </div>
      <div className="w-sec">
        <i className="h" />
        <i />
      </div>
    </div>
  );
}

function BackgroundsPage({ manifest, copied, copy }: { manifest: Manifest; copied: string | null; copy: Copy }) {
  const byToken = new Map(manifest.colours.map(c => [c.token, c]));
  const pick = (...t: string[]) => t.map(k => byToken.get(k)).filter((c): c is Colour => !!c);
  return (
    <>
      <Group title="Apps and tools" line="Dark modules on a lighter frame that shows only in the thin gaps between them.">
        <div className="sk-bg-row">
          <AppMock />
          <div className="sk-swatches">
            {pick('ground', 'dark.frame', 'dark.surface-1', 'dark.surface-2').map(c => (
              <Swatch key={c.token} c={c} copied={copied} copy={copy} />
            ))}
          </div>
        </div>
        <p className="sk-note">
          See it in <a href="https://trade.strikelabs.app/" target="_blank" rel="noreferrer">trade.strikelabs.app</a>
        </p>
      </Group>
      <Group title="Websites and marketing" line="A near-black page, with a lighter section between topics for depth.">
        <div className="sk-bg-row">
          <WebMock />
          <div className="sk-swatches">
            {pick('web.ground', 'web.section').map(c => (
              <Swatch key={c.token} c={c} copied={copied} copy={copy} />
            ))}
          </div>
        </div>
        <p className="sk-note">
          See it in <a href="https://strikelabs.app/" target="_blank" rel="noreferrer">strikelabs.app</a>
        </p>
      </Group>
      <Group title="Posters and illustrations" line="The dark ground. Mint is for posters only.">
        <div className="sk-swatches">
          {pick('ground', 'mint').map(c => (
            <Swatch key={c.token} c={c} copied={copied} copy={copy} />
          ))}
        </div>
      </Group>
      <Group title="The rule" line="About 80% of any screen is the darkest background.">
        <ul className="sk-dos">
          <li>The lighter one only separates parts and gives depth. It is never the main ground.</li>
          <li>No other backgrounds: no gradients, tinted greys or textures made up for the job.</li>
          <li>Light layouts only when someone asks.</li>
        </ul>
      </Group>
    </>
  );
}

/* ---------- Rules ---------- */

function RulesPage({ core }: { core: string }) {
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
  return (
    <div className="sk-rules">
      {rules.map((r, i) => (
        <details key={r.title} className="sk-fold" open={i === 0}>
          <summary>
            <h3>{r.title}</h3>
          </summary>
          <div className="sk-rule-body">
            <Markdown text={r.body} />
          </div>
        </details>
      ))}
    </div>
  );
}

export function BrandPage({ id, manifest, core, copied, copy }: { id: PageId; manifest: Manifest | null; core: string; copied: string | null; copy: Copy }) {
  if (id === 'rules') return <RulesPage core={core} />;
  if (id === 'type') return <TypePage />;
  if (id === 'illustration') return <IllustrationPage />;
  if (id === 'motion') return <MotionPage copied={copied} copy={copy} />;
  if (!manifest) return null;
  if (id === 'logo') return <LogoPage manifest={manifest} />;
  if (id === 'colour') return <ColourPage manifest={manifest} copied={copied} copy={copy} />;
  return <BackgroundsPage manifest={manifest} copied={copied} copy={copy} />;
}
