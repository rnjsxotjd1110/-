// 사용: node tools/prof.js "<query>" [초] — 함수별 CPU 시간 상위
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const q = process.argv[2] || ''; const secs = +(process.argv[3] || 5);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + q);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  await page.waitForTimeout(1000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
  await cdp.send('Profiler.start'); await page.waitForTimeout(secs * 1000);
  const { profile } = await cdp.send('Profiler.stop');
  const self = {}; const dt = {}; const ids = {};
  profile.nodes.forEach(n => ids[n.id] = n);
  const tot = profile.samples.length;
  profile.samples.forEach(id => { const n = ids[id]; const k = n.callFrame.functionName + ' ' + path.basename(n.callFrame.url) + ':' + n.callFrame.lineNumber; self[k] = (self[k] || 0) + 1; });
  Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 18).forEach(([k, v]) => console.log((v / tot * 100).toFixed(1) + '%', k));
  await browser.close();
})();
