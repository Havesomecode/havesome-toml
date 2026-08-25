import { describe, expect, it } from "vitest";
import { renderFeedbackStrip, renderProgressLabel } from "../src/components.ts";

describe("feedback component", () => {
  it("renders an announced status and escapes learner text", () => {
    const html = renderFeedbackStrip("<script>alert(1)</script>", "error");
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('class="feedback-strip error"');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("renders a compact progress label", () => {
    expect(renderProgressLabel(4, 11)).toBe("Progress <span>4/11</span>");
  });
});
