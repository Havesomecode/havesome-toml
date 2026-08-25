export interface LessonProgress {
  source?: string;
  lastValidSource?: string;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

function hasOnlyLessonIds(record: Record<string, unknown>): boolean {
  return Object.keys(record).every((key) => {
    const id = Number(key);
    return Number.isInteger(id) && id >= 1 && id <= 11 && String(id) === key;
  });
}

function isManipulationProgress(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.tiles)) return false;
  return (
    value.tiles.every(
      (tile) =>
        isRecord(tile) &&
        typeof tile.name === "string" &&
        typeof tile.table === "string",
    ) &&
    isStringArray(value.dependencies) &&
    isStringArray(value.contributors) &&
    isStringArray(value.nodes)
  );
}

function isTerminalProgress(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.modified === "boolean" &&
    typeof value.valid === "boolean" &&
    typeof value.staged === "boolean" &&
    isStringArray(value.steps)
  );
}

function isLessonProgress(value: unknown): value is LessonProgress {
  if (!isRecord(value)) return false;
  return (
    (value.source === undefined || typeof value.source === "string") &&
    (value.lastValidSource === undefined ||
      typeof value.lastValidSource === "string") &&
    Number.isInteger(value.hintLevel) &&
    (value.hintLevel as number) >= 0 &&
    typeof value.checked === "boolean" &&
    (value.feedback === undefined || typeof value.feedback === "string") &&
    (value.feedbackKind === undefined ||
      ["neutral", "success", "error"].includes(value.feedbackKind as string)) &&
    typeof value.interacted === "boolean" &&
    (value.manipulation === undefined ||
      isManipulationProgress(value.manipulation)) &&
    (value.terminal === undefined || isTerminalProgress(value.terminal))
  );
}

function isCapstoneProgress(value: unknown): value is CapstoneProgress {
  if (!isRecord(value)) return false;
  return (
    ["release", "docs", "dependabot"].includes(value.goal as string) &&
    typeof value.source === "string" &&
    typeof value.interacted === "boolean"
  );
}

function coerce(value: unknown): ProgressState {
  if (!isRecord(value) || !isRecord(value.drafts))
    throw new Error("Invalid saved progress");
  const raw = value as Partial<ProgressState>;
  if (
    !hasOnlyLessonIds(value.drafts) ||
    !Object.values(value.drafts).every((draft) => typeof draft === "string")
  )
    throw new Error("Invalid saved draft");
  if (
    !Number.isInteger(raw.version) ||
    (raw.version as number) < 1 ||
    (raw.version as number) > initialProgress.version
  )
    throw new Error("Invalid saved version");
  const currentContract = raw.version === initialProgress.version;
  if (
    currentContract &&
    (!Number.isInteger(raw.current) ||
      (raw.current as number) < 1 ||
      (raw.current as number) > 11 ||
      !Array.isArray(raw.completed) ||
      !raw.completed.every(
        (id) => Number.isInteger(id) && id >= 1 && id <= 11,
      ) ||
      !isRecord(raw.lessons) ||
      !isCapstoneProgress(raw.capstone) ||
      typeof raw.updatedAt !== "number" ||
      !Number.isFinite(raw.updatedAt) ||
      raw.updatedAt < 0)
  )
    throw new Error("Incomplete saved progress");
  const drafts = value.drafts as Record<string, string>;
  let lessons: Record<string, LessonProgress>;
  if (isRecord(raw.lessons)) {
    if (
      !hasOnlyLessonIds(raw.lessons) ||
      !Object.values(raw.lessons).every(isLessonProgress)
    )
      throw new Error("Invalid saved lesson");
    lessons = raw.lessons as Record<string, LessonProgress>;
  } else {
    lessons = Object.fromEntries(
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
  }
  const capstone =
    raw.capstone === undefined
      ? currentContract
        ? undefined
        : initialProgress.capstone
      : isCapstoneProgress(raw.capstone)
        ? raw.capstone
        : undefined;
  if (!capstone) throw new Error("Invalid saved capstone");
  return {
    version: raw.version as number,
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
    capstone,
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
  recovered: boolean;
} {
  let saved: string | null;
  try {
    saved = storage.getItem(PROGRESS_KEY);
  } catch {
    return {
      state: { ...initialProgress },
      stale: false,
      failed: true,
      recovered: false,
    };
  }
  if (!saved)
    return {
      state: { ...initialProgress },
      stale: false,
      failed: false,
      recovered: false,
    };
  try {
    const state = coerce(JSON.parse(saved));
    const stale = state.version !== initialProgress.version;
    return {
      state: { ...state, version: initialProgress.version },
      stale,
      failed: false,
      recovered: false,
    };
  } catch {
    return {
      state: { ...initialProgress },
      stale: false,
      failed: false,
      recovered: true,
    };
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
