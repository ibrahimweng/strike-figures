# Set up Strike design in ChatGPT

## As a custom GPT
1. Open chatgpt.com/gpts/editor and choose **Configure**.
2. **Name:** Strike design. **Description:** Makes on-brand work for Strike.
3. **Instructions:** paste all of `instructions.md` (5,970 of 8,000 characters).
4. **Knowledge:** upload `STRIKE-DESIGN.md`, `tokens.css`, `tokens.json` and `strike-logos.zip` from `knowledge/`. A GPT takes up to 20 files, so the logos come as one zip; single logo files are in `portable/logo/`.
5. **Capabilities:** turn on Code Interpreter & Data Analysis (it opens the zip and writes files) and Image Generation.
6. Save it, shared with the people who need it.

## As a ChatGPT Project
1. Create a project called Strike design.
2. Open the project's instructions and paste all of `instructions.md`.
3. Add the same four files from `knowledge/` to the project's files.
4. Start Strike chats inside the project.

## Check what it makes
Save the output and run `node scripts/check.mjs <file>` in the strike-design-skill repository.
