Create a new municipality design token set for: $ARGUMENTS

## Instructions

Parse `$ARGUMENTS` to extract:
- **Municipality name** (e.g. "Utrecht", "Den Haag", "Gouda") — required
- **Website URL** (e.g. "https://www.utrecht.nl/") — optional, extract from the argument if present

Derive the following from the municipality name:
- **slug**: lowercase, spaces replaced with hyphens (e.g. "den-haag", "gouda")
- **prefix**: same as slug (e.g. "den-haag", "gouda")
- **fullName**: the proper name (e.g. "Den Haag", "Gouda")
- **packageName**: `@nl-design-system-unstable/<slug>-design-tokens`
- **folderName**: `municipalities/<slug>-design-tokens`

> **Notation convention used in this file:**
> - `<slug>`, `<fullName>`, `<fontKey>` etc. in angle brackets = **template variables** — substitute with the actual derived value before writing the file
> - `{token.reference}` in curly braces = **Style Dictionary token references** — write literally into the output file (after substituting any `<angle-bracket>` parts inside them)
> - Example: `"{<slug>.size.xs}"` → written as `"{gouda.size.xs}"` in the output file for municipality "Gouda"

## Step 1 — Extract design info from the website

If a website URL was provided, use `WebFetch` to fetch the page HTML/CSS and look for:
- Primary brand colors (hex values, CSS custom properties)
- Body and heading font families (Google Fonts or other web fonts)
- Any secondary/accent colors

If no URL was provided, use placeholder values (noted below) and inform the user they should update the color and font values.

## Step 2 — Create all files

Create the full directory structure at `municipalities/<slug>-design-tokens/` modeled on `conduction-design-tokens/`. Create every file listed below.

---

### `municipalities/<slug>-design-tokens/package.json`

```json
{
  "version": "1.0.0-alpha.1",
  "author": "Community for NL Design System",
  "description": "NL Design System design tokens for Gemeente <fullName>",
  "website": "<websiteUrl>",
  "keywords": [
    "nl-design-system",
    "conduction"
  ],
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

### `municipalities/<slug>-design-tokens/src/font.scss`

If you found a Google Font, add the appropriate `@font-face` declarations.
If not found, leave a placeholder comment:

```scss
/* TODO: Add @font-face declarations for <fontName> */
```

---

### `municipalities/<slug>-design-tokens/src/brand/<slug>/color.tokens.json`

Use colors extracted from the website. If not found, use these placeholders:
- primary: `#000000`
- primary-hover: `#333333`

Model the structure after `conduction-design-tokens/src/brand/conduction/color.tokens.json` — include semantic aliases (primary, primary-hover, error, warning, success, info, alert variants) plus named palette groups (e.g. blue, grey, white, black).

#### Color naming convention

