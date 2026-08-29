import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "happy-dom",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test_key",
      SUPABASE_SECRET_KEY: "test_secret_key",
      BACKUP_TOKEN: "test_backup_token",
      SYNC_ENDPOINT: "https://test.api/sync",
      CSV_ENDPOINT: "https://test.api/csv",
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      clean: false,
      cleanOnRerun: false,
      reporter: ["text", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "src/constants.ts",
        "src/types.ts",
        "src/database.types.ts",
        "src/components/ui/**",
        "src/app/layout.tsx",
      ],
    },
  },
});
