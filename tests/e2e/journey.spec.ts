import { expect, test } from "@playwright/test";

test("edits TOML, preserves stale mirror, and completes orientation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Orientation" }),
  ).toBeVisible();
  const editor = page.getByLabel("TOML source");
  await editor.fill('name = "TOML Lab"\nprivate =\nversion = "1.1"');
  await expect(page.getByText("Stale", { exact: true })).toBeVisible();
  await expect(page.getByText(/Line 2: expected a value/)).toBeVisible();
  await editor.fill('name = "TOML Lab"\nprivate = false\nversion = "1.1"');
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(page.getByText("private is boolean false.")).toBeVisible();
});

test("supports keyboard lesson navigation and persists the current draft", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Keys and values/ }).click();
  const editor = page.getByLabel("TOML source");
  await editor.fill(
    'name = "Lab"\nretries = 3\nratio = 1.5\nprivate = false\ntags = ["toml"]\nowner = { name = "Ada" }',
  );
  await page.waitForTimeout(450);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Keys and values" }),
  ).toBeVisible();
  await expect(page.getByLabel("TOML source")).toHaveValue(/retries = 3/);
});

test("runs the simulated terminal allowlist without real execution", async ({
  page,
}) => {
  await page.goto("/#lesson-9");
  await expect(
    page.getByText("Practice terminal—no real commands run."),
  ).toBeVisible();
  for (const command of [
    "git diff -- config.toml",
    "taplo check config.toml",
    "git add config.toml",
    "git status --short",
  ]) {
    await page.getByRole("button", { name: command }).click();
  }
  await expect(page.getByRole("log")).toContainText("M  config.toml");
});

test("passes capstone tests and exposes copy and download", async ({
  page,
}) => {
  await page.goto("/#lesson-11");
  await page.getByLabel("Project goal").selectOption("release");
  await page.getByRole("button", { name: "Use starter" }).click();
  await page.getByRole("button", { name: "Run tests" }).last().click();
  await expect(page.getByText("5 passed, 0 failed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy TOML" })).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Download TOML" }),
  ).toBeEnabled();
});

for (const width of [360, 390, 430, 600, 768, 820, 1024, 1366, 1440, 1920]) {
  test(`has no page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(overflow).toBe(false);
  });
}
