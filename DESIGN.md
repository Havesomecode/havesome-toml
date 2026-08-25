---
version: alpha
name: TOML Tactile Learning Lab
description: A warm, structural, playful design system for learning TOML by manipulating its parts and observing immediate consequences.
colors:
  primary: "#1E4D3C"
  secondary: "#963F2B"
  tertiary: "#28577A"
  neutral: "#FBF7EE"
  paper-0: "#FFFFFF"
  paper-50: "#FBF7EE"
  paper-100: "#F3EBDD"
  paper-200: "#E4D8C5"
  paper-300: "#CCBFA9"
  ink-950: "#141814"
  ink-900: "#1D211C"
  ink-700: "#3D453C"
  ink-600: "#586157"
  forest-900: "#173D30"
  forest-800: "#1E4D3C"
  forest-700: "#28624D"
  forest-200: "#B9D8C8"
  forest-100: "#D9E9DF"
  clay-800: "#7D3324"
  clay-700: "#963F2B"
  clay-200: "#E7BFB2"
  clay-100: "#F2D8CF"
  blue-800: "#224A69"
  blue-700: "#28577A"
  blue-100: "#D9E8F2"
  amber-800: "#704800"
  amber-100: "#F6E5B8"
  red-800: "#852626"
  red-100: "#F4D6D3"
  bg: "{colors.paper-50}"
  surface: "{colors.paper-0}"
  surface-raised: "{colors.paper-0}"
  surface-recessed: "{colors.paper-100}"
  fg: "{colors.ink-900}"
  muted: "{colors.ink-600}"
  border: "{colors.paper-300}"
  control-border: "{colors.ink-600}"
  accent: "{colors.forest-800}"
  accent-hover: "{colors.forest-900}"
  accent-soft: "{colors.forest-100}"
  action-secondary: "{colors.clay-700}"
  action-secondary-hover: "{colors.clay-800}"
  action-secondary-soft: "{colors.clay-100}"
  info: "{colors.blue-700}"
  info-soft: "{colors.blue-100}"
  success: "{colors.forest-800}"
  success-soft: "{colors.forest-100}"
  warning: "{colors.amber-800}"
  warning-soft: "{colors.amber-100}"
  error: "{colors.red-800}"
  error-soft: "{colors.red-100}"
  focus-ring: "{colors.blue-700}"
  selection: "{colors.forest-200}"
  code-bg: "{colors.ink-950}"
  code-fg: "#F6F0E6"
  code-muted: "#B7C1B5"
  dark-bg: "#141814"
  dark-surface: "#1D241F"
  dark-surface-recessed: "#263029"
  dark-fg: "#F6F0E6"
  dark-muted: "#B7C1B5"
  dark-border: "#3B473E"
  dark-accent: "#8BCDB0"
  dark-accent-soft: "#294A3B"
  dark-info: "#9AC9E8"
  dark-success: "#8BCDB0"
  dark-warning: "#F2C66D"
  dark-error: "#F2A19A"
  dark-focus-ring: "#9AC9E8"
  dark-control-border: "#B7C1B5"
typography:
  display-xl:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: 56px
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: -0.035em
  display-lg:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: 44px
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: -0.025em
  heading-lg:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.015em
  heading-md:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.01em
  heading-sm:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: 0em
  body-lg:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0em
  body-md:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0em
  body-sm:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0em
  label-md:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0.01em
  label-sm:
    fontFamily: "Atkinson Hyperlegible Next, Atkinson Hyperlegible, system-ui, sans-serif"
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: 0.035em
  code-md:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: 15px
    fontWeight: 450
    lineHeight: 1.6
    letterSpacing: 0em
    fontFeature: "'liga' 0, 'calt' 0, 'zero' 1"
  code-sm:
    fontFamily: "IBM Plex Mono, ui-monospace, SFMono-Regular, Consolas, monospace"
    fontSize: 13px
    fontWeight: 450
    lineHeight: 1.5
    letterSpacing: 0em
    fontFeature: "'liga' 0, 'calt' 0, 'zero' 1"
rounded:
  none: 0px
  xs: 3px
  sm: 6px
  md: 10px
  lg: 16px
  pill: 999px