**Lightness percentage** — The number in a color key represents the lightness/darkness of that color as determined by the [W3Schools color picker](https://www.w3schools.com/colors/colors_picker.asp). Enter the hex value and read the percentage from the Lighter/Darker scale:
- `#ffffff` (white) = `100`
- `#000000` (black) = `0`
- `#808080` (mid grey) = `50`
- `#012c9d` (dark blue) = `31`

So a color group key like `"31"` means that color sits at 31% on the lightness scale.

**Transparency suffix** — When a color has opacity, append `-{n}t` to the key where `{n}` is the opacity percentage. The hex value gets a 2-digit alpha suffix appended:

| Opacity | Hex suffix |
|---------|-----------|
| 100%    | `FF` (omit — fully opaque) |
| 80%     | `CC` |
| 60%     | `99` |
| 50%     | `80` |
| 10%     | `1A` |

Full reference: https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4

Example: `#012c9d` at 10% opacity → key `"31-10t"`, value `"#012c9d1a"`

Only add transparency variants when they are actually used on the municipality website.

Example structure (adapt colors from website):
```json
{
  "<slug>": {
    "color": {
      "primary": { "value": "{<slug>.color.<paletteGroup>.<shade>}" },
      "primary-hover": { "value": "{<slug>.color.<paletteGroup>.<darkerShade>}" },
      "error": { "value": "#dc3545" },
      "alert-error": { "value": "{<slug>.color.white.100}" },
      "alert-error-background": { "value": "{<slug>.color.red.51}" },
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
        "50": {
          "value": "#808080",
          "comment": "Base/Grey"
        },
        "90": {
          "value": "#e6e6e6"
        },
        "95": {
          "value": "#f2f2f2"
        }
      },
      "white": {
        "100": {
          "value": "#ffffff",
          "comment": "Base/White"
        }
      },
      "black": {
        "0": {
          "value": "#000000",
          "comment": "Base/Black"
        }
      }
    }
  }
}
```

Add the actual brand color palettes found on the website as named groups.

---

### `municipalities/<slug>-design-tokens/src/brand/<slug>/font-size.tokens.json`

```json
{
  "<slug>": {
    "font-size": {
      "4xs": { 
        "value": "0.625rem", 
        "comment": "10px"
      },
      "3xs": { 
        "value": "0.75rem", 
        "comment": "12px"
      },
      "2xs": { 
        "value": "0.875rem", 
        "comment": "14px"
      },
      "xs": { 
        "value": "1rem", 
        "comment": "16px"
      },
      "sm": { 
        "value": "1.125rem", 
        "comment": "18px"
      },
      "md": { 
        "value": "1.25rem", 
        "comment": "20px"
      },
      "lg": { 
        "value": "1.5rem", 
        "comment": "24px"
      },
      "xl": { 
        "value": "1.75rem", 
        "comment": "28px"
      },
      "2xl": { 
        "value": "2rem", 
        "comment": "32px"
      },
      "3xl": { 
        "value": "2.5rem", 
        "comment": "40px"
      },
      "4xl": { 
        "value": "3rem", 
        "comment": "48px"
      },
      "5xl": { 
        "value": "3.625rem", 
        "comment": "58px"
      }
    }
  }
}
```

---

### `municipalities/<slug>-design-tokens/src/brand/<slug>/size.tokens.json`

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

### `municipalities/<slug>-design-tokens/src/brand/<slug>/typography.tokens.json`

Use the font family found on the website, or `Arial, sans-serif` as fallback.
`<fontKey>` = lowercase font name with hyphens (e.g. `open-sans`, `source-sans-pro`).

```json
{
  "<slug>": {
    "typography": {
      "<fontKey>": {
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

### `municipalities/<slug>-design-tokens/src/common/utrecht/action.tokens.json`

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

### `municipalities/<slug>-design-tokens/src/common/utrecht/space.tokens.json`

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

### `municipalities/<slug>-design-tokens/documentation/color.stories.mdx`

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

---

### `municipalities/<slug>-design-tokens/documentation/components.stories.mdx`

Read `conduction-design-tokens/documentation/components.stories.mdx` and copy its content verbatim (it uses `config.json` dynamically).

---

### `municipalities/<slug>-design-tokens/documentation/design-tokens.stories.mdx`

Read `conduction-design-tokens/documentation/design-tokens.stories.mdx` and copy its content verbatim.

---

### `municipalities/<slug>-design-tokens/documentation/readme.stories.mdx`

Read `conduction-design-tokens/documentation/readme.stories.mdx` and copy its content verbatim.

---

### `municipalities/<slug>-design-tokens/LICENSE.md`

Read `conduction-design-tokens/LICENSE.md` and copy it verbatim.

---

### `municipalities/<slug>-design-tokens/README.md`

```md
# <fullName> Design Tokens

NL Design System design tokens for Gemeente <fullName>.

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

## Step 3 — Summary

After creating all files, output a summary:
1. List all files created
2. Note which colors were extracted from the website (or indicate placeholders were used)
3. Note which font was found (or indicate placeholder was used)
4. Remind the user to:
   - Verify and refine colors in `src/brand/<slug>/color.tokens.json`
   - Add `@font-face` rules in `src/font.scss` if not auto-generated
   - Add a build script entry in the root `package.json`: `"build:<slug>": "cd ./municipalities/<slug>-design-tokens && npm run build"`
