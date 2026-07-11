import { expect, test } from "@bgotink/playwright-coverage";

test.describe("Navigation & Layout Spec", () => {
  test("should render header, footer, and navigate successfully", async ({ page }) => {
    await page.goto("/");

    // 1. Assert header and footer are present
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
    await expect(
      page.locator("text=All rights reserved."),
    ).toBeVisible();

    // Assert branding responsive check
    const desktopBrand = page.locator("text=HG Radheshyamdas");
    const mobileMenu = page.locator("header button[aria-label='Open Menu'], header button:has(.lucide-menu)");
    
    const isDesktop = await desktopBrand.first().isVisible();
    if (isDesktop) {
      await expect(desktopBrand.first()).toBeVisible();
    } else {
      await expect(mobileMenu.first()).toBeVisible();
    }

    // 2. Navigate to 'About'
    const aboutLink = page.locator("footer a[aria-label='About']");
    await expect(aboutLink).toBeVisible();
    await aboutLink.click();
    await expect(page).toHaveURL("/about");

    // 3. Navigate to 'Contact us'
    const contactLink = page.locator("footer a[aria-label='Contact us']");
    await expect(contactLink).toBeVisible();
    await contactLink.click();
    await expect(page).toHaveURL("/contact-us");
  });

  test("should toggle mobile drawer menu on small screens", async ({ page }) => {
    // Set screen size to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Open mobile drawer
    const menuButton = page.locator(
      "header button[aria-label='Open Menu'], header button:has(.lucide-menu)",
    );
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    // Assert that the drawer menu containing navigation links becomes visible
    const drawerAboutLink = page.locator(
      "[role='dialog'] a[aria-label='About'], div[class*='drawer'] a[aria-label='About']",
    ).filter({ visible: true });
    await expect(drawerAboutLink).toBeVisible();
  });
});
