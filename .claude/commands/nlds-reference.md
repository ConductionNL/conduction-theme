# NL Design System Token Set — Shared Reference

This document is the shared reference for both `/nlds:new` and `/nlds:update`. It contains all extraction scripts, file templates, component mappings, and build/test procedures.

**Do not invoke this file directly** — it is read by the skill wrappers which provide the organisation name, slug, URLs, and mode (new vs update).

## Variables provided by the calling skill

| Variable | Example | Description |
|---|---|---|
| `<slug>` | `den-haag` | Lowercase, hyphenated identifier |
| `<prefix>` | `den-haag` | Same as slug |
| `<fullName>` | `Den Haag` | Proper display name |
| `<packageName>` | `@nl-design-system-unstable/den-haag-design-tokens` | npm package name |
| `<folderName>` | `municipalities/den-haag-design-tokens` | Directory path |
| `<websiteUrl>` | `https://www.denhaag.nl/` | Organisation website (may be empty) |
| `<huisstijlUrl>` | (url) | Style guide URL (may be empty) |
| `<mode>` | `new` or `update` | Whether creating from scratch or updating existing |

> **Notation convention:**
>
> - `<slug>`, `<fullName>`, `<fontKey>` etc. in angle brackets = **template variables** — substitute with the actual derived value
> - `{token.reference}` in curly braces = **Style Dictionary token references** — write literally into the output file (after substituting any `<angle-bracket>` parts inside them)
> - Example: `"{<slug>.size.xs}"` → written as `"{gouda.size.xs}"` in the output file for organisation "Gouda"

---

## Part A — Extract design info

If a website URL or huisstijlhandboek URL was provided, use **Playwright MCP** to extract the organisation's visual design. If neither was provided, skip to Part B and use placeholder values.

### A1 — Navigate and screenshot

1. Navigate to the homepage using `mcp__browser-{N}__browser_navigate`.
2. Take a **full-page screenshot** (`mcp__browser-{N}__browser_take_screenshot` with `fullPage: true`).

### A2 — Run the extraction script on the homepage

Run the following JavaScript via `mcp__browser-{N}__browser_evaluate` **exactly as written** — do not modify or simplify it. Copy-paste the entire function:

```js
() => {
  const rgbToHex = (rgb) => {
    if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return null;
    const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!m) return rgb;
    const hex = '#' + [m[1],m[2],m[3]].map(x => parseInt(x).toString(16).padStart(2,'0')).join('');
    if (m[4] !== undefined && parseFloat(m[4]) < 1) {
      const alpha = Math.round(parseFloat(m[4]) * 255).toString(16).padStart(2,'0');
      return hex + alpha;
    }
    return hex;
  };
  const hslLightness = (hex) => {
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    return Math.round((Math.max(r,g,b)+Math.min(r,g,b))/2*100);
  };
  const getStyles = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    return {
      backgroundColor: rgbToHex(cs.backgroundColor),
      color: rgbToHex(cs.color),
      fontFamily: cs.fontFamily,
      fontSize: cs.fontSize,
      fontWeight: cs.fontWeight,
      lineHeight: cs.lineHeight,
      borderColor: rgbToHex(cs.borderColor),
      borderRadius: cs.borderRadius,
      borderWidth: cs.borderWidth,
      paddingBlockStart: cs.paddingTop, paddingBlockEnd: cs.paddingBottom,
      paddingInlineStart: cs.paddingLeft, paddingInlineEnd: cs.paddingRight,
      textDecoration: cs.textDecoration,
    };
  };
  const first = (sels) => { for (const s of sels) { const el = document.querySelector(s); if (el) return el; } return null; };

  const result = { components: {}, allColors: [], allFonts: [], loadedFonts: [], fontFaceRules: [] };

  // Component extraction — multiple selectors per component for robustness
  const componentMap = {
    h1: ['h1'], h2: ['h2'], h3: ['h3'], h4: ['h4'],
    paragraph: ['article p', 'main p', '.content p', 'p'],
    link: ['article a', 'main a', '.content a', 'a:not([class*="logo"]):not([class*="nav"])'],
    button: ['button[type="submit"]', '.btn-primary', 'button.primary', 'form button', 'button'],
    searchInput: ['input[type="search"]', 'input[name*="search"]', 'input[name*="zoek"]', 'input[type="text"]'],
    pageHeader: ['header', '[class*="header"]:not(th)', 'nav[role="navigation"]'],
    pageFooter: ['footer', '[class*="footer"]'],
    breadcrumb: ['nav[aria-label*="breadcrumb"] a', '[class*="breadcrumb"] a', 'ol[class*="breadcrumb"] li a'],
    card: ['[class*="card"]', '[class*="tile"]', '[class*="teaser"]', 'article'],
    separator: ['hr', '[class*="separator"]', '[class*="divider"]'],
  };
  for (const [name, sels] of Object.entries(componentMap)) {
    const el = first(sels);
    result.components[name] = getStyles(el);
  }

  // Collect ALL unique colors on the page
  const uniqueColors = new Set();
  document.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    [cs.backgroundColor, cs.color, cs.borderColor].forEach(v => {
      const h = rgbToHex(v);
      if (h && h.length >= 7) uniqueColors.add(h.slice(0,7));
    });
  });
  result.allColors = [...uniqueColors].map(hex => ({ hex, lightness: hslLightness(hex) }));

  // Font families
  const uniqueFonts = new Set();
  document.querySelectorAll('h1,h2,h3,h4,p,a,button,input,body').forEach(el => {
    uniqueFonts.add(getComputedStyle(el).fontFamily);
  });
  result.allFonts = [...uniqueFonts];

  // Loaded font faces
  document.fonts.forEach(f => {
    result.loadedFonts.push({ family: f.family, weight: f.weight, style: f.style, status: f.status });
  });

  // @font-face rules from stylesheets
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule instanceof CSSFontFaceRule) {
            const src = rule.style.getPropertyValue('src');
            const family = rule.style.getPropertyValue('font-family');
            const weight = rule.style.getPropertyValue('font-weight');
            result.fontFaceRules.push({ family: family.replace(/['"]/g,''), weight, src: src.substring(0, 300) });
          }
        }
      } catch(e) {}
    }
  } catch(e) {}

  // Google Fonts links
  result.googleFontLinks = [];
  document.querySelectorAll('link[href*="fonts.googleapis"], link[href*="fonts.gstatic"]').forEach(l => {
    result.googleFontLinks.push(l.href);
  });

  return result;
}
```

