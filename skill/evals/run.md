# Running the evals

Run all fourteen prompts in `prompts.md` in each tool, save what comes back, check it, then score it.

## 1. Install the Strike files in the tool

Build first (`npm run build`), then follow the README in the tool's folder:

| Tool | Install from | Where to run the prompts |
|---|---|---|
| Claude (claude.ai) | `dist/claude/strike-design.zip` | A new chat with the skill on |
| Claude Code | `dist/claude/strike-design.zip`, unzipped into `~/.claude/skills/` | A new session in an empty folder |
| ChatGPT | `dist/chatgpt/` (see `SETUP.md`) | A new chat with the GPT, or inside the Project |
| Cursor | `dist/cursor/strike-design-cursor.zip`, unzipped into an empty project | Agent chat |
| Codex and other AGENTS.md tools | `dist/agents/strike-design-agents.zip`, unzipped into an empty project | The agent, in that project |
| GitHub Copilot | `dist/copilot/strike-design-copilot.zip`, unzipped into a test repository | Copilot Chat in agent mode |
| Gemini | `dist/gemini/` | A new chat with the Gem |
| Perplexity | `dist/perplexity/` | A new thread in the Space |
| Figma Make | `dist/figma/guidelines.md` as the file's Guidelines.md | A new Make file |
| Any other chat | `dist/portable/STRIKE-DESIGN.md`, attached | A new chat |

## 2. Run each prompt

- Use a new chat or session for every prompt, so earlier answers don't help.
- Paste the prompt exactly as written. Don't add hints.
- If the tool asks a question (light or dark, USD or USDC), answer it the plain way ("dark", "USDC") and note that it asked: for prompts 10 and 11, asking is part of a pass.

## 3. Save the output

Save each answer as `evals/outputs/<tool>/<n>.html` for anything visual, or `<n>.md` for text and threads. For prompt 3, `<n>.tsx` works too. Use the tool's id from the manifest: `claude`, `chatgpt`, `cursor`, `agents`, `copilot`, `gemini`, `perplexity`, `figma`, `portable`.

If a tool answers with an image (a poster or a card from image generation), save it as `<n>.png` and score it by eye; the checker reads only code and text.

## 4. Check it

```bash
node scripts/check.mjs evals/outputs/<tool>
node scripts/check.mjs evals/outputs/<tool> --json > evals/outputs/<tool>/check.json
```

Errors fail the prompt. Warnings are for you to judge: a warning on a real rule (an exclamation mark, a market count, "USD") fails it too.

## 5. Score it

For each prompt, tick each "a passing answer" line in `prompts.md` that the output meets. A prompt passes when the checker shows no errors and every line is met.

### Per tool

Tool: ______  Model: ______  Date: ______

| # | Prompt | Checker errors | Checker warnings | Lines met | Pass | Notes |
|---|---|---|---|---|---|---|
| 1 | Landing page hero | | | / 7 | | |
| 2 | Fees table | | | / 5 | | |
| 3 | Trading UI component | | | / 5 | | |
| 4 | X thread with cards | | | / 6 | | |
| 5 | Poster | | | / 6 | | |
| 6 | Slide | | | / 4 | | |
| 7 | Launch email | | | / 5 | | |
| 8 | Docs page header | | | / 3 | | |
| 9 | Logo on a photo | | | / 4 | | |
| 10 | A request that breaks the rules | | | / 4 | | |
| 11 | USD or USDC | | | / 2 | | |
| 12 | Sub-brand | | | / 4 | | |
| 13 | Homepage copy | | | / 5 | | |
| 14 | Merch | | | / 4 | | |

### Across tools

| Tool | Model | Prompts passed (of 14) | Checker errors | Checker warnings | Date |
|---|---|---|---|---|---|
| Claude | | | | | |
| ChatGPT | | | | | |
| Cursor | | | | | |
| Codex | | | | | |
| GitHub Copilot | | | | | |
| Gemini | | | | | |
| Perplexity | | | | | |
| Figma Make | | | | | |
| Other | | | | | |

When a prompt fails in several tools, the rule probably needs saying more plainly in `source/`. Change it there, rebuild and run that prompt again.
