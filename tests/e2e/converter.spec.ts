import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    __copiedText: string;
  }
}

test("publishes a separate viewport-first TOML and JSON converter", async ({
  page,
}) => {
  await page.goto("/toml-to-json/");
  await expect(page).toHaveTitle(
    "TOML to JSON & JSON to TOML Converter | HaveSome TOML",
  );
  await expect(
    page.getByRole("heading", { name: "TOML ↔ JSON converter", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("TOML input")).toBeVisible();
  await expect(page.getByLabel("JSON output")).toBeVisible();
  const inputBox = await page.getByLabel("TOML input").boundingBox();
  expect(inputBox).not.toBeNull();
  expect(inputBox!.height).toBeGreaterThanOrEqual(
    (await page.evaluate(() => innerWidth)) < 600 ? 340 : 480,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("converts TOML to JSON live with precise validation", async ({ page }) => {
  await page.goto("/toml-to-json/");
  const input = page.getByLabel("TOML input");
  const output = page.getByLabel("JSON output");
  await input.fill('title = "Demo"\n[server]\nport = 8080');
  await expect(page.getByRole("status")).toContainText("JSON ready");
  expect(JSON.parse(await output.inputValue())).toEqual({
    title: "Demo",
    server: { port: 8080 },
  });
  await input.fill("[server]\nport =");
  await expect(page.getByRole("status")).toContainText("Invalid TOML");
  await expect(page.getByRole("status")).toContainText("Line 2, column 7");
});

test("rejects lossy numeric conversion in both directions", async ({
  page,
}) => {
  await page.goto("/toml-to-json/");
  const toml = page.getByLabel("TOML input");
  const jsonOutput = page.getByLabel("JSON output");
  for (const [source, diagnostic] of [
    ["value = inf", "cannot be represented in JSON"],
    ["value = nan", "cannot be represented in JSON"],
    ["value = 9223372036854775807", "safe integer range"],
    ["value = -0.0", "signed zero"],
  ] satisfies Array<[string, string]>) {
    await toml.fill(source);
    await expect(page.getByRole("status")).toContainText(diagnostic);
    await expect(jsonOutput).toHaveValue("");
  }
  await toml.fill("value = 42\ndate = 1979-05-27\ntime = 07:32:00");
  expect(JSON.parse(await jsonOutput.inputValue())).toEqual({
    value: 42,
    date: "1979-05-27",
    time: "07:32:00.000",
  });
  await page.getByRole("button", { name: "Use JSON as input" }).click();
  const json = page.getByLabel("JSON input");
  const tomlOutput = page.getByLabel("TOML output");
  for (const [source, diagnostic] of [
    ['{"value":1e400}', "numeric range"],
    ['{"value":1e-400}', "underflows to zero"],
    ['{"value":-0}', "signed zero"],
    ['{"value":9007199254740993}', "safe integer range"],
  ] satisfies Array<[string, string]>) {
    await json.fill(source);
    await expect(page.getByRole("status")).toContainText(diagnostic);
    await expect(tomlOutput).toHaveValue("");
  }
  await json.fill('{"text":"1e400","value":0e-400}');
  await expect(page.getByRole("status")).toContainText("TOML ready");
  await expect(tomlOutput).toContainText('text = "1e400"');
  await expect(tomlOutput).toContainText("value = 0");
});

test("switches direction and converts JSON to TOML", async ({ page }) => {
  await page.goto("/toml-to-json/");
  await page.getByRole("button", { name: "Use JSON as input" }).click();
  const input = page.getByLabel("JSON input");
  const output = page.getByLabel("TOML output");
  await input.fill('{"title":"Demo","server":{"port":8080}}');
  await expect(page.getByRole("status")).toContainText("TOML ready");
  await expect(output).toContainText('title = "Demo"');
  await expect(output).toContainText("[server]");
  await expect(output).toContainText("port = 8080");
  await input.fill('{"unsupported":null}');
  await expect(page.getByRole("status")).toContainText(
    "cannot be represented in TOML",
  );
  await input.fill('{"unsafe":9007199254740993}');
  await expect(page.getByRole("status")).toContainText("safe integer range");
});

test("formats both converter input modes without losing TOML comments", async ({
  page,
}) => {
  await page.goto("/toml-to-json/");
  const toml = page.getByLabel("TOML input");
  await toml.fill('# keep\ntitle="Demo" # inline');
  await page.getByRole("button", { name: "Format input" }).click();
  await expect(toml).toHaveValue('# keep\ntitle = "Demo" # inline\n');
  await expect(page.getByRole("status")).toContainText("Formatted TOML");
  await page.getByRole("button", { name: "Use JSON as input" }).click();
  const json = page.getByLabel("JSON input");
  await json.fill('{"title":"Demo"}');
  await page.getByRole("button", { name: "Format input" }).click();
  await expect(json).toHaveValue('{\n  "title": "Demo"\n}\n');
  await expect(page.getByRole("status")).toContainText("Formatted JSON");
});

test("surfaces formatter and clipboard failures as retryable errors", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => Promise.reject(new Error("denied")) },
    });
  });
  await page.route("**/*.wasm", (route) => route.abort());
  await page.goto("/toml-to-json/");
  await page.getByLabel("TOML input").fill('title="Demo"');
  await page.getByRole("button", { name: "Format input" }).click();
  const status = page.getByRole("status");
  await expect(status).toContainText("Formatter unavailable");
  await expect(status).toHaveClass(/error/);
  await page.unroute("**/*.wasm");
  await page.getByRole("button", { name: "Format input" }).click();
  await expect(status).toContainText("comments preserved");
  await page.getByRole("button", { name: "Copy input" }).click();
  await expect(status).toContainText("Could not copy input");
  await expect(status).toHaveClass(/error/);
});

