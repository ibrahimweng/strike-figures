# Strike design rules

> Guidelines for Figma Make. The rules come first, then the token values; build every screen from them.

Strike is the options exchange that never closes. Its design is calm, exact and restrained: black and white do most of the work, one green marks what matters, and nothing is decorative. Follow these rules for anything you make for Strike: UI, web pages, posts, posters, decks, docs, illustrations and copy. Where a rule and a request conflict, say so in one line and follow the rule unless the user insists.

## Make it easy
Give people the simplest way first: one link to copy, one command, one button. Offer downloads and longer steps only as the fallback.

## Ask first, briefly, when it isn't clear
- The medium and size (web, app, X post, poster, slide).
- Light or dark. **Apps, tools and the web are dark** unless the user asks for light.
- **USD or USDC.** Default to USDC for deposits, collateral, settlement and fees; ask when either could be meant.
- Any number or claim you weren't given. Never invent one.

## Colour
| Token | Hex | Use |
|---|---|---|
| ground | #0C0C0C | Posters, social cards, illustrations, app modules |
| ink | #F9F9F9 | Text on ground; ground of light layouts |
| ink-2 | #B3B3B3 | Secondary text on dark |
| green | #10B981 | The primary action, focus, one highlight. Never a large area in UI |
| deep | #047857 | Green text or lines on light grounds |
| mark-light | #6EE7B7 | Logo gradient only |
| profit | #3FD4AB | Gains, buys, bids |
| loss | #EE5E74 | Losses, sells, asks. Red means loss and nothing else |
| mint | #50EBA0 | Poster grounds only |
| yellow / sky / purple | #FFEF3C / #0788F7 / #976FE6 | Only in charts that must tell several series apart |

- A layout is about 70% ground or ink, 25% greys, ≤ 5% green.
- **Never set white text on green** (2.4:1). On green use ground text (7.7:1). Green text on light grounds uses deep (5.2:1).
- Titles reach 7:1 contrast with their ground; body text at least 4.5:1.
- Profit and loss always carry a sign or an arrow too, never colour alone.

## Backgrounds
Strike is dark. About 80% of any screen is the darkest background; the lighter one (about 20%) only separates parts and gives depth. Use only these:
- **Websites and marketing:** page #090B0A; alternate sections and cards #0F1110.
- **Apps and tools:** modules #0C0C0C sit on a lighter frame #2E2E2E that shows only in the thin gaps between them. Raised controls #161616, hover #202020.
- **Posters, social cards, illustrations:** #0C0C0C (mint for posters only).
- No other backgrounds: no gradients, tinted greys or textures made up for the job. Light layouts only when asked.
- To see it: strikelabs.app (web) and trade.strikelabs.app (app).

## Type
- **Geist** for everything: headlines and body. Weights: Light, Regular, Medium, SemiBold.
- **Headings are short.** The main title is never more than **2 lines**. Shorten the words before you shrink the type.
- Headings: Geist Medium. Tracking −3% at 48 px and up, −2% at 32 px, −1.5% at 24 px. Line height 0.9–1.0 for display and H1, 1.1–1.2 for H2 and H3.
- Body: Geist Regular, 16 px, line height 1.5, lines of 45–75 characters. Numbers in tables and prices use tabular figures.
- Geist Mono: code, wallet addresses and order books only.
- Geist Pixel Circle: big display numbers on posters only (e.g. "24%").
- Ciburial is the STRIKE wordmark's typeface. Don't typeset the wordmark: use the logo files.
- Sentence case. No full stop on a one-line title. Write "Strike" in text; STRIKE in capitals is the logo only.
- Fallback when web fonts are blocked: Arial.

## Logo
- The logo is **3D by default**: 3D green mark with white STRIKE on dark grounds, 3D black on light grounds.
- The **flat** (fully opaque) logo is for very bright grounds like mint, for merch, and wherever the 3D logo won't fit (small sizes).
- **On photos the logo is always white**: flat white on busy or noisy images, 3D white on soft images.
- Never on a green ground in UI. On posters, the flat black logo may sit on mint.
- Mark at least 16 px; lockup at least 20 px tall. Clear space: one layer of the mark on every side.
- Never recolour, outline, add effects, stretch, rotate or separate the layers. Never redraw it; use the files.
- Strike has no official sub-brands. Build one only when asked, as the brand book does: mark, STRIKE, then the name in Geist Medium on STRIKE's baseline (use the lockup script when available).

## Layout and UI
- Posters, cards and illustrations sit on a 50 px grid. Spacing elsewhere uses 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Corners: 6 px small controls, 8 px buttons and inputs, 12 px cards, full radius for pills.
- One primary button per view: green with ground text. Secondary: raised dark surface with ink text.
- Focus rings are green. Every control has hover, active, disabled, loading and error states.
- Leave room. Fewer elements, aligned to the grid, beat more elements.

