# Set up Strike design in Figma

## Variables
1. Import `tokens.json` (W3C Design Tokens format) into a variable collection, with Figma's variable import where you have it, or a design tokens plugin such as Tokens Studio.
2. Dark is the default. The values under `color.light` are the Light mode of the same collection: add a Light mode and enter them there.
3. Text styles come from `typography` in the same file. Install the Geist fonts first.

## Figma Make
1. In the Make file, open the code view and find `guidelines/Guidelines.md`. If it isn't there, create it.
2. Replace its contents with the text of `guidelines.md`.
3. Upload the logo files you need from `logos/` and say which one to use. Make must not redraw the logo.

## Logo files
Drag the SVGs in `logos/` onto the canvas. The logo rules in `guidelines.md` say which one fits each ground.
