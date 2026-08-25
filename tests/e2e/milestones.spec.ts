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

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 1,
        completed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        drafts: {},
        lessons: {},
        capstone: {
          goal: "release",
          source:
            "# Build a release configuration\n[release]\n# enabled =\n# targets =\n# channel =",
          interacted: false,
        },
        updatedAt: 0,
      }),
    );
  });
});

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

test("provides measured 44 by 44 table destination touch targets", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#lesson-3");
  const sizes = await page.locator("[data-move-tile]").evaluateAll((selects) =>
    selects.map((select) => {
      const rect = select.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }),
  );
  expect(sizes).toHaveLength(4);
  expect(
    sizes.every(({ width, height }) => width >= 44 && height >= 44),
    JSON.stringify(sizes),
  ).toBe(true);
});

test("keeps every visible lesson, error, and capstone target at least 44 by 44", async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const state of ["lesson", "error", "capstone"] as const) {
      await page.goto(state === "capstone" ? "/#lesson-11" : "/#lesson-1");
      if (state === "error")
        await page.getByLabel("TOML source").fill("broken =");

      const targets = await page
        .locator("a[href], button, input, select, textarea")
        .evaluateAll((elements) =>
          elements.flatMap((element) => {
            const rect = element.getBoundingClientRect();
            const style = getComputedStyle(element);
            if (
              style.display === "none" ||
              style.visibility === "hidden" ||
              rect.width === 0 ||
              rect.height === 0 ||
              (element.classList.contains("skip-link") &&
                !element.matches(":focus"))
            )
              return [];
            return [
              {
                target: `${element.tagName.toLowerCase()}#${element.id}.${element.className}`,
                width: rect.width,
                height: rect.height,
              },
            ];
          }),
        );
      const undersized = targets.filter(
        ({ width: targetWidth, height }) => targetWidth < 44 || height < 44,
      );
      expect(
        undersized,
        `${width}px ${state}: ${JSON.stringify(targets)}`,
      ).toEqual([]);
    }
  }
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
  for (const [path, type] of [
    ["date", "local date"],
    ["time", "local time"],
    ["local", "local date-time"],
    ["offset", "offset date-time"],
    ["birthday", "local date"],
    ["close", "local time"],
    ["meeting", "local date-time"],
    ["repair_me", "local date"],
  ] as const) {
    await page.getByLabel(`Classify ${path}`).selectOption(type);
  }
  const datesSource = page.getByLabel("TOML source");
  await datesSource.fill(
    (await datesSource.inputValue()).replace('"2025-13-01"', "2025-12-01"),
  );
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(
    page.getByText("Eight date and time literals are classified and repaired."),
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
      'basic = "Line\\nBreak"\nliteral = \'C:\\\\Users\'\nmultiline = """three"""\nraw = \'\'\'four\'\'\'\nescaped = "\\x41\\e"',
    );
  await page.getByRole("button", { name: "Check lesson" }).click();
  await expect(
    page.getByText("Five string forms parse with intended output."),
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
