import { expect, test } from "@playwright/test";

const milestones = [
  "Orientation",
  "Keys and values",
  "Tables",
  "Arrays and records",
  "Dotted keys",
  "Dates and times",
  "Strings and escapes",
  "Schema contracts",
  "Terminal workflow",
  "Debug challenge",
  "Capstone",
];

test("renders every contracted milestone", async ({ page }) => {
  for (let index = 0; index < milestones.length; index += 1) {
    await page.goto(`/#lesson-${index + 1}`);
    await expect(
      page.getByRole("heading", { name: milestones[index] }),
    ).toBeVisible();
    await expect(page.getByText(`Milestone ${index + 1} of 11`)).toBeVisible();
  }
});

test("groups table fields with mouse-free move controls", async ({ page }) => {
  await page.goto("/#lesson-3");
  await page.getByLabel("Move name").selectOption("package");
  await page.getByLabel("Move version").selectOption("package");
  await page.getByLabel("Move url").selectOption("repository");
  await page.getByLabel("Move branch").selectOption("repository");
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(
    page.getByText("Four fields serialize inside their tables."),
  ).toBeVisible();
});

test("reorders arrays and adds array-of-table records", async ({ page }) => {
  await page.goto("/#lesson-4");
  await page.getByRole("button", { name: "Move vite down" }).click();
  await page.getByRole("button", { name: "Add record" }).click();
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(
    page.getByText("Three contributor tables serialize in order."),
  ).toBeVisible();
});

test("builds a dotted path with explicit connect controls", async ({
  page,
}) => {
  await page.goto("/#lesson-5");
  await page.getByRole("button", { name: /server.*Connect/ }).click();
  await page.getByRole("button", { name: /tls.*Connect/ }).click();
  await page.getByRole("button", { name: /enabled.*Connect/ }).click();
  await expect(page.locator(".path-readout code")).toHaveText(
    "server.tls.enabled",
  );
});

test("validates dates, schema, string repair, and debug repair", async ({
  page,
}) => {
  await page.goto("/#lesson-6");
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(
    page.getByText("Four date and time types remain literal."),
  ).toBeVisible();

  await page.goto("/#lesson-8");
  await page
    .getByLabel("TOML source")
    .fill(
      '[project]\nname = "lab"\nlicense = "MIT"\nretries = 5\nprivate = false',
    );
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(page.getByText("Four schema constraints fit.")).toBeVisible();

  await page.goto("/#lesson-7");
  await page
    .getByLabel("TOML source")
    .fill(
      "basic = \"Line\\nBreak\"\nliteral = 'C:\\\\Users'\nmultiline = \"\"\"three\"\"\"\nraw = '''four'''",
    );
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(
    page.getByText("Four string forms parse with intended output."),
  ).toBeVisible();

  await page.goto("/#lesson-10");
  await page
    .getByLabel("TOML source")
    .fill('name = "lab"\nprivate = false\nretries = 3\nowner = "Ada"');
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(
    page.getByText("Zero parse or contract faults remain."),
  ).toBeVisible();
});
