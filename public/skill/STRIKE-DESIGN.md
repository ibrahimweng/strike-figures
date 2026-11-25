# Strike design rules

> All of the Strike design rules in one file: the core rules, then the detail, then the token values. The logo files, fonts and tokens are in portable/, and all of them in portable/strike-design-kit.zip.

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

# Detailed rules

## Color

The palette is black, white and Strike Green. Black and white carry the layout; Strike Green marks the primary action and one highlight. The palette has two groups, primary and secondary. Use color with restraint. Values: portable/tokens/tokens.json.

### Primary palette
| Name | Token | Hex | RGB % | CMYK | Use |
|---|---|---|---|---|---|
| Ground | ground | #0C0C0C | 5, 5, 5 | 0, 0, 0, 95 | Posters, social cards, illustrations, app modules |
| Strike Green | green | #10B981 | 6, 73, 51 | 91, 0, 30, 27 | The primary action, focus, one highlight. Never fills a layout |
| White | ink | #F9F9F9 | 98, 98, 98 | 0, 0, 0, 2 | Text on ground; ground of light layouts |

For print, match Strike Green to the closest Pantone.

### Secondary palette
Secondary colors have fixed jobs. Keep them to 5% or less of a layout.

| Name | Token | Hex | RGB % | CMYK | Job |
|---|---|---|---|---|---|
| Loss | loss | #EE5E74 | 93, 37, 45 | 0, 61, 51, 7 | Market moves down: losses, sells, asks. Red means loss and nothing else |
| Profit | profit | #3FD4AB | 25, 83, 67 | 70, 0, 19, 17 | Market moves up: gains, buys, bids |
| Mark Deep | deep | #047857 | 2, 47, 34 | 97, 0, 28, 53 | Green text or lines on light grounds; the dark end of the logo gradient |
| Mark Light | mark-light | #6EE7B7 | 43, 91, 72 | 52, 0, 21, 9 | The light end of the logo gradient |
| Yellow | data.yellow | #FFEF3C | 100, 94, 24 | 3, 0, 86, 0 | Data series in charts only |
| Sky | data.sky | #0788F7 | 3, 53, 97 | 74, 45, 0, 0 | Data series in charts only |
| Purple | data.purple | #976FE6 | 59, 44, 90 | 53, 65, 0, 0 | Data series in charts only |

### Interface and poster tones
| Token | Hex | Use |
|---|---|---|
| web.ground / web.section | #090B0A / #0F1110 | Website page / alternate sections and cards |
| frame | #2E2E2E | App frame, seen only in the gaps between modules |
| surface-1 / 2 / 3 | #161616 / #202020 / #2A2A2A | Raised controls / hover and selected / pressed |
| line / line-strong | white at 10% / 18% | Hairlines / input borders and dividers |
| ink-2 | #B3B3B3 | Secondary text on dark |
| ink-3 | #8A8F98 | Muted text, icons |
| mint | #50EBA0 | Poster grounds and the light end of the poster gradient |

Light mode (only when asked) swaps tier for tier: ground #F9F9F9, surfaces #FFFFFF / #F1F1F1 / #E8E8E9, ink #0C0C0C, ink-2 #4A4D52, ink-3 #6B6F76, lines in ground at 8% / 14%.

### Backgrounds
Strike is dark. About 80% of any screen is the darkest background; the lighter one (about 20%) only separates parts and gives depth. Use only these sets:

| Medium | Darkest (~80%) | Lighter (~20%) | Raised |
|---|---|---|---|
| Websites, marketing | #090B0A page | #0F1110 alternate sections, cards | — |
| Apps, tools | #0C0C0C modules | #2E2E2E frame, seen only in the thin gaps between modules | #161616 controls, #202020 hover |
| Posters, social cards, illustrations | #0C0C0C | — | — (posters may also use light gray, mint or the green gradient) |

- In apps, the lighter frame sits *behind* darker modules: panels of #0C0C0C with 2–4 px gaps and rounded corners, so the frame reads as thin lines. The screen stays dark.
- On websites, alternate a #0F1110 section between #090B0A ones to separate topics; never more lighter than darker.
- No other backgrounds: no gradients, tinted grays, photos used as texture or noise made up for the job. Light layouts only when asked.
- Reference: strikelabs.app (web) and trade.strikelabs.app (app).

