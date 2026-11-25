# Strike design skill: brand spec, draft 0.3

> **Superseded in part by the final brand book (50 pages, 25 Nov 2026).** The rules the skill ships are in `source/`; where this draft differs, `source/` wins. Decisions D19–D30 below record what changed.

## Decisions so far
| # | Decision | Date |
|---|---|---|
| D1 | Type: **Geist** for headlines and body (as in the PDF). Ciburial is for the wordmark only. | 20 Nov 2026 |
| D2 | Colour: the site palette (strikelabs.app/brand), plus Yellow, Sky and Purple **only in infographics** that need more series. | 20 Nov 2026 |
| D3 | Corners rounded: 6 px small controls, 8 px buttons and inputs, 12 px cards. | 20 Nov 2026 |
| D4 | Logo on green: **never in UI**. On posters, the flat logo in black or white may sit on Mint for variety. | 20 Nov 2026 |
| D5 | Web apps and tools are always on the dark ground unless the user asks for light. | 20 Nov 2026 |
| D6 | Facts, legal lines, regions and logo rules taken from strikelabs.app (see SITE-FINDINGS.md). | 20 Nov 2026 |
| D7 | Money: default to **USDC** (deposits, collateral, settlement, fees). If it's unclear whether USD or USDC is meant, the skill **asks the user**. | 20 Nov 2026 |
| D8 | Never state how many markets Strike lists ("underlyings"). Use the number only when the user supplies it. | 20 Nov 2026 |
| D9 | The 32.5-hour figure is used as the site states it; no citation needed. | 20 Nov 2026 |
| D10 | Risk line placement approved: page and email footers, every ad, the last post of a trading thread, a link to /risk where there's room. | 20 Nov 2026 |
| D11 | Verbal branding is **out of scope for now**. The skill enforces only the basic writing rules in §3; no humour (§4 removed). | 20 Nov 2026 |
| D12 | Headings: short; the main title is **at most 2 lines**, Geist Medium or SemiBold, tight tracking, high contrast against its ground. | 20 Nov 2026 |
| D13 | Repo: **strike-design-skill**. It must work in any AI tool: Claude, ChatGPT, Cursor, Perplexity, Figma and others. | 20 Nov 2026 |
| D14 | No official sub-brands. Build a lock-up only when asked, using the brand book's construction; the name is set in Geist Medium. | 20 Nov 2026 |
| D15 | The logo is 3D by default. The flat, fully opaque logo is for very bright grounds (mint), merch, and wherever the 3D logo won't fit. | 20 Nov 2026 |
| D16 | On photos the logo is always white: flat white on busy or noisy images, 3D white on soft images. | 20 Nov 2026 |
| D17 | Four colour versions, chosen by contrast and hierarchy: 3D black on light, 3D green with white type on dark, flat black on mint, flat white on photos. | 20 Nov 2026 |
| D18 | The brand is calm and subtle. Designs show restraint, and the skill's own replies are direct, without over-explaining. | 20 Nov 2026 |
| D19 | Verbal branding is written (replaces D11): tagline "Options on every market, every hour.", mission, positioning, personality, tone, writing examples, words to use and avoid, mechanics. | 25 Nov 2026 |
| D20 | Strike lists "about 80 underlyings" (replaces D8). No other count unless the user gives it. | 25 Nov 2026 |
| D21 | Custody line: "No key at Strike can move your funds." (was "money"), always with what is still trusted. | 25 Nov 2026 |
| D22 | US spelling everywhere (color, center, gray). | 25 Nov 2026 |
| D23 | Logo: 3D for screens, flat for anything printed or made (replaces D15). 3D black has gray side faces (black at 60%) and is used on light grounds and mint on screen. | 25 Nov 2026 |
| D24 | Logo sizes: 3D at least 32 px; flat 16 px on screen, 8 mm print, 12 mm screen print, 35 mm embroidery; never wider than a third of the layout. Clear space: the width of the S in STRIKE. | 25 Nov 2026 |
| D25 | Type: line height and tracking follow the brand book's chart by size (screen and print); slides and posters use H1 120, H2 72, H3 42, body 18. | 25 Nov 2026 |
| D26 | Geist Pixel: large display type and numbers on posters, where contrast is high; never body text or company documents. | 25 Nov 2026 |
| D27 | Color: the brand book's names, RGB % and CMYK; secondary colors at 5% or less. White text on flat green stays banned in UI; poster display type on the green gradient is white. | 25 Nov 2026 |
| D28 | Illustration lines are 1 px at every size; nodes 10 px (large) or 20 px (small). Partial fills are allowed when they add contrast or meaning. | 25 Nov 2026 |
| D29 | Mockups show items in real-world scenes. | 25 Nov 2026 |
| D30 | Sentence case for every heading, including the reference posters ("of the week", the tagline). | 25 Nov 2026 |

