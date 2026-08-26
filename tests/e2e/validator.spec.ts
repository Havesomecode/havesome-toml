import { expect, test } from "@playwright/test";

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

  await editor.fill('title="Demo"\n[server]\nport=8080');
  await expect(page.getByRole("status")).toContainText("Valid TOML");
  const mirror = page.getByRole("region", { name: "Compact parse mirror" });
  await expect(mirror).toContainText("server.port");
  await expect(mirror).toContainText("integer");
  await expect(mirror).toContainText("8080");
  await expect(mirror.getByText("2 fields", { exact: true })).toBeVisible();
  const serverRow = mirror.getByText("server", { exact: true }).locator("..");
  await expect(serverRow.getByText("table", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Format TOML" }).click();
  await expect(editor).toHaveValue('title = "Demo"\n\n[server]\nport = 8080\n');
  await expect(page.getByRole("status")).toContainText("Formatted TOML");
  await expect(
    page.getByText(/Formatting normalizes layout and removes comments/i),
  ).toBeVisible();
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
