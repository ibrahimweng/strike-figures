# Colour

A near-black ground and one green. Black and white carry the system; green signals the one thing that matters. Values: strike-design/tokens/tokens.json.

## Palette
| Token | Hex | Use |
|---|---|---|
| ground | #0C0C0C | Backgrounds (dark is the default) |
| surface-1 / 2 / 3 | #121214 / #18181B / #202024 | Cards / inputs and raised controls / hover |
| line / line-strong | ink at 8% / 14% | Hairlines / input borders |
| ink | #F9F9F9 | Text on dark; light ground |
| ink-2 | #B3B3B3 | Secondary text on dark |
| ink-3 | #8A8F98 | Muted text, icons |
| green | #10B981 | Primary action, focus ring, one highlight |
| deep | #047857 | Green on light grounds |
| profit / loss | #3FD4AB / #EE5E74 | Gains, buys, bids / losses, sells, asks |
| mint | #50EBA0 | Poster grounds |
| yellow / sky / purple | #FFEF3C / #0788F7 / #976FE6 | Extra chart series only |

Light mode swaps tier for tier: ground #F9F9F9, surfaces #FFFFFF / #F1F1F1 / #E8E8E9, ink #0C0C0C, ink-2 #4A4D52, ink-3 #6B6F76, lines in ground at 8% / 14%.

## Rules
- Dark by default for apps, tools and the web. Light only when asked, or for print and documents that will be printed.
- About 70% ground or ink, 25% greys, ≤ 5% green per layout.
- Green is never a large area in UI. Green grounds belong to posters and campaign art.
- Gradients: green → deep, or mint → green, on posters and hero art only; never on text or controls.
- Red means loss and nothing else. Never use loss for errors in marketing, or for decoration. (In product UI, destructive actions and errors may use loss.)
- Extra series colours appear only when a chart can't be read with greys and green, and as few as work.
- Profit and loss always carry a sign (+/−) or an arrow.

## Contrast (WCAG, measured)
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
