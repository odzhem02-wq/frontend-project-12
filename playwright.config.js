import { defineConfig } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'make start',
    port: 5001,
    reuseExistingServer: !process.env.CI,
  },
});
