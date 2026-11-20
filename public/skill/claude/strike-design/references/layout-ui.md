# Layout and UI

## Layout
- **Grid:** posters, social cards, slides and illustrations sit on a 50 px grid. Margins are 50 px on cards and posters, 24 px on mobile web, 64 px on desktop web.
- **Spacing:** 4, 8, 12, 16, 24, 32, 48, 64, 96, 128.
- **Space:** leave room. Fewer elements aligned to the grid beat more elements. Group by spacing before adding lines or boxes.
- **Logo:** in a corner of the grid.
- **Breaking the grid:** designers may break poster grids when the layout still holds together. Product UI keeps to the grid.

## Surfaces
- **Dark by default:**
  - ground #0C0C0C;
  - cards #121214 with a 1 px line (ink at 8%) and a 12 px radius;
  - no shadows on dark.
- **Light mode (when asked):** cards #FFFFFF with a 1 px line (ground at 8%), and at most a soft shadow (0 1px 2px at 6%).

## Components
| Component | Spec |
|---|---|
| Primary button | Green #10B981 fill, ground text, Geist Medium 14–16 px, 40 px tall (32 small), 8 px radius. One per view |
| Secondary button | #18181B fill, ink text, 1 px line |
| Ghost button | Text only, ink-2 → ink on hover |
| Input | #18181B field, 1 px line at 14%, 8 px radius, 40 px tall; label above in Label style; focus ring 2 px green |
| Card | #121214, 1 px line at 8%, 12 px radius, 24 px padding |
| Pill / tag | Full radius, 24 px tall, Label style |
| Table | Rows 40 px, hairline dividers, numbers right-aligned in tabular figures, header in Label style ink-3 |
| Toast | #18181B, 8 px radius, one line, 4 s |
| Modal | #121214, 12 px radius, max 480 px wide, ground at 70% behind |

- **States:** default, hover (one step lighter), active, focus (green ring), disabled (40% opacity), loading (no layout shift), error (loss colour plus a line saying what happened and what to do).
- **Icons:** 24 px grid, 2 px stroke, round ends and corners, outline style; ink-2 by default.
- **Trading data:**
  - profit #3FD4AB, loss #EE5E74, always with a sign or an arrow;
  - prices in tabular figures;
  - time zones always shown (20:00 ET).
- **Empty, loading and error states** are designed, not left blank.
- **Accessibility:**
  - contrast per references/colour.md;
  - focus is always visible;
  - targets at least 32 px;
  - honour reduced motion.
