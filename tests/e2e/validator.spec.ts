import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __copiedText: string;
  }
}

test("makes the TOML validator the primary landing tool", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "TOML validator", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("main", { name: "TOML validator and formatter" }),
  ).toBeVisible();
  await expect(page.getByLabel("TOML input")).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Paste TOML to start");
  await expect(
    page.getByRole("button", { name: "Format TOML" }),
  ).toBeDisabled();
  await expect(page.getByText("Runs entirely in your browser")).toBeVisible();
  await expect(page.getByRole("link", { name: "Learn TOML" })).toHaveAttribute(
    "href",
    "#learn",
  );
});

test("keeps the quick tool above the fold and removes landing-page prose", async ({
  page,
}) => {
  await page.goto("/");
  const workbench = page.getByRole("region", {
    name: "Validate and format TOML",
  });
  const editor = page.getByLabel("TOML input");
  const workbenchBox = await workbench.boundingBox();
  const editorBox = await editor.boundingBox();
  expect(workbenchBox).not.toBeNull();
  expect(editorBox).not.toBeNull();
  expect(workbenchBox!.y).toBeLessThan(210);
  expect(editorBox!.height).toBeGreaterThanOrEqual(
    (await page.evaluate(() => innerWidth)) < 600 ? 360 : 480,
  );
  await expect(page.locator(".validator-explainer")).toHaveCount(0);
  await expect(page.locator(".validator-faq")).toHaveCount(0);
});

test("uses discoverable icon-only actions with separate copy controls", async ({
  page,
}) => {
  await page.goto("/");
  const sourceActions = page.getByRole("toolbar", { name: "TOML actions" });
  for (const name of [
    "Open TOML file",
    "Load sample",
    "Format TOML",
    "Copy TOML",
    "Download TOML",
    "Clear TOML",
  ]) {
    const action = sourceActions.getByRole("button", { name });
    await expect(action).toHaveAttribute("title", name);
    await expect(action.locator("svg")).toHaveCount(1);
    expect((await action.innerText()).trim()).toBe("");
  }
  const parsedCopy = page.getByRole("button", { name: "Copy parsed data" });
  await expect(parsedCopy).toHaveAttribute("title", "Copy parsed data");
  await expect(parsedCopy.locator("svg")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "TOML to JSON" }),
  ).toHaveAttribute("href", "./toml-to-json/");
});

test("opens, copies, downloads, and clears source and parsed data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window;
    state.__copiedText = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          state.__copiedText = value;
        },
      },
    });
  });
  await page.goto("/");
  const source = 'title = "Imported"\n[server]\nport = 8080\n';
  await page.locator('input[type="file"]').setInputFiles({
    name: "Cargo.toml",
    mimeType: "text/plain",
    buffer: Buffer.from(source),
  });
  await expect(page.getByLabel("TOML input")).toHaveValue(source);

  await page.getByRole("button", { name: "Copy TOML" }).click();
  expect(await page.evaluate(() => window.__copiedText)).toBe(source);
  await page.getByRole("button", { name: "Copy parsed data" }).click();
  expect(JSON.parse(await page.evaluate(() => window.__copiedText))).toEqual({
    title: "Imported",
    server: { port: 8080 },
  });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download TOML" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("config.toml");
  await page.getByRole("button", { name: "Clear TOML" }).click();
  await expect(page.getByLabel("TOML input")).toHaveValue("");
});