This spec turns the brand book into exact rules that an AI skill can follow. Once it's approved, it is split into the skill's files.

**Markers:**
- **[Book]**: taken from the brand book (fixed where the book is wrong; see §20).
- **[Agreed]**: decided with you earlier (Figures tool).
- **[Draft]**: my proposal to fill a gap. Approve, change or strike it.
- **[You]**: needs an answer or a file from you.

---

## 1. Who Strike is [Book]

- **What it is.** Strike is the options exchange that never closes. Trade calls and puts on stocks, indices, pre-IPO companies, GPU compute and crypto, all from one margin account. Open 168 hours a week, with a daily expiry at 20:00 ET. Hedge when it happens, not when the market reopens.
- **Custody.** You never have to take our word for where your money is. Strike is self-custodied. There is no operator key, every state update is proven, and we say plainly what is still trusted.
- **Narrative.** News doesn't keep office hours. Earnings land after the close. Headlines break on a Saturday. Asia trades while New York sleeps. Yet listed options are open about 32.5 hours a week, so for the rest of it, you wait.
- **Mission.** Make markets as continuous as the news.
- **Signature.** *Built exact. Open always. Honest about the rest.*
- **Tagline in use.** *Options on every market, every hour.*

### Personality [Book]
| Trait | Means |
|---|---|
| Awake Experts | We know these markets and we're there when they move. Calm, never hyped. |
| Exact Builders | We engineer for precision and prove it with numbers. |
| Candid Allies | We're on your side, so we name the risks and the trade-offs first. |

## 2. Facts and claims

Every claim must be checkable. The skill uses only the facts on this list, and says when a fact it needs is missing.

| Fact | Source | Status |
|---|---|---|
| Open 168 hours a week ("The book never closes.") | Book, site | ✓ |
| Listed options trade about 32.5 hours a week ("closed 81% of the week") | Book, site | ✓, [You] source to cite |
| Daily expiry at 20:00 ET (New York time, adjusted for daylight saving), plus 8 weeklies and monthlies | Book, site, docs | ✓ |
| European style, cash-settled, multiplier 1.0, fractional contracts | Site, docs | ✓ |
| Underlyings: US and Asian stocks, indices and ETFs, pre-IPO (OpenAI, Anthropic), GPU compute (H100, H200, B200, A100, RTX 5090; Ornn index), crypto (BTC, ETH, SOL, HYPE) | Site | ✓ |
| Number of underlyings | Home says 80, Markets page says 71 | [You] which one |
| One margin account; positions net against each other; USD collateral | Book, site | ✓ |
| "No key at Strike can move your money." Every new state needs a zero-knowledge proof and an attester quorum. | Site, docs | ✓, and it **always** comes with the still-trusted list below |
| Still trusted: the settlement print, prices on market orders, liquidation prices, and the attesters (all three run by Strike today) | Docs | ✓ |
| Fees: takers 40 bps of premium, makers 10 bps, winning side 50 bps of intrinsic at settlement; zero during closed beta | Site, docs | ✓ |
| Matches in under a microsecond; built for 2 million signed orders and 50 million quote updates a second | Site | ✓ |
| Closed beta, invite required | Site | ✓ |
| Settlement currency | "USD" in marketing, "USDC" in legal | [You] pick one wording |

**Rules [Draft]:**
- No promises of profit, no "guaranteed", "risk-free", "safe returns", "get rich".
- No price predictions.
- Never invent a number. Use one from this list, or write `[number]` and flag it.
- Say "about" when the book does (32.5, ~80).
- When something is still trusted or not yet live, say so (Candid Allies).

