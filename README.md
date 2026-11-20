# Strike Figures

Figures is a small tool for making 3D line-art illustrations in the isometric style of Linear's homepage figures, dressed for [Strike](https://strikelabs.app).

Every figure is a real 3D scene. You can turn it to any angle, paint dotted fills and halftones on its faces, and export it as a clean SVG or a PNG.

It comes with a library of 50 illustrations: 17 data visualisations, 17 options-trading scenes and 16 tech scenes, all drawn by the same house rules.

## Using it (no setup knowledge needed)

1. **Pick** an illustration from the Library on the left. You can filter by Data, Options or Tech, or search.
2. **Turn it**: drag the ball under "Turn the view", or drag the picture itself. "Standard" brings back the usual angle.
3. **Change it**: click a shape to set how bright its lines are, and its dots (Off, Even, Fade, Wave or Glow; Emerald, Mint or Grey; spacing, size and strength). Click empty space to choose the colours, or to edit the labels.
4. **Export**: SVG (sharp at any size, opens in Figma) or PNG.

Looking at a library illustration doesn't save anything. The first change you make saves a copy under **My figures**, and your changes keep saving as you go.

The **Advanced** switch in the top bar shows every setting:
- adding shapes;
- dragging shapes to move them;
- exact positions and rotations;
- per-face fills, decals and label placement.

## Run it

```sh
npm install
npm run dev        # http://localhost:5173
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm run build` | Typecheck, then build a static site into `dist/` that you can host anywhere |
| `npm test` | Run the engine and editor tests |
| `npm run typecheck` | Typecheck only |
| `npm run render -- out` | Write every built-in figure to `out/*.svg` (add `--clip` to cut hidden lines) |
| `npm run glyphs` | Rebuild the Geist Mono outlines used by labels |

## The house rules

Every library illustration follows these rules. They are written down in `src/library/kit.ts`, and the tests check them:

1. **Camera:** Linear's 2:1 view (yaw 45°, pitch 30°), on a 320 × 320 frame, fitted with a 14% margin.
2. **Drawing:** faces are the background colour, so the illustration is made of lines and dots.
3. **Lines:** 0.5 wide.
   - The subject is drawn in #D0D6E0, supporting shapes in #62666D, and background shapes in #3E3E44.
   - Creases are #3E3E44 (#2E2E32 on background shapes), stopping just short of the outline.
4. **Corners:** the side corners are nearly sharp, and the front and back corners softly rounded.
5. **Dots:**
   - Emerald for the one thing that matters, and grey for the rest.
   - Halftones show amount; dots that follow a curve show data.
   - One emerald focus per illustration.
6. **Labels:** Geist Mono, small and grey, three at most, never on the focus.
7. **Floating shapes:** a soft shadow, and dotted guides down to what's below.
8. **Colours:** greys and Strike's emeralds only, with no red.

## What's in it

### The library

| Group | Illustrations |
| --- | --- |
| Data (D·01–17) | bar chart, stacked bars, candlesticks, heat grid, volatility surface, order book depth, area chart, line chart, pie chart, distribution, scatter, waterfall, dot-matrix chart, gauge, dashboard tiles, A versus B, treemap |
| Options (O·01–17) | long call, long put, straddle, iron condor, butterfly, strike ladder, option chain, expiry calendar, always open (24/7), time decay, the greeks, vertical spread, volatility smile, premium, every market, cash settlement, leverage |
| Tech (T·01–16) | server rack, GPU compute, network, database, the stack, self-custody vault, blocks, wallet, terminal, phone, matching engine, low latency, pipeline, modules, time zones, distributed |

To add an illustration, write a `make()` with the kit's helpers (`box`, `cyl`, `sector`, `shape`, `wall`, `dots`, `label`, `figure`), add it to one of the lists in `src/library`, and run `npm test`.

### Built-in figures

FIG 0.1 "Purpose-built", FIG 0.2 "Agents" and FIG 0.3 "Momentum" rebuild the three figures on Linear's homepage as 3D scenes:
- Each size and position was measured off Linear's own SVGs.
- Each artboard is the same size as Linear's.

So at the default camera (yaw 45°, pitch 30°, the "2:1" view) the two line up point for point. Turn the camera and they stay solid.

A fourth figure, "Strike mark", stacks the chevron from Strike's logo in the same style.

