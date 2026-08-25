# Open Design Brief — TOML Tactile Learning Lab

## 1. Contract status

This document is the pre-implementation product and interaction contract for a new GitHub-oriented TOML learning website. It defines scope, hierarchy, behavior, states, accessibility, copy boundaries, and acceptance criteria. It does not authorize implementation, prototyping, assets, deployment, or publishing.

`DESIGN.md` is the normative visual-system source. If this brief and `DESIGN.md` conflict on visual tokens, `DESIGN.md` wins. If they conflict on required learning content or module behavior, this brief wins.

## 2. Product outcome and boundaries

### Outcome

A learner can manipulate, write, diagnose, validate, and ship TOML—not merely recognize its syntax. By the capstone, they can create a credible TOML configuration for a small GitHub-oriented project, pass explicit tests, and copy or export the result.

### Audience

- Developers and technical learners who can read basic code but may be new to TOML.
- GitHub users encountering TOML in project configuration, actions, tooling, or package metadata.
- Keyboard, touch, screen-reader, and reduced-motion users must complete the same learning outcomes.

### In scope

- A small multi-page journey with 11 milestones.
- Examples, editable code, direct manipulation, parsed structure, schemas, a believable terminal, constrained games, immediate feedback, and a capstone.
- Local progress persistence and stale-session recovery.
- Concise, accessible teaching through action and feedback.

### Out of scope

- Accounts, social features, leaderboards, streaks, certificates, community content, analytics dashboards, AI chat tutors, free-form playgrounds before the capstone, and essay-style documentation.
- Invented GitHub metrics, fake repository activity, or commands that imply external side effects.
- Automatic cloud execution or writing to a real repository.

## 3. Information architecture and milestone hierarchy

### Top-level pages

1. **Start** — purpose in one sentence, specimen preview, accessibility/input note, Resume or Begin.
2. **Learn** — the 11 ordered milestone pages below, one active lesson per route.
3. **Capstone** — goal selection, construction, tests, and export/copy.
4. **Progress** — compact checklist of milestones, saved state, and reset controls; no analytics dashboard.
5. **Reference** — searchable syntax examples and type table composed of terse examples, not essays. It is secondary and never required to complete a lesson.

### Journey order

| # | Milestone | Core manipulation | Observable consequence | Unlock condition |
|---:|---|---|---|---|
| 1 | Orientation | Edit a tiny specimen | Parsed structure changes | Produce the target object |
| 2 | Keys and values | Edit values and types | Type chips and targeted correction | Correct all target types |
| 3 | Tables | Move loose fields into trays | Headers and grouping serialize | Match the target tables |
| 4 | Arrays and arrays of tables | Add, remove, reorder entries | Order and headers serialize | Match count, order, and structure |
| 5 | Dotted keys and nesting | Connect and rearrange nodes | Equivalent forms compare | Build both equivalent forms |
| 6 | Dates, times, and edge cases | Classify/edit values | Safe normalized labels appear | Classify and repair every value |
| 7 | Comments, quoting, multiline, escaping | Repair malformed snippets | Parse state and exact line feedback change | Repair all snippets |
| 8 | Schema/contracts | Connect document paths to constraints | Path-specific validation updates | Pass all schema constraints |
| 9 | Terminal/GitHub workflow | Run staged commands | Concise output and status update | Complete the safe workflow |
| 10 | Debug challenge | Diagnose under constraints | Evidence and test status update | Resolve all faults within the rule set |
| 11 | Capstone | Configure from a goal | Tests and final TOML update | All required tests pass |

Milestones 1–2 are available at first entry. Each completed milestone unlocks the next. A learner may revisit completed work. The Reference page is always available. The Capstone unlocks after milestones 1–9; the Debug challenge remains strongly recommended and is displayed as such, but it must not block an accessibility review or product demonstration.

## 4. Shared lesson contract

Every lesson renders in this order: objective tag, one action prompt, interactive specimen, local feedback, structure inspector, recovery row, completion gate. The desktop arrangement may place the inspector beside the specimen; reading and focus order remain unchanged.

### Common states

| State | Required behavior | Required label/announcement |
|---|---|---|
| Loading | Preserve final layout dimensions; disable dependent actions only | “Loading lesson.” then “Lesson ready.” |
| Empty | Show the empty structure plus the next constructive action | Name the empty object and available action |
| Partial | Preserve valid work; show completed/remaining count | “In progress, X of Y complete.” |
| Success | Confirm the structural consequence and enable Next | Name what is now valid; no generic praise only |
| Error | Target path/line/object; retain input; offer recovery | State issue, location, and next action |
| Disabled | Keep label readable; remove from tab order; expose reason nearby | Reason is programmatically associated |
| Locked | Show prerequisite and position in journey | “Locked. Complete [milestone].” |
| Completed | Preserve result and allow Review/Reset | “Complete” in visible and accessible status |
| Stale session | Keep local work; freeze derived output as last valid; offer Resume/Restart | Announce saved age and consequence of restart |

