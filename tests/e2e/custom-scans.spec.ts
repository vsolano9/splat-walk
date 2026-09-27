import { test, expect, type Page, type TestInfo } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sample = readFileSync(resolve("public/scenes/lion.v3.spz"));
const upload = (name: string) => ({ name, mimeType: "application/octet-stream", buffer: sample });
const runtime = new WeakMap<Page, { errors: string[]; console: string[] }>();

test.beforeEach(async ({ page }) => {
  const log = { errors: [] as string[], console: [] as string[] };
  runtime.set(page, log);
  page.on("pageerror", error => log.errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" || message.type() === "warning") {
      log.console.push(`${message.type()}: ${message.text()}`);
      // The URL-error tests deliberately serve HTTP 404. All other browser/app errors fail QA.
      if (!/^Failed to load resource:.*\b404\b/.test(message.text())) log.errors.push(message.text());
    }
  });
});

test.afterEach(async ({ page }, info) => {
  const log = runtime.get(page)!;
  await info.attach("browser-log", { body: JSON.stringify(log, null, 2), contentType: "application/json" });
  expect(log.errors, "No uncaught exceptions or unexpected console errors/warnings").toEqual([]);
});

async function ready(page: Page, name: string) {
  await expect(page.locator(".scene-name")).toHaveText(`/ ${name}`);
  await expect(page.locator(".scene-surface")).toHaveAttribute("data-phase", "ready");
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator(".scene-surface")).toHaveClass(/scene-visible/);
}

async function lion(page: Page) {
  await ready(page, "Cave lion");
  await expect(page.locator("[data-discovery-progress]")).toHaveText("0 / 3 found");
  await expect(page.locator("[data-hotspot-button]")).toHaveCount(3);
}

async function custom(page: Page, name: string) {
  await ready(page, name);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("[data-hotspot-label], [data-hotspot-button], [data-discovery-progress]")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveAttribute("aria-label", new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

async function choose(page: Page, name: string) {
  const pending = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Open scan", exact: true }).click();
  await (await pending).setFiles(upload(name));
}

async function drop(page: Page, name: string) {
  // Browser-dispatched file drag/drop, not a claim about a physical OS drag gesture.
  await page.evaluate(({ name, data }) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([Uint8Array.from(atob(data), c => c.charCodeAt(0))], name));
    window.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }));
    window.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
  }, { name, data: sample.toString("base64") });
}