## 3. Voice

### The three rules [Book]
1. **We lead with the fact.** One number beats one adjective. We back every claim with something you can check.
2. **We keep it short and exact.** Plain words, short sentences, correct terms. We are clear, never cryptic.
3. **We say what's true.** We name the risks and the trusted parts before anyone asks. Calm, never hyped.

### What the skill enforces [D11, D12]
Verbal branding is still being written, so the skill keeps writing rules to a minimum:
- **Headings:**
  - Short. The main title is at most 2 lines at its set size; aim for 3–8 words.
  - Sentence case, with no full stop on a one-line title.
- **Claims:** facts only, from §2. Never invent a number.
- **Sentences:** short, plain words, no exclamation marks, no hype.
- **Money:** USDC by default; ask the user whenever USD or USDC is unclear (D7).
- **Name:** "Strike" in text; STRIKE in capitals is for the logo only.
- **Risk line:** placed per D10.

## 4. Humour

Out of scope for now (D11).

## 5. Writing formats [Later: verbal branding]

Kept for reference. The skill applies only the layout parts (card headline length, thread numbering, risk line); the copy guidance waits for the verbal branding work.

### X posts and threads
- **First post:** a fact or number in the first line, and a complete idea on its own (most people only read it).
- **Thread:** 3–7 posts, one idea each, numbered `1/5` at the end. The last post has one call to action and a link.
- **Cards:** every post in a thread gets a card from the Figures thread tool (illustration on one side, words on the other). The card headline is at most 8 words, with one phrase marked in Strike Green.
- **Length:** under 280 characters by X's count; aim for 200 or fewer.
- **Hashtags:** none, or at most one tag for an event.
- **Risk line:** for any post about trading features, the risk line from §19 goes in the last post or the reply.

### Replies
- Answer the question in the first sentence.
- When someone is angry, state the fact, what we're doing, and when.
- No humour in replies about money, outages or losses.

### Landing pages
- **Hero:** a fact-led headline (≤ 8 words), one line underneath, then one button.
- **Sections:** proof (numbers) → how it works → what's still trusted → risk.

### Emails and release notes
- **Email:** the subject is the fact. The body runs fact, what changed, what you do, and the link.
- **Release notes:** "What's new / What changed / What's still trusted", with the date and time zone.

### Docs
- Second person ("you"), present tense, steps numbered, one action per step.

## 6. Thinking the Strike way [Draft]

These are used for brainstorming, ideas for mockups, and business plans.
- **Start from the fact:** what is true and checkable? Then the problem it creates (for example, 32.5 hours open against 168 hours of news).
- **Options, not one answer:** give 3–5 options, each with its trade-off named first.
- **Rank them by four tests:**
  1. Is it true?
  2. Is it exact (a number we can show)?
  3. Does it work every hour?
  4. Is the risk stated?
- **Business plans:** Fact → Problem → What we build → How it works → What's still trusted → Risks → Numbers (market, cost, timeline) → Next step. No vanity metrics.
- **Mockup ideas:**
  - Describe each as screen, purpose, the number it shows, and the one action.
  - Use the brand's illustration library and the components in §11.
  - Always show a real state: an empty state, an error state, and the loss case.

## 7. Logo [Book + Draft]

- **Versions [Book]:**
  - 3D black (main, on light).
  - 3D coloured: a green gradient, for digital and hero use.
  - Flat: for print, small sizes and one colour.
  - Wordmark STRIKE: wide-tracked capitals in Ciburial.
  - Lock-ups: Markets, Terminal, Protocol, "Powered by".
- **Grounds [Book]:** light grey, black, mint green, and photos (logo in white).
- **Which version when [Draft]:**
  - Below 32 px, use the flat mark.
  - Below 16 px, use the flat mark without the wordmark.
  - Favicon: flat mark.
