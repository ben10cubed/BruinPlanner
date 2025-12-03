// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 30000,

  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },

  webServer: [
    {
      command: 'node server/server.js',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
