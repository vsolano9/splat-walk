import { defineConfig } from "@playwright/test";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const externalURL = process.env.SPLAT_WALK_BASE_URL;
const localURL = "http://127.0.0.1:3107";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: process.env.SPLAT_WALK_TEST_OUTPUT ?? resolve(tmpdir(), "splat-walk-e2e"),
  use: {
    baseURL: externalURL ?? localURL,
    browserName: "chromium",
    channel: "chrome",
    // Test real WebGPU on the installed browser, without unsafe flags or a software renderer.
    headless: false,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: externalURL ? undefined : {
    command: "npm run start -- --hostname 127.0.0.1 --port 3107",
    url: localURL,
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
