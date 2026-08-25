import { expect, test } from "@playwright/test";

test("starts with milestones 1 and 2 available and begins the first lesson", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Learn TOML by changing it" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Keys and values/ }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: /Tables/ })).toBeDisabled();
  await page.getByRole("button", { name: "Begin lesson 1" }).click();
  await expect(
    page.getByRole("heading", { name: "Orientation" }),
  ).toBeVisible();
});

test("resumes the persisted current lesson from the launch action", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 7,
        completed: [1, 2, 3, 4, 5, 6],
        drafts: {},
        lessons: {},
        capstone: { goal: "release", source: "# scaffold", interacted: false },
        updatedAt: 0,
      }),
    );
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Resume lesson 7" }).click();
  await expect(
    page.getByRole("heading", { name: "Strings and escapes" }),
  ).toBeVisible();
});

test("offers dedicated progress and searchable reference views", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Progress" }).click();
  await expect(
    page.getByRole("heading", { name: "Your progress" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Reference" }).click();
  await expect(
    page.getByRole("heading", { name: "TOML reference" }),
  ).toBeVisible();
  await page.getByLabel("Search reference").fill("array");
  await expect(page.getByText("Arrays", { exact: true })).toBeVisible();
  await expect(page.getByText("Tables", { exact: true })).toBeHidden();
});

test("edits TOML, preserves stale mirror, and completes orientation", async ({
  page,
}) => {
  await page.goto("/#lesson-1");
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

test("restores the exact authored last-valid source after navigation and reload", async ({
  page,
}) => {
  await page.goto("/#lesson-1");
  const authored =
    'name = "Authored specimen"\nprivate = true\nversion = "1.1"';
  const invalid = 'name = "Authored specimen"\nprivate =\nversion = "1.1"';
  const editor = page.getByLabel("TOML source");

  await editor.fill(authored);
  await editor.fill(invalid);
  await expect(
    page.getByRole("button", { name: "Restore last valid" }),
  ).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = localStorage.getItem("havesome-toml:progress");
        if (!saved) return undefined;
        return JSON.parse(saved).lessons?.["1"]?.lastValidSource;
      }),
    )
    .toBe(authored);
  await page.getByRole("button", { name: /Keys and values/ }).click();
  await page.getByRole("button", { name: /Orientation/ }).click();
  await expect(page.getByLabel("TOML source")).toHaveValue(invalid);
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.getByLabel("TOML source")).toHaveValue(invalid);

  await page.getByRole("button", { name: "Restore last valid" }).click();
  await expect(page.getByLabel("TOML source")).toHaveValue(authored);
});

test("recovers a corrupt nested lesson with a visible warning", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 1,
        completed: [],
        drafts: {},
        lessons: {
          "1": {
            source: 42,
            hintLevel: 0,
            checked: false,
            interacted: true,
          },
        },
        capstone: {
          goal: "release",
          source: "[release]",
          interacted: false,
        },
        updatedAt: 0,
      }),
    );
  });

  await page.goto("/#lesson-1");
  await expect(page.getByRole("status")).toContainText(
    "Saved progress was damaged and has been reset",
  );
  await expect(
    page.getByRole("heading", { name: "Orientation" }),
  ).toBeVisible();
  await expect(page.getByLabel("TOML source")).toHaveValue(
    'name = "TOML Lab"\nprivate = true\nversion = "1.1"',
  );
});

test("rejects hostile persisted manipulation without executing markup", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as Window & { __persistedXss?: number }).__persistedXss = 0;
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 1,
        completed: [1, 2],
        drafts: {},
        lessons: {
          "3": {
            hintLevel: 0,
            checked: false,
            interacted: true,
            manipulation: {
              tiles: [
                {
                  name: '"><img src=x onerror="window.__persistedXss=1">',
                  table: "loose",
                },
                { name: "version", table: "loose" },
                { name: "url", table: "loose" },
                { name: "branch", table: "loose" },
              ],
              dependencies: ["vite", "smol-toml"],
              contributors: ["Ada", "Lin"],
              nodes: [],
            },
          },
        },
        capstone: {
          goal: "release",
          source: "[release]",
          interacted: false,
        },
        updatedAt: 0,
      }),
    );
  });

  await page.goto("/#lesson-1");

  await expect(page.getByRole("status")).toContainText(
    "Saved progress was damaged and has been reset",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as Window & { __persistedXss?: number }).__persistedXss,
      ),
    )
    .toBe(0);
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});

