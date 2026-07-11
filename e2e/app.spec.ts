import { expect, test } from "@bgotink/playwright-coverage";

test.describe("Unified Application Flow", () => {
  test("should complete the entire application lifecycle in a single session", async ({ page }) => {
    // Log console messages and errors for easier diagnostics
    page.on("console", msg => console.log(`[Browser Console] [${msg.type()}]: ${msg.text()}`));
    page.on("pageerror", err => console.error(`[Browser PageError]: ${err.stack || err.message}`));

    // 1. Visit homepage and wait for initial DB sync to complete
    await page.goto("/");
    await page.locator("header").waitFor({ state: "visible" });
    await expect(page.locator("text=Sync complete!")).toBeVisible({ timeout: 45000 });

    // 2. Responsive brand layout check
    const desktopBrand = page.locator("text=HG Radheshyamdas");
    const mobileMenu = page.locator("header button[aria-label='Open Menu'], header button:has(.lucide-menu)");
    const isMobile = await mobileMenu.first().isVisible();

    if (isMobile) {
      await expect(mobileMenu.first()).toBeVisible();
    } else {
      await expect(desktopBrand.first()).toBeVisible();
    }

    // 3. Authentication Dialog check
    if (isMobile) {
      await mobileMenu.first().click();
      const loginBtn = page.locator("button:has-text('Login / Register')").filter({ visible: true });
      await expect(loginBtn).toBeVisible();
      await loginBtn.click();
    } else {
      const loginBtn = page.locator("header button:has-text('Login')");
      await expect(loginBtn).toBeVisible();
      await loginBtn.click();
    }

    const dialogTitle = page.locator("[role='dialog'] h2");
    await expect(dialogTitle).toContainText("Welcome Back");

    const signUpSwitch = page.locator("button:has-text('Sign Up')");
    await expect(signUpSwitch).toBeVisible();
    await signUpSwitch.click();
    await expect(dialogTitle).toContainText("Create Account");

    const logInSwitch = page.locator("button:has-text('Log In')");
    await expect(logInSwitch).toBeVisible();
    await logInSwitch.click();
    await expect(dialogTitle).toContainText("Welcome Back");

    const emailInput = page.locator("#auth-email");
    const passwordInput = page.locator("#auth-password");
    await emailInput.fill("testuser@example.com");
    await passwordInput.fill("password123");
    await expect(emailInput).toHaveValue("testuser@example.com");
    await expect(passwordInput).toHaveValue("password123");

    const closeBtn = page.locator("[role='dialog'] button:has(.lucide-x), [role='dialog'] [aria-label='Close']");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(page.locator("[role='dialog']")).not.toBeVisible();

    // 5. Footer navigation links
    const aboutLink = page.locator("footer a[aria-label='About']");
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page).toHaveURL("/about");

    const contactLink = page.locator("footer a[aria-label='Contact us']");
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL("/contact-us");

    // 6. Audio cache settings updates (Navigate via client-side Settings link click)
    const settingsLink = page.locator("a[href='/settings']").filter({ visible: true }).first();
    await expect(settingsLink).toBeVisible();
    await settingsLink.click();
    await expect(page).toHaveURL("/settings");

    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1000); // Wait for toaster mount

    await expect(page.locator("h1:has-text('Settings')")).toBeVisible();
    const select = page.locator("select");
    await expect(select).toBeVisible();

    await select.selectOption("500");
    await select.selectOption("1024");
    await expect(select).toHaveValue("1024");
    await expect(
      page.locator("text=Max cache size set to 1024 MB"),
    ).toBeVisible();

    // 7. Themes, Compact Toggles, and State Persistence
    // Navigate back to Home using Brand Link in header
    const brandLink = page.locator("header a[href='/']").first();
    await expect(brandLink).toBeVisible();
    await brandLink.click();
    await expect(page).toHaveURL("/");

    // Prepare Theme Selector
    const mobileMenuBtn = page.locator(
      "header button[aria-label='Open Menu'], header button:has(.lucide-menu)",
    );
    const isMobileNow = await mobileMenuBtn.isVisible();

    if (isMobileNow) {
      await mobileMenuBtn.click();
      const themeHeader = page.locator("h3:has-text('Theme Settings')");
      await expect(themeHeader).toBeVisible();
    } else {
      const themeSelector = page.locator("header .group\\/theme");
      await expect(themeSelector).toBeVisible();
      await themeSelector.hover();
      await page.waitForTimeout(300); // Wait for transition animation
    }

    const cleanButton = page.locator("button:has-text('clean')").filter({ visible: true });
    const darkButton = page.locator("button:has-text('dark')").filter({ visible: true });
    const monkButton = page.locator("button:has-text('monk')").filter({ visible: true });
    const compactButton = page.locator("button:has-text('compact')").filter({ visible: true });

    // Swapping Themes
    await darkButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await cleanButton.click();
    await expect(page.locator("html")).toHaveClass(/clean/);

    await monkButton.click();
    await expect(page.locator("html")).toHaveClass(/monk/);

    // Compact Mode Toggle
    await compactButton.click();
    await expect(page.locator("html")).toHaveClass(/compact/);
    await compactButton.click();
    await expect(page.locator("html")).not.toHaveClass(/compact/);

    // Persistence Reload
    await darkButton.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // 8. Mobile Drawer Toggle on small viewports
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload(); // Reload to refresh layout state for mobile size
    await expect(mobileMenuBtn.first()).toBeVisible();
    await mobileMenuBtn.first().click();

    const drawerAboutLink = page.locator(
      "[role='dialog'] a[aria-label='About'], div[class*='drawer'] a[aria-label='About']",
    ).filter({ visible: true });
    await expect(drawerAboutLink).toBeVisible();
  });
});
