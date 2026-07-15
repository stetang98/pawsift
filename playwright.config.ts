import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:34113";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  webServer: {
    command:
      "npm run build && npm run start -- --hostname 127.0.0.1 --port 34113",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: false
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
