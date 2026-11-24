// 상자 열기 연출 캡처: node tools/boxshot.js out.png [등급 0~3] [대기ms]
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[2], rar = +(process.argv[3] || 3), wait = +(process.argv[4] || 1600);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html') + '?demo=mid');
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await p.evaluate((rar) => { const A = G.app, s = A.s; s.box = 2; const r = G.core.openBox(s); const sp = G.SPDICE.filter(x => x.rar === rar)[0]; r.id = sp.id; r.rar = rar; r.isNew = true; r.lv = 1; s.coll[sp.id] = 1; A.boxRes = r; A.boxT = 0; A.overlay = 'box'; A.tab = 'dice'; }, rar);
  await p.waitForTimeout(wait);
  await p.screenshot({ path: out }); await b.close();
})();
