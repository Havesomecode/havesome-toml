import { describe, expect, it } from "vitest";
import { parseDocument } from "../src/toml.ts";

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
});