test("resets page-route scroll and focuses the destination heading", async ({
  page,
}) => {
  await page.goto("/#learn");
  await expect(
    page.getByRole("heading", { name: "Learn TOML by changing it" }),
  ).toBeVisible();
  await page.addStyleTag({
    content: "html { scroll-behavior: auto !important; }",
  });
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
  await page
    .getByRole("link", { name: "HaveSome TOML validator home" })
    .click();
  await expect(page).toHaveURL(/#validator$/);
  const validatorHeading = page.getByRole("heading", {
    name: "TOML validator",
    exact: true,
  });
  await expect(validatorHeading).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("TOML input")).toBeFocused();

  await page.getByRole("link", { name: "Learn TOML", exact: true }).click();
  await expect(page).toHaveURL(/#learn$/);
  const learnHeading = page.getByRole("heading", {
    name: "Learn TOML by changing it",
  });
  await expect(learnHeading).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);

  await page.goBack();
  await expect(page).toHaveURL(/#validator$/);
  await expect(validatorHeading).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("keeps every validator action at a practical target size", async ({
  page,
}) => {
  await page.goto("/");
  const minimum = await page.evaluate(() =>
    matchMedia("(pointer: coarse)").matches ? 48 : 44,
  );
  const buttons = page.getByRole("main").getByRole("button");
  for (const button of await buttons.all()) {
    const box = await button.boundingBox();
    expect(box, await button.innerText()).not.toBeNull();
    expect(box!.width, await button.innerText()).toBeGreaterThanOrEqual(
      minimum,
    );
    expect(box!.height, await button.innerText()).toBeGreaterThanOrEqual(
      minimum,
    );
  }
});

test("validates, formats, and mirrors TOML without leaving the page", async ({
  page,
}) => {
  await page.goto("/");
  const editor = page.getByLabel("TOML input");

  await editor.fill("[server]\nport =");
  const invalid = page.getByRole("status");
  await expect(invalid).toContainText("Invalid TOML");
  await expect(invalid).toContainText("Line 2, column 7");
  await expect(invalid).toContainText("expected a value after `=`");
  await expect(
    page.getByRole("button", { name: "Format TOML" }),
  ).toBeDisabled();

  await editor.fill(
    '# keep project\ntitle="Demo" # keep inline\n[server]\nport=8080',
  );
  await expect(page.getByRole("status")).toContainText("Valid TOML");
  const mirror = page.getByRole("region", { name: "Compact parse mirror" });
  await expect(mirror).toContainText("server.port");
  await expect(mirror).toContainText("integer");
  await expect(mirror).toContainText("8080");
  await expect(mirror.getByText("2 fields", { exact: true })).toBeVisible();
  const serverRow = mirror.getByText("server", { exact: true }).locator("..");
  await expect(serverRow.getByText("table", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Format TOML" }).click();
  await expect(editor).toHaveValue(
    '# keep project\ntitle = "Demo" # keep inline\n[server]\nport = 8080\n',
  );
  await expect(page.getByRole("status")).toContainText("Formatted TOML");
  await expect(page.getByText(/Formatting preserves comments/i)).toBeVisible();
});

test("surfaces validator formatter and clipboard failures as errors", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => Promise.reject(new Error("denied")) },
    });
  });
  await page.route("**/*.wasm", (route) => route.abort());
  await page.goto("/");
  const editor = page.getByLabel("TOML input");
  await editor.fill('title="Demo"');
  await page.getByRole("button", { name: "Format TOML" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("Formatter unavailable");
  await expect(status).toHaveClass(/error/);
  await page.unroute("**/*.wasm");
  await page.getByRole("button", { name: "Format TOML" }).click();
  await expect(status).toContainText("Formatted TOML");
  await expect(status).toHaveClass(/success/);
  await page.getByRole("button", { name: "Copy TOML" }).click();
  await expect(status).toContainText("Clipboard unavailable");
  await expect(status).toHaveClass(/error/);
  expect(
    await editor.evaluate(
      (input) => (input as HTMLTextAreaElement).selectionStart,
    ),
  ).toBe(0);
  expect(
    await editor.evaluate(
      (input) => (input as HTMLTextAreaElement).selectionEnd,
    ),
  ).toBe((await editor.inputValue()).length);
  await page.getByRole("button", { name: "Copy parsed data" }).click();
  await expect(status).toContainText("Clipboard unavailable");
  await expect(status).toHaveClass(/error/);
});

test("keeps the learning journey as a secondary destination", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Learn TOML" }).click();

  await expect(page).toHaveURL(/#learn$/);
  await expect(
    page.getByRole("heading", { name: "Learn TOML by changing it" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /lesson 1/i })).toBeVisible();
});

test("publishes focused validator search metadata and structured data", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("TOML Validator & Formatter | HaveSome TOML");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Validate TOML online.*format.*parsed structure.*browser/i,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://havesomecode.github.io/havesome-toml/",
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /TOML Validator & Formatter/,
  );
  const schema = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(schema).toMatchObject({
    "@type": "WebApplication",
    name: "HaveSome TOML Validator",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
  });
});

test("publishes robots, sitemap, and favicon files", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/favicon.svg"]) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
  }
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Sitemap: https://havesomecode.github.io/havesome-toml/sitemap.xml",
  );
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "https://havesomecode.github.io/havesome-toml/",
  );
});

test("renders Edit Observe Check as readable guidance rather than disabled controls", async ({
  page,
}) => {
  await page.goto("/#lesson-1");
  const cards = page
    .getByRole("list", { name: "Edit, observe, check" })
    .getByRole("listitem");
  await expect(cards).toHaveCount(3);

  for (const card of await cards.all()) {
    await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(card.locator("strong")).toHaveCSS("color", "rgb(23, 61, 48)");
    await expect(card.locator("small")).toHaveCSS("color", "rgb(29, 33, 28)");
    await expect(card.locator("small")).toHaveCSS("font-size", "13px");
  }
});
