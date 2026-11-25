# Type

Geist for words. Use as few styles as possible: two weights per layout is usually enough (Regular and Medium).

| Family | Use |
|---|---|
| Geist (Light, Regular, Medium, SemiBold) | All headlines and text |
| Geist Mono | Code, wallet addresses, order books |
| Geist Pixel Circle | Large display type and big numbers on posters ("24%"), where contrast is high. Never body text or company documents |
| Ciburial | The STRIKE wordmark's typeface. Never set text in it; use the logo files |
| Arial (Regular, Bold) | The system fallback when web fonts are unavailable (blocked, email newsletters) |

Fonts: strike-design/assets/fonts/ (fonts.css has the @font-face rules). All are under the SIL Open Font License.

## Setting type
- Set most type flush left. Never justify body text.
- Watch the rag; never leave an orphan or a widow. Balance heading lines so the second isn't a single word (`text-wrap: balance`).
- Four settings decide how easily type reads: kerning (the space between a pair of letters), tracking (the space across a run of letters), word spacing and line height. Take them from the chart below. A person checks them in anything meant to be read.
- Kerning: the font's metrics (`font-kerning: normal`). No fake bold or italics.

## Line height and tracking by size
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

## Headings
- **The main title is at most 2 lines** at its set size, 3–8 words. If it runs longer, cut words; don't shrink below the scale.
- Geist Medium (SemiBold allowed for small headings in dense UI).
- Sentence case. No full stop on a one-line title.
- Hierarchy: one title per view. A subtitle sits in ink-2 at about half the title size.

## Scale: slides and posters (1920 × 1080)
| Style | Size / line height | Weight | Tracking |
|---|---|---|---|
| H1 | 120 / 90% | Medium | −3% |
| H2 | 72 / 100% | Medium | −2% |
| H3 | 42 / 120% | Medium | −1% |
| Body | 18 / 130% | Regular | 0% |

Scale it with the format; posters start the headline at 120 px.

## Scale: web and app
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
