import { describe, expect, it } from "vitest";
import { parseDocument } from "../src/toml.ts";
import invalidBrowserTextManifest from "./fixtures/toml-test-1.1-invalid-browser-text.json";

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
    const invalid = parseDocument("private =", valid.data);

    expect(invalid.ok).toBe(false);
    expect(invalid.error).toMatchObject({ line: 1, column: 10 });
    expect(invalid.error?.message).toContain("expected a value");
    expect(invalid.data).toEqual({ private: false });
    expect(invalid.stale).toBe(true);
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
