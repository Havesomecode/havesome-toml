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

export function parseDocument(
  source: string,
  lastValid: Record<string, unknown> = {},
): ParseResult {
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
