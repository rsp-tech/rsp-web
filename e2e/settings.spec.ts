import { expect, test } from "@bgotink/playwright-coverage";

test.describe("Settings & Audio Cache Spec", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    // Clear localStorage to reset any previously persisted settings, ensuring test starts with the default 200MB limit
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000); // Wait for dynamic toaster to mount
  });

  test("should load settings and allow changing cache limit", async ({ page }) => {
    // 1. Assert layout details
    await expect(page.locator("h1:has-text('Settings')")).toBeVisible();
    await expect(page.locator("h3:has-text('Cache Config')")).toBeVisible();

    // 2. Change select value
    const select = page.locator("select");
    await expect(select).toBeVisible();
    
    // Choose 500 first to guarantee a state transition, then choose 1024
    await select.selectOption("500");
    await select.selectOption("1024");
    await expect(select).toHaveValue("1024");

    // 3. Check toast notification
    await expect(
      page.locator("text=Max cache size set to 1024 MB"),
    ).toBeVisible();
  });
});
