# Strike design rules

> Guidelines for Figma Make. The rules come first, then the token values; build every screen from them.

Strike is an options exchange that never closes. Its design is precise and plain: black and white carry the layout, Strike Green marks the primary action and one highlight, and nothing is decorative. Follow these rules for anything you make for Strike: UI, web pages, posts, posters, decks, docs, illustrations and copy. Where a rule and a request conflict, say so in one line and follow the rule unless the user insists.

## Make it easy
- The simplest way first: one link, one command, one button; longer steps only as the fallback.
- **Say each thing once.** No repeated actions, labels or messages; nothing contradicts. Clear beats complete.

## Ask first, briefly, when it isn't clear
- The medium and size (web, app, X post, poster, slide, print).
- Light or dark. **Apps, tools and the web are dark** unless the user asks for light.
- **USD or USDC.** Default to USDC for deposits, collateral, settlement and fees; ask when either could be meant.
- Any number or claim you weren't given. Never invent one.

## Words
- **Tagline:** Options on every market, every hour. **Mission:** Make markets run as long as the news does.
- **Positioning:** Strike is an options exchange that never closes. Trade options on stocks, indices, pre-IPO companies, GPU compute and crypto from one self-custodial margin account.
- **Personality:** expert (not jargon to impress), exact (not vague claims), candid (not hype or fear).
- **Tone:** lead with the fact (one number beats one adjective); keep it short and exact (plain words, correct terms); pair benefit with risk (name the risk in the same sentence or the next).
- **Use:** options exchange, self-custodial, margin account, underlying, listed options, expiry. **Avoid:** "24/7", "revolutionary", "guaranteed", "safe", "unforgettable", exclamation marks, emoji.
- **Mechanics:** sentence case for every heading; US spelling (color, center, gray); numbers as digits with units (168 hours, 20:00 ET); write Strike, never STRIKE (capitals are the logo only).
- **Facts:** open 168 hours a week, against about 32.5 for listed options; about 80 underlyings; a daily expiry at 20:00 ET plus weeklies and monthlies; European style, cash-settled.
- **Custody:** "No key at Strike can move your funds." Always add what is still trusted: settlement prints, prices on market orders, liquidation prices, and the attesters, run by Strike today.
- **Risk line:** "Options involve risk. Closed beta, invite required." In page and email footers, every ad and the last post of a trading thread, with strikelabs.app/risk where there's room. Never target the US or sanctioned regions.

## Color
| Token | Hex | Use |
|---|---|---|
| ground | #0C0C0C | Posters, cards, illustrations, app modules |
| ink | #F9F9F9 | Text on ground; ground of light layouts |
| ink-2 | #B3B3B3 | Secondary text on dark |
| green | #10B981 | Strike Green: the primary action, focus, one highlight. Never fills a layout |
| deep | #047857 | Mark Deep: green text or lines on light grounds |
| mark-light | #6EE7B7 | Mark Light: logo gradient |
| profit / loss | #3FD4AB / #EE5E74 | Market moves only. Red means loss |
| mint | #50EBA0 | Poster grounds and gradients |
| yellow / sky / purple | #FFEF3C / #0788F7 / #976FE6 | Chart series only |

- About 70% ground or ink, 25% grays, ≤ 5% green; secondary colors ≤ 5%. Posters may use more green.
- **No white text on flat Strike Green in UI** (2.4:1): use ground text (7.7:1). On the posters' mint → green gradient, large display type is white. Green text on light grounds uses deep.
- Titles reach 7:1 contrast, body text 4.5:1. Profit and loss carry a sign or an arrow.

## Backgrounds
Strike is dark: about 80% of a screen is the darkest background; the lighter one only separates parts.
- **Websites:** page #090B0A; alternate sections and cards #0F1110.
- **Apps and tools:** #0C0C0C modules on a #2E2E2E frame seen only in the thin gaps. Raised controls #161616, hover #202020.
- **Posters, social cards, illustrations:** #0C0C0C (posters also light gray, mint or the green gradient).
- No other backgrounds, gradients or textures. Light layouts only when asked.

## Type
- **Geist** for everything. Weights: Light, Regular, Medium, SemiBold. Use as few styles as possible; set type flush left; no orphans or widows.
- **The main title is never more than 2 lines.** Shorten the words before you shrink the type. Headings Geist Medium; body Geist Regular.
- Line height and tracking by size: up to 14 px 135%, +1% · 15–24 px 130%, 0 · 25–44 px 120%, −1% · 45–79 px 100%, −2% · 80 px+ 90%, −3%. Slides and posters at 1920: H1 120, H2 72, H3 42, body 18.
- Body lines 45–75 characters. Tabular figures for numbers in tables and prices. Round bullets (•).
- Geist Mono: code, wallet addresses, order books. Geist Pixel Circle: large display type and numbers on posters only. Ciburial: the wordmark, in the logo files only. Fallback: Arial.

