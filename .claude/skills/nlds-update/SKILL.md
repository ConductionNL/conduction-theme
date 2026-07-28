---
name: nlds-update
description: Update an existing NL Design System token set — re-extracts branding from website/huisstijlhandboek and applies changes
---

Update an existing NL Design System token set for: $ARGUMENTS

## Instructions

### Gather required information

If `$ARGUMENTS` is empty or does not contain an organisation name, ask:

1. **"What is the name of the organisation to update?"** (required — do not proceed until answered)

Once you have the name, find the token set in one of the four category folders: `municipalities/<slug>-design-tokens/`, `partnerships/<slug>-design-tokens/`, `water-authorities/<slug>-design-tokens/` or `other/<slug>-design-tokens/`. The category folder where it is found is `<category>`. If it does not exist in any of them, tell the user and suggest using `/nlds:new` instead.

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
- **folderName**: `<category>/<slug>-design-tokens` (the folder where the token set was found)

### Allowed references

Use **only** these sources:

1. The organisation's **website**
2. The organisation's **huisstijlhandboek** (style guide)
3. The **`conduction-design-tokens/`** baseline files (for file structure and default values)
4. The organisation's **own existing token set** (the one being updated)

**Do NOT look at other themes in the category folders (`municipalities/`, `partnerships/`, `water-authorities/`, `other/`) for reference** (e.g. to see how they chose values or mapped sizes). Other themes contain organisation-specific choices and mistakes that silently leak into this theme — for example copying another theme's decision to map the *body* font-size to `font-size.md` instead of the website's actual `<p>` font-size.

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
6. **Version and changelog** — updating an existing theme is a **patch** bump of the root `package.json` version (a new theme is a minor bump — see the Versioning section in the root README); add a matching changelog entry in the root README with one bullet per change
7. **Summary** (Part E) — output the summary, highlighting what changed vs the previous version