### Rules
- Dark by default for apps, tools and the web. Light only when asked, or for print and documents that will be printed.
- Black and white carry most of every layout: about 70% ground or ink, 25% grays, 5% or less green.
- Green is never a large area in UI. Posters may use more green: green grounds belong to posters and campaign art.
- Gradients: mint → green → deep, on posters and hero art only; never on UI text or controls.
- Red means loss and nothing else. Never use loss for errors in marketing, or for decoration. (In product UI, destructive actions and errors may use loss.)
- Data colors appear only when a chart can't be read with grays and green, and as few as work.
- Profit and loss always carry a sign (+/−) or an arrow.

### Text on green
- **UI (buttons, controls, badges on flat Strike Green):** ground #0C0C0C text, never white (white is 2.4:1).
- **Posters and campaign art on the mint → green gradient:** large display type and big numbers are white, as in the brand book's posters. Keep that type large (H3 size and up); small text on green is ground.
- **Swatches and other fills:** choose ground or white text by contrast, at least 4.5:1 (3:1 for large text). Ground reads on profit, mint, Mark Light and yellow; white reads on Mark Deep.

### Contrast (WCAG, measured)
| Pair | Ratio | |
|---|---|---|
| ink on ground | 18.6 | ✓ |
| ink-2 on ground | 9.3 | ✓ |
| green on ground | 7.7 | ✓ text and icons |
| ground on green | 7.7 | ✓ the text on green buttons |
| **ink on green** | **2.4** | ✗ never in UI |
| **green on ink (light)** | **2.4** | ✗ use deep (5.2) |
| ground on mint | 12.8 | ✓ |
| loss on ground | 6.0 | ✓ |

Titles need 7:1, body text 4.5:1, large or bold text and icons 3:1.

## Type

Geist for words. Use as few styles as possible: two weights per layout is usually enough (Regular and Medium).

| Family | Use |
|---|---|
| Geist (Light, Regular, Medium, SemiBold) | All headlines and text |
| Geist Mono | Code, wallet addresses, order books |
| Geist Pixel Circle | Large display type and big numbers on posters ("24%"), where contrast is high. Never body text or company documents |
| Ciburial | The STRIKE wordmark's typeface. Never set text in it; use the logo files |
| Arial (Regular, Bold) | The system fallback when web fonts are unavailable (blocked, email newsletters) |

Fonts: portable/fonts/ (fonts.css has the @font-face rules). All are under the SIL Open Font License.

### Setting type
- Set most type flush left. Never justify body text.
- Watch the rag; never leave an orphan or a widow. Balance heading lines so the second isn't a single word (`text-wrap: balance`).
- Four settings decide how easily type reads: kerning (the space between a pair of letters), tracking (the space across a run of letters), word spacing and line height. Take them from the chart below. A person checks them in anything meant to be read.
- Kerning: the font's metrics (`font-kerning: normal`). No fake bold or italics.

### Line height and tracking by size
Screen (px):

| Size | Line height | Tracking |
|---|---|---|
| up to 14 px | 135% | +1% |
| 15–24 px | 130% | 0% |
| 25–44 px | 120% | −1% |
| 45–79 px | 100% | −2% |
| 80 px and up | 90% | −3% |

Print (pt):

| Size | Line height | Tracking | Word spacing |
|---|---|---|---|
| up to 7 pt | 125% | +1% | 105% |
| 8–14 pt | 120% | 0% | 100% |
| 15–24 pt | 115% | −0.5% | 100% |
| 25–39 pt | 110% | −1% | 95% |
| 40–79 pt | 105% | −2% | 90% |
| 80 pt and up | 100% | −3% | 85% |

Use the chart as the default and adjust only for the medium, screen, material or print method.

### Headings
- **The main title is at most 2 lines** at its set size, 3–8 words. If it runs longer, cut words; don't shrink below the scale.
- Geist Medium (SemiBold allowed for small headings in dense UI).
- Sentence case. No full stop on a one-line title.
- Hierarchy: one title per view. A subtitle sits in ink-2 at about half the title size.

