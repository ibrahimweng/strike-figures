# Strike design rules

> All of the Strike design rules in one file: the core rules, then the detail, then the token values. The logo files, fonts and tokens sit next to this file in the Strike design kit (strike-design-kit.zip).

Strike is the options exchange that never closes. Its design is calm, exact and restrained: black and white do most of the work, one green marks what matters, and nothing is decorative. Follow these rules for anything you make for Strike: UI, web pages, posts, posters, decks, docs, illustrations and copy. Where a rule and a request conflict, say so in one line and follow the rule unless the user insists.

## Make it easy
Give people the simplest way first: one link to copy, one command, one button. Offer downloads and longer steps only as the fallback.
- **Say each thing once.** No repeated actions, labels or messages on a screen, and nothing that contradicts something else. If two parts do the same job, keep one.
- Simplify whatever can be simplified. Clear and direct beats complete.

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
- Motion is calm: one thing moves at a time and returns to rest. No bounce, no flashing.
- Shapes **gather** into a meeting point with an ease-in, cubic-bezier(0.55, 0, 0.85, 0), 400 ms, and **release** from it with an ease-out, cubic-bezier(0.15, 1, 0.6, 1), 320 ms; then rest 280 ms (a 1 s loop). Plain UI uses cubic-bezier(0.2, 0, 0, 1), 120–200 ms.
- Circle compositions: five equal circles, three over two, each touching its neighbours, in one grey. To move, one circle grows (up to 2×) as the others shrink, always passing back through the five equal circles.

## Words
- Verbal branding is still being written: keep copy short, plain and factual. No hype, no exclamation marks, no emoji in brand copy.
- Facts you may use: open 168 hours a week; listed options trade about 32.5 hours a week; a daily expiry at 20:00 ET plus weeklies and monthlies; European style, cash-settled; one margin account across stocks, indices and ETFs, pre-IPO, GPU compute and crypto; "No key at Strike can move your money." Never state how many markets Strike lists unless the user gives the number.
- A custody claim always comes with what is still trusted (settlement prints, prices on market orders, liquidation prices, and the attesters, run by Strike today).
- Risk line: "Options involve risk. Closed beta, invite required." It goes in page and email footers, every ad, and the last post of any thread about trading, with a link to strikelabs.app/risk where there's room.
- Never target the US or sanctioned regions.

## Before you hand it over
Check: dark unless asked · backgrounds from the set · nothing said twice · Geist only · title ≤ 2 lines · contrast · no white on green · ≤ 5% green · logo version right for the ground · nothing invented · USDC unless told otherwise · risk line where needed. Keep your own reply short and direct.

---

# Detailed rules

## Colour

A near-black ground and one green. Black and white carry the system; green signals the one thing that matters. Values: tokens/tokens.json.

### Palette
| Token | Hex | Use |
|---|---|---|
| ground | #0C0C0C | Posters, social cards, illustrations, app modules |
| web.ground / web.section | #090B0A / #0F1110 | Website page / alternate sections and cards |
| frame | #2E2E2E | App frame, seen only in the gaps between modules |
| surface-1 / 2 / 3 | #161616 / #202020 / #2A2A2A | Raised controls / hover and selected / pressed |
| line / line-strong | white at 10% / 18% | Hairlines / input borders and dividers |
| ink | #F9F9F9 | Text on dark; light ground |
| ink-2 | #B3B3B3 | Secondary text on dark |
| ink-3 | #8A8F98 | Muted text, icons |
| green | #10B981 | Primary action, focus ring, one highlight |
| deep | #047857 | Green on light grounds |
| profit / loss | #3FD4AB / #EE5E74 | Gains, buys, bids / losses, sells, asks |
| mint | #50EBA0 | Poster grounds |
| yellow / sky / purple | #FFEF3C / #0788F7 / #976FE6 | Extra chart series only |

Light mode (only when asked) swaps tier for tier: ground #F9F9F9, surfaces #FFFFFF / #F1F1F1 / #E8E8E9, ink #0C0C0C, ink-2 #4A4D52, ink-3 #6B6F76, lines in ground at 8% / 14%.

