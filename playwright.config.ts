import { defineConfig } from "@playwright/test";
const aiFixture = process.env.TEST_AI_FIXTURE === "true";
const baseURL = aiFixture ? "http://127.0.0.1:3001" : "http://127.0.0.1:3000";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      executablePath: process.env.CHROME_PATH,
      args: ["--no-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: aiFixture ? "node --import tsx tests/support/ai-browser-server.ts" : "npm run dev -- --hostname 127.0.0.1",
    url: baseURL,
    reuseExistingServer: !aiFixture && !process.env.CI,
  },
});
