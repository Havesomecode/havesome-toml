import { describe, expect, it } from "vitest";
import {
  lessons,
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
