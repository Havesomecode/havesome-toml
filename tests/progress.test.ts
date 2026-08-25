import { describe, expect, it } from "vitest";
import {
  initialProgress,
  isLessonUnlocked,
  launchLessonId,
  loadProgress,
  saveProgress,
} from "../src/progress.ts";

function memoryStorage(seed?: string) {
  let value = seed ?? null;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
    value: () => value,
  };
}

describe("local progress", () => {
  it("restores the selected lesson, authored draft, and completion", () => {
    const storage = memoryStorage();
    const state = {
      ...initialProgress,
      current: 4,
      completed: [1, 2, 3],
      drafts: { "4": "items = [1, 2]" },
      lessons: {
        "4": {
          source: "items = [1, 2]",
          hintLevel: 2,
          checked: true,
          interacted: true,
          manipulation: {
            tiles: [
              { name: "name", table: "loose" },
              { name: "version", table: "loose" },
            ],
            dependencies: ["vite", "smol-toml"],
            contributors: ["Ada", "Lin", "Sam"],
            nodes: [],
          },
        },
      },
      capstone: { goal: "docs", source: "# docs scaffold", interacted: true },
    };
    saveProgress(storage, state);
    expect(loadProgress(storage)).toMatchObject({
      state,
      stale: false,
      failed: false,
    });
  });

  it("starts with milestones 1 and 2 available while keeping later lessons sequential", () => {
    expect(isLessonUnlocked(1, [])).toBe(true);
    expect(isLessonUnlocked(2, [])).toBe(true);
    expect(isLessonUnlocked(3, [])).toBe(false);
    expect(isLessonUnlocked(4, [1, 2])).toBe(false);
    expect(isLessonUnlocked(4, [1, 2, 3])).toBe(true);
    expect(isLessonUnlocked(10, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(true);
    expect(isLessonUnlocked(11, [1, 2, 3, 4, 5, 6, 7, 8])).toBe(false);
    expect(isLessonUnlocked(11, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(true);
    expect(isLessonUnlocked(11, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).toBe(true);
  });

  it("resumes an available current lesson or the first incomplete available lesson", () => {
    expect(launchLessonId(7, [1, 2, 3, 4, 5, 6])).toBe(7);
    expect(launchLessonId(7, [])).toBe(1);
    expect(launchLessonId(1, [1])).toBe(2);
  });

  it("marks prior contract versions stale without erasing drafts", () => {
    const storage = memoryStorage(
      JSON.stringify({
        version: 1,
        current: 2,
        completed: [1],
        drafts: { "2": 'name = "Ada"' },
      }),
    );
    const result = loadProgress(storage);
    expect(result.stale).toBe(true);
    expect(result.state.drafts["2"]).toBe('name = "Ada"');
  });

  it("recovers with a warning instead of loading a non-string draft", () => {
    const storage = memoryStorage(
      JSON.stringify({
        ...initialProgress,
        drafts: { "1": 42 },
      }),
    );

    expect(loadProgress(storage)).toEqual({
      state: initialProgress,
      stale: false,
      failed: false,
      recovered: true,
    });
  });

  it.each([
    [
      "non-string source",
      { source: 42, hintLevel: 0, checked: false, interacted: true },
    ],
    ["incomplete record", { source: 'name = "Ada"' }],
  ])("recovers instead of loading a lesson with %s", (_label, lesson) => {
    const storage = memoryStorage(
      JSON.stringify({
        ...initialProgress,
        lessons: { "1": lesson },
      }),
    );

    expect(loadProgress(storage)).toMatchObject({
      state: initialProgress,
      failed: false,
      recovered: true,
    });
  });

  it.each([
    ["non-string source", { goal: "release", source: 42, interacted: true }],
    ["incomplete record", { goal: "release", source: "enabled = true" }],
  ])("recovers instead of loading a capstone with %s", (_label, capstone) => {
    const storage = memoryStorage(
      JSON.stringify({
        ...initialProgress,
        capstone,
      }),
    );

    expect(loadProgress(storage)).toMatchObject({
      state: initialProgress,
      failed: false,
      recovered: true,
    });
  });

  it.each([
    [
      "manipulation",
      {
        source: 'name = "Ada"',
        hintLevel: 0,
        checked: false,
        interacted: true,
        manipulation: { tiles: 42 },
      },
    ],
    [
      "terminal",
      {
        hintLevel: 0,
        checked: false,
        interacted: true,
        terminal: { modified: true },
      },
    ],
  ])(
    "recovers instead of loading malformed nested %s state",
    (_label, lesson) => {
      const storage = memoryStorage(
        JSON.stringify({
          ...initialProgress,
          lessons: { "1": lesson },
        }),
      );

      expect(loadProgress(storage)).toMatchObject({
        state: initialProgress,
        failed: false,
        recovered: true,
      });
    },
  );

  it.each(["lessons", "capstone"] as const)(
    "recovers instead of loading current progress missing %s",
    (missing) => {
      const corrupted: Record<string, unknown> = { ...initialProgress };
      delete corrupted[missing];
      const storage = memoryStorage(JSON.stringify(corrupted));

      expect(loadProgress(storage)).toMatchObject({
        state: initialProgress,
        failed: false,
        recovered: true,
      });
    },
  );

  it("continues safely when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    expect(loadProgress(storage).failed).toBe(true);
    expect(saveProgress(storage, initialProgress).failed).toBe(true);
  });
});
