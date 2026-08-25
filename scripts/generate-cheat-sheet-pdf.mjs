import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { stdout } from "node:process";
import { chromium } from "@playwright/test";
import { createServer } from "vite";

const root = resolve(import.meta.dirname, "..");
const outputDirectory = resolve(root, "public");
const outputPath = resolve(outputDirectory, "havesome-toml-cheat-sheet.pdf");
const port = 42732;

await mkdir(outputDirectory, { recursive: true });

const server = await createServer({
  root,
  logLevel: "error",
  server: { host: "127.0.0.1", port, strictPort: true },
});
let browser;

try {
  await server.listen();
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${port}/#reference`, {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => globalThis.document.fonts.ready);
  await page.emulateMedia({ media: "print", colorScheme: "light" });
  await page.pdf({
    path: outputPath,
    preferCSSPageSize: true,
    printBackground: true,
    tagged: true,
    outline: true,
  });
  stdout.write(`Generated ${outputPath}\n`);
} finally {
  await browser?.close();
  await server.close();
}
