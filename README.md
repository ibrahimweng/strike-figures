# Strike Figures

Figures is Strike's design tool. It has four parts: the Strike design skill for AI tools, an illustration maker, a post and thread maker, and a dot pattern maker.

The illustration maker makes Strike's illustrations: line-art figures, flat or in 3D, that move. The post maker lays out posts for X and Instagram from the brand book's rules and posters. The pattern maker makes halftone dot patterns for posts and posters that look empty.

Every figure is a real 3D scene. You can:
- turn it to any angle, or look straight down for the flat version;
- paint dotted fills and halftones on its faces;
- play its animation;
- export it as SVG, PNG, MP4, GIF, animated SVG or Lottie.

It comes with a library of 66 illustrations, all drawn by the same house rules:
- 17 data visualisations;
- 17 options-trading scenes;
- 16 tech scenes;
- 16 brand: 15 from Strike's brand book and the motion system's circles.

## Skill: the Strike design skill

The tool opens on **Skill**. It's the Strike brand packaged for AI tools: give any AI the link on that page and everything it makes follows the brand.
- **Copy link:** a file any AI that can read a web page can follow.
- **Install it:** steps and files for Claude, ChatGPT, Cursor, Codex and other AGENTS.md tools, Copilot, Gemini, Perplexity and Figma.
- **Downloads:** CSS variables, the Tailwind presets and the design tokens.
- **Logo, color and type:** at a glance, with each logo file ready to download.

The skill's source lives in `skill/` (see `skill/README.md`):
- the rules: `skill/source/`;
- the logos, fonts and posters: `skill/assets/`;
- the build: `skill/scripts/build.mjs`;
- a brand checker: `skill/scripts/check.mjs`;
- a sub-brand lockup generator: `skill/scripts/lockup.mjs`.

`npm run skill:build` writes the files the page serves into `public/skill/`. Commit them, and Vercel serves them at `/skill/` on your domain.

| Command | What it does |
| --- | --- |
| `npm run skill:build` | Rebuild the skill's files into `public/skill/` after changing anything in `skill/source` or `skill/assets` |
| `npm run skill:check -- <files>` | Check pages, CSS or SVGs against the brand |
| `npm run skill:lockup -- --name "Markets" --layout horizontal --version 3d-green` | Build a sub-brand lockup (only when one is asked for) |
| `npm run skill:test` | Run the skill's tests |

Links: `#figures`, `#thread` and `#patterns` open those parts directly.

## Using it (no setup knowledge needed)

1. **Pick** an illustration from the Library on the left. You can filter by Data, Options, Tech or Brand, or search.
2. **Turn it**: drag the ball under "Turn the view", or drag the picture itself. "Standard" brings back the usual angle.
3. **Change it**: click a shape to set how bright its lines are, and its dots (Off, Even, Fade, Wave or Glow; Emerald, Mint or Gray; spacing, size and strength). Click empty space to choose the colors, or to edit the labels.
4. **Animate**: under Animate, press Play.
   - Loop is the illustration's own motion.
   - Turn, Build and Drift work on any figure.
   - Length sets how many seconds one loop takes.
5. **Ground**: Black, White or Green. The figure is redrawn for the ground you choose.
6. **Export**:
   - pictures: SVG (sharp at any size, opens in Figma) or PNG;
   - animations: MP4, GIF, animated SVG or Lottie.

Looking at a library illustration doesn't save anything. The first change you make saves a copy under **My figures**, and your changes keep saving as you go.

The **Advanced** switch in the top bar shows every setting:
- adding shapes;
- dragging shapes to move them;
- exact positions and rotations;
- per-face fills, decals and label placement.

## Making posts and threads

Switch the top bar to **Thread**. Pick **Posts** (single posts) or **Thread** (one numbered X thread). Each post is two things: the text you paste into X, and a card.

1. **Start** from a blank post (**Add**) or from a poster in the brand book (**Templates**: tagline posters 4.9, campaign posters 4.10, the photo cover 1.5).
2. **Write the card:** a headline (put \*stars\* round the phrase to highlight), an optional line below and an optional small line above. The type sizes itself by the brand's type chart.
3. **Pick a picture:** an illustration (in a panel or from a corner), a **chart** from your numbers (big number, bars, histogram, line, area, rings, wheel, rays; type or paste the rows), your screenshot, a photo, or none.
4. **Backdrop:** a quiet dot pattern behind the card, for cards that look empty. It keeps clear of the words and the logo.
5. **Layout:** Standard, Tagline, Big number, Split, Card or Cover; 16:9, 1:1 or 4:5; Black, White or Green. The logo is the full lockup when it fits, the mark when it doesn't, always with clear space.
6. **Suggestions** point out what could read better or break a brand rule. Apply them, dismiss them, or turn them off.
7. **Copy or download:** Copy text, Copy image, PNG, and MP4 or GIF when the post is **Animated** (figures move, charts grow in, patterns drift).

Everything saves as you go, in your browser.

## Making dot patterns