> The three Linear figures are Linear's artwork. They're here as a reference and a starting point. For Strike's own pages, build your own compositions in the same style.

### Shapes

You can add these from the top bar (in Advanced):
- box
- slab
- fin
- cylinder
- hexagon (any polygon)
- chevron

The library also uses:
- free-form outlines: gears, arrows, payoff curves, depth steps. A concave outline is cut into convex pieces automatically.
- pie slices.

Every shape is a plan outline pushed straight up by its height. Corners are rounded as true circles in 3D, either all at once or each corner on its own, as Linear's are. Objects can be moved, lifted, turned and tilted, and copied in a row with Repeat (fins, stacks, stairs).

### Lines

Lines are drawn the way Linear draws them:
- **Outline:** the silhouette.
- **Crease:** where two faces you can see meet. Creases are dim, stop a few units short of the outline (crease trim), and on curved sides fade out where the side turns away from you (crease taper).
- **Contact:** an edge resting on, or sinking into, another object. It's dimmed like a crease, as on FIG 0.1's stack.
- **Guide:** dotted uprights from a floating object down to whatever is under it.

### Faces

Any face can take a solid colour and a dotted fill:
- An even grid, or staggered dots.
- Round or square dots.
- A halftone, whose dots grow, shrink or fade with a linear, radial, wave or noise gradient.
- A fill on just part of a face.

"All sides" wraps one fill round every side, so the pattern flows round the corners. Alt-click a face on the canvas to open it in the inspector.

### Decals and labels

A mark can be laid flat on a top face: the Strike logo (the flat version, as on FIG 0.1), any SVG, or a few words.

Labels can float upright or lie on the floor or a wall. Both are set in Geist Mono and drawn as outlines, so they look the same in every viewer, whether or not the font is installed. To rebuild the outlines, run `npm run glyphs`.

### Dots that follow a curve

A dotted fill can keep to one side of a curve, with the dots on the other side shown in a dim grey. This is how the payoff, area and terminal charts are drawn, like the dot-matrix payoff chart in Strike's app.

### Export

- **SVG:** hidden lines are cut away and arcs stay as arcs, so the file is small and edits cleanly in Figma.
- **PNG:** at 1×, 2× or 4×.

Each export can be with or without the background and shadows.

### Files and history

- **Save figure** writes a `.figure.json` file, and the upload button in Figures opens one.
- Figures also save as you go in your browser.
- Undo and redo work per figure.

## Using it

| Do this | To |
| --- | --- |
| Drag empty space | Turn the camera (hold Shift to snap to 15°) |
| Drag an object | Slide it along the ground (Alt moves it freely; Shift lifts it) |
| Alt-click a face | Paint that face |
| Right-drag, or Space + drag | Pan |
| Scroll | Zoom |
| `1`–`5` | 2:1, isometric, front, side and top views |
| `[` / `]` | Turn by 15° |
| `F` | Fit the figure to the artboard |
| Arrow keys / PageUp, PageDown | Nudge the selected object (Shift ×10) |
| ⌘D / ⌫ | Duplicate / delete |
| ⌘Z / ⇧⌘Z | Undo / redo |
| ⌘S / ⌘E | Save the figure / export |

## How it works

The engine is in `src/engine`. It turns a scene into an SVG in four steps:

1. **Camera** (`math.ts`). The camera is orthographic and set by yaw and pitch. At yaw 45° and pitch 30°, both ground axes leave at Linear's 2:1 slope.
2. **Shapes** (`shapes.ts`). Each outline is made of lines and circular arcs. Concave outlines (the chevron) are cut into convex pieces along seams that are never drawn.
3. **Drawing** (`render.ts`, `curves.ts`). For each piece, the engine works out:
   - which faces turn towards you;
   - which edges are outlines, creases or contacts;
   - the visible stretch of each curved side, where a projected circle becomes an exact elliptical arc;
   - the fills, the dots (`dots.ts`) and any decal (`decal.ts`).
4. **Order and output** (`order.ts`, `svg.ts`). Pieces are convex, so one ray through the overlap of any two tells which is in front. The pieces are painted back to front, and the SVG can cut away the lines hidden behind nearer pieces.

The editor (`src/ui`, `src/model`) is React with a small zustand store. The canvas draws the same SVG that the export writes. The library is in `src/library`.

Fonts are Geist and Geist Mono (SIL Open Font License), from Fontsource.
