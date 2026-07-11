import { defineCoverageReporterConfig } from "@bgotink/playwright-coverage";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: true,
  // workers: 1,

  forbidOnly: false,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },

  reporter: [
    ["line"],
    [
      "@bgotink/playwright-coverage",
      defineCoverageReporterConfig({
        resultDir: "results/e2e-coverage",
        reports: [
          ["text-summary"],
          ["html", { subdir: "html" }],
          ["lcovonly", { file: "coverage.lcov" }],
        ],
      }),
    ],
  ],
  use: {
    baseURL: "http://localhost:3000",
    headless: false,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    actionTimeout: 15_000,

    // Uncomment while debugging to slow interactions
    // launchOptions: {
    //   slowMo: 100,
    // },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
      },
    },
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 12"],
      },
    },
  ],

  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