## Logo
- **3D on screens** (app, web, social, slides): 3D green mark with white STRIKE on dark; 3D black on light and on mint. **Flat for print and merch**, and on screen under 32 px. On photos always white: flat on busy images, 3D on soft ones.
- Sizes: 3D at least 32 px; flat at least 16 px on screen, 8 mm in print, 12 mm screen print, 35 mm embroidery; lockup at least 20 px tall. Never wider than a third of the layout.
- Clear space: the width of the S in the STRIKE wordmark on every side. Never on flat green in UI.
- Never recolor, outline, add effects, stretch, rotate, separate the layers or redraw it; use the files. One logo per layout, in a corner.
- No official sub-brands. Build a lockup only when asked, with the lockup script or logo.md's proportions.

## Layout and UI
- Posters, cards and illustrations sit on a 50 px grid. Spacing elsewhere: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- Corners: 6 px small controls, 8 px buttons and inputs, 12 px cards, full for pills.
- One primary button per view: green with ground text. Focus rings are green. Every control has hover, active, disabled, loading and error states.
- Leave room: fewer elements, aligned to the grid.

## Illustration and motion
- Line art, flat by default or 2:1 isometric for depth, never the logo files or a solid block, and quieter than its title. Grays with one green focus; faces hide what's behind; dashed means "not real yet"; dots carry tone. A partial fill is fine when it adds contrast or meaning.
- Lines 1 px at every size; nodes 10 px (large) or 20 px (small) on the 50 px grid. Never tiny: no text under 12 px.
- Labels: Geist, a ticker in Medium over its value in Regular ("AMD" / "IV 106.2%").
- Motion is calm: one thing moves at a time and returns to rest. No bounce, no flashing.
- Shapes **gather** with cubic-bezier(0.55, 0, 0.85, 0), 400 ms, **release** with cubic-bezier(0.15, 1, 0.6, 1), 320 ms, then rest 280 ms (a 1 s loop). Plain UI: cubic-bezier(0.2, 0, 0, 1), 120–200 ms.
- Circle compositions: five equal circles, three over two, touching. One grows (up to 2×) as the others shrink, always passing back through the five equal circles.

## Before you hand it over
Check: dark unless asked · backgrounds from the set · nothing said twice · verbal brand, US spelling · illustrations lined, quieter than titles · nothing tiny · Geist only · title ≤ 2 lines · contrast · no white on flat green · ≤ 5% green · logo version right for the medium and ground · nothing invented · USDC unless told otherwise · risk line where needed. Keep your own reply short and direct.

---

# Token values

## Color tokens
Tailwind classes use the same names (`bg-ground`, `text-ink-2`); see In code below.

| Token | CSS variable | Dark (default) | Light | Use |
|---|---|---|---|---|
| ground | `--strike-ground` | #0C0C0C | #F9F9F9 | Ground: posters, social cards, illustrations, app modules |
| web-ground | `--strike-web-ground` | #090B0A | same | Website and marketing page background (about 80%) |
| web-section | `--strike-web-section` | #0F1110 | same | Website alternate sections and cards (about 20%), for depth and separation |
| ink | `--strike-ink` | #F9F9F9 | #0C0C0C | White: text on ground; ground of light layouts |
| ink-2 | `--strike-ink-2` | #B3B3B3 | #4A4D52 | Secondary text on dark (9.3:1) |
| ink-3 | `--strike-ink-3` | #8A8F98 | #6B6F76 | Muted text and icons on dark (6.0:1) |
| green | `--strike-green` | #10B981 | same | Strike Green: primary action, focus, one highlight. Never fills a layout; no white text on it in UI |
| deep | `--strike-deep` | #047857 | same | Mark Deep: green text or lines on light grounds (5.2:1) |
| mark-light | `--strike-mark-light` | #6EE7B7 | same | Mark Light: the light end of the logo gradient |
| profit | `--strike-profit` | #3FD4AB | same | Profit: market moves up (gains, buys, bids) |
| loss | `--strike-loss` | #EE5E74 | same | Loss: market moves down (losses, sells, asks). Red means loss and nothing else |
| mint | `--strike-mint` | #50EBA0 | same | Poster grounds and the light end of the poster gradient |
| data-yellow | `--strike-data-yellow` | #FFEF3C | same | Chart data series only |
| data-sky | `--strike-data-sky` | #0788F7 | same | Chart data series only |
| data-purple | `--strike-data-purple` | #976FE6 | same | Chart data series only |
| frame | `--strike-frame` | #2E2E2E | same | App frame: the lighter background that shows only in the thin gaps between modules |
| surface-1 | `--strike-surface-1` | #161616 | #FFFFFF | Raised controls on a module: inputs, tabs, secondary buttons |
| surface-2 | `--strike-surface-2` | #202020 | #F1F1F1 | Hover and selected |
| surface-3 | `--strike-surface-3` | #2A2A2A | #E8E8E9 | Pressed; the strongest raise |
| line | `--strike-line` | #FFFFFF1A | #0C0C0C14 | Hairlines (10%) |
| line-strong | `--strike-line-strong` | #FFFFFF2E | #0C0C0C24 | Input borders and dividers (18%) |