async function screenshot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}.png`), animations: "disabled" });
}

for (const index of [0, 1, 2]) {
  test(`file chooser clears selected lion detail ${index}`, async ({ page }, info) => {
    await page.goto("/");
    await lion(page);
    await expect(page).toHaveTitle("Splat Walk | A captured world, up close");
    await page.locator(`[data-hotspot-button="${index}"]`).click();
    await expect(page.getByRole("dialog")).toHaveAttribute("data-hotspot-detail", `${index}`);
    await choose(page, `detail-${index}.spz`);
    await custom(page, `detail-${index}.spz`);
    if (index === 0) await screenshot(page, info, "selected-detail-switch-fixed");
    await page.getByRole("button", { name: "Back to the lion", exact: true }).click();
    await lion(page);
    await page.locator('[data-hotspot-button="0"]').click();
    await expect(page.getByRole("button", { name: "Close detail" })).toBeFocused();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveAttribute("data-hotspot-detail", "1");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator("[data-discovery-progress]")).toHaveText("2 / 3 found");
  });
}

test("drop clears an open detail and a focused hotspot", async ({ page }, info) => {
  await page.goto("/");
  await lion(page);
  await page.locator('[data-hotspot-button="0"]').click();
  await drop(page, "dropped-detail.spz");
  await custom(page, "dropped-detail.spz");
  await expect(page.locator(".drop-overlay")).toHaveCount(0);
  await screenshot(page, info, "drop-detail-switch-fixed");
  await page.getByRole("button", { name: "Back to the lion", exact: true }).click();
  await lion(page);
  await page.locator('[data-hotspot-button="2"]').focus();
  await drop(page, "dropped-focus.spz");
  await custom(page, "dropped-focus.spz");
});

test("an unreadable file opened from a detail has recovery UI, not a page crash", async ({ page }) => {
  await page.goto("/");
  await lion(page);
  await page.locator('[data-hotspot-button="1"]').click();
  await page.locator('input[type="file"]').setInputFiles({ name: "bad.spz", mimeType: "application/octet-stream", buffer: Buffer.from("not SPZ") });
  await expect(page.locator(".scene-surface")).toHaveAttribute("data-phase", "error");
  await expect(page.locator(".loading-card")).toContainText("not a readable SPZ capture");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Reload capture", exact: true }).click();
  await expect(page.locator(".loading-card")).toContainText("not a readable SPZ capture");
  await page.getByRole("button", { name: "Back to the lion", exact: true }).click();
  await lion(page);
});

for (const malformed of ["%GG.spz", "%E0%A4.spz", "%FF.spz"]) {
  test(`malformed URL filename ${malformed} stays recoverable`, async ({ page }, info) => {
    await page.route("**/scenes/**", route => route.fulfill({ status: 404, body: "Missing test scan" }));
    await page.goto(`/?scene=${encodeURIComponent(`/scenes/${malformed}`)}`);
    await expect(page.locator(".scene-surface")).toHaveAttribute("data-phase", "error");
    await expect(page.locator(".scene-name")).toHaveText(`/ ${malformed}`);
    await expect(page.locator(".loading-card")).toContainText("HTTP 404");
    await expect(page.getByRole("button", { name: "Reload capture", exact: true })).toBeVisible();
    if (malformed === "%GG.spz") await screenshot(page, info, "malformed-url-recovery-fixed");
    await page.unroute("**/scenes/**");
    await page.getByRole("button", { name: "Back to the lion", exact: true }).click();
    await lion(page);
  });
}

test("valid encoded names and same-origin scene links still load", async ({ page }) => {
  const name = "München 100%.spz";
  await page.route("**/scenes/**", route => route.fulfill({ status: 200, contentType: "application/octet-stream", body: sample }));
  await page.goto(`/?scene=${encodeURIComponent(`/scenes/${encodeURIComponent(name)}`)}`);
  await custom(page, name);
  await expect(page.locator(".scene-name")).toHaveAttribute("title", name);
});

test("rapid file replacements keep only the newest scene", async ({ page }) => {
  await page.goto("/");
  await lion(page);
  await page.locator('[data-hotspot-button="2"]').click();
  await drop(page, "first.spz");
  await drop(page, "newest.spz");
  await custom(page, "newest.spz");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(page.getByRole("button", { name: "Overview", exact: true })).toBeEnabled();
  await custom(page, "newest.spz");
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
  { width: 844, height: 390 },
]) {
  test.describe(`${viewport.width}x${viewport.height} layout`, () => {
    test.use({ viewport, hasTouch: viewport.width < 1000, isMobile: viewport.width < 1000 });
    test("long filenames leave controls visible and usable", async ({ page }, info) => {
      await page.goto("/");
      await lion(page);
      await screenshot(page, info, "lion-overview");
      const names = [
        "2026-09-27_Living-Room_Scaniverse_Ultra_Quality_Cleaned_Export.spz",
        `${"capture".repeat(30)}.spz`,
      ];
      for (const name of names) {
        await choose(page, name);
        await custom(page, name);
        const layout = await page.evaluate(() => {
          const rect = (selector: string) => document.querySelector(selector)!.getBoundingClientRect().toJSON();
          return { width: innerWidth, height: innerHeight, title: rect(".scene-title-panel"), actions: rect(".scene-actions"), footer: rect(".attribution"), nav: rect(".detail-nav") };
        });
        expect(layout.title.right).toBeLessThanOrEqual(layout.actions.left);
        for (const [label, rect] of Object.entries({ actions: layout.actions, footer: layout.footer })) {
          expect(rect.left, `${label} left`).toBeGreaterThanOrEqual(0);
          expect(rect.right, `${label} right`).toBeLessThanOrEqual(layout.width);
          expect(rect.top, `${label} top`).toBeGreaterThanOrEqual(0);
          expect(rect.bottom, `${label} bottom`).toBeLessThanOrEqual(layout.height);
        }
        expect(layout.footer.left >= layout.nav.right || layout.footer.top >= layout.nav.bottom, "Footer must not cover the navigation").toBe(true);
        await page.getByRole("button", { name: "Overview", exact: true }).click();
        await expect(page.getByRole("button", { name: "Overview", exact: true })).toBeEnabled();
        await expect(page.locator(".scene-name")).toHaveAttribute("title", name);
      }
      await screenshot(page, info, "long-name-controls-fixed");
      await page.getByRole("button", { name: "Back to the lion", exact: true }).click();
      await lion(page);
    });
  });
}
