import { describe, expect, it } from "vitest";
import {
  initialProgress,
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
    };
    saveProgress(storage, state);
    expect(loadProgress(storage)).toMatchObject({
      state,
      stale: false,
      failed: false,
    });
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
