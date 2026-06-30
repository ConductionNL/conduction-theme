---
name: nlds-new
description: Create a new NL Design System token set for an organisation — extracts branding from website/huisstijlhandboek via Playwright
---

Create a new NL Design System token set for: $ARGUMENTS

## Instructions

### Gather required information

If `$ARGUMENTS` is empty or does not contain an organisation name, ask:

1. **"What is the name of the organisation?"** (required — do not proceed until answered)

Once you have the name, ask:

2. **"Should I extract the design from the organisation's website, a huisstijlhandboek (style guide), or both?"**

If the user says **website** or **both**, look up the most likely website URL (e.g. `https://www.<name>.nl/`) and ask:

3. **"Is this the correct website: `<url>`? (or provide the right one)"**

If the user says **huisstijlhandboek**, ask:

4. **"What is the URL of the huisstijlhandboek?"**

If `$ARGUMENTS` already contains a name and URL, confirm both with the user before proceeding.

### Derive identifiers

From the organisation name:

- **slug**: lowercase, spaces replaced with hyphens (e.g. "den-haag", "vng-realisatie")
- **prefix**: same as slug
- **fullName**: the proper name (e.g. "Den Haag", "VNG Realisatie")
- **packageName**: `@nl-design-system-unstable/<slug>-design-tokens`
- **folderName**: `municipalities/<slug>-design-tokens`

### Execute

Read the shared reference at `conduction-theme/.claude/commands/nlds-reference.md` and follow it from the top:

1. **Extract** — follow the extraction procedure (website and/or huisstijlhandboek as the user requested)
2. **Create all files** — follow the file creation procedure to create the full token set from scratch
3. **Update component tokens** — follow the component update mapping to apply extracted values
4. **Build and test** — follow the build procedure, fix any errors
5. **Summary** — output the summary as described in the reference
