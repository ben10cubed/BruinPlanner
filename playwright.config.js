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
      cwd: './',               // backend starts in root (good)
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev',
      cwd: './client',         // frontend must run inside client directory
      port: 5173,
      reuseExistingServer: !process.env.CI,
    }
  ],
});
