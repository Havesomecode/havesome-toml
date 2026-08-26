import "@fontsource/newsreader/600.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import { parse, stringify, TomlDate } from "smol-toml";
import { getTomlSourceFormatter } from "./formatter.ts";
import { icon, type IconName } from "./icons.ts";
import "./styles.css";
import { formatDocument, parseDocument } from "./toml.ts";

type Direction = "toml-json" | "json-toml";
type ConversionKind = "idle" | "success" | "error";

interface Conversion {
  output: string;
  title: string;
  detail: string;
  kind: ConversionKind;
}

const app = document.querySelector<HTMLDivElement>("#app")!;
let direction: Direction = "toml-json";
let source = "";
let announcement = "";
let announcementKind: ConversionKind | undefined;
let formatterLoading = false;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function iconAction(
  name: IconName,
  label: string,
  attribute: string,
  disabled = false,
): string {
  return `<button class="icon-button" type="button" aria-label="${label}" title="${label}" ${attribute} ${disabled ? "disabled" : ""}>${icon(name)}</button>`;
}

type JsonCompatible =
  | string
  | number
  | boolean
  | null
  | JsonCompatible[]
  | { [key: string]: JsonCompatible };

type JsonMapping =
  | { ok: true; value: JsonCompatible }
  | { ok: false; message: string };

function toJsonCompatible(value: unknown, path = "root"): JsonMapping {
  if (typeof value === "bigint") {
    const numeric = Number(value);
    return Number.isSafeInteger(numeric)
      ? { ok: true, value: numeric }
      : {
          ok: false,
          message: `${path} exceeds JSON's safe integer range; use a string to preserve every digit.`,
        };
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return {
        ok: false,
        message: `${path} is a TOML special float and cannot be represented in JSON.`,
      };
    }
    if (Object.is(value, -0)) {
      return {
        ok: false,
        message: `${path} is signed zero; JSON serialization would lose its sign.`,
      };
    }
    return { ok: true, value };
  }
  if (value instanceof TomlDate) return { ok: true, value: value.toJSON() };
  if (typeof value === "string" || typeof value === "boolean") {
    return { ok: true, value };
  }
  if (Array.isArray(value)) {
    const mapped: JsonCompatible[] = [];
    for (const [index, item] of value.entries()) {
      const nested = toJsonCompatible(item, `${path}[${index}]`);
      if (!nested.ok) return nested;
      mapped.push(nested.value);
    }
    return { ok: true, value: mapped };
  }
  if (value !== null && typeof value === "object") {
    const mapped: { [key: string]: JsonCompatible } = {};
    for (const [key, item] of Object.entries(value)) {
      const nested = toJsonCompatible(item, `${path}.${key}`);
      if (!nested.ok) return nested;
      mapped[key] = nested.value;
    }
    return { ok: true, value: mapped };
  }
  return { ok: false, message: `${path} cannot be represented in JSON.` };
}

function jsonNumberIssue(sourceText: string): string | undefined {
  let masked = "";
  let inString = false;
  let escaped = false;
  for (const character of sourceText) {
    if (inString) {
      masked += " ";
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
    } else if (character === '"') {
      inString = true;
      masked += " ";
    } else masked += character;
  }
  const numberPattern = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
  for (const match of masked.matchAll(numberPattern)) {
    const token = match[0];
    const numeric = Number(token);
    if (!Number.isFinite(numeric)) {
      return `${token} exceeds the JSON numeric range supported by this converter.`;
    }
    const mantissa = token.split(/[eE]/, 1)[0]!.replace(/[-.]/g, "");
    if (numeric === 0 && /[1-9]/.test(mantissa)) {
      return `${token} underflows to zero and cannot be converted exactly.`;
    }
    if (Object.is(numeric, -0)) {
      return `${token} is signed zero; TOML serialization would lose its sign.`;
    }
  }
  return undefined;
}

