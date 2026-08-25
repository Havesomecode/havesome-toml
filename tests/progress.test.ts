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
          manipulation: { contributors: ["Ada", "Lin", "Sam"] },
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