## Illustration and motion
- Line art in greys with one green focus, on the 2:1 isometric angle or flat (straight down). Faces hide what's behind them; dashed lines mean "not real yet"; dots carry tone.
- Labels: Geist, a ticker in Medium over its value in Regular ("AMD" / "IV 106.2%").
- Motion is calm: one thing moves at a time, eased, and returns to rest. No bounce, no flashing.

## Words
- Verbal branding is still being written: keep copy short, plain and factual. No hype, no exclamation marks, no emoji in brand copy.
- Facts you may use: open 168 hours a week; listed options trade about 32.5 hours a week; a daily expiry at 20:00 ET plus weeklies and monthlies; European style, cash-settled; one margin account across stocks, indices and ETFs, pre-IPO, GPU compute and crypto; "No key at Strike can move your money." Never state how many markets Strike lists unless the user gives the number.
- A custody claim always comes with what is still trusted (settlement prints, prices on market orders, liquidation prices, and the attesters, run by Strike today).
- Risk line: "Options involve risk. Closed beta, invite required." It goes in page and email footers, every ad, and the last post of any thread about trading, with a link to strikelabs.app/risk where there's room.
- Never target the US or sanctioned regions.

## Before you hand it over
Check: dark unless asked · backgrounds from the set · Geist only · title ≤ 2 lines · contrast · no white on green · ≤ 5% green · logo version right for the ground · nothing invented · USDC unless told otherwise · risk line where needed. Keep your own reply short and direct.

---

# Token values

## Colour tokens
Tailwind classes use the same names (`bg-ground`, `text-ink-2`); see In code below.

| Token | CSS variable | Dark (default) | Light | Use |
|---|---|---|---|---|
| ground | `--strike-ground` | #0C0C0C | #F9F9F9 | The dark background: posters, social cards, illustrations, app modules |
| web-ground | `--strike-web-ground` | #090B0A | same | Website and marketing page background (about 80%) |
| web-section | `--strike-web-section` | #0F1110 | same | Website alternate sections and cards (about 20%), for depth and separation |
| ink | `--strike-ink` | #F9F9F9 | #0C0C0C | Text on ground; ground of light layouts |
| ink-2 | `--strike-ink-2` | #B3B3B3 | #4A4D52 | Secondary text on dark (9.3:1) |
| ink-3 | `--strike-ink-3` | #8A8F98 | #6B6F76 | Muted text and icons on dark (6.0:1) |
| green | `--strike-green` | #10B981 | same | Primary action, focus, one highlight |
| deep | `--strike-deep` | #047857 | same | Green text or lines on light grounds (5.2:1) |
| mark-light | `--strike-mark-light` | #6EE7B7 | same | Logo gradient only |
| profit | `--strike-profit` | #3FD4AB | same | Gains, buys, bids |
| loss | `--strike-loss` | #EE5E74 | same | Losses, sells, asks. Red means loss and nothing else |
| mint | `--strike-mint` | #50EBA0 | same | Poster grounds only |
| data-yellow | `--strike-data-yellow` | #FFEF3C | same | Charts with several series only |
| data-sky | `--strike-data-sky` | #0788F7 | same | Charts with several series only |
| data-purple | `--strike-data-purple` | #976FE6 | same | Charts with several series only |
| frame | `--strike-frame` | #2E2E2E | same | App frame: the lighter background that shows only in the thin gaps between modules |
| surface-1 | `--strike-surface-1` | #161616 | #FFFFFF | Raised controls on a module: inputs, tabs, secondary buttons |
| surface-2 | `--strike-surface-2` | #202020 | #F1F1F1 | Hover and selected |
| surface-3 | `--strike-surface-3` | #2A2A2A | #E8E8E9 | Pressed; the strongest raise |
| line | `--strike-line` | #FFFFFF1A | #0C0C0C14 | Hairlines (10%) |
| line-strong | `--strike-line-strong` | #FFFFFF2E | #0C0C0C24 | Input borders and dividers (18%) |

## Fonts
| Token | Stack | Use |
|---|---|---|
| sans | Geist, Arial, sans-serif | Headlines and text |
| mono | Geist Mono, ui-monospace, monospace | Code, wallet addresses, order books only |
| display-pixel | Geist Pixel Circle, Geist, sans-serif | Big display numbers on posters only |
| wordmark | Ciburial | The STRIKE wordmark only; use the logo files |

