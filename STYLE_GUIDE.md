# My Future Me - Style Guide

This guide defines the visual direction for `my future me`. If visual guidance elsewhere conflicts with this file, follow this file.

## Design Direction

- **Style**: warm minimalist workspace
- **Theme**: old paper / desk journal
- **Personality**: calm, reflective, grounded, intentional
- **Layout approach**: centered shells, soft panels, low-noise structure

## Core Theme Source

The app theme now lives in one place:

- `styles/theme.css`

Use that file as the single source of truth for:

- raw palette values
- semantic tokens like `--background`, `--card`, `--primary`
- shared surface tokens like `--surface-1`, `--surface-2`
- helper classes like `.paper-shell`, `.paper-panel`, `.paper-kicker`
- compatibility mappings for legacy hardcoded utility colors

If the product theme changes in the future, update `styles/theme.css` first.

## Theme Tokens

### Base palette

| Token | Hex | Usage |
|---|---|---|
| `--paper-1` | `#f6eee3` | main page background |
| `--paper-2` | `#eee7d7` | soft surface |
| `--paper-3` | `#e5decf` | raised soft surface |
| `--paper-4` | `#e5cbba` | accent wash / highlighted surface |
| `--paper-5` | `#d9bda5` | warm emphasis |

### Semantic UI tokens

| Token | Purpose |
|---|---|
| `--background` | full app background |
| `--foreground` | default text color |
| `--card` | main panels/cards |
| `--popover` | menus and overlays |
| `--primary` | primary actions and links |
| `--secondary` | subdued actions and grouped surfaces |
| `--muted` | subtle sections |
| `--accent` | highlighted chips and hover states |
| `--border` | separators and control outlines |
| `--input` | form control background |
| `--ring` | focus state |

### Extended theme tokens

| Token | Purpose |
|---|---|
| `--surface-canvas` | inner work area |
| `--surface-1` | nested panel background |
| `--surface-2` | hover/active surface |
| `--surface-3` | selected surface |
| `--ink-strong` | heading text |
| `--ink-base` | body text |
| `--ink-soft` | muted text |
| `--primary-strong` | primary hover |
| `--primary-soft` | selected highlight wash |
| `--danger-soft` | error background |
| `--hero-wash` | branded hero/panel gradient |

## Core Principles

1. **Paper first**: pages should feel like a refined notebook, not a code editor.
2. **Warm contrast**: use tonal paper steps before adding heavy borders.
3. **One action color**: reserve `--primary` for actions, links, focus, and selected states.
4. **Readable density**: authenticated pages can stay compact, but must remain airy enough on the light theme.
5. **Soft structure**: prefer quiet panels, subtle fills, and minimal outlines.
6. **Theme from tokens**: do not introduce new hex values in components unless they belong in `styles/theme.css`.

## Typography

- **Heading font**: `Space Grotesk`
- **Body font**: `Inter`
- **Editor-like text**: monospaced font for logs, clipboard text, and writing areas
- **Heading feel**: crisp, confident, slightly literary
- **Body feel**: soft but clear, medium line-height

Suggested scale:

- `h1`: `48-64px`, line-height near `1.05`
- `h2`: `32-40px`
- `h3`: `24-32px`
- body large: `18px`
- body: `14-16px`
- compact/editor body: `12-14px`
- caption/meta: `11-12px`

## Layout

- Use centralized page shells with consistent max widths.
- Landing pages should feel editorial and open.
- Dashboard/productivity pages should feel like a light desktop workspace.
- Prefer left-to-right functional structure: navigation, work area, supporting detail.
- Keep sticky bars visually light; they should blend into the paper system.

## Surfaces and Borders

- Default to semantic tokens: `bg-background`, `bg-card`, `bg-secondary`, `border-border`, `text-foreground`, `text-muted-foreground`.
- Use `.paper-panel` for important grouped containers.
- Use `.paper-panel-muted` or `.paper-panel-soft` for nested content blocks.
- Borders should be thin and quiet.
- Avoid black shadows, neon outlines, or dark editor-style contrast.

## Components

### Buttons

- Primary buttons use `--primary` with `--primary-foreground`.
- Outline buttons should still feel like paper objects, not transparent wireframes.
- Ghost buttons are for toolbar and utility actions only.
- Keep radii moderate; avoid overly rounded pills unless the screen already leans playful.

### Cards and Panels

- Use `Card` for true grouped content, not every small block.
- Prefer soft warm panels with light elevation.
- Keep card internals uncluttered and avoid nested border stacks.

### Inputs

- Inputs should use `bg-input`, `border-input`, and semantic text tokens.
- Writing inputs can use `.paper-editor` when they need a stronger notebook feel.
- Focus states should use `--ring`, not raw box-shadows or arbitrary blue values.

### Links

- Links use the primary theme color.
- Prefer `.paper-link` for inline custom links outside shared components.

## Motion

- Keep transitions subtle and short (`150-220ms`).
- Motion should support clarity, not decoration.
- Avoid constant animation loops outside meaningful feedback states.

## How to Apply Theme in Code

### Preferred order

1. Use semantic Tailwind tokens already exposed in `styles/globals.css`
2. Use shared helper classes from `styles/theme.css`
3. Add or extend tokens in `styles/theme.css` if the design needs a new reusable value

### Good examples

- `bg-background text-foreground border-border`
- `bg-card text-card-foreground`
- `text-muted-foreground`
- `className="paper-panel rounded-xl p-6"`
- `className="paper-kicker inline-flex rounded-md px-3 py-1"`

### Avoid

- new hardcoded hex colors in page files
- one-off dark theme colors like `#1e1e1e`, `#252526`, `#007acc`
- ad hoc gradients defined inline unless they are being promoted into `styles/theme.css`

## Migration Note

The project still contains older hardcoded utility classes in some files. `styles/theme.css` includes a compatibility layer that remaps many of those values to the paper theme.

When touching older screens:

1. replace hardcoded arbitrary color classes with semantic tokens
2. prefer shared helper classes over inline color values
3. remove no-longer-needed compatibility mappings only after the screen is fully migrated

## Accessibility

- Aim for WCAG AA contrast for text and controls.
- Preserve visible focus states for keyboard users.
- Keep touch targets at least `40x40px` unless a dense desktop-only control is clearly justified.
- Warm neutrals should not reduce readability; adjust text contrast before adding decoration.

## Do / Don't

### Do

- use the old-paper palette consistently
- build hierarchy with tone, spacing, and typography
- keep interfaces responsive and centered
- let productivity pages feel tactile, calm, and practical

### Don't

- don't add random new brand colors in page files
- don't revert to dark editor surfaces unless the theme file changes
- don't use heavy glassmorphism, deep black shadows, or neon accents
- don't scatter theme decisions across multiple files

## Implementation Notes

- Update `styles/theme.css` first for any future theme change.
- Keep `styles/globals.css` focused on exposing tokens to Tailwind and setting base defaults.
- If a component needs a new reusable visual treatment, add a semantic token or helper class instead of another hardcoded color.