### Backgrounds
Strike is dark. About 80% of any screen is the darkest background; the lighter one (about 20%) only separates parts and gives depth. Use only these sets:

| Medium | Darkest (~80%) | Lighter (~20%) | Raised |
|---|---|---|---|
| Websites, marketing | #090B0A page | #0F1110 alternate sections, cards | — |
| Apps, tools | #0C0C0C modules | #2E2E2E frame, seen only in the thin gaps between modules | #161616 controls, #202020 hover |
| Posters, social cards, illustrations | #0C0C0C | — | — (mint for posters only) |

- In apps, the lighter frame sits *behind* darker modules: panels of #0C0C0C with 2–4 px gaps and rounded corners, so the frame reads as thin lines. The screen stays dark.
- On websites, alternate a #0F1110 section between #090B0A ones to separate topics; never more lighter than darker.
- No other backgrounds: no gradients, tinted greys, photos used as texture or noise made up for the job. Light layouts only when asked.
- Reference: strikelabs.app (web) and trade.strikelabs.app (app).

### Rules
- Dark by default for apps, tools and the web. Light only when asked, or for print and documents that will be printed.
- About 70% ground or ink, 25% greys, ≤ 5% green per layout.
- Green is never a large area in UI. Green grounds belong to posters and campaign art.
- Gradients: green → deep, or mint → green, on posters and hero art only; never on text or controls.
- Red means loss and nothing else. Never use loss for errors in marketing, or for decoration. (In product UI, destructive actions and errors may use loss.)
- Extra series colours appear only when a chart can't be read with greys and green, and as few as work.
- Profit and loss always carry a sign (+/−) or an arrow.

### Contrast (WCAG, measured)
| Pair | Ratio | |
|---|---|---|
| ink on ground | 18.6 | ✓ |
| ink-2 on ground | 9.3 | ✓ |
| green on ground | 7.7 | ✓ text and icons |
| ground on green | 7.7 | ✓ the text on green buttons and green posters |
| **ink on green** | **2.4** | ✗ never |
| **green on ink (light)** | **2.4** | ✗ use deep (5.2) |
| ground on mint | 12.8 | ✓ |
| loss on ground | 6.0 | ✓ |

Titles need 7:1, body text 4.5:1, large or bold text and icons 3:1.

## Type

Geist for words. Restraint: two weights per layout is usually enough (Regular and Medium).

| Family | Use |
|---|---|
| Geist (Light, Regular, Medium, SemiBold) | All headlines and text |
| Geist Mono | Code, wallet addresses, order books |
| Geist Pixel Circle | Big display numbers on posters ("24%"), nothing else |
| Ciburial | The STRIKE wordmark, inside the logo files only |
| Arial | Fallback where web fonts are blocked (emails) |

Fonts: fonts/ (fonts.css has the @font-face rules). All are under the SIL Open Font License.

### Headings
- **The main title is at most 2 lines** at its set size, 3–8 words. If it runs longer, cut words; don't shrink below the scale.
- Geist Medium (SemiBold allowed for small headings in dense UI).
- Tracking: −3% at 48 px and up, −2% at 32 px, −1.5% at 24 px, 0 below.
- Line height: 0.9–1.0 for display and H1, 1.1–1.2 for H2 and H3.
- Sentence case. No full stop on a one-line title. Balance the lines so the second isn't a single word (`text-wrap: balance`).
- Hierarchy: one title per view. A subtitle sits in ink-2 at about half the title size.

### Scale (web and app)
| Style | Size / line height | Weight | Tracking |
|---|---|---|---|
| Display | 72 / 0.95 | Medium | −3% |
| H1 | 48 / 1.0 | Medium | −3% |
| H2 | 32 / 1.1 | Medium | −2% |
| H3 | 24 / 1.2 | Medium | −1.5% |
| Body L | 18 / 1.5 | Regular | 0 |
| Body | 16 / 1.5 | Regular | 0 |
| Small | 14 / 1.45 | Regular | 0 |
| Label | 12 / 1.4 | Medium | +2% |