### Feedback timing

- Parsing after text input: debounce 250–400ms; never announce on every keystroke.
- Direct manipulation: update visual target during movement; commit serialization and announcement on drop/confirm.
- Validation: show local path feedback within 150ms after an explicit check or settled edit.
- Success: activate only after all stated conditions pass; do not infer completion from a single correct intermediate action.
- Error announcements: batch related issues; announce the first blocking issue and total count.

### Shared recovery

- Undo stores at least the last 20 committed lesson actions in the current session.
- Reset requires confirmation only after learner-authored progress exists; confirmation names the scope.
- Escape cancels an uncommitted drag, connection, modal, or command selection.
- Hints progress from location → rule cue → minimal example. A hint never performs the action.
- Refresh/reopen restores the last committed state, selected lesson, hint level, and completion status.

## 5. Module specifications

### M1 — Orientation: Parse a tiny specimen

- **Learning objective:** Connect TOML text to its parsed key/value structure and recognize that valid edits change the structure immediately.
- **Initial state:** A three-line specimen contains `name`, `private`, and `version`; Parse Mirror shows the corresponding object. One value is editable and the target object is shown as three compact rows.
- **Permitted actions:** Edit key/value text; choose one suggested replacement; toggle between text and paired line focus; invoke Check.
- **Feedback rules:** Valid settled input updates only the changed parsed row and briefly emphasizes its relationship. Invalid input keeps the last valid mirror, labels it “Stale,” and points to the first affected line.
- **Success condition:** The learner changes the designated value and produces the target parsed object with all three keys present.
- **Error and recovery:** Never clear the mirror. Show “Line 2: expected a value” plus “Restore last valid” and keep focus in the editor.
- **Reset/undo:** Undo reverts the last text commit; Reset restores the original three lines and target.
- **Hints without essays:** “Change the value after `=`.” then `private = false` as the final hint.
- **Keyboard/touch equivalents:** Standard text editing; tapping a parsed row focuses its source line; Enter on a row performs the same link. No drag requirement.
- **Screen-reader announcements:** “Line 2 changed. private: boolean false.” or “Parse paused. Error on line 2. Mirror shows last valid result.”
- **Progress persistence:** Save the current source, last valid parse, Check result, hint level, and completion. Relevant states: loading, partial, error, success, completed, stale session.

### M2 — Keys and values: Type bench

- **Learning objective:** Distinguish strings, integers, floats, booleans, arrays, and inline tables; pair each value with valid TOML syntax.
- **Initial state:** Six editable assignments, three correct and three mistyped; every settled valid value receives a visible text Type Chip.
- **Permitted actions:** Edit keys or values; select a target type; apply a suggested delimiter; Check one line or all lines.
- **Feedback rules:** Feedback targets a single line and names expected versus actual type. Type Chips update only after a valid parse; uncertainty reads “Unparsed,” not a guessed type.
- **Success condition:** All six assignments parse and match their requested types; keys are unique in scope.
- **Error and recovery:** Duplicate key, invalid numeric form, and mismatched delimiters each receive distinct messages and a source target. Preserve every edit.
- **Reset/undo:** Per-line revert plus lesson Undo/Reset. Revert restores only the selected line.
- **Hints without essays:** “Strings need quotes.” “Booleans are lowercase.” “Check the decimal mark.” Maximum three hints per line.
- **Keyboard/touch equivalents:** Tab moves line controls; Alt/Option+Arrow moves between source and type target; touch uses a Type menu, never a hover palette.
- **Screen-reader announcements:** “Line 4, retries. Parsed as integer.” or “Line 5, duplicate key in root table.”
- **Progress persistence:** Save line text, per-line validation, selected target type, hint use, and completion. Relevant states: loading, partial, error, success, disabled Check while parsing, completed, stale session.

### M3 — Tables: Grouping trays

