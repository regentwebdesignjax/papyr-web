/* Render scripts/og-template.html to assets/og-image.png at 1200x630.
 *
 * Uses a real browser so the card is set in the actual brand fonts.
 * Run against a locally served copy of the repo:
 *
 *   python3 -m http.server 8899 &
 *   node scripts/gen-og.cjs http://127.0.0.1:8899
 */
const path = require('path');

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const OUT = path.join(__dirname, '..', 'assets', 'og-image.png');

(async () => {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
  }

  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}
  );
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(`${BASE}/scripts/og-template.html`, { waitUntil: 'networkidle' });
  await page.evaluateHandle('document.fonts.ready');
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT });
  await browser.close();
  console.log('wrote', OUT);
})();