function unsupportedJsonValue(
  value: unknown,
  path = "root",
): string | undefined {
  if (value === null) return `${path} is null; TOML has no null value.`;
  if (typeof value === "number" && !Number.isFinite(value)) {
    return `${path} exceeds the JSON numeric range supported by this converter.`;
  }
  if (typeof value === "number" && Object.is(value, -0)) {
    return `${path} is signed zero; TOML serialization would lose its sign.`;
  }
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    !Number.isSafeInteger(value)
  ) {
    return `${path} exceeds JavaScript's safe integer range; use a JSON string to preserve every digit.`;
  }
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = unsupportedJsonValue(item, `${path}[${index}]`);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(
      value as Record<string, unknown>,
    )) {
      const found = unsupportedJsonValue(item, `${path}.${key}`);
      if (found) return found;
    }
  }
  return undefined;
}

function conversion(): Conversion {
  if (!source.trim()) {
    return {
      output: "",
      title:
        direction === "toml-json"
          ? "Paste TOML to start"
          : "Paste JSON to start",
      detail: "Conversion happens locally as you type.",
      kind: "idle",
    };
  }
  if (direction === "toml-json") {
    const parsed = parseDocument(source);
    if (!parsed.ok) {
      return {
        output: "",
        title: "Invalid TOML",
        detail: `Line ${parsed.error!.line}, column ${parsed.error!.column} · ${parsed.error!.message}`,
        kind: "error",
      };
    }
    const raw = parse(source.replace(/^\uFEFF/, ""), {
      integersAsBigInt: true,
    });
    const mapped = toJsonCompatible(raw);
    if (!mapped.ok) {
      return {
        output: "",
        title: "TOML value cannot be represented in JSON",
        detail: mapped.message,
        kind: "error",
      };
    }
    return {
      output: `${JSON.stringify(mapped.value, null, 2)}\n`,
      title: "JSON ready",
      detail: "Valid TOML 1.1 · dates and times become JSON strings",
      kind: "success",
    };
  }

  try {
    const data = JSON.parse(source) as unknown;
    const numberIssue = jsonNumberIssue(source);
    if (numberIssue) {
      return {
        output: "",
        title: "JSON number cannot be represented in TOML",
        detail: numberIssue,
        kind: "error",
      };
    }
    if (!data || Array.isArray(data) || typeof data !== "object") {
      return {
        output: "",
        title: "Invalid JSON root",
        detail: "TOML documents require a JSON object at the root.",
        kind: "error",
      };
    }
    const unsupported = unsupportedJsonValue(data);
    if (unsupported) {
      return {
        output: "",
        title: "JSON value cannot be represented in TOML",
        detail: unsupported,
        kind: "error",
      };
    }
    const output = `${stringify(data as Record<string, unknown>).trimEnd()}\n`;
    const verified = parseDocument(output);
    if (!verified.ok) {
      return {
        output: "",
        title: "JSON value cannot be represented in TOML",
        detail: verified.error!.message,
        kind: "error",
      };
    }
    return {
      output,
      title: "TOML ready",
      detail: "Valid JSON object",
      kind: "success",
    };
  } catch (cause) {
    return {
      output: "",
      title: "Invalid JSON",
      detail: cause instanceof Error ? cause.message : "Could not parse JSON.",
      kind: "error",
    };
  }
}

function statusMarkup(result: Conversion): string {
  const visibleKind = announcement
    ? (announcementKind ?? result.kind)
    : result.kind;
  const mark =
    visibleKind === "success" ? "✓" : visibleKind === "error" ? "!" : "·";
  return `<section class="converter-status validator-status ${visibleKind}" id="converter-status" role="status" aria-live="polite"><span class="validator-status-mark" aria-hidden="true">${mark}</span><div><strong>${escapeHtml(announcement || result.title)}</strong><span>${escapeHtml(result.detail)}</span></div></section>`;
}

