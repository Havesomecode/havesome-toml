import { parse, TomlDate, TomlError, type TomlTable } from "smol-toml";

export interface ParseRow {
  path: string;
  type: string;
  value: unknown;
}

export interface ParseResult {
  ok: boolean;
  version: "TOML 1.1";
  data: Record<string, unknown>;
  rows: ParseRow[];
  stale: boolean;
  error?: { line: number; column: number; message: string };
}

export type FormatResult =
  | { ok: true; source: string }
  | {
      ok: false;
      error: { line: number; column: number; message: string };
    };

interface ValidationIssue {
  index: number;
  message: string;
}

function valueType(
  value: unknown,
  path: readonly string[],
  inlineTables: ReadonlySet<string>,
): string {
  if (value instanceof TomlDate) {
    if (value.isTime()) return "local time";
    if (value.isDate()) return "local date";
    if (value.isLocal()) return "local date-time";
    return "offset date-time";
  }
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") {
    const inline = path.some((_, index) =>
      inlineTables.has(JSON.stringify(path.slice(0, index + 1))),
    );
    return inline ? "inline table" : "table";
  }
  if (typeof value === "bigint") return "integer";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer" : "float";
  return typeof value;
}

function displayKey(key: string): string {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
}

function flatten(
  table: Record<string, unknown>,
  inlineTables: ReadonlySet<string>,
  prefix = "",
  segments: readonly string[] = [],
): ParseRow[] {
  return Object.entries(table).flatMap(([key, value]) => {
    const shownKey = displayKey(key);
    const path = prefix ? `${prefix}.${shownKey}` : shownKey;
    const pathSegments = [...segments, key];
    const row = {
      path,
      type: valueType(value, pathSegments, inlineTables),
      value: toDisplaySafeData(value),
    };
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof TomlDate)
    ) {
      return [
        row,
        ...flatten(
          value as Record<string, unknown>,
          inlineTables,
          path,
          pathSegments,
        ),
      ];
    }
    return [row];
  });
}

function toDisplaySafeData(value: unknown): unknown {
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isSafeInteger(numeric) ? numeric : value.toString();
  }
  if (value instanceof TomlDate) return value;
  if (Array.isArray(value)) return value.map(toDisplaySafeData);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        toDisplaySafeData(nested),
      ]),
    );
  }
  return value;
}

function normalizeMessage(
  source: string,
  line: number,
  message: string,
): string {
  const text = source.split(/\r?\n/)[line - 1] ?? "";
  if (/=\s*(?:#.*)?$/.test(text)) return "expected a value after `=`";
  return message.replace(/^.*?:\s*/, "").replace(/\.$/, "");
}

function maskStringsAndComments(source: string): string {
  const masked = source.split("");
  let index = 0;

  while (index < source.length) {
    const character = source[index]!;
    if (character === "#") {
      while (index < source.length && source[index] !== "\n") {
        masked[index] = " ";
        index += 1;
      }
      continue;
    }
    if (character !== '"' && character !== "'") {
      index += 1;
      continue;
    }

    const quote = character;
    const multiline = source.slice(index, index + 3) === quote.repeat(3);
    const delimiterLength = multiline ? 3 : 1;
    for (let offset = 0; offset < delimiterLength; offset += 1)
      masked[index + offset] = " ";
    index += delimiterLength;

    while (index < source.length) {
      if (source[index] === "\n") {
        if (!multiline) break;
        index += 1;
        continue;
      }
      if (
        source.slice(index, index + delimiterLength) ===
        quote.repeat(delimiterLength)
      ) {
        for (let offset = 0; offset < delimiterLength; offset += 1)
          masked[index + offset] = " ";
        index += delimiterLength;
        break;
      }
      masked[index] = " ";
      if (quote === '"' && source[index] === "\\") {
        index += 1;
        if (index < source.length && source[index] !== "\n")
          masked[index] = " ";
      }
      index += 1;
    }
  }

  return masked.join("");
}

const keyMarker = "__havesome_toml_key_marker__";

function findKeyPath(
  value: unknown,
  path: string[] = [],
): string[] | undefined {
  if (value === keyMarker) return path;
  if (value === null || typeof value !== "object") return undefined;
  for (const [key, nested] of Object.entries(value)) {
    const found = findKeyPath(nested, [...path, key]);
    if (found) return found;
  }
  return undefined;
}

function parseKeyPath(source: string): string[] {
  try {
    const parsed = parse(`${source} = "${keyMarker}"`) as TomlTable;
    return findKeyPath(parsed) ?? [];
  } catch {
    return [];
  }
}

function findInlineTables(source: string): Set<string> {
  const roots = new Set<string>();
  const maskedLines = maskStringsAndComments(source).split(/\r?\n/);
  const sourceLines = source.split(/\r?\n/);
  let header: string[] = [];
  for (let index = 0; index < maskedLines.length; index += 1) {
    const masked = maskedLines[index]!;
    const original = sourceLines[index]!;
    const trimmed = masked.trim();
    if (!trimmed) continue;
    const offset = masked.indexOf(trimmed);
    const arrayHeader = trimmed.startsWith("[[") && trimmed.endsWith("]]");
    const tableHeader = trimmed.startsWith("[") && trimmed.endsWith("]");
    if (arrayHeader || tableHeader) {
      const brackets = arrayHeader ? 2 : 1;
      const raw = original.slice(
        offset + brackets,
        offset + trimmed.length - brackets,
      );
      header = parseKeyPath(raw);
      continue;
    }
    const equals = masked.indexOf("=");
    if (equals === -1) continue;
    if (
      !masked
        .slice(equals + 1)
        .trimStart()
        .startsWith("{")
    )
      continue;
    const key = parseKeyPath(original.slice(0, equals).trim());
    if (key.length) roots.add(JSON.stringify([...header, ...key]));
  }
  return roots;
}

function isValueRegion(source: string, index: number): boolean {
  const entryStart =
    Math.max(
      source.lastIndexOf("\n", index - 1),
      source.lastIndexOf("{", index - 1),
      source.lastIndexOf(",", index - 1),
    ) + 1;
  const before = source.slice(entryStart, index);
  if (before.includes("=")) return true;
  if (before.trimStart().startsWith("[")) return false;

  const entryEndCandidates = ["\n", ",", "}"].map((delimiter) => {
    const position = source.indexOf(delimiter, index);
    return position === -1 ? source.length : position;
  });
  const entryEnd = Math.min(...entryEndCandidates);
  return !source.slice(index, entryEnd).includes("=");
}

function findValidationIssue(source: string): ValidationIssue | undefined {
  for (let index = 0; index < source.length; index += 1) {
    const code = source.charCodeAt(index);
    const forbidden =
      code <= 8 ||
      code === 11 ||
      code === 12 ||
      (code >= 14 && code <= 31) ||
      code === 127 ||
      (code === 13 && source.charCodeAt(index + 1) !== 10);
    if (forbidden) return { index, message: "invalid control character" };
  }

  const visibleSyntax = maskStringsAndComments(source);
  const datePattern = /(?<![\w-])(\d{4})-(\d{2})-(\d{2})(?=$|[Tt \t,\]}\r\n])/g;
  for (const match of visibleSyntax.matchAll(datePattern)) {
    if (!isValueRegion(visibleSyntax, match.index)) continue;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [
      31,
      leapYear ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]!)
      return { index: match.index, message: "invalid calendar date" };
  }
  return undefined;
}

