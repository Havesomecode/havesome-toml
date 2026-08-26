import { createFromBuffer } from "@dprint/formatter";
import { getPath } from "@dprint/toml";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { formatDocument, parseDocument } from "../src/toml.ts";

const dprint = createFromBuffer(readFileSync(getPath()));
const formatToml = (source: string): string =>
  dprint.formatText({ filePath: "config.toml", fileText: source });
import invalidBrowserTextManifest from "./fixtures/toml-test-1.1-invalid-browser-text.json";
import validBrowserTextManifest from "./fixtures/toml-test-1.1-valid-browser-text.json";

describe("parseDocument", () => {
  it("parses TOML 1.1 multiline inline tables and identifies value types", () => {
    const result = parseDocument(`title = "Lab"
contact = {
  name = "Ada",
  active = true,
}
when = 2025-12-18T10:30:00Z`);

    expect(result.ok).toBe(true);
    expect(result.version).toBe("TOML 1.1");
    expect(result.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "contact.active", type: "boolean" }),
        expect.objectContaining({ path: "when", type: "offset date-time" }),
      ]),
    );
  });

  it("returns a precise first error and preserves the last valid mirror", () => {
    const valid = parseDocument("private = false");
    const invalid = parseDocument("private =", valid);

    expect(invalid.ok).toBe(false);
    expect(invalid.error).toMatchObject({ line: 1, column: 10 });
    expect(invalid.error?.message).toContain("expected a value");
    expect(invalid.data).toEqual({ private: false });
    expect(invalid.stale).toBe(true);
  });

  it("accepts date-shaped bare keys while rejecting invalid calendar date values", () => {
    for (const source of [
      "1979-13-01 = true",
      "[1979-13-01]\nvalid = true",
      "foo.1979-13-01 = true",
    ]) {
      expect(parseDocument(source).ok, source).toBe(true);
    }

    const invalidValue = parseDocument("published = 1979-13-01");
    expect(invalidValue.ok).toBe(false);
    expect(invalidValue.error?.message).toBe("invalid calendar date");
  });

  it("keeps safe integers numeric and exposes larger signed 64-bit integers as decimal strings", () => {
    const result = parseDocument(
      "safe = 9007199254740991\nmax = 9223372036854775807\nmin = -9223372036854775808",
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      safe: 9007199254740991,
      max: "9223372036854775807",
      min: "-9223372036854775808",
    });
    expect(result.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "safe", type: "integer" }),
        expect.objectContaining({
          path: "max",
          type: "integer",
          value: "9223372036854775807",
        }),
        expect.objectContaining({
          path: "min",
          type: "integer",
          value: "-9223372036854775808",
        }),
      ]),
    );
  });

  it("preserves signed 64-bit integer metadata in the stale mirror", () => {
    const valid = parseDocument("max = 9223372036854775807");
    const invalid = parseDocument("max =", valid);

    expect(invalid.ok).toBe(false);
    expect(invalid.stale).toBe(true);
    expect(invalid.rows).toContainEqual({
      path: "max",
      type: "integer",
      value: "9223372036854775807",
    });
  });

  it("accepts every official TOML 1.1 valid fixture in the pinned corpus", () => {
    expect(validBrowserTextManifest.commit).toBe(
      "d168c2a4f539a5219c804055af1600b8cf9ca6d7",
    );
    expect(validBrowserTextManifest.fixtures.length).toBeGreaterThanOrEqual(
      200,
    );

    for (const fixture of validBrowserTextManifest.fixtures) {
      expect(parseDocument(fixture.source).ok, fixture.path).toBe(true);
    }
  });

  it("formats every official TOML 1.1 fixture without changing typed data", () => {
    for (const fixture of validBrowserTextManifest.fixtures) {
      const result = formatDocument(fixture.source, formatToml);
      expect(result.ok, fixture.path).toBe(true);
      if (!result.ok) continue;
      expect(parseDocument(result.source).data, fixture.path).toEqual(
        parseDocument(fixture.source).data,
      );
    }
  });

  it("distinguishes bracket tables from inline-table values", () => {
    const result = parseDocument(
      'title = "Demo"\n[server]\nport = 8080\n[server.tls]\nrequired = true\ninline = { nested = { enabled = true } }',
    );
    const types = Object.fromEntries(
      result.rows.map((row) => [row.path, row.type]),
    );
    expect(types).toMatchObject({
      server: "table",
      "server.tls": "table",
      "server.tls.inline": "inline table",
      "server.tls.inline.nested": "inline table",
    });

    const collision = parseDocument(
      '"a.b" = { quoted = true }\n[a.b]\nbracket = true',
    );
    expect(collision.rows.find((row) => row.path === '"a.b"')?.type).toBe(
      "inline table",
    );
    expect(collision.rows.find((row) => row.path === "a.b")?.type).toBe(
      "table",
    );
  });

  it("formats valid TOML canonically without changing typed data", () => {
    const source = `title="Demo"
max=9223372036854775807
published=1979-05-27T07:32:00Z
[server]
port=8080`;

    const result = formatDocument(source, formatToml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toBe(`title = "Demo"
max = 9223372036854775807
published = 1979-05-27T07:32:00Z
[server]
port = 8080
`);
    expect(parseDocument(result.source).data).toEqual(
      parseDocument(source).data,
    );
  });

  it("preserves comments while formatting valid TOML 1.1", () => {
    const source = `# application identity
title="Demo" # keep inline

[server]
# listening port
port=8080
contact = {
  # TOML 1.1 multiline inline table
  name="Ada",
}`;

    const result = formatDocument(source, formatToml);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.source).toContain("# application identity");
    expect(result.source).toContain("# keep inline");
    expect(result.source).toContain("# listening port");
    expect(result.source).toContain("# TOML 1.1 multiline inline table");
    expect(result.source).toContain('title = "Demo"');
    expect(parseDocument(result.source).data).toEqual(
      parseDocument(source).data,
    );
  });

  it("returns the validator diagnostic instead of formatting invalid TOML", () => {
    const result = formatDocument("[server]\nport =", formatToml);

    expect(result).toEqual({
      ok: false,
      error: {
        line: 2,
        column: 7,
        message: "expected a value after `=`",
      },
    });
  });

  it("rejects every official TOML 1.1 browser-text invalid fixture in the manifest", () => {
    expect(invalidBrowserTextManifest.commit).toBe(
      "d168c2a4f539a5219c804055af1600b8cf9ca6d7",
    );
    expect(invalidBrowserTextManifest.fixtures).toHaveLength(477);
    expect(
      invalidBrowserTextManifest.fixtures.some((fixture) =>
        fixture.path.startsWith("invalid/encoding/"),
      ),
    ).toBe(false);

    for (const fixture of invalidBrowserTextManifest.fixtures) {
      const result = parseDocument(fixture.source);
      expect(result.ok, fixture.path).toBe(false);
      expect(result.error, fixture.path).toMatchObject({
        column: expect.any(Number),
        line: expect.any(Number),
        message: expect.stringMatching(/\S/),
      });
      expect(result.error!.line, fixture.path).toBeGreaterThan(0);
      expect(result.error!.column, fixture.path).toBeGreaterThan(0);
    }
  });
});