- **Learning objective:** Understand table headers as named grouping boundaries and place fields in the intended table.
- **Initial state:** Five loose Field Tiles sit beside two named Table Trays, `[package]` and `[repository]`; the serialization preview shows root-level fields.
- **Permitted actions:** Drag, pick up, or choose Move to place tiles; reorder within a tray; rename a tray within the provided target names; Check.
- **Feedback rules:** Insertion sockets preview destination and order. Serialization updates on commit. An invalid duplicate or conflicting table name blocks the commit and explains the conflict.
- **Success condition:** Every field is in the correct tray, table headers are valid, and serialized TOML matches the structural target regardless of allowed field order.
- **Error and recovery:** A rejected drop returns the tile to origin and retains focus. Empty trays remain visible with “No fields yet.”
- **Reset/undo:** Undo restores the prior tile position; Reset returns all tiles to the loose rail after confirmation.
- **Hints without essays:** “`url` belongs with repository.” “A header names the tray.”
- **Keyboard/touch equivalents:** Space picks up a tile; arrows choose a socket; Space drops; Escape cancels. Touch offers Move → destination → position.
- **Screen-reader announcements:** “url picked up, position 3 of 5.” “Moved to repository, position 1 of 2.” “Drop unavailable: duplicate key.”
- **Progress persistence:** Save tray names, tile membership/order, undo history for the session, hints, and completion. Relevant states: empty tray, partial, error, success, completed, locked, stale session.

### M4 — Arrays and arrays of tables: Ordered rails

- **Learning objective:** Distinguish scalar arrays from arrays of tables and understand that order and repeated headers affect serialization.
- **Initial state:** One dependency array and two contributor records on separate Array Rails; a compact serializer is visible.
- **Permitted actions:** Add, edit, remove, duplicate, and reorder scalar entries or records; switch a guided specimen between array and array-of-tables forms.
- **Feedback rules:** Numbered stops and serializer update on commit. Removing an entry announces the new count. Switching form previews the syntax change before confirmation.
- **Success condition:** Create the requested dependency order and three valid `[[contributors]]` records with required fields.
- **Error and recovery:** Required-field omissions mark the record and exact path. Destructive remove offers Undo. Invalid mixed-type exercise feedback names both conflicting positions.
- **Reset/undo:** Undo add/remove/reorder/edit; Reset restores the original arrays and records.
- **Hints without essays:** “Double brackets repeat a table.” “Order follows the rail.” “Record 3 needs `name`.”
- **Keyboard/touch equivalents:** Rail uses roving focus, Space pickup/drop, arrows reorder; buttons provide Add and Remove. Touch uses handles plus explicit Move Up/Down.
- **Screen-reader announcements:** “Contributor 2 moved to position 1 of 3.” “Dependency removed. 2 entries remain.”
- **Progress persistence:** Save entries, record fields, order, selected form, hints, and completion. Relevant states: loading, empty array, partial record, error, success, disabled Remove at minimum count, completed, stale session.

### M5 — Dotted keys and nesting: Node board

- **Learning objective:** Recognize dotted keys and explicit tables as equivalent ways to express nested paths, including conflict cases.
- **Initial state:** A Node Board shows `server`, `tls`, and `enabled` unconnected; a paired TOML view has dotted and table tabs.
- **Permitted actions:** Connect nodes, change parent, reorder siblings where serialization allows, choose dotted or explicit representation, compare structures.
- **Feedback rules:** A committed connection highlights the full path and updates both equivalent previews. Semantic equality is shown as “Equivalent” with matching path lists, not color alone.
- **Success condition:** Build `server.tls.enabled`, produce both valid representations, and identify one non-equivalent conflict example.
- **Error and recovery:** Cycles, duplicate definitions, and redefining a scalar as a table reject the connection with the conflicting path named. Preserve origin.
- **Reset/undo:** Undo last connection/reparent; Reset separates all nodes and restores examples.
- **Hints without essays:** “Connect child to parent.” “A scalar cannot become a table.” `server.tls.enabled`.
- **Keyboard/touch equivalents:** Select source port, navigate destination list, confirm connection; touch uses Connect → destination. Connector drawing is optional visual feedback.
- **Screen-reader announcements:** “Connected enabled under tls. Path: server dot tls dot enabled.” “Equivalent structures.”
- **Progress persistence:** Save graph edges, active representation, comparison result, hints, and completion. Relevant states: empty graph, partial path, error, success, locked conflict target, completed, stale session.

### M6 — Dates, times, and edge cases: Classification bench