function headerMarkup(): string {
  return `<header class="site-header"><a class="wordmark" href="../" aria-label="HaveSome TOML validator home"><span>{</span> HaveSome TOML <span>}</span></a><nav aria-label="Utility"><a href="../">Validator</a><a href="./" aria-current="page">Converter</a><a href="../#learn">Learn TOML</a><a href="../#reference">Cheat sheet</a><a href="https://toml.io/en/v1.1.0" target="_blank" rel="noreferrer">TOML 1.1 ↗</a></nav></header>`;
}

function render(): void {
  const result = conversion();
  const inputType = direction === "toml-json" ? "TOML" : "JSON";
  const outputType = direction === "toml-json" ? "JSON" : "TOML";
  const canUseInput = Boolean(source.trim());
  const canFormat =
    canUseInput && result.kind === "success" && !formatterLoading;
  const switchLabel =
    direction === "toml-json" ? "Use JSON as input" : "Use TOML as input";
  app.innerHTML = `${headerMarkup()}<main id="main-content" class="converter-page quick-tool" aria-label="TOML and JSON converter">
    <header class="tool-heading"><div><span class="tool-kicker">Bidirectional · private browser tool</span><h1>TOML ↔ JSON converter</h1></div><div class="tool-heading-meta"><p class="privacy-note"><span aria-hidden="true">●</span><strong>Runs entirely in your browser.</strong></p><a href="../">TOML validator</a></div></header>
    <section class="converter-workbench tool-workbench" aria-label="Convert TOML and JSON">
      <section class="converter-pane tool-pane">
        <header class="pane-toolbar"><div class="pane-title"><strong>${inputType} input</strong><span>Live conversion</span></div><div class="icon-toolbar" role="toolbar" aria-label="Input actions">
          ${iconAction("upload", "Open input file", "data-converter-open")}
          ${iconAction("sample", "Load sample", "data-converter-sample")}
          ${iconAction("format", "Format input", `data-converter-format ${formatterLoading ? 'aria-busy="true"' : ""}`, !canFormat)}
          ${iconAction("copy", "Copy input", "data-converter-copy-input", !canUseInput)}
          ${iconAction("trash", "Clear input", "data-converter-clear", !canUseInput)}
        </div></header>
        <label class="visually-hidden" for="converter-file">Open input file</label>
        <input hidden id="converter-file" type="file" accept=".toml,.json,application/json,text/plain" />
        <label class="visually-hidden" for="converter-input">${inputType} input</label>
        <textarea id="converter-input" spellcheck="false" autocapitalize="off" autocomplete="off" aria-describedby="converter-status" placeholder="Paste ${inputType}…">${escapeHtml(source)}</textarea>
        <div class="pane-diagnostics">${statusMarkup(result)}</div>
      </section>
      <div class="converter-switch">${iconAction("swap", switchLabel, "data-converter-switch")}</div>
      <section class="converter-pane tool-pane">
        <header class="pane-toolbar"><div class="pane-title"><strong>${outputType} output</strong><span>${result.kind === "success" ? "Ready" : "Waiting"}</span></div><div class="icon-toolbar" role="toolbar" aria-label="Output actions">
          ${iconAction("copy", "Copy output", "data-converter-copy-output", !result.output)}
          ${iconAction("download", "Download output", "data-converter-download", !result.output)}
        </div></header>
        <label class="visually-hidden" for="converter-output">${outputType} output</label>
        <textarea id="converter-output" readonly spellcheck="false">${escapeHtml(result.output)}</textarea>
        <p class="converter-note">TOML comments are not part of JSON output. JSON numbers use browser IEEE-754; unsafe integers, overflow, underflow, and signed zero are rejected.</p>
      </section>
    </section>
  </main>`;
  bindEvents();
}

function focusInput(): void {
  document.querySelector<HTMLTextAreaElement>("#converter-input")?.focus();
}