## Type scale
| Style | Class | Size | Line height | Tracking | Weight |
|---|---|---|---|---|---|
| display | `.strike-display` | 72px | 0.95 | -0.03em | 500 |
| h1 | `.strike-h1` | 48px | 1 | -0.03em | 500 |
| h2 | `.strike-h2` | 32px | 1.1 | -0.02em | 500 |
| h3 | `.strike-h3` | 24px | 1.2 | -0.015em | 500 |
| body-l | `.strike-body-l` | 18px | 1.5 | 0 | 400 |
| body | `.strike-body` | 16px | 1.5 | 0 | 400 |
| small | `.strike-small` | 14px | 1.45 | 0 | 400 |
| label | `.strike-label` | 12px | 1.4 | 0.02em | 500 |

## Space, radius, size, motion
- **Space:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px (`--strike-space-1` to `--strike-space-10`); grid 50px (`--strike-grid`) for posters, cards and illustrations.
- **Radius:** sm 6px (small controls), md 8px (buttons, inputs), lg 12px (cards), pill 9999px.
- **Size:** control 40px, control-sm 32px, logo-mark-min 16px, logo-lockup-min-height 20px.
- **Motion:** fast 120ms, base 200ms, slow 320ms; ease cubic-bezier(0.2, 0, 0, 1).

## In code
Generated code uses Tailwind v4. Put this in the global stylesheet after `@import "tailwindcss";`, and use these names in classes (`bg-ground`, `text-ink`, `rounded-md`, `text-h1`).

```css
/* Strike theme for Tailwind CSS v4. Generated from source/tokens.json; don't edit.
   @import "tailwindcss"; @import "./theme.css";
   Dark is the default; data-theme="light" on an element switches it and its children. */
@theme {
  --color-*: initial;
  --color-ground: #0C0C0C;
  --color-web-ground: #090B0A;
  --color-web-section: #0F1110;
  --color-ink: #F9F9F9;
  --color-ink-2: #B3B3B3;
  --color-ink-3: #8A8F98;
  --color-green: #10B981;
  --color-deep: #047857;
  --color-mark-light: #6EE7B7;
  --color-profit: #3FD4AB;
  --color-loss: #EE5E74;
  --color-mint: #50EBA0;
  --color-data-yellow: #FFEF3C;
  --color-data-sky: #0788F7;
  --color-data-purple: #976FE6;
  --color-frame: #2E2E2E;
  --color-surface-1: #161616;
  --color-surface-2: #202020;
  --color-surface-3: #2A2A2A;
  --color-line: #FFFFFF1A;
  --color-line-strong: #FFFFFF2E;

  --font-*: initial;
  --font-sans: Geist, Arial, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --font-pixel: "Geist Pixel Circle", Geist, sans-serif;

  --text-*: initial;
  --text-display: 72px;
  --text-display--line-height: 0.95;
  --text-display--letter-spacing: -0.03em;
  --text-display--font-weight: 500;
  --text-h1: 48px;
  --text-h1--line-height: 1;
  --text-h1--letter-spacing: -0.03em;
  --text-h1--font-weight: 500;
  --text-h2: 32px;
  --text-h2--line-height: 1.1;
  --text-h2--letter-spacing: -0.02em;
  --text-h2--font-weight: 500;
  --text-h3: 24px;
  --text-h3--line-height: 1.2;
  --text-h3--letter-spacing: -0.015em;
  --text-h3--font-weight: 500;
  --text-body-l: 18px;
  --text-body-l--line-height: 1.5;
  --text-body-l--letter-spacing: 0;
  --text-body-l--font-weight: 400;
  --text-body: 16px;
  --text-body--line-height: 1.5;
  --text-body--letter-spacing: 0;
  --text-body--font-weight: 400;
  --text-small: 14px;
  --text-small--line-height: 1.45;
  --text-small--letter-spacing: 0;
  --text-small--font-weight: 400;
  --text-label: 12px;
  --text-label--line-height: 1.4;
  --text-label--letter-spacing: 0.02em;
  --text-label--font-weight: 500;

  --radius-*: initial;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  /* p-4 is 16px. Stay on the scale: 1, 2, 3, 4, 6, 8, 12, 16, 24, 32. */
  --spacing: 4px;
  --spacing-grid: 50px;

  --ease-strike: cubic-bezier(0.2, 0, 0, 1);
}

[data-theme="light"] {
  --color-ground: #F9F9F9;
  --color-surface-1: #FFFFFF;
  --color-surface-2: #F1F1F1;
  --color-surface-3: #E8E8E9;
  --color-ink: #0C0C0C;
  --color-ink-2: #4A4D52;
  --color-ink-3: #6B6F76;
  --color-line: #0C0C0C14;
  --color-line-strong: #0C0C0C24;
}
```
