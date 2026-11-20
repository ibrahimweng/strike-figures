# Strike Figures

Figures is a small tool for making 3D line-art illustrations in the isometric style of Linear's homepage figures, dressed for [Strike](https://strikelabs.app).

Every figure is a real 3D scene. You can turn it to any angle, paint dotted fills and halftones on its faces, and export it as a clean SVG or a PNG.

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

## What's in it

### Built-in figures

FIG 0.1 "Purpose-built", FIG 0.2 "Agents" and FIG 0.3 "Momentum" rebuild the three figures on Linear's homepage as 3D scenes:
- Each size and position was measured off Linear's own SVGs.
- Each artboard is the same size as Linear's.

So at the default camera (yaw 45°, pitch 30°, the "2:1" view) the two line up point for point. Turn the camera and they stay solid.

A fourth figure, "Strike mark", stacks the chevron from Strike's logo in the same style.

> The three Linear figures are Linear's artwork. They're here as a reference and a starting point. For Strike's own pages, build your own compositions in the same style.

### Shapes

You can add these from the top bar:
- box
- slab
- fin
- cylinder
- hexagon (any polygon)
- chevron

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

### Decals

A mark can be laid flat on a top face: the sun from FIG 0.1, or any SVG, such as the Strike logo.

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

The editor (`src/ui`, `src/model`) is React with a small zustand store. The canvas draws the same SVG that the export writes.

Fonts are Geist and Geist Mono (SIL Open Font License), from Fontsource.