### Scale: slides and posters (1920 × 1080)
| Style | Size / line height | Weight | Tracking |
|---|---|---|---|
| H1 | 120 / 90% | Medium | −3% |
| H2 | 72 / 100% | Medium | −2% |
| H3 | 42 / 120% | Medium | −1% |
| Body | 18 / 130% | Regular | 0% |

Scale it with the format; posters start the headline at 120 px.

### Scale: web and app
| Style | Size / line height | Weight | Tracking |
|---|---|---|---|
| Display | 72 / 100% | Medium | −2% |
| H1 | 48 / 100% | Medium | −2% |
| H2 | 32 / 120% | Medium | −1% |
| H3 | 24 / 130% | Medium | 0% |
| Body L | 18 / 130% | Regular | 0% |
| Body | 16 / 130% | Regular | 0% |
| Small | 14 / 135% | Regular | +1% |
| Label | 12 / 135% | Medium | +1% |

- **Body text:** 45–75 characters a line.
- **Numbers:** tabular figures (`font-variant-numeric: tabular-nums`) in tables, prices and timers.
- **Bullets:** round (•). They echo the circles in the visual language.

## Logo

The Strike mark is three 3D chevrons stacked into one form. The layers stand for structure and continuity. One mark, built two ways:
- **3D, for screens:** the app, the website, social posts and slides. Gray side faces give it depth.
- **Flat, for anything printed or made:** merch, stickers, embroidery, packaging. One solid color, no gray.

