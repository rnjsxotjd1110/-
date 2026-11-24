// 상자 열기 연출 캡처: node tools/boxshot.js out.png [상자 수] [대기ms]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2], n = +(process.argv[3] || 1), wait = +(process.argv[4] || 1600);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?demo=mid');
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await p.evaluate((n) => { const A = G.app, s = A.s; s.novas = 2; s.box = n; A.tab = 'dice'; G.openBoxesUi(s, n); }, n);
  await p.waitForTimeout(wait);
  await p.screenshot({ path: out }); await b.close();
})();