function downloadText(value: string, filename: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([value], { type: mime }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function copyText(
  value: string,
  label: "input" | "output",
): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
    announcement = `Copied ${label}`;
    announcementKind = "success";
  } catch {
    announcement = `Could not copy ${label}`;
    announcementKind = "error";
  }
  render();
}

function bindEvents(): void {
  document
    .querySelector<HTMLTextAreaElement>("#converter-input")
    ?.addEventListener("input", (event) => {
      const editor = event.currentTarget as HTMLTextAreaElement;
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      source = editor.value;
      announcement = "";
      announcementKind = undefined;
      render();
      const replacement =
        document.querySelector<HTMLTextAreaElement>("#converter-input");
      replacement?.focus();
      replacement?.setSelectionRange(start, end);
    });
  document
    .querySelector("[data-converter-open]")
    ?.addEventListener("click", () =>
      document.querySelector<HTMLInputElement>("#converter-file")?.click(),
    );
  document
    .querySelector<HTMLInputElement>("#converter-file")
    ?.addEventListener("change", async (event) => {
      const file = (event.currentTarget as HTMLInputElement).files?.[0];
      if (!file) return;
      source = await file.text();
      announcement = `${file.name} opened`;
      announcementKind = "success";
      render();
      focusInput();
    });
  document
    .querySelector("[data-converter-sample]")
    ?.addEventListener("click", () => {
      source =
        direction === "toml-json"
          ? '# project\ntitle = "HaveSome TOML"\n[server]\nport = 8080\n'
          : '{\n  "title": "HaveSome TOML",\n  "server": { "port": 8080 }\n}\n';
      announcement = "Sample loaded";
      announcementKind = "success";
      render();
      focusInput();
    });
  document
    .querySelector("[data-converter-clear]")
    ?.addEventListener("click", () => {
      source = "";
      announcement = "";
      announcementKind = undefined;
      render();
      focusInput();
    });
  document
    .querySelector("[data-converter-switch]")
    ?.addEventListener("click", () => {
      const result = conversion();
      if (result.kind === "success") source = result.output;
      direction = direction === "toml-json" ? "json-toml" : "toml-json";
      announcement =
        direction === "toml-json"
          ? "TOML is now the input"
          : "JSON is now the input";
      announcementKind = "success";
      render();
      focusInput();
    });
  document
    .querySelector("[data-converter-format]")
    ?.addEventListener("click", async () => {
      if (direction === "json-toml") {
        source = `${JSON.stringify(JSON.parse(source), null, 2)}\n`;
        announcement = "Formatted JSON";
        announcementKind = "success";
        render();
        focusInput();
        return;
      }
      const requestedSource = source;
      formatterLoading = true;
      announcement = "Formatting TOML…";
      announcementKind = "idle";
      render();
      try {
        const formatSource = await getTomlSourceFormatter();
        if (source !== requestedSource) return;
        const result = formatDocument(requestedSource, formatSource);
        if (result.ok) {
          source = result.source;
          announcement = "Formatted TOML · comments preserved";
          announcementKind = "success";
        } else {
          announcement = "Could not format TOML";
          announcementKind = "error";
        }
      } catch {
        announcement = "Formatter unavailable";
        announcementKind = "error";
      } finally {
        formatterLoading = false;
        render();
        focusInput();
      }
    });
  document
    .querySelector("[data-converter-copy-input]")
    ?.addEventListener("click", () => copyText(source, "input"));
  document
    .querySelector("[data-converter-copy-output]")
    ?.addEventListener("click", () => copyText(conversion().output, "output"));
  document
    .querySelector("[data-converter-download]")
    ?.addEventListener("click", () => {
      const result = conversion();
      const isJson = direction === "toml-json";
      downloadText(
        result.output,
        isJson ? "converted.json" : "converted.toml",
        isJson
          ? "application/json;charset=utf-8"
          : "application/toml;charset=utf-8",
      );
      announcement = "Downloaded output";
      announcementKind = "success";
      render();
    });
}

render();
