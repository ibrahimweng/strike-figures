> This skill lives inside the Strike Figures tool (`skill/` in that repo). From the repo root: `npm run skill:build`, `npm run skill:check -- <files>`, `npm run skill:test`. The tool's Skill page serves the built files.

# Strike design skill

Strike's brand rules, packaged so any AI tool makes on-brand work: UI, pages, posts, posters, slides, docs, emails and illustrations. One source (`source/`) builds a version for each tool (`dist/`), and a checker tells you what's off.

## Install

Run `npm run build` first (Node 22, no dependencies), then take the files from `dist/`.

| Tool | Files | How |
|---|---|---|
| Claude Code | `dist/claude/strike-design.zip` | Unzip it into `~/.claude/skills/` (all projects) or `.claude/skills/` in one repository. |
| claude.ai | `dist/claude/strike-design.zip` | Settings, Capabilities, Skills, Upload skill. |
| ChatGPT | `dist/chatgpt/` | Paste `instructions.md` into a custom GPT or a Project and upload the files in `knowledge/`. Steps: `SETUP.md`. |
| Cursor | `dist/cursor/strike-design-cursor.zip` | Unzip it in the project's root. It adds `.cursor/rules/` and `strike-design/`. |
| Codex and other AGENTS.md tools | `dist/agents/strike-design-agents.zip` | Unzip it in the project's root. Windsurf, Jules and Copilot's coding agent read AGENTS.md too. |
| GitHub Copilot | `dist/copilot/strike-design-copilot.zip` | Unzip it in the repository's root. It adds `.github/copilot-instructions.md`. |
| Gemini | `dist/gemini/` | New Gem: paste `gem-instructions.md`, add the files in `knowledge/`. |
| Perplexity | `dist/perplexity/` | New Space: paste `space-instructions.md`, upload the files in `knowledge/`. |
| Figma | `dist/figma/` | Import `tokens.json` as variables; use `guidelines.md` as Figma Make's Guidelines.md. Steps: `SETUP.md`. |
| Anything else | `dist/STRIKE-DESIGN.md` | Attach it, or give the AI its link, and say "Follow these rules for Strike work." `dist/portable/strike-design-kit.zip` adds tokens, logos and fonts. |

For code, `dist/tokens/` has `tokens.css` (CSS variables, dark by default, light under `[data-theme="light"]`), a Tailwind v3 preset and a Tailwind v4 theme.

## Change a rule

Edit `source/`, never `dist/`:

- `source/core.md`: the core rules that every tool gets (the ChatGPT version must stay under 8,000 characters);
- `source/mini.md`: the short version for Perplexity (under 1,500 characters);
- `source/rules/*.md`: the detailed rules;
- `source/tokens.json`: colors, type, spacing, radii and motion (W3C Design Tokens).

Then run `npm run build`. It prints each target's size and fails if a limit is broken or a path in the rules doesn't resolve. `npm test` runs the tests.

The build writes to `dist/` by default. `node scripts/build.mjs --out <dir>` writes elsewhere; relative paths resolve from this folder. The output is plain static files with relative links, so it can be served as-is. It includes `llms.txt`, an index of every file, and `manifest.json`, which lists the targets, downloads, logos, colors and fonts.

## Check work

```bash
npm run check -- page.html styles.css src/
node scripts/check.mjs out/ --json
```

It reads `.html`, `.css`, `.svg`, `.jsx`, `.tsx`, `.vue` and `.md` files. It reports colors off the palette, fonts other than Geist, white text on green and low contrast, long, shouting or Title Case titles, "STRIKE" in text, "USD", market counts other than "about 80 underlyings", banned claims, words the brand avoids ("24/7", "revolutionary", "safe", "unforgettable"), British spellings, a changed tagline, the old custody wording, exclamation marks, a missing risk line and off-scale corner radii. Each finding comes with `file:line` and a one-line fix. It exits with 1 when there are errors. A copy ships with each kit, so AI tools can run it on their own output.

## Evals

`evals/prompts.md` has 14 test requests and what a passing answer must do; `evals/run.md` says how to run them in each tool and score them.

## Folders

```
source/        the rules and tokens: edit these
assets/        logo files, fonts, posters
scripts/       build.mjs (builds dist/), check.mjs (the checker), lockup.mjs (sub-brand lockups)
test/          node:test suites and fixtures
evals/         prompts and how to score them
docs/          the brand spec and site findings
dist/          generated: one folder per tool, plus STRIKE-DESIGN.md, llms.txt, manifest.json
```