- **Learning objective:** Distinguish offset date-time, local date-time, local date, and local time without applying unsafe locale or time-zone assumptions.
- **Initial state:** Eight value tiles include valid and invalid examples. Four labeled classification trays explain type names only.
- **Permitted actions:** Classify, edit, inspect exact source characters, choose “No offset” or a literal offset label, and Check.
- **Feedback rules:** Echo the original literal. Never convert local values to the browser locale/time zone. Offset values may additionally show a UTC equivalent explicitly labeled “Derived UTC,” using ISO form.
- **Success condition:** All valid literals are classified correctly and malformed dates/times are repaired without changing their intended literal category.
- **Error and recovery:** Name exact failures such as invalid month, missing `T`/space, or incomplete offset. Do not say “Invalid date” alone.
- **Reset/undo:** Undo edit/classification; Reset restores all eight literals.
- **Hints without essays:** “Look for `Z` or `+/-hh:mm`.” “Local means no offset.” “Month: 01–12.”
- **Keyboard/touch equivalents:** Tile classification follows the same pickup/drop and destination-menu pattern as M3; character inspection is a button, not hover-only.
- **Screen-reader announcements:** “2026-08-25, classified local date, correct.” “Offset missing minutes at characters 20 to 22.”
- **Progress persistence:** Save literal edits, classifications, derived-display preference, hints, and completion. Relevant states: loading, partial, error, success, completed, stale session.

### M7 — Comments, quoting, multiline strings, and escaping: Repair bench

- **Learning objective:** Repair malformed comments, basic/literal strings, multiline strings, and escape sequences while preserving intended output.
- **Initial state:** Five short snippets each fail for one focused reason; expected output appears as a compact escaped preview.
- **Permitted actions:** Edit snippets, reveal invisible characters, toggle expected/actual output, Check one or all.
- **Feedback rules:** Highlight the smallest useful range; name delimiter or escape; update actual output only after valid parsing. Do not auto-insert closing quotes.
- **Success condition:** All five snippets parse and their resulting string values exactly match expected output.
- **Error and recovery:** Preserve malformed source and last valid output. Offer “Restore snippet” and a bounded hint. Never collapse multiline content.
- **Reset/undo:** Per-snippet restore, global Undo, and Reset after confirmation.
- **Hints without essays:** “Basic strings process escapes.” “Literal strings keep backslashes.” “Close with three quotes.”
- **Keyboard/touch equivalents:** Full editor keyboard support; a toolbar exposes Tab insertion and invisible-character toggle for touch keyboards.
- **Screen-reader announcements:** “Snippet 3, unclosed multiline basic string, line 2.” “Snippet 3 repaired. Output matches.”
- **Progress persistence:** Save each snippet, display toggles, pass state, hint level, and completion. Relevant states: loading, partial, error, success, disabled Check during parse, completed, stale session.

### M8 — Schema/contracts: Fit the gauge

- **Learning objective:** Connect TOML paths to schema constraints, interpret path-specific validation, and repair the document.
- **Initial state:** A small project TOML and a four-rule schema list show two passing, two failing constraints. Rules include required path, type, enum, and numeric range.
- **Permitted actions:** Connect a document path to a schema rule, edit the TOML, filter failing rules, jump to path, Validate.
- **Feedback rules:** Every result names path, constraint, expected, and actual. Connections reveal correspondence; they do not imply the schema itself changed.
- **Success condition:** All four constraints pass and every schema rule is connected to the correct TOML path.
- **Error and recovery:** Missing paths point to the nearest valid parent and offer “Add key.” Invalid schema loading uses a separate system error state and does not blame learner input.
- **Reset/undo:** Undo edits/connections; Reset restores the original document and rule mapping.
- **Hints without essays:** “Required: `project.license`.” “Expected one of: MIT, Apache-2.0.” “Range: 1–10.”
- **Keyboard/touch equivalents:** Connection Port supports source-select/destination-confirm; Jump to path moves focus and announces the line. Touch uses labeled Connect menus.
- **Screen-reader announcements:** “project.retries: expected integer 1 through 10; actual 12.” “Validation complete: 4 of 4 pass.”
- **Progress persistence:** Save TOML, connections, filter, validation results with schema version, hints, and completion. Relevant states: loading schema, empty results, partial, error, success, disabled Validate, completed, stale schema/session.

### M9 — Terminal/GitHub workflow: Safe command bench

