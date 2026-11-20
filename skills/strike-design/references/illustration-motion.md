# Illustration and motion

## Illustration
- **Formats:** flat (straight down) for the simplest expression of an idea; isometric 2:1 when the idea needs depth. Flat pieces are thin plates, so they keep their look when turned to 2:1.
- **Lines first:** faces are the ground colour, so a shape in front hides what's behind it, and every other outline shows.
- **Line strengths:** three of them. On dark: subject #D0D6E0, support #62666D, background #3E3E44. On light they swap tier for tier.
- **Line weight:** 1 px on large illustrations, 2 px on small ones. Nodes (small squares or circles marking exact points) are 10 px and 20 px.
- **Dashed lines** mean "not real yet": possible outcomes, ranges, construction circles, limits.
- **Dots** carry tone: halftones for amount, dots along a curve for data.
- **Colour:** greys and one green focus. Data colours only in infographics.
- **Labels:** Geist, a ticker in Medium over its value in Regular; at most three labels except in infographics.
- **Grid:** built on the 50 px grid.
- **Illustration is not the logo:** an illustration is always line art in the 2:1 view (or flat). Never use the logo files, a solid colour block or a screenshot as an illustration. To show the mark in an illustration, draw it as lined plates.
- **It supports the words:** next to a title, an illustration is quieter than the title: mostly the support line, one subject line, at most one green. The title stays the brightest thing on the card.
- **Never tiny:** no text under 12 px, no labels on small illustrations, no hairline detail that disappears at the size it's shown. Scale the illustration up or leave the detail out.
- **On cards and hover:** rest still; on hover make one move on the motion curves (gather, release), revealing detail (colour as dots, the green focus) only then.
- **Making them:** use the Strike Figures tool (66 ready illustrations, exports SVG, PNG, MP4, GIF, animated SVG and Lottie) when it's available. Otherwise draw with these rules.

## Motion
- **Character:** calm and exact. One thing moves at a time and comes back to rest. The first frame is the still. No bounce, no flashing; honour reduced motion.

### The two curves
Every move has a meeting point: the moment shapes come together (or pass through their rest state). Shapes speed up into it and slow down out of it, so the fastest frame is the meeting.

| Name | Curve | Duration | Use |
|---|---|---|---|
| Gather (ease-in) | cubic-bezier(0.55, 0, 0.85, 0) | 400 ms | Into the meeting point; back to rest when a hover ends |
| Release (ease-out) | cubic-bezier(0.15, 1, 0.6, 1) | 320 ms | Out of it to the new state; hover-in |
| Rest | — | 280 ms | Still between moves |
| UI (standard) | cubic-bezier(0.2, 0, 0, 1) | 120 / 200 / 320 ms | Plain UI: colour, small changes, panels, page transitions |

- **A loop** is rest → gather → release: 280 + 400 + 320 = 1000 ms.
- **Everything uses them:** a move between two still states gathers into its midpoint and releases out of it; a move out and back does that twice; turns go in eased steps (a rest, then a move, each beat), never at a constant speed; light sweeps ease the same way.
- **Press** (a click): gather in 240 ms, release out 200 ms.
- Small moves may shorten both, keeping the ratio (gather a little longer than release).

### Circle composition
- **Five equal circles, three over two.** Each touches its neighbours: centres 2r apart in a row, rows r·√3 apart, the lower two sitting in the gaps.
- **Drawn like every illustration:** thin plates with faces in the ground colour (a circle in front hides the one behind), the subject line #D0D6E0 at rest size and up, the support line #62666D on circles giving way, and the one green focus as dots on the growing circle. No solid fills.
- **Flat or 2:1:** flat (straight down) to explain the composition, with the row centres as dashed construction lines; the 2:1 view to give the same plates depth. Mix them as the explanation needs.
- **Focus move:** one circle grows (up to 2×) while the others shrink (down to 0.5×) and stay packed against it. Changing focus always passes back through the five equal circles: gather into them, release out to the new focus.
- **Press move:** the five circles squeeze towards the centre and back.
- **In a row** (e.g. icons): the hovered circle grows by about a third and its two neighbours give up the same width between them, so the row keeps its length.

### Video and loops
3–6 s in whole seconds, seamless, built from 1 s beats. Type fades in; it never flies in.
