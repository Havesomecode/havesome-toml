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

interface ValidationIssue {
  index: number;
  message: string;
}

function valueType(value: unknown): string {
  if (value instanceof TomlDate) {
    if (value.isTime()) return "local time";
    if (value.isDate()) return "local date";
    if (value.isLocal()) return "local date-time";
    return "offset date-time";
  }
  if (Array.isArray(value)) return "array";
  if (value !== null && typeof value === "object") return "inline table";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer" : "float";
  return typeof value;
}

function flatten(table: Record<string, unknown>, prefix = ""): ParseRow[] {
  return Object.entries(table).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const row = { path, type: valueType(value), value };
    if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof TomlDate)
    ) {
      return [row, ...flatten(value as Record<string, unknown>, path)];
    }
    return [row];
  });
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
  lastValid: Record<string, unknown> = {},
): ParseResult {
  const issue = findValidationIssue(source);
  if (issue) {
    return {
      ok: false,
      version: "TOML 1.1",
      data: lastValid,
      rows: flatten(lastValid),
      stale: Object.keys(lastValid).length > 0,
      error: { ...issueLocation(source, issue.index), message: issue.message },
    };
  }
  try {
    const data = parse(source) as TomlTable;
    const plain = data as Record<string, unknown>;
    return {
      ok: true,
      version: "TOML 1.1",
      data: plain,
      rows: flatten(plain),
      stale: false,
    };
  } catch (cause) {
    const error = cause instanceof TomlError ? cause : undefined;
    const line = error?.line ?? 1;
    const lineText = source.split(/\r?\n/)[line - 1] ?? "";
    const missingValue = /=\s*(?:#.*)?$/.test(lineText);
    return {
      ok: false,
      version: "TOML 1.1",
      data: lastValid,
      rows: flatten(lastValid),
      stale: Object.keys(lastValid).length > 0,
      error: {
        line,
        column: missingValue ? lineText.indexOf("=") + 2 : (error?.column ?? 1),
        message: normalizeMessage(
          source,
          line,
          error?.message ?? "invalid TOML",
        ),
      },
    };
  }
}