- **Posters and slides:** start at 120 px for the headline, line height 90%, tracking −3%, and scale with the format.
- **Body text:** 45–75 characters a line; never justified.
- **Numbers:** tabular figures (`font-variant-numeric: tabular-nums`) in tables, prices and timers.
- **Bullets:** round (•).
- **Kerning:** on (`font-kerning: normal`); no fake bold or italics.

## Logo

The mark is three stacked layers. The logo is 3D by default.

### Which file
| Ground | Use | File (logo/) |
|---|---|---|
| Dark (ground #0C0C0C, product UI) | 3D green mark, white STRIKE | strike-lockup-3d-green.svg · strike-mark-3d-green.svg |
| Light (white, light grey) | 3D black | strike-lockup-3d-black.svg · strike-mark-3d-black.svg |
| Mint, very bright grounds | Flat black | strike-lockup-flat-black.svg · strike-mark-flat-black.svg |
| Photo, soft | 3D white | strike-lockup-3d-white.svg · strike-mark-3d-white.svg |
| Photo, busy or noisy; green posters | Flat white | strike-lockup-flat-white.svg · strike-mark-flat-white.svg |
| Merch, one-colour print, embroidery | Flat black or flat white | strike-*-flat-*.svg |
| Small sizes where 3D layers blur (under ~32 px) | Flat | strike-mark-flat-*.svg |
| Avatars, app icons | Mark on its tile | strike-mark-tile.svg |
| Round avatars, favicons | Mark on a disc | strike-mark-disc.svg |
| Link previews | 1200 × 630 | strike-og.png |

- The wordmark alone (strike-wordmark-black/white.svg) is for places where the mark already appears nearby.
- Use the lockup where there's room for the name, the mark alone where there isn't.

### Rules
- Mark at least 16 px; lockup at least 20 px tall.
- Clear space: one layer of the mark on every side.
- Never on a green ground in UI. On posters the flat black logo may sit on mint.
- Never recolour, outline, add shadows, glows or other effects, stretch, rotate, separate the layers, or redraw it.
- Text: write "Strike". STRIKE in capitals, tracked 0.22 em in Ciburial, exists only inside the logo files.
- Place it in a corner of the layout grid, not centred over content, unless the logo is the subject (a cover, a sign-off).

### Sub-brands (only when asked)
Strike has no official sub-brands. When a user asks for one, build it the way the brand book does. M is the height of the mark:
- **Horizontal:**
  - the mark;
  - a 0.43 M gap;
  - STRIKE (cap height 0.47 M, centred on the mark);
  - a 0.47 M gap;
  - the name in Geist Medium, sentence case, 1.22× STRIKE's height, on STRIKE's baseline.
- **Stacked:** the small lockup on top. Below it, 0.27 M lower, the name in Geist Medium at 1.31 M, left-aligned.
- **Powered by:** "Powered by" in Geist Medium at 0.6× STRIKE's cap height, centred on the mark, 0.6 M before it.

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

- **States:** default, hover (one step lighter), active, focus (green ring), disabled (40% opacity), loading (no layout shift), error (loss colour plus a line saying what happened and what to do).
- **Icons:** 24 px grid, 2 px stroke, round ends and corners, outline style; ink-2 by default.
- **Trading data:**
  - profit #3FD4AB, loss #EE5E74, always with a sign or an arrow;
  - prices in tabular figures;
  - time zones always shown (20:00 ET).
- **Empty, loading and error states** are designed, not left blank.
- **Accessibility:**
  - contrast per the Colour section;
  - focus is always visible;
  - targets at least 32 px;
  - honour reduced motion.

## Illustration and motion

### Illustration
- **Formats:** flat (straight down) for the simplest expression of an idea; isometric 2:1 when the idea needs depth. Flat pieces are thin plates, so they keep their look when turned to 2:1.
- **Lines first:** faces are the ground colour, so a shape in front hides what's behind it, and every other outline shows.
- **Line strengths:** three of them. On dark: subject #D0D6E0, support #62666D, background #3E3E44. On light they swap tier for tier.
- **Line weight:** 1 px on large illustrations, 2 px on small ones. Nodes (small squares or circles marking exact points) are 10 px and 20 px.
- **Dashed lines** mean "not real yet": possible outcomes, ranges, construction circles, limits.
- **Dots** carry tone: halftones for amount, dots along a curve for data.
- **Colour:** greys and one green focus. Data colours only in infographics.
- **Labels:** Geist, a ticker in Medium over its value in Regular; at most three labels except in infographics.
- **Grid:** built on the 50 px grid.
- **Making them:** use the Strike Figures tool (65 ready illustrations, exports SVG, PNG, MP4, GIF, animated SVG and Lottie) when it's available. Otherwise draw with these rules.

### Motion
- **Character:** calm and exact. One thing moves at a time and comes back to rest. The first frame is the still. No bounce, no flashing; honour reduced motion.

#### The two curves
Every move has a meeting point: the moment shapes come together (or pass through their rest state). Shapes speed up into it and slow down out of it, so the fastest frame is the meeting.

| Name | Curve | Duration | Use |
|---|---|---|---|
| Gather (ease-in) | cubic-bezier(0.55, 0, 0.85, 0) | 400 ms | Into the meeting point; back to rest when a hover ends |
| Release (ease-out) | cubic-bezier(0.15, 1, 0.6, 1) | 320 ms | Out of it to the new state; hover-in |
| Rest | — | 280 ms | Still between moves |
| UI (standard) | cubic-bezier(0.2, 0, 0, 1) | 120 / 200 / 320 ms | Plain UI: colour, small changes, panels, page transitions |

- **A loop** is rest → gather → release: 280 + 400 + 320 = 1000 ms.
- **Press** (a click): gather in 240 ms, release out 200 ms.
- Small moves may shorten both, keeping the ratio (gather a little longer than release).

#### Circle composition
- **Five equal circles, three over two.** Each touches its neighbours: centres 2r apart in a row, rows r·√3 apart, the lower two sitting in the gaps.
- One grey (ink-2 #B3B3B3 on dark). At most one green, for the one thing that matters.
- **Focus move:** one circle grows (up to 2×) while the others shrink (down to 0.5×) and stay packed against it. Changing focus always passes back through the five equal circles: gather into them, release out to the new focus.
- **Press move:** the five circles squeeze towards the centre and back.
- **In a row** (e.g. icons): the hovered circle grows by about a third and its two neighbours give up the same width between them, so the row keeps its length.

#### Video and loops
3–6 s, seamless, built from 1 s moves. Type fades in; it never flies in.

## Data and infographics

- **Number first:** the headline number stands alone, large (Geist Medium, or Geist Pixel Circle on posters).
- **Chart types:** radar, segmented radial, bubbles, concentric circles, bars, lines, dot-matrix area. One idea per chart.
- **Colour:** greys plus one green for the series that matters. Profit #3FD4AB and loss #EE5E74 mean only that. Yellow, sky and purple only when more series must be told apart, and as few as work.
- **Labels:** ticker in Geist Medium over its value in Regular. Name every series; no legends when a direct label fits.
- **Axes:** hairlines in ink-3, few ticks, values in tabular figures, time zones stated.
- **Source:** a source and date line in Small, ink-3.
- **Never:** 3D bar effects, drop shadows, gradients on bars, pie charts with more than five slices.

## Formats

### Sizes
| Format | Size |
|---|---|
| X post image | 1600 × 900 (16:9) or 1200 × 1200 |
| Link preview (OG) | 1200 × 630 |
| Instagram | 1080 × 1350 or 1080 × 1080 |
| Poster | A-series portrait, 50 px grid |
| Slides | 1920 × 1080 |
| Email | 600 px wide |

### X posts and threads
- **Card:** one card per post, with the illustration on one side and the words on the other.
  - The headline is at most 2 lines and 8 words, with one phrase in green (on green grounds, that phrase is in ground black).
  - The lock-up goes in a bottom corner, with the post number ("2/5") opposite.
- **Thread:** 3–7 posts, one idea each, numbered "1/5" at the end. The last post carries the risk line.
- **Hashtags:** none, or one tag for an event.

### Posters
- **Ground:** black, light grey, or the green gradient (mint → green).
- **Headline:** Geist Regular or Medium, 2 lines at most, tracking −3%.
- **Big number:** in Geist Medium or Geist Pixel Circle.
- **Lock-up:** in a corner, in the version for the ground.
- **Illustration:** one illustration or one number, never both competing.

### Slides
- One idea per slide. The title states the claim; the evidence sits under it.
- Section dividers: ground, a large grey section number, the title in ink.
- The lock-up sits small in one corner, the same corner on every slide.

### Documents
- **Ground:** white for print.
- **Type:** Geist, H1/H2/Body from the Type section.
- **Lock-up:** in the header.
- **Page numbers:** in Small, ink-3.

### Email
- 600 px wide, dark by default.
- Geist with Arial fallback.
- One primary button.
- The risk line and a link to strikelabs.app/risk in the footer.

## Words

Verbal branding is still being written. Until then, keep copy short, plain and factual.

### Rules
- **Headings:** short; the main title is at most 2 lines.
- **Sentences:** plain words, no hype, no exclamation marks, no emoji in brand copy.
- **Name:** "Strike" in text, never "STRIKE".
- **Numbers:** use numerals, and always state time zones (20:00 ET).
- **Money:** USDC by default for deposits, collateral, settlement and fees. Ask the user when USD or USDC could be meant.
- **Never invent a number or claim.** If you need one you don't have, write [number] and say so.

### Facts you may use (strikelabs.app, Nov 2026)
- **Hours:** open 168 hours a week; the book never closes. Listed options trade about 32.5 hours a week (closed 81% of the week).
- **Expiries:**
  - a daily expiry at 20:00 ET (New York time, adjusted for daylight saving);
  - 8 weekly expiries (Fridays);
  - monthly expiries (third Fridays, out to 3 months).
- **Contracts:** European style, cash-settled, multiplier 1.0, fractional contracts.
- **What you can trade:** US and Asian stocks, indices and ETFs, pre-IPO companies (OpenAI, Anthropic), GPU compute (H100, H200, B200, A100, RTX 5090 rental rates, settled to the Ornn index) and crypto (BTC, ETH, SOL, HYPE). Never state a total number of markets unless the user gives it.
- **Margin:** one margin account; positions across all of these net against each other.
- **Speed:** orders match in under a microsecond.
- **Fees:** takers 40 bps of premium, makers 10 bps, and at settlement the winning side 50 bps of intrinsic. Fees are zero during the closed beta, and the rates can change.
- **Custody:** "No key at Strike can move your money." The vault has no operator role and accepts new state only with a zero-knowledge proof and an attester quorum. Always pair this with what is still trusted:
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
- [ ] Geist only (Geist Mono for code and addresses, Geist Pixel Circle for poster numbers)
- [ ] Main title at most 2 lines, Geist Medium, tracked tight
- [ ] Contrast: titles 7:1, body 4.5:1; no white text on green
- [ ] Green at most about 5% of the layout; one primary button
- [ ] Logo: the right version for the ground, at least 16 px, clear space kept, not on green in UI
- [ ] Spacing on the 4 px scale (50 px grid for posters and cards); corners 6 / 8 / 12 px
- [ ] Profit and loss carry a sign; red only means loss
- [ ] Nothing invented; no market count; USDC unless told otherwise
- [ ] Risk line where required
- [ ] Nothing repeats: each action, label and message appears once; nothing contradicts
- [ ] Motion uses gather (ease-in, 400 ms) and release (ease-out, 320 ms), or the UI ease for plain UI
- [ ] Your reply to the user is short and direct

---

# Token values

## Colour tokens
CSS variables come from tokens.css; Tailwind uses the same names (`bg-ground`, `text-ink-2`).

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
- **Motion:** fast 120ms, base 200ms, slow 320ms, gather 400ms, release 320ms, rest 280ms, loop 1000ms, press-in 240ms, press-out 200ms; ease cubic-bezier(0.2, 0, 0, 1), cubic-bezier(0.55, 0, 0.85, 0), cubic-bezier(0.15, 1, 0.6, 1).
