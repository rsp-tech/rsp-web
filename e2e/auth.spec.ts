import { expect, test } from "@bgotink/playwright-coverage";

test.describe("Authentication Spec", () => {
  test("should open, toggle, input, and close auth dialog", async ({ page }) => {
    await page.goto("/");

    // 1. Open auth modal (handles mobile drawer vs desktop header)
    const mobileMenuBtn = page.locator("header button[aria-label='Open Menu'], header button:has(.lucide-menu)");
    const isMobile = await mobileMenuBtn.isVisible();

    if (isMobile) {
      await mobileMenuBtn.click();
      const loginBtn = page.locator("button:has-text('Login / Register')");
      await expect(loginBtn).toBeVisible();
      await loginBtn.click();
    } else {
      const loginBtn = page.locator("header button:has-text('Login')");
      await expect(loginBtn).toBeVisible();
      await loginBtn.click();
    }

    // 2. Verify dialog details & Toggle signup/login
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

    // 3. Input email and password
    const emailInput = page.locator("#auth-email");
    const passwordInput = page.locator("#auth-password");
    await emailInput.fill("testuser@example.com");
    await passwordInput.fill("password123");
    await expect(emailInput).toHaveValue("testuser@example.com");
    await expect(passwordInput).toHaveValue("password123");

    // 4. Close the modal
    const closeBtn = page.locator("[role='dialog'] button:has(.lucide-x), [role='dialog'] [aria-label='Close']");
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify dialog is closed
    await expect(page.locator("[role='dialog']")).not.toBeVisible();
  });
});
