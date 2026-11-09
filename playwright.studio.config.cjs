const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/studio',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4388',
    browserName: 'chromium',
    viewport: { width: 1600, height: 1000 },
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'node studio/server.mjs --root=OfflineStyleStudio/public --data-dir=.studio-test-data --port=4388',
    url: 'http://127.0.0.1:4388/health',
    reuseExistingServer: false,
  },
});