spacing:
  zero: 0px
  hairline: 1px
  "1": 4px
  "2": 8px
  "3": 12px
  "4": 16px
  "5": 20px
  "6": 24px
  "8": 32px
  "10": 40px
  "12": 48px
  "16": 64px
  "20": 80px
  "24": 96px
  touch-min: 44px
  content-max: 1280px
  reading-max: 680px
  code-min: 320px
  rail-width: 248px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper-0}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.paper-0}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  button-secondary-hover:
    backgroundColor: "{colors.surface-recessed}"
    textColor: "{colors.fg}"
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "{colors.paper-0}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  tab:
    backgroundColor: "{colors.surface-recessed}"
    textColor: "{colors.fg}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  tab-active:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper-0}"
  type-chip:
    backgroundColor: "{colors.info-soft}"
    textColor: "{colors.blue-800}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.pill}"
    padding: 8px
    height: 28px
  status-success:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.forest-900}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  status-warning:
    backgroundColor: "{colors.warning-soft}"
    textColor: "{colors.amber-800}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  status-error:
    backgroundColor: "{colors.error-soft}"
    textColor: "{colors.red-800}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 12px
  work-tray:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: 24px
  rail:
    backgroundColor: "{colors.surface-recessed}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: 16px
    width: 248px
  code-editor:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.code-fg}"
    typography: "{typography.code-md}"
    rounded: "{rounded.sm}"
    padding: 16px
  terminal:
    backgroundColor: "{colors.code-bg}"
    textColor: "{colors.code-fg}"
    typography: "{typography.code-md}"
    rounded: "{rounded.sm}"
    padding: 16px
  field-tile:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.sm}"
    padding: 12px
    height: 44px
  field-tile-selected:
    backgroundColor: "{colors.selection}"
    textColor: "{colors.forest-900}"
  schema-node:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    typography: "{typography.code-sm}"
    rounded: "{rounded.md}"
    padding: 12px
    size: 44px
  hint-chip:
    backgroundColor: "{colors.action-secondary-soft}"
    textColor: "{colors.clay-800}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: 8px
    height: 32px
  progress-step:
    backgroundColor: "{colors.surface-recessed}"
    textColor: "{colors.muted}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    size: 32px
  progress-step-complete:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper-0}"
---

# TOML Tactile Learning Lab Design System

## Overview

TOML Tactile Learning Lab is a small, multi-page learning journey for people who want to understand TOML by handling it. The identity is **authored, warm, structural, and lightly playful**. It must feel like a workbench with parts that fit together—not a generic SaaS dashboard, documentation portal, or wall of terminal cards.

The core metaphor is physical structure. Keys and values are tiles. Tables are trays. Array order runs on rails. Dotted paths form connected branches. Schemas are fitted gauges. The terminal is one instrument in the workshop, never the visual theme for the whole product.

Five rules define the visual language:

1. **Show relationships, not decoration.** Lines, brackets, rails, nesting offsets, and aligned edges reveal TOML structure.
2. **One workbench per lesson.** Each page centers one manipulable specimen with support material arranged around it.
3. **Paper outside, ink inside.** Warm light surfaces hold dark code instruments; neither becomes a repeated card pattern.
4. **Tactility comes from fit and response.** Snapping, insertion markers, pressed states, and small depth changes communicate handling.
5. **Playful means legible consequences.** Motion and color explain cause and effect; they do not celebrate every click.

The interface is concise by contract. It uses short prompts, labels, code, examples, and immediate feedback. It does not place essay-style teaching copy in the product.

## Colors

The canonical tokens are in the frontmatter. Primitive ramps describe materials; semantic aliases describe use.

### Primitive palette

- **Paper:** `paper-0` through `paper-300` create page, tray, seam, and edge layers. Paper is warm, never beige for nostalgia's sake.
- **Ink:** `ink-950` through `ink-600` carry code, text, and secondary text. Avoid pure black.
- **Forest:** the primary structural color. Use for the current path, valid connections, selected structure, and the single primary action.
- **Clay:** the tactile secondary accent. Use for movable affordances, hints, and repair emphasis. It must not compete with the primary action.
- **Blue, amber, red:** semantic-only families for information, warning, and error. Do not use them as decoration or lesson identity colors.

### Light semantics