- **Learning objective:** Use believable local commands to inspect, validate, stage, and review a TOML change in a GitHub project workflow.
- **Initial state:** A simulated repository shows `config.toml` modified. Available command chips are `git diff -- config.toml`, `taplo check config.toml`, `git add config.toml`, and `git status --short`.
- **Permitted actions:** Type or select only allowlisted commands, run, clear output, recall history, inspect file, and reset simulation.
- **Feedback rules:** Output is concise and deterministic. Prompt clearly says “Practice terminal—no real commands run.” Status changes only when the simulated command warrants it.
- **Success condition:** Inspect diff, pass validation, stage the file, and confirm `M  config.toml` in the required order.
- **Error and recovery:** Unknown or out-of-scope commands do not execute; output says “Unavailable in this practice terminal” and suggests `help`. Failed validation preserves modified status.
- **Reset/undo:** Reset repository simulation and history; staging action can be undone with an explicit “Unstage” control. Clear affects output only.
- **Hints without essays:** “Inspect before staging.” “Validate with `taplo check`.” “Short status: `git status --short`.”
- **Keyboard/touch equivalents:** Standard command input and Up/Down history; command chips meet touch size; Run button duplicates Enter for software keyboards.
- **Screen-reader announcements:** Terminal uses a labeled log with polite batched output: “Command complete. Validation passed.” Status region separately announces “config.toml staged.”
- **Progress persistence:** Save simulated file state, staged state, required-step completion, and hint level; command history stays session-only. Relevant states: loading simulation, empty output, error exit, success exit, partial workflow, disabled disallowed command, completed, stale session.

### M10 — Debug challenge: Constrained diagnosis

- **Learning objective:** Diagnose syntactic and semantic TOML faults using evidence, under limits that discourage random editing.
- **Initial state:** One of three deterministic challenge documents contains four faults; learner has six checks and three hints. A requirements tray states the intended structure.
- **Permitted actions:** Edit, run Check, mark a suspected line, inspect last valid structure, use a hint, reset challenge.
- **Feedback rules:** Check returns fault count, first blocking location, and affected requirement; it never reveals all fixes. A remaining-attempt counter is informational and never locks the learner out.
- **Success condition:** Zero parse/contract faults and all requirements satisfied. Efficiency is summarized privately as checks/hints used; no score or leaderboard.
- **Error and recovery:** On exhausted nominal checks, change label to “Extra check” and continue. Misleading-but-valid values receive contract feedback, not syntax feedback.
- **Reset/undo:** Undo last 20 edits; Reset selects the same deterministic challenge unless the learner explicitly chooses “New challenge.”
- **Hints without essays:** Location cue, rule cue, then a single-line analogous example. Each level is individually requested.
- **Keyboard/touch equivalents:** Editor and requirement controls are fully keyboard/touch accessible; suspected-line marking uses a button and shortcut, not gutter precision alone.
- **Screen-reader announcements:** “Check 3. Three faults remain. First: line 8, duplicate key.” Counters have explicit labels.
- **Progress persistence:** Save challenge ID, document, checks, hints, marked lines, last valid parse, and completion. Relevant states: loading, partial, error, success, completed, stale challenge/session; never hard-disabled for attempt count.

### M11 — Capstone: Configure a GitHub-oriented project

- **Learning objective:** Translate a compact project goal into valid, maintainable TOML; validate it; and obtain a usable final artifact.
- **Initial state:** Choose one of three bounded goals: release tool, documentation checker, or dependency bot. Each goal provides 5–7 terse requirements and a starter file with comments only.
- **Permitted actions:** Choose goal, edit TOML, add paths from a structured palette, run tests, inspect failures, preview final file, copy, or download/export `.toml`.
- **Feedback rules:** Tests cover parse validity, required structure, types, values, and one workflow expectation. Each failure is path-specific. Copy/export becomes primary only after all required tests pass.
- **Success condition:** All goal requirements and tests pass; learner reviews the final TOML; copy/export succeeds or an accessible manual-copy fallback is available.
- **Error and recovery:** Preserve source on test failure. If clipboard/download is unavailable, select the full read-only final source and provide explicit manual instructions. No external repository write is implied.
- **Reset/undo:** Undo last 20 commits; Reset confirms scope and retains completed milestones; changing goal warns that capstone draft will be replaced.
- **Hints without essays:** Test-targeted cue, relevant path, then one analogous two-line example. No complete solution reveal.
- **Keyboard/touch equivalents:** Full editor support, structured Add menu, test list navigation, and 44px controls. Copy/export never requires context menus or drag.
- **Screen-reader announcements:** “Tests complete: 6 passed, 1 failed. First failure: release.targets is required.” “Copied final TOML.”
- **Progress persistence:** Save chosen goal, draft, tests with contract version, hints, final-review state, and completion. Relevant states: loading goal, empty draft, partial, error, success, export error, disabled export before pass, locked before prerequisite, completed, stale contract/session.

## 6. Desktop and mobile responsive contract

### Desktop, 1180px and wider

