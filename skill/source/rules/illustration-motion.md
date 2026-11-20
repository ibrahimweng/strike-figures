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
- **Making them:** use the Strike Figures tool (65 ready illustrations, exports SVG, PNG, MP4, GIF, animated SVG and Lottie) when it's available. Otherwise draw with these rules.

## Motion
- **Character:** calm and exact. One thing moves at a time, eased, and comes back to rest. The first frame is the still.
- **UI timing:**
  - 120 ms for small changes, 200 ms for panels, 320 ms for page transitions;
  - ease cubic-bezier(0.2, 0, 0, 1);
  - no bounce, no flashing;
  - honour reduced motion.
- **Video and loops:** 3–6 s, seamless. Type fades in; it never flies in.
