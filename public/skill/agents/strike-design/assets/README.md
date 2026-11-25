# Assets

Brand files for Strike. Every SVG is self-contained, with a tight viewBox and ids prefixed per file, so several logos can sit inline on one page.

## Logo rules

- One mark, built two ways: **3D for screens** (app, website, social posts, slides) and **flat for anything printed or made** (merch, stickers, embroidery, packaging).
- Dark grounds: 3D green mark with white STRIKE. Light grounds and mint: 3D black on screen, flat black in print.
- On photos the logo is always white: flat white on busy or noisy images, 3D white on soft images.
- Never put the logo on a flat green ground in UI.
- Minimum size: 3D 32 px wide on screen (smaller: use flat); flat 16 px on screen, 8 mm in print, 12 mm screen print, 35 mm embroidery; lockup 20 px tall.
- Maximum size: never wider than one third of the layout.
- Clear space: the width of the S in the STRIKE wordmark on every side.
- Don't recolor, redraw, stretch, rotate or add effects. One logo per layout.
- Write "Strike" in text. STRIKE in capitals belongs to the logo only.

## logo/

| File | What it is | Use it for |
|---|---|---|
| `strike-lockup-3d-green.svg` | Green 3D mark, white STRIKE | Dark grounds |
| `strike-lockup-3d-black.svg` | Black 3D mark (gray side faces) and STRIKE | Light grounds and mint, on screen |
| `strike-lockup-3d-white.svg` | White 3D mark and STRIKE | Soft photos |
| `strike-lockup-flat-black.svg` | Flat black mark and STRIKE | Mint and bright grounds in print; merch on light |
| `strike-lockup-flat-white.svg` | Flat white mark and STRIKE | Busy photos, green posters, print and merch on dark |
| `strike-mark-3d-green.svg` | Green 3D mark | Dark grounds |
| `strike-mark-3d-black.svg` | Black 3D mark (gray side faces) | Light grounds and mint, on screen |
| `strike-mark-3d-white.svg` | White 3D mark | Soft photos |
| `strike-mark-flat-black.svg` | Flat black mark | Mint and bright grounds in print; merch on light; under 32 px on screen |
| `strike-mark-flat-white.svg` | Flat white mark | Busy photos, print and merch on dark; under 32 px on screen |
| `strike-wordmark-black.svg` | The STRIKE wordmark alone, black | Building lockups; layouts that place the mark separately |
| `strike-wordmark-white.svg` | The STRIKE wordmark alone, white | The same, on dark grounds and photos |
| `strike-mark-tile.svg` | Green mark on a dark rounded tile | Avatars, app icons |
| `strike-mark-disc.svg` | Green mark on a dark disc | Round avatars, favicons |
| `strike-og.png` | Link preview, 1200 × 630 | Social cards and link previews |

Sub-brand lockups ("STRIKE Markets", "Powered by STRIKE") are not official. Build one only when asked:

```
node scripts/lockup.mjs --name "Markets" --layout horizontal|stacked|powered-by --version 3d-green|3d-black|3d-white|flat-black|flat-white --out file.svg
```

## fonts/

Link `fonts/fonts.css`, then use the family names below. All four are under the SIL Open Font License (OFL.txt in each folder).

| Family | Files | Use it for |
|---|---|---|
| Geist | `geist/` Light, Regular, Medium, SemiBold, Bold (woff2 and ttf); `Geist-Variable.woff2` | Headlines (Medium) and body (Regular). Fallback: Arial. |
| Geist Mono | `geist-mono/` Regular, Medium (woff2 and ttf) | Code, wallet addresses, order books |
| Geist Pixel Circle | `geist-pixel/` (woff2 and ttf) | Big display numbers on posters only |
| Ciburial | `ciburial/` (woff2, otf, ttf) | The wordmark's typeface. Not for text. |

`fonts.css` also declares "Geist Variable" (weights 100–900 from one file) for apps that need in-between weights.

## posters/

A4 posters (595.28 × 841.89 pt). Text is outlined, so they print without the fonts. PNG previews, 1240 px tall, are in `posters/previews/`.

| File | What it shows |
|---|---|
| `poster-81-percent.svg` | "Listed options are closed 81% of the week", green gradient, bar chart |
| `poster-every-hour-24-percent.svg` | "Options on every market, every hour.", dot-matrix "24%" on green |
| `poster-terminal.svg` | "The terminal, rebuilt for options.", terminal screenshot and a photo |
| `poster-lockup-blocks.svg` | The lockup above black and white isometric towers, dark ground |
| `poster-every-market-rays.svg` | "Options on every market, every hour.", lines from the mark to tickers with their IV, on green |