**Record the returned JSON** — you will use it to set token values.

### A3 — Visit additional pages and re-run extraction

Navigate to **each** of the following pages (skip if not found), take a full-page screenshot, and re-run the same extraction script:

1. A **content/service page** — click on the first article/service link visible on the homepage. This reveals body text, heading hierarchy, and link styles in context.
2. The **search page** — try these URLs in order: `/zoeken`, `/search`, `?s=test`. If none work, look for a search icon/link in the header. This reveals form inputs, result cards, and pagination.
3. A **contact page** — try `/contact`, `/over-ons`, or look in the footer. This reveals forms with multiple input types.

After each page, **merge the results**: if a component was `null` on the homepage but found on a later page, use the later value. If both have values, keep the homepage value (it's the primary design).

### A4 — Resolve font file URLs

From the `fontFaceRules` array in the extraction result, resolve each `src` URL to an absolute URL:

```js
() => {
  const fonts = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSFontFaceRule) {
          const family = rule.style.getPropertyValue('font-family').replace(/['"]/g, '');
          const weight = rule.style.getPropertyValue('font-weight') || '400';
          const src = rule.style.getPropertyValue('src');
          // Extract URLs from src
          const urls = [...src.matchAll(/url\("?([^")\s]+)"?\)/g)].map(m => {
            try { return new URL(m[1], document.baseURI).href; } catch(e) { return m[1]; }
          });
          // Prefer woff2 > woff > ttf > otf
          const preferred = urls.find(u => u.endsWith('.woff2')) || urls.find(u => u.endsWith('.woff')) || urls.find(u => u.endsWith('.ttf')) || urls.find(u => u.endsWith('.otf')) || urls[0];
          if (preferred) fonts.push({ family, weight, url: preferred, ext: preferred.split('.').pop().split('?')[0] });
        }
      }
    } catch(e) {}
  }
  return fonts;
}
```

**Record the returned array** — you will download these font files later.

### A5 — Extract from huisstijlhandboek (if applicable)

If a huisstijlhandboek URL was provided:

1. Navigate to the URL using `mcp__browser-{N}__browser_navigate`.
2. Take a screenshot.
3. Look for: colour palettes (hex values), typography specifications (font names, sizes, weights), logo usage guidelines.
4. Extract any values not already found from the website. The huisstijlhandboek takes precedence for brand palette definitions (exact hex codes) and font specifications.

### A6 — Build the design summary

From the extraction results, build this structured summary (write it out as text in your response so it's clear and traceable):

| Property | Value | Source |
|----------|-------|--------|
| **Primary brand color** | (hex) — the most prominent non-black, non-white, non-grey color used for headings, links, or the header | components.h3.color or components.link.color |
| **Primary hover color** | (hex) — slightly darker variant, OR darken primary by 10% lightness | Observed or calculated |
| **Body font family** | (font stack) | components.paragraph.fontFamily |
| **Heading font family** | (font stack) — may be the same as body | components.h1.fontFamily |
| **Body font size** | (px → rem) | components.paragraph.fontSize |
| **Body font weight** | (number) | components.paragraph.fontWeight |
| **Heading font weight** | (number) | components.h1.fontWeight |
| **H1 font size** | (px → rem) | components.h1.fontSize |
| **H2 font size** | (px → rem) | components.h2.fontSize |
| **H3 font size** | (px → rem) | components.h3.fontSize |
| **H4 font size** | (px → rem, estimated if not found) | components.h4.fontSize |
| **Page header bg** | (hex) | components.pageHeader.backgroundColor |
| **Page header text** | (hex) | components.pageHeader.color |
| **Page footer bg** | (hex) | components.pageFooter.backgroundColor |
| **Page footer text** | (hex) | components.pageFooter.color |
| **Link color** | (hex) | components.link.color |
| **Button bg** | (hex) | components.button.backgroundColor |
| **Button text** | (hex) | components.button.color |
| **Button border-radius** | (px) | components.button.borderRadius |
| **Input border-color** | (hex) | components.searchInput.borderColor |
| **Input border-radius** | (px) | components.searchInput.borderRadius |
| **Separator color** | (hex) | components.separator.backgroundColor or borderColor |
| **Font file URLs** | (list) | From Step A4 |

**This table is your source of truth for all token values.** Every token value you write must trace back to a row in this table. If a property could not be extracted (returned `null`), note it as "not found — using conduction default" and do NOT change that token from the conduction baseline.

If no URL was provided, use placeholder values and inform the user they should update the color and font values.

---

## Part B — Create all files (new mode only)

> **Skip this part in `update` mode** — go directly to Part C.

Create the full directory structure at `municipalities/<slug>-design-tokens/` modeled on `conduction-design-tokens/`. Create every file listed below.

> **Do not create or copy the `dist/` folder.** This folder is generated by `npm run build` and will always be overwritten.

---

### `municipalities/<slug>-design-tokens/package.json`

```json
{
  "version": "1.0.0-alpha.1",
  "author": "Community for NL Design System",
  "description": "NL Design System design tokens for <fullName>",
  "website": "<websiteUrl>",
  "keywords": ["nl-design-system", "conduction"],
  "license": "SEE LICENSE IN LICENSE.md",
  "name": "<packageName>",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git+ssh",
    "url": "git@github.com:nl-design-system/themes.git"
  },
  "scripts": {
    "clean": "rimraf -rf dist/",
    "prebuild": "npm run clean",
    "watch": "npm-run-all watch:**",
    "watch:style-dictionary": "chokidar --follow-symlinks --command 'npm run --ignore-scripts build' 'src/**/*.tokens.json'",
    "build": "npm-run-all build:**",
    "build:scss": "sass --no-source-map src/:dist/",
    "build:style-dictionary": "style-dictionary build --config ./style-dictionary.config.js"
  },
  "devDependencies": {
    "@nl-design-system-unstable/theme-toolkit": "workspace:*",
    "chokidar-cli": "3.0.0",
    "npm-run-all": "4.1.5",
    "rimraf": "3.0.2",
    "style-dictionary": "3.8.0"
  },
  "bugs": {
    "url": "https://github.com/ConductionNL/conduction-theme/issues"
  },
  "homepage": "https://github.com/ConductionNL/conduction-theme#readme"
}
```

---

### `municipalities/<slug>-design-tokens/style-dictionary.config.js`

```js
const config = require("./src/config.json");
const { createConfig } = require("../../style-dictionary-config");

module.exports = createConfig({
  selector: `.${config.prefix}-theme`,
});
```

---

### `municipalities/<slug>-design-tokens/src/config.json`

Read `conduction-design-tokens/src/config.json`, copy the full `stories` array, and replace only the top-level fields:

```json
{
  "fullName": "<fullName>",
  "name": "<fullName>",
  "prefix": "<slug>",
  "npm": "@conduction/theme",
  "stories": [
    "react-utrecht-alert--default",
    "react-utrecht-alert--warning",
    "react-utrecht-alert--error",
    "react-utrecht-alert--ok",
    "react-utrecht-badge-counter--default",
    "react-utrecht-breadcrumb-nac--default",
    "react-utrecht-breadcrumb-nac--separator",
    "react-utrecht-button--default",
    "react-utrecht-button--hover",
    "react-utrecht-button--primary-action-button",
    "react-utrecht-button--secondary-action-button",
    "react-utrecht-calendar--default",
    "react-utrecht-calendar--limited-range-calendar",
    "react-utrecht-checkbox--default",
    "react-utrecht-checkbox--checked",
    "react-utrecht-checkbox--disabled",
    "react-utrecht-checkbox--checked-and-disabled",
    "react-utrecht-checkbox--hover",
    "react-utrecht-checkbox--focus",
    "react-utrecht-checkbox--focus-visible",
    "react-utrecht-code--default",
    "react-utrecht-code-block--default",
    "react-utrecht-data-badge--default",
    "react-utrecht-document--default",
    "react-utrecht-heading-1--default",
    "react-utrecht-heading-2--default",
    "react-utrecht-heading-3--default",
    "react-utrecht-heading-4--default",
    "react-utrecht-heading-5--default",
    "react-utrecht-link--default",
    "react-utrecht-link--hover",
    "react-utrecht-link--focus",
    "react-utrecht-ordered-list--default",
    "react-utrecht-unordered-list--default",
    "react-utrecht-page--default",
    "react-utrecht-page-header--default",
    "react-utrecht-page-footer--default",
    "react-utrecht-paragraph--default",
    "react-utrecht-radio-button--default",
    "react-utrecht-radio-button--hover",
    "react-utrecht-radio-button--focus",
    "react-utrecht-radio-button--checked",
    "react-utrecht-radio-button--checked-and-disabled",
    "react-utrecht-radio-button--disabled",
    "react-utrecht-separator--default",
    "react-utrecht-skip-link--default",
    "react-utrecht-spotlicht-section--default",
    "react-utrecht-spotlicht-section--info",
    "react-utrecht-spotlicht-section--warning",
    "react-utrecht-surface--default",
    "react-utrecht-table--default",
    "react-utrecht-textbox--default",
    "react-conduction-card-header--default",
    "react-conduction-card-header--hover",
    "react-conduction-card-wrapper--default",
    "react-conduction-card-wrapper--hover",
    "react-conduction-pagination--default",
    "react-conduction-input-select--default",
    "react-conduction-input-select--list-option",
    "react-conduction-input-select--placeholder",
    "react-conduction-tabs--default",
    "react-conduction-tabs--selected",
    "react-conduction-tabs--hover",
    "react-conduction-tabs--list",
    "react-conduction-tabs--panel"
  ]
}
```

---

### `municipalities/<slug>-design-tokens/src/index.scss`

```scss
/**
 * @license SEE LICENSE.md
 * Copyright (c) 2021 NL Design System Community
 * All rights reserved
 */

@import "./design-tokens.css";
@import "./font.css";
```

---

### `municipalities/<slug>-design-tokens/src/font/` — Download font files

For every font file URL found in Part A (`.woff2`, `.woff`, `.ttf`, `.otf`):

1. Download the file using the Bash tool (`curl -L -o ...`) into `municipalities/<slug>-design-tokens/src/font/`.
2. Use a clean filename: `<FontName>-<weight>.<ext>` (e.g. `RijksoverheidSans-Regular.woff2`, `RijksoverheidSans-Bold.woff2`).
3. If the font is served via Google Fonts CSS (a `<link>` to `fonts.googleapis.com`), fetch that CSS URL with `WebFetch` to get the individual `@font-face` blocks, then download each `.woff2` URL from those blocks.
4. If no font files were found via Part A, try to find them by:
   - Searching for `@font-face` rules in the page's `<style>` tags or linked CSS files using `mcp__browser-{N}__browser_evaluate`
   - Looking up the font name on Google Fonts (`fonts.google.com`) or the font foundry website
   - If found from an external source, download and store them the same way

---

### `municipalities/<slug>-design-tokens/src/font.scss`

Write `@font-face` declarations for every font file downloaded above, referencing the local files with a relative path from `src/` (e.g. `url("font/RijksoverheidSans-Regular.woff2")`). Model the structure after `conduction-design-tokens/src/font.scss`. Include the correct `font-weight` value for each file.

If no font files could be found or downloaded anywhere, leave a placeholder comment:

```scss
/* TODO: Add @font-face declarations for <fontName> */
```

---

### Brand token files

#### `municipalities/<slug>-design-tokens/src/brand/<slug>/color.tokens.json`

Use colors extracted from the website. If not found, use these placeholders:

- primary: `#000000`
- primary-hover: `#333333`

**Always read `conduction-design-tokens/src/brand/conduction/color.tokens.json` first.** Component tokens reference specific named shades by path (e.g. `<slug>.color.grey.82`). If any referenced path is missing the build fails with "Reference doesn't exist". Start with the full conduction baseline below, replacing `conduction` with `<slug>`, then add the organisation's own brand palette groups on top. After all component files are written, scan every `*.tokens.json` for references into `<slug>.color.*` and remove any palette entries that are not referenced by any file.

##### Color naming convention

**Lightness percentage** — The number in a color key represents the HSL lightness of that color. Calculate it with this formula:

```
R, G, B = hex channels / 255
lightness = round( (max(R,G,B) + min(R,G,B)) / 2 × 100 )
```

The extraction script in A2 already returns `lightness` for every color in the `allColors` array — use those values directly.

Examples:
- `#ffffff` (white) = `100`
- `#000000` (black) = `0`
- `#808080` (mid grey) = `50`
- `#e10a17` (bright red) = `44`
- `#012c9d` (dark blue) = `31`

So a color group key like `"31"` means that color sits at 31% on the lightness scale.

**Transparency suffix** — When a color has opacity, append `-{n}t` to the key where `{n}` is the opacity percentage. The hex value gets a 2-digit alpha suffix appended:

| Opacity | Hex suffix                 |
| ------- | -------------------------- |
| 100%    | `FF` (omit — fully opaque) |
| 80%     | `CC`                       |
| 60%     | `99`                       |
| 50%     | `80`                       |
| 10%     | `1A`                       |

Full reference: https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4

Only add transparency variants when they are actually used on the organisation website.

**Color palette ordering inside the `color` object:**
1. Semantic aliases (`primary`, `primary-hover`, `error`, alert variants, etc.)
2. Brand-specific palette groups from the website (e.g. `blue`, `green`, `red`, `yellow`) — ordered lightest group last
3. `grey` (full baseline)
4. `lightgrey` (if present — sits between grey and white)
5. `white` (full baseline)
6. `black` (full baseline)

**Building the brand palette from extracted colors:**

1. Look at `allColors` from A2. Filter out greys (R≈G≈B), white (#ffffff-area), and black (#000000-area).
2. Group the remaining colors by dominant hue: red, blue, green, orange, etc.
3. For each group, create a palette object keyed by lightness percentage.
4. The **primary brand color** (from the design summary) must be in one of these groups.
5. Set `"primary"` to reference that color: `"{<slug>.color.<group>.<lightness>}"`.
6. Set `"primary-hover"` to a darker shade in the same group, or darken by ~10% lightness.

Start with this full baseline (replace `conduction` with `<slug>`), then insert the organisation's own brand palette groups between the semantic aliases and `grey`:

```json
{
  "<slug>": {
    "color": {
      "primary": { "value": "{<slug>.color.<paletteGroup>.<shade>}" },
      "primary-hover": { "value": "{<slug>.color.<paletteGroup>.<darkerShade>}" },
      "error": { "value": "#dc3545" },
      "alert-error": { "value": "#721c24" },
      "alert-error-background": { "value": "#f8d7da" },
      "warning": { "value": "#ffc107" },
      "alert-warning": { "value": "#856404" },
      "alert-warning-background": { "value": "#fff3cd" },
      "succes": { "value": "#28a745" },
      "alert-succes": { "value": "#155724" },
      "alert-succes-background": { "value": "#d4edda" },
      "info": { "value": "{<slug>.color.primary}" },
      "alert-info": { "value": "#004085" },
      "alert-info-background": { "value": "#cce5ff" },
      "grey": {
        "27": { "value": "#444444" },
        "29": { "value": "#4a4a4a" },
        "31": { "value": "#4f4f4f" },
        "46": { "value": "#767676" },
        "48": { "value": "#7a7a7a" },
        "50": { "value": "#808080", "comment": "Base/Grey" },
        "70": { "value": "#b3b3b3" },
        "82": { "value": "#d1d1d1" },
        "87": { "value": "#dddddd" },
        "90": { "value": "#e6e6e6" },
        "95": { "value": "#f2f2f2" },
        "97": { "value": "#f7f7f7" }
      },
      "lightgrey": {
        "96": { "value": "#f5f5f5", "comment": "Base/LightGrey" }
      },
      "white": {
        "98": { "value": "#fafafa" },
        "100": { "value": "#ffffff", "comment": "Base/White" }
      },
      "black": {
        "0": { "value": "#000000", "comment": "Base/Black" },
        "0-60t": { "value": "#00000099", "comment": "Black with 60% transparency" },
        "30": { "value": "#4d4d4d" }
      }
    }
  }
}
```

After all component files are written, scan every `*.tokens.json` for which `<slug>.color.*` paths are actually referenced. Remove any individual shade keys from the palette that are not referenced anywhere. Do not remove semantic aliases (`primary`, `error`, etc.) even if unreferenced.

---

#### `municipalities/<slug>-design-tokens/src/brand/<slug>/font-size.tokens.json`

Set the values based on the computed font sizes extracted from the website. The mapping between font-size keys and components is:

| Key   | Used by component      |
| ----- | ---------------------- |
| `md`  | `paragraph`, `heading-5` — **set to the most-used paragraph font-size on the website** |
| `lg`  | `heading-4`            |
| `xl`  | `heading-3`            |
| `2xl` | `heading-2`            |
| `3xl` | `heading-1`            |

Extract the computed `font-size` of `<p>`, `<h1>`, `<h2>`, `<h3>`, `<h4>` from the website and set the corresponding keys. Convert px values to rem (divide by 16). If you find additional distinct sizes used on the website (e.g. for captions, labels, small text), map them to the nearest smaller key.

**Scale validation** — after assigning all heading sizes, verify that the scale is well-spaced (each step should be meaningfully larger than the previous). If sizes are too close together (e.g. `3xl` = 52px, `2xl` = 50px, `xl` = 38px) this indicates a scale problem — set them to better-distributed values, keep the heading sizes as close as possible to the website, and include a note in the summary telling the user which sizes were adjusted and why.

```json
{
  "<slug>": {
    "font-size": {
      "4xs": { "value": "0.625rem", "comment": "10px" },
      "3xs": { "value": "0.75rem", "comment": "12px" },
      "2xs": { "value": "0.875rem", "comment": "14px" },
      "xs": { "value": "1rem", "comment": "16px" },
      "sm": { "value": "1.125rem", "comment": "18px" },
      "md": { "value": "1.25rem", "comment": "20px" },
      "lg": { "value": "1.5rem", "comment": "24px" },
      "xl": { "value": "1.75rem", "comment": "28px" },
      "2xl": { "value": "2rem", "comment": "32px" },
      "3xl": { "value": "2.5rem", "comment": "40px" },
      "4xl": { "value": "3rem", "comment": "48px" },
      "5xl": { "value": "3.625rem", "comment": "58px" }
    }
  }
}
```

---

#### `municipalities/<slug>-design-tokens/src/brand/<slug>/size.tokens.json`

```json
{
  "<slug>": {
    "size": {
      "4xs": { "value": "1px" },
      "3xs": { "value": "2px" },
      "2xs": { "value": "4px" },
      "xs": { "value": "8px" },
      "sm": { "value": "14px" },
      "md": { "value": "18px" },
      "lg": { "value": "24px" },
      "xl": { "value": "32px" },
      "2xl": { "value": "48px" },
      "3xl": { "value": "72px" },
      "4xl": { "value": "96px" }
    }
  }
}
```

---

#### `municipalities/<slug>-design-tokens/src/brand/<slug>/typography.tokens.json`

Use the font family found on the website, or `Arial, sans-serif` as fallback.
`<fontKey>` = lowercase font name with hyphens (e.g. `open-sans`, `source-sans-pro`).

**`sans-serif` is required** — component tokens (button, paragraph, document, form inputs, etc.) reference `<slug>.typography.sans-serif.font-family`. Set it to the body font of the organisation.

```json
{
  "<slug>": {
    "typography": {
      "<fontKey>": {
        "font-family": {
          "value": "\"<FontName>\", Arial, sans-serif"
        }
      },
      "sans-serif": {
        "font-family": {
          "value": "\"<FontName>\", Arial, sans-serif"
        }
      },
      "monospace": {
        "font-family": {
          "value": "Monospace, \"Lucida Console\""
        }
      },
      "font-weight": {
        "bold": { "value": "700" },
        "semibold": { "value": "600" },
        "normal": { "value": "400" },
        "light": { "value": "100" }
      },
      "scale": {
        "4xs": { "value": "{<slug>.font-size.4xs}" },
        "3xs": { "value": "{<slug>.font-size.3xs}" },
        "2xs": { "value": "{<slug>.font-size.2xs}" },
        "xs": { "value": "{<slug>.font-size.xs}" },
        "sm": { "value": "{<slug>.font-size.sm}" },
        "md": { "value": "{<slug>.font-size.md}" },
        "lg": { "value": "{<slug>.font-size.lg}" },
        "xl": { "value": "{<slug>.font-size.xl}" },
        "2xl": { "value": "{<slug>.font-size.2xl}" },
        "3xl": { "value": "{<slug>.font-size.3xl}" },
        "4xl": { "value": "{<slug>.font-size.4xl}" }
      }
    }
  }
}
```

---

### Common token files

#### `municipalities/<slug>-design-tokens/src/common/utrecht/action.tokens.json`

```json
{
  "utrecht": {
    "action": {
      "busy": { "cursor": { "value": "wait" } },
      "disabled": { "cursor": { "value": "not-allowed" } },
      "submit": { "cursor": { "value": "pointer" } }
    }
  }
}
```

---

#### `municipalities/<slug>-design-tokens/src/common/utrecht/space.tokens.json`

Read `conduction-design-tokens/src/common/utrecht/space.tokens.json` and replace `conduction` with `<slug>`:

```json
{
  "utrecht": {
    "space": {
      "block": {
        "3xs": { "value": "{<slug>.size.3xs}" },
        "2xs": { "value": "{<slug>.size.2xs}" },
        "xs": { "value": "{<slug>.size.xs}" },
        "sm": { "value": "{<slug>.size.sm}" },
        "md": { "value": "{<slug>.size.md}" },
        "lg": { "value": "{<slug>.size.lg}" },
        "xl": { "value": "{<slug>.size.xl}" },
        "2xl": { "value": "{<slug>.size.2xl}" },
        "3xl": { "value": "{<slug>.size.3xl}" }
      },
      "inline": {
        "3xs": { "value": "{<slug>.size.3xs}" },
        "2xs": { "value": "{<slug>.size.2xs}" },
        "xs": { "value": "{<slug>.size.xs}" },
        "sm": { "value": "{<slug>.size.sm}" },
        "md": { "value": "{<slug>.size.md}" },
        "lg": { "value": "{<slug>.size.lg}" },
        "xl": { "value": "{<slug>.size.xl}" },
        "2xl": { "value": "{<slug>.size.2xl}" },
        "3xl": { "value": "{<slug>.size.3xl}" }
      }
    }
  }
}
```

---

### Component token files

For each file listed below: read the source file from `conduction-design-tokens/src/`, write it to the equivalent path under `municipalities/<slug>-design-tokens/src/`, replacing every occurrence of:

- `conduction` → `<slug>`
- `aldritch` → `<fontKey>`

**Preserve indentation exactly** — copy the file contents verbatim and only do text substitutions. Do not reformat, reindent, or restructure the JSON.

**Known reference fix:** The conduction baseline has `{conduction.color.blue.95}` in `calendar.tokens.json` (used for the "today" highlight). After replacement this becomes `{<slug>.color.blue.95}` which will fail if the organisation doesn't have a `blue` palette. **Replace this reference** with `{<slug>.color.grey.95}` (a neutral light highlight) unless the organisation's palette has a light brand color shade that makes more sense.

Create these files:

**`src/component/utrecht/`** (read from conduction and replace prefix):

- `accordion.tokens.json`
- `alert.tokens.json`
- `badge-counter.tokens.json`
- `badge-status.tokens.json`
- `badge.tokens.json`
- `blockquote.tokens.json`
- `breadcrumb.tokens.json`
- `button.tokens.json`
- `calendar.tokens.json`
- `checkbox.tokens.json`
- `code.tokens.json`
- `data-list.tokens.json`
- `document.tokens.json`
- `focus.tokens.json`
- `form-field.tokens.json`
- `form-input.tokens.json`
- `form-label.tokens.json`
- `heading.tokens.json`
- `icon.tokens.json`
- `link.tokens.json`
- `list.tokens.json`
- `page.tokens.json`
- `page-footer.tokens.json`
- `page-header.tokens.json`
- `paragraph.tokens.json`
- `radio-button.tokens.json`
- `select.tokens.json`
- `separator.tokens.json`
- `skip-link.tokens.json`
- `spotlight-section.tokens.json`
- `surface.tokens.json`
- `table.tokens.json`
- `textbox.tokens.json`

**`src/component/utrecht/extra-tokens/`** (read from conduction and replace prefix):

- `accordion.tokens.json`
- `alert.tokens.json`
- `badge-counter.tokens.json`
- `breadcrumb.tokens.json`
- `form-field.tokens.json`
- `form-input.tokens.json`
- `heading.tokens.json`
- `icon.tokens.json`
- `link.tokens.json`
- `page-footer.tokens.json`
- `page-header.tokens.json`
- `radio-button.tokens.json`
- `skip-link.tokens.json`
- `table.tokens.json`
- `textbox.tokens.json`

**`src/component/conduction/`** (read from conduction and replace prefix):

- `card-header.tokens.json`
- `card-wrapper.tokens.json`
- `logo.tokens.json`
- `pagination.tokens.json`
- `select.tokens.json`
- `table-wrapper.tokens.json`
- `tooltip.tokens.json`

---

### Documentation files

#### `municipalities/<slug>-design-tokens/documentation/color.stories.mdx`

```mdx
import { Meta, ColorPalette, ColorItem } from "@storybook/addon-docs";
import tokens from "../dist/tokens.json";
import { ColorSearch } from "@nl-design-system-unstable/theme-toolkit/src/ColorSearch";
import { ColorTable } from "@nl-design-system-unstable/theme-toolkit/src/ColorTable";
import config from "../src/config.json";

<Meta title={`${config.name}/Color`} />

# Color

## Find a color

<ColorSearch tokens={tokens[config.prefix]["color"]}></ColorSearch>

## Color palette

<ColorTable tokens={tokens[config.prefix]["color"]}></ColorTable>
```

#### `municipalities/<slug>-design-tokens/documentation/components.stories.mdx`

Read `conduction-design-tokens/documentation/components.stories.mdx` and copy its content verbatim (it uses `config.json` dynamically).

#### `municipalities/<slug>-design-tokens/documentation/design-tokens.stories.mdx`

Read `conduction-design-tokens/documentation/design-tokens.stories.mdx` and copy its content verbatim.

#### `municipalities/<slug>-design-tokens/documentation/readme.stories.mdx`

Read `conduction-design-tokens/documentation/readme.stories.mdx` and copy its content verbatim.

---

### `municipalities/<slug>-design-tokens/LICENSE.md`

Read `conduction-design-tokens/LICENSE.md` and copy it verbatim.

### `municipalities/<slug>-design-tokens/README.md`

```md
# <fullName> Design Tokens

NL Design System design tokens for <fullName>.

## Usage

Install the package:

\`\`\`sh
npm install <packageName>
\`\`\`

Apply the theme class to your root element:

\`\`\`html
<html class="<slug>-theme">
\`\`\`

## Building

\`\`\`sh
npm run build
\`\`\`
```

---

## Part C — Update component tokens to match the website

This part applies in **both** `new` and `update` modes. In update mode, read the existing token files and update only the values that differ from the extraction.

**Rules:**
- **Only change values you have data for** — if the design summary says "not found — using conduction default", do NOT change that token.
- **Always use palette references** (e.g. `{<slug>.color.red.44}`) rather than hardcoded hex values. If the color is not yet in the palette, add it to `color.tokens.json` first with the correct lightness key.
- **Never empty a token that had a value** — only replace values with different values.

**Use this exact mapping from design summary → token files:**

### `heading.tokens.json`
| Token path | Set to |
|---|---|
| `heading-1.color` | Design summary: **Primary brand color** if headings are colored, or leave empty if black |
| `heading-1.font-family` | `{<slug>.typography.<fontKey>.font-family}` using heading font |
| `heading-1.font-weight` | `{<slug>.typography.font-weight.bold}` or `.semibold` or `.normal` — match **Heading font weight** |
| `heading-2.color` | Same as h1, or different if h2 has a distinct color |
| `heading-2.font-family` | Same as h1 |
| `heading-3.color` | From design summary **H3** — often the primary brand color for links/headings |
| `heading-3.font-family` | Same as h1 (or body font if h3 uses body font) |
| All `heading-*.font-weight` | Match the extracted weight. Map: 300→light, 400→normal, 500/600→semibold, 700→bold |

### `font-size.tokens.json`
| Token key | Set to |
|---|---|
| `md` | **Body font size** (px / 16 = rem) — this is the paragraph/h5 size |
| `lg` | **H4 font size** in rem. If H4 not found, set to midpoint between md and xl |
| `xl` | **H3 font size** in rem |
| `2xl` | **H2 font size** in rem |
| `3xl` | **H1 font size** in rem |
| `4xl` | H1 x 1.25 (for oversized display headings if needed) |

Validate the scale is well-spaced: each step should be >= 20% larger than the previous. Adjust if needed.

### `paragraph.tokens.json`
| Token path | Set to |
|---|---|
| `paragraph.font-weight` | `{<slug>.typography.font-weight.light}` or `.normal` — match **Body font weight** |

### `link.tokens.json`
| Token path | Set to |
|---|---|
| `link.color` | `{<slug>.color.primary}` (which references the brand color) |
| `link.hover.color` | `{<slug>.color.primary-hover}` |

### `page-header.tokens.json`
| Token path | Set to |
|---|---|
| `page-header.background-color` | From **Page header bg**. Use palette ref if a matching color exists |
| `page-header.color` | From **Page header text** |

### `page-footer.tokens.json`
| Token path | Set to |
|---|---|
| `page-footer.background-color` | From **Page footer bg** |
| `page-footer.color` | From **Page footer text** |

### `button.tokens.json`
| Token path | Set to |
|---|---|
| `button.background-color` | From **Button bg** — typically `{<slug>.color.primary}` |
| `button.border-color` | Same as background, or from extraction |
| `button.border-radius` | From **Button border-radius** |
| `button.color` | From **Button text** |
| `button.hover.background-color` | `{<slug>.color.primary-hover}` |
| `button.hover.border-color` | `{<slug>.color.primary-hover}` |

### `textbox.tokens.json`
| Token path | Set to |
|---|---|
| `textbox.border-color` | From **Input border-color** |
| `textbox.border-radius` | From **Input border-radius** |

### `document.tokens.json` and `surface.tokens.json`
| Token path | Set to |
|---|---|
| `document.background-color` | `{<slug>.color.white.100}` or the page's background if not white |
| `surface.background-color` | Same as document |

### `separator.tokens.json`
| Token path | Set to |
|---|---|
| `separator.color` | From **Separator color** |

### `focus.tokens.json`
| Token path | Set to |
|---|---|
| `focus.outline-color` | `{<slug>.color.primary}` (common pattern) or keep default |

### `breadcrumb.tokens.json`
| Token path | Set to |
|---|---|
| `breadcrumb-nav.link.color` | `{<slug>.color.primary}` |
| `breadcrumb-nav.link.hover.color` | `{<slug>.color.primary-hover}` |

**For all other component files** (alert, badge, calendar, checkbox, code, etc.) — leave the conduction defaults with only the prefix replaced. These components are rarely visible on the organisation's public website, so the defaults are acceptable.

---

## Part D — Build and test

### D1 — Build the token set

Run the build:

```sh
cd municipalities/<slug>-design-tokens && npm run build
```

Capture all output. If the build fails:
- Parse every "Reference doesn't exist" error — note the exact token path that is missing
- Check whether the missing token exists in `conduction-design-tokens/src/brand/conduction/color.tokens.json` or another conduction token file
- If it does, add it to the corresponding token file for this organisation
- Retry the build until it succeeds or you have identified all unresolvable errors

### D2 — Test against woo-website-template-apiv2

After a successful build, test the theme against the `woo-website-template-apiv2` repository:

1. Check if `../woo-website-template-apiv2` exists relative to the current repository root. If not, report that the repository was not found at the expected path and skip the remaining steps.
2. If found, check out (or confirm) the `Theme-test-branch` branch in that repository.
3. Install the new package into the template repo (or copy the built dist files from `municipalities/<slug>-design-tokens/dist/`).
4. **Update `pwa/src/styling/index.css`**: Check this file to confirm the theme CSS is imported. If the new theme is not yet imported, add an import for the built CSS file.
5. **Update `pwa/src/layout/head.tsx`**: Update the theme class applied to the root element to use `<slug>-theme` so the new theme is applied.
6. Start the development server or run a build (`npm run build` or `npm run dev`) in the template repository.
7. **Navigate to `/theme`** using Playwright MCP to see all available components rendered with the new theme.
8. Take screenshots of the `/theme` page and each visible component section.
9. Compare the rendered components against the component token files you created. Note any visual discrepancies.

### D3 — Error report

Produce a **detailed error report** with these sections:

#### Build errors
- List every build error with the exact error message and file
- For "Reference doesn't exist" errors: state the missing token path and whether it was fixable
- State whether the build ultimately succeeded or failed

#### Theme integration errors (woo-website-template-apiv2)
- State whether the repository was found and the branch was checked out successfully
- List any errors encountered when updating config files
- List any build or server errors

#### Visual component review (from /theme page)
- For each component visible at `/theme` that is part of the created token set: state whether it looks correct or note the specific visual issue

#### Summary of issues requiring manual attention
- List any colors or fonts that could not be determined and were left as placeholders
- List any build, integration, or visual issues that could not be auto-resolved

---

## Part E — Summary

After creating/updating all files and completing the build and test, output a summary:

1. List all files created or modified
2. Note which colors were extracted from the website (or indicate placeholders were used)
3. Note which font was found (or indicate placeholder was used)
4. State the build result (success / failed with N errors)
5. State the test result against `woo-website-template-apiv2` (success / failed / repo not found)
6. Remind the user to:
   - Verify and refine colors in `src/brand/<slug>/color.tokens.json`
   - Add `@font-face` rules in `src/font.scss` if not auto-generated
   - Add a build script entry in the root `package.json`: `"build:<slug>": "cd ./municipalities/<slug>-design-tokens && npm run build"`