- Persistent Journey Rail, dominant Work Tray, and Inspector Strip share one 1280px maximum canvas.
- Work Tray receives 6–7 of 12 columns and remains the visual center.
- Inspector may be sticky within the viewport but never overlays the lesson footer or hides source lines.
- Resizable split panes are optional; if included, keyboard resizing and saved preference are required.
- One primary action appears in the lesson footer. Header and rail links remain secondary.

### Tablet, 768–1179px

- Journey becomes a horizontal milestone control.
- Work Tray and Inspector may share a 7/5 split above 900px; below that, Inspector becomes an inline disclosure after feedback.
- Node and table manipulators retain explicit destination menus even when drag is present.

### Mobile, 360–767px

- One prioritized stream: prompt → specimen → feedback → inspector → recovery → primary action.
- Replace persistent rail with current milestone, progress fraction, and a journey drawer.
- Replace drag dependence with Move mode, destination picker, and Move Up/Down actions.
- Code and terminal instruments may scroll locally; the page must have no horizontal overflow at 360, 390, 430, or 600px.
- A bottom action row may be sticky only if it does not cover feedback, focused fields, browser chrome, or the software keyboard.
- Connectors may become nested path labels, ordered lists, or parent selectors; structural meaning must survive without spatial geometry.

### Responsive verification widths

Static and interaction review must cover 360, 390, 430, 600, 768, 820, 1024, 1366, 1440, and 1920px. At every width, no required text clips, no controls overlap, no page-level horizontal scroll appears, and focus indicators remain fully visible.

## 7. Input and assistive-technology contract

### Touch and pointer

- All targets are at least 44×44 CSS px; adjacent destructive targets have at least 8px separation.
- Drag starts only after intentional pickup; scrolling a page must not accidentally move a tile.
- Every drag has Move/Connect controls with destination and position choices.
- Hover may reinforce but never reveal the only label, instruction, or state.

### Keyboard

- Tab reaches page regions and controls in task order; composite widgets use one tab stop plus roving focus.
- Enter/Space activates; Space may pick up/drop within composites; arrows navigate or select position; Escape cancels and restores origin.
- Editor shortcuts must not trap Tab. Provide a visible “Tab inserts indentation” toggle when Tab behavior changes.
- Skip links target main lesson, editor/specimen, feedback, and journey navigation.
- No single-key shortcut fires while focus is in an editor unless it is a standard editing command.

### Screen reader

- Regions have stable names: Journey, Lesson, Work tray, Feedback, Structure inspector, Recovery, Tests.
- Editors expose labels, line/column status, errors through `aria-describedby`, and a separate error summary after Check.
- Tile lists expose item name, current container, position, and set size.
- Node connections expose equivalent parent/path text; a visual connector is never the only representation.
- Live regions are polite by default and batch updates. Assertive is limited to imminent data loss or blocking system failure.
- Announcements do not repeat the entire parsed object after each edit.

### Reduced motion

- Respect `prefers-reduced-motion: reduce` before the first animated frame.
- Replace snapping travel, connector drawing, and pane movement with instant state changes and border/label confirmation.
- No required timing, comprehension, or state distinction depends on animation.

## 8. Accessibility and inclusive behavior

- Target WCAG 2.2 AA across content and interaction.
- Text contrast: 4.5:1 minimum for normal text; 3:1 for large text. Non-text controls, focus, and meaningful graphics: 3:1 against adjacent colors.
- Error identification includes text, location, and recovery. Status never depends on color alone.
- Focus is visible, not clipped, and restored predictably after dialogs, resets, moves, and route changes.
- Zoom to 200% and text spacing overrides must not hide content or actions.
- At 320 CSS px equivalent reflow, complete the lesson without two-dimensional page scrolling. Local code scrolling is permitted.
- Do not impose time limits. If a future session expiry exists, warn, extend, and preserve local drafts.
- Use locale-independent ISO examples. Never reinterpret local date/time literals using device locale or time zone.
- Avoid idioms in corrective text. Use exact TOML terms and literal examples.
- Success and error sounds are prohibited by default; if ever added, they must be optional and redundant.

## 9. Copy boundary

### Quantitative limits

| Copy unit | Limit |
|---|---:|
| Page title | 7 words / 52 characters |
| Objective tag | 10 words / 72 characters |
| Task prompt | 18 words / 120 characters; one sentence |
| Button or tab | 4 words / 28 characters |
| Field label | 5 words / 36 characters |
| Hint level | 12 words / 88 characters |
| Inline feedback | 16 words / 110 characters |
| Error summary item | 22 words / 150 characters |
| Success message | 14 words / 96 characters |
| Tooltip | 14 words / 96 characters |
| Empty state | 20 words total, including action |
| Accessibility instruction | 24 words / 170 characters |
| Terminal output per command | 8 lines by default; each line ≤ 100 characters |

