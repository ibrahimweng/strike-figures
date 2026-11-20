# Strike design rules

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

## Files
Paths are relative to the project's root. Open the rule file for the work in hand before you start.

- `strike-design/rules/colour.md`: Palette with hex values, light mode, how much green, gradients, profit and loss, measured contrast pairs. Read before choosing or checking any colour.
- `strike-design/rules/type.md`: Fonts, heading rules, the type scale, numbers and line length. Read before setting any text.
- `strike-design/rules/logo.md`: Which logo file for which ground, minimum sizes, clear space, misuse, and sub-brand lockups. Read whenever the logo appears.
- `strike-design/rules/layout-ui.md`: Grid, margins, spacing, surfaces and component specs (buttons, inputs, cards, tables, modals, states, icons). Read for any UI or layout.
- `strike-design/rules/illustration-motion.md`: Line illustration rules (isometric or flat, line greys, dashes, labels) and motion timing. Read for illustrations and animation.
- `strike-design/rules/data.md`: Charts and infographics: number first, chart types, colours, labels, axes, sources. Read for any chart or data graphic.
- `strike-design/rules/formats.md`: Sizes and layouts for X posts and threads, posters, slides, documents and email. Read when making one of these.
- `strike-design/rules/words.md`: Copy rules, the facts you may use, custody wording, the risk line and legal limits. Read for any headline, copy or claim.
- `strike-design/rules/checklist.md`: The checks to run before handing work over.
- `strike-design/tokens/tokens.css`: CSS variables (dark on `:root`, light under `[data-theme="light"]`) and type classes (`.strike-h1` and the rest). The same values are in `strike-design/tokens/tokens.json`, `strike-design/tokens/tailwind.preset.cjs` (Tailwind v3) and `strike-design/tokens/theme.css` (Tailwind v4).
- `strike-design/assets/fonts/`: Geist and the other brand fonts, with fonts.css (the @font-face rules).
- `strike-design/assets/logo/`: the logo files; the logo rules say which one to use for each ground.
- `strike-design/scripts/check.mjs`: checks finished files against these rules. Run `node strike-design/scripts/check.mjs <files or folder>` and fix every error before you hand work over.
- `strike-design/scripts/lockup.mjs`: builds a sub-brand lockup, only when asked. `node strike-design/scripts/lockup.mjs --name "Vaults" --layout horizontal --version 3d-green --out vaults.svg`.
