// 사용: node tools/shot.js "<query>" out.png [scale] [waitms] [script.js]
// script.js: async (page) => {...} 를 내보내면 캡처 전에 실행
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const q = process.argv[2] || ''; const out = process.argv[3] || 'shot.png';
  const scale = +(process.argv[4] || 1); const wait = +(process.argv[5] || 300);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 640 * scale, height: 360 * scale }, deviceScaleFactor: 1 });
  page.on('console', m => { if (m.type() === 'error' || m.type()==='warning') console.log('console:', m.text()); });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html') + q;
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  if (process.argv[6]) { const fn = require(path.resolve(process.argv[6])); await fn(page); }
  await page.waitForTimeout(wait);
  await page.evaluate(() => { window.__logNext = true; });
  await page.waitForFunction(() => window.__freeze === true, null, { timeout: 5000 });
  const tl = await page.evaluate(() => window.__lastLog);
  await page.screenshot({ path: out });
  fs.writeFileSync(out.replace(/\.png$/, '.text.json'), JSON.stringify(tl || []));
  await page.evaluate(() => { window.__freeze = false; });
  await browser.close();
})();