## Fonts
| Token | Stack | Use |
|---|---|---|
| sans | Geist, Arial, sans-serif | Geist for everything; Arial when web fonts are unavailable |
| mono | Geist Mono, ui-monospace, monospace | Code, wallet addresses, order books only |
| display-pixel | Geist Pixel Circle, Geist, sans-serif | Large display type and numbers on posters only, where contrast is high; never body text or company documents |
| wordmark | Ciburial | The STRIKE wordmark only; use the logo files |

## Type scale
| Style | Class | Size | Line height | Tracking | Weight |
|---|---|---|---|---|---|
| display | `.strike-display` | 72px | 1 | -0.02em | 500 |
| h1 | `.strike-h1` | 48px | 1 | -0.02em | 500 |
| h2 | `.strike-h2` | 32px | 1.2 | -0.01em | 500 |
| h3 | `.strike-h3` | 24px | 1.3 | 0 | 500 |
| body-l | `.strike-body-l` | 18px | 1.3 | 0 | 400 |
| body | `.strike-body` | 16px | 1.3 | 0 | 400 |
| small | `.strike-small` | 14px | 1.35 | 0.01em | 400 |
| label | `.strike-label` | 12px | 1.35 | 0.01em | 500 |
| slide-h1 | `.strike-slide-h1` | 120px | 0.9 | -0.03em | 500 |
| slide-h2 | `.strike-slide-h2` | 72px | 1 | -0.02em | 500 |
| slide-h3 | `.strike-slide-h3` | 42px | 1.2 | -0.01em | 500 |
| slide-body | `.strike-slide-body` | 18px | 1.3 | 0 | 400 |

## Space, radius, size, motion
- **Space:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px (`--strike-space-1` to `--strike-space-10`); grid 50px (`--strike-grid`) for posters, cards and illustrations.
- **Radius:** sm 6px (small controls), md 8px (buttons, inputs), lg 12px (cards), pill 9999px.
- **Size:** control 40px, control-sm 32px, logo-mark-min 16px, logo-3d-min 32px, logo-lockup-min-height 20px, logo-max-share 33.333%.
- **Motion:** fast 120ms, base 200ms, slow 320ms, gather 400ms, release 320ms, rest 280ms, loop 1000ms, press-in 240ms, press-out 200ms; ease cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.55, 0, 0.85, 0), cubic-bezier(0.15, 1, 0.6, 1).

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
  --text-display--line-height: 1;
  --text-display--letter-spacing: -0.02em;
  --text-display--font-weight: 500;
  --text-h1: 48px;
  --text-h1--line-height: 1;
  --text-h1--letter-spacing: -0.02em;
  --text-h1--font-weight: 500;
  --text-h2: 32px;
  --text-h2--line-height: 1.2;
  --text-h2--letter-spacing: -0.01em;
  --text-h2--font-weight: 500;
  --text-h3: 24px;
  --text-h3--line-height: 1.3;
  --text-h3--letter-spacing: 0;
  --text-h3--font-weight: 500;
  --text-body-l: 18px;
  --text-body-l--line-height: 1.3;
  --text-body-l--letter-spacing: 0;
  --text-body-l--font-weight: 400;
  --text-body: 16px;
  --text-body--line-height: 1.3;
  --text-body--letter-spacing: 0;
  --text-body--font-weight: 400;
  --text-small: 14px;
  --text-small--line-height: 1.35;
  --text-small--letter-spacing: 0.01em;
  --text-small--font-weight: 400;
  --text-label: 12px;
  --text-label--line-height: 1.35;
  --text-label--letter-spacing: 0.01em;
  --text-label--font-weight: 500;
  --text-slide-h1: 120px;
  --text-slide-h1--line-height: 0.9;
  --text-slide-h1--letter-spacing: -0.03em;
  --text-slide-h1--font-weight: 500;
  --text-slide-h2: 72px;
  --text-slide-h2--line-height: 1;
  --text-slide-h2--letter-spacing: -0.02em;
  --text-slide-h2--font-weight: 500;
  --text-slide-h3: 42px;
  --text-slide-h3--line-height: 1.2;
  --text-slide-h3--letter-spacing: -0.01em;
  --text-slide-h3--font-weight: 500;
  --text-slide-body: 18px;
  --text-slide-body--line-height: 1.3;
  --text-slide-body--letter-spacing: 0;
  --text-slide-body--font-weight: 400;

  --radius-*: initial;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 9999px;

  /* p-4 is 16px. Stay on the scale: 1, 2, 3, 4, 6, 8, 12, 16, 24, 32. */
  --spacing: 4px;
  --spacing-grid: 50px;

  --ease-strike: cubic-bezier(0.2, 0, 0, 1);
  --ease-gather: cubic-bezier(0.55, 0, 0.85, 0);
  --ease-release: cubic-bezier(0.15, 1, 0.6, 1);
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
