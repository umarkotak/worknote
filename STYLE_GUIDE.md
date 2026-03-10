# My Future Me - Style Guide

This guide defines the visual direction for `my future me` so future UI changes stay consistent. It merges the current product direction with the newer worklog UI rules. When older guidance conflicts with this document, follow this file.

## Design Direction

- **Style**: Modern minimalist, editor-inspired
- **Theme**: VS Code Dark Modern-inspired
- **Personality**: Calm, focused, intentional
- **Layout approach**: Compact, clear hierarchy, low visual noise

## Core Principles

1. **Content first**: Prioritize clarity over decoration.
2. **One primary accent**: Use blue for primary actions, focus, selection, and save-related feedback.
3. **Low-contrast surfaces**: Build separation with subtle tonal steps, not boxes everywhere.
4. **Meaningful color use**: Reserve green/orange for status and supportive highlights.
5. **Compact rhythm**: Keep spacing tight, useful, and consistent.
6. **Editor feel**: Prefer flat rows, direct editing, and practical interaction patterns over dashboard chrome.

## Color Tokens

Use these as baseline tokens:

| Token | Hex | Usage |
|---|---|---|
| `bg.base` | `#1e1e1e` | Main app/page background |
| `bg.canvas` | `#1b1b1d` | Main working canvas |
| `bg.surface` | `#252526` | Secondary surfaces where needed |
| `bg.surfaceAlt` | `#2d2d30` | Hover states and active surfaces |
| `border.default` | `#3c3c3c` | Rare major separations only |
| `text.primary` | `#d4d4d4` | Main text |
| `text.heading` | `#f3f3f3` | Headings and emphasized text |
| `text.muted` | `#9da1a6` | Supporting text |
| `accent.primary` | `#007acc` | Primary buttons/links/focus |
| `accent.primaryHover` | `#0e639c` | Primary hover |
| `accent.info` | `#9cdcfe` | Informational highlight |
| `accent.success` | `#4ec9b0` | Positive/supportive markers |
| `accent.warm` | `#ce9178` | Secondary warm highlight |

## Typography

- **Heading font**: `Space Grotesk`
- **Body font**: `Inter`
- **Editing surfaces**: monospaced textareas for logs, notes, and editor-like inputs
- **Heading feel**: Tight, confident, short lines
- **Body feel**: Clean, readable, medium line-height

Suggested scale:

- `h1`: 48-64px, line-height near `1.05`
- `h2`: 32-40px
- `h3`: 24-32px
- body large: 18px
- body: 14-16px
- compact/editor body: 12-14px
- caption/meta: 11-12px

## Spacing and Shape

- Use a 4px spacing rhythm (`4, 8, 12, 16, 24, 32...`).
- Prefer compact spacing over generous spacing in productivity surfaces.
- Avoid deep nesting, oversized wrappers, and large padding blocks.
- Avoid rounded components as a default. Use square or near-square edges for editor-like interfaces.
- Add end padding to scroll areas so the final item never sits flush against the viewport edge.

## Layout

- Use a three-part structure when space allows: navigation rail, main canvas, and contextual detail panel.
- Keep the main composer anchored to the bottom when writing is the primary action.
- Sticky section headers should sit flush with the scroll flow and not create awkward top gaps.
- Prefer flat grouped sections over stacked card grids in productivity views.
- For new authenticated productivity pages, use `pages/a/worklogs.js` as the primary layout reference before inventing a new shell.

## Components

### Buttons

- Primary: filled `accent.primary` with white text.
- Secondary: minimal ghost or low-contrast surface treatment.
- Height target: `40-44px` for primary interactions, smaller only in dense tool surfaces.
- Avoid decorative shapes and overly rounded pills unless the existing page already uses them.

### Cards and Panels

- Do not default to cards for every piece of content.
- Use panels only when a real structural separation is needed.
- Prefer background tone changes over visible outlines.
- Avoid heavy shadows, glow, and glassy blur-heavy layers.

### Links

- Standard link color: `accent.info`
- Hover: slightly brighter tint
- Underlines optional; prioritize clarity and affordance

### Editor-like Inputs

- Use monospaced textareas for logs and writing-focused input.
- Auto-grow textareas until a sensible max height, then scroll internally.
- In writing flows, `Enter` should create a newline and explicit modified shortcuts such as `Shift+Enter` can submit.
- Show save feedback quietly and close to the edited content.
- For selected rows or focused writing items, use a subtle active cue such as a slight surface lift or a thin accent edge, not a heavy outline.

## Navigation

- Provide quick jump navigation for dense content when it improves scanning.
- Collapsible sidebar groups should feel compact and direct, like dropdown sections.
- Re-selecting the current item should not trigger unnecessary refreshes or visual churn.

## Borders and Surfaces

- Do not stack borders on nested containers.
- Use borders only for major app-level separation when tonal contrast is not enough.
- Within main working areas, prefer flat background transitions over boxes, cards, or outlined panels.
- Reduce container count before adding another visual boundary.

## Motion

- Keep motion subtle and sparse.
- Use short transitions (`150-250ms`) for hover/focus.
- Prefer smooth scrolling, small hover shifts, and minimal save spinners.
- Avoid continuous decorative animations unless they add meaning.

## Homepage Pattern

The homepage should retain this structure:

1. **Minimal top nav** with app name and one primary CTA
2. **Hero** with concise promise and two clear actions
3. **Feature grid** (3 cards): Daily Log, Job Hunting Tracker, My Journal
4. **Closing CTA** reinforcing daily consistency
5. **Compact footer** with one-line brand statement

## Do / Don't

### Do

- Use dark neutral surfaces with careful contrast.
- Keep copy short, practical, and motivating.
- Keep pages responsive from mobile first.
- Make productivity pages feel direct, compact, and easy to scan.

### Don't

- Don't introduce bright gradients across core surfaces.
- Don't mix many accent colors for primary actions.
- Don't use oversized shadows, glassy blur-heavy layers, or visual clutter.
- Don't rely on borders, rounded cards, and extra containers to create structure.

## Accessibility

- Aim for WCAG AA contrast for text and controls.
- Preserve visible focus states for keyboard users.
- Keep touch targets at least `40x40px` unless a dense desktop-only control is clearly justified.

## Worklog-Specific Notes

- Daily logs are directly editable in place.
- Auto-save after a short idle period.
- Avoid edit/delete chrome for routine writing actions unless there is a strong product reason.
- Logs should read like an editor list, not a stack of cards.
- Monthly bars should remain sticky and flush to the top.
- A clicked daily log should keep a quiet persistent active state so the current writing target is easy to track.

## Productivity Page Pattern

- Clipboard, notes, and similar utility pages should inherit the same feel as worklogs: compact, dense, and editor-like.
- Avoid framed hero sections, rounded card stacks, and decorative panel borders on authenticated tool pages.
- Use minimal outer padding (`px-2` / `pb-2`) and let tonal surface shifts create structure.
- Prefer side lists, inline editing, bottom composers, and quiet autosave/status feedback over modal-heavy flows.

## Implementation Notes

- For new pages, start from these tokens and rules and only extend if needed.
- If a page already has an established visual language, preserve that language unless the redesign is intentional.
- If the design direction changes later, update this document first before broad UI refactors.