- Page: `bg`; active work surfaces: `surface`; sockets, gutters, and inactive tracks: `surface-recessed`.
- Primary text: `fg`; secondary text: `muted`; separators: `border`.
- Main action and current structural relationship: `accent`; its hover pair: `accent-hover`.
- The selection fill is `selection`, always paired with `forest-900` text.
- Code and terminal surfaces use `code-bg`, `code-fg`, and `code-muted`.
- Success, warning, error, and information use both a strong token and a soft background token. Never communicate status by color alone.

### Optional dark semantics

Dark mode is an optional reading and workbench surface, not a neon terminal theme. Bind `dark-bg`, `dark-surface`, `dark-surface-recessed`, `dark-fg`, `dark-muted`, and `dark-border`. Use the light-valued `dark-accent`, `dark-info`, `dark-success`, `dark-warning`, and `dark-error` for text and indicators. Dark surfaces preserve the paper hierarchy through luminance steps rather than texture overlays.

### Contrast contract

- Normal text and state messages target at least **4.5:1** against their actual background; large text and icons target at least **3:1**.
- Focus rings target at least 3:1 against adjacent colors and use a 2px outer gap. Light surfaces use `focus-ring`; dark surfaces use `dark-focus-ring`.
- Every status includes text or an icon with an accessible name. Red, amber, green, and blue never carry meaning alone.
- Hover and active states change both foreground and background when inversion is used; they never weaken text contrast.
- `muted` is for secondary information, never required instructions, errors, placeholders standing in for labels, or disabled text that still must be read.

## Typography

Typography balances an editorial learning voice with tool-like precision.

- **Display and lesson headings:** Newsreader. Its compact serif forms bring human authorship to orientation and milestones. Use only for page titles and section landmarks, never inside editors or dense controls.
- **Body and interface:** Atkinson Hyperlegible Next. It carries prompts, controls, feedback, navigation, and accessible instructions.
- **Code and structured values:** IBM Plex Mono with programming ligatures disabled. Use tabular numerals where dates, offsets, indexes, or line numbers align.

The frontmatter scale is normative. On small viewports, `display-xl` may fluidly reduce to 40px and `display-lg` to 34px; body and code never fall below 16px and 14px respectively for primary working content. Maintain a 45–75 character readable line for prompts. Code lines may scroll within the editor only when wrapping would alter meaning; the page itself must never scroll horizontally.

Use sentence case. Avoid all-caps except optional 11–12px category labels with real letter spacing and no instructional meaning. Do not use font weight alone to indicate state.

## Layout

### Workbench model

The desktop shell uses three structural zones rather than equal cards:

1. A narrow **Journey Rail** for milestone position and resumable status.
2. A dominant **Work Tray** for direct manipulation.
3. A contextual **Inspector Strip** for parsed output, type, schema, tests, or concise feedback.

At 1180px and above, use a 12-column grid inside `content-max`: rail 2 columns, work tray 6–7, inspector 3–4. The work tray gets at least 55% of usable width. Between 768px and 1179px, collapse the journey rail into a horizontal milestone control and keep work/inspector as an adjustable 7/5 split when space permits. Below 768px, use one column in task order: prompt, manipulator, immediate feedback, contextual structure, navigation.

### Physical relationships

- Use shared edges, nesting offsets, brackets, sockets, and connector lines to show containment and equivalence.
- A tray may contain tiles; a tile must not be wrapped in another decorative card unless that boundary carries meaning.
- Keep controls adjacent to the object they change. Global controls belong in the lesson header or footer rail.
- Preserve a visible insertion target during reorder and grouping operations.
- Use whitespace as open work surface. Avoid repetitive card grids and repeated terminal panels.

### Spacing and density

The 4px base scale is strict. Standard control gaps are 8px; tile gaps 8–12px; tray padding 16–24px; major zones 32–48px. Minimum interactive size is `touch-min`. Dense code gutters may use 32px row height only when the entire row is not itself a touch target.

### Responsive behavior