test("uses icon actions and copies converter output", async ({ page }) => {
  await page.addInitScript(() => {
    window.__copiedText = "";
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          window.__copiedText = value;
        },
      },
    });
  });
  await page.goto("/toml-to-json/");
  for (const name of [
    "Open input file",
    "Load sample",
    "Format input",
    "Copy input",
    "Clear input",
    "Copy output",
    "Download output",
    "Use JSON as input",
  ]) {
    const action = page.getByRole("button", { name });
    await expect(action).toHaveAttribute("title", name);
    await expect(action.locator("svg")).toHaveCount(1);
    expect((await action.innerText()).trim()).toBe("");
  }
  await page.getByLabel("TOML input").fill('title = "Copied"');
  await page.getByRole("button", { name: "Copy output" }).click();
  expect(JSON.parse(await page.evaluate(() => window.__copiedText))).toEqual({
    title: "Copied",
  });
});

test("keeps the converter accessible and its actions practical", async ({
  page,
}) => {
  await page.goto("/toml-to-json/");
  await page.getByRole("button", { name: "Load sample" }).click();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  const minimum = await page.evaluate(() =>
    matchMedia("(pointer: coarse)").matches ? 48 : 44,
  );
  for (const button of await page.getByRole("main").getByRole("button").all()) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(minimum);
    expect(box!.height).toBeGreaterThanOrEqual(minimum);
  }
});

test("publishes converter canonical metadata and sitemap entry", async ({
  page,
  request,
}) => {
  await page.goto("/toml-to-json/");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://havesomecode.github.io/havesome-toml/toml-to-json/",
  );
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /Convert TOML to JSON and JSON to TOML.*browser/i,
  );
  const converterHtml = await (await request.get("/toml-to-json/")).text();
  expect(converterHtml).toContain("<h1>TOML ↔ JSON converter</h1>");
  expect(await (await request.get("/sitemap.xml")).text()).toContain(
    "https://havesomecode.github.io/havesome-toml/toml-to-json/",
  );
});
