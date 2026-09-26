const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './jalali_shamsi_datepicker/tests/browser',
  workers: 1,
  projects: [
    { name: 'Tehran', use: { timezoneId: 'Asia/Tehran' } },
    { name: 'New_York', use: { timezoneId: 'America/New_York' } },
  ],
  use: { channel: process.env.PLAYWRIGHT_CHANNEL || undefined, headless: true, viewport: { width: 1000, height: 800 }, timezoneId: 'Asia/Tehran' },
});
