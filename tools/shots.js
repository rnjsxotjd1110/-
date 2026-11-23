// 여러 화면을 한 번에 캡처: node tools/shots.js outdir scale "name|query|waitms|clicks" ...
// clicks: x,y;x,y (내부 좌표)
const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const out = process.argv[2]; const scale = +process.argv[3];
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  for (const spec of process.argv.slice(4)) {
    const [name, q, wait, clicks] = spec.split('|');
    const page = await browser.newPage({ viewport: { width: 640 * scale, height: 360 * scale } });
    page.on('pageerror', e => console.log(name, 'pageerror:', e.message));
    page.on('console', m => { if (m.type() === 'error') console.log(name, 'console:', m.text()); });
    await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + (q || ''));
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    if (clicks) for (const c of clicks.split(';')) {
      if (c.startsWith('w')) { await page.waitForTimeout(+c.slice(1)); continue; }
      if (c.startsWith('k')) { await page.keyboard.press(c.slice(1)); continue; }
      if (c.startsWith('m')) { const [x, y] = c.slice(1).split(',').map(Number); await page.mouse.move(x * scale + scale / 2, y * scale + scale / 2); continue; }
      const [x, y] = c.split(',').map(Number);
      await page.mouse.click(x * scale + scale / 2, y * scale + scale / 2); await page.waitForTimeout(120);
    }
    await page.waitForTimeout(+(wait || 500));
    await page.evaluate(() => { window.__logNext = true; });
    await page.waitForFunction(() => window.__freeze === true, null, { timeout: 5000 });
    const tl = await page.evaluate(() => window.__lastLog);
    await page.screenshot({ path: path.join(out, name + '.png') });
    fs.writeFileSync(path.join(out, name + '.text.json'), JSON.stringify(tl || []));
    await page.close();
  }
  await browser.close();
})();