test("preserves textarea caret order during real keyboard typing", async ({
  page,
}) => {
  await page.goto("/#lesson-1");
  const editor = page.getByLabel("TOML source");
  await editor.focus();
  await editor.evaluate((element) => {
    const textarea = element as HTMLTextAreaElement;
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  });
  await page.keyboard.type("XY");

  await expect(editor).toHaveValue(/version = "1\.1"XY$/);
  await expect
    .poll(() =>
      editor.evaluate(
        (element) => (element as HTMLTextAreaElement).selectionStart,
      ),
    )
    .toBe((await editor.inputValue()).length);
});

test("supports keyboard lesson navigation and persists the current draft", async ({
  page,
}) => {
  await page.goto("/#lesson-1");
  await page
    .getByLabel("TOML source")
    .fill('name = "TOML Lab"\nprivate = false\nversion = "1.1"');
  await page.getByRole("button", { name: "Check lesson" }).click();
  await page.getByRole("button", { name: /Keys and values/ }).click();
  const editor = page.getByLabel("TOML source");
  await editor.fill(
    'name = "Lab"\nretries = 3\nratio = 1.5\nprivate = false\ntags = ["toml"]\nowner = { name = "Ada" }',
  );
  await page.getByRole("button", { name: /Hint 1/ }).click();
  await page.getByRole("button", { name: "Check lesson" }).click();
  await page.waitForTimeout(450);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Keys and values" }),
  ).toBeVisible();
  await expect(page.getByLabel("TOML source")).toHaveValue(/retries = 3/);
  await expect(page.getByText("Strings need quotes.")).toBeVisible();
  const savedLesson = await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem("havesome-toml:progress")!);
    return saved.lessons["2"];
  });
  expect(savedLesson).toMatchObject({
    hintLevel: 1,
    checked: true,
    interacted: true,
  });
});

test("restores a successful explicit check outcome after reload", async ({
  page,
}) => {
  await page.goto("/#lesson-1");
  await page
    .getByLabel("TOML source")
    .fill('name = "TOML Lab"\nprivate = false\nversion = "1.1"');
  await page.getByRole("button", { name: "Check lesson" }).click();
  await page.waitForTimeout(450);
  await page.reload();
  await expect(page.getByText("private is boolean false.")).toBeVisible();
});

test("restores a failed explicit check outcome after reload", async ({
  page,
}) => {
  await page.goto("/#lesson-2");
  await page
    .getByLabel("TOML source")
    .fill(
      'name = "Lab"\nretries = 3\nratio = 1.5\nprivate = false\ntags = ["toml"]\nowner = "Ada"',
    );
  await page.getByRole("button", { name: "Check lesson" }).click();
  await page.waitForTimeout(450);
  await page.reload();
  await expect(
    page.getByText("Structure differs from the target. Use the inspector."),
  ).toBeVisible();
});

test("runs the simulated terminal allowlist without real execution", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 9,
        completed: [1, 2, 3, 4, 5, 6, 7, 8],
        drafts: {},
        lessons: {},
        capstone: { goal: "release", source: "# scaffold", interacted: false },
        updatedAt: 0,
      }),
    );
  });
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

test("restores table, array, and node manipulation after reload and reopen", async ({
  context,
  page,
}) => {
  await context.addInitScript(() => {
    if (localStorage.getItem("havesome-toml:progress")) return;
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 3,
        completed: [1, 2, 3, 4],
        drafts: {},
        lessons: {},
        capstone: { goal: "release", source: "# scaffold", interacted: false },
        updatedAt: 0,
      }),
    );
  });

  await page.goto("/#lesson-3");
  await page.getByLabel("Move name").selectOption("package");
  await page.getByLabel("Move version").selectOption("package");
  await page.getByLabel("Move url").selectOption("repository");
  await page.getByLabel("Move branch").selectOption("repository");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(
          localStorage.getItem("havesome-toml:progress")!,
        );
        return saved.lessons["3"]?.manipulation?.tiles.map(
          ({ table }: { table: string }) => table,
        );
      }),
    )
    .toEqual(["package", "package", "repository", "repository"]);

  await page.reload();
  await expect(page.getByLabel("Move name")).toHaveValue("package");
  await expect(page.getByLabel("Move version")).toHaveValue("package");
  await expect(page.getByLabel("Move url")).toHaveValue("repository");
  await expect(page.getByLabel("Move branch")).toHaveValue("repository");

  await page.goto("/#lesson-4");
  await page.getByRole("button", { name: "Move vite down" }).click();
  await page.getByRole("button", { name: "Add record" }).click();
  const reopenedArray = await context.newPage();
  await reopenedArray.goto("/#lesson-4");
  await expect(
    reopenedArray.locator(".array-lab section").first().locator("li").first(),
  ).toContainText("smol-toml");
  await expect(
    reopenedArray.locator(".array-lab code", {
      hasText: 'name = "Contributor 3"',
    }),
  ).toBeVisible();

  await reopenedArray.goto("/#lesson-5");
  await reopenedArray.getByRole("button", { name: /server.*Connect/ }).click();
  await reopenedArray.getByRole("button", { name: /tls.*Connect/ }).click();
  await expect
    .poll(() =>
      reopenedArray.evaluate(() => {
        const saved = JSON.parse(
          localStorage.getItem("havesome-toml:progress")!,
        );
        return saved.lessons["5"]?.manipulation?.nodes;
      }),
    )
    .toEqual(["server", "tls"]);
  await reopenedArray.close();

  const reopenedNodes = await context.newPage();
  await reopenedNodes.goto("/#lesson-5");
  await expect(reopenedNodes.locator(".path-readout code")).toHaveText(
    "server.tls",
  );
  await reopenedNodes.close();
});

