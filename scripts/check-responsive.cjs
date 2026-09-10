/* Find elements that overflow the viewport at mobile widths.
 *
 * The page sets `overflow-x: hidden` on <body> and `overflow-x: clip` on
 * <main> (needed so the reveal animations' horizontal offset can't widen the
 * page). A side effect is that a genuinely over-wide section does NOT produce
 * a horizontal scrollbar — it is silently cropped, and looks fine in a quick
 * glance while half of it is off-screen on a phone.
 *
 * This walks the rendered page and reports any element whose box extends past
 * the viewport, which is the only reliable way to catch that.
 *
 * Usage:
 *   python3 -m http.server 8899 &
 *   node scripts/check-responsive.cjs [http://127.0.0.1:8899]
 *
 * Exits non-zero if anything overflows.
 */
const PLAYWRIGHT = '/opt/node22/lib/node_modules/playwright';
const { chromium } = require(PLAYWRIGHT);

const BASE = process.argv[2] || 'http://127.0.0.1:8899';
const WIDTHS = [320, 360, 390, 430, 600, 768, 900, 1024];
const ROUTES = ['/', '/support', '/terms', '/privacy'];

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  let failures = 0;

  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    for (const route of ROUTES) {
      await page.goto(BASE + route, { waitUntil: 'load' });
      // Neutralise the reveal animations so nothing is measured mid-transform.
      await page.addStyleTag({
        content: 'html{scroll-behavior:auto!important} .js .io{opacity:1!important;transform:none!important}',
      });
      await page.waitForTimeout(250);

      const offenders = await page.evaluate((vw) => {
        const out = [];
        document.querySelectorAll('.page.active *, footer *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) return;
          const over = Math.round(Math.max(r.right - vw, -r.left));
          if (over <= 1) return;
          const cls = typeof el.className === 'string' && el.className.trim()
            ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
            : '';
          out.push({ sel: el.tagName.toLowerCase() + cls, width: Math.round(r.width), over });
        });
        // One row per selector is enough to locate the problem.
        const seen = new Set();
        return out.filter((o) => !seen.has(o.sel) && seen.add(o.sel)).slice(0, 10);
      }, width);

      if (offenders.length) {
        failures += offenders.length;
        console.log(`\n✗ ${width}px ${route}`);
        offenders.forEach((o) => console.log(`    ${o.sel} — ${o.width}px wide, ${o.over}px past the edge`));
      }
    }
    await page.close();
  }

  await browser.close();
  if (failures) {
    console.log(`\n${failures} overflowing element(s).`);
    console.log('Usually a grid/flex item with the default min-width:auto refusing to shrink.');
    process.exit(1);
  }
  console.log(`No overflow at ${WIDTHS.join(', ')}px across ${ROUTES.length} routes.`);
})();