- **360–479px:** single work stream; hide no required action. Replace drag-only actions with Move mode, Up/Down controls, or destination menus. Pin at most one action bar and keep it clear of the software keyboard.
- **480–767px:** single column with side-by-side key/value fields only when each retains 140px minimum width.
- **768–1179px:** two working panes; inspector may collapse to a labeled drawer that preserves focus and announcement order.
- **1180px and above:** three-zone workbench; cap the canvas at 1280px and center it.
- Long TOML paths wrap at dots outside editors. Inside editors, preserve code semantics and provide local horizontal scrolling with a visible edge cue.
- Reflow must preserve source order: objective → task → action → feedback → supporting structure → next step.

## Elevation & Depth

Depth represents manipulability and temporary layering, never prestige.

- **Flat/base:** background, rails, schemas, and inactive trays use borders and tonal contrast only.
- **Resting movable tile:** `0 1px 0 rgba(20, 24, 20, 0.18), 0 2px 5px rgba(20, 24, 20, 0.08)`.
- **Raised/dragging tile:** `0 8px 20px rgba(20, 24, 20, 0.16)` plus a 1px forest outline. Scale is limited to 1.015.
- **Overlay/drawer:** `0 16px 40px rgba(20, 24, 20, 0.20)` with a backdrop that keeps underlying context perceptible.
- **Pressed:** remove the resting shadow and translate 1px toward the surface.

Borders carry most hierarchy: 1px standard, 2px selected/focus-adjacent, and 3px only for a current drop socket. Passive seams use `border` or `dark-border`. Interactive boundaries use `control-border` or `dark-control-border` and maintain at least 3:1 against adjacent surfaces. Do not apply shadows to every tray or panel.

Motion confirms structure:

- Micro state change: 120ms; tray or inspector transition: 180ms; reorder/snap: 220ms.
- Easing: `cubic-bezier(0.2, 0.8, 0.2, 1)` for placement; `cubic-bezier(0.4, 0, 0.2, 1)` for simple state changes.
- Animate opacity and transform; connector paths may draw once to reveal a new relationship.
- No loops, confetti, bounce, physics wobble, or motion longer than 300ms.
- Under `prefers-reduced-motion: reduce`, remove travel and connector drawing. Use instant placement, a border change, and concise live-region feedback.

## Shapes

The system mixes precise construction with touchable edges.

- Trays, editors, terminals, and structural panels use `rounded.md`.
- Buttons, tabs, inputs, and tiles use `rounded.sm`.
- Chips and compact status counters use `rounded.pill`.
- Nesting wells and insertion slots may use `rounded.xs` to feel fitted.
- Connector endpoints may be circular, but decorative bubbles are not part of the language.

Use one decisive flourish: **registration marks**—short clay corner ticks on the active work tray that suggest an authored specimen sheet. They appear once per lesson view and never animate.

## Components

### Application shell

- **Lesson Header:** breadcrumb or milestone label, concise title, progress fraction, and one optional utility action. No duplicate primary CTA.
- **Journey Rail:** ordered milestones with current, completed, available, and locked states. Completed steps show both a check symbol and “Complete” in the accessible name.
- **Workbench:** the semantic main region containing one Work Tray and one Inspector Strip.
- **Lesson Footer Rail:** Back, Reset/Undo access, and one primary Next/Check action. On mobile it becomes a non-obscuring action row.

### Interactive module anatomy

Every learning module uses this anatomy in DOM and visual order:

1. **Objective Tag:** one short outcome, not an explanation.
2. **Task Prompt:** one action sentence.
3. **Specimen:** editable TOML, tiles, nodes, terminal, schema, or project goal.
4. **Affordance Layer:** handles, sockets, insertion markers, connectors, line focus, and keyboard alternatives.
5. **Immediate Feedback Strip:** nearest actionable consequence with status and path/line target.
6. **Structure Inspector:** parsed tree, type readout, serialization, schema result, or test status.
7. **Recovery Row:** Undo, Reset, and progressive Hint.
8. **Completion Gate:** explicit success condition and next step.

Feedback appears next to the affected object and is mirrored in the Feedback Strip. Never replace the learner's work without consent.

### Named components

