# What strikelabs.app answers (read 20 Nov 2026)

**Pages read:**
- the 7 main pages: home, brand, options, waitlist, terms, privacy and risk;
- all 71 market pages that load;
- the docs: overview, market structure, custody and fees.

Each finding says where it comes from.

## Facts (confirmed)

| Fact | Site wording | Source |
|---|---|---|
| Open 168 h/week | "Strike 168 h / week", "Always open 24/7", "The book never closes." | home |
| Listed options hours | "US listed options 32.5 h / week", "Listed options are closed 81% of the week." No source is cited. | home |
| Expiries | Every underlying lists a daily 20:00 ET expiry (America/New_York, adjusted for daylight saving), plus 8 weeklies (the next 8 Fridays) and monthlies (third Fridays, 3 months out). 16 expiries are listed. | home, market pages, docs |
| Contract style | European, cash-settled, multiplier 1.0 (one contract is one underlying unit), fractional contracts | home, docs |
| Asset types | US and Asian stocks, indices and ETFs, pre-IPO (OpenAI, Anthropic), GPU compute (H100, H200, B200, A100, RTX 5090, settled to the Ornn index), crypto (BTC, ETH, SOL, HYPE) | options, market pages |
| One margin account | "A put on NVDA, a call on BTC and a spread on H100 sit in the same account and net against each other." USD collateral. | home |
| Custody (public) | "No key at Strike can move your money." The vault has no operator role, and new state needs a zero-knowledge proof plus an attester quorum. Claiming a proven withdrawal needs nobody's permission. | home, docs/custody |
| Still trusted (must accompany custody claims) | The settlement print; execution prices you did not bound (market orders); liquidation prices; trade authorisation rests on the attester quorum, which is 2 of 3 and **all three are run by Strike today**. | docs/custody |
| Fees | Takers 40 bps of premium, makers 10 bps; only the winning side pays 50 bps of intrinsic at settlement. The rates can change; the ones in force are published in the API. **Zero during closed beta.** | home, docs/fees |
| Engine | Matches in under a microsecond; built for 2 million signed orders and 50 million quote updates a second | home |
| Money | Deposits in USDC to the vault on Arbitrum, or through Hyperliquid. Price references are Hyperliquid perpetuals. | terms, risk, market pages |
| Products | Options, strategies (spreads, straddles, condors), parlays, vaults, RFQ, API and builder codes | home, risk, docs |
| Status | Closed beta, invite required; waitlist needs only an email | everywhere |
| Company | Strike Labs Ltd., support@strikelabs.app | terms |

## Legal (confirmed)

- **Short risk line:** "Options involve risk. Closed beta, invite required." It's in the footer of every page.
- **Waitlist line:** "24/7 markets · Self-custodied · Options involve risk."
- **Full disclosure:** /risk (11 sections, last updated 4 Nov 2026). Key lines:
  - "You can lose money".
  - "Past prices… say nothing about future results".
  - "Strike is not registered as an exchange, broker or investment adviser in any jurisdiction".
  - "Nothing on Strike is investment, legal or tax advice".
- **Who can use it (terms):**
  - 18 or older;
  - **not a US person**, and not in the US;
  - not in sanctioned places (Cuba, Iran, North Korea, Syria, Crimea, Donetsk, Luhansk);
  - no VPN to hide your location;
  - admitted to the closed beta.

## Logo (confirmed, /brand)

**Files** (downloaded to `assets/logo/`):
- lockup (for dark grounds) and lockup on light;
- mark;
- mark on a tile and mark on a disc;
- mark in white and mark in black;
- link preview image, 1200×630.

**Rules:**
- Clear space at least as tall as one layer of the mark.
- The mark no smaller than 16 px; the lockup no shorter than 20 px.
- No recolouring, outlines, stretching or effects. Don't separate the layers, rotate the mark, or **set it on a green background**.
- Write "Strike" in text; "STRIKE" in capitals belongs to the logo only. The wordmark is tracked at 0.22 em.

## Colour and type: three sources disagree

| | Brand book (PDF) | Site /brand page | Live site CSS |
|---|---|---|---|
| Ground | #0C0C0C | #0C0C0C | #090B0A |
| Text | #F9F9F9 | Ink #F9F9F9 | #EEF1EF |
| Secondary text | (none given) | #B3B3B3 | #888E8B |
| Green | #10B981 | #10B981 (the mark and the primary action) | #10B981 on the page; #3AD198 for focus rings |
| Loss | #EE5E74 | #EE5E74 "Losses, sells and asks only" | #E47D70 |
| Profit | #3FD4AB | #3FD4AB "Gains, buys and bids" | |
| Extra colours | Yellow, Sky, Purple | **none**: "A near-black ground and one green. Red means a loss and nothing else." | |
| Headline and body font | **Geist** | **Ciburial** | Ciburial |
| Number font | | **Geist Mono** (tabular) | **JetBrains Mono** |
| Corners | | | **square (radius 0)** |
| Logo on green | shown (mint ground, green posters) | **not allowed** | |

## Problems on the site

1. **Underlying count:** the home page says 80 underlyings (60 stocks), but the Markets page says 71.
   - Nine markets on the home page lead to missing pages (404): ANT, GOLD, MINIMAX, SHEIN, SILVER, TCNT, WTIOIL, XIAOMI, ZHIPU.
   - GOLD, SILVER and WTIOIL (commodities) are listed under "Stocks".
2. **Settlement currency:** "cash-settled in USD" on the home and market pages, but "in USDC" in the risk and terms pages.
3. **Compute:** the home page names H100, H200 and B200; five compute markets are live (A100 and RTX 5090 as well).
4. **Logo rule:** the home page title is "STRIKE: 24/7 options…", which breaks the site's own "Strike in text" rule.
5. **Typo:** "Strike Labs Ltd.." (double full stop) in the risk and terms pages.
6. **Volatility figure:** SNDK shows IV 1507.2% on the home page, probably a bad data point.

## Still not on the site

- the source for 32.5 h;
- where the risk line is required in marketing;
- target regions for campaigns;
- Ciburial licence scope (it's used on the web);
- Geist Pixel Circle;
- the icon set;
- poster source files;
- 3D logo renders and sub-brand lock-ups (Markets, Terminal, Protocol, "Powered by");
- humour samples;
- AI tools used;
- the repository.
