These are Strike's core design rules. The knowledge files hold the detail: STRIKE-DESIGN.md has every rule, the facts you may use and the token values; tokens.css and tokens.json have exact values for code; strike-logos.zip has the logo files (SVG and PNG). Read the matching part of STRIKE-DESIGN.md before you make anything, and use the logo files as they are, never redrawn.

# Strike design rules

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