Switch the top bar to **Patterns**. Start from a look (wave, soft wave, ribbon, halftone discs, rings, cube, stack, steps, sphere), from an image, or from any figure. Then set:
- the **dots**: grid, staggered or rings; spacing, size, round, square or ASCII;
- the **color**: Quiet by default (dark gray on black, very light gray on white), or any color you pick;
- the **motion**: a slow drift and a glitch that flickers single dots;
- the **artboard**: post sizes, a 9:16 story, an A-series poster, a slide or an X header.

Download a PNG, an SVG (every dot editable), an MP4 or a GIF, or **Use on a post** to put it behind the post you're working on.

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
| `npm run render -- out` | Write every library illustration and the built-in figure to `out/*.svg` (add `--clip` to cut hidden lines) |
| `npm run glyphs` | Rebuild the Geist outlines used by labels |

## The house rules

Strike's brand book and the 3D figures follow one direction. It is written down in `src/library/kit.ts`, and the tests check it.

1. **Two formats, one scene.**
   - Flat (straight down) is the simplest expression of an idea.
   - The 2:1 view (yaw 45°, pitch 30°) gives depth when the idea needs it.
   - Flat figures are thin plates in 3D, so they keep their look when turned to 2:1.
   - Every figure uses a 320 × 320 frame, fitted with a 14% margin.
2. **Lines first.**
   - Faces are the ground color, so a shape in front hides what's behind it. Every other outline shows.
   - Lines are 0.5 wide (1 px at 2×), and 1 px on screen at every size: the subject #D0D6E0, what supports it #62666D, the background #3E3E44.
   - Creases are #3E3E44 (#2E2E32 on background shapes), stopping just short of the outline.
3. **Dashed means not real yet.** Possible outcomes, ranges, construction circles and limits are dashed.
4. **Dots carry tone.**
   - Halftones show amount; dots that follow a curve show data.
   - Nodes (small squares or circles) mark exact points. They lie in their plane, so they're square when flat and diamond-shaped in 2:1.
