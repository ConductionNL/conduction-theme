---
name: nlds-update
description: Update an existing NL Design System token set — re-extracts branding from website/huisstijlhandboek and applies changes
---

Update an existing NL Design System token set for: $ARGUMENTS

## Instructions

### Gather required information

If `$ARGUMENTS` is empty or does not contain an organisation name, ask:

1. **"What is the name of the organisation to update?"** (required — do not proceed until answered)

Once you have the name, verify the token set exists at `municipalities/<slug>-design-tokens/`. If it does not exist, tell the user and suggest using `/nlds:new` instead.

Then ask:

2. **"Should I re-extract the design from the organisation's website, a huisstijlhandboek (style guide), or both?"**

If the user says **website** or **both**, look up the website URL from the existing `package.json` (the `"website"` field) and ask:

3. **"Is this still the correct website: `<url>`? (or provide the right one)"**

If the user says **huisstijlhandboek**, ask:

4. **"What is the URL of the huisstijlhandboek?"**

### Derive identifiers

From the existing token set, read `src/config.json` to get:

- **slug**: the `prefix` field
- **fullName**: the `fullName` field
- **prefix**: same as slug
- **packageName**: from `package.json` `name` field
- **folderName**: `municipalities/<slug>-design-tokens`

### Execute

Read the shared reference at `conduction-theme/.claude/commands/nlds-reference.md` and follow it, **skipping Part B** (file creation):

1. **Extract** (Part A) — follow the extraction procedure (website and/or huisstijlhandboek as the user requested)
2. **Skip Part B** — files already exist, do not recreate them
3. **Update component tokens** (Part C) — read existing token files, compare with new extraction data, update only values that changed
4. **Update brand tokens** — if the extraction reveals new/changed colors or fonts:
   - Update `color.tokens.json` with any new palette entries
   - Update `typography.tokens.json` if the font changed
   - Update `font-size.tokens.json` if sizes changed
   - Download any new font files to `src/font/` and update `font.scss`
5. **Build and test** (Part D) — follow the build procedure, fix any errors
6. **Summary** (Part E) — output the summary, highlighting what changed vs the previous version
