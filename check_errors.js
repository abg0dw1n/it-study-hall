import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('Console:', msg.text()));
  page.on('pageerror', err => console.log('Error:', err.toString()));
  await page.goto('https://it-study-hall.vercel.app/');
  await page.waitForLoadState('networkidle');
  await browser.close();
})();
