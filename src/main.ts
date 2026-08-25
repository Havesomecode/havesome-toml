import "@fontsource/newsreader/600.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./styles.css";
import { renderFeedbackStrip, renderProgressLabel } from "./components.ts";
import {
  buildArraySource,
  canExportCapstone,
  capstoneStarters,
  lessons,
  lessonPasses,
  runCapstoneTests,
  runPracticeCommand,
  type Lesson,
  type TerminalState,
} from "./learning.ts";
import {
  isLessonUnlocked,
  launchLessonId,
  loadProgress,
  saveProgress,
  type ProgressState,
} from "./progress.ts";
import { parseDocument, type ParseResult } from "./toml.ts";

const app = document.querySelector<HTMLDivElement>("#app")!;
const loaded = loadProgress(localStorage);
let progress: ProgressState = loaded.state;
let storageFailed = loaded.failed;
let staleSession = loaded.stale;
type PageView = "start" | "lesson" | "progress" | "reference";
const requestedLesson = lessonFromHash();
let pageView: PageView =
  requestedLesson && isLessonUnlocked(requestedLesson, progress.completed)
    ? "lesson"
    : location.hash === "#progress"
      ? "progress"
      : location.hash === "#reference"
        ? "reference"
        : "start";
let current =
  requestedLesson && isLessonUnlocked(requestedLesson, progress.completed)
    ? requestedLesson
    : progress.current;
let currentState = progress.lessons[String(current)];
let source =
  currentState?.source ??
  progress.drafts[String(current)] ??
  lessons[current - 1]!.starter;
let parsed = parseDocument(source);
let lastValid = parsed;
let debounce: number | undefined;
const defaultFeedback = "In progress. Make one structural change.";
let feedback = currentState?.feedback ?? defaultFeedback;
let feedbackKind: "neutral" | "success" | "error" =
  currentState?.feedbackKind ?? "neutral";
let hintLevel = currentState?.hintLevel ?? 0;
let interacted = currentState?.interacted ?? false;
let undoStack: string[] = [];
let terminal: TerminalState = {
  modified: true,
  valid: true,
  staged: false,
  steps: [],
};
let terminalLog = "";
let capstoneGoal = progress.capstone.goal;
if (current === 11 && progress.capstone.source)
  source = progress.capstone.source;
parsed = parseDocument(source);
lastValid = parsed;
let capstoneResults = runCapstoneTests(source, capstoneGoal);
let manipulation = {
  tiles: [
    { name: "name", table: "loose" },
    { name: "version", table: "loose" },
    { name: "url", table: "loose" },
    { name: "branch", table: "loose" },
  ],
  dependencies: ["vite", "smol-toml"],
  contributors: ["Ada", "Lin"],
  nodes: [] as string[],
};