- **Clear space [Site]:** at least as tall as one layer of the mark.
- **Minimum size [Site]:** mark 16 px; lockup at least 20 px tall. [Draft] Print: 5 mm mark.
- **Name [Site]:** write "Strike" in text. "STRIKE" in capitals belongs to the logo only. The wordmark is tracked at 0.22 em.
- **Green grounds [D4]:** never in UI. On posters, the flat logo in black or white may sit on Mint #50EBA0 for variety.
- **Files:** `skill/assets/logo/`; see `skill/assets/README.md` for the full table (3D green, 3D black, 3D white, flat black and flat white, as marks and lockups, plus the wordmarks, the tile, the disc and the link preview).
- **Never [Draft]:**
  - recolour the mark outside the approved versions;
  - add effects (glow, shadow, outline);
  - separate its layers, or rotate, skew or stretch it;
  - change the order or spacing of the chevrons;
  - put it on a busy area of a photo without a scrim;
  - redraw the wordmark in another font;
  - use the 3D mark smaller than 32 px.
- **Files still needed [You]:** the 3D black and 3D green renders, and the sub-brand lock-ups (Markets, Terminal, Protocol, "Powered by"), if they're still in use.

## 8. Colour [Book + Draft]

**Palette [Site + D2]:** a near-black ground and one green. Red means a loss and nothing else.
| Token | Hex | Use |
|---|---|---|
| Ground | #0C0C0C | Backgrounds and the mark's tile |
| Ink | #F9F9F9 | Text on the ground |
| Ink, secondary | #B3B3B3 | Supporting text |
| Strike Green | #10B981 | The mark and the primary action |
| Mark, light | #6EE7B7 | Top of the mark's gradient |
| Mark, deep | #047857 | The mark's shaded faces; green text on light grounds |
| Profit | #3FD4AB | Gains, buys and bids |
| Loss | #EE5E74 | Losses, sells and asks only |
| Mint | #50EBA0 | Poster grounds only (D4) |
| Yellow / Sky / Purple | #FFEF3C / #0788F7 / #976FE6 | Only in infographics that need more series (D2) |

The table below is the brand book's secondary palette, kept for reference.

**Secondary [Book], each with one meaning:**
| Name | Hex | Use |
|---|---|---|
| Wild Watermelon | #EE5E74 | Loss only |
| Shamrock | #3FD4AB | Profit only |
| Tropical Rain Forest | #047857 | Deep mark, green text on light |
| Mountain Meadow | #10B981 | The mark's light green (same as Strike Green) |
| Yellow | #FFEF3C | Telling series apart in data |
| Sky | #0788F7 | Telling series apart in data |
| Purple | #976FE6 | Telling series apart in data |
| Mint | #50EBA0 | Grounds and gradients (posters, logo backgrounds) |

**Amounts [Draft]:**
- Per layout: about 70% ground or white, 25% greys, ≤ 5% green.
- Secondary colours appear only in data and infographics, using the fewest that work.

**Contrast, measured (WCAG) [Draft]:**
| Text on ground | Ratio | Rule |
|---|---|---|
| White on Ground | 18.6 | ✓ all text |
| Strike Green on Ground | 7.7 | ✓ all text |
| Ground on Strike Green | 7.7 | ✓ text on green buttons and green posters |
| **White on Strike Green** | **2.4** | ✗ fails, even for big text. On green surfaces, use Ground text, or put white text on Deep #047857 (5.2) |
| **Strike Green on White** | **2.4** | ✗ fails. Green text on light uses Deep #047857 (5.2) |
| Grey #8A8F98 on Ground | 6.0 | ✓ secondary text on dark |
| Grey #6B6F76 on White | 4.8 | ✓ secondary text on light |
| Watermelon on Ground | 6.0 | ✓; on White 3.1, so large text or icons only |

> Some brand-book posters set white words on Strike Green. They read on a big poster but fail accessibility on screens. Pick one: Ground text on green, or keep white text and darken that area of the gradient to Deep.

**Gradients [Draft]:**
- Allowed: Strike Green → Deep, and Mint → Strike Green (posters, logo, hero areas).
- Never on text, and never on UI controls.

## 9. Typography [Book + Draft]

**Families [Book + D1]:**
- Geist (Light, Regular, Medium, SemiBold) for headlines and body.
- Ciburial Regular for the wordmark and its lock-ups only.
- The live site and the /brand page currently use Ciburial for text, so they need updating to match.
- Geist Pixel Circle is for display only: big numbers and posters (the dot-matrix "24%").
- When web fonts are blocked: Arial Regular and Bold.
- Bullets are rounded (•).

