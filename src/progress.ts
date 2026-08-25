export interface LessonProgress {
  source?: string;
  hintLevel: number;
  checked: boolean;
  feedback?: string;
  feedbackKind?: "neutral" | "success" | "error";
  interacted: boolean;
  manipulation?: Record<string, unknown>;
  terminal?: Record<string, unknown>;
}

export interface CapstoneProgress {
  goal: string;
  source: string;
  interacted: boolean;
}

export interface ProgressState {
  version: number;
  current: number;
  completed: number[];
  drafts: Record<string, string>;
  lessons: Record<string, LessonProgress>;
  capstone: CapstoneProgress;
  updatedAt: number;
}

export const PROGRESS_KEY = "havesome-toml:progress";
export const initialProgress: ProgressState = {
  version: 3,
  current: 1,
  completed: [],
  drafts: {},
  lessons: {},
  capstone: {
    goal: "release",
    source:
      "# Build a release configuration\n[release]\n# enabled =\n# targets =\n# channel =",
    interacted: false,
  },
  updatedAt: 0,
};

function coerce(value: unknown): ProgressState {
  const raw =
    value && typeof value === "object" ? (value as Partial<ProgressState>) : {};
  const drafts = raw.drafts && typeof raw.drafts === "object" ? raw.drafts : {};
  const lessons =
    raw.lessons && typeof raw.lessons === "object"
      ? raw.lessons
      : Object.fromEntries(
          Object.entries(drafts).map(([id, source]) => [
            id,
            {
              source,
              hintLevel: 0,
              checked: false,
              interacted: source.length > 0,
            },
          ]),
        );
  return {
    version: typeof raw.version === "number" ? raw.version : 1,
    current:
      typeof raw.current === "number" && raw.current >= 1 && raw.current <= 11
        ? raw.current
        : 1,
    completed: Array.isArray(raw.completed)
      ? raw.completed.filter(
          (id): id is number => Number.isInteger(id) && id >= 1 && id <= 11,
        )
      : [],
    drafts,
    lessons,
    capstone:
      raw.capstone && typeof raw.capstone === "object"
        ? raw.capstone
        : initialProgress.capstone,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
}

export function isLessonUnlocked(id: number, completed: number[]): boolean {
  if (id <= 2) return true;
  if (id === 11)
    return Array.from({ length: 9 }, (_, index) => index + 1).every((lesson) =>
      completed.includes(lesson),
    );
  return completed.includes(id - 1);
}

export function launchLessonId(current: number, completed: number[]): number {
  if (isLessonUnlocked(current, completed) && !completed.includes(current))
    return current;
  return (
    Array.from({ length: 11 }, (_, index) => index + 1).find(
      (id) => !completed.includes(id) && isLessonUnlocked(id, completed),
    ) ?? current
  );
}

export function loadProgress(storage: Pick<Storage, "getItem">): {
  state: ProgressState;
  stale: boolean;
  failed: boolean;
} {
  try {
    const saved = storage.getItem(PROGRESS_KEY);
    if (!saved)
      return { state: { ...initialProgress }, stale: false, failed: false };
    const state = coerce(JSON.parse(saved));
    const stale = state.version !== initialProgress.version;
    return {
      state: { ...state, version: initialProgress.version },
      stale,
      failed: false,
    };
  } catch {
    return { state: { ...initialProgress }, stale: false, failed: true };
  }
}

export function saveProgress(
  storage: Pick<Storage, "setItem">,
  state: ProgressState,
): { state: ProgressState; failed: boolean } {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(state));
    return { state, failed: false };
  } catch {
    return { state, failed: true };
  }
}