function issueLocation(
  source: string,
  index: number,
): { line: number; column: number } {
  const before = source.slice(0, index);
  const lines = before.split(/\r?\n/);
  return { line: lines.length, column: lines.at(-1)!.length + 1 };
}

export function parseDocument(
  source: string,
  lastValid: Pick<ParseResult, "data" | "rows"> = { data: {}, rows: [] },
): ParseResult {
  const normalizedSource = source.startsWith("\uFEFF")
    ? source.slice(1)
    : source;
  const issue = findValidationIssue(normalizedSource);
  if (issue) {
    return {
      ok: false,
      version: "TOML 1.1",
      data: lastValid.data,
      rows: lastValid.rows,
      stale: Object.keys(lastValid.data).length > 0,
      error: {
        ...issueLocation(normalizedSource, issue.index),
        message: issue.message,
      },
    };
  }
  try {
    const data = parse(normalizedSource, {
      integersAsBigInt: true,
    }) as TomlTable;
    const plain = toDisplaySafeData(data) as Record<string, unknown>;
    return {
      ok: true,
      version: "TOML 1.1",
      data: plain,
      rows: flatten(
        data as Record<string, unknown>,
        findInlineTables(normalizedSource),
      ),
      stale: false,
    };
  } catch (cause) {
    const error = cause instanceof TomlError ? cause : undefined;
    const line = error?.line ?? 1;
    const lineText = normalizedSource.split(/\r?\n/)[line - 1] ?? "";
    const missingValue = /=\s*(?:#.*)?$/.test(lineText);
    return {
      ok: false,
      version: "TOML 1.1",
      data: lastValid.data,
      rows: lastValid.rows,
      stale: Object.keys(lastValid.data).length > 0,
      error: {
        line,
        column: missingValue ? lineText.indexOf("=") + 2 : (error?.column ?? 1),
        message: normalizeMessage(
          normalizedSource,
          line,
          error?.message ?? "invalid TOML",
        ),
      },
    };
  }
}

export function formatDocument(
  source: string,
  formatSource: (source: string) => string,
): FormatResult {
  const validation = parseDocument(source);
  if (!validation.ok) return { ok: false, error: validation.error! };

  try {
    const formatted = formatSource(source);
    const verification = parseDocument(formatted);
    if (!verification.ok) {
      return {
        ok: false,
        error: {
          line: verification.error!.line,
          column: verification.error!.column,
          message: "formatter produced invalid TOML",
        },
      };
    }
    return { ok: true, source: formatted };
  } catch {
    return {
      ok: false,
      error: {
        line: 1,
        column: 1,
        message: "formatter could not format this TOML document",
      },
    };
  }
}