**Headings [Book]:**
- Geist Medium, line height 90%, tracking −3%.
- The book's sizes (120 and the H2/H3 steps) are for posters and slides.

**Headings, every medium [D12]:**
- **Title length:** the main title never runs past 2 lines. If it would, shorten the words; never shrink below the scale.
- **Weight:** Geist Medium (SemiBold allowed for small headings).
- **Tracking:** −3% at 48 px and up, −2% at 32 px, −1.5% at 24 px; 0 for body text.
- **Line height:** 0.9–1.0 for display and H1; 1.1–1.2 for H2 and H3; 1.5 for body.
- **Contrast:** at least 7:1 for titles (Ink on Ground is 18.6:1); body text at least 4.5:1.
- **Line length:** body lines of 45–75 characters.

**Web and app scale [Draft]:**
| Style | Size / line height | Weight | Tracking |
|---|---|---|---|
| Display | 72 / 0.95 | Medium | −3% |
| H1 | 48 / 1.0 | Medium | −3% |
| H2 | 32 / 1.1 | Medium | −2% |
| H3 | 24 / 1.2 | Medium | −1.5% |
| Body L | 18 / 1.5 | Regular | 0 |
| Body | 16 / 1.5 | Regular | 0 |
| Small | 14 / 1.45 | Regular | 0 |
| Label | 12 / 1.4 | Medium | +2%, uppercase allowed |

**Numbers [Draft]:**
- Numbers in Geist with tabular figures (prices, tables, timers).
- [Draft] Geist Mono only for code, wallet addresses and order books.
- The site's /brand page says Geist Mono for every number, and the live site uses JetBrains Mono; both need updating to match D1.

**Fonts [You]:** Ciburial (licence?) and Geist Pixel Circle files.

## 10. Layout, grid and spacing [Book + Draft]

- **Grid [Book]:** illustrations and posters are built on a shared 50 px grid. Posters use the book's grids (thirds, diagonals) and may break them "provided the layout still holds together".
- **Spacing [Draft]:** a 4 px base, with the scale 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Radii [D3]:**
  - 6 px for small controls;
  - 8 px for buttons and inputs;
  - 12 px for cards;
  - full for pills and tags.
- **Margins [Draft]:** 50 px on social cards and posters; 24 px mobile and 64 px desktop on the web.
- **Logo placement [Book]:** a corner of the poster grid, never centred over content.

## 11. UI components [Draft]

