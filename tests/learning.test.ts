import { describe, expect, it } from "vitest";
import {
  applyTablePlacement,
  buildArraySource,
  canExportCapstone,
  capstoneStarters,
  createTablePlacements,
  lessons,
  lessonPasses,
  runCapstoneTests,
  runPracticeCommand,
  type TerminalState,
} from "../src/learning.ts";

describe("learning journey", () => {
  it("defines the 11 contracted milestones in order with concise interaction copy", () => {
    expect(lessons).toHaveLength(11);
    expect(lessons.map((lesson) => lesson.title)).toEqual([
      "Orientation",
      "Keys and values",
      "Tables",
      "Arrays and records",
      "Dotted keys",
      "Dates and times",
      "Strings and escapes",
      "Schema contracts",
      "Terminal workflow",
      "Debug challenge",
      "Capstone",
    ]);
    for (const lesson of lessons) {
      expect(lesson.objective.split(/\s+/).length).toBeLessThanOrEqual(10);
      expect(lesson.objective.length).toBeLessThanOrEqual(72);
      expect(lesson.prompt.length).toBeLessThanOrEqual(120);
      expect(lesson.prompt.split(/\s+/).length).toBeLessThanOrEqual(18);
    }
  });

  it("serializes table placement into the canonical TOML source", () => {
    const starter = lessons[2]!.starter;
    const placements = createTablePlacements();
    expect(lessonPasses(3, starter, false)).toBe(false);

    const nameMoved = applyTablePlacement(placements, "name", "package");
    const versionMoved = applyTablePlacement(nameMoved, "version", "package");
    const urlMoved = applyTablePlacement(versionMoved, "url", "repository");
    const completed = applyTablePlacement(urlMoved, "branch", "repository");

    expect(completed.source).toBe(
      '[package]\nname = "tactile"\nversion = "1.0.0"\n\n[repository]\nurl = "https://example.invalid"\nbranch = "main"',
    );
    expect(lessonPasses(3, completed.source, true)).toBe(true);
  });

  it("serializes array reordering and records before lesson 4 can pass", () => {
    expect(lessonPasses(4, lessons[3]!.starter, false)).toBe(false);
    const source = buildArraySource(
      ["smol-toml", "vite"],
      ["Ada", "Lin", "Contributor 3"],
    );
    expect(source).toContain('dependencies = ["smol-toml", "vite"]');
    expect(source.match(/\[\[contributors\]\]/g)).toHaveLength(3);
    expect(lessonPasses(4, source, true)).toBe(true);
  });

  it("requires learner-authored canonical TOML for lessons 5 through 7", () => {
    for (const id of [5, 6, 7]) {
      expect(lessonPasses(id, lessons[id - 1]!.starter, false)).toBe(false);
    }
    expect(lessonPasses(5, "server.tls.enabled = true", true)).toBe(true);
    const classifiedDates =
      'date = 2025-12-18 # type: local date\ntime = 10:30:00 # type: local time\nlocal = 2025-12-18T10:30:00 # type: local date-time\noffset = 2025-12-18T10:30:00Z # type: offset date-time\nbirthday = 1990-01-02 # type: local date\nclose = 17:45:00 # type: local time\nmeeting = 2025-12-19T09:15:00 # type: local date-time\nrepair_me = "2025-13-01" # type: local date';
    expect(lessonPasses(6, classifiedDates, true)).toBe(false);
    expect(
      lessonPasses(
        6,
        classifiedDates.replace('"2025-13-01"', "2025-12-01"),
        true,
      ),
    ).toBe(true);
    expect(
      lessonPasses(
        7,
        'basic = "Line\\nBreak"\nliteral = \'C:\\\\Users\'\nmultiline = """three"""\nraw = \'\'\'four\'\'\'\nescaped = "\\x41\\e"',
        true,
      ),
    ).toBe(true);
  });
});

describe("practice terminal", () => {
  const initial: TerminalState = {
    modified: true,
    valid: true,
    staged: false,
    steps: [],
  };

  it("runs only the safe workflow and updates deterministic state", () => {
    const diff = runPracticeCommand("git diff -- config.toml", initial);
    expect(diff.ok).toBe(true);
    expect(diff.output).toContain("+private = false");

    const checked = runPracticeCommand("taplo check config.toml", diff.state);
    const staged = runPracticeCommand("git add config.toml", checked.state);
    const status = runPracticeCommand("git status --short", staged.state);
    expect(status.output).toContain("M  config.toml");
    expect(status.state.steps).toEqual(["diff", "check", "stage", "status"]);
  });

  it("rejects real or out-of-scope commands without changing state", () => {
    const result = runPracticeCommand("git push", initial);
    expect(result).toMatchObject({ ok: false, state: initial });
    expect(result.output).toBe(
      "Unavailable in this practice terminal. Type help.",
    );
  });
});

describe("capstone tests", () => {
  it("keeps goal starters as incomplete scaffolds and requires learner construction", () => {
    for (const [goal, starter] of Object.entries(capstoneStarters)) {
      expect(
        runCapstoneTests(starter, goal).every((result) => result.pass),
      ).toBe(false);
      expect(canExportCapstone(starter, goal, false)).toBe(false);
    }
    const complete =
      '[release]\nenabled = true\ntargets = ["macos", "linux"]\nchannel = "stable"';
    expect(canExportCapstone(complete, "release", false)).toBe(false);
    expect(canExportCapstone(complete, "release", true)).toBe(true);
  });

  it("proves parse, structure, types, values, and workflow expectations", () => {
    const passing = runCapstoneTests(
      `[release]\nenabled = true\ntargets = ["macos", "linux"]\nchannel = "stable"`,
      "release",
    );
    expect(passing).toHaveLength(5);
    expect(passing.every((test) => test.pass)).toBe(true);

    const failing = runCapstoneTests('[release]\nenabled = "yes"', "release");
    expect(
      failing.some(
        (test) => !test.pass && test.detail.includes("release.targets"),
      ),
    ).toBe(true);
  });
});