No UI teaching block may exceed 40 words in total. No paragraph may contain more than two sentences. If a concept needs more, split it into an action, a labeled example, and feedback. The Reference page may show multiple examples but no prose block above 40 words.

### Compliant UI copy

- Prompt: “Move each field into the table that owns it.”
- Hint: “Double brackets start another record.”
- Error: “`project.retries`: expected integer 1–10; found 12.”
- Success: “Three contributor tables serialize in the correct order.”
- Accessibility instruction: “Press Space to pick up; use arrows to choose a position; press Space to drop.”

### Noncompliant UI copy

- “TOML tables are a powerful and flexible concept that allow you to organize related information in a hierarchical way…” — essay opening; replace with a task and example.
- “Oops! Something went wrong.” — no location, cause, or recovery.
- “Great job! You’re a TOML wizard!” — generic praise without structural confirmation.
- “Drag this over there.” — depends on gesture and ambiguous position.
- A tooltip containing syntax history, rationale, and three examples — exceeds tooltip scope; use one example in Reference.

### Voice

- Direct, precise, calm, and lightly playful through verbs: fit, connect, place, repair, test.
- Name the object before the judgment: “`owner.name` is missing,” not “You forgot a field.”
- Avoid shame, hype, anthropomorphism, jokes in errors, and vague encouragement.

## 10. Do and don't examples

| Do | Don't |
|---|---|
| Show a Field Tile entering `[repository]` and update serialization | Explain tables in a long paragraph before any action |
| Label a stale Parse Mirror and retain its last valid structure | Clear parsed output on the first malformed keystroke |
| Pair drag with Move → destination → position | Make dragging the only way to complete grouping |
| Show “Line 4: duplicate key `name` in `[package]`” | Show “Syntax error” without a target |
| Use one Work Tray with a contextual inspector | Repeat identical rounded terminal cards in a grid |
| Use forest for current structure and clay for handling cues | Color every syntax category and every panel differently |
| Serialize only after a committed move | Rewrite the learner’s code silently during movement |
| Keep local dates literal and label derived UTC explicitly | Apply the device time zone to a local TOML value |
| Continue the debug challenge after nominal checks are used | Lock the learner out because attempts reached zero |
| Enable Copy/Export after tests pass and provide fallback | Claim the file was pushed to GitHub |

## 11. Persistence, versioning, and stale data

- Persist locally by journey version, lesson ID, and module contract version.
- Store authored input, structural state, completion, hints, and the last valid derived result. Do not persist live-region history or focus position across browser restarts.
- A schema or test contract version mismatch marks the session stale; it never silently regrades old work.
- Stale choices are **Resume draft with new checks**, **Review changes**, and **Restart lesson**. Restart names exactly what will be removed.
- Progress writes occur after committed actions and settled edits, not every keystroke.
- If storage fails, continue the lesson and show “Progress won’t persist on this device.” with Retry. Do not block learning.
- Progress reset supports one lesson, capstone only, or all progress. Each confirmation names scope and cannot be preselected.

## 12. Testable acceptance criteria

### System and identity

- [ ] `DESIGN.md` uses alpha YAML frontmatter and the canonical section sequence: Overview, Colors, Typography, Layout, Elevation & Depth, Shapes, Components, Do's and Don'ts.
- [ ] Primitive and semantic colors, light and optional dark surfaces, typography, spacing, radii, borders, shadows, motion, focus, states, anatomy, layout, responsive rules, and named components are specified.
- [ ] Every normal text/background pair targets 4.5:1 or better; large text, focus, icons, and control boundaries target 3:1 or better.
- [ ] The identity uses physical TOML structure—rails, trays, tiles, nesting, keys, values, schemas, and connections—and explicitly rejects generic dashboard and repeated terminal-card layouts.
- [ ] No screen uses more than one primary-styled action for the same function within one viewport.

### Journey and modules

- [ ] All 11 milestones exist in the defined order and each has an objective, initial state, actions, feedback, success, error/recovery, reset/undo, hints, keyboard/touch equivalent, screen-reader announcements, and persistence.
- [ ] Orientation links a tiny editable specimen to immediate parsed structure.
- [ ] Keys/values provides type chips and line-targeted correction.
- [ ] Tables uses physical grouping and serialization; arrays supports add/remove/reorder and arrays of tables.
- [ ] Dotted keys makes equivalent nesting and conflicts observable.
- [ ] Dates/times never reinterpret local literals through browser locale or time zone.
- [ ] Repair work covers comments, quoting, multiline strings, and escaping.
- [ ] Schema validation names path, constraint, expected, and actual.
- [ ] The terminal is clearly simulated, uses believable allowlisted commands, and never implies real execution.
- [ ] Debug constraints never lock the learner out after nominal attempts.
- [ ] Capstone tests a GitHub-oriented goal and provides copy/export plus a manual fallback.