- **Work Tray:** the dominant manipulation surface; never one of many equal cards.
- **Code Bench:** editable TOML with line numbers, syntax roles, error targeting, and a paired parsed view.
- **Terminal Bench:** believable command prompt and concise output. It uses the same dark instrument surface as Code Bench but appears only in workflow lessons.
- **Field Tile:** a movable key/value unit with a drag handle, type chip, accessible position, and selected state.
- **Table Tray:** a named grouping well with header syntax and an ordered contents rail.
- **Array Rail:** an ordered track with numbered stops, insertion markers, and Add/Remove controls.
- **Node Board:** connected key/path nodes for dotted keys and nesting equivalence.
- **Schema Gauge:** schema path, expected constraint, actual value, and pass/fail fit.
- **Type Chip:** compact, non-color-only value type label such as `string`, `integer`, or `offset date-time`.
- **Parse Mirror:** read-only structural result that updates after valid input and preserves the last valid result during recoverable syntax errors with a “Stale” label.
- **Feedback Strip:** `polite` live status for normal edits; assertive only for blocking destructive or session-loss events.
- **Hint Chip:** reveals one bounded clue at a time. It never opens a paragraph.
- **Progress Notch:** persistent milestone and lesson state in the Journey Rail.
- **Insertion Socket:** visible drop destination with label and keyboard target.
- **Connection Port:** endpoint for a schema or nesting relationship, operable through drag, click-to-connect, or keyboard selection.
- **State Veil:** loading, locked, disabled, or stale-session overlay that explains the state without hiding underlying context.

### Controls and states

- **Default:** full contrast, clear label, 1px edge.
- **Hover:** darken the surface or strengthen the border; preserve foreground. Hover never reveals required information exclusively.
- **Focus-visible:** 2px `focus-ring`, 2px outer gap, never clipped.
- **Active/pressed:** 1px downward translation and stronger edge; no contrast loss.
- **Selected:** `selection` background, `forest-900` text, 2px forest edge, and a selected indicator.
- **Disabled:** remains readable, cannot receive focus, and includes a nearby reason when the cause is not obvious.
- **Locked:** distinct from disabled; visible in journey order with prerequisite text and no interactive affordance.
- **Error:** error color, icon/text label, path or line target, and a recovery action.
- **Success/completed:** success label and structural confirmation; never rely on a green fill alone.
- **Partial:** “In progress” plus completed/remaining count.
- **Loading:** preserve layout, show the pending object, and announce completion; no indefinite spinner without text.
- **Stale session:** retain local work, label derived output stale, and offer Resume or Restart.

### Focus and input

- Use logical DOM order and roving `tabindex` only within composite widgets such as rails, node boards, and tile lists.
- Arrow keys move within a composite; Enter/Space selects or picks up; arrow keys choose a destination; Enter/Space drops; Escape cancels and restores origin.
- All pointer drag operations have a visible non-drag alternative. Touch never depends on hover or precision handles.
- After an error, focus stays in the edited control; after a successful move, focus follows the moved object; after reset, focus returns to the module heading or restored object as appropriate.
- Announcements identify object, action, position/path, and result in that order. Example: “Dependency tile moved to build table, position 2 of 3.”

## Do's and Don'ts

### Do

- Do make the TOML relationship visible through alignment, nesting, connectors, and live serialization.
- Do center one manipulable specimen and one clear task per lesson step.
- Do use forest for structure and primary action; use clay sparingly for handling and hints.
- Do pair every drag affordance with keyboard, click-to-move, and touch alternatives.
- Do keep feedback local, path-specific, and actionable.
- Do preserve the learner's last valid structure when an edit becomes temporarily invalid; label it stale.
- Do keep normal body text at 4.5:1 contrast or better and focus/icon boundaries at 3:1 or better.
- Do use short prompts, labels, examples, and status text.

### Don't

- Don't turn the site into a dashboard of identical rounded cards or a grid of terminal windows.
- Don't use terminal styling as the brand identity outside code and command instruments.
- Don't decorate with syntax-color rainbows, gradients, confetti, fake metrics, or game points without learning meaning.
- Don't use color, drag, hover, animation, or spatial position as the only way to understand or complete a task.
- Don't auto-correct silently, move focus unexpectedly, or erase learner input on parse failure.
- Don't show two primary buttons for the same action in one viewport.
- Don't place essays, long theory panels, generic encouragement, or prose-heavy tooltips in the learning UI.
- Don't shrink desktop layouts onto mobile; reorder the work stream and expose explicit Move controls.
