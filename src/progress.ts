export interface ProgressState {
  version: number;
  current: number;
  completed: number[];
  drafts: Record<string, string>;
  updatedAt: number;
}

export const PROGRESS_KEY = "havesome-toml:progress";
export const initialProgress: ProgressState = {
  version: 2,
  current: 1,
  completed: [],
  drafts: {},
  updatedAt: 0,
};

function coerce(value: unknown): ProgressState {
  const raw =
    value && typeof value === "object" ? (value as Partial<ProgressState>) : {};
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
    drafts: raw.drafts && typeof raw.drafts === "object" ? raw.drafts : {},
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
  };
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
