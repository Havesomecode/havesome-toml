import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact ?? ""),
    ),
  ).toEqual([]);
});

test("keeps visible focus and removes motion when reduced", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const focused = page.getByRole("button", { name: /Progress/ });
  await focused.focus();
  await expect(focused).toBeVisible();
  const transition = await focused.evaluate(
    (element) => getComputedStyle(element).transitionDuration,
  );
  expect(transition).toBe("0s");
});