test("restores terminal workflow after reload and reopen", async ({
  context,
  page,
}) => {
  await context.addInitScript(() => {
    if (localStorage.getItem("havesome-toml:progress")) return;
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 9,
        completed: [1, 2, 3, 4, 5, 6, 7, 8],
        drafts: {},
        lessons: {},
        capstone: { goal: "release", source: "# scaffold", interacted: false },
        updatedAt: 0,
      }),
    );
  });

  await page.goto("/#lesson-9");
  for (const command of [
    "git diff -- config.toml",
    "taplo check config.toml",
    "git add config.toml",
  ]) {
    await page.getByRole("button", { name: command }).click();
  }
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(
          localStorage.getItem("havesome-toml:progress")!,
        );
        return saved.lessons["9"]?.terminal?.steps;
      }),
    )
    .toEqual(["diff", "check", "stage"]);

  await page.reload();
  await expect(page.locator(".workflow-steps li.done")).toHaveCount(3);
  await page.getByRole("button", { name: "git status --short" }).click();

  const reopened = await context.newPage();
  await reopened.goto("/#lesson-9");
  await expect(reopened.locator(".workflow-steps li.done")).toHaveCount(4);
  await reopened.close();
});

test("passes capstone tests and exposes copy and download", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 11,
        completed: [1, 2, 3, 4, 5, 6, 7, 8, 9],
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
  await page.goto("/#lesson-11");
  await expect(page.getByLabel("TOML source")).not.toHaveValue(
    /enabled = true/,
  );
  await page
    .getByLabel("TOML source")
    .fill(
      '[release]\nenabled = true\ntargets = ["macos", "linux"]\nchannel = "stable"',
    );
  await page.getByRole("button", { name: "Run tests" }).last().click();
  await expect(page.getByText("5 passed, 0 failed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy TOML" })).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Download TOML" }),
  ).toBeEnabled();
});

test("unlocks the capstone after milestones 1 through 9", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 10,
        completed: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        drafts: {},
        lessons: {},
        capstone: { goal: "release", source: "# scaffold", interacted: false },
        updatedAt: 0,
      }),
    );
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /Debug challenge/ }),
  ).toBeEnabled();
  await expect(page.getByRole("button", { name: /Capstone/ })).toBeEnabled();
});

test("shows signed 64-bit integers with integer inspector metadata", async ({
  page,
}) => {
  await page.goto("/#lesson-1");
  await page.getByLabel("TOML source").fill("max = 9223372036854775807");

  const row = page.locator(".tree-row").filter({ hasText: "max" });
  await expect(row.getByText("integer", { exact: true })).toBeVisible();
  await expect(
    row.getByText("9223372036854775807", { exact: true }),
  ).toBeVisible();
});

test("warns before replacing capstone work after a goal change", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "havesome-toml:progress",
      JSON.stringify({
        version: 3,
        current: 11,
        completed: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        drafts: {},
        lessons: {},
        capstone: {
          goal: "release",
          source: "# learner work\n[release]",
          interacted: true,
        },
        updatedAt: 0,
      }),
    );
  });
  await page.goto("/#lesson-11");
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain("replace your current capstone source");
    await dialog.accept();
  });
  await page.getByLabel("Project goal").selectOption("docs");
  await expect(page.getByLabel("TOML source")).toHaveValue(/\[docs\]/);
  await expect(page.getByLabel("TOML source")).not.toHaveValue(
    /enabled = true/,
  );
});

for (const width of [360, 390, 430, 600, 768, 820, 1024, 1366, 1440, 1920]) {
  test(`has no page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const layout = await page.evaluate(() => ({
      overflow:
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
      width: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("*")]
        .filter((element) => element.getBoundingClientRect().right > innerWidth)
        .map((element) => `${element.tagName}.${element.className}`)
        .slice(0, 8),
    }));
    expect(layout.overflow, JSON.stringify(layout)).toBe(false);
  });
}
