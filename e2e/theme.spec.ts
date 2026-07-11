import { expect, test } from "@bgotink/playwright-coverage";

test.describe("Theme & Styling Spec", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  const prepareThemeSelector = async (page: any) => {
    const mobileMenuBtn = page.locator(
      "header button[aria-label='Open Menu'], header button:has(.lucide-menu)",
    );
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click();
      // Wait for theme settings heading in drawer
      const themeHeader = page.locator("h3:has-text('Theme Settings')");
      await expect(themeHeader).toBeVisible();
    } else {
      const themeSelector = page.locator("header .group\\/theme");
      await expect(themeSelector).toBeVisible();
      await themeSelector.hover();
      await page.waitForTimeout(300); // Wait for transition animation to complete
    }
  };

  test("should swap themes and apply correct class attributes to the html tag", async ({
    page,
  }) => {
    await prepareThemeSelector(page);

    const cleanButton = page
      .locator("button:has-text('clean')")
      .filter({ visible: true });
    const darkButton = page
      .locator("button:has-text('dark')")
      .filter({ visible: true });
    const monkButton = page
      .locator("button:has-text('monk')")
      .filter({ visible: true });

    // Test Dark Theme
    await darkButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Test Clean Theme
    await cleanButton.click();
    await expect(page.locator("html")).toHaveClass(/clean/);

    // Test Monk Theme
    await monkButton.click();
    await expect(page.locator("html")).toHaveClass(/monk/);
  });

  test("should toggle compact mode and verify class is applied to html tag", async ({
    page,
  }) => {
    await prepareThemeSelector(page);

    const compactButton = page
      .locator("button:has-text('compact')")
      .filter({ visible: true });
    await expect(compactButton).toBeVisible();

    // Toggle compact mode on
    await compactButton.click();
    await expect(page.locator("html")).toHaveClass(/compact/);

    // Toggle compact mode off
    await compactButton.click();
    await expect(page.locator("html")).not.toHaveClass(/compact/);
  });

  test("should persist theme preference across page reloads", async ({
    page,
  }) => {
    await prepareThemeSelector(page);

    const darkButton = page
      .locator("button:has-text('dark')")
      .filter({ visible: true });
    await darkButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Reload the page
    await page.reload();

    // Verify dark class persists on reload
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
