import { parseDocument } from "./toml.ts";

export type LessonKind =
  | "editor"
  | "types"
  | "tables"
  | "arrays"
  | "nodes"
  | "dates"
  | "repair"
  | "schema"
  | "terminal"
  | "debug"
  | "capstone";

export interface Lesson {
  id: number;
  slug: string;
  title: string;
  objective: string;
  prompt: string;
  kind: LessonKind;
  starter: string;
}

export const lessons: Lesson[] = [
  {
    id: 1,
    slug: "orientation",
    title: "Orientation",
    objective: "Connect text to structure",
    prompt: "Change `private` to false, then check the structure.",
    kind: "editor",
    starter: 'name = "TOML Lab"\nprivate = true\nversion = "1.1"',
  },
  {
    id: 2,
    slug: "types",
    title: "Keys and values",
    objective: "Match six TOML value types",
    prompt: "Repair each value to match its type chip.",
    kind: "types",
    starter:
      'name = Lab\nretries = "3"\nratio = 1.5\nprivate = True\ntags = ["toml", "lab"]\nowner = { name = "Ada" }',
  },
  {
    id: 3,
    slug: "tables",
    title: "Tables",
    objective: "Fit fields into table boundaries",
    prompt: "Move each field into the table that owns it.",
    kind: "tables",
    starter:
      '[package]\nname = "tactile"\nversion = "1.0.0"\n\n[repository]\nurl = "https://example.invalid"\nbranch = "main"',
  },
  {
    id: 4,
    slug: "arrays",
    title: "Arrays and records",
    objective: "Build ordered arrays and records",
    prompt: "Order dependencies and add the third contributor.",
    kind: "arrays",
    starter:
      'dependencies = ["vite", "smol-toml"]\n\n[[contributors]]\nname = "Ada"\n\n[[contributors]]\nname = "Lin"',
  },
  {
    id: 5,
    slug: "dotted-keys",
    title: "Dotted keys",
    objective: "Connect an equivalent nested path",
    prompt: "Build `server.tls.enabled`, then compare both forms.",
    kind: "nodes",
    starter: "server.tls.enabled = true",
  },
  {
    id: 6,
    slug: "dates",
    title: "Dates and times",
    objective: "Classify literal date and time types",
    prompt: "Match each literal without changing its time zone.",
    kind: "dates",
    starter:
      "published = 2025-12-18\nopens = 10:30:00\nbuild = 2025-12-18T10:30:00\nreleased = 2025-12-18T10:30:00Z",
  },
  {
    id: 7,
    slug: "strings",
    title: "Strings and escapes",
    objective: "Repair delimiters and escapes",
    prompt: "Repair each string and preserve its intended output.",
    kind: "repair",
    starter:
      'title = "TOML lab"\npath = \'C:\\Users\\lab\'\nmessage = """\nLine one\nLine two"""\nescape = "tab\\tstop"',
  },
  {
    id: 8,
    slug: "schema",
    title: "Schema contracts",
    objective: "Fit paths to four constraints",
    prompt: "Repair the two failing values, then validate.",
    kind: "schema",
    starter:
      '[project]\nname = "lab"\nlicense = "GPL"\nretries = 12\nprivate = false',
  },
  {
    id: 9,
    slug: "terminal",
    title: "Terminal workflow",
    objective: "Inspect, validate, stage, confirm",
    prompt: "Run the four safe commands in order.",
    kind: "terminal",
    starter: "private = false",
  },
  {
    id: 10,
    slug: "debug",
    title: "Debug challenge",
    objective: "Repair four faults from evidence",
    prompt: "Use checks and hints; extra checks stay available.",
    kind: "debug",
    starter:
      'name = "lab"\nname = "duplicate"\nprivate = True\nretries = 01\nowner = ',
  },
  {
    id: 11,
    slug: "capstone",
    title: "Capstone",
    objective: "Ship a tested TOML configuration",
    prompt: "Choose a goal, pass its tests, then export.",
    kind: "capstone",
    starter: "# Build a release configuration\n",
  },
];