### State behavior

- [ ] Loading, empty, partial, success, error, disabled, locked, completed, and stale-session states have visible and programmatic labels wherever relevant.
- [ ] Parse errors preserve learner input and the last valid derived structure with an explicit Stale label.
- [ ] Undo covers at least 20 committed session actions; reset confirmations name their scope.
- [ ] Storage or export failure does not erase work or block continued learning.
- [ ] Reload restores the selected lesson and last committed state.

### Responsive and interaction

- [ ] No page-level horizontal scroll, overlap, clipping, or obscured focus occurs at 360, 390, 430, 600, 768, 820, 1024, 1366, 1440, or 1920px.
- [ ] Mobile reorders the lesson into one prioritized stream and replaces drag dependence with explicit Move/Connect controls.
- [ ] Every touch target is at least 44×44 CSS px.
- [ ] Every pointer manipulation is completable by keyboard and touch without precision dragging.
- [ ] Focus order follows task order and returns predictably after cancel, drop, reset, route change, and dialog close.

### Accessibility

- [ ] A screen-reader user can complete every milestone and capstone with equivalent outcome.
- [ ] Composite manipulators announce item, container/path, position, action, and result without repeating the entire model.
- [ ] Live updates are batched and polite; assertive announcements are restricted to blocking failure or imminent data loss.
- [ ] Reduced-motion mode removes travel/drawing while preserving every state distinction.
- [ ] 200% zoom, text spacing overrides, and 320 CSS px equivalent reflow preserve content and actions.
- [ ] Errors use text plus a target and recovery; no status depends on color, motion, hover, or sound alone.

### Copy

- [ ] Every UI string meets the quantitative limits in section 9.
- [ ] No UI teaching block exceeds 40 words or two sentences.
- [ ] Feedback names a concrete TOML object, path, line, type, or structural result.
- [ ] No generic praise, essay panels, vague errors, or gesture-only prompts appear.

## 13. Milestone delivery brief

### Milestone A — Foundations and shell

Scope: application shell, journey/progress model, persistence envelope, Work Tray anatomy, Parse Mirror, shared states, Orientation, and Keys/values.

Exit evidence: M1–M2 acceptance scenarios pass for keyboard, touch, screen reader, reload, syntax error, and stale mirror.

### Milestone B — Structural manipulation

Scope: Tables, Arrays/arrays of tables, Dotted keys/nesting; shared Field Tile, Table Tray, Array Rail, Node Board, Insertion Socket, and Connection Port.

Exit evidence: all drag interactions have equivalent Move/Connect flows; serialization and announcements remain synchronized.

### Milestone C — Literal precision and repair

Scope: Dates/times/edge cases and Comments/quoting/multiline/escaping.

Exit evidence: locale/time-zone-safe cases pass; string output comparisons and targeted error ranges are correct.

### Milestone D — Contracts and workflow

Scope: Schema/contracts and Terminal/GitHub workflow.

Exit evidence: validation is path-specific; terminal state is deterministic, safe, concise, and clearly simulated.

### Milestone E — Synthesis

Scope: Debug challenge, Capstone, final Progress and Reference content, copy audit, responsive/accessibility hardening.

Exit evidence: a learner completes a goal, passes tests, and copies/exports final TOML across keyboard, touch, screen reader, and reduced-motion modes.

## 14. Google DESIGN.md lint result

The repository steward ran:

`npx -y @google/design.md lint DESIGN.md`

Result record:

- **Run date:** 2026-08-25
- **CLI version:** `@google/design.md` 0.4.0
- **Exit status:** 0
- **Errors:** 0
- **Contrast warnings:** 0
- **Other warnings:** 29 `orphaned-tokens` warnings; these intentionally retained primitives, semantic aliases, optional dark-mode tokens, and prose-normative tokens are not all referenced by the alpha component map.
- **Info:** 1 token summary: 70 colors, 12 typography scales, 6 rounding levels, 19 spacing tokens, and 21 components.
- **Steward notes or follow-up:** The first exact invocation was blocked before lint by root-owned files in the user npm cache. The same command was rerun with a task-scoped npm cache at `/private/tmp/havesome-toml-npm-cache`; no ownership or global cache changes were made. No design-token change was required because lint found no errors or contrast warnings.