5. **Color.**
   - Grays and Strike Green (#10B981), with one green focus per figure.
   - Infographics may also use the brand's data colors, each with one meaning: Loss #EE5E74, Profit #3FD4AB, and Yellow #FFEF3C, Sky #0788F7 and Purple #976FE6 to tell series apart.
   - Use the fewest colors that work.
6. **Labels.**
   - Set in Geist, with a ticker in Medium over its value in Regular ("AMD" over "IV 106.2%").
   - Three at most, and never on the focus. Infographics name every series.
7. **Grounds.** Ground #0C0C0C, White #F9F9F9 or Strike Green. The grays swap tier for tier, so the subject stays the strongest line.
8. **Motion.**
   - Calm, exact, never hyped.
   - One idea moves at a time, eased, and comes back to rest.
   - The first frame is the still picture.
9. **Corners and floating shapes.**
   - Side corners are nearly sharp; front and back corners are softly rounded.
   - Floating shapes get a soft shadow and dotted guides down to what's below.

## What's in it

### The library

| Group | Illustrations |
| --- | --- |
| Data (D·01–17) | bar chart, stacked bars, candlesticks, heat grid, volatility surface, order book depth, area chart, line chart, pie chart, distribution, scatter, waterfall, dot-matrix chart, gauge, dashboard tiles, A versus B, treemap |
| Options (O·01–17) | long call, long put, straddle, iron condor, butterfly, strike ladder, option chain, expiry calendar, always open (24/7), time decay, the greeks, vertical spread, volatility smile, premium, every market, cash settlement, leverage |
| Tech (T·01–16) | server rack, GPU compute, network, database, the stack, self-custody vault, blocks, wallet, terminal, phone, matching engine, low latency, pipeline, modules, time zones, distributed |
| Brand (B·01–15) | radar, unified margin, volatility segments, stacked frames, orbit, rising blocks, always on, payoff outcomes, volatility circles, share bubbles, feature radar, Strike mark drawn, week in lines, market rays, globe |

The Brand group redraws the illustrations from the brand book's Visual Language pages in the house look. Most are flat; press Standard to see the same figure in 2:1.

To add an illustration:
1. Write a `make()` with the kit's helpers (`box`, `cyl`, `sector`, `band`, `shape`, `wall`, `dots`, `line`, `ring`, `ticker`, `label`, `figure`).
2. Write a `loop(scene, t)` with the motion helpers in `src/anim/kit.ts`.
3. Add both to one of the lists in `src/library`.
4. Run `npm test`. The tests check the house rules, and that the loop starts and ends on the figure as drawn.

### Built-in figure

"Strike mark" stacks the chevrons of Strike's logo in 3D. It's the one figure in My figures when you first open the tool.

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
- pie slices;
- ring slices (for radial charts).

Every shape is a plan outline pushed straight up by its height. Corners are rounded as true circles in 3D, either all at once or each corner on its own. Objects can be moved, lifted, turned and tilted, and copied in a row with Repeat (fins, stacks, stairs).

### Lines

Lines come in these kinds:
- **Outline:** the silhouette.
- **Crease:** where two faces you can see meet. Creases are dim, stop a few units short of the outline (crease trim), and on curved sides fade out where the side turns away from you (crease taper).
- **Contact:** an edge resting on, or sinking into, another object. It's dimmed like a crease, as on FIG 0.1's stack.
- **Guide:** dotted uprights from a floating object down to whatever is under it.
- **Construction:** paths and circles that hide nothing: dashed circles, spokes, orbits, rays out to labels, arrows. They carry nodes, and are drawn exactly, because a circle seen through the camera is drawn as true béziers.

Any shape can be dashed, or see-through (just its lines).

### Faces

Any face can take a solid color and a dotted fill:
- An even grid, or staggered dots.
- Round or square dots.
- A halftone, whose dots grow, shrink or fade with a linear, radial, wave or noise gradient.
- A fill on just part of a face.

"All sides" wraps one fill round every side, so the pattern flows round the corners. Alt-click a face on the canvas to open it in the inspector.

### Decals and labels

A mark can be laid flat on a top face: the Strike logo (the flat version, as on FIG 0.1), any SVG, or a few words.

Labels can float upright or lie on the floor or a wall. Both are set in Geist Mono and drawn as outlines, so they look the same in every viewer, whether or not the font is installed. To rebuild the outlines, run `npm run glyphs`.

### Dots that follow a curve

A dotted fill can keep to one side of a curve, with the dots on the other side shown in a dim gray. This is how the payoff, area and terminal charts are drawn, like the dot-matrix payoff chart in Strike's app.

### Animation

Each illustration has its own loop, written next to it (`src/library/loops.ts` and `brand.ts`). Any figure can also use a shared motion:
- **Turn:** the view goes once round.
- **Build:** the shapes sink away and rise back into place, one after another.
- **Drift:** a band of light passes across the dots.

Loops change the figure relatively (heights scaled, positions nudged, dots lit) and find shapes by name. So a loop still works on a figure you've edited, and every loop rests at its start.

### Export

| Format | Use it for | Notes |
| --- | --- | --- |
| SVG | Figma, the website | Hidden lines are cut away and arcs stay as arcs, so the file is small and edits cleanly |
| PNG | slides, chats, docs | 1×, 2× or 4× |
| MP4 | X, LinkedIn, slides, the website | H.264, 540–1620 px, 30 fps; WebM in browsers that can't make MP4 |
| GIF | email, chat | 320–640 px, 20 fps, loops forever |
| Animated SVG | the website | Plays in browsers (CSS keyframes); parts that don't move are written once |
| Lottie | app and web developers | lottie-web / LottieFiles JSON; shadows are left out |

Pictures and animated SVGs can be exported with or without the background.

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
| `1`–`5` | 2:1, isometric, front, side and flat views |
| `[` / `]` | Turn by 15° |
| `F` | Fit the figure to the artboard |
| `P` | Play or pause the animation |
| Arrow keys / PageUp, PageDown | Nudge the selected object (Shift ×10) |
| ⌘D / ⌫ | Duplicate / delete |
| ⌘Z / ⇧⌘Z | Undo / redo |
| ⌘S / ⌘E | Save the figure / export |

## How it works

The engine is in `src/engine`. It turns a scene into an SVG in four steps:

1. **Camera** (`math.ts`). The camera is orthographic and set by yaw and pitch. At yaw 45° and pitch 30°, both ground axes leave at a 2:1 slope.
2. **Shapes** (`shapes.ts`). Each outline is made of lines and circular arcs. Concave outlines (the chevron) are cut into convex pieces along seams that are never drawn.
3. **Drawing** (`render.ts`, `curves.ts`). For each piece, the engine works out:
   - which faces turn towards you;
   - which edges are outlines, creases or contacts;
   - the visible stretch of each curved side, where a projected circle becomes an exact elliptical arc;
   - the fills, the dots (`dots.ts`) and any decal (`decal.ts`).
4. **Order and output** (`order.ts`, `svg.ts`). Pieces are convex, so one ray through the overlap of any two tells which is in front. The pieces are painted back to front, and the SVG can cut away the lines hidden behind nearer pieces.

The editor (`src/ui`, `src/model`) is React with a small zustand store. The canvas draws the same SVG that the export writes. The library is in `src/library`.

The post tool is in `src/social`:
- `layout.ts`: the card layouts (standard and the poster layouts), used by the preview and every export;
- `render.ts`: draws cards on a canvas, still or moving;
- `chart.ts`, `chartDraw.ts`: chart data and drawing;
- `advice.ts`, `voice.ts`: the suggestions and the brand's word rules;
- `templates.ts`: the brand book's posters as posts;
- `text.ts`: X's character count, highlights and line breaking.

The pattern maker is in `src/pattern`: tone fields (`field.ts`), the dot screen (`halftone.ts`), drawing and SVG (`draw.ts`), and tone from images and figures (`sources.ts`).

The animation code is in `src/anim`:
- `motion.ts`: a figure at moment t of its loop;
- `kit.ts`: the loop helpers;
- `encode.ts`: MP4 and GIF;
- `svgAnim.ts`: the animated SVG;
- `lottie.ts`: the Lottie file.

Fonts are Geist and Geist Mono (SIL Open Font License), from Fontsource. Labels are drawn as Geist outlines (`npm run glyphs`), so they look the same in every file.
