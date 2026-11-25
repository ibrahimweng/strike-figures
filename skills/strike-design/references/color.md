# Color

The palette is black, white and Strike Green. Black and white carry the layout; Strike Green marks the primary action and one highlight. The palette has two groups, primary and secondary. Use color with restraint. Values: references/tokens.json.

## Primary palette
| Name | Token | Hex | RGB % | CMYK | Use |
|---|---|---|---|---|---|
| Ground | ground | #0C0C0C | 5, 5, 5 | 0, 0, 0, 95 | Posters, social cards, illustrations, app modules |
| Strike Green | green | #10B981 | 6, 73, 51 | 91, 0, 30, 27 | The primary action, focus, one highlight. Never fills a layout |
| White | ink | #F9F9F9 | 98, 98, 98 | 0, 0, 0, 2 | Text on ground; ground of light layouts |

For print, match Strike Green to the closest Pantone.

## Secondary palette
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

## Interface and poster tones
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

## Backgrounds
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

## Rules
- Dark by default for apps, tools and the web. Light only when asked, or for print and documents that will be printed.
- Black and white carry most of every layout: about 70% ground or ink, 25% grays, 5% or less green.
- Green is never a large area in UI. Posters may use more green: green grounds belong to posters and campaign art.
- Gradients: mint → green → deep, on posters and hero art only; never on UI text or controls.
- Red means loss and nothing else. Never use loss for errors in marketing, or for decoration. (In product UI, destructive actions and errors may use loss.)
- Data colors appear only when a chart can't be read with grays and green, and as few as work.
- Profit and loss always carry a sign (+/−) or an arrow.

## Text on green
- **UI (buttons, controls, badges on flat Strike Green):** ground #0C0C0C text, never white (white is 2.4:1).
- **Posters and campaign art on the mint → green gradient:** large display type and big numbers are white, as in the brand book's posters. Keep that type large (H3 size and up); small text on green is ground.
- **Swatches and other fills:** choose ground or white text by contrast, at least 4.5:1 (3:1 for large text). Ground reads on profit, mint, Mark Light and yellow; white reads on Mark Deep.

## Contrast (WCAG, measured)
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
