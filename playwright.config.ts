import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:42731",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Safari"], browserName: "webkit" },
    },
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "webkit" } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 42731 --strictPort",
    url: "http://127.0.0.1:42731",
    reuseExistingServer: true,
  },
});
