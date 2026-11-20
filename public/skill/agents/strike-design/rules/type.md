# Type

Geist for words. Restraint: two weights per layout is usually enough (Regular and Medium).

| Family | Use |
|---|---|
| Geist (Light, Regular, Medium, SemiBold) | All headlines and text |
| Geist Mono | Code, wallet addresses, order books |
| Geist Pixel Circle | Big display numbers on posters ("24%"), nothing else |
| Ciburial | The STRIKE wordmark, inside the logo files only |
| Arial | Fallback where web fonts are blocked (emails) |

Fonts: strike-design/assets/fonts/ (fonts.css has the @font-face rules). All are under the SIL Open Font License.

## Headings
- **The main title is at most 2 lines** at its set size, 3–8 words. If it runs longer, cut words; don't shrink below the scale.
- Geist Medium (SemiBold allowed for small headings in dense UI).
- Tracking: −3% at 48 px and up, −2% at 32 px, −1.5% at 24 px, 0 below.
- Line height: 0.9–1.0 for display and H1, 1.1–1.2 for H2 and H3.
- Sentence case. No full stop on a one-line title. Balance the lines so the second isn't a single word (`text-wrap: balance`).
- Hierarchy: one title per view. A subtitle sits in ink-2 at about half the title size.

## Scale (web and app)
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