export interface TerminalState {
  modified: boolean;
  valid: boolean;
  staged: boolean;
  steps: string[];
}

const commands = {
  "git diff -- config.toml": {
    step: "diff",
    output: "diff --git a/config.toml b/config.toml\n+private = false",
  },
  "taplo check config.toml": {
    step: "check",
    output: "config.toml: valid TOML",
  },
  "git add config.toml": { step: "stage", output: "config.toml staged" },
  "git status --short": { step: "status", output: "M  config.toml" },
} as const;

export function runPracticeCommand(
  command: string,
  state: TerminalState,
): { state: TerminalState; output: string; ok: boolean } {
  const clean = command.trim();
  if (clean === "help")
    return { state, output: Object.keys(commands).join("\n"), ok: true };
  const entry = commands[clean as keyof typeof commands];
  if (!entry)
    return {
      state,
      output: "Unavailable in this practice terminal. Type help.",
      ok: false,
    };

  const expected = ["diff", "check", "stage", "status"][state.steps.length];
  if (entry.step !== expected && !state.steps.includes(entry.step)) {
    return {
      state,
      output: `Run ${expected ?? "the workflow"} first.`,
      ok: false,
    };
  }
  if (entry.step === "check" && !state.valid)
    return { state, output: "config.toml: validation failed", ok: false };

  const steps = state.steps.includes(entry.step)
    ? state.steps
    : [...state.steps, entry.step];
  return {
    ok: true,
    output: entry.output,
    state: { ...state, staged: entry.step === "stage" || state.staged, steps },
  };
}

export interface TestResult {
  label: string;
  pass: boolean;
  detail: string;
}

const goalPaths: Record<
  string,
  {
    root: string;
    required: string;
    array: string;
    enumKey: string;
    enumValues: string[];
  }
> = {
  release: {
    root: "release",
    required: "enabled",
    array: "targets",
    enumKey: "channel",
    enumValues: ["stable", "beta"],
  },
  docs: {
    root: "docs",
    required: "enabled",
    array: "formats",
    enumKey: "fail_on",
    enumValues: ["warning", "error"],
  },
  dependabot: {
    root: "updates",
    required: "enabled",
    array: "ecosystems",
    enumKey: "interval",
    enumValues: ["daily", "weekly"],
  },
};

export const capstoneStarters: Record<string, string> = {
  release:
    '[release]\nenabled = true\ntargets = ["macos", "linux"]\nchannel = "stable"',
  docs: '[docs]\nenabled = true\nformats = ["markdown", "links"]\nfail_on = "warning"',
  dependabot:
    '[updates]\nenabled = true\necosystems = ["npm", "github-actions"]\ninterval = "weekly"',
};

export function runCapstoneTests(source: string, goal: string): TestResult[] {
  const contract = goalPaths[goal] ?? goalPaths.release!;
  const parsed = parseDocument(source);
  const root = parsed.ok
    ? (parsed.data[contract.root] as Record<string, unknown> | undefined)
    : undefined;
  const array = root?.[contract.array];
  const enumValue = root?.[contract.enumKey];
  return [
    {
      label: "Parses",
      pass: parsed.ok,
      detail: parsed.ok
        ? "Valid TOML."
        : `Line ${parsed.error?.line ?? 1}: ${parsed.error?.message ?? "invalid TOML"}`,
    },
    {
      label: `${contract.root} table`,
      pass: !!root,
      detail: root
        ? `${contract.root}: table found.`
        : `${contract.root}: table is required.`,
    },
    {
      label: `${contract.required} boolean`,
      pass: typeof root?.[contract.required] === "boolean",
      detail: `${contract.root}.${contract.required}: expected boolean.`,
    },
    {
      label: `${contract.array} list`,
      pass: Array.isArray(array) && array.length > 0,
      detail: `${contract.root}.${contract.array}: non-empty array is required.`,
    },
    {
      label: `${contract.enumKey} value`,
      pass:
        typeof enumValue === "string" &&
        contract.enumValues.includes(enumValue),
      detail: `${contract.root}.${contract.enumKey}: expected ${contract.enumValues.join(" or ")}.`,
    },
  ];
}