### Which file
| Ground | Use | File (portable/logo/) |
|---|---|---|
| Dark (ground #0C0C0C, product UI) | 3D green mark, white STRIKE | strike-lockup-3d-green.svg · strike-mark-3d-green.svg |
| Light (white, light gray) and mint, on screen | 3D black, gray side faces | strike-lockup-3d-black.svg · strike-mark-3d-black.svg |
| Mint, bright or light grounds in print and merch; on screen under 32 px | Flat black | strike-lockup-flat-black.svg · strike-mark-flat-black.svg |
| Photo, soft | 3D white | strike-lockup-3d-white.svg · strike-mark-3d-white.svg |
| Photo, busy or noisy; green posters; print and merch on dark | Flat white | strike-lockup-flat-white.svg · strike-mark-flat-white.svg |
| Avatars, app icons | Mark on its tile | strike-mark-tile.svg |
| Round avatars, favicons | Mark on a disc | strike-mark-disc.svg |
| Link previews | 1200 × 630 | strike-og.png |

- The 3D green mark also works on light gray grounds, as in the brand book (1.12).
- The wordmark alone (strike-wordmark-black/white.svg) is for places where the mark already appears nearby.
- Use the lockup where there's room for the name, the mark alone where there isn't.

### Size
| | Minimum | |
|---|---|---|
| 3D, on screen | 32 px wide | Under 32 px, use the flat mark |
| Flat, on screen | 16 px | |
| Flat, print | 8 mm | |
| Flat, screen print | 12 mm | |
| Flat, embroidery | 35 mm | |
| Lockup | 20 px tall | |

- **Maximum:** never wider than one third of the layout. It scales with the layout.

### Clear space
Keep the width of the S in STRIKE (about 0.37 of the mark's height) clear on every side of the mark and of the lockup. Measure the S at the size the logo is used.

### Rules
- Never on a flat Strike Green ground in UI. On posters and brand art, the logo may sit on mint (3D black on screen, flat black in print).
- Never recolor, outline, add shadows, glows or other effects, stretch, rotate, separate the layers, or redraw it.
- Text: write "Strike". STRIKE in capitals, tracked 0.22 em in Ciburial, exists only inside the logo files.
- Place it in a corner of the layout grid, not centered over content, unless the logo is the subject (a cover, a sign-off). One logo per layout.

### Sub-brands (only when asked)
Strike has no official sub-brands. Build a lockup only when asked, the way the brand book does (1.9, 1.10). M is the height of the mark:
- **Horizontal:**
  - the mark;
  - a 0.43 M gap;
  - STRIKE (cap height 0.47 M, centered on the mark);
  - a 0.47 M gap;
  - the name in Geist Medium, sentence case, 1.22× STRIKE's height, on STRIKE's baseline.
- **Stacked:** the small lockup on top. Below it, 0.27 M lower, the name in Geist Medium at 1.31 M, left-aligned.
- **Powered by:** "Powered by" in Geist Medium at 0.6× STRIKE's cap height, centered on the mark, 0.6 M before it.

With the repo's scripts available, generate it: `node scripts/lockup.mjs --name "Markets" --layout horizontal --version 3d-green`. Otherwise compose it from the logo files with these proportions.

## Layout and UI

### Layout
- **Grid:** posters, social cards, slides and illustrations sit on a 50 px grid. Margins are 50 px on cards and posters, 24 px on mobile web, 64 px on desktop web.
- **Spacing:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Space:** leave room. Fewer elements aligned to the grid beat more elements. Group by spacing before adding lines or boxes.
- **Logo:** in a corner of the grid.
- **Breaking the grid:** designers may break poster grids when the layout still holds together. Product UI keeps to the grid.

### Surfaces
- **Apps and tools (dark by default):**
  - a lighter frame #2E2E2E behind everything;
  - modules (chart, order book, ticket, tables) are #0C0C0C panels with 2–4 px gaps and an 8–12 px radius, so the frame reads as thin lines;
  - inside a module, raised controls #161616, hover #202020;
  - no shadows on dark.
- **Websites:** page #090B0A; alternate sections and cards #0F1110 with a 1 px line (white at 10%).
- About 80% of the screen is the darkest background, the lighter one about 20%.
- **Light mode (when asked):** cards #FFFFFF with a 1 px line (ground at 8%), and at most a soft shadow (0 1px 2px at 6%).

### Components
| Component | Spec |
|---|---|
| Primary button | Green #10B981 fill, ground text, Geist Medium 14–16 px, 40 px tall (32 small), 8 px radius. One per view |
| Secondary button | #161616 fill, ink text, 1 px line |
| Ghost button | Text only, ink-2 → ink on hover |
| Input | #161616 field, 1 px line at 18%, 8 px radius, 40 px tall; label above in Label style; focus ring 2 px green |
| Card | #0F1110 on websites; a #0C0C0C module on the #2E2E2E frame in apps. 12 px radius, 24 px padding |
| Pill / tag | Full radius, 24 px tall, Label style |
| Table | Rows 40 px, hairline dividers, numbers right-aligned in tabular figures, header in Label style ink-3 |
| Toast | #202020, 8 px radius, one line, 4 s |
| Modal | #0C0C0C with a 1 px line at 18%, 12 px radius, max 480 px wide, ground at 70% behind |

- **States:** default, hover (one step lighter), active, focus (green ring), disabled (40% opacity), loading (no layout shift), error (loss color plus a line saying what happened and what to do).
- **Icons:** 24 px grid, 2 px stroke, round ends and corners, outline style; ink-2 by default.
- **Trading data:**
  - profit #3FD4AB, loss #EE5E74, always with a sign or an arrow;
  - prices in tabular figures;
  - time zones always shown (20:00 ET).
- **Empty, loading and error states** are designed, not left blank.
- **Accessibility:**
  - contrast per the Color section;
  - focus is always visible;
  - targets at least 32 px;
  - honor reduced motion.

## Illustration and motion

### Illustration
Strike's visual language is precise and plain: strong type, line-art illustration and a modular grid.

- **Formats:** flat (straight down) by default, the simplest expression of an idea; isometric 2:1 when the idea needs depth. Flat pieces are thin plates, so they keep their look when turned to 2:1.
- **Lines first:** faces are the ground color, so a shape in front hides what's behind it, and every other outline shows.
- **Line strengths:** three of them. On dark: subject #D0D6E0, support #62666D, background #3E3E44. On light they swap tier for tier.
- **Scale presets:** each grid cell is 50 px. Large illustrations: 1 px lines, 10 × 10 px nodes. Small illustrations: 1 px lines, 20 × 20 px nodes. Lines are 1 px at every size; nodes (small squares or circles marking exact points) are what change.
- **Dashed lines** mean "not real yet": possible outcomes, ranges, construction circles, limits.
- **Dots** carry tone: halftones for amount, dots along a curve for data.
- **Color:** grays and one green focus. Data colors only in infographics.
- **Fills:** line art first. A partial fill (a pale gray face, a dotted area, one green focus) is fine when it adds contrast or meaning, as in the brand book's feature examples; never fill the whole illustration.
- **Labels:** Geist, a ticker in Medium over its value in Regular; at most three labels except in infographics.
- **Grid:** every illustration is built on one shared 50 px grid, so the set stays consistent.
- **Illustration is not the logo:** an illustration is always line art, flat or in the 2:1 view. Never use the logo files, a solid color block or a screenshot as an illustration. To show the mark in an illustration, draw it as lined plates.
- **It supports the words:** next to a title, an illustration is quieter than the title: mostly the support line, one subject line, at most one green. The title stays the brightest thing on the card.
- **Never tiny:** no text under 12 px, no labels on small illustrations, no hairline detail that disappears at the size it's shown. Scale the illustration up or leave the detail out.
- **On cards and hover:** rest still; on hover make one move on the motion curves (gather, release), revealing detail (color as dots, the green focus) only then.
- **Making them:** use the Strike Figures tool (66 ready illustrations, exports SVG, PNG, MP4, GIF, animated SVG and Lottie) when it's available. Otherwise draw with these rules.

### Motion
- **Character:** calm and exact. One thing moves at a time and comes back to rest. The first frame is the still. No bounce, no flashing; honor reduced motion.

#### The two curves
Every move has a meeting point: the moment shapes come together (or pass through their rest state). Shapes speed up into it and slow down out of it, so the fastest frame is the meeting.

| Name | Curve | Duration | Use |
|---|---|---|---|
| Gather (ease-in) | cubic-bezier(0.55, 0, 0.85, 0) | 400 ms | Into the meeting point; back to rest when a hover ends |
| Release (ease-out) | cubic-bezier(0.15, 1, 0.6, 1) | 320 ms | Out of it to the new state; hover-in |
| Rest | — | 280 ms | Still between moves |
| UI (standard) | cubic-bezier(0.2, 0, 0, 1) | 120 / 200 / 320 ms | Plain UI: color, small changes, panels, page transitions |

- **A loop** is rest → gather → release: 280 + 400 + 320 = 1000 ms.
- **Everything uses them:** a move between two still states gathers into its midpoint and releases out of it; a move out and back does that twice; turns go in eased steps (a rest, then a move, each beat), never at a constant speed; light sweeps ease the same way.
- **Press** (a click): gather in 240 ms, release out 200 ms.
- Small moves may shorten both, keeping the ratio (gather a little longer than release).

#### Circle composition
- **Five equal circles, three over two.** Each touches its neighbors: centers 2r apart in a row, rows r·√3 apart, the lower two sitting in the gaps.
- **Drawn like every illustration:** thin plates with faces in the ground color (a circle in front hides the one behind), the subject line #D0D6E0 at rest size and up, the support line #62666D on circles giving way, and the one green focus as dots on the growing circle. No solid fills.
- **Flat or 2:1:** flat (straight down) to explain the composition, with the row centers as dashed construction lines; the 2:1 view to give the same plates depth. Mix them as the explanation needs.
- **Focus move:** one circle grows (up to 2×) while the others shrink (down to 0.5×) and stay packed against it. Changing focus always passes back through the five equal circles: gather into them, release out to the new focus.
- **Press move:** the five circles squeeze towards the center and back.
- **In a row** (e.g. icons): the hovered circle grows by about a third and its two neighbors give up the same width between them, so the row keeps its length.

#### Video and loops
3–6 s in whole seconds, seamless, built from 1 s beats. Type fades in; it never flies in.

## Data and infographics

- **Number first:** the headline number stands alone, large (Geist Medium, or Geist Pixel Circle on posters).
- **Chart types:** radar, segmented radial, bubbles, concentric circles, bars, lines, dot-matrix area. One idea per chart.
- **Color:** grays plus one green for the series that matters. Profit #3FD4AB and loss #EE5E74 mean only that. Yellow, sky and purple only when more series must be told apart, and as few as work.
- **Fills:** data marks (bubbles, segments, bars) may be solid or dotted; frames, axes and guides stay line art.
- **Labels:** ticker in Geist Medium over its value in Regular ("AMD" / "IV 106.2%"), at least 12 px at the size shown. Use tickers, not company names. Name every series; no legends when a direct label fits.
- **Axes:** hairlines in ink-3, few ticks, values in tabular figures, time zones stated.
- **Source:** a source and date line in Small, ink-3.
- **Numbers add up:** shares of a whole sum to 100%; one ticker appears once per chart, with one value.
- **Never:** 3D bar effects, drop shadows, gradients on bars, pie charts with more than five slices.

## Formats

### Sizes
| Format | Size |
|---|---|
| Post, landscape 16:9 (X, LinkedIn) | 1600 × 900 |
| Post, square 1:1 | 1200 × 1200 |
| Post, portrait 4:5 (Instagram) | 1200 × 1500 (or 1080 × 1350) |
| Link preview (OG) | 1200 × 630 |
| Poster | A-series portrait, 50 px grid |
| Slides | 1920 × 1080 |
| Email | 600 px wide |

### Posts and threads (X, Instagram, LinkedIn)
- **Size from the picture:** a wide screenshot or chart → 16:9; a tall one → 4:5; an illustration or words alone → any, 1:1 by default. Never A4.
- **Hierarchy:** the headline is the largest, highest-contrast thing on the card. Then the picture, then the sub; the logo, post number and risk line stay quiet. An illustration never outweighs the headline: draw it quieter or crop it off an edge.
- **Words:** an optional eyebrow (a few words); the headline (required, about 8 words, sentence case); an optional sub (one sentence). One phrase in the headline is highlighted, usually the number or the claim: green on black, deep on light, ground black on the green gradient.
- **Type:** the headline sets as large as its space allows, with line height and tracking from the chart in the Type section; when the words stand alone they set larger, up to 3 lines.
- **One picture, or none:**
  - *Illustration:* a line illustration beside the words (16:9) or under them (1:1, 4:5), on its own panel; or bleeding off a corner, cropped and dimmer. Pick the one that says the headline (a clock for hours, a globe for markets, a shield for custody).
  - *Screenshot (analytics):* as it is, in a frame (12–16 px corners, 1 px hairline), never recolored or redrawn; crop to the part that matters. A tall one sits beside the words at full height.
  - *Photo:* fills the card, cropped on its subject, toned down so the words read; the logo is white.
- **Logo:** one, in a bottom corner on the grid, with clear space of 0.37 × the mark's height on every side: nothing touches or overlaps it. The lockup when it fits; the mark alone when space is tight, never a squeezed lockup. The version for the ground: 3D green on black, 3D black on light, flat white on the green gradient and on photos.
- **Foot:** in a thread, the post number ("2/5") sits opposite the logo. The risk line is on single posts and the last post of a thread, on by default.
- **Grid:** 50 px cells, 50 px margins; edges of text, panels and frames on the grid.
- **Thread:** 3–7 posts, one idea each, numbered "1/5" at the end. The last post carries the risk line.
- **Hashtags:** none, or one tag for an event.

#### Reviewing a post
When asked to check or improve a post, list what you noticed as problems (one line each), then the next step for each: a better size, the illustration that fits, the phrase to highlight, a shorter headline, a number to check. Suggest, don't force: keep the user's words unless they ask for a rewrite, and let them pick which fixes to take. Check:
- The headline reads at a glance and is the biggest thing; nothing overlaps the logo.
- The picture fits the headline, and the size fits the picture.
- One phrase highlighted, sentence case, the tagline as written, US spelling, no avoided words or exclamation marks.
- Numbers are real and sourced ("about 80 underlyings", times in ET, USD or USDC); the risk line is there when required.

### Posters
- **Kinds:** tagline posters carry "Options on every market, every hour."; campaign posters carry one fact ("Listed options are closed 81% of the week") or one product line ("The terminal, rebuilt for options.").
- **Ground:** black, light gray, or the green gradient (mint → green).
- **Headline:** Geist Regular or Medium, sentence case, 2 lines at most, tracking −3%. On the green gradient, white.
- **Big number:** in Geist Medium or Geist Pixel Circle.
- **Lockup:** one, in a corner, in the version for the ground (flat in print).
- **Grid:** the 50 px grid structures every poster, deck and document. Designers may break it creatively, provided the layout still holds together.
- **Illustration:** one illustration or one number, never both competing.

### Slides
- One idea per slide. The title states the claim; the evidence sits under it.
- Section dividers: ground, a large gray section number, the title in ink.
- The lockup sits small in one corner, the same corner on every slide.

### Documents
- **Ground:** white for print.
- **Type:** Geist, H1/H2/Body from the Type section.
- **Lockup:** in the header.
- **Page numbers:** in Small, ink-3.

### Merch and print
- **Logo:** the flat logo, one color: black on light or bright grounds, white on dark. Minimums: 8 mm print, 12 mm screen print, 35 mm embroidery.
- **Mockups:** show the item in a real-world scene (keychain, poster, hoodie, T-shirt, matches), not on a made-up backdrop.

### Email
- 600 px wide, dark by default.
- Geist with Arial fallback.
- One primary button.
- The risk line and a link to strikelabs.app/risk in the footer.

## Words

The verbal brand from the brand book (0.2–0.6). Use these lines as written; don't paraphrase them.

### Positioning
- **Tagline:** Options on every market, every hour.
- **Mission:** Make markets run as long as the news does.
- **Value proposition:** Strike is an options exchange that never closes. Trade options on stocks, indices, pre-IPO companies, GPU compute and crypto from one self-custodial margin account.
- **Proof:**
  - Open 168 hours a week, against about 32.5 for listed options.
  - About 80 underlyings: stocks, indices, pre-IPO companies, GPU compute and crypto.
  - No key at Strike can move your funds. What is still trusted is documented.

### Narrative
Strike is open 168 hours a week, with a daily expiry at 20:00 ET. Positions can be hedged when events happen, not when markets reopen.

Markets react to news at any hour: earnings after the close, policy on a weekend, Asia overnight. Listed options trade about 32.5 hours a week. For the other 135, positions cannot be adjusted.

Custody is verifiable. Strike is self-custodial: there is no operator key, every state update is proven, and the parts still trusted are documented.

### Personality
| Trait | What it means | Not |
|---|---|---|
| Expert | We know options markets and are there when they move. | Jargon to impress |
| Exact | We build for precision and show the numbers. | Vague claims |
| Candid | We state risks and trade-offs first. | Hype or fear |

### Tone of voice
1. **Lead with the fact.** One number beats one adjective. Back every claim with something the reader can check.
2. **Keep it short and exact.** Plain words, short sentences, correct terms. Never cryptic.
3. **Pair benefit with risk.** Name the risk in the same sentence as the benefit, or the next.

### Writing examples
Write like the left column, never like the right.

| Write | Not |
|---|---|
| Options on every market, every hour. | "24/7 Options Trading" |
| Open 168 hours a week. | "The trading experience you'll never forget!" |
| No key at Strike can move your funds. What is still trusted is documented. | "Your money is 100% safe with us." |
| Positions can be hedged when events happen, not when markets reopen. | "Hedge whenever you want, stress-free." |

- **Use:** options exchange · self-custodial · margin account · underlying · listed options · expiry.
- **Avoid:** "24/7" · "revolutionary" · "guaranteed" · "safe" · "unforgettable" · exclamation marks · emoji.

### Mechanics
- **Sentence case** for every heading, label and button. No full stop on a one-line title.
- **US spelling:** color, center, gray, organize, favorite.
- **Numbers** as digits, with units: 168 hours, 20:00 ET. Always state the time zone.
- **Name:** write Strike. STRIKE in capitals is only the logo.
- **Headings:** short; the main title is at most 2 lines.
- **Money:** USDC by default for deposits, collateral, settlement and fees. Ask the user when USD or USDC could be meant.
- **Never invent a number or claim.** If you need one you don't have, write [number] and say so.

### Facts you may use (Nov 2026)
- **Hours:** open 168 hours a week; the book never closes. Listed options trade about 32.5 hours a week (closed 81% of the week).
- **Underlyings:** about 80. Write "about 80 underlyings"; never another count unless the user gives it.
- **Expiries:**
  - a daily expiry at 20:00 ET (New York time, adjusted for daylight saving);
  - 8 weekly expiries (Fridays);
  - monthly expiries (third Fridays, out to 3 months).
- **Contracts:** European style, cash-settled, multiplier 1.0, fractional contracts.
- **What you can trade:** US and Asian stocks, indices and ETFs, pre-IPO companies (OpenAI, Anthropic), GPU compute (H100, H200, B200, A100, RTX 5090 rental rates, settled to the Ornn index) and crypto (BTC, ETH, SOL, HYPE).
- **Margin:** one self-custodial margin account; positions across all of these net against each other.
- **Speed:** orders match in under a microsecond.
- **Fees:** takers 40 bps of premium, makers 10 bps, and at settlement the winning side 50 bps of intrinsic. Fees are zero during the closed beta, and the rates can change.
- **Custody:** "No key at Strike can move your funds." The vault has no operator role and accepts new state only with a zero-knowledge proof and an attester quorum. Always pair this with what is still trusted:
  - settlement prints;
  - prices on market orders;
  - liquidation prices;
  - the attesters, all three of which Strike runs today.
- **Access:** closed beta, invite required.

### Legal
- **Risk line:** "Options involve risk. Closed beta, invite required."
- **Where it goes:**
  - page and email footers;
  - every ad;
  - the last post of any thread about trading;
  - a link to strikelabs.app/risk wherever there's room.
- **Who can use Strike:** 18 or older, not US persons, not in sanctioned regions (Cuba, Iran, North Korea, Syria, Crimea, Donetsk, Luhansk). Never target them in copy or ads.
- **Never:**
  - promise returns;
  - say "safe", "guaranteed" or "risk-free";
  - predict prices;
  - imply Strike is a registered exchange, broker or adviser.

## Before you hand it over

- [ ] Dark ground, unless the user asked for light or it's for print
- [ ] Backgrounds only from the set: #090B0A / #0F1110 on the web, #0C0C0C modules on #2E2E2E in apps, #0C0C0C on posters; about 80% the darkest
- [ ] Geist only (Geist Mono for code and addresses, Geist Pixel Circle for poster display type)
- [ ] Main title at most 2 lines, Geist Medium, sentence case; line height and tracking from the chart in the Type section
- [ ] Contrast: titles 7:1, body 4.5:1; no white text on flat green in UI
- [ ] Green at most about 5% of the layout; one primary button
- [ ] Logo: 3D on screens, flat in print; the right version for the ground; above the minimum size (3D 32 px, flat 16 px / 8 mm); no wider than a third of the layout; clear space kept; one per layout
- [ ] Spacing on the 4 px scale (50 px grid for posters and cards); corners 6 / 8 / 12 px
- [ ] Profit and loss carry a sign; red only means loss
- [ ] Copy uses the verbal brand: tagline as written, US spelling, no 24/7, hype or exclamation marks
- [ ] Nothing invented; "about 80 underlyings" is the only count; USDC unless told otherwise
- [ ] Risk line where required
- [ ] Posts: the size fits the picture; the headline is the biggest thing; one picture at most; the logo has clear space (the mark alone when tight)
- [ ] Illustrations are line art (flat or 2:1), 1 px lines, never the logo or a solid block, and quieter than their titles; nothing tiny (no text under 12 px)
- [ ] Nothing repeats: each action, label and message appears once; nothing contradicts
- [ ] Motion uses gather (ease-in, 400 ms) and release (ease-out, 320 ms), or the UI ease for plain UI
- [ ] Your reply to the user is short and direct

---

# Token values

## Color tokens
CSS variables come from tokens.css; Tailwind uses the same names (`bg-ground`, `text-ink-2`).

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