function lessonFromHash(): number | null {
  const match = location.hash.match(/^#lesson-(\d+)$/);
  if (!match) return null;
  const id = Number(match[1]);
  return id >= 1 && id <= lessons.length ? id : null;
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function persist(): void {
  const lessonState = {
    source,
    hintLevel,
    checked: feedbackKind !== "neutral",
    feedback,
    feedbackKind,
    interacted,
    manipulation: structuredClone(manipulation),
    terminal: structuredClone(terminal) as unknown as Record<string, unknown>,
  };
  progress = {
    ...progress,
    current,
    drafts: { ...progress.drafts, [String(current)]: source },
    lessons: { ...progress.lessons, [String(current)]: lessonState },
    capstone:
      current === 11
        ? { goal: capstoneGoal, source, interacted }
        : progress.capstone,
    updatedAt: Date.now(),
  };
  storageFailed = saveProgress(localStorage, progress).failed;
}

function setLesson(id: number): void {
  if (!isLessonUnlocked(id, progress.completed)) return;
  persist();
  pageView = "lesson";
  current = id;
  currentState = progress.lessons[String(id)];
  source =
    id === 11
      ? progress.capstone.source
      : (currentState?.source ??
        progress.drafts[String(id)] ??
        lessons[id - 1]!.starter);
  parsed = parseDocument(source);
  lastValid = parsed;
  progress.current = id;
  hintLevel = currentState?.hintLevel ?? 0;
  interacted =
    id === 11
      ? progress.capstone.interacted
      : (currentState?.interacted ?? false);
  capstoneGoal = progress.capstone.goal;
  if (currentState?.manipulation)
    manipulation = currentState.manipulation as typeof manipulation;
  if (currentState?.terminal)
    terminal = currentState.terminal as unknown as TerminalState;
  feedback = currentState?.feedback ?? defaultFeedback;
  feedbackKind = currentState?.feedbackKind ?? "neutral";
  undoStack = [];
  history.replaceState(null, "", `#lesson-${id}`);
  persist();
  render();
  requestAnimationFrame(() =>
    document.querySelector<HTMLElement>("#lesson-title")?.focus(),
  );
}

function markComplete(message: string): void {
  if (!progress.completed.includes(current))
    progress.completed = [...progress.completed, current].sort((a, b) => a - b);
  recordCheck(message, "success");
}

function recordCheck(message: string, kind: "success" | "error"): void {
  feedback = message;
  feedbackKind = kind;
  persist();
  render();
}

function lessonStatus(id: number): string {
  if (progress.completed.includes(id)) return "Complete";
  if (id === current) return "Current";
  if (!isLessonUnlocked(id, progress.completed)) return "Locked";
  return "Available";
}

function journeyMarkup(): string {
  return lessons
    .map(
      (lesson) => `
    <li>
      <button class="journey-step ${lesson.id === current && pageView === "lesson" ? "is-current" : ""} ${progress.completed.includes(lesson.id) ? "is-complete" : ""}" data-lesson="${lesson.id}" aria-current="${lesson.id === current && pageView === "lesson" ? "step" : "false"}" ${isLessonUnlocked(lesson.id, progress.completed) ? "" : "disabled"}>
        <span class="step-number" aria-hidden="true">${progress.completed.includes(lesson.id) ? "✓" : String(lesson.id).padStart(2, "0")}</span>
        <span><strong>${escapeHtml(lesson.title)}</strong><small>${lessonStatus(lesson.id)}</small></span>
      </button>
    </li>`,
    )
    .join("");
}

function siteHeader(): string {
  return `<header class="site-header"><a class="wordmark" href="#start" aria-label="HaveSome TOML home"><span>{</span> HaveSome TOML <span>}</span></a><nav aria-label="Utility"><a href="#progress">${renderProgressLabel(progress.completed.length, 11)}</a><a href="#reference">Reference</a><a href="https://toml.io/en/v1.1.0" target="_blank" rel="noreferrer">TOML 1.1 ↗</a></nav></header>`;
}

function bindPageNavigation(): void {
  document
    .querySelector<HTMLElement>("[data-start]")
    ?.addEventListener("click", (event) =>
      setLesson(Number((event.currentTarget as HTMLElement).dataset.start)),
    );
  document
    .querySelectorAll<HTMLElement>("[data-lesson]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        setLesson(Number(button.dataset.lesson)),
      ),
    );
  document
    .querySelector<HTMLInputElement>("#reference-search")
    ?.addEventListener("input", (event) => {
      const query = (event.target as HTMLInputElement).value
        .trim()
        .toLowerCase();
      document
        .querySelectorAll<HTMLElement>("[data-reference]")
        .forEach((card) => {
          card.hidden = !card.textContent!.toLowerCase().includes(query);
        });
    });
}

function renderPage(): boolean {
  if (pageView === "lesson") return false;
  if (pageView === "start") {
    const launchTarget = launchLessonId(progress.current, progress.completed);
    const launchVerb =
      progress.completed.length > 0 ||
      progress.updatedAt > 0 ||
      Object.keys(progress.lessons).length > 0
        ? "Resume"
        : "Begin";
    app.innerHTML = `${siteHeader()}<main class="standalone"><section class="start-hero"><span class="eyebrow">Interactive TOML 1.1 lab</span><h1>Learn TOML by changing it</h1><p>Eleven compact lessons connect source text, parsed structure, and safe configuration work.</p><button class="primary" data-start="${launchTarget}">${launchVerb} lesson ${launchTarget}</button></section><section class="start-journey" aria-labelledby="start-journey-title"><h2 id="start-journey-title">Your journey</h2><ol>${journeyMarkup()}</ol></section></main>`;
  } else if (pageView === "progress") {
    app.innerHTML = `${siteHeader()}<main class="standalone"><span class="eyebrow">Progress</span><h1>Your progress</h1><p>${progress.completed.length} of 11 lessons complete.</p><ol class="progress-list">${lessons.map((lesson) => `<li><span>${String(lesson.id).padStart(2, "0")}</span><div><strong>${escapeHtml(lesson.title)}</strong><small>${lessonStatus(lesson.id)}</small></div>${isLessonUnlocked(lesson.id, progress.completed) ? `<button data-lesson="${lesson.id}">${progress.completed.includes(lesson.id) ? "Review" : "Continue"}</button>` : '<span class="lock-label">Locked</span>'}</li>`).join("")}</ol></main>`;
  } else {
    const entries = [
      [
        "Keys and values",
        "Strings, numbers, booleans, arrays, and inline tables.",
      ],
      ["Tables", "Use [table] headers and dotted keys to create structure."],
      ["Arrays", "Arrays preserve order; [[tables]] creates repeated records."],
      [
        "Dates and times",
        "TOML distinguishes local and offset date-time literals.",
      ],
      [
        "Strings",
        "Basic strings process escapes; literal strings preserve them.",
      ],
    ];
    app.innerHTML = `${siteHeader()}<main class="standalone"><span class="eyebrow">Reference</span><h1>TOML reference</h1><label class="reference-search" for="reference-search">Search reference<input id="reference-search" type="search" autocomplete="off" /></label><div class="reference-grid">${entries.map(([title, copy]) => `<article data-reference><h2>${title}</h2><p>${copy}</p></article>`).join("")}</div></main>`;
  }
  bindPageNavigation();
  return true;
}

function parseMirror(result: ParseResult): string {
  const status = result.ok
    ? '<span class="status-dot success">Live</span>'
    : `<span class="status-dot error">${result.stale ? "Stale" : "Error"}</span>`;
  const rows = result.rows.length
    ? result.rows
        .map(
          (row) => `
    <li class="tree-row">
      <code>${escapeHtml(row.path)}</code>
      <span class="type-chip">${escapeHtml(row.type)}</span>
      <span class="tree-value">${escapeHtml(displayValue(row.value))}</span>
    </li>`,
        )
        .join("")
    : '<li class="empty">No parsed fields yet.</li>';
  return `<section class="inspector" aria-labelledby="inspector-title">
    <header><div><span class="eyebrow">Structure inspector</span><h2 id="inspector-title">Parse mirror</h2></div>${status}</header>
    <p class="version-note">TOML 1.1 · <code>\\e</code>, <code>\\xHH</code>, multiline inline tables</p>
    <ul class="tree-list">${rows}</ul>
  </section>`;
}

function typeTargets(): string {
  const expected = [
    "string",
    "integer",
    "float",
    "boolean",
    "array",
    "inline table",
  ];
  return `<div class="type-targets" aria-label="Target types">${expected
    .map((type, index) => {
      const actual = parsed.rows[index]?.type ?? "unparsed";
      return `<div class="type-target ${actual === type ? "matched" : ""}"><span>Line ${index + 1}</span><strong>${type}</strong><small>${actual === type ? "Matched" : `Found ${actual}`}</small></div>`;
    })
    .join("")}</div>`;
}

function tableLab(): string {
  const tray = (name: string) => {
    const tiles = manipulation.tiles.filter((tile) => tile.table === name);
    return `<div class="table-tray" data-drop-table="${name}"><h3>${name === "loose" ? "Loose fields" : `[${name}]`}</h3><ul>${
      tiles.length
        ? tiles
            .map(
              (tile) => `
      <li class="field-tile" draggable="true" data-tile="${tile.name}" tabindex="0"><span class="drag-mark" aria-hidden="true">⠿</span><code>${tile.name}</code><label>Move <select data-move-tile="${tile.name}" aria-label="Move ${tile.name}"><option value="${name}">${name}</option>${[
        "loose",
        "package",
        "repository",
      ]
        .filter((value) => value !== name)
        .map((value) => `<option value="${value}">${value}</option>`)
        .join("")}</select></label></li>`,
            )
            .join("")
        : '<li class="empty">No fields yet.</li>'
    }</ul></div>`;
  };
  return `<div class="tray-grid" aria-label="Table grouping lab">${tray("loose")}${tray("package")}${tray("repository")}</div>`;
}

function arrayLab(): string {
  const deps = manipulation.dependencies
    .map(
      (dependency, index) =>
        `<li class="field-tile"><span><small>${index + 1}</small> <code>${dependency}</code></span><span class="tile-actions"><button data-dep-up="${index}" aria-label="Move ${dependency} up" ${index === 0 ? "disabled" : ""}>↑</button><button data-dep-down="${index}" aria-label="Move ${dependency} down" ${index === manipulation.dependencies.length - 1 ? "disabled" : ""}>↓</button></span></li>`,
    )
    .join("");
  const people = manipulation.contributors
    .map(
      (name, index) =>
        `<li class="record-stop"><span>${index + 1}</span><code>[[contributors]]\nname = "${name}"</code><button data-remove-person="${index}" aria-label="Remove ${name}">Remove</button></li>`,
    )
    .join("");
  return `<div class="array-lab"><section><h3>Dependency rail</h3><ol>${deps}</ol></section><section><div class="section-row"><h3>Contributor records</h3><button data-add-person>Add record</button></div><ol class="record-rail">${people}</ol></section></div>`;
}

function nodeLab(): string {
  const parts = ["server", "tls", "enabled"];
  return `<div class="node-board" aria-label="Dotted key connection board">${parts.map((part, index) => `<button class="node ${manipulation.nodes.includes(part) ? "connected" : ""}" data-node="${part}"><code>${part}</code><small>${manipulation.nodes.includes(part) ? `Path ${index + 1}` : "Connect"}</small></button>${index < 2 ? '<span class="connector" aria-hidden="true">···</span>' : ""}`).join("")}</div><p class="path-readout"><span>Dotted path</span><code>${manipulation.nodes.join(".") || "No path yet"}</code></p>`;
}

function dateBoard(): string {
  const types = [
    "local date",
    "local time",
    "local date-time",
    "offset date-time",
    "string",
  ];
  return `<div class="classification-grid">${parsed.rows
    .map((row) => {
      const line =
        source
          .split("\n")
          .find((candidate) => candidate.startsWith(`${row.path} =`)) ?? "";
      const selected = line.match(/# type: (.+)$/)?.[1] ?? "";
      return `<div class="literal-tile"><code>${escapeHtml(displayValue(row.value))}</code><span class="type-chip">${escapeHtml(row.type)}</span><label>Classify ${escapeHtml(row.path)}<select data-date-type="${escapeHtml(row.path)}" aria-label="Classify ${escapeHtml(row.path)}"><option value="">Choose type</option>${types.map((type) => `<option value="${type}" ${selected === type ? "selected" : ""}>${type}</option>`).join("")}</select></label></div>`;
    })
    .join("")}</div>`;
}

function schemaGauge(): string {
  const root = parsed.ok
    ? (parsed.data.project as Record<string, unknown> | undefined)
    : undefined;
  const rules = [
    ["project.name", "required string", typeof root?.name === "string"],
    [
      "project.license",
      "MIT or Apache-2.0",
      ["MIT", "Apache-2.0"].includes(String(root?.license)),
    ],
    [
      "project.retries",
      "integer 1–10",
      Number.isInteger(root?.retries) &&
        Number(root?.retries) >= 1 &&
        Number(root?.retries) <= 10,
    ],
    ["project.private", "boolean", typeof root?.private === "boolean"],
  ] as const;
  return `<ul class="gauge-list">${rules.map(([path, rule, pass]) => `<li class="gauge ${pass ? "pass" : "fail"}"><span aria-hidden="true">${pass ? "✓" : "×"}</span><code>${path}</code><strong>${rule}</strong><small>${pass ? "Fits" : "Repair value"}</small></li>`).join("")}</ul>`;
}

function editorModule(lesson: Lesson): string {
  let extra = "";
  if (lesson.kind === "types") extra = typeTargets();
  if (lesson.kind === "tables") extra = tableLab();
  if (lesson.kind === "arrays") extra = arrayLab();
  if (lesson.kind === "nodes") extra = nodeLab();
  if (lesson.kind === "dates") extra = dateBoard();
  if (lesson.kind === "schema") extra = schemaGauge();
  const error = parsed.ok
    ? ""
    : `<p class="source-error" id="source-error"><strong>Line ${parsed.error?.line}:</strong> ${escapeHtml(parsed.error?.message)}. <button data-restore>Restore last valid</button></p>`;
  return `<div class="lesson-grid"><section class="work-tray" aria-labelledby="work-title"><i class="registration-mark top" aria-hidden="true"></i><i class="registration-mark bottom" aria-hidden="true"></i><span class="eyebrow">Specimen</span><h2 id="work-title">${escapeHtml(moduleTitle(lesson.kind))}</h2>${extra}<div class="code-bench"><label for="toml-source">TOML source</label><textarea id="toml-source" spellcheck="false" aria-describedby="${parsed.ok ? "source-help" : "source-error"}">${escapeHtml(source)}</textarea><small id="source-help">Tab stays in the editor. Parsed after a short pause.</small></div>${error}</section>${parseMirror(parsed)}</div>`;
}

function moduleTitle(kind: Lesson["kind"]): string {
  const names: Record<string, string> = {
    editor: "Code bench",
    types: "Type bench",
    tables: "Grouping trays",
    arrays: "Ordered rails",
    nodes: "Node board",
    dates: "Classification bench",
    repair: "Repair bench",
    schema: "Schema gauge",
    debug: "Fault bench",
  };
  return names[kind] ?? "Code bench";
}

function terminalModule(): string {
  const commands = [
    "git diff -- config.toml",
    "taplo check config.toml",
    "git add config.toml",
    "git status --short",
  ];
  return `<div class="lesson-grid"><section class="work-tray terminal-tray"><i class="registration-mark top" aria-hidden="true"></i><span class="eyebrow">Specimen</span><h2>Safe command bench</h2><p class="terminal-notice">Practice terminal—no real commands run.</p><div class="command-chips">${commands.map((command) => `<button data-command="${escapeHtml(command)}"><code>${escapeHtml(command)}</code></button>`).join("")}</div><form id="terminal-form"><label for="command-input">Command</label><div class="command-line"><span aria-hidden="true">$</span><input id="command-input" autocomplete="off" /><button>Run</button></div></form><pre class="terminal-log" role="log" aria-label="Terminal output">${escapeHtml(terminalLog || "Ready. Type help.")}</pre></section><section class="inspector"><header><div><span class="eyebrow">Structure inspector</span><h2>Repository state</h2></div><span class="status-dot ${terminal.staged ? "success" : ""}">${terminal.staged ? "Staged" : "Modified"}</span></header><ol class="workflow-steps">${["Inspect diff", "Validate TOML", "Stage file", "Confirm status"].map((label, index) => `<li class="${terminal.steps[index] ? "done" : ""}"><span>${terminal.steps[index] ? "✓" : index + 1}</span>${label}</li>`).join("")}</ol></section></div>`;
}

function capstoneModule(): string {
  const passed = capstoneResults.filter((result) => result.pass).length;
  const ready = canExportCapstone(source, capstoneGoal, interacted);
  return `<div class="lesson-grid"><section class="work-tray"><i class="registration-mark top" aria-hidden="true"></i><span class="eyebrow">Specimen</span><h2>Project configuration</h2><div class="goal-row"><label for="goal">Project goal</label><select id="goal"><option value="release" ${capstoneGoal === "release" ? "selected" : ""}>Release tool</option><option value="docs" ${capstoneGoal === "docs" ? "selected" : ""}>Documentation checker</option><option value="dependabot" ${capstoneGoal === "dependabot" ? "selected" : ""}>Dependency bot</option></select><button data-use-starter>Restore scaffold</button></div><div class="code-bench"><label for="toml-source">TOML source</label><textarea id="toml-source" spellcheck="false">${escapeHtml(source)}</textarea></div><div class="export-row"><button data-copy ${!ready ? 'disabled aria-describedby="export-reason"' : ""}>Copy TOML</button><button data-download ${!ready ? 'disabled aria-describedby="export-reason"' : ""}>Download TOML</button></div><small id="export-reason">${ready ? "Final source is ready." : "Build the source and pass every test to export. Manual copy remains available in the editor."}</small></section><section class="inspector" aria-labelledby="tests-title"><header><div><span class="eyebrow">Tests</span><h2 id="tests-title">Contract checks</h2></div><span class="status-dot ${passed === 5 ? "success" : ""}">${passed}/5</span></header><p class="test-summary">${passed} passed, ${5 - passed} failed.</p><ul class="test-list">${capstoneResults.map((result) => `<li class="${result.pass ? "pass" : "fail"}"><span>${result.pass ? "✓" : "×"}</span><div><strong>${escapeHtml(result.label)}</strong><small>${escapeHtml(result.detail)}</small></div></li>`).join("")}</ul></section></div>`;
}

function hintsFor(lesson: Lesson): string[] {
  const common: Record<number, string[]> = {
    1: ["Change the value after `=`.", "`private = false`"],
    2: [
      "Strings need quotes.",
      "Booleans are lowercase.",
      "Check the decimal mark.",
    ],
    3: ["`url` belongs with repository.", "A header names the tray."],
    4: [
      "Double brackets repeat a table.",
      "Order follows the rail.",
      "Record 3 needs `name`.",
    ],
    5: [
      "Connect child to parent.",
      "A scalar cannot become a table.",
      "`server.tls.enabled`",
    ],
    6: [
      "Look for `Z` or `+/-hh:mm`.",
      "Local means no offset.",
      "Month: 01–12.",
    ],
    7: [
      "Basic strings process escapes.",
      "Literal strings keep backslashes.",
      "Close with three quotes.",
    ],
    8: [
      "Required: `project.license`.",
      "Expected MIT or Apache-2.0.",
      "Range: 1–10.",
    ],
    9: ["Inspect before staging.", "Validate with `taplo check`."],
    10: [
      "Start at the first parse error.",
      "Booleans are lowercase.",
      "Each key is unique in scope.",
    ],
    11: ["Run tests to find the path.", "Use the selected goal table."],
  };
  return common[lesson.id] ?? [];
}

function render(): void {
  if (renderPage()) return;
  const lesson = lessons[current - 1]!;
  const complete = progress.completed.includes(current);
  const hint = hintsFor(lesson)[hintLevel - 1];
  const module =
    lesson.kind === "terminal"
      ? terminalModule()
      : lesson.kind === "capstone"
        ? capstoneModule()
        : editorModule(lesson);
  app.innerHTML = `${siteHeader()}
    ${storageFailed ? '<div class="system-banner" role="status">Progress won’t persist on this device. <button data-retry-storage>Retry</button></div>' : ""}
    ${staleSession ? '<div class="system-banner stale" role="status">Saved checks changed. Draft preserved. <button data-resume>Resume draft</button><button data-restart>Restart lesson</button></div>' : ""}
    <div class="app-shell"><aside class="journey" aria-label="Journey"><div class="journey-heading"><span class="eyebrow">Journey</span><strong>${progress.completed.length} of 11 complete</strong></div><ol>${journeyMarkup()}</ol></aside>
    <main id="lesson" class="lesson"><header class="lesson-header"><div><span class="objective">${escapeHtml(lesson.objective)}</span><p class="milestone">Milestone ${lesson.id} of 11</p><h1 id="lesson-title" tabindex="-1">${escapeHtml(lesson.title)}</h1><p class="prompt">${escapeHtml(lesson.prompt)}</p></div><span class="lesson-state ${complete ? "complete" : ""}">${complete ? "✓ Complete" : "In progress"}</span></header>${module}
    ${renderFeedbackStrip(feedback, feedbackKind)}
    <section class="recovery" aria-label="Recovery"><button data-undo ${undoStack.length ? "" : "disabled"}>Undo</button><button data-reset>Reset lesson</button><button data-hint>Hint ${Math.min(hintLevel + 1, hintsFor(lesson).length)}/${hintsFor(lesson).length}</button>${hint ? `<p class="hint-chip">${escapeHtml(hint)}</p>` : ""}</section>
    <footer class="lesson-footer"><button data-prev ${current === 1 ? "disabled" : ""}>← Back</button><button class="primary" data-check>${lesson.kind === "capstone" ? "Run tests" : "Check lesson"}</button><button data-next ${current === 11 || !complete ? "disabled" : ""}>Next →</button></footer></main></div>`;
  bindEvents();
}

function updateSource(next: string): void {
  if (next !== source) {
    undoStack = [...undoStack.slice(-19), source];
    source = next;
    interacted = true;
  }
  parsed = parseDocument(source, lastValid);
  if (parsed.ok) lastValid = parsed;
  window.clearTimeout(debounce);
  debounce = window.setTimeout(() => persist(), 350);
}

function checkLesson(): void {
  const lesson = lessons[current - 1]!;
  if (lesson.kind === "terminal") {
    if (terminal.steps.join(",") === "diff,check,stage,status")
      markComplete("Safe workflow complete; config.toml is staged.");
    else
      recordCheck(`${terminal.steps.length} of 4 commands complete.`, "error");
    return;
  }
  if (lesson.kind === "capstone") {
    capstoneResults = runCapstoneTests(source, capstoneGoal);
    if (capstoneResults.every((result) => result.pass))
      markComplete("Five capstone tests pass; final TOML is ready.");
    else
      recordCheck(
        `${capstoneResults.filter((result) => result.pass).length} of 5 tests pass.`,
        "error",
      );
    return;
  }
  if (!parsed.ok) {
    recordCheck(
      `Line ${parsed.error?.line}: ${parsed.error?.message}.`,
      "error",
    );
    return;
  }
  const validators: Record<number, () => boolean> = {
    1: () =>
      parsed.data.private === false && Object.keys(parsed.data).length === 3,
    2: () =>
      ["string", "integer", "float", "boolean", "array", "inline table"].every(
        (type, index) => parsed.rows[index]?.type === type,
      ),
    3: () => lessonPasses(3, source, interacted),
    4: () => lessonPasses(4, source, interacted),
    5: () => lessonPasses(5, source, interacted),
    6: () => lessonPasses(6, source, interacted),
    7: () => lessonPasses(7, source, interacted),
    8: () => {
      const root = parsed.data.project as Record<string, unknown> | undefined;
      return (
        !!root &&
        ["MIT", "Apache-2.0"].includes(String(root.license)) &&
        Number(root.retries) >= 1 &&
        Number(root.retries) <= 10 &&
        typeof root.private === "boolean"
      );
    },
    10: () =>
      parsed.data.name === "lab" &&
      parsed.data.private === false &&
      typeof parsed.data.retries === "number" &&
      typeof parsed.data.owner === "string",
  };
  if (validators[current]?.()) {
    const messages: Record<number, string> = {
      1: "private is boolean false.",
      2: "Six values match their requested types.",
      3: "Four fields serialize inside their tables.",
      4: "Three contributor tables serialize in order.",
      5: "server.tls.enabled is equivalent in both forms.",
      6: "Eight date and time literals are classified and repaired.",
      7: "Five string forms parse with intended output.",
      8: "Four schema constraints fit.",
      10: "Zero parse or contract faults remain.",
    };
    markComplete(messages[current] ?? "Lesson structure is valid.");
  } else
    recordCheck(
      "Structure differs from the target. Use the inspector.",
      "error",
    );
}

function bindEvents(): void {
  document.querySelectorAll<HTMLElement>("[data-lesson]").forEach((button) =>
    button.addEventListener("click", (event) => {
      event.preventDefault();
      setLesson(Number(button.dataset.lesson));
    }),
  );
  document
    .querySelector<HTMLTextAreaElement>("#toml-source")
    ?.addEventListener("input", (event) => {
      const editor = event.target as HTMLTextAreaElement;
      const selection = {
        start: editor.selectionStart,
        end: editor.selectionEnd,
        direction: editor.selectionDirection,
      };
      updateSource(editor.value);
      render();
      const replacement =
        document.querySelector<HTMLTextAreaElement>("#toml-source");
      replacement?.focus();
      replacement?.setSelectionRange(
        selection.start,
        selection.end,
        selection.direction,
      );
    });
  document
    .querySelector("[data-check]")
    ?.addEventListener("click", checkLesson);
  document
    .querySelector("[data-prev]")
    ?.addEventListener("click", () => setLesson(Math.max(1, current - 1)));
  document
    .querySelector("[data-next]")
    ?.addEventListener("click", () => setLesson(Math.min(11, current + 1)));
  document.querySelector("[data-hint]")?.addEventListener("click", () => {
    hintLevel = Math.min(hintsFor(lessons[current - 1]!).length, hintLevel + 1);
    persist();
    render();
  });
  document.querySelector("[data-undo]")?.addEventListener("click", () => {
    const previous = undoStack.pop();
    if (previous !== undefined) {
      source = previous;
      parsed = parseDocument(source, lastValid);
      if (parsed.ok) lastValid = parsed;
      persist();
      render();
    }
  });
  document.querySelector("[data-reset]")?.addEventListener("click", () => {
    if (
      source !== lessons[current - 1]!.starter &&
      !window.confirm(
        `Reset ${lessons[current - 1]!.title}? This removes its draft.`,
      )
    )
      return;
    source = lessons[current - 1]!.starter;
    parsed = parseDocument(source);
    lastValid = parsed;
    feedback = "Lesson reset to its starting specimen.";
    feedbackKind = "neutral";
    persist();
    render();
  });
  document.querySelector("[data-restore]")?.addEventListener("click", () => {
    source = lessons[current - 1]!.starter;
    parsed = parseDocument(source);
    lastValid = parsed;
    persist();
    render();
  });
  document
    .querySelectorAll<HTMLSelectElement>("[data-move-tile]")
    .forEach((select) =>
      select.addEventListener("change", () =>
        moveTile(select.dataset.moveTile!, select.value),
      ),
    );
  document
    .querySelectorAll<HTMLElement>("[data-drop-table]")
    .forEach((tray) => {
      tray.addEventListener("dragover", (event) => event.preventDefault());
      tray.addEventListener("drop", (event) => {
        event.preventDefault();
        const name = (event as DragEvent).dataTransfer?.getData("text/plain");
        if (name) moveTile(name, tray.dataset.dropTable!);
      });
    });
  document
    .querySelectorAll<HTMLElement>("[data-tile]")
    .forEach((tile) =>
      tile.addEventListener("dragstart", (event) =>
        (event as DragEvent).dataTransfer?.setData(
          "text/plain",
          tile.dataset.tile!,
        ),
      ),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-dep-up],[data-dep-down]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const key = button.hasAttribute("data-dep-up") ? "depUp" : "depDown";
        const index = Number(button.dataset[key]);
        const target = key === "depUp" ? index - 1 : index + 1;
        [manipulation.dependencies[index], manipulation.dependencies[target]] =
          [
            manipulation.dependencies[target]!,
            manipulation.dependencies[index]!,
          ];
        updateSource(
          buildArraySource(
            manipulation.dependencies,
            manipulation.contributors,
          ),
        );
        feedback = `${manipulation.dependencies[target]} moved to position ${target + 1}.`;
        render();
      }),
    );
  document.querySelector("[data-add-person]")?.addEventListener("click", () => {
    manipulation.contributors.push(
      `Contributor ${manipulation.contributors.length + 1}`,
    );
    updateSource(
      buildArraySource(manipulation.dependencies, manipulation.contributors),
    );
    feedback = `${manipulation.contributors.length} contributor records.`;
    render();
  });
  document
    .querySelectorAll<HTMLButtonElement>("[data-remove-person]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        manipulation.contributors.splice(
          Number(button.dataset.removePerson),
          1,
        );
        updateSource(
          buildArraySource(
            manipulation.dependencies,
            manipulation.contributors,
          ),
        );
        render();
      }),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-node]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        const expected = ["server", "tls", "enabled"][
          manipulation.nodes.length
        ];
        if (!expected) return;
        if (button.dataset.node === expected) {
          manipulation.nodes.push(expected);
          updateSource(
            manipulation.nodes.length === 3
              ? "server.tls.enabled = true"
              : `# Connected path: ${manipulation.nodes.join(".")}`,
          );
          feedback = `Connected ${expected}. Path: ${manipulation.nodes.join(".")}.`;
          feedbackKind = "neutral";
        } else {
          feedback = `Connect ${expected} next.`;
          feedbackKind = "error";
        }
        render();
      }),
    );
  document
    .querySelectorAll<HTMLSelectElement>("[data-date-type]")
    .forEach((select) =>
      select.addEventListener("change", () => {
        const path = select.dataset.dateType!;
        source = source
          .split("\n")
          .map((line) =>
            line.startsWith(`${path} =`)
              ? `${line.replace(/\s+# type: .+$/, "")} # type: ${select.value}`
              : line,
          )
          .join("\n");
        parsed = parseDocument(source, lastValid);
        if (parsed.ok) lastValid = parsed;
        interacted = true;
        persist();
        render();
      }),
    );
  document
    .querySelectorAll<HTMLButtonElement>("[data-command]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        runTerminal(button.dataset.command!),
      ),
    );
  document
    .querySelector<HTMLFormElement>("#terminal-form")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      runTerminal(
        document.querySelector<HTMLInputElement>("#command-input")!.value,
      );
    });
  document
    .querySelector<HTMLSelectElement>("#goal")
    ?.addEventListener("change", (event) => {
      const nextGoal = (event.target as HTMLSelectElement).value;
      if (
        interacted &&
        source !== capstoneStarters[capstoneGoal] &&
        !window.confirm(
          "Changing the project goal will replace your current capstone source with a new scaffold. Continue?",
        )
      ) {
        render();
        return;
      }
      capstoneGoal = nextGoal;
      source = capstoneStarters[capstoneGoal]!;
      interacted = false;
      parsed = parseDocument(source);
      lastValid = parsed;
      capstoneResults = runCapstoneTests(source, capstoneGoal);
      persist();
      render();
    });
  document
    .querySelector("[data-use-starter]")
    ?.addEventListener("click", () => {
      if (
        interacted &&
        source !== capstoneStarters[capstoneGoal] &&
        !window.confirm(
          "Restore the scaffold and replace your capstone source?",
        )
      )
        return;
      updateSource(capstoneStarters[capstoneGoal]!);
      interacted = false;
      capstoneResults = runCapstoneTests(source, capstoneGoal);
      persist();
      render();
    });
  document.querySelector("[data-copy]")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(source);
      feedback = "Copied final TOML.";
      feedbackKind = "success";
    } catch {
      document.querySelector<HTMLTextAreaElement>("#toml-source")?.select();
      feedback = "Clipboard unavailable. Source selected for manual copy.";
      feedbackKind = "error";
    }
    render();
  });
  document.querySelector("[data-download]")?.addEventListener("click", () => {
    const url = URL.createObjectURL(
      new Blob([source], { type: "application/toml" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${capstoneGoal}.toml`;
    anchor.click();
    URL.revokeObjectURL(url);
    feedback = "TOML download prepared.";
    feedbackKind = "success";
    render();
  });
  document.querySelector("[data-resume]")?.addEventListener("click", () => {
    staleSession = false;
    persist();
    render();
  });
  document.querySelector("[data-restart]")?.addEventListener("click", () => {
    source = lessons[current - 1]!.starter;
    staleSession = false;
    persist();
    render();
  });
  document
    .querySelector("[data-retry-storage]")
    ?.addEventListener("click", () => {
      storageFailed = saveProgress(localStorage, progress).failed;
      render();
    });
  document
    .querySelector("[data-view-progress]")
    ?.addEventListener("click", () =>
      document.querySelector<HTMLElement>(".journey")?.scrollIntoView(),
    );
}

function moveTile(name: string, table: string): void {
  const tile = manipulation.tiles.find((item) => item.name === name);
  if (!tile) return;
  tile.table = table;
  const values: Record<string, string> = {
    name: '"tactile"',
    version: '"1.0.0"',
    url: '"https://example.invalid"',
    branch: '"main"',
  };
  source = ["loose", "package", "repository"]
    .map((destination) => {
      const fields = manipulation.tiles
        .filter((item) => item.table === destination)
        .map((item) => `${item.name} = ${values[item.name]}`);
      if (!fields.length) return "";
      return destination === "loose"
        ? fields.join("\n")
        : `[${destination}]\n${fields.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
  parsed = parseDocument(source, lastValid);
  if (parsed.ok) lastValid = parsed;
  interacted = true;
  persist();
  feedback = `${name} moved to ${table}.`;
  feedbackKind = "neutral";
  render();
  document.querySelector<HTMLElement>(`[data-tile="${name}"]`)?.focus();
}

function runTerminal(command: string): void {
  const result = runPracticeCommand(command, terminal);
  terminal = result.state;
  interacted = interacted || result.ok;
  terminalLog = `$ ${command}\n${result.output}`;
  feedback = result.ok
    ? `Command complete. ${terminal.steps.length} of 4 steps.`
    : result.output;
  feedbackKind = result.ok ? "neutral" : "error";
  persist();
  render();
}

window.addEventListener("hashchange", () => {
  const id = lessonFromHash();
  if (id) {
    if (id !== current || pageView !== "lesson") setLesson(id);
    return;
  }
  pageView =
    location.hash === "#progress"
      ? "progress"
      : location.hash === "#reference"
        ? "reference"
        : "start";
  render();
});
render();