- **Buttons:**
  - Primary: Strike Green fill with Ground text; one per view.
  - Secondary: a raised dark fill (#1B1C1F) with White text.
  - Ghost: text only.
  - All 40 px tall (32 small), 8 px radius.
- **Inputs:** #151618 field with a 1 px line at rgba(255, 255, 255, 0.06); focus ring is Strike Green.
- **Cards:** #0F1011 panel, 12 px radius, 1 px line. No shadows on dark; a soft shadow on light.
- **Data:** profit is Shamrock, loss is Watermelon. Always pair the colour with a sign (+/−) or an arrow, never colour alone.
- **States:** every component has default, hover, active, disabled, loading and error states. Error text says what happened and what to do.
- **Modes [D5]:** web apps and tools are always dark unless the user asks for light. Light mode swaps tier for tier (Ground ↔ Ink).
- **Green [D4]:** the logo never sits on green in UI; green is for the primary action and focus.
- [You] the product's live UI (strikelabs.app) is the reference. I'll take the exact values from it if you approve.

## 12. Icons [Book]

- 24 px grid, 2 px stroke, round ends and rounded corners, outline style.
- Heavier than the illustrations, so they read at small sizes.
- [You] send the icon set.

## 13. Illustration [Book + Agreed]

**From the book:**
- Two formats: flat diagrams and isometric 3D. The simplest expression first.
- 50 px grid.
- Large illustrations: 1 px lines, 10 px nodes. Small: 2 px lines, 20 px nodes.
- Light and dark versions.

**Agreed (the Figures tool's house rules):**
- The 2:1 angle, with flat views built as thin 3D plates so they keep their look when turned.
- Lines first: shapes hide what's behind them, and every other outline shows.
- Three line strengths.
- Dashed means not real yet. Dots carry tone. Nodes mark exact points.
- Greys and Strike Green, with one green focus per figure. Data colours in infographics only.
- Labels in Geist: the ticker in Medium over its value in Regular.
- Make illustrations with the Figures tool, from its 65-piece library or new pieces built with its kit.

## 14. Motion [Agreed + Draft]

- **Illustration loops [Agreed]:** calm and exact. One idea moves at a time, eased, and comes back to rest. The first frame is the still.
- **UI [Draft]:**
  - Durations of 120 ms (small), 200 ms (panels) and 320 ms (pages).
  - The ease is cubic-bezier(0.2, 0, 0, 1).
  - No bounce and no flashing.
  - Honour reduced motion.
- **Video [Draft]:** loops of 3–6 s; type fades in, never flies in.

## 15. Data and infographics [Book + Agreed]

- **Number first:** the headline number is big and on its own (Geist Medium or Geist Pixel Circle).
- **Labels:** "AMD" over "IV 106.2%".
- **Charts:** only the brand's chart types (the illustration library: radar, segments, bubbles, circles, bars, lines).
- **Source and date:** every chart has a source line and a date [Draft].

## 16. Photography [Book + Draft]

- **[Book]:** real people trading in everyday places, with green accents; blurred green nature as a backdrop for the logo.
- **[Draft]:**
  - Natural light and real screens showing the Strike UI.
  - No stock-photo handshakes, no bull or bear clichés, no piles of money.

## 17. Decks, docs and posters [Book + Draft]

- **Posters [Book]:** headline in Geist, the lock-up in a corner, and an illustration or a dot-matrix number. Grounds are Black, light grey or the green gradient.
- **Decks [Draft]:**
  - 16:9 on the 50 px grid.
  - One idea per slide, headline as a full sentence (the claim), and the evidence under it.
  - Section dividers in Ground with a big grey number (as in the book).
- **Docs [Draft]:** white ground, Geist, H1/H2/Body from §9, and the lock-up in the header.

## 18. Merch [Book]

The book's mockups (hoodie, matchbox) use a blackletter "24/7 Options Trading". [You]: is blackletter allowed outside merch? I'd allow it on merch only.

## 19. Legal and risk [You]

- **Short risk line [Site]:** "Options involve risk. Closed beta, invite required."
- **Waitlist line [Site]:** "24/7 markets · Self-custodied · Options involve risk."
- **Full disclosure [Site]:** strikelabs.app/risk. Key lines:
  - "You can lose money."
  - "Strike is not registered as an exchange, broker or investment adviser in any jurisdiction."
  - "Nothing on Strike is investment, legal or tax advice."
- **Who can use it [Site]:**
  - 18 or older;
  - not US persons;
  - not in sanctioned regions (Cuba, Iran, North Korea, Syria, Crimea, Donetsk, Luhansk);
  - no VPNs to hide location;
  - closed beta by invite.
- **Never target [Draft]:** no copy or ads aimed at US audiences or the restricted regions.
- **Where it goes [Draft]:**
  - the short risk line on every page and email footer;
  - the last post of a thread about trading;
  - every ad;
  - the link to /risk wherever the space allows.
  - [You] confirm.

## 20. Fixes to the brand book

- "OneTrust", brand@onetrust.com and "Antique Legacy" are template leftovers.
- Sky's hex is printed as #EE5E74 (Watermelon's); its RGB (7, 136, 247) gives #0788F7.
- "RGB Percent" columns mix percentages with 0–255 values.
- Page 31 is titled "Typography / Usage" but shows colour.
- Typos: "Guidlines", "identiy", "Line-Hight", "Pallete", "accross", "recorgnition".
- White on Strike Green fails contrast (§8).

## 21. What I need from you

1. Approve, change or strike every [Draft].
2. Confirm the facts in §2.
3. Send the risk wording and regions (§19).
4. Send the assets: logo files (all versions and lock-ups), Ciburial, Geist Pixel Circle, and the icon set.
5. Send 3–5 posts that are on-brand funny, and any you'd never post.
